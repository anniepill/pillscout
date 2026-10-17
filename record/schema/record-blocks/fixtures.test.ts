import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { contraindicationsSchema, pregnancyLactationSchema } from './blocks.js';
import { validateDoc } from '../cli/validator-core.js';
import { FIELD_SCHEMAS, checkRequiredBlocks } from '../cli/validator-core.js';
import { REQUIRED_BLOCKS } from './requiredBlocks.js';

// The six-state fixture set (01 to 06), plus three the six do not reach: gate
// 1 has no fixture among them,
// nor does the container rule, nor the both-shapes leak that motivates the
// discriminated union.
//
// The fixtures are parsed with the same yaml parser the validator uses, so
// what these tests exercise is what an authored record would actually produce.
const DIR = join(
  import.meta.dirname,
  '..',
  'cli',
  '__fixtures__',
  'record-blocks',
);

function load(name: string): Record<string, unknown> {
  return parse(readFileSync(join(DIR, name), 'utf8')) as Record<string, unknown>;
}

describe('the three valid states', () => {
  it('01 present parses, including the preparation-scoped item', () => {
    const block = load('01-present.yaml').contraindications as {
      items: Array<Record<string, unknown>>;
    };
    const r = contraindicationsSchema.safeParse(block);
    expect(r.success).toBe(true);
    expect(block.items).toHaveLength(2);
    expect(block.items[0]?.applies_to_preparation).toBe('zinc_picolinate');
  });

  it('02 stated_absence parses', () => {
    const r = contraindicationsSchema.safeParse(
      load('02-stated-absence.yaml').contraindications,
    );
    expect(r.success).toBe(true);
  });

  it('03 not_found parses', () => {
    const r = contraindicationsSchema.safeParse(load('03-not-found.yaml').contraindications);
    expect(r.success).toBe(true);
  });
});

describe('the malformed states are rejected, each for its own reason', () => {
  it('04 malformed absence: no verbatim, no citations', () => {
    const r = contraindicationsSchema.safeParse(
      load('04-malformed-absence.yaml').contraindications,
    );
    expect(r.success).toBe(false);
    const issues = JSON.stringify(r.error?.issues);
    expect(issues).toMatch(/verbatim/);
    expect(issues).toMatch(/citations/);
  });

  it('05 a sources_checked entry carrying the retired sections key', () => {
    const r = contraindicationsSchema.safeParse(
      load('05-partial-sources-checked.yaml').contraindications,
    );
    expect(r.success).toBe(false);
    expect(JSON.stringify(r.error?.issues)).toMatch(/sections/);
  });

  it('06 wrong absence_reason: the coined value is named', () => {
    const r = contraindicationsSchema.safeParse(
      load('06-wrong-absence-reason.yaml').contraindications,
    );
    expect(r.success).toBe(false);
    expect(JSON.stringify(r.error?.issues)).toMatch(/absence_reason/);
  });

  it('08 poled container carrying its own status', () => {
    const block = load('08-poled-container-with-status.yaml').pregnancy_lactation as
      Record<string, Record<string, unknown>>;
    const r = pregnancyLactationSchema.safeParse(block);
    expect(r.success).toBe(false);
    expect(JSON.stringify(r.error?.issues)).toMatch(/status/);

    // The container status is the ONLY defect: drop it and the same poles
    // parse clean. That is what makes this a single-defect fixture rather than
    // a pile of them. The pregnancy pole carried basis_by_use_category here
    // until the key retired.
    const { status: _drop, ...poles } = block;
    expect(pregnancyLactationSchema.safeParse(poles).success).toBe(true);
  });

  it('09 an absence carrying both shapes at once', () => {
    const r = contraindicationsSchema.safeParse(
      load('09-absence-with-both-shapes.yaml').contraindications,
    );
    expect(r.success).toBe(false);
    expect(JSON.stringify(r.error?.issues)).toMatch(/sources_checked/);
  });
});

// Gate 1 is the only gate that sees an absent block, and 07 is the only
// fixture that exercises it.
describe('07 missing required blocks (gate 1)', () => {
  const doc = load('07-missing-required-block.yaml');
  const warnings = checkRequiredBlocks(doc);

  it('reports one warning per absent required block', () => {
    // 18 universal + reference_values for a nutrient, minus substance_identity
    // and the two other keys the fixture happens to carry (id, canonical_name
    // are not required blocks), so all 19 expected blocks are absent.
    expect(warnings).toHaveLength(19);
  });

  it('includes the three blocks the audit found missing', () => {
    const named = warnings.map((w) => w.field);
    expect(named).toContain('contraindications');
    expect(named).toContain('pregnancy_lactation');
    expect(named).toContain('pediatric_use');
  });

  it('applies the nutrient conditional', () => {
    expect(warnings.map((w) => w.field)).toContain('reference_values');
  });

  it('says why an absent block is not the same as a checked absence', () => {
    expect(warnings[0]?.message).toMatch(/indistinguishable from a checked absence/);
  });
});

// Gate 5, record-level sources_checked coverage, is retired. Its successor,
// the absence gate, is part of the full pipeline and not shipped here, and is
// tested there.

// The driving_and_machinery findings block. These two fixtures go
// through FIELD_SCHEMAS rather than through the schema import directly,
// because registration is the thing under test: an unregistered block is
// ACCEPTED by the validator and never CHECKED, so a test that only parsed the
// schema would pass whether or not the block was wired in.
describe('driving_and_machinery, through the registry', () => {
  const registered = FIELD_SCHEMAS['driving_and_machinery'];

  it('is registered, which is what makes it checked rather than merely admitted', () => {
    expect(registered).toBeDefined();
  });

  it('is NOT a required question, so no record owes it', () => {
    expect(REQUIRED_BLOCKS).not.toContain('driving_and_machinery');
    // And a record without it reports nothing on that account.
    const failures = checkRequiredBlocks({ substance_type: 'herb' });
    expect(failures.map((f) => f.path)).not.toContain('driving_and_machinery');
  });

  it('10 present parses', () => {
    const block = load('10-driving-and-machinery.yaml').driving_and_machinery;
    const r = registered!.safeParse(block);
    expect(r.success).toBe(true);
  });

  it('11 rejects a coined key inside the block', () => {
    const block = load('11-driving-unknown-key.yaml').driving_and_machinery;
    const r = registered!.safeParse(block);
    expect(r.success).toBe(false);
    expect(JSON.stringify(r.error?.issues)).toContain('effects_on_driving');
  });
});

// Before these two were registered nothing parsed either block's poles: a
// record's renal_impairment status set to `bogus` passed the corpus-wide run.
// Tested through FIELD_SCHEMAS and through validateDoc on a real record,
// because registration is the thing under
// test and a direct schema parse would pass whether or not it was wired in.
describe('posology and special_populations, through the registry', () => {
  const RECORDS = join(import.meta.dirname, '..', '..', 'ingredients', 'records');
  const real = (name: string): Record<string, any> =>
    parse(readFileSync(join(RECORDS, `${name}.yaml`), 'utf8')) as Record<string, any>;

  it('both are registered', () => {
    expect(FIELD_SCHEMAS['posology']).toBeDefined();
    expect(FIELD_SCHEMAS['special_populations']).toBeDefined();
  });

  it('refuses an undeclared key under a strict posology pole', () => {
    const doc = real('ginkgo');
    doc['posology'].dose.severity = 'high';
    const f = validateDoc(doc).failures;
    expect(f).toHaveLength(1);
    expect(f[0]?.message).toMatch(/severity/);
  });
});
