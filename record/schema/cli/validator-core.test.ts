/**
 * Negative control for the record validator.
 *
 * The validator had only ever been observed exiting 0 against the real
 * corpus, which means its exit-1 path was undemonstrated. A gate seen only
 * green is indistinguishable from a gate that never runs. These tests pin
 * both directions: the validator rejects a defective record for the specific
 * reason it is defective, and still accepts a real one.
 *
 * Paths resolve from import.meta.url rather than the working directory, so
 * the tests do not depend on where vitest is invoked from.
 */
import { mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { FIRED_TRIGGERS } from './check-triggers.js';
import {
  FIELD_SCHEMAS,
  checkUnresolvedTriggers,
  isBlockSchema,
  validateDoc,
  validateFile,
} from './validator-core.js';

const fixturePath = (name: string): string =>
  fileURLToPath(new URL(`./__fixtures__/${name}`, import.meta.url));

const RECORDS_DIR = fileURLToPath(new URL('../../ingredients/records/', import.meta.url));

describe('validateFile', () => {
  it('rejects an evidence_outcome value that is not in the enum', () => {
    const result = validateFile(fixturePath('invalid-evidence-outcome.yaml'));

    // Exactly one, not merely at least one. The fixture differs from a
    // conformant record in one field only, so a second failure would mean it
    // has drifted and stopped isolating the defect under test.
    expect(result.failures).toHaveLength(1);

    const failure = result.failures[0];
    expect(failure).toBeDefined();

    // Assert the specific finding. A test satisfied by any failure would pass
    // when the validator rejects the fixture for the wrong reason, which is
    // not a control.
    // documented_interactions is registered, so its schema owns the parse
    // and the finding is reported against it rather than against the
    // citations list nested inside it. The walk's block-stop rule, one level
    // higher: one defect, one finding, reported against whichever registered
    // schema did the parsing. The location still rides in the message.
    expect(failure?.field).toBe('documented_interactions');
    expect(failure?.path).toBe('documented_interactions');
    expect(failure?.message).toContain('[0].evidence_outcome');

    // The reported value is the block the schema was applied to. Reaching
    // into it pins that the finding is about the citation carrying the
    // defect, which the path alone no longer says.
    const block = failure?.value as {
      items: Array<{ citations: Array<{ evidence_outcome?: unknown }> }>;
    };
    expect(block.items[0]?.citations[0]?.evidence_outcome).toBe('not_reported');

    // The message text is Zod's, not this repo's, so it is asserted only to be
    // present. Pinning its exact wording would couple the corpus's gate to a
    // dependency's phrasing and break on a zod patch bump.
    expect(failure?.message).toBeTruthy();

    // The other mapped fields in the fixture are genuine enum members, so the
    // walk must have visited and checked them. Zero here would mean the
    // fixture failed for want of being traversed rather than for its defect.
    expect(result.checks).toBeGreaterThan(0);
  });

  it('rejects an unrecognized key inside applicability_conditions', () => {
    const result = validateFile(
      fixturePath('unknown-key-in-applicability-conditions.yaml'),
    );

    // One only. population sits beside the defect and is fully conformant, so
    // a second failure would mean the strict object is false-firing on a
    // valid neighbour rather than the coined key being caught. It is also the
    // double-report guard: applicability_conditions is registered in FIELD_SCHEMAS in
    // its own right and declared inside the citation element, so a walk that
    // descended past a block schema would report this one key twice.
    expect(result.failures).toHaveLength(1);

    const failure = result.failures[0];
    expect(failure).toBeDefined();

    // documented_interactions is registered, so its schema owns the parse
    // and the finding is reported against it rather than against the
    // citations list nested inside it. The walk's block-stop rule, one level
    // higher: one defect, one finding, reported against whichever registered
    // schema did the parsing. The location still rides in the message.
    expect(failure?.field).toBe('documented_interactions');
    expect(failure?.path).toBe('documented_interactions');

    // The failure must NAME the offending key, and locate it. Both assert
    // containment of strings this fixture controls, not Zod's sentence
    // structure, so they stay specific without pinning a dependency's
    // phrasing.
    expect(failure?.message).toContain('patient_subgroup');
    expect(failure?.message).toContain('[0].applicability_conditions');

    expect(result.checks).toBeGreaterThan(0);
  });

  // dose_range is retired: the quote carries the dose. The fixture carries
  // the field in the shape it had while it was declared, every key and value
  // conformant to it, so the refusal can only be the retirement. This fixture
  // used to plant a coined key inside dose_range for the double-report
  // regression, which the applicability conditions test above now guards.
  it('refuses a citation carrying the retired dose_range', () => {
    const result = validateFile(fixturePath('retired-dose-range-in-citation.yaml'));

    // One defect, one finding.
    expect(result.failures).toHaveLength(1);

    const failure = result.failures[0];
    expect(failure).toBeDefined();
    expect(failure?.field).toBe('documented_interactions');
    expect(failure?.path).toBe('documented_interactions');

    // The finding names the retired key and locates it on the citation.
    expect(failure?.message).toContain('dose_range');
    expect(failure?.message).toContain('[0].applicability_conditions');

    expect(result.checks).toBeGreaterThan(0);
  });

  it('refuses a block-level applicability_conditions carrying dose_range', () => {
    // The block-level carriers the corpus once held sat outside any citation
    // and were parsed by the walk's FIELD_SCHEMAS registration of
    // applicability_conditions.
    const result = validateDoc({
      some_profile: {
        applicability_conditions: {
          dose_range: { threshold: 1, threshold_unit: 'mg', threshold_direction: 'above' },
        },
      },
    });
    expect(result.failures).toHaveLength(1);
    expect(result.failures[0]?.field).toBe('applicability_conditions');
    expect(result.failures[0]?.path).toBe('some_profile.applicability_conditions');
    expect(result.failures[0]?.message).toContain('dose_range');
  });

  it('rejects a coined key inside a citation', () => {
    const result = validateFile(fixturePath('unknown-key-in-citation.yaml'));

    // One finding, not two, though the misspelling breaks two rules at once:
    // it adds an unrecognized key AND leaves the required one missing. Both
    // issues come out of the same strict parse of the block, so the walk
    // emits a single Failure carrying both.
    expect(result.failures).toHaveLength(1);

    const failure = result.failures[0];
    expect(failure).toBeDefined();
    // documented_interactions is registered, so its schema owns the parse
    // and the finding is reported against it rather than against the
    // citations list nested inside it. The walk's block-stop rule, one level
    // higher: one defect, one finding, reported against whichever registered
    // schema did the parsing. The location still rides in the message.
    expect(failure?.field).toBe('documented_interactions');
    expect(failure?.path).toBe('documented_interactions');

    // Both halves of the defect must be named. Asserting only the coined key
    // would still pass if the provenance keys were optional, which is the
    // thing that made this slip invisible before the schema existed.
    expect(failure?.message).toContain('evidence_locater');
    expect(failure?.message).toContain('evidence_locator');
  });

  it('still catches a coined citation key when NO block schema is registered for it', () => {
    // The mutation half of the negative control above, and the reason that
    // fixture is worth having. Deregistering `citations` reproduces the
    // validator as it once stood, when 13 citation fields had leaf enum
    // schemas and the citation OBJECT had none.
    //
    // Under that arrangement this fixture passes CLEAN: zero failures. A
    // citation whose required locator key is misspelled was not a finding,
    // it was invisible, and the record reported as fully conformant. That is
    // the gap citationElementSchema closes, and asserting it here means the
    // fixture cannot quietly stop testing anything if the registration is
    // later removed.
    // REGISTERING documented_interactions CHANGED WHAT THIS CONTROL
    // DEMONSTRATES, and the change is the point. Its element schema declares
    // citations, so deregistering `citations` alone no longer makes the
    // defect invisible: the outer block still catches it. Both have to go
    // before that original blind spot reappears, which is a stronger
    // guarantee than the one this test was written to assert.
    //
    // THE BLIND SPOT CAN NO LONGER BE REACHED FROM HERE AT ALL, and this test
    // now asserts that instead. sweepCitationCarriers descends on the shape of
    // the document and imports citationsSchema directly, so it consults
    // FIELD_SCHEMAS for nothing: deregistering both keys leaves the defect
    // caught. The name below is kept because it is what that original state
    // was called, and the assertion is inverted deliberately rather than deleted,
    // so a future change that makes registration load-bearing again fails
    // here.
    const savedC = FIELD_SCHEMAS['citations'];
    const savedD = FIELD_SCHEMAS['documented_interactions'];
    try {
      delete FIELD_SCHEMAS['citations'];
      const stillCaught = validateFile(fixturePath('unknown-key-in-citation.yaml'));
      expect(stillCaught.failures).toHaveLength(1);

      delete FIELD_SCHEMAS['documented_interactions'];
      const result = validateFile(fixturePath('unknown-key-in-citation.yaml'));
      // Was `toEqual([])` until the sweep landed. One finding, from the sweep,
      // reported at the citations list because no registered block remains to
      // own it.
      expect(result.failures).toHaveLength(1);
      expect(result.failures[0]?.field).toBe('citations');
      expect(result.failures[0]?.message).toContain('evidence_locater');

      expect(result.checks).toBeGreaterThan(0);
    } finally {
      // Restored whatever the assertions did. FIELD_SCHEMAS is module state
      // shared by every test in this file.
      FIELD_SCHEMAS['citations'] = savedC as never;
      FIELD_SCHEMAS['documented_interactions'] = savedD as never;
    }
  });

  it('still reaches a leaf field outside a citations list', () => {
    // Guards the other direction of the block-schema stop. An enum is not a
    // block and declares no children, so traversal must continue past it.
    // Registering the citations list put a large share of the corpus's
    // enum-tagged fields behind one stop, so a later change that widened the
    // stop to every FIELD_SCHEMAS hit would leave the validator passing
    // every record and still failing its other negative controls, while silently no
    // longer visiting leaf fields nothing else reaches.
    //
    // The fixture carries a conformant citations list before the defect, so
    // the walk must stop at a block and then keep going to find it.
    const result = validateFile(
      fixturePath('invalid-leaf-outside-citations.yaml'),
    );

    expect(result.failures).toHaveLength(1);
    expect(result.failures[0]?.field).toBe('citation_status');
    expect(result.failures[0]?.path).toBe('citation_gaps[0].citation_status');
  });

  it('accepts genotype, the one declared applicability condition no record uses', () => {
    // Positive control for an unexercised schema slot. genotype is declared
    // in applicabilityConditionsSchema and used by no record, so nothing had
    // ever parsed a value into it. An untested slot
    // is indistinguishable from a broken one until the first record needs
    // it, which would be the worst moment to find out.
    const result = validateFile(
      fixturePath('genotype-applicability-condition.yaml'),
    );

    expect(result.failures).toEqual([]);
    expect(result.checks).toBeGreaterThan(0);
  });

  it('accepts a real corpus record', () => {
    // Positive control. Without it, a validator that failed everything
    // unconditionally would still satisfy the test above.
    const records = readdirSync(RECORDS_DIR)
      .filter((f) => f.endsWith('.yaml'))
      .sort();
    expect(records.length).toBeGreaterThan(0);

    const first = records[0];
    expect(first).toBeDefined();

    const result = validateFile(`${RECORDS_DIR}${first}`);
    expect(result.failures).toEqual([]);
    expect(result.checks).toBeGreaterThan(0);
  });

  // Gate 6. No conformant record can carry an overdue marker, so the fired
  // direction of this gate is fixture-only. Both directions are asserted on
  // fixtures: a gate that reported every
  // open block, or ignored FIRED_TRIGGERS and reported every block, would pass
  // the fired case alone.
  it('rejects an unresolved block whose must_close_by trigger has fired', () => {
    const result = validateFile(fixturePath('unresolved-trigger-fired.yaml'));

    // Exactly one. The fixture's block is well-formed and every other mapped
    // field is a genuine enum member, so a second failure would mean the
    // shape schema is also firing and the fixture has stopped isolating the
    // firing rule from the shape contract.
    expect(result.failures).toHaveLength(1);

    const failure = result.failures[0];
    expect(failure).toBeDefined();

    // Reported at the block's own path, NOT against the outermost registered
    // block the way a walk finding is. Gate 6 runs at record level with its
    // own descent, so it can name the citation that carries the block, which
    // is the thing an author has to go and edit.
    expect(failure?.path).toBe('documented_interactions.items[0].citations[0].unresolved[0]');
    expect(failure?.field).toBe('must_close_by');
    expect(failure?.value).toBe('after_build_2');

    // The message must name the fired trigger, the class, and both legal
    // closures, since a marker has exactly two and a reader who is told only
    // that the block is overdue does not know what to do about it.
    expect(failure?.message).toContain('after_build_2');
    expect(failure?.message).toContain('no_slot');
    expect(failure?.message).toContain('close it in place');
    expect(failure?.message).toContain('promote it to an');
    expect(failure?.message).toContain('whose id the marker then carries');

    // The fixture pins a token that must actually be in the fired set. If a
    // future commit removes after_build_2 from FIRED_TRIGGERS this fails here,
    // with the reason stated, rather than the gate silently passing because
    // its input stopped being overdue.
    expect([...FIRED_TRIGGERS]).toContain('after_build_2');
  });

  it('leaves an unresolved block alone while its trigger is unfired', () => {
    // Same file as above but for must_close_by, so the assertion isolates the
    // fired-set lookup and nothing else.
    const result = validateFile(fixturePath('unresolved-trigger-open.yaml'));

    expect(result.failures).toEqual([]);

    // And directly, so the zero above cannot be satisfied by a gate that
    // never ran. The fixture is a two-block stub, so gate 1 warns on it; the
    // warning channel is not this gate's concern.
    const doc: unknown = parse(
      readFileSync(fixturePath('unresolved-trigger-open.yaml'), 'utf8'),
    );
    expect(checkUnresolvedTriggers(doc)).toEqual([]);
    expect([...FIRED_TRIGGERS]).not.toContain('before_pilot_pass');
  });

  it('finds an unresolved block outside a citations list', () => {
    // The FIELD_SCHEMAS registration and gate 6's descent are separate
    // mechanisms, and the fixtures above only exercise a block inside a
    // citation. The marker may sit on any field or citation, so this pins
    // that gate 6 reaches a block hanging off a plain record field with no
    // citation anywhere near it. Built inline rather than as a fixture: it is
    // a property of the traversal, not of a record shape.
    const doc = {
      name: 'fixture_substance',
      some_block: {
        unresolved: [
          {
            class: 'vocabulary_gap',
            note: 'Inline fixture. Not derived from any source document.',
            opened: '2026-09-16',
            must_close_by: 'after_build_2',
          },
        ],
      },
    };

    const found = checkUnresolvedTriggers(doc);
    expect(found).toHaveLength(1);
    expect(found[0]?.path).toBe('some_block.unresolved[0]');
    expect(found[0]?.message).toContain('vocabulary_gap');
  });

  it('reads every entry of a list, not only the first', () => {
    // A gate that read entry 0 would let an overdue marker ride into the
    // corpus behind one that is still in date, which is the failure mode a
    // list introduces and the reason this test exists.
    const doc = {
      some_block: {
        unresolved: [
          {
            class: 'anchor_gap',
            note: 'Inline fixture, still in date.',
            opened: '2026-09-19',
            must_close_by: 'before_pilot_pass',
          },
          {
            class: 'no_slot',
            note: 'Inline fixture, overdue.',
            opened: '2026-09-16',
            must_close_by: 'after_build_2',
          },
        ],
      },
    };

    const found = checkUnresolvedTriggers(doc);
    expect(found).toHaveLength(1);
    expect(found[0]?.path).toBe('some_block.unresolved[1]');
    expect(found[0]?.message).toContain('no_slot');
  });
});

describe('a record file that is not a mapping', () => {
  const write = (body: string): string => {
    const dir = mkdtempSync(join(tmpdir(), 'validator-core-'));
    const file = join(dir, 'mint.yaml');
    writeFileSync(file, body);
    return file;
  };

  it('fails an empty file rather than reporting it conformant', () => {
    // Before this check an empty record file passed: the walk is key-driven,
    // so a document with no keys produced 0 checks and 0 failures, and the
    // validator called it conformant. Silence is not a pass.
    const result = validateFile(write(''));
    expect(result.failures).toHaveLength(1);
    expect(result.failures[0]?.path).toBe('(document)');
    expect(result.failures[0]?.message).toContain('parses to null');
  });

  it('fails a file that parses to a scalar', () => {
    const result = validateFile(write('just a line of prose\n'));
    expect(result.failures).toHaveLength(1);
    expect(result.failures[0]?.message).toContain('parses to string');
  });

  it('fails a file that parses to a list', () => {
    const result = validateFile(write('- one\n- two\n'));
    expect(result.failures).toHaveLength(1);
    expect(result.failures[0]?.message).toContain('parses to a list');
  });

  it('reports no required-block warnings for a document it could not read', () => {
    // A warning per missing block would bury the one finding that matters.
    expect(validateFile(write('')).warnings).toEqual([]);
  });
});

// The stop-at-a-block rule is only as good as the classifier behind it, and
// a misclassification is silent in both directions: call a block a leaf and
// the double report returns, call a leaf a block and the walk stops early
// and quietly covers less. Asserting the whole partition, rather than a
// sampled entry, means a new registration cannot land unclassified.
describe('isBlockSchema partitions FIELD_SCHEMAS', () => {
  const BLOCKS = [
    'applicability_conditions',
    'reference_values',
    'citations',
    'source_scope_evaluated',
    // Registered once every carrier held the wrapper. Each is a
    // discriminated union, which is why isBlockSchema needed its union limb:
    // without it these would classify as leaves and the walk would descend,
    // parsing their nested citations a second time.
    'contraindications',
    'pediatric_use',
    'overdose',
    'preclinical_safety',
    'other_warnings_and_precautions',
    'documented_adverse_reactions',
    'documented_interactions',
    'pregnancy_lactation',
    // Strict poled containers, so they classify through the object limb.
    'posology',
    'special_populations',
    'identifiers',
    'regulatory_classification',
    // A strictObject rather than a
    // discriminated union, so it classifies through isBlockSchema's object
    // limb and not its union limb, and the walk stops at it: its four keys are
    // checked by the one parse.
    'unresolved',
    // Registered because EMA monograph section 4.7 counts as part of the
    // safety surface. The only FINDINGS
    // block in this list: it is deliberately absent from REQUIRED_BLOCKS, so
    // no record owes it and its absence asserts nothing, and registration is
    // what makes it checked where a record does carry it.
    'driving_and_machinery',
  ];

  it('classifies every registered schema, blocks and leaves alike', () => {
    const actual = Object.keys(FIELD_SCHEMAS)
      .filter((k) => isBlockSchema(FIELD_SCHEMAS[k] as never))
      .sort();
    expect(actual).toEqual([...BLOCKS].sort());
  });

  it('treats an array of enums as a leaf, not a block', () => {
    // interaction_axis is the entry that makes the array unwrap load-bearing:
    // it is an array like reference_values and citations, but its elements
    // are enum members, so it has no children to have already validated.
    expect(isBlockSchema(FIELD_SCHEMAS['interaction_axis'] as never)).toBe(false);
  });
});

/**
 * The walk-stop hole, and the sweep that closes it.
 *
 * Registering a block stops the walk at that key, on the premise that the
 * block schema has validated everything beneath it. That premise holds for a
 * strict object and fails for a loose one, and the corpus had three blocks
 * where it failed: when measured, 48 of 725 citations sat below a registered
 * block's reach, under preclinical_safety and regulatory_classification (loose
 * `present` payloads) and under documented_adverse_reactions (a strict union
 * whose loose ITEM schema admits an undeclared `common`). Every fixture
 * below is one of those three shapes, built inline so it states the shape it
 * is testing rather than pointing at a file.
 *
 * Each asserts EXACTLY one failure. Zero means the sweep did not reach it;
 * two means it reached it and the block parse reported it as well, which is
 * the double report the dedupe exists to prevent.
 */
describe('validateDoc, citations below a registered block (the walk-stop hole)', () => {
  const badCitation = (): Record<string, unknown> => ({
    citation_status: 'cited',
    source: 'ema_hmpc',
    document_id: 'EMA/HMPC/000001/2020',
    section: '5.3',
    section_title: 'Preclinical safety data',
    evidence_locator: 'inline fixture',
    verbatim: null,
    evidence_outcome: 'banana_finding',
  });

  const shapes: [string, Record<string, unknown>][] = [
    [
      'preclinical_safety.<sub-block>.citations (loose present payload)',
      { preclinical_safety: { status: 'present', genotoxicity: { citations: [badCitation()] } } },
    ],
    [
      'regulatory_classification.ema_hmpc_status.<category>.citations (loose container)',
      {
        regulatory_classification: {
          ema_hmpc_status: {
            status: 'present',
            traditional_use: { citations: [badCitation()] },
          },
        },
      },
    ],
    [
      'documented_adverse_reactions.items[].common.citations (loose item schema)',
      {
        documented_adverse_reactions: {
          status: 'present',
          items: [{ reaction_class: 'gastrointestinal', common: { citations: [badCitation()] } }],
        },
      },
    ],
  ];

  for (const [name, doc] of shapes) {
    it(`reaches ${name}`, () => {
      const result = validateDoc(doc);
      // Exactly one in TOTAL, not one that matched a filter: each fixture is
      // well-formed apart from the single coined enum value, so a second
      // failure would mean it has stopped isolating the defect under test.
      expect(result.failures).toHaveLength(1);
      const hits = result.failures;
      // Reported at the citations list itself. Nothing above it declared the
      // list, so there is no block parse whose finding this could ride in.
      expect(hits[0]?.field).toBe('citations');
      expect(hits[0]?.path.endsWith('.citations')).toBe(true);
    });
  }

  it('reaches an unresolved marker on a sub-block no schema declares', () => {
    const result = validateDoc({
      preclinical_safety: {
        status: 'present',
        genotoxicity: {
          unresolved: [
            {
              class: 'banana_class',
              note: 'Inline fixture. Not derived from any source document.',
              opened: '2026-09-19',
              must_close_by: 'before_pilot_pass',
            },
          ],
        },
      },
    });
    const hits = result.failures.filter((f) => JSON.stringify(f).includes('banana_class'));
    expect(hits).toHaveLength(1);
    expect(hits[0]?.field).toBe('unresolved');
  });

  it('reports a defect on an ALREADY-REACHED citation exactly once', () => {
    // documented_interactions is a strict union: its own schema reaches this
    // citation and reports it. The sweep re-parses the same list and must
    // recognise the issue as already named. Two failures here would be the
    // double report; the assertion is the count, not the absence of a path.
    const result = validateDoc({
      documented_interactions: {
        status: 'present',
        items: [{ partner: 'warfarin', citations: [badCitation()] }],
      },
    });
    const hits = result.failures.filter((f) => JSON.stringify(f).includes('banana_finding'));
    expect(hits).toHaveLength(1);
    // Today's reporting is preserved for a citation the walk already reached:
    // the owning registered block, not the citations list.
    expect(hits[0]?.field).toBe('documented_interactions');
    expect(hits[0]?.path).toBe('documented_interactions');
  });

  it('fails a citations value that is not a list', () => {
    // The sweep hands the VALUE at the key to citationsSchema without looking
    // at it first. A scalar there is a real authoring slip (a citation written
    // as one object rather than a one-element list), and it must be a type
    // error rather than a crash or a pass.
    const result = validateDoc({
      preclinical_safety: { status: 'present', genotoxicity: { citations: badCitation() } },
    });
    expect(result.failures).toHaveLength(1);
    expect(result.failures[0]?.field).toBe('citations');
    expect(result.failures[0]?.message).toContain('array');
  });

  it('fails an unresolved value that is not a list', () => {
    // Same shape, and the likelier slip of the two: `unresolved` was once a
    // single slot, and a single marker written as a bare mapping is what the
    // one-slot form looked like.
    const result = validateDoc({
      preclinical_safety: {
        status: 'present',
        genotoxicity: {
          unresolved: {
            class: 'anchor_gap',
            note: 'Inline fixture. Not derived from any source document.',
            opened: '2026-09-19',
            must_close_by: 'before_pilot_pass',
          },
        },
      },
    });
    expect(result.failures).toHaveLength(1);
    expect(result.failures[0]?.field).toBe('unresolved');
    expect(result.failures[0]?.message).toContain('array');
  });

  it('reports two defects under one block as two failures, not one', () => {
    // The dedupe must be per ISSUE, not per block. A prefix-based suppression
    // would swallow the `common` defect because the block already failed for
    // the other one, which is the exact case that design was rejected for.
    const result = validateDoc({
      documented_adverse_reactions: {
        status: 'present',
        items: [
          {
            reaction_class: 'gastrointestinal',
            citations: [badCitation()],
            common: { citations: [badCitation()] },
          },
        ],
      },
    });
    const hits = result.failures.filter((f) => JSON.stringify(f).includes('banana_finding'));
    expect(hits).toHaveLength(2);
    expect(hits.map((h) => h.field).sort()).toEqual(['citations', 'documented_adverse_reactions']);
  });
});

/**
 * The permanent reach guard, run over the real corpus.
 *
 * Every citation and every unresolved marker in every record is mutated to an
 * illegal enum value, one at a time, and the validator must report EXACTLY one
 * failure for it. Zero means a block schema is hiding that list from the walk
 * and the sweep did not reach it either; more than one means a defect is being
 * reported twice. This is the test that fails when a future block schema
 * reintroduces the hole, which is the thing no gate noticed for months.
 *
 * It runs through validateDoc against documents parsed once per record.
 * Through validateFile it would re-parse the record for every mutation.
 *
 * Records are never written. The mutation is applied to the in-memory document
 * and reverted before the next one.
 */
describe('reach guard over the real corpus', () => {
  const load = (): { file: string; doc: Record<string, unknown> }[] =>
    readdirSync(RECORDS_DIR)
      .filter((f) => f.endsWith('.yaml'))
      .sort()
      .map((file) => ({
        file,
        doc: parse(readFileSync(join(RECORDS_DIR, file), 'utf8')) as Record<string, unknown>,
      }));

  /** Every object under a `key` list, at any depth, with its path. */
  const collect = (node: unknown, key: string, path = ''): { path: string; obj: any }[] => {
    const out: { path: string; obj: any }[] = [];
    if (Array.isArray(node)) {
      node.forEach((v, i) => out.push(...collect(v, key, `${path}[${i}]`)));
      return out;
    }
    if (node === null || typeof node !== 'object') return out;
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      const p = path === '' ? k : `${path}.${k}`;
      if (k === key && Array.isArray(v)) {
        v.forEach((el, i) => {
          if (el !== null && typeof el === 'object') out.push({ path: `${p}[${i}]`, obj: el });
        });
      }
      out.push(...collect(v, key, p));
    }
    return out;
  };

  /**
   * Reach, judged by FAILURE COUNT against a clean baseline.
   *
   * The record validates with zero failures untouched, so one mutation must
   * produce exactly one. Counting is the whole criterion. This used to filter
   * for failures whose JSON contained the coined value, which was only ever as
   * good as the `value` blob each Failure happens to carry: zod's enum message
   * does not echo the offending value, so a Failure that named the defect
   * without serializing the subtree would have been counted as a miss, and a
   * Failure that serialized a large enough subtree was counted as a hit
   * whatever it was actually about. Both directions are wrong and the second
   * one fired during this file's own development.
   */
  const probe = (listKey: string, field: string, bad: string): Record<string, string[]> => {
    const wrong: Record<string, string[]> = { dirty: [], zero: [], many: [] };
    for (const { file, doc } of load()) {
      // The baseline is part of the probe. Against a record that already fails,
      // a count of one would mean nothing.
      const clean = validateDoc(doc).failures.length;
      if (clean !== 0) {
        wrong.dirty!.push(`${file} has ${clean} failure(s) before any mutation`);
        continue;
      }
      for (const { path, obj } of collect(doc, listKey)) {
        const had = field in obj;
        const prev = obj[field];
        obj[field] = bad;
        const n = validateDoc(doc).failures.length;
        if (had) obj[field] = prev;
        else delete obj[field];
        if (n === 0) wrong.zero!.push(`${file} ${path}`);
        else if (n > 1) wrong.many!.push(`${file} ${path} -> ${n}`);
      }
    }
    return wrong;
  };

  it('reaches every citation in the corpus, exactly once each', () => {
    const total = load().reduce((n, r) => n + collect(r.doc, 'citations').length, 0);
    // A probe that found nothing would report clean. The shipped record holds
    // 115; the floor is what stops a silently narrowed walk passing.
    expect(total).toBeGreaterThanOrEqual(115);
    const wrong = probe('citations', 'evidence_outcome', 'banana_finding');
    expect(wrong.dirty).toEqual([]);
    expect(wrong.zero).toEqual([]);
    expect(wrong.many).toEqual([]);
    // 15 s: 1.9-2.3 s locally in the full suite, ~2x on CI, near the 5 s default.
  }, 15_000);

  /**
   * Every registered key, everywhere it occurs. The generalisation of the two
   * guards above from two keys to all of them.
   *
   * A registered key under a loose payload is checked by nothing: the walk
   * stops at the enclosing block and the block admits the key unread. When
   * measured, NO RECORD DID THAT -- every occurrence of every registered key
   * was reached -- but all but two would be hidden if one did, and the two
   * that would not are citations and unresolved, which sweepCitationCarriers
   * covers.
   * So this guard pins a property the corpus has rather than one the validator
   * enforces, and it is the thing that turns the day a record first authors
   * such a key into a red build instead of a silent pass.
   *
   * The sentinel is a bare string, verified below to be rejected by every
   * registered schema, so one value probes every key whatever its type.
   */
  it('reaches every occurrence of every registered key in the corpus', () => {
    const SENTINEL = '__illegal_probe_value__';
    // No schema may accept the sentinel, or a key would read as unreached for
    // want of a defect rather than for want of being checked.
    for (const [key, schema] of Object.entries(FIELD_SCHEMAS)) {
      expect(`${key}:${schema.safeParse(SENTINEL).success}`).toBe(`${key}:false`);
    }

    interface Pos { file: string; path: string; key: string; parent: any; doc: unknown }
    const positions: Pos[] = [];
    for (const { file, doc } of load()) {
      // The baseline is part of the probe: against a record that already fails,
      // a count of one would mean nothing.
      expect(`${file}:${validateDoc(doc).failures.length}`).toBe(`${file}:0`);
      (function walk(node: any, path: string): void {
        if (Array.isArray(node)) return node.forEach((v, i) => walk(v, `${path}[${i}]`));
        if (node === null || typeof node !== 'object') return;
        for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
          const p = path === '' ? k : `${path}.${k}`;
          if (FIELD_SCHEMAS[k] !== undefined) {
            positions.push({ file, path: p, key: k, parent: node, doc });
          }
          walk(v, p);
        }
      })(doc, '');
    }
    // A probe that enumerated nothing would report clean. The shipped record
    // holds 775 registered-key positions; the floor is what stops a silently
    // narrowed walk passing.
    expect(positions.length).toBeGreaterThanOrEqual(775);

    const unreached: string[] = [];
    const multi: string[] = [];
    for (const pos of positions) {
      const prev = pos.parent[pos.key];
      pos.parent[pos.key] = SENTINEL;
      const n = validateDoc(pos.doc).failures.length;
      pos.parent[pos.key] = prev;
      if (n === 0) unreached.push(`${pos.file} ${pos.path}`);
      else if (n > 1) multi.push(`${pos.file} ${pos.path} -> ${n}`);
    }
    expect(unreached).toEqual([]);

    // No position reports twice. One once did, and it was a CASCADE rather
    // than a double report: destroying a record's source_scope_evaluated also
    // stopped gate 5 reading the cited-source roster out of it. Gate 5 has
    // retired, and the absence gate that replaced it (part of the full
    // pipeline, not shipped here) runs beside validateDoc rather than inside
    // it, so a NEW multi-report -- which would be the double report -- fails
    // here.
    expect(multi).toEqual([]);
    // 20 s: 3.4-3.7 s locally in the full suite, ~2x on CI, over the 5 s default.
  }, 20_000);

  it('reaches every unresolved marker in the corpus, exactly once each', () => {
    const total = load().reduce((n, r) => n + collect(r.doc, 'unresolved').length, 0);
    // The shipped record holds 10 markers.
    expect(total).toBeGreaterThanOrEqual(10);
    const wrong = probe('unresolved', 'class', 'banana_class');
    expect(wrong.dirty).toEqual([]);
    expect(wrong.zero).toEqual([]);
    expect(wrong.many).toEqual([]);
  });
});
