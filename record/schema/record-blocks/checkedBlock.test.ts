import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { checkedBlock, citationsShape } from './checkedBlock.js';
import { poledBlock } from './poledBlock.js';
import { sentenceVerbatimSchema } from './blockStatus.js';

// A minimal well-formed citation. The citation element schema requires the
// provenance quartet plus the two nullable fields, and nothing else.
const CITATION = {
  source: 'health_canada_nnhpd',
  document_id: 'hc_nnhpd_multivitamin_mineral_monograph',
  section: 'Risk information',
  section_title: 'Contraindication(s)',
  evidence_locator: 'Table 14, zinc picolinate row',
  verbatim: 'Do not use if you are pregnant or breastfeeding.',
};

const block = checkedBlock(citationsShape);

describe('checkedBlock discriminates the states', () => {
  it('accepts present with its payload', () => {
    const r = block.safeParse({
      status: 'present',
      citations: [CITATION],
    });
    expect(r.success).toBe(true);
  });

  it('accepts stated_absence with quote, reason and citation', () => {
    const r = block.safeParse({
      status: 'stated_absence',
      absence_reason: 'no_statement_required',
      verbatim: 'No statement required.',
      citations: [CITATION],
    });
    expect(r.success).toBe(true);
  });

  it('accepts not_found with a checked document named by its pair', () => {
    const r = block.safeParse({
      status: 'not_found',
      sources_checked: [{ source: 'nih_ods', document_id: 'nih_ods_calcium' }],
    });
    expect(r.success).toBe(true);
  });

  // Gate 2. A missing or misspelled status fails on the discriminator, so no
  // separate presence check is needed for it.
  it('rejects a missing status', () => {
    const r = block.safeParse({ basis: 'x', citations: [CITATION] });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]?.message).toMatch(/discriminator/i);
  });

  it('rejects a status outside the enum', () => {
    const r = block.safeParse({ status: 'unknown' });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]?.message).toMatch(/discriminator/i);
  });
});

// Gates 3 and 4, the forbids half. These come from per-variant strictness
// rather than from a custom refinement, which is the reason the wrapper is a
// discriminated union and not one object with optional fields.
describe('the variants forbid the other variants fields', () => {
  it('rejects sources_checked on a stated_absence', () => {
    const r = block.safeParse({
      status: 'stated_absence',
      absence_reason: 'no_statement_required',
      verbatim: 'No statement required.',
      citations: [CITATION],
      sources_checked: [
        { source: 's', document_id: 'd' },
      ],
    });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r.error?.issues)).toMatch(/sources_checked/);
  });

  it('rejects a verbatim on a not_found: silence has nothing to quote', () => {
    const r = block.safeParse({
      status: 'not_found',
      sources_checked: [
        { source: 's', document_id: 'd' },
      ],
      verbatim: 'nothing was found',
    });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r.error?.issues)).toMatch(/verbatim/);
  });

  it('rejects an absence_reason on a not_found: silence has no reason', () => {
    const r = block.safeParse({
      status: 'not_found',
      sources_checked: [
        { source: 's', document_id: 'd' },
      ],
      absence_reason: 'insufficient_data_in_source',
    });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r.error?.issues)).toMatch(/absence_reason/);
  });
});

// Gates 3 and 4, the requires half.
describe('the variants require their own evidence', () => {
  it('rejects a stated_absence with no absence_reason', () => {
    const r = block.safeParse({
      status: 'stated_absence',
      verbatim: 'No statement required.',
      citations: [CITATION],
    });
    expect(r.success).toBe(false);
  });

  it('rejects a stated_absence with an empty citations list', () => {
    const r = block.safeParse({
      status: 'stated_absence',
      absence_reason: 'no_statement_required',
      verbatim: 'No statement required.',
      citations: [],
    });
    expect(r.success).toBe(false);
  });

  it('rejects an absence_reason outside the enum', () => {
    const r = block.safeParse({
      status: 'stated_absence',
      absence_reason: 'nobody_looked',
      verbatim: 'No statement required.',
      citations: [CITATION],
    });
    expect(r.success).toBe(false);
  });

  it('rejects a not_found with an empty sources_checked', () => {
    const r = block.safeParse({ status: 'not_found', sources_checked: [] });
    expect(r.success).toBe(false);
  });

  // Retired. The key once made a stub cost something; now a checked document
  // is read whole through its extraction, and the strict entry refuses the
  // key typed or empty.
  it('rejects the retired sections key on a sources_checked entry, typed or empty', () => {
    for (const sections of [['Section'], []]) {
      const r = block.safeParse({
        status: 'not_found',
        sources_checked: [{ source: 's', document_id: 'd', sections }],
      });
      expect(r.success).toBe(false);
      expect(JSON.stringify(r.error?.issues)).toMatch(/sections/);
    }
  });
});

// Gate 6, the sentence heuristic. Calibrated on the two real cases.
describe('sentenceVerbatimSchema separates a statement from a heading', () => {
  it('accepts the three-word Health Canada determination on its period', () => {
    expect(sentenceVerbatimSchema.safeParse('No statement required.').success).toBe(
      true,
    );
  });

  it('accepts a long clause with no terminal punctuation', () => {
    expect(
      sentenceVerbatimSchema.safeParse(
        'no upper level has been established by this authority',
      ).success,
    ).toBe(true);
  });

  it('rejects a bare heading', () => {
    const r = sentenceVerbatimSchema.safeParse('Contraindication(s)');
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]?.message).toMatch(/heading or a table label/);
  });

  it('rejects a short table label', () => {
    expect(sentenceVerbatimSchema.safeParse('Not applicable').success).toBe(false);
  });
});

describe('a strict present payload rejects a coined key', () => {
  it('names the coined key', () => {
    const r = block.safeParse({
      status: 'present',
      citations: [CITATION],
      severity: 'high',
    });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r.error?.issues)).toMatch(/severity/);
  });

  it('a loose present payload admits an underived key', () => {
    const loose = checkedBlock({}, 'loose');
    expect(loose.safeParse({ status: 'present', anything: 1 }).success).toBe(true);
  });
});

describe('a present block may carry an unresolved marker', () => {
  const MARKER = {
    class: 'anchor_gap',
    note: 'a held source states this and no extraction exists to anchor it',
    opened: '2026-09-19',
    must_close_by: 'before_pilot_pass',
  };
  const SECOND = { ...MARKER, note: 'a second fact owed to the same block, different note' };

  it('admits a well-formed marker in a STRICT present block', () => {
    const r = block.safeParse({
      status: 'present',
      citations: [CITATION],
      unresolved: [MARKER],
    });
    expect(r.success).toBe(true);
  });

  it('rejects a malformed marker in a strict present block rather than passing it through', () => {
    const r = block.safeParse({
      status: 'present',
      citations: [CITATION],
      unresolved: [{ ...MARKER, class: 'not_a_class' }],
    });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r.error?.issues)).toMatch(/class/);
  });

  it('rejects a marker missing a required field', () => {
    const { note, ...noNote } = MARKER;
    expect(
      block.safeParse({ status: 'present', citations: [CITATION], unresolved: [noNote] })
        .success,
    ).toBe(false);
  });

  it('shape-checks a marker in a LOOSE present block, which passthrough would not', () => {
    // A loose block admits unknown keys unread. Declaring the marker in the
    // shared shape is what makes it parsed rather than passed through, and the
    // validator walk does not descend into a registered block to catch it.
    const loose = checkedBlock({}, 'loose');
    expect(loose.safeParse({ status: 'present', unresolved: [MARKER] }).success).toBe(true);
    expect(
      loose.safeParse({ status: 'present', unresolved: [{ ...MARKER, must_close_by: 'someday' }] })
        .success,
    ).toBe(false);
  });

  it('holds two markers owed to one block', () => {
    const r = block.safeParse({
      status: 'present',
      citations: [CITATION],
      unresolved: [MARKER, SECOND],
    });
    expect(r.success).toBe(true);
  });

  it('rejects two markers with the same class and note', () => {
    const r = block.safeParse({
      status: 'present',
      citations: [CITATION],
      unresolved: [MARKER, { ...MARKER }],
    });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r.error?.issues)).toMatch(/same class and note/);
  });

  it('rejects an empty list, which says nothing the absent key does not', () => {
    const r = block.safeParse({
      status: 'present',
      citations: [CITATION],
      unresolved: [],
    });
    expect(r.success).toBe(false);
  });

  it('rejects a bare marker object, so every reader sees one shape', () => {
    const r = block.safeParse({
      status: 'present',
      citations: [CITATION],
      unresolved: MARKER,
    });
    expect(r.success).toBe(false);
  });

  it('does not admit a marker on stated_absence, and the same block parses without it', () => {
    const absence = {
      status: 'stated_absence',
      absence_reason: 'insufficient_data_in_source',
      verbatim: 'No adequate studies have been performed.',
      citations: [CITATION],
    };
    // The control first: without the marker this object is valid, so the
    // rejection below is the marker and not a malformed absence.
    expect(block.safeParse(absence).success).toBe(true);
    expect(block.safeParse({ ...absence, unresolved: [MARKER] }).success).toBe(false);
  });

  it('does not admit a marker on not_found, and the same block parses without it', () => {
    const notFound = {
      status: 'not_found',
      sources_checked: [
        { source: 'nih_ods', document_id: 'nih_ods_zinc' },
      ],
    };
    expect(block.safeParse(notFound).success).toBe(true);
    expect(block.safeParse({ ...notFound, unresolved: [MARKER] }).success).toBe(false);
  });
});

describe('poledBlock', () => {
  const poled = poledBlock({
    pregnancy: checkedBlock(citationsShape),
    lactation: checkedBlock(citationsShape),
  });

  it('lets one pole state a finding while another states a silence', () => {
    const r = poled.safeParse({
      pregnancy: { status: 'present', citations: [CITATION] },
      lactation: {
        status: 'not_found',
        sources_checked: [
          { source: 'nih_ods', document_id: 'nih_ods_zinc' },
        ],
      },
    });
    expect(r.success).toBe(true);
  });

  // The container carrying its own status would force one verdict over both
  // poles, which is the thing poling exists to prevent.
  it('rejects a status on the container', () => {
    const r = poled.safeParse({
      status: 'present',
      pregnancy: { status: 'present', citations: [CITATION] },
      lactation: { status: 'present', citations: [CITATION] },
    });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r.error?.issues)).toMatch(/status/);
  });

  it('requires every declared pole', () => {
    const r = poled.safeParse({
      pregnancy: { status: 'present', citations: [CITATION] },
    });
    expect(r.success).toBe(false);
  });
});

// The wrapper's def.type is what isBlockSchema has to cope with. Asserting it
// here pins the coupling: if a zod bump changes it, this fails next to the
// validator test rather than silently reintroducing the duplicate parse of a
// wrapped block's citations list.
describe('wrapper shape as the validator sees it', () => {
  it('is a union of object-typed options', () => {
    const def = (block as unknown as { def: { type: string; options: unknown[] } })
      .def;
    expect(def.type).toBe('union');
    expect(def.options).toHaveLength(5);
    for (const opt of def.options) {
      expect((opt as { def: { type: string } }).def.type).toBe('object');
    }
  });

  it('a poled container is object-typed', () => {
    expect(
      (poledBlock({ a: z.string() }) as unknown as { def: { type: string } }).def
        .type,
    ).toBe('object');
  });
});

// The three absence-over-sources variants differ
// only in which of their two lists is empty, and each variant's shape admits
// exactly its own case, so a stored status contradicting its own lists fails
// the parse. Each refusal below is paired with a control that parses, so the
// rejection is the named defect and not a malformed fixture.
describe('the absence-over-sources variants', () => {
  const CHECKED = { source: 'ema_hmpc', document_id: 'EMA/HMPC/321097/2012' };
  const PENDING = {
    source: 'who',
    document_id: 'WHO/Monographs/Vol1/Folium_Ginkgo',
    pending_reason: 'no_extraction_rule',
    clears_on: 'extraction_accounted',
  };
  const CEILING = {
    source: 'pubmed',
    document_id: 'PMID:15801937',
    pending_reason: 'governance_ceiling',
    clears_on: 'no_clearing_event',
  };
  const partial = {
    status: 'not_found_in_checked_sources',
    sources_checked: [CHECKED],
    sources_pending: [PENDING, CEILING],
  };
  const unassessed = {
    status: 'not_assessed',
    sources_checked: [],
    sources_pending: [PENDING, CEILING],
  };
  const MARKER = {
    class: 'anchor_gap',
    note: 'a fact with no home',
    opened: '2026-09-24',
    must_close_by: 'before_pilot_pass',
  };

  it('accepts not_found_in_checked_sources with both lists non-empty', () => {
    expect(block.safeParse(partial).success).toBe(true);
  });

  it('accepts not_assessed with an empty checked list and a non-empty pending one', () => {
    expect(block.safeParse(unassessed).success).toBe(true);
  });

  it('accepts a checked entry named by its pair alone on all three', () => {
    expect(block.safeParse({ status: 'not_found', sources_checked: [CHECKED] }).success).toBe(
      true,
    );
    expect(block.safeParse(partial).success).toBe(true);
  });

  it('refuses sources_pending on plain not_found: a pending document makes it partial', () => {
    const plain = { status: 'not_found', sources_checked: [CHECKED] };
    expect(block.safeParse(plain).success).toBe(true);
    const r = block.safeParse({ ...plain, sources_pending: [PENDING] });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r.error?.issues)).toMatch(/sources_pending/);
  });

  it('refuses not_found_in_checked_sources with an empty pending list', () => {
    const r = block.safeParse({ ...partial, sources_pending: [] });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r.error?.issues)).toMatch(/sources_pending/);
  });

  it('refuses not_found_in_checked_sources with no pending key', () => {
    const { sources_pending: _drop, ...noPending } = partial;
    const r = block.safeParse(noPending);
    expect(r.success).toBe(false);
    expect(JSON.stringify(r.error?.issues)).toMatch(/sources_pending/);
  });

  it('refuses not_found_in_checked_sources with an empty checked list', () => {
    const r = block.safeParse({ ...partial, sources_checked: [] });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r.error?.issues)).toMatch(/sources_checked/);
  });

  it('refuses not_found_in_checked_sources with no checked key', () => {
    const { sources_checked: _drop, ...noChecked } = partial;
    const r = block.safeParse(noChecked);
    expect(r.success).toBe(false);
    expect(JSON.stringify(r.error?.issues)).toMatch(/sources_checked/);
  });

  it('refuses not_assessed carrying a checked document', () => {
    const r = block.safeParse({ ...unassessed, sources_checked: [CHECKED] });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r.error?.issues)).toMatch(/not_assessed checks no document/);
  });

  it('refuses not_assessed with an empty pending list', () => {
    const r = block.safeParse({ ...unassessed, sources_pending: [] });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r.error?.issues)).toMatch(/sources_pending/);
  });

  it('refuses not_assessed with no checked key: the empty list is the statement', () => {
    const { sources_checked: _drop, ...noChecked } = unassessed;
    const r = block.safeParse(noChecked);
    expect(r.success).toBe(false);
    expect(JSON.stringify(r.error?.issues)).toMatch(/sources_checked/);
  });

  it('refuses not_assessed with no pending key', () => {
    const { sources_pending: _drop, ...noPending } = unassessed;
    expect(block.safeParse(noPending).success).toBe(false);
  });

  for (const [name, extra] of [
    ['verbatim', { verbatim: 'nothing was found' }],
    ['citations', { citations: [CITATION] }],
    ['absence_reason', { absence_reason: 'insufficient_data_in_source' }],
    ['unresolved', { unresolved: [MARKER] }],
  ] as const) {
    it(`refuses ${name} on both new variants`, () => {
      for (const base of [partial, unassessed]) {
        const r = block.safeParse({ ...base, ...extra });
        expect(r.success).toBe(false);
        expect(JSON.stringify(r.error?.issues)).toMatch(new RegExp(name));
      }
    });
  }

  it('refuses a malformed pending entry inside a variant', () => {
    const r = block.safeParse({
      ...partial,
      sources_pending: [{ ...PENDING, pending_reason: 'nobody_looked' }],
    });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r.error?.issues)).toMatch(/pending_reason/);
  });

  it('a poled container holds the three variants side by side', () => {
    const poled = poledBlock({
      renal_impairment: checkedBlock(citationsShape),
      hepatic_impairment: checkedBlock(citationsShape),
      older_adults: checkedBlock(citationsShape),
    });
    const r = poled.safeParse({
      renal_impairment: partial,
      hepatic_impairment: unassessed,
      older_adults: { status: 'not_found', sources_checked: [CHECKED] },
    });
    expect(r.success).toBe(true);
  });
});
