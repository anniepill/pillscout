import { describe, it, expect } from 'vitest';
import {
  REQUIRED_BLOCKS,
  requiredBlocksFor,
} from './requiredBlocks.js';
import { sourceScopeEvaluatedSchema } from './sourceScopeEvaluated.js';

describe('the frozen required list', () => {
  it('carries the eighteen universal questions', () => {
    expect(REQUIRED_BLOCKS).toHaveLength(18);
  });

  it('has no duplicates', () => {
    expect(new Set(REQUIRED_BLOCKS).size).toBe(REQUIRED_BLOCKS.length);
  });

  // The three blocks an audit found missing on nine records are
  // the reason the list exists. Naming them explicitly means a future edit
  // that drops one fails here rather than quietly narrowing the corpus.
  it('includes the three audited blocks', () => {
    for (const b of ['contraindications', 'pregnancy_lactation', 'pediatric_use']) {
      expect(REQUIRED_BLOCKS).toContain(b);
    }
  });

  // Declined candidates must stay declined. A monograph-shaped list would
  // have admitted these; the membership criterion is what the engine computes
  // on, not what a regulator prints a heading for.
  //
  // driving_and_machinery stays in this list. It now exists as a FINDINGS
  // block (schema/record-blocks/blocks.ts, registered
  // in FIELD_SCHEMAS so it is checked), which is a different question from
  // whether a record OWES an answer. It does not, and its absence asserts
  // nothing, which is exactly what membership here would change.
  it('excludes the eight declined questions', () => {
    for (const b of [
      'driving_and_machinery',
      'lab_test_interference',
      'monitoring_requirements',
      'long_term_safety',
      'route_of_administration',
      'dosage_form',
      'storage_and_stability',
      'perioperative_discontinuation',
    ]) {
      expect(REQUIRED_BLOCKS).not.toContain(b);
    }
  });

  // Attributes are not questions: their absence on a nutrient asserts nothing.
  it('excludes the botanical identity attributes', () => {
    for (const b of ['latin_binomial', 'family', 'plant_part', 'plant_part_common_name']) {
      expect(REQUIRED_BLOCKS).not.toContain(b);
    }
  });
});

describe('substance_type conditionals', () => {
  it('adds reference_values for a nutrient', () => {
    expect(requiredBlocksFor('nutrient')).toContain('reference_values');
  });

  it('does not add it for a herb', () => {
    expect(requiredBlocksFor('herb')).not.toContain('reference_values');
  });

  // substance_type conformance is a different question from block presence.
  // Folding them would report one defect as two.
  it('falls back to the universal list on an unknown or missing type', () => {
    expect(requiredBlocksFor(undefined)).toHaveLength(REQUIRED_BLOCKS.length);
    expect(requiredBlocksFor('mineral_salt')).toHaveLength(REQUIRED_BLOCKS.length);
  });
});

// The key set is DERIVED, read off every carrier record: six universal
// keys required, two partial keys optional, plus the new tier_3_sources.
describe('sourceScopeEvaluatedSchema (strict)', () => {
  const MINIMAL = {
    policy_class: 'authoritative_evidence_review',
    policy_version: 'source_policy_v1',
    evaluated_on: '2026-07-05',
    next_review_due: '2027-07-05',
    tier_1_sources: [{ source: 'nih_ods', retrieved_on: '2026-06-27' }],
    tier_3_policy: 'regulator_cited_only',
  };

  it('admits the block as authored at HEAD, full form', () => {
    expect(
      sourceScopeEvaluatedSchema.safeParse({
        ...MINIMAL,
        tier_2_sources: [{ source: 'msk', retrieved_on: '2026-06-01' }],
        retained_sources_note: 'Controlled absences.',
      }).success,
    ).toBe(true);
  });

  // Some carriers lack tier_2_sources, and more lack the note.
  it('admits the two partial keys being absent', () => {
    expect(sourceScopeEvaluatedSchema.safeParse(MINIMAL).success).toBe(true);
  });

  for (const k of [
    'policy_class',
    'policy_version',
    'evaluated_on',
    'next_review_due',
    'tier_1_sources',
    'tier_3_policy',
  ]) {
    it(`requires ${k}, which is present on every carrier`, () => {
      const { [k]: _drop, ...rest } = MINIMAL as Record<string, unknown>;
      expect(sourceScopeEvaluatedSchema.safeParse(rest).success).toBe(false);
    });
  }

  it('is strict: a coined key fails', () => {
    expect(
      sourceScopeEvaluatedSchema.safeParse({ ...MINIMAL, tier_4_sources: [] }).success,
    ).toBe(false);
  });

  it('requires both keys on a tier element', () => {
    expect(
      sourceScopeEvaluatedSchema.safeParse({
        ...MINIMAL,
        tier_1_sources: [{ source: 'nih_ods' }],
      }).success,
    ).toBe(false);
  });

  it('declares tier_3_sources as an optional string array of document ids', () => {
    expect(
      sourceScopeEvaluatedSchema.safeParse({
        ...MINIMAL,
        tier_3_sources: ['fda_dailymed_ascor_ascorbic_acid_injection_setid_388aad52'],
      }).success,
    ).toBe(true);
  });

  it('rejects a tier_3_sources that is not an array of strings', () => {
    expect(
      sourceScopeEvaluatedSchema.safeParse({ ...MINIMAL, tier_3_sources: 'fda' }).success,
    ).toBe(false);
    expect(
      sourceScopeEvaluatedSchema.safeParse({ ...MINIMAL, tier_3_sources: [1] }).success,
    ).toBe(false);
  });

  // tier_3_policy states the policy; tier_3_sources lists the documents it has
  // been applied to. Different fields, and both may be present.
  it('carries tier_3_policy and tier_3_sources together', () => {
    expect(
      sourceScopeEvaluatedSchema.safeParse({ ...MINIMAL, tier_3_sources: ['x'] }).success,
    ).toBe(true);
  });
});
