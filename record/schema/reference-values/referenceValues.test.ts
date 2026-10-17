import { describe, it, expect } from 'vitest';
import {
  referenceValuesSchema,
  referenceValueElementSchema,
  referenceValueConstructSchema,
  referenceValueBasisSchema,
  referenceValueEvidenceBasisSchema,
  referenceValueStatusSchema,
  referenceValueAbsenceReasonSchema,
} from './referenceValues.js';
import { isRegisteredConstruct } from './constructRegistry.js';

// A minimal valid source: authority + retrieved_at + one locator.
const minimalSource = () => ({
  authority: 'FNB / National Academies',
  manifest_source: 'nih_ods',
  manifest_document_id: 'nih_ods_vitamin_d',
  citation: 'ODS Vitamin D fact sheet, Table 2',
  retrieved_at: '2026-06-17',
});

// A minimal valid `present` element, cloned and mutated per test.
const presentElement = () => ({
  construct: 'rda' as const,
  stated_values: [{ amount: 15, unit: 'mcg', basis: 'per_day' as const }],
  evidence_basis: 'human' as const,
  source: minimalSource(),
  verbatim: 'The RDA for adults is 15 mcg (600 IU).',
  status: 'present' as const,
});

// A minimal valid `documented_absence` element.
const absenceElement = () => ({
  construct: 'ul' as const,
  evidence_basis: 'unspecified' as const,
  source: minimalSource(),
  verbatim: 'The FNB has not established a UL for this nutrient.',
  status: 'documented_absence' as const,
  absence_reason: 'not_established_by_authority' as const,
});

describe('referenceValueConstructSchema (open source-named field)', () => {
  // The construct field is no longer a closed enum: the shape gate accepts
  // any lowercase snake_case string, including ones no record uses yet.
  for (const c of [
    'rda',
    'ai',
    'ul',
    'ear',
    'noael',
    'source_stated_upper_bound',
    'pri',
    'ar',
  ]) {
    it(`accepts well-formed construct ${c}`, () => {
      expect(referenceValueConstructSchema.parse(c)).toBe(c);
    });
  }
  it('accepts a novel well-formed construct the corpus has never used', () => {
    expect(referenceValueConstructSchema.parse('population_reference_intake')).toBe(
      'population_reference_intake',
    );
  });
  for (const bad of ['', 'RDA', 'source stated', 'has-hyphen', '_leading', 'trailing_', 'double__underscore']) {
    it(`rejects malformed construct ${JSON.stringify(bad)}`, () => {
      expect(() => referenceValueConstructSchema.parse(bad)).toThrow();
    });
  }
});

describe('construct registry (per-authority enforcement)', () => {
  const FNB =
    'Food and Nutrition Board (FNB), National Academies of Sciences, Engineering, and Medicine';
  const EFSA = 'European Food Safety Authority (EFSA), NDA Panel';

  it('accepts a registered (authority, construct) pair', () => {
    expect(isRegisteredConstruct(FNB, 'rda')).toBe(true);
    expect(isRegisteredConstruct(EFSA, 'ul')).toBe(true);
  });
  it('rejects a construct not registered for that authority', () => {
    // Well-formed string, but FNB has no `pri` construct registered.
    expect(isRegisteredConstruct(FNB, 'pri')).toBe(false);
  });
  it('rejects a construct under an unregistered authority', () => {
    expect(isRegisteredConstruct('Some Unknown Authority', 'rda')).toBe(false);
  });
});

describe('referenceValueBasisSchema', () => {
  for (const b of ['per_day', 'per_kg_bw_per_day', 'per_dose', 'per_serving']) {
    it(`accepts basis ${b}`, () => {
      expect(referenceValueBasisSchema.parse(b)).toBe(b);
    });
  }
  it('rejects an unknown basis', () => {
    expect(() => referenceValueBasisSchema.parse('per_week')).toThrow();
  });
});

describe('referenceValueEvidenceBasisSchema', () => {
  for (const e of ['human', 'animal', 'in_vitro', 'unspecified']) {
    it(`accepts evidence_basis ${e}`, () => {
      expect(referenceValueEvidenceBasisSchema.parse(e)).toBe(e);
    });
  }
  it('rejects an unknown evidence_basis', () => {
    expect(() => referenceValueEvidenceBasisSchema.parse('clinical')).toThrow();
  });
});

describe('referenceValueStatusSchema', () => {
  for (const s of ['present', 'documented_absence']) {
    it(`accepts status ${s}`, () => {
      expect(referenceValueStatusSchema.parse(s)).toBe(s);
    });
  }
  it('rejects an unknown status', () => {
    expect(() => referenceValueStatusSchema.parse('absent')).toThrow();
  });
});

describe('referenceValueAbsenceReasonSchema', () => {
  for (const r of ['not_established_by_authority', 'insufficient_data_in_source']) {
    it(`accepts absence_reason ${r}`, () => {
      expect(referenceValueAbsenceReasonSchema.parse(r)).toBe(r);
    });
  }
  it('rejects an unknown absence_reason', () => {
    expect(() => referenceValueAbsenceReasonSchema.parse('not_found')).toThrow();
  });
});

describe('referenceValueElementSchema — valid shapes', () => {
  it('accepts a minimal present element', () => {
    expect(() => referenceValueElementSchema.parse(presentElement())).not.toThrow();
  });
  it('accepts a minimal documented_absence element', () => {
    expect(() => referenceValueElementSchema.parse(absenceElement())).not.toThrow();
  });
  it('accepts a scalar amount', () => {
    const el = presentElement();
    el.stated_values = [{ amount: 100, unit: 'mcg', basis: 'per_day' }];
    expect(() => referenceValueElementSchema.parse(el)).not.toThrow();
  });
  it('accepts a [low, high] range amount', () => {
    const el = presentElement();
    el.stated_values = [
      { amount: [15, 20] as unknown as number, unit: 'mcg', basis: 'per_day' },
    ];
    expect(() => referenceValueElementSchema.parse(el)).not.toThrow();
  });
  it('accepts optional qualifier, population, scope', () => {
    const el = {
      ...presentElement(),
      qualifier: 'at least',
      population: {
        label: 'adults 19-70 years',
        life_stage: 'adult',
        sex: 'all',
        condition: null,
      },
      scope: { form: 'supplemental_only' },
    };
    expect(() => referenceValueElementSchema.parse(el)).not.toThrow();
  });
  it('accepts an animal NOAEL with species and full source locators', () => {
    const el = {
      construct: 'noael' as const,
      stated_values: [{ amount: 10, unit: 'mg', basis: 'per_kg_bw_per_day' as const }],
      population: { species: 'rat' },
      evidence_basis: 'animal' as const,
      source: {
        authority: 'EFSA',
        document: 'NDA Panel opinion',
        manifest_source: 'efsa',
        manifest_document_id: 'efsa_2023_vitamin_d_ul',
        citation: '10.2903/j.efsa.2023.8145',
        stated_date: '2023-08',
        retrieved_at: '2026-06-17',
      },
      verbatim: 'A NOAEL of 10 mg/kg bw per day was identified in rats.',
      status: 'present' as const,
    };
    expect(() => referenceValueElementSchema.parse(el)).not.toThrow();
  });
});

describe('referenceValueElementSchema — required fields', () => {
  it('rejects a missing construct', () => {
    const { construct, ...rest } = presentElement();
    void construct;
    expect(() => referenceValueElementSchema.parse(rest)).toThrow();
  });
  it('rejects a missing status', () => {
    const { status, ...rest } = presentElement();
    void status;
    expect(() => referenceValueElementSchema.parse(rest)).toThrow();
  });
  it('rejects a missing evidence_basis', () => {
    const { evidence_basis, ...rest } = presentElement();
    void evidence_basis;
    expect(() => referenceValueElementSchema.parse(rest)).toThrow();
  });
  it('rejects a missing source', () => {
    const { source, ...rest } = presentElement();
    void source;
    expect(() => referenceValueElementSchema.parse(rest)).toThrow();
  });
  it('rejects a source without authority', () => {
    const el = { ...presentElement(), source: {} };
    expect(() => referenceValueElementSchema.parse(el)).toThrow();
  });
  it('rejects a source missing retrieved_at', () => {
    const el = {
      ...presentElement(),
      source: { authority: 'FNB', citation: 'Table 2' },
    };
    expect(() => referenceValueElementSchema.parse(el)).toThrow();
  });
  it('rejects a source without manifest_source', () => {
    // The join key is REQUIRED. An optional one is a join key that is
    // silently absent, which is the defect it was added to close: 227
    // reference_values named their document to a human and to nothing else.
    const { manifest_source, ...rest } = minimalSource();
    const el = { ...presentElement(), source: rest };
    expect(() => referenceValueElementSchema.parse(el)).toThrow();
  });
  it('rejects a source without manifest_document_id', () => {
    const { manifest_document_id, ...rest } = minimalSource();
    const el = { ...presentElement(), source: rest };
    expect(() => referenceValueElementSchema.parse(el)).toThrow();
  });
  it('rejects an empty manifest join key rather than treating it as absent', () => {
    const el = {
      ...presentElement(),
      source: { ...minimalSource(), manifest_document_id: '' },
    };
    expect(() => referenceValueElementSchema.parse(el)).toThrow();
  });
  it('keeps the prose locators alongside the join key, not instead of it', () => {
    // The slug names the document to a machine; document and citation carry
    // the authority's own wording and the human locator. Both survive.
    const el = { ...presentElement() };
    const parsed = referenceValueElementSchema.parse(el);
    expect(parsed.source.manifest_source).toBe('nih_ods');
    expect(parsed.source.citation).toBe('ODS Vitamin D fact sheet, Table 2');
    expect(parsed.source.authority).toBe('FNB / National Academies');
  });
  it('rejects a source with neither document nor citation', () => {
    const el = {
      ...presentElement(),
      source: { authority: 'FNB', retrieved_at: '2026-06-17' },
    };
    expect(() => referenceValueElementSchema.parse(el)).toThrow();
  });
  it('accepts a source with authority + retrieved_at + citation only', () => {
    const el = {
      ...presentElement(),
      source: {
        authority: 'EFSA',
        manifest_source: 'efsa',
        manifest_document_id: 'efsa_2023_vitamin_d_ul',
        citation: '10.2903/j.efsa.2023.8145',
        retrieved_at: '2026-06-17',
      },
    };
    expect(() => referenceValueElementSchema.parse(el)).not.toThrow();
  });
  it('accepts a source with authority + retrieved_at + document only', () => {
    const el = {
      ...presentElement(),
      source: {
        authority: 'Health Canada NNHPD',
        document: 'hc_nnhpd_monograph_vitamin_d_1000_2500_iu',
        manifest_source: 'health_canada_nnhpd',
        manifest_document_id: 'hc_nnhpd_vitamin_d_gt1000_le2500_iu',
        retrieved_at: '2026-06-07',
      },
    };
    expect(() => referenceValueElementSchema.parse(el)).not.toThrow();
  });
  it('rejects a missing verbatim on a present element', () => {
    const { verbatim, ...rest } = presentElement();
    void verbatim;
    expect(() => referenceValueElementSchema.parse(rest)).toThrow();
  });
  it('rejects a missing verbatim on a documented_absence element', () => {
    const { verbatim, ...rest } = absenceElement();
    void verbatim;
    expect(() => referenceValueElementSchema.parse(rest)).toThrow();
  });
  it('rejects an empty-string verbatim', () => {
    expect(() =>
      referenceValueElementSchema.parse({ ...presentElement(), verbatim: '' }),
    ).toThrow();
  });
});

describe('referenceValueElementSchema — stated_value shape', () => {
  it('rejects a stated_value missing basis', () => {
    const el = presentElement();
    el.stated_values = [{ amount: 15, unit: 'mcg' } as unknown as never];
    expect(() => referenceValueElementSchema.parse(el)).toThrow();
  });
  it('rejects a stated_value missing unit', () => {
    const el = presentElement();
    el.stated_values = [{ amount: 15, basis: 'per_day' } as unknown as never];
    expect(() => referenceValueElementSchema.parse(el)).toThrow();
  });
  it('rejects a non-numeric amount', () => {
    const el = presentElement();
    el.stated_values = [
      { amount: '15' as unknown as number, unit: 'mcg', basis: 'per_day' },
    ];
    expect(() => referenceValueElementSchema.parse(el)).toThrow();
  });
});

describe('referenceValueElementSchema — strictness (block schema is the key-set)', () => {
  it('rejects an unknown top-level key', () => {
    expect(() =>
      referenceValueElementSchema.parse({ ...presentElement(), notes: 'x' }),
    ).toThrow();
  });
  it('rejects an unknown population sub-key', () => {
    const el = { ...presentElement(), population: { age: '19-70' } };
    expect(() => referenceValueElementSchema.parse(el)).toThrow();
  });
  it('rejects an unknown source sub-key', () => {
    const el = {
      ...presentElement(),
      source: { authority: 'FNB', url: 'http://x' },
    };
    expect(() => referenceValueElementSchema.parse(el)).toThrow();
  });
});

describe('referenceValueElementSchema — present / documented_absence xor (superRefine)', () => {
  it('rejects present with empty stated_values', () => {
    const el = { ...presentElement(), stated_values: [] };
    expect(() => referenceValueElementSchema.parse(el)).toThrow();
  });
  it('rejects present with no stated_values key', () => {
    const { stated_values, ...rest } = presentElement();
    void stated_values;
    expect(() => referenceValueElementSchema.parse(rest)).toThrow();
  });
  it('rejects present carrying an absence_reason', () => {
    const el = { ...presentElement(), absence_reason: 'not_established_by_authority' as const };
    expect(() => referenceValueElementSchema.parse(el)).toThrow();
  });
  it('rejects documented_absence missing absence_reason', () => {
    const { absence_reason, ...rest } = absenceElement();
    void absence_reason;
    expect(() => referenceValueElementSchema.parse(rest)).toThrow();
  });
  it('rejects documented_absence carrying stated_values', () => {
    const el = {
      ...absenceElement(),
      stated_values: [{ amount: 100, unit: 'mcg', basis: 'per_day' as const }],
    };
    expect(() => referenceValueElementSchema.parse(el)).toThrow();
  });
});

describe('referenceValuesSchema — block is an array of elements', () => {
  it('accepts an empty array', () => {
    expect(referenceValuesSchema.parse([])).toEqual([]);
  });
  it('accepts multiple elements (one per construct/population/source)', () => {
    const block = [presentElement(), absenceElement()];
    expect(() => referenceValuesSchema.parse(block)).not.toThrow();
  });
  it('rejects a non-array value', () => {
    expect(() => referenceValuesSchema.parse(presentElement())).toThrow();
  });
  it('rejects an array containing an invalid element', () => {
    expect(() =>
      referenceValuesSchema.parse([presentElement(), { construct: 'rda' }]),
    ).toThrow();
  });
});

describe('referenceValueElementSchema - anchor_id', () => {
  it('accepts a 16-character lowercase hex anchor_id', () => {
    const el = { ...presentElement(), anchor_id: '0123456789abcdef' };
    expect(referenceValueElementSchema.safeParse(el).success).toBe(true);
  });
  it('rejects a 15-character or uppercase anchor_id', () => {
    for (const anchor_id of ['0123456789abcde', '0123456789ABCDEF']) {
      const el = { ...presentElement(), anchor_id };
      expect(referenceValueElementSchema.safeParse(el).success).toBe(false);
    }
  });
});
