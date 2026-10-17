import { describe, it, expect } from 'vitest';
import type { z } from 'zod';
import {
  contraindicationsSchema,
  pregnancyLactationSchema,
  posologySchema,
  specialPopulationsSchema,
  pediatricUseSchema,
  hepatotoxicityAssessmentSchema,
  identifiersSchema,
  regulatorStatusSchema,
  emaHmpcStatusSchema,
  beersCriteriaSchema,
  regulatoryClassificationSchema,
  documentedInteractionsSchema,
  documentedAdverseReactionsSchema,
  otherWarningsAndPrecautionsSchema,
  drivingAndMachinerySchema,
  overdoseSchema,
  preclinicalSafetySchema,
  pharmacologySchema,
  substanceIdentitySchema,
} from './blocks.js';
import {
  LOOKUP_POLES,
  LOOKUP_STATUSES,
  SERVED_ATTESTED_CLAUSE,
  SERVED_LISTED,
  SERVED_NOT_LISTED,
} from './nameLookup.js';
import { validateDoc } from '../cli/validator-core.js';

// The name-lookup primitive's shape. Fixture values are literals: the
// vocabulary terms are iron's, typed out, and the one non-placeholder hash is
// a measured value.

const TERMS = ['Iron', 'Fe', 'ferrous sulfate'];

const RECOMPUTED = {
  list: { source: 'ema_hmpc', document_id: 'ema_hmpc_herbal_medicines_dataset' },
  edition: '2026-08-22T18:00',
  terms: TERMS,
  hits: 0,
  resolution: 'recomputed',
};

const ATTESTATION = {
  resolution: 'attested',
  verifier_hash: 'a'.repeat(64),
  verified_document_sha256: '16514d48cac9c059714d438e4b71a6028c7663bc4fd15e0f63478dbf6c60e630',
  verified_text_sha256: 'd'.repeat(64),
  verified_at_commit: 'b'.repeat(40),
  verified_at: '2026-09-25',
};

const ATTESTED = {
  list: { source: 'ags', document_id: 'ags_beers_criteria_2023' },
  edition: '2023-07',
  terms: TERMS,
  hits: 0,
  ...ATTESTATION,
};

const LISTED_LOOKUP = { ...ATTESTED, hits: 2, matched: ['Iron'] };

const NOT_LISTED_R = { status: 'not_listed', lookup: RECOMPUTED };
const NOT_LISTED_A = { status: 'not_listed', lookup: ATTESTED };
const LISTED = { status: 'listed', lookup: LISTED_LOOKUP };

const ok = (s: z.ZodType, v: unknown) => s.safeParse(v).success;

describe('the lookup statuses and poles', () => {
  it('are exactly the two statuses and the two lookup poles', () => {
    expect(LOOKUP_STATUSES).toEqual(['not_listed', 'listed']);
    expect(LOOKUP_POLES).toEqual([
      'regulatory_classification.ema_hmpc_status',
      'regulatory_classification.beers_criteria',
    ]);
  });
});

describe('each lookup variant is accepted on its two poles', () => {
  for (const [name, schema] of [
    ['ema_hmpc_status', emaHmpcStatusSchema],
    ['beers_criteria', beersCriteriaSchema],
  ] as const) {
    it(`${name} takes not_listed recomputed, not_listed attested and listed`, () => {
      expect(ok(schema, NOT_LISTED_R)).toBe(true);
      expect(ok(schema, NOT_LISTED_A)).toBe(true);
      expect(ok(schema, LISTED)).toBe(true);
    });
  }

  it('the roster container carries them under both keys', () => {
    expect(
      ok(regulatoryClassificationSchema, { ema_hmpc_status: NOT_LISTED_R, beers_criteria: LISTED }),
    ).toBe(true);
  });

  it('a whole record carrying them validates', () => {
    const r = validateDoc({
      regulatory_classification: { ema_hmpc_status: NOT_LISTED_R, beers_criteria: NOT_LISTED_A },
    });
    expect(r.failures).toEqual([]);
  });

  it('a whole record carrying one with a quote in it, or on another pole, fails', () => {
    const quoted = { ...RECOMPUTED, verbatim: 'Ironwort' };
    expect(
      validateDoc({ regulatory_classification: { ema_hmpc_status: { status: 'not_listed', lookup: quoted } } })
        .failures,
    ).toHaveLength(1);
    expect(
      validateDoc({ regulatory_classification: { health_canada_nnhpd_status: NOT_LISTED_R } }).failures,
    ).toHaveLength(1);
  });

  // The five statuses every block takes are still taken: the lookup poles
  // extend the union, they do not replace it.
  it('the two poles still take the five block statuses', () => {
    const reading = [{ source: 'nih_ods', document_id: 'nih_ods_iron' }];
    const pending = [
      { source: 'nih_ods', document_id: 'nih_ods_iron', pending_reason: 'no_extraction_rule', clears_on: 'extraction_accounted' },
    ];
    for (const schema of [emaHmpcStatusSchema, beersCriteriaSchema]) {
      expect(ok(schema, { status: 'not_found', sources_checked: reading })).toBe(true);
      expect(ok(schema, { status: 'not_assessed', sources_checked: [], sources_pending: pending })).toBe(true);
    }
  });
});

describe('each lookup variant is refused on every other pole and block', () => {
  const others: ReadonlyArray<readonly [string, z.ZodType]> = [
    ['health_canada_nnhpd_status', regulatorStatusSchema],
    ['contraindications', contraindicationsSchema],
    ['pediatric_use', pediatricUseSchema],
    ['hepatotoxicity_assessment', hepatotoxicityAssessmentSchema],
    ['pregnancy_lactation.pregnancy', pregnancyLactationSchema.shape.pregnancy],
    ['pregnancy_lactation.lactation', pregnancyLactationSchema.shape.lactation],
    ['pregnancy_lactation.fertility', pregnancyLactationSchema.shape.fertility],
    ['posology.dose', posologySchema.shape.dose],
    ['posology.duration_of_use', posologySchema.shape.duration_of_use],
    ['special_populations.renal_impairment', specialPopulationsSchema.shape.renal_impairment],
    ['special_populations.hepatic_impairment', specialPopulationsSchema.shape.hepatic_impairment],
    ['special_populations.older_adults', specialPopulationsSchema.shape.older_adults],
    ['substance_identity.identifiers', identifiersSchema],
    ['substance_identity', substanceIdentitySchema],
    ['pharmacology', pharmacologySchema],
    ['preclinical_safety', preclinicalSafetySchema],
    ['overdose', overdoseSchema],
    ['other_warnings_and_precautions', otherWarningsAndPrecautionsSchema],
    ['documented_adverse_reactions', documentedAdverseReactionsSchema],
    ['documented_interactions', documentedInteractionsSchema],
    ['driving_and_machinery', drivingAndMachinerySchema],
  ];
  for (const [name, schema] of others) {
    it(`${name} refuses not_listed and listed`, () => {
      expect(ok(schema, NOT_LISTED_R)).toBe(false);
      expect(ok(schema, NOT_LISTED_A)).toBe(false);
      expect(ok(schema, LISTED)).toBe(false);
    });
  }

  it('health_canada_nnhpd_status refuses them inside the roster container too', () => {
    expect(ok(regulatoryClassificationSchema, { health_canada_nnhpd_status: NOT_LISTED_R })).toBe(false);
    expect(ok(regulatoryClassificationSchema, { health_canada_nnhpd_status: LISTED })).toBe(false);
  });
});

describe('a lookup carries no bytes and no free text', () => {
  const withLookup = (status: string, lookup: unknown) => ({ status, lookup });
  const refused = (v: unknown) => {
    expect(ok(emaHmpcStatusSchema, v)).toBe(false);
    expect(ok(beersCriteriaSchema, v)).toBe(false);
  };

  it('refuses a quote, a context window, a matched cell or a note on the act', () => {
    for (const extra of [
      { verbatim: 'Ironwort' },
      { context_before: 'Sideritis herba' },
      { matched_text: 'Ironwort' },
      { note: 'four hits, all Ironwort' },
    ]) {
      refused(withLookup('not_listed', { ...RECOMPUTED, ...extra }));
      refused(withLookup('not_listed', { ...ATTESTED, ...extra }));
      refused(withLookup('listed', { ...LISTED_LOOKUP, ...extra }));
    }
  });

  it('refuses a key beside the lookup on the pole', () => {
    refused({ ...NOT_LISTED_R, verbatim: 'Ironwort' });
    refused({ ...LISTED, citations: [] });
  });

  it('refuses a key inside list, and a list named by prose', () => {
    refused(withLookup('not_listed', { ...RECOMPUTED, list: { ...RECOMPUTED.list, title: 'EMA herbal medicines' } }));
    refused(withLookup('not_listed', { ...RECOMPUTED, list: { source: 'ema_hmpc', document_id: 'the EMA herbal inventory' } }));
    refused(withLookup('not_listed', { ...RECOMPUTED, list: { source: 'not_a_source', document_id: 'x' } }));
  });

  it('refuses an edition that is a label rather than a date', () => {
    for (const edition of ['2023 edition', 'Herbal medicine export', '22/08/2026 - 18:00', '2026-08-22T18:00:00']) {
      refused(withLookup('not_listed', { ...RECOMPUTED, edition }));
    }
  });

  it('refuses a term that is not one trimmed vocabulary-length line', () => {
    for (const bad of ['', ' Iron', 'Iron ', 'Iron\nIronwort', 'x'.repeat(81)]) {
      refused(withLookup('not_listed', { ...RECOMPUTED, terms: [bad] }));
    }
    refused(withLookup('not_listed', { ...RECOMPUTED, terms: [] }));
    refused(withLookup('not_listed', { ...RECOMPUTED, terms: ['Iron', 'Iron'] }));
  });

  it('refuses matched naming a term that was not searched, or none, or one twice', () => {
    refused(withLookup('listed', { ...LISTED_LOOKUP, matched: ['Ironwort'] }));
    refused(withLookup('listed', { ...LISTED_LOOKUP, matched: [] }));
    refused(withLookup('listed', { ...LISTED_LOOKUP, matched: ['Iron', 'Iron'] }));
  });
});

describe('the act states its own status', () => {
  it('not_listed counts 0 and nothing else', () => {
    expect(ok(emaHmpcStatusSchema, { status: 'not_listed', lookup: { ...RECOMPUTED, hits: 1 } })).toBe(false);
    expect(ok(beersCriteriaSchema, { status: 'not_listed', lookup: { ...ATTESTED, hits: 3 } })).toBe(false);
  });

  it('not_listed carries no matched', () => {
    expect(ok(beersCriteriaSchema, { status: 'not_listed', lookup: { ...ATTESTED, matched: ['Iron'] } })).toBe(false);
  });

  it('listed counts at least one, is attested, and names what matched', () => {
    expect(ok(beersCriteriaSchema, { status: 'listed', lookup: { ...LISTED_LOOKUP, hits: 0 } })).toBe(false);
    expect(
      ok(beersCriteriaSchema, { status: 'listed', lookup: { ...RECOMPUTED, hits: 2, matched: ['Iron'] } }),
    ).toBe(false);
    const { matched: _m, ...noMatched } = LISTED_LOOKUP;
    expect(ok(beersCriteriaSchema, { status: 'listed', lookup: noMatched })).toBe(false);
  });

  it('an attested act carries all five attestation fields, the copy hash non-empty', () => {
    for (const k of ['verifier_hash', 'verified_document_sha256', 'verified_text_sha256', 'verified_at_commit', 'verified_at'] as const) {
      const { [k]: _gone, ...rest } = ATTESTED;
      expect(ok(beersCriteriaSchema, { status: 'not_listed', lookup: rest })).toBe(false);
    }
    expect(
      ok(beersCriteriaSchema, { status: 'not_listed', lookup: { ...ATTESTED, verified_document_sha256: '' } }),
    ).toBe(false);
  });

  it('a recomputed act carries no attestation field', () => {
    expect(
      ok(emaHmpcStatusSchema, { status: 'not_listed', lookup: { ...RECOMPUTED, verifier_hash: 'a'.repeat(64) } }),
    ).toBe(false);
  });
});

describe('beers_criteria present', () => {
  const CITATION = {
    source: 'ags',
    document_id: 'ags_beers_criteria_2023',
    section: 'Table 2',
    section_title: 'Potentially inappropriate medications',
    evidence_locator: 'row',
    verbatim: 'x',
  };

  it('carries its citations and nothing else', () => {
    expect(ok(beersCriteriaSchema, { status: 'present', citations: [CITATION] })).toBe(true);
  });

  it('refuses the retired listed boolean', () => {
    expect(ok(beersCriteriaSchema, { status: 'present', listed: true, citations: [CITATION] })).toBe(false);
  });
});

// The fixed served wordings, typed out here as literals rather than read from
// the module under test.
describe('the served wordings are the fixed text, verbatim', () => {
  it('NOT LISTED', () => {
    expect(SERVED_NOT_LISTED).toBe(
      'NOT LISTED. <list> (<edition>) was searched for <terms> (whole word, any case): 0 <unit>. This says only that the list does not name <substance>; it is not evidence of safety.',
    );
  });
  it('LISTED', () => {
    expect(SERVED_LISTED).toBe(
      'LISTED. <list> (<edition>) names <substance> (matched: <matched>; <hits> <unit>). What the entry says cannot be checked (licensing); this is not a quoted finding.',
    );
  });
  it('the attested clause', () => {
    expect(SERVED_ATTESTED_CLAUSE).toBe(
      'Searched by an author on <date> in a copy the corpus may not hold (licensing), so the search cannot be re-run from the corpus.',
    );
  });
});
