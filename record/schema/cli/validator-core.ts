/**
 * Record-level enum-conformance validation core.
 *
 * Walks a parsed record and validates every claim-evidence-tagged field
 * against its Zod schema. Pure module: no CLI, no process.exit, no
 * side effects on import. Consumed by validate.ts (single-record CLI)
 * and by the full pipeline's corpus-wide runner (not shipped here).
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isAlias, isMap, isScalar, isSeq, parse, parseDocument } from 'yaml';
import * as z from 'zod';
import {
  attributionLevelSchema,
  citationStatusSchema,
  interactionAxisSchema,
  axisDoseDependenceSchema,
  applicabilityConditionsSchema,
  evidenceOutcomeSchema,
  evidenceMethodologySchema,
  evaluationStatusSchema,
  frequencyQualifierSchema,
  sourcePositionSchema,
  sourceDirectiveSchema,
  citationsSchema,
  unresolvedListSchema,
} from '../claim-evidence/index.js';
import { FIRED_TRIGGERS } from './check-triggers.js';
import { checkRecordComments } from '../record-comments/check.js';
import { PROSE_STAMP_CLASS, PROSE_STAMP_CONDITION, checkProseStampNames } from '../record-prose/check.js';
import { readRoomManifest } from '../manifest/manifestRow.js';
import { SOURCE_DEFINITIONS, isSourceToken } from '../manifest/sourceToken.js';
import {
  REGISTRY,
  GOVERNED_ENUMS,
  BOOKKEEPING_VALUES,
  documentTypeOf,
  rowFor,
  governs,
  admits,
  type GovernedEnum,
} from '../defined-terms/registry.js';
import {
  referenceValuesSchema,
  isRegisteredConstruct,
} from '../reference-values/index.js';
import {
  requiredBlocksFor,
  REQUIRED_BLOCKS,
  CONDITIONAL_BLOCKS,
  LISTED_TOP_LEVEL_KEYS,
  sourceScopeEvaluatedSchema,
  REQUIRED_POLES,
  contraindicationsSchema,
  drivingAndMachinerySchema,
  pediatricUseSchema,
  overdoseSchema,
  preclinicalSafetySchema,
  otherWarningsAndPrecautionsSchema,
  documentedAdverseReactionsSchema,
  documentedInteractionsSchema,
  pregnancyLactationSchema,
  posologySchema,
  specialPopulationsSchema,
  identifiersSchema,
  regulatoryClassificationSchema,
} from '../record-blocks/index.js';

// Hand-mapped: record field name (snake_case, as authored in YAML) -> its
// claim-evidence Zod schema. Each schema's own safeParse handles
// array-typed and object-typed fields without special-casing.
export const FIELD_SCHEMAS: Record<string, z.ZodType> = {
  attribution_level: attributionLevelSchema,
  citation_status: citationStatusSchema,
  interaction_axis: interactionAxisSchema,
  axis_dose_dependence: axisDoseDependenceSchema,
  applicability_conditions: applicabilityConditionsSchema,
  evidence_outcome: evidenceOutcomeSchema,
  evidence_methodology: evidenceMethodologySchema,
  evaluation_status: evaluationStatusSchema,
  frequency_qualifier: frequencyQualifierSchema,
  source_position: sourcePositionSchema,
  source_directive: sourceDirectiveSchema,
  // Block-level (not a claim-evidence leaf): the whole reference_values
  // array is validated by one strict schema applied at this key. Its inner
  // enums (basis, status, absence_reason, evidence_basis) and the open
  // `construct` string are enforced INSIDE that schema and are deliberately
  // NOT registered here as leaf keys - those names are generic (e.g.
  // `status` is the top-level record field) and would mis-fire if keyed
  // individually. The per-authority construct registry is enforced on top of
  // the schema parse by checkConstructRegistry (below).
  reference_values: referenceValuesSchema,
  // Block-level, same pattern as reference_values: the whole citations list
  // is validated by one strict element schema applied at this key, at every
  // depth and under every parent a citations list appears. The 14 leaf keys
  // above that also appear INSIDE a citation stay registered here as well;
  // they are reached through citationElementSchema now rather than by the
  // walk descending, and they still need their own registration for the
  // block-level fields (source_position on a regulatory_classification
  // entry, citation_status on a citation_gaps entry) that sit outside a
  // citations list.
  //
  // The mechanism and effect fields are citation-only and reached through the
  // element schema alone. They are NOT registered by name
  // here: the walk matches a key at any depth, and st_johns_wort prints a
  // block-level `mechanism:` and `effect:` as free strings (records lines 220
  // and 396 when measured) that the object schemas would refuse.
  citations: citationsSchema,
  // Block-level. The unresolved marker, registered here as well as on
  // citationElementSchema, because the marker may sit on any field or citation:
  // inside a citations list it is reached through that element schema, and this
  // registration is what reaches the ones that are not. It is a strictObject,
  // so isBlockSchema stops the walk here and its four keys are checked by the
  // one parse. Registering it does NOT enforce the firing rule; that is
  // checkUnresolvedTriggers, a record-level gate below.
  unresolved: unresolvedListSchema,
  // Block-level, and STRICT. It was loose while its key set was undeclared;
  // the set was derived from all 20 carriers with the validator's own parser
  // and the block closed strict. Six keys are required (policy_class, policy_version, evaluated_on, next_review_due,
  // tier_1_sources, tier_3_policy) and three are optional (tier_2_sources,
  // retained_sources_note, tier_3_sources, the partner labels the absence
  // derivation excludes). Tier elements are strict, and a repeated source
  // token in one tier must carry a distinguishing document_id. See
  // schema/record-blocks/sourceScopeEvaluated.ts.
  source_scope_evaluated: sourceScopeEvaluatedSchema,

  // The required blocks, registered once every carrier holds the wrapper.
  // Registration is per-key and corpus-wide, so a block could not land here
  // until the last record carrying it was migrated: ginkgo and st_johns_wort
  // were the last to hold the unwrapped form, and their migration is what
  // unblocked this list.
  //
  // Each of these is a discriminated union, which zod reports as def.type
  // 'union'. isBlockSchema's union limb is what stops the walk here; without
  // it the citations list inside every one of them would be parsed twice.
  contraindications: contraindicationsSchema,
  pediatric_use: pediatricUseSchema,
  // A FINDINGS block, and the only one registered here. It is not in
  // REQUIRED_BLOCKS and never will be, so no record owes it and its absence
  // asserts nothing; registration is what makes it CHECKED where a record does
  // carry it. It has no carrier at this commit, so registering costs no
  // migration: the first record to author it meets the wrapper on arrival
  // rather than being retrofitted into it. See schema/record-blocks/blocks.ts
  // on the opening of section 4.7.
  driving_and_machinery: drivingAndMachinerySchema,
  // hepatotoxicity_assessment is NOT registered, and the reason is a finding
  // rather than an oversight. Registering it surfaced that ginkgo's block
  // carries `regulator_disposition: not_stated_in_held_sources` with
  // `citations: []` -- an empty list. The block asserts a disposition and
  // cites nothing for it, which is the assertion-in-the-corpus's-own-voice
  // case the schema's required citations exists to catch, and it predates the
  // wrapper migration.
  //
  // It cannot be migrated honestly. `present` needs a citation there is none
  // of, and an absence status would say no checked document addresses a question the block answers with
  // a disposition, which is a different claim from the one the record makes.
  // So the defect is left standing, visible, for the ginkgo backfill to
  // resolve against sources. The block registers then.
  overdose: overdoseSchema,
  preclinical_safety: preclinicalSafetySchema,
  other_warnings_and_precautions: otherWarningsAndPrecautionsSchema,
  documented_adverse_reactions: documentedAdverseReactionsSchema,
  documented_interactions: documentedInteractionsSchema,
  pregnancy_lactation: pregnancyLactationSchema,
  // posology and special_populations. Until they were registered their poles
  // were parsed by nothing: a status of `bogus` on iron's special_populations.renal_impairment passed
  // the corpus-wide run, as did any key added under ginkgo's posology. Every carrier
  // parsed as it stood (ginkgo and iron for posology, iron alone for
  // special_populations). Both are strict poled containers, so isBlockSchema's
  // object limb stops the walk here and the one parse covers every pole,
  // which is also what puts their absence variants under a gate.
  posology: posologySchema,
  special_populations: specialPopulationsSchema,

  // The identifiers sub-status, reached by the walk descending through
  // substance_identity, which is deliberately NOT registered: its own key set
  // has not been derived, and registering a loose container here would stop
  // the walk before it ever reached this key.
  identifiers: identifiersSchema,

  // The regulator roster. Its two wrapped members are checked; the container
  // stays loose so the findings keys beside them (atc_code and the three
  // record-specific regulator keys) are admitted, and so us_regulatory_status
  // passes through unwrapped for now.
  regulatory_classification: regulatoryClassificationSchema,
};

/**
 * Registry gate for the reference_values block. The schema admits any
 * lowercase snake_case construct string; this check pins which constructs a
 * given source authority may actually use. Runs only after the block's schema
 * parse succeeds (so `block` is a validated array of elements). Returns one
 * Failure per element whose (source.authority, construct) pair is not
 * registered in schema/reference-values/constructRegistry.ts.
 */
function checkConstructRegistry(block: unknown, path: string): Failure[] {
  const out: Failure[] = [];
  if (!Array.isArray(block)) return out;
  block.forEach((el, i) => {
    const authority = (el as { source?: { authority?: unknown } })?.source
      ?.authority;
    const construct = (el as { construct?: unknown })?.construct;
    if (typeof authority !== 'string' || typeof construct !== 'string') return;
    if (!isRegisteredConstruct(authority, construct)) {
      out.push({
        path: `${path}[${i}].construct`,
        field: 'construct',
        value: construct,
        message: `construct '${construct}' is not registered for source authority '${authority}' (register it in schema/reference-values/constructRegistry.ts)`,
      });
    }
  });
  return out;
}

/**
 * Does this schema validate a whole block (an object, or an array of
 * objects), rather than a single leaf value?
 *
 * A block schema declares its own children, so the walk must NOT descend past
 * it: a child that is ALSO registered in FIELD_SCHEMAS in its own right would
 * otherwise be parsed a second time, standalone, and a single coined key would
 * be reported twice -- once by the parent's parse and once by the child's.
 * The first instance was dose_range nested inside
 * applicability_conditions, since retired; applicability_conditions inside
 * the citation element, and citations inside the findings blocks, are
 * instances now. The rule is general, so a future block registered at both
 * levels does not reintroduce the duplicate.
 *
 * WHAT THIS FUNCTION DOES NOT ESTABLISH, stated because it was read as
 * establishing it for months. It classifies by def.type and NEVER TESTS
 * STRICTNESS, so `true` means "this schema declares children", not "this
 * schema has validated everything beneath its key". Those coincide for a
 * strict object and part company for a loose one: a loose payload admits an
 * undeclared sub-object unread, and stopping the walk there used to mean
 * nothing beneath it was checked by anything. When measured, that hid
 * 48 of the corpus's 725 citations, under preclinical_safety and
 * regulatory_classification (loose payloads) and under
 * documented_adverse_reactions (a strict union whose loose ITEM schema admits
 * st_johns_wort's `common`). The hole is closed for citations and unresolved
 * lists by sweepCitationCarriers, which reaches them on the document's shape
 * rather than through this test.
 *
 * WHAT IS STILL OPEN, measured rather than estimated. A key
 * sitting under a loose payload is checked by nothing, and that is true
 * whether or not the key is registered here: of the 29 keys in FIELD_SCHEMAS,
 * 27 are invisible under preclinical_safety's `present` payload, the two
 * exceptions being citations and unresolved. The five loose carriers are
 * preclinical_safety, overdose, regulatory_classification, the loose ITEM
 * schema under documented_adverse_reactions, and any sub-object none of them
 * declares. NO RECORD AUTHORS SUCH A KEY TODAY: all 4834 occurrences of the 29
 * keys across the 21 records are reached, which is why this is a latent hole
 * and not a live defect, and why nothing here was changed to close it. The
 * corpus-wide guard in validator-core.test.ts is what turns the first record
 * to author one into a red build. Closing it for real means either declaring
 * those payloads or generalising the sweep from two keys to all of them, and
 * that is a decision rather than a fix.
 *
 * Leaf schemas declare no children of their own, so the walk continues past
 * them exactly as before. The two tiers are distinguished from the schema
 * itself rather than from a second hand-maintained list of block keys:
 * such a list would be a copy of FIELD_SCHEMAS free to fall out of step with
 * it silently, which is the class of failure this module exists to catch.
 *
 * Array wrappers are unwrapped before the test, because the element type is
 * what decides: reference_values is an array of strict objects (a block),
 * while interaction_axis is an array of enum members (a leaf).
 *
 * Unions are admitted when EVERY option is object-typed. The required-block
 * wrapper (schema/record-blocks/checkedBlock.ts) is a discriminated union of
 * object variants, one per block status, and zod reports a discriminated
 * union's def.type as 'union', not 'object' (verified against zod 4.4.3).
 * Without this limb every wrapped block would be classified a leaf, the walk
 * would descend past it, and the citations list inside it would be parsed a
 * second time standalone.
 * That is the duplicate this function exists to prevent, and it would
 * have returned across a dozen blocks at once.
 *
 * NOT all STRICT objects, which this paragraph used to say. Every absence
 * variant is strict (`stated_absence`, `not_found`,
 * `not_found_in_checked_sources` and `not_assessed`); the `present`
 * variant carries whatever payload the block already had, and for
 * preclinical_safety and overdose that payload is LOOSE. So a union of
 * objects has NOT necessarily validated its subtree either, and the test
 * being EVERY option rather than any buys less than it appears to: it rules
 * out a union mixing an object with a scalar, and it does not establish that
 * the options declare what is under them.
 */
export function isBlockSchema(schema: z.ZodType): boolean {
  let inner: unknown = schema;
  let guard = 0;
  while (defType(inner) === 'array' && guard++ < 8) {
    inner = (inner as { element?: unknown }).element;
  }
  if (defType(inner) === 'object') return true;
  if (defType(inner) === 'union') {
    const options = (inner as { def?: { options?: unknown[] } }).def?.options;
    return (
      Array.isArray(options) &&
      options.length > 0 &&
      options.every((opt) => defType(opt) === 'object')
    );
  }
  return false;
}

function defType(schema: unknown): string | undefined {
  return (schema as { def?: { type?: string } } | undefined)?.def?.type;
}

/**
 * Render a Zod issue's path as a dotted/indexed suffix: [0].evidence_outcome.
 *
 * A block schema is reported against the block that owns the parse, not
 * against the innermost offending key. That keeps one defect to one
 * finding, but on its own it costs the author the two things they need to
 * find it: WHICH element of the list, and WHICH field inside it. The
 * citations block makes that acute, since one list routinely carries dozens
 * of elements and `citations: Invalid option ...` does not locate anything.
 *
 * So the location moves into the message while the reported path stays on
 * the owning block. Nothing is deduplicated and no finding is relocated;
 * this is strictly additive detail. An issue at the block's own level (an
 * unrecognized key directly on the object) has an empty path and reads
 * exactly as it did before.
 */
function formatIssuePath(segments: ReadonlyArray<PropertyKey>): string {
  return segments
    .map((seg) => (typeof seg === 'number' ? `[${seg}]` : `.${String(seg)}`))
    .join('')
    .replace(/^\./, '');
}

/** An issue's path made absolute against the path of the value that was parsed. */
function absoluteIssuePath(base: string, segments: ReadonlyArray<PropertyKey>): string {
  const rel = formatIssuePath(segments);
  if (rel === '') return base;
  return rel.startsWith('[') ? `${base}${rel}` : `${base}.${rel}`;
}

/**
 * Every citations and unresolved list in a record, at every depth.
 *
 * STRUCTURE-AGNOSTIC BY DESIGN. It descends on the shape of the document and
 * asks nothing about block registration, so a list inside a loose payload, a
 * sub-block no schema declares, or a block coined next year is reached on the
 * same terms as one at a registered block's own top level. The alternative
 * was teaching each block schema about its own nesting, which is the same
 * rule written once per block and re-broken by the next coined key: measured
 * once, 48 of 725 citations sat below a registered block's reach
 * across three blocks and nine records, and one of the three was a strict
 * union nobody suspected (st_johns_wort's `common`).
 *
 * It does not descend INTO a list it hands over. The 13 claim-evidence leaf
 * keys registered in FIELD_SCHEMAS also appear inside a citation, and the
 * element schema checks them there; walking in as well would report each
 * twice, which is the rule this file already enforces one level up.
 */
function sweepCitationCarriers(
  node: unknown,
  path: string,
  visit: (path: string, field: string, value: unknown, schema: z.ZodType) => void,
): void {
  if (Array.isArray(node)) {
    node.forEach((item, i) => sweepCitationCarriers(item, `${path}[${i}]`, visit));
    return;
  }
  if (node === null || typeof node !== 'object') return;
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    const childPath = path ? `${path}.${key}` : key;
    if (key === 'citations') {
      visit(childPath, key, value, citationsSchema);
      continue;
    }
    if (key === 'unresolved') {
      visit(childPath, key, value, unresolvedListSchema);
      continue;
    }
    sweepCitationCarriers(value, childPath, visit);
  }
}

export interface Failure {
  path: string;
  field: string;
  value: unknown;
  message: string;
}

export interface ValidateResult {
  checks: number;
  failures: Failure[];
  /**
   * Non-fatal findings. Reported by the CLIs, ignored by their exit codes.
   *
   * The channel exists for gate 1 (required-block presence), which cannot pass
   * until every record is backfilled. Shipping it as an error would paint every
   * record red until then and train the reader to ignore the validator, so it
   * warns. Making it gating is one line: move the gate's output from `warnings`
   * to `failures`.
   *
   * Additive on purpose. Existing callers read `failures` and `checks` and are
   * unaffected.
   */
  warnings: Failure[];
}

/**
 * Run a record's context-reading gates and turn a throw into a failure of that
 * record. A throw is never dropped: the corpus-wide runner once caught one and printed
 * the record as checked with 0 mismatches.
 */
export function runGuarded(failures: Failure[], run: () => void): void {
  try {
    run();
  } catch (err) {
    failures.push({
      path: '(record)',
      field: 'gate_threw',
      value: undefined,
      message: `a gate threw, so this record is not checked: ${err instanceof Error ? err.message : String(err)}`,
    });
  }
}

/**
 * The record-comment gate (schema/record-comments/check.ts): a record's comment
 * lines are the title, rule-heading-rule blocks and the end line, and nothing
 * else; there is no sub-heading class. It reads the record's TEXT, because a
 * parsed document has no comments left in it, so validateFile runs it and
 * validateDoc cannot. GATING: its findings are failures.
 */
export function checkCommentGrammar(text: string): Failure[] {
  return checkRecordComments(text).map((f) => ({
    path: `line ${f.line}`,
    field: f.failureClass,
    value: f.text,
    message: f.detail,
  }));
}

/**
 * The prose-stamp gate (schema/record-prose/check.ts): a
 * prose value outside version_history and the source-text keys names no stamp
 * field or stamp value. GATING: its findings are failures. validateFile runs it
 * on a path under ingredients/records/, as it does the comment gate.
 */
export function checkProseStamps(doc: unknown, file: string): Failure[] {
  return checkProseStampNames(doc).map((f) => ({
    path: f.path,
    field: PROSE_STAMP_CLASS,
    value: f.tokens.join(', '),
    message: `${file} at ${f.path} names ${f.tokens.map((t) => `"${t}"`).join(', ')}; ${PROSE_STAMP_CONDITION}`,
  }));
}

/** A corpus record file: ingredients/records/<name>.yaml, the gate's whole scope. */
export function isRecordPath(file: string): boolean {
  return /(^|[\\/])ingredients[\\/]records[\\/][^\\/]+\.yaml$/.test(file);
}

/**
 * The top-level key gate: every top-level key of a record is registered, in
 * the required-blocks registry (REQUIRED_BLOCKS or CONDITIONAL_BLOCKS) or in
 * LISTED_TOP_LEVEL_KEYS, and nowhere else. FIELD_SCHEMAS names keys at every
 * depth, so its membership registers no top-level key. Without the gate a key
 * could be coined to match a heading and carry a note. A record whose root is not a block mapping gets one
 * finding saying what the root is, and no key is read (checkRecordRoot).
 * GATING: its findings are failures. validateFile runs it on a path under
 * ingredients/records/, as it does the comment gate.
 */
export const TOP_LEVEL_KEY_CLASS = 'top_level_key_unregistered';
export const RECORD_ROOT_CLASS = 'record_root_not_block_mapping';

export const TOP_LEVEL_KEY_NOT_CHECKED: readonly string[] = [
  'keys below the top level, which are checked only inside a block whose schema is strict',
];

/**
 * The registries a top-level key is read against. The gate takes them as an
 * argument, defaulting to the real ones, so a test can register a key in one
 * place only.
 */
export interface TopLevelKeyRegistries {
  requiredBlocks: readonly string[];
  conditionalBlocks: Record<string, readonly string[]>;
  listed: readonly string[];
}

export const TOP_LEVEL_KEY_REGISTRIES: TopLevelKeyRegistries = {
  requiredBlocks: REQUIRED_BLOCKS,
  conditionalBlocks: CONDITIONAL_BLOCKS,
  listed: LISTED_TOP_LEVEL_KEYS,
};

export function isRegisteredTopLevelKey(
  key: string,
  registries: TopLevelKeyRegistries = TOP_LEVEL_KEY_REGISTRIES,
): boolean {
  if (registries.requiredBlocks.includes(key)) return true;
  if (Object.values(registries.conditionalBlocks).some((list) => list.includes(key))) return true;
  return registries.listed.includes(key);
}

/**
 * What a record's root is when it is not a block mapping, or null when it is.
 * Read through parseDocument, because parse turns a tagged collection into an
 * object with its keys gone (!!set and !!omap parse to {}) and a flow mapping
 * into the same object as a block one.
 */
export function recordRootShape(text: string): string | null {
  const root = parseDocument(text).contents;
  if (root === null) return 'empty';
  if (isAlias(root)) return 'an alias';
  if (isScalar(root)) return root.value === null ? 'null' : 'a scalar';
  if (root.tag) return `a tagged collection (${root.tag})`;
  if (isSeq(root)) return 'a list';
  if (isMap(root)) return root.flow ? 'a flow mapping' : null;
  return 'not a mapping';
}

export function checkRecordRoot(text: string, file: string): Failure[] {
  const shape = recordRootShape(text);
  if (shape === null) return [];
  return [
    {
      path: '(root)',
      field: RECORD_ROOT_CLASS,
      value: shape,
      message: `${file} has a root that is ${shape}; a record's root is a block mapping of top-level keys`,
    },
  ];
}

export function checkTopLevelKeys(
  doc: unknown,
  file: string,
  registries: TopLevelKeyRegistries = TOP_LEVEL_KEY_REGISTRIES,
): Failure[] {
  if (doc === null || typeof doc !== 'object' || Array.isArray(doc)) return [];
  return Object.keys(doc as Record<string, unknown>)
    .filter((key) => !isRegisteredTopLevelKey(key, registries))
    .map((key) => ({
      path: key,
      field: TOP_LEVEL_KEY_CLASS,
      value: key,
      message:
        `${file} has the top-level key "${key}", which is not registered; a top-level key is registered in ` +
        'REQUIRED_BLOCKS or CONDITIONAL_BLOCKS (schema/record-blocks/requiredBlocks.ts) or in ' +
        'LISTED_TOP_LEVEL_KEYS (schema/record-blocks/topLevelKeys.ts)',
    }));
}

/**
 * Gate 1: required-block presence.
 *
 * Runs against the document ROOT, not inside the walk. The walk is key-driven
 * (it iterates Object.entries and looks each key up in FIELD_SCHEMAS), so it
 * visits only keys that exist and can never fire on a missing block. Absence
 * is exactly what this gate is for, so it has to be its own pass.
 *
 * Emitted as warnings, not failures.
 */
export function checkRequiredBlocks(doc: unknown): Failure[] {
  if (doc === null || typeof doc !== 'object' || Array.isArray(doc)) return [];
  const record = doc as Record<string, unknown>;
  const expected = requiredBlocksFor(record['substance_type']);
  const out: Failure[] = expected
    .filter((block) => !(block in record))
    .map((block) => ({
      path: block,
      field: block,
      value: undefined,
      message: `required block '${block}' is absent, and an absent block is indistinguishable from a checked absence: every required block is carried, and a question no source answers takes an absence status rather than an omitted block`,
    }));

  // A poled block answers one question per pole, so a missing pole is a
  // missing answer for exactly the same reason a missing block is. Reported on
  // the same channel: the fertility pole is optional in the schema so the
  // twelve migratable blocks can land, and this is what stops the other
  // seven from being silently forgiven.
  for (const [block, poles] of Object.entries(REQUIRED_POLES)) {
    const value = record[block];
    if (value === null || typeof value !== 'object' || Array.isArray(value)) continue;
    for (const pole of poles) {
      if (pole in (value as Record<string, unknown>)) continue;
      out.push({
        path: `${block}.${pole}`,
        field: pole,
        value: undefined,
        message: `required pole '${pole}' is absent from '${block}', and an absent pole is a missing answer: each pole of a poled block carries its own status`,
      });
    }
  }
  return out;
}

/**
 * Gate 5 was here: record-level sources_checked coverage. It asked whether
 * some sources_checked list named every cited document, and it could not tell
 * a document an extraction reads from one it does not. It retired, replaced by
 * the absence gate, part of the full pipeline and not shipped here. That gate
 * needs the room's manifest and extraction state, which a parsed record alone
 * does not carry, so it runs beside this function rather than inside it.
 */

/**
 * Gate 6: an unresolved block whose must_close_by trigger has fired.
 *
 * The marker carries a firing condition so a deferral is a dated
 * commitment and not a sentence. A block is legitimately open until its
 * trigger's event happens; once it has, the block is overdue and closing it
 * means one of exactly two things, resolving it in place or promoting it to an
 * F-number, never a third.
 *
 * Which triggers have fired is not derivable from the repo. The list is read
 * from FIRED_TRIGGERS in check-triggers.ts rather than re-listed here, so the
 * two cannot fall out of step.
 *
 * THIS GATE FIRES REGARDLESS OF RECORD STATUS, and the marker's rule is
 * narrower than that: a record may not LEAVE AUTHORING STATUS carrying an
 * overdue block. There is no authoring status to read. Records carry a bare
 * `status` string with two values corpus-wide and no schema behind it, and a
 * block-status discriminator is what "leave authoring status" needs to mean
 * anything. Until that lands, checking every record is the honest
 * approximation: it is stricter than the rule, never laxer, so it cannot let
 * an overdue block through. It costs nothing at HEAD, where no record carries
 * a block at all.
 *
 * Runs at record level rather than inside the walk because a fired trigger is
 * a fact about the repo's calendar, not about the value under the key: the
 * walk's schema parse can only check the block's shape, which
 * unresolvedBlockSchema already does.
 */
export function checkUnresolvedTriggers(doc: unknown): Failure[] {
  const fired = new Set<string>(FIRED_TRIGGERS);
  const out: Failure[] = [];

  function walk(node: unknown, path: string): void {
    if (Array.isArray(node)) {
      node.forEach((item, i) => walk(item, `${path}[${i}]`));
      return;
    }
    if (node === null || typeof node !== 'object') return;
    for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
      const childPath = path ? `${path}.${key}` : key;
      if (key === 'unresolved') {
        // Shape is the walk's job, not this gate's: a marker that fails
        // unresolvedListSchema is already one failure, and re-reporting it
        // here would make one defect two findings. So read the two
        // fields defensively and stay silent on anything malformed.
        //
        // EVERY entry, not the first. The key holds a list, and a gate that
        // read one entry would let a second overdue marker ride into the
        // corpus behind a first that is still in date.
        const entries = Array.isArray(value) ? value : [value];
        entries.forEach((entry, i) => {
          const block = entry as Record<string, unknown> | null;
          if (block === null || typeof block !== 'object') return;
          const trigger = block['must_close_by'];
          const cls = block['class'];
          if (typeof trigger === 'string' && fired.has(trigger)) {
            out.push({
              path: `${childPath}[${i}]`,
              field: 'must_close_by',
              value: trigger,
              message:
                `unresolved marker (class '${String(cls)}') carries must_close_by ` +
                `'${trigger}', which has fired; close it in place or promote it to an ` +
                `issue in the project's issue list, whose id the marker then carries`,
            });
          }
        });
        // A marker declares no nested marker, so there is nothing below to find.
        continue;
      }
      walk(value, childPath);
    }
  }

  walk(doc, '');
  return out;
}

/**
 * Read, parse, and validate a single record file.
 * State is local to each call, so this is safe to invoke in a loop across
 * many records without count/failure leakage between them.
 * Throws on read/parse error (callers map this to their own exit code).
 */
export function validateFile(file: string): ValidateResult {
  const text = readFileSync(file, 'utf8');
  const doc: unknown = parse(text);
  const res = validateDoc(doc);
  if (isRecordPath(file)) {
    res.failures.push(...checkCommentGrammar(text));
    const root = checkRecordRoot(text, file);
    res.failures.push(...(root.length > 0 ? root : checkTopLevelKeys(doc, file)));
    res.failures.push(...checkProseStamps(doc, file));
  }
  return res;
}

/**
 * Validate an already-parsed record document.
 *
 * Split out of validateFile so a caller can validate many variants of one
 * record without re-reading and re-parsing it each time. The permanent reach
 * test does exactly that, 725 times, and through validateFile it would spend
 * its whole budget in the YAML parser.
 */
export function validateDoc(doc: unknown): ValidateResult {
  const failures: Failure[] = [];
  let checks = 0;
  /**
   * Absolute paths of issues a block parse has already reported.
   *
   * The sweep below re-parses every citations and unresolved list, including
   * the ones a strict block schema already covered. This is what keeps one
   * defect to one failure: an issue a block parse named is not named again.
   * Paths, not messages, because the two sides format the same defect
   * differently and a string compare would drift.
   */
  const reportedIssuePaths = new Set<string>();

  function walk(node: unknown, path: string): void {
    if (Array.isArray(node)) {
      node.forEach((item, i) => walk(item, `${path}[${i}]`));
      return;
    }
    if (node !== null && typeof node === 'object') {
      for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
        const childPath = path ? `${path}.${key}` : key;
        // Owned by the sweep, at every depth and under every parent. The walk
        // neither checks nor descends here: doing both would report a defect
        // the sweep also reports, and the sweep is the one that reaches lists
        // the walk cannot see.
        if (key === 'citations' || key === 'unresolved') continue;
        // An own property only: a key such as constructor or __proto__ would
        // otherwise read an inherited member as a schema and throw.
        const schema = Object.prototype.hasOwnProperty.call(FIELD_SCHEMAS, key) ? FIELD_SCHEMAS[key] : undefined;
        let descend = true;
        if (schema) {
          checks++;
          const result = schema.safeParse(value);
          if (!result.success) {
            for (const iss of result.error.issues) {
              reportedIssuePaths.add(absoluteIssuePath(childPath, iss.path));
            }
            failures.push({
              path: childPath,
              field: key,
              value,
              message: result.error.issues
                .map((iss) => {
                  const where = formatIssuePath(iss.path);
                  return where ? `${where}: ${iss.message}` : iss.message;
                })
                .join('; '),
            });
          } else if (key === 'reference_values') {
            // Schema shape is valid; now enforce the per-authority construct
            // registry on top of it.
            checks++;
            failures.push(...checkConstructRegistry(result.data, childPath));
          }
          // Stop: whatever this block schema DOES declare, it has just
          // parsed, and descending would re-parse every nested key that is
          // separately registered above and report each finding twice.
          // A strict object surfaces unrecognized keys and nested
          // value errors in the one issue list, so for a strict block nothing
          // is lost here.
          //
          // For a LOOSE block something is lost, and that is why this is no
          // longer the whole story. A loose payload admits an undeclared
          // sub-object unread, so a key beneath it is checked by nobody.
          // citations and unresolved lists are covered wherever they sit by
          // sweepCitationCarriers, which runs after this walk and dedupes
          // against reportedIssuePaths so a defect a block parse already named
          // is not named twice. Every OTHER key under a loose payload is still
          // unchecked -- every registered key but those two, plus every key
          // registered nowhere -- and no record authors one, which is measured
          // and guarded rather than assumed (isBlockSchema's docblock above,
          // and the corpus-wide guard in the test file).
          if (isBlockSchema(schema)) descend = false;
        }
        if (descend) walk(value, childPath);
      }
    }
  }

  // A record is a mapping. An empty file parses to null and a stray line
  // parses to a string, and the walk below visits neither, so before this
  // check a record file with nothing in it was reported as conformant: 0
  // values checked, 0 mismatches, exit 0. Every gate downstream reads the
  // same document, so a file that is not a map is silence wearing a pass.
  if (doc === null || typeof doc !== 'object' || Array.isArray(doc)) {
    failures.push({
      path: '(document)',
      field: '(document)',
      value: doc,
      message:
        `a record is a mapping of top-level blocks; this file parses to ` +
        `${doc === null ? 'null' : Array.isArray(doc) ? 'a list' : typeof doc}, so no block ` +
        'in it can be read',
    });
    return { checks, failures, warnings: [] };
  }

  walk(doc, '');
  sweepCitationCarriers(doc, '', (path, field, value, schema) => {
    checks++;
    const result = schema.safeParse(value);
    if (result.success) return;
    // Issues a block parse already named are that parse's finding, not a
    // second one. What survives is what no block schema reached, which is
    // exactly the class this sweep exists to cover.
    const fresh = result.error.issues.filter(
      (iss) => !reportedIssuePaths.has(absoluteIssuePath(path, iss.path)),
    );
    if (fresh.length === 0) return;
    failures.push({
      path,
      field,
      value,
      message: fresh
        .map((iss) => {
          const where = formatIssuePath(iss.path);
          return where ? `${where}: ${iss.message}` : iss.message;
        })
        .join('; '),
    });
  });

  // Record-level gates. Neither can run inside the key-driven walk: gate 1
  // asks about absent keys, and gate 6 answers from FIRED_TRIGGERS rather than
  // from the value under the key. The absence gate (full pipeline, not shipped
  // here) reads the room's state as well as the record, so it runs in the CLIs
  // beside this function.
  const warnings = checkRequiredBlocks(doc);
  failures.push(...checkUnresolvedTriggers(doc));

  return { checks, failures, warnings };
}

// ===================================================================
// The defined-terms gate. PARTLY GATING: three of its six classes fail the
// job and three print, which `DEFINED_TERMS_GATING` below names and a test
// holds. stamp_without_verb and directive_without_verb retired from it,
// replaced by the stamp gate, part of the full pipeline and not shipped here.
// The rule: the defined-terms registry is a hard authoring gate keyed on
// source family, document type and section, each row states which enums that
// source may populate, and a value outside its row fails.
// schema/defined-terms/registry.ts holds the rows.
//
// It sits beside checkConstructRegistry because it is the same shape: a
// registry check layered on top of the schema parse, asking a question the
// Zod schema cannot. The schema asks whether `contraindicated` is in the
// enum; this asks whether the source that citation names may say it there.
//
// NOT IN check:anchors (the full pipeline's anchor check, not shipped here),
// and the reason is a measurement rather than a
// preference. 158 of the 175 governed-enum citations, when measured, carry no
// anchor at all, so check:anchors cannot see them by construction, and a 37th
// failure class there would gate 17 citations while missing the rest. The
// validator already sweeps every citations list at every depth and under every
// parent, which is the reach this needs.
// ===================================================================

/** How a citation's section was obtained, which changes what a finding means. */
export type SectionBasis = 'derived' | 'asserted' | 'absent';

export interface DefinedTermsFinding {
  readonly record: string;
  readonly path: string;
  readonly failureClass:
    | 'value_outside_row'
    | 'section_asserted_versus_derived_mismatch'
    | 'citation_targets_defining_instrument'
    | 'document_type_unparsed'
    | 'not_reported_beside_a_banded_sibling'
    | 'section_string_noncanonical';
  readonly detail: string;
}

/**
 * The defined-terms classes that FAIL the job, as one list both the gate's
 * reader and its test can see.
 *
 * It was once written inline in the corpus-wide runner, where nothing
 * could reach it: a script's filter is not importable, so which classes gate
 * was a fact with no test behind it. The other three classes print under the
 * same banner and do not touch the exit code (the shape of the block-coverage
 * gate's report-only classes, one layer over).
 */
export const DEFINED_TERMS_GATING: readonly DefinedTermsFinding['failureClass'][] = [
  'value_outside_row',
  // Gates from landing: garlic's was the only instance in the corpus when
  // it landed, so there is no backlog to report through first.
  'not_reported_beside_a_banded_sibling',
  // Gates from landing: 0 in the corpus when it landed, and a section string with
  // whitespace around it splits every key that reads it.
  'section_string_noncanonical',
];

/**
 * One document's section strings that collide once case and punctuation are
 * set aside. REPORT-ONLY AND NEVER GATED.
 *
 * The regulator's own printed bytes, so nothing normalises them: Health
 * Canada prints `Cautions and Warnings` in one monograph and
 * `Caution(s) and warning(s)` in another, and both are what the document says.
 * What the report gives a reader is the split: any key built on the section
 * string, the `not_reported_beside_a_banded_sibling` key among them, treats
 * these as two sections. When measured: one such group in the corpus,
 * ginkgo's, and neither citation in it carries a frequency band, so no sibling
 * check is defeated.
 */
export interface SectionStringVariants {
  readonly record: string;
  readonly documentId: string;
  /** Each spelling, with how many citations use it, in the order first seen. */
  readonly spellings: { readonly section: string; readonly citations: number }[];
}

export interface DefinedTermsReport {
  readonly findings: DefinedTermsFinding[];
  /** Governed values judged on a byte-derived section, and on an asserted one. */
  judgedDerived: number;
  judgedAsserted: number;
  /** `${family}|${enum}` -> count of values this registry does not govern. */
  readonly notChecked: Map<string, number>;
  /** Report-only, never gated. See SectionStringVariants. */
  readonly sectionVariants: SectionStringVariants[];
  /** Constituent and impurity entries carrying no citations list. */
  uncitedConstituents: number;
}

export function emptyDefinedTermsReport(): DefinedTermsReport {
  return {
    findings: [],
    judgedDerived: 0,
    judgedAsserted: 0,
    notChecked: new Map<string, number>(),
    sectionVariants: [],
    uncitedConstituents: 0,
  };
}

export function mergeDefinedTermsReport(into: DefinedTermsReport, from: DefinedTermsReport): void {
  into.findings.push(...from.findings);
  into.judgedDerived += from.judgedDerived;
  into.judgedAsserted += from.judgedAsserted;
  into.uncitedConstituents += from.uncitedConstituents;
  into.sectionVariants.push(...from.sectionVariants);
  for (const [k, v] of from.notChecked) into.notChecked.set(k, (into.notChecked.get(k) ?? 0) + v);
}

/**
 * anchor_id -> the section_path its occurrences resolve into, for one room.
 * Exported for the relevance gate (full pipeline, not shipped here), which
 * reads the section through sectionKeyOf like every class here.
 */
export function derivedSections(root: string, room: string): Map<string, string> {
  const out = new Map<string, string>();
  const sidecar = join(root, 'ingredients/_rooms', room, 'anchors.json');
  if (!existsSync(sidecar)) return out;
  let anchors: unknown;
  try {
    anchors = JSON.parse(readFileSync(sidecar, 'utf8'));
  } catch {
    return out;
  }
  if (!Array.isArray(anchors)) return out;

  const blockSection = new Map<string, string>();
  const exDir = join(root, 'ingredients/_rooms', room, 'extraction');
  if (existsSync(exDir)) {
    for (const stem of readdirSync(exDir)) {
      const bp = join(exDir, stem, 'blocks.json');
      if (!existsSync(bp)) continue;
      try {
        const blocks = JSON.parse(readFileSync(bp, 'utf8')) as unknown;
        const arr = Array.isArray(blocks) ? blocks : Object.values(blocks as object);
        for (const b of arr as { block_id?: string; section_path?: string }[]) {
          if (typeof b.block_id === 'string') blockSection.set(b.block_id, b.section_path ?? '');
        }
      } catch {
        /* a sidecar the anchors gate already reports on; not this gate's class */
      }
    }
  }

  for (const a of anchors as { anchor_id?: string; occurrences?: unknown }[]) {
    if (typeof a.anchor_id !== 'string' || !Array.isArray(a.occurrences)) continue;
    const paths = new Set<string>();
    for (const occ of a.occurrences as { block_id?: string }[][]) {
      if (!Array.isArray(occ)) continue;
      for (const seg of occ) {
        const s = blockSection.get(seg.block_id ?? '');
        if (s !== undefined) paths.add(s);
      }
    }
    // One section or nothing. A multi-section occurrence set is a question
    // this gate does not answer and must not guess at.
    if (paths.size === 1) out.set(a.anchor_id, [...paths][0] as string);
  }
  return out;
}

/**
 * The section a citation is keyed on: byte-derived where its anchor resolves,
 * else the string it asserts, else undefined.
 *
 * One definition, used by the sibling key and by the variants report, because
 * two readers of "which section is this citation in" would be free to disagree
 * and the disagreement would be a silent split.
 */
export function sectionKeyOf(
  c: Record<string, unknown>,
  derived: ReadonlyMap<string, string>,
): string | undefined {
  const anchorId = typeof c['anchor_id'] === 'string' ? c['anchor_id'] : '';
  const derivedSection = anchorId === '' ? undefined : derived.get(anchorId);
  return derivedSection ?? (typeof c['section'] === 'string' ? c['section'] : undefined);
}

/** Is this section string free of leading, trailing and doubled whitespace? */
export function isCanonicalSection(section: string): boolean {
  return section === section.trim() && !/\s\s/.test(section) && !/[\t\n\r]/.test(section);
}

/**
 * The fold the variants report groups by: case and punctuation set aside.
 * Used by NO lookup and by NO key; the strings themselves are never changed.
 */
export function sectionVariantKey(section: string): string {
  return section.toLowerCase().replace(/[^a-z0-9.]/g, '');
}

/** (source|document_id) -> the room manifest row, for one room. */
function manifestIndex(root: string, room: string): Map<string, Record<string, string>> {
  const out = new Map<string, Record<string, string>>();
  const manifest = readRoomManifest(join(root, 'ingredients/_rooms'), room);
  if (manifest === null) return out;
  for (const row of manifest.rows) {
    out.set(`${row['source']}|${row['document_id']}`, row as Record<string, string>);
  }
  return out;
}

/** Every citation element in a record, with its path. Exported for the relevance gate. */
export function eachCitation(
  doc: unknown,
  cb: (citation: Record<string, unknown>, path: string) => void,
  path = '',
): void {
  if (Array.isArray(doc)) {
    doc.forEach((v, i) => eachCitation(v, cb, `${path}[${i}]`));
    return;
  }
  if (doc === null || typeof doc !== 'object') return;
  for (const [k, v] of Object.entries(doc as Record<string, unknown>)) {
    const child = path ? `${path}.${k}` : k;
    if (k === 'citations' && Array.isArray(v)) {
      v.forEach((c, i) => {
        if (c !== null && typeof c === 'object') cb(c as Record<string, unknown>, `${child}[${i}]`);
      });
    }
    eachCitation(v, cb, child);
  }
}

/**
 * Judge one record's governed values against the registry.
 *
 * `room` is the record's basename, which the full pipeline's manifest check
 * (not shipped here) already requires to be
 * a room; a record with no room is that gate's failure and this one returns an
 * empty report rather than reporting the same defect twice.
 */
export function checkDefinedTerms(root: string, room: string, doc: unknown): DefinedTermsReport {
  const report = emptyDefinedTermsReport();
  const manifest = manifestIndex(root, room);
  if (manifest.size === 0) return report;
  const derived = derivedSections(root, room);

  const instrumentKeys = new Set(
    REGISTRY.flatMap((r) => r.instruments).map((i) => `${i.source}|${i.document_id}`),
  );

  eachCitation(doc, (c, path) => {
    const source = typeof c['source'] === 'string' ? c['source'] : '';
    const documentId = typeof c['document_id'] === 'string' ? c['document_id'] : '';
    const key = `${source}|${documentId}`;

    // A record citing a defining instrument. The registry constrains authoring
    // and is never itself a source for a substance claim; both instruments'
    // manifest notes say NOT a citation target.
    if (instrumentKeys.has(key)) {
      report.findings.push({
        record: room,
        path,
        failureClass: 'citation_targets_defining_instrument',
        detail: `cites ${key}, a defining instrument of the registry; an instrument constrains authoring and is never a source for a substance claim`,
      });
    }

    // Before the governed-enum gate below, deliberately: every key built on a
    // section string splits on whitespace around or inside it, the sibling
    // key and the variants report included, and those read citations this
    // registry does not govern. Refused rather than trimmed, because the
    // string is the author's and a trim in one reader and not another is the
    // same split one layer down.
    const sectionString = c['section'];
    if (typeof sectionString === 'string' && !isCanonicalSection(sectionString)) {
      report.findings.push({
        record: room,
        path,
        failureClass: 'section_string_noncanonical',
        detail:
          `section ${JSON.stringify(sectionString)} carries leading, trailing or doubled ` +
          'whitespace; every key built on the section string splits on it',
      });
    }

    const governedHere: [GovernedEnum, string][] = [];
    for (const e of GOVERNED_ENUMS) {
      const v = c[e];
      if (typeof v === 'string') governedHere.push([e, v]);
    }
    if (governedHere.length === 0) return;

    const row = manifest.get(key);
    const store = isSourceToken(source) ? SOURCE_DEFINITIONS[source].store : source;
    const documentType =
      row === undefined ? null : documentTypeOf(store, row['canonical_filename'] ?? '');

    // Reported ONLY where the registry actually discriminates by document
    // type. A family whose rows are all `'*'` does not need the type, and
    // firing there would bury the cases that matter under 84 findings about
    // filenames no row reads. The closed type list is an ema_hmpc convention
    // and other families have not been brought into it; that is a naming
    // question for whoever writes their rows, not a defect here.
    const typeMatters = REGISTRY.some(
      (r) => r.source === source && r.document_type !== '*',
    );
    if (row !== undefined && documentType === null && typeMatters) {
      report.findings.push({
        record: room,
        path,
        failureClass: 'document_type_unparsed',
        detail: `canonical_filename "${row['canonical_filename'] ?? ''}" parses to no document type in the closed list, and this family's rows discriminate by type, so no row can be found`,
      });
    }

    // Section: byte-derived where an anchor resolves, else the authored
    // string. The gate records which, because a value judged on an author's
    // assertion is judged on a claim nothing checks.
    const anchorId = typeof c['anchor_id'] === 'string' ? c['anchor_id'] : '';
    const derivedSection = anchorId === '' ? undefined : derived.get(anchorId);
    const assertedSection = typeof c['section'] === 'string' ? c['section'] : undefined;
    const basis: SectionBasis =
      derivedSection !== undefined ? 'derived' : assertedSection !== undefined ? 'asserted' : 'absent';
    const section = derivedSection ?? assertedSection ?? '';

    if (
      derivedSection !== undefined &&
      assertedSection !== undefined &&
      derivedSection !== assertedSection
    ) {
      report.findings.push({
        record: room,
        path,
        failureClass: 'section_asserted_versus_derived_mismatch',
        detail: `section asserted "${assertedSection}" but the anchor resolves into section "${derivedSection}"`,
      });
    }

    for (const [enumName, value] of governedHere) {
      if (!governs(source, enumName)) {
        const k = `${source}|${enumName}`;
        report.notChecked.set(k, (report.notChecked.get(k) ?? 0) + 1);
        continue;
      }
      if (basis === 'derived') report.judgedDerived++;
      else report.judgedAsserted++;

      // An unparsed type looks up as `'*'`: right for a family whose rows are
      // wildcards, and null for one whose rows are not, which fails closed.
      const registryRow = rowFor(source, documentType ?? '*', section);
      // Fail closed inside a rowed family: no row is a refusal, not a gap.
      const ok =
        registryRow === null
          ? BOOKKEEPING_VALUES.includes(value)
          : admits(registryRow, enumName, value);
      if (!ok) {
        report.findings.push({
          record: room,
          path,
          failureClass: 'value_outside_row',
          detail: `${enumName} "${value}" is outside the row for ${source} / ${documentType ?? '(type unparsed)'} / ${section} (section ${basis})`,
        });
      }
    }
  });

  // section_string_variants. REPORT-ONLY, never gated: the spellings are the
  // regulator's own printed bytes and nothing here folds them. What the report
  // says is that any key built on the string treats them as two sections.
  {
    const byDocument = new Map<string, Map<string, { section: string; citations: number }[]>>();
    eachCitation(doc, (c) => {
      const section = sectionKeyOf(c, derived);
      if (section === undefined) return;
      const documentId = String(c['document_id']);
      const folded = sectionVariantKey(section);
      if (folded === '') return;
      const byFold =
        byDocument.get(documentId) ?? new Map<string, { section: string; citations: number }[]>();
      byDocument.set(documentId, byFold);
      const spellings = byFold.get(folded) ?? [];
      byFold.set(folded, spellings);
      const seen = spellings.find((sp) => sp.section === section);
      if (seen === undefined) spellings.push({ section, citations: 1 });
      else seen.citations++;
    });
    for (const [documentId, byFold] of byDocument) {
      for (const spellings of byFold.values()) {
        if (spellings.length < 2) continue;
        report.sectionVariants.push({ record: room, documentId, spellings });
      }
    }
  }

  // not_reported_beside_a_banded_sibling. GATING.
  //
  // Within one record, a citation saying `not_reported` while another citation
  // FROM THE SAME DOCUMENT AND SECTION carries a defined band. `not_reported`
  // asserts that the cited document states no frequency for that reaction; if a
  // sibling from the same document and section states one, the assertion is
  // false and the two cannot both be right.
  //
  // This is the class a migration got wrong on exactly one citation,
  // and no count could have shown it: the total was right, the per-value split
  // was right, and every changed path was inside the migration's allowlist.
  // garlic's fourth 4.8 bullet, "Bleeding", took `not_reported` while its three
  // siblings correctly lost their qualifier because the block's own frequency
  // sentence states the band. It gates from landing rather than reporting
  // first, because when it landed garlic's was the ONLY instance in the corpus:
  // report-only is for a class with a backlog, and this one has none.
  {
    const banded = new Map<string, { path: string; value: string }>();
    const reported: { path: string; key: string }[] = [];
    const BANDS = ['very_common', 'common', 'uncommon', 'rare', 'very_rare', 'not_known'];
    eachCitation(doc, (c, path) => {
      const fq = c['frequency_qualifier'];
      if (typeof fq !== 'string') return;
      // DERIVED FIRST, asserted as the fallback, which is the same order the
      // value check uses. The key once read `c['section']` alone,
      // so a citation whose anchor resolves into 4.8 and which asserts no
      // section keyed on "undefined" and never met its sibling: that is
      // garlic's bleeding shape recurring with one side anchored.
      const key = `${String(c['document_id'])}|${String(sectionKeyOf(c, derived))}`;
      if (BANDS.includes(fq)) {
        if (!banded.has(key)) banded.set(key, { path, value: fq });
      } else if (fq === 'not_reported') {
        reported.push({ path, key });
      }
    });
    for (const r of reported) {
      const sib = banded.get(r.key);
      if (sib === undefined) continue;
      report.findings.push({
        record: room,
        path: r.path,
        failureClass: 'not_reported_beside_a_banded_sibling',
        detail:
          `not_reported asserts this document states no frequency for the reaction, but ${sib.path} ` +
          `cites the same document and section and carries "${sib.value}"`,
      });
    }
  }

  // A constituent or impurity entry is cited or absent. Reported as a
  // count; each record conforms at its backfill.
  const constituents = (doc as Record<string, unknown> | null)?.['pharmacology'];
  const active =
    constituents !== null && typeof constituents === 'object'
      ? (constituents as Record<string, unknown>)['active_constituents']
      : undefined;
  if (active !== null && typeof active === 'object') {
    for (const group of Object.values(active as Record<string, unknown>)) {
      if (!Array.isArray(group)) continue;
      for (const el of group) {
        if (el === null || typeof el !== 'object') continue;
        const e = el as Record<string, unknown>;
        if (e['constituent_class'] === undefined && e['impurity_class'] === undefined) continue;
        if (!Array.isArray(e['citations'])) report.uncitedConstituents++;
      }
    }
  }

  return report;
}

// ===================================================================
// Retired keys. GATING: the corpus-wide run fails on any finding, and a corpus test
// holds the count at 0.
//
// This is what stops the next authored record bringing back a field a
// migration removed. A retired key is not a schema error: the block
// schemas are loose where these live. The two pole keys are the exception to
// that: the pole schema refuses them, and this check still names them so a copied template is told the key
// retired rather than that it is merely unrecognized. Without this check,
// "removed from every record" would last exactly until someone copied an old
// record as a template.
// ===================================================================

/** The retired typed mechanism and direction keys, refused at any path. */
export const RETIRED_MECHANISM_KEYS: readonly string[] = ['pk_mechanism', 'pd_mechanism', 'effect_direction'];

/** Why mechanism_marks[n].class is refused. */
export const RETIRED_MARK_CLASS_REASON =
  'mechanism_marks[].class retired with the not_yet_derivable mark reason: a stored class is a statement an agent reads, ' +
  'and stored classes were found false, so the class is computed each run and printed by the mechanism report ' +
  '(regenerated by the full pipeline, not shipped here), never stored on a record and never served';

/** Why term_matches[n].rule_reading is refused. */
export const RETIRED_RULE_READING_REASON =
  'term_matches[].rule_reading retired for rule_pointer: the value says where to look and what the rules ' +
  'detected there and is never a finding, so keyed, negated, instruction and unread became see_entry, see_verbatim_negation, ' +
  'see_verbatim_instruction and see_verbatim; the list is regenerated by the full pipeline, not shipped here';

export interface RetiredKeyFinding {
  readonly record: string;
  readonly path: string;
  readonly key: string;
  readonly detail: string;
}

/**
 * Retired keys in this record.
 *
 * The two pole keys are matched on their PATH, never on the bare key name.
 * `basis` occurs 227 times in the corpus, every one of them
 * `reference_values[].stated_values[].basis`, a closed enum of dosing
 * denominators that shares the name. Matching the bare name would report
 * every record that carries it.
 */
export function checkRetiredKeys(record: string, doc: unknown): RetiredKeyFinding[] {
  const out: RetiredKeyFinding[] = [];
  const POLE_PATH = /^pregnancy_lactation\.(pregnancy|lactation|fertility)\.(determination|basis)$/;

  const walkAll = (node: unknown, path: string): void => {
    if (Array.isArray(node)) {
      node.forEach((v, i) => walkAll(v, `${path}[${i}]`));
      return;
    }
    if (node === null || typeof node !== 'object') return;
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      const child = path ? `${path}.${k}` : k;

      // No record is exempt. ginkgo once was, by name, until its three poles'
      // keys were deleted and this exception with them.
      if (POLE_PATH.test(child)) {
        out.push({
          record,
          path: child,
          key: k,
          detail:
            `pole-level ${k} retired: it is a token the corpus coined, not the source's words, and what a ` +
            `pole concludes sits on the citation of the authority that concluded it`,
        });
      }

      // Free-string `basis`, on every block path. THREE EXCLUSIONS, all real.
      //
      // `reference_values[].stated_values[].basis` is a CLOSED ENUM
      // (per_day | per_kg_bw_per_day | per_dose | per_serving), a dosing
      // denominator and an entirely different field that happens to share a
      // name. All 227 of the corpus's remaining `basis` values are that one,
      // and a check matching the bare key would report the whole corpus.
      //
      // A relevance grade's `bases[].basis` on a citation is a closed
      // enum too (species_specific_mechanism | exposure_above_use |
      // other_stated | not_reported), and what the source says sits beside it
      // as a verbatim basis_span, never as prose. Found when the first grade
      // ran through corpus-wide validation end to end.
      //
      // POLE_PATH is excluded outright: a pole `basis` is
      // already reported by the clause above, and reporting it here as well
      // would name one defect twice. The validator keeps one defect to one
      // failure everywhere else and this is no exception.
      if (
        k === 'basis' &&
        !/^reference_values\[\d+\]\.stated_values\[\d+\]\.basis$/.test(child) &&
        !/(?:^|\.)citations\[\d+\]\.(?:human|clinical|biological)_relevance\[\d+\]\.bases\[\d+\]\.basis$/.test(child) &&
        !POLE_PATH.test(child)
      ) {
        out.push({
          record,
          path: child,
          key: k,
          detail:
            'free-string basis retired: its own schema comment called it ' +
            "a prose basis, which is the corpus's own summary of a source sentence, and a structured field never holds one",
        });
      }

      if (k === 'induction_strength' || k === 'regulator_inhibition_strength') {
        out.push({
          record,
          path: child,
          key: k,
          detail:
            `${k} retired: it graded a source that grades nothing, and ` +
            `a structured field never holds the corpus's own summary of a source sentence`,
        });
      }

      // regulator_caution_level, on the BARE KEY and at any path. It lived only
      // on the remainder block's items, but the key has no live sense anywhere
      // in the corpus, so a path match would only let a copied template bring
      // it back somewhere new. Retired: a corpus-coined severity ladder over
      // regulator prose, and so the corpus's own summary of a source sentence,
      // which a structured field never holds; nothing replaces it.
      if (k === 'regulator_caution_level') {
        out.push({
          record,
          path: child,
          key: k,
          detail:
            'regulator_caution_level retired: a corpus-coined severity ' +
            "ladder over regulator prose, and a structured field never holds the corpus's " +
            'own summary of a source sentence; nothing replaces it',
        });
      }

      // basis_by_use_category, on the BARE KEY and at any path. It sat on five
      // blocks of one record, ginkgo, and the key has no live sense anywhere,
      // so a path match would only let a copied template bring it back on a
      // block it never sat on. Retired: a block-level field holding the corpus's own per-column summary of source
      // sentences, which a structured field never holds, and whose column is now carried by `scope`
      // on the citation that states each conclusion. No block schema declares
      // it, so the strict blocks refuse it too; this names why.
      if (k === 'basis_by_use_category') {
        out.push({
          record,
          path: child,
          key: k,
          detail:
            'basis_by_use_category retired: a per-column conclusion sits on the ' +
            'citation of the authority that stated it, and scope on that citation carries the column',
        });
      }

      // The warnings remainder block's former key, at the TOP LEVEL only, which
      // is the only place it ever sat. Renamed other_warnings_and_precautions;
      // this is what stops a record
      // copied from an older template bringing the old key back beside the new
      // one, where REQUIRED_BLOCKS would read the block as missing and the old
      // key would go unvalidated, FIELD_SCHEMAS no longer naming it.
      if (child === 'unmapped_regulator_cautions') {
        out.push({
          record,
          path: child,
          key: k,
          detail:
            'unmapped_regulator_cautions renamed other_warnings_and_precautions; ' +
            'the former key is refused so the block is not carried under two names',
        });
      }

      // The retired typed mechanism and direction keys, on the BARE KEY and at any path. A citation's schema is strict
      // and refuses them as unrecognized; a loose block does not, so without this check
      // "pk_mechanism: [enzyme_induction]" on st_johns_wort's enzyme_induction_profile passed. This names why: mechanisms and effects are derived from spans of the verbatim.
      if (RETIRED_MECHANISM_KEYS.includes(k)) {
        out.push({
          record,
          path: child,
          key: k,
          detail:
            `${k} retired: a citation's mechanisms and effects are the mechanism and effect lists ` +
            'derived from spans of its verbatim (regenerated by the full pipeline, not shipped here), never typed',
        });
      }

      // mechanism_marks[n].class, on its PATH, retired with the not_yet_derivable mark reason, the one reason that
      // carried it. The mark schema is strict and refuses the key too; this names WHY, so a record copied from an older
      // template is told the key retired rather than that it is merely unrecognized. The retired reason value is left to the
      // schema's enum: this check reads keys, never values.
      if (k === 'class' && /(^|\.)citations\[\d+\]\.mechanism_marks\[\d+\]\.class$/.test(child)) {
        out.push({
          record,
          path: child,
          key: k,
          detail: RETIRED_MARK_CLASS_REASON,
        });
      }

      // term_matches[n].rule_reading, on its PATH, retired for rule_pointer. The item schema is strict and
      // refuses the key too, and the floor gate's shape finding names it; this names WHY, so a record copied from an older
      // template is told the key retired rather than that it is merely unrecognized. The four retired values are left to the
      // floor gate, which names each: this check reads keys, never values.
      if (k === 'rule_reading' && /(^|\.)citations\[\d+\]\.term_matches\[\d+\]\.rule_reading$/.test(child)) {
        out.push({
          record,
          path: child,
          key: k,
          detail: RETIRED_RULE_READING_REASON,
        });
      }

      // sources_checked[].sections, retired. The entry schema is strict and refuses the key too; this names WHY, so
      // a record copied from an older template is told the key retired rather
      // than that it is merely unrecognized.
      if (k === 'sections' && /(^|\.)sources_checked\[\d+\]\.sections$/.test(child)) {
        out.push({
          record,
          path: child,
          key: k,
          detail:
            'sources_checked[].sections retired: a checked ' +
            'document is read whole through its committed extraction, the lists are derived and ' +
            'never typed, and an entry names its document by source and document_id alone',
        });
      }

      // beers_criteria's `listed` boolean, retired with 0 carriers.
      // Matched on its PATH: `listed` is now a STATUS value
      // on the same pole, so a bare-key match would be reading a word, and the
      // only place the boolean ever sat is directly on the pole. The strict
      // present variant refuses the key too; this names why.
      if (child === 'regulatory_classification.beers_criteria.listed') {
        out.push({
          record,
          path: child,
          key: k,
          detail:
            'beers_criteria.listed retired: present already means ' +
            'the tables carry the substance, and a search of them is the not_listed or listed status ' +
            'with its lookup, never a boolean beside the status',
        });
      }

      // Item-level frequency, and only there. frequency_qualifier on a
      // citation is the live field this one retired INTO, so the path matters
      // as much as the name.
      if (k === 'frequency' && /^documented_adverse_reactions\.items\[\d+\]\.frequency$/.test(child)) {
        out.push({
          record,
          path: child,
          key: k,
          detail:
            'item-level frequency retired: a class-level band cannot carry ' +
            'which document stated it, so it sits on the citation as frequency_qualifier',
        });
      }

      walkAll(v, child);
    }
  };
  walkAll(doc, '');
  return out;
}
