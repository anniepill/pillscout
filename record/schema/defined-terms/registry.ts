/**
 * The defined-terms registry: which enum values a source may populate, where.
 *
 * It is a hard authoring gate. A row is keyed on source family, document type
 * and section, states which enums that source may populate there, cites the
 * defining instrument, and holds the authority's own definition text or
 * records why it holds none.
 *
 * It is a BACKSTAGE constraint. Nothing in a record points at a row, no record
 * field changes shape because this module exists, and the registry is never
 * served. It constrains what an authoring session may write.
 *
 * GATING, though not wholly: checkDefinedTerms
 * (schema/cli/validator-core.ts) fails the job on three of its six classes
 * and prints the other three. `DEFINED_TERMS_GATING` in that module is the
 * list, and a test holds it. The three that gate are `value_outside_row`,
 * `not_reported_beside_a_banded_sibling` and `section_string_noncanonical`;
 * the three that report are `section_asserted_versus_derived_mismatch`,
 * `citation_targets_defining_instrument` and `document_type_unparsed`. The
 * `section_string_variants` census beside them is report-only too. Two more
 * classes once gated here, `stamp_without_verb` and `directive_without_verb`,
 * each asking only whether a verbatim printed a word of the value's list
 * anywhere; the stamp gate, part of the full pipeline and not shipped here,
 * which derives each stamp from the span it names, replaced them.
 *
 * ===================================================================
 * WHAT THE ROWS ARE WRITTEN FROM
 *
 * From what the INSTRUMENT makes each section for, never from what the corpus
 * happens to hold. A row that admitted whatever was already authored would
 * ratify the drift it exists to stop: under the defined-terms rules, a value
 * already in a record is not a precedent.
 *
 * Two instruments, both held, neither extracted:
 *   - EMA/HMPC/107436/2005 Rev. 8, Template for a European Union herbal
 *     monograph. States what each numbered section is for and the standard
 *     statements it may carry.
 *   - eu_commission_smpc_guideline_rev2, European Commission Notice to
 *     Applicants, A Guideline on Summary of Product Characteristics,
 *     Revision 2, September 2009. Defines the sections the template numbers,
 *     and at its page 16 the adverse-reaction frequency convention that
 *     `frequency_qualifier` grounds to. The template defers to it by name at
 *     its own 4.8.
 *
 * NO DEFINITION TEXT IS HELD ANYWHERE TODAY, and that is structural rather
 * than a backlog: `held_text` requires a committed extraction of the
 * instrument, no extraction rule exists for either document kind, and a
 * content claim is read against a committed extraction and never against a
 * PDF or the raw source captures (not shipped here). So every row is `held_not_extracted` and every
 * `definition_text` is the empty string. A test enforces it, which is what
 * makes a typed transcription structurally impossible rather than merely
 * discouraged.
 * ===================================================================
 *
 * `source_directive` SITS OUTSIDE THIS REGISTRY. Its values name the action a
 * sentence prints (ask before use, stop use and ask, ask for use beyond a
 * duration, ask if symptoms persist, avoid) and no authority defines them, so no row
 * could cite an instrument for one or admit and refuse it by section. They are
 * gated instead by their printed-string lists, `DIRECTIVE_WORDING` in
 * schema/wording/stamp.ts, read by the stamp gate (part of the full pipeline,
 * not shipped here): a value stands only where its `directive_span` derives
 * it through that list. That is the amended defined-terms rule against
 * paraphrase tokens: a token in a closed enum whose membership is enforced by
 * a printed-string list names a printed action and is not a paraphrase. The field is therefore neither in `GOVERNED_ENUMS` nor among the
 * bookkeeping values, and nothing here reads it except that list.
 */
import type { SourceToken } from '../manifest/sourceToken.js';
import type { FrequencyQualifier } from '../claim-evidence/frequencyQualifier.js';
import type { SourcePosition } from '../claim-evidence/sourcePosition.js';

/**
 * The enums this registry governs.
 *
 * Both are authority-defined vocabularies with a grounding instrument, which
 * is what makes them governable: `frequency_qualifier` to the SmPC guideline's
 * section 4.8 convention, `source_position` to SmPC 4.3, 4.4 and 4.6.
 */
export const GOVERNED_ENUMS = ['frequency_qualifier', 'source_position'] as const;
export type GovernedEnum = (typeof GOVERNED_ENUMS)[number];

/**
 * Corpus bookkeeping, no authority's term. THE REGISTRY DOES NOT GOVERN THESE
 * AND EVERY ROW ADMITS THEM.
 *
 * `not_reported` records that the corpus read the source and found no value.
 * `not_applicable` records that the question does not arise. Neither is a word
 * any authority defined, so no row can widen or narrow them and no instrument
 * could be cited for them. `not_applicable` stays valid on citations.
 *
 * A row's `admits` list therefore never contains them, and the check adds them
 * to every row. A row that listed one would be claiming an authority defined
 * it, which is the confusion this constant exists to prevent.
 */
export const BOOKKEEPING_VALUES: readonly string[] = ['not_reported', 'not_applicable'];

/**
 * Why a row holds no definition text, or that it holds one.
 *
 * `held_not_extracted` - the instrument is held and has no committed
 *   extraction, so its text cannot be read into the corpus yet. Every row is
 *   here today.
 * `not_determined` - no instrument identified for this family and enum. The
 *   row still constrains: it admits nothing beyond bookkeeping, which fails
 *   closed rather than open.
 * `none_stated` - the instrument was read and states no definition. It
 *   REQUIRES a cited basis, because "the authority defines nothing here" is
 *   itself a claim about a document. No row uses it today.
 * `held_text` - the definition is quoted in `definition_text`. Requires a
 *   committed extraction of the instrument. No row uses it today.
 */
export const DEFINITION_STATUSES = [
  'held_not_extracted',
  'not_determined',
  'none_stated',
  'held_text',
] as const;
export type DefinitionStatus = (typeof DEFINITION_STATUSES)[number];

/** A defining instrument, as the manifest names it. Must join to a held row. */
export interface InstrumentRef {
  readonly source: SourceToken;
  readonly document_id: string;
}

export interface RegistryRow {
  readonly source: SourceToken;
  /** As `documentTypeOf` parses it from `canonical_filename`. */
  readonly document_type: string;
  /**
   * The section this row governs, matched EXACTLY, or `'*'` for every section
   * of this document type.
   *
   * Exact because a section number is the instrument's own address for a
   * defined sense, and a prefix match would let 4.80 answer for 4.8. `'*'` is
   * for a family whose documents the corpus cannot address by section at all.
   */
  readonly section_path: string;
  /**
   * Per governed enum, the authority-defined values this row admits.
   *
   * A DECLARED key with an empty array means "this row admits nothing beyond
   * bookkeeping". An ABSENT key means "this registry does not govern that enum
   * for this family", and the check reports a not-checked line instead of
   * judging. The two are different answers and the shape keeps them apart.
   *
   * Bookkeeping values are never listed; see BOOKKEEPING_VALUES.
   */
  readonly admits: {
    readonly frequency_qualifier?: readonly FrequencyQualifier[];
    readonly source_position?: readonly SourcePosition[];
  };
  /**
   * Does the HEADING of this section carry the tier, so that a sentence filed
   * under it takes the stamp without printing a verb?
   *
   * A stamp has two readings: THE VERB THE
   * SENTENCE PRINTS, or THE TIER OF THE HEADING IT IS FILED UNDER. Where this
   * is true, either reading suffices and nothing here checks the words:
   * `Hypersensitivity to the active substance.` is `contraindicated` by its
   * 4.3 heading and prints no verb. Where it is FALSE, the heading carries no
   * tier, so only the verb limb is available: the stamp gate (part of the
   * full pipeline, not shipped here) gives such a stamp no heading to ride and requires
   * the span it is read off. Stated per row rather than inferred, because it
   * is a fact about what the instrument makes each section for.
   */
  readonly tier_by_heading: boolean;
  readonly instruments: readonly InstrumentRef[];
  readonly definition_status: DefinitionStatus;
  /** Non-empty ONLY under `held_text`. Empty on every row today. */
  readonly definition_text: string;
  /** Rooms whose citations this row currently judges, for the review audit. */
  readonly seen_in: readonly string[];
}

const TEMPLATE: InstrumentRef = { source: 'ema_hmpc', document_id: 'EMA/HMPC/107436/2005' };
const SMPC_GUIDELINE: InstrumentRef = {
  source: 'european_commission',
  document_id: 'eu_commission_smpc_guideline_rev2',
};
const EMA_INSTRUMENTS: readonly InstrumentRef[] = [TEMPLATE, SMPC_GUIDELINE];

const ALL_BANDS: readonly FrequencyQualifier[] = [
  'very_common',
  'common',
  'uncommon',
  'rare',
  'very_rare',
  'not_known',
];

/**
 * THE EMA HMPC MONOGRAPH ROWS.
 *
 * One row per section the instrument makes for a governed enum. Every other
 * section of this document type admits nothing, by the fail-closed rule below
 * rather than by seventeen rows of silence.
 *
 * Two readings decide what a row admits: a stamp comes from THE VERB THE
 * SENTENCE PRINTS, or from THE TIER OF THE HEADING IT IS FILED UNDER. Rule 2
 * says a heading counts. So `Hypersensitivity to the active substance.` is
 * `contraindicated` by its 4.3 heading although it prints no verb. Garlic's
 * pre-surgery sentence and st_johns_wort's UV sentence were once the
 * heading-limb examples for `use_with_caution`, but use_with_caution may never
 * label a sentence that prints "avoid": both lost the stamp, and each carries
 * source_directive `avoid`. The heading limb still stands for a wordless
 * sentence.
 *
 * 4.2 admits `not_recommended`. The instrument makes 4.2 for the posology AND
 * the population it applies to, and the template's own 4.2 carries the
 * under-18 restriction; five corpus values sit there on sentences that print
 * "is not recommended".
 *
 * 4.5 admits all three. The guideline's 4.5 cross-refers to 4.3 and 4.4, and
 * the monographs print the verb in 4.5 itself: garlic's saquinavir/ritonavir
 * sentence prints "is contraindicated", ginkgo's efavirenz sentence prints
 * "is not recommended".
 *
 * 4.6 admits `contraindicated` ON THE VERB LIMB ONLY, and this is the row
 * worth reading twice. The guideline states at page 14, under 4.6 General
 * principles: "In case of contraindication, this should be included in section
 * 4.3." So the 4.6 HEADING does not carry a contraindication tier, and a
 * wordless 4.6 sentence may not take the stamp. ginkgo's 4.6 prints "The use
 * is contraindicated in pregnancy (see section 4.3)", which is the verb limb
 * and is why the value is admitted at all.
 *
 * 4.6 DOES NOT admit `use_with_caution`. The instrument contemplates no
 * precaution tier there: page 14 gives 4.6 recommendations and cross-references
 * to 4.3, 4.4 and 4.8, and the template's 4.6 standard statements are
 * not-recommended, should-be-avoided, safety-not-established and
 * no-fertility-data. No corpus value sits there, so refusing costs nothing.
 *
 * 4.8 admits the six bands and no position. The frequency convention is the
 * guideline's page 16 and the template defers to it by name.
 */
const EMA_MONOGRAPH_ROWS: readonly RegistryRow[] = [
  {
    source: 'ema_hmpc',
    document_type: 'monograph',
    section_path: '4.2',
    admits: { source_position: ['not_recommended'] },
    tier_by_heading: true,
    instruments: EMA_INSTRUMENTS,
    definition_status: 'held_not_extracted',
    definition_text: '',
    seen_in: ['cinnamon', 'ginkgo', 'ginseng', 'green_tea_folium', 'passionflower'],
  },
  {
    source: 'ema_hmpc',
    document_type: 'monograph',
    section_path: '4.3',
    admits: { source_position: ['contraindicated'] },
    tier_by_heading: true,
    instruments: EMA_INSTRUMENTS,
    definition_status: 'held_not_extracted',
    definition_text: '',
    seen_in: [
      'cinnamon',
      'curcumin',
      'garlic',
      'ginkgo',
      'ginseng',
      'green_tea_folium',
      'passionflower',
      'st_johns_wort',
      'valerian',
    ],
  },
  {
    source: 'ema_hmpc',
    document_type: 'monograph',
    section_path: '4.4',
    admits: { source_position: ['contraindicated', 'not_recommended', 'use_with_caution'] },
    tier_by_heading: true,
    instruments: EMA_INSTRUMENTS,
    definition_status: 'held_not_extracted',
    definition_text: '',
    seen_in: ['curcumin', 'ginkgo', 'st_johns_wort', 'valerian'],
  },
  {
    source: 'ema_hmpc',
    document_type: 'monograph',
    section_path: '4.5',
    admits: { source_position: ['contraindicated', 'not_recommended', 'use_with_caution'] },
    tier_by_heading: true,
    instruments: EMA_INSTRUMENTS,
    definition_status: 'held_not_extracted',
    definition_text: '',
    seen_in: ['garlic', 'ginkgo'],
  },
  {
    source: 'ema_hmpc',
    document_type: 'monograph',
    section_path: '4.6',
    admits: { source_position: ['contraindicated', 'not_recommended'] },
    // The ONE row where the heading carries no tier, and the row the header
    // above says to read twice. The SmPC guideline states at its page 14,
    // under 4.6 General principles: "In case of contraindication, this should
    // be included in section 4.3." So a 4.6 sentence takes a stamp only on the
    // verb limb. When `admits` was only a membership test, a wordless 4.6
    // sentence took `contraindicated`; the stamp gate now enforces the verb
    // limb, requiring each 4.6 stamp's span.
    tier_by_heading: false,
    instruments: EMA_INSTRUMENTS,
    definition_status: 'held_not_extracted',
    definition_text: '',
    seen_in: [
      'cinnamon',
      'curcumin',
      'garlic',
      'ginkgo',
      'ginseng',
      'green_tea_folium',
      'passionflower',
      'st_johns_wort',
      'valerian',
    ],
  },
  {
    source: 'ema_hmpc',
    document_type: 'monograph',
    section_path: '4.8',
    admits: { frequency_qualifier: ALL_BANDS },
    tier_by_heading: true,
    instruments: EMA_INSTRUMENTS,
    definition_status: 'held_not_extracted',
    definition_text: '',
    seen_in: ['curcumin', 'garlic', 'ginkgo', 'green_tea_folium', 'valerian'],
  },
];

/**
 * EMA HMPC opinion and assessment report: BOTH ENUMS, NOTHING ADMITTED.
 *
 * Redundant with the fail-closed rule and stated anyway, because a reader
 * meeting a stamped assessment-report citation should find the refusal written
 * down rather than infer it from an absence.
 *
 * ASSESSMENT REPORT. An assessment report takes
 * no position or frequency stamp. The sentence stays quoted with the
 * assessor's own word intact. The reason: a served stamp travels
 * with its authority's labelling definition, and an assessment report is not a
 * label. Its sections are the assessor's narrative, it has no 4.3, and
 * "kava preparations should be contraindicated in pregnant women" is an
 * assessor recommending a contraindication rather than a regulator printing
 * one. Seven stamps at HEAD lose their field; five keep an equivalent
 * position from a sibling citation and two kava contraindication items do
 * not, which is recorded here because it is the cost of the rule and not a
 * surprise to be discovered later.
 *
 * OPINION. Procedural: the HMPC's opinion that a monograph be adopted. It
 * states no per-section position or frequency, it carries no governed value at
 * HEAD, and its rule exports `expectedSections: []`, so no occurrence can
 * carry a section_path and a section-keyed row could never match anyway.
 */
const EMA_NON_MONOGRAPH_ROWS: readonly RegistryRow[] = [
  {
    source: 'ema_hmpc',
    document_type: 'assessment_report',
    section_path: '*',
    admits: { frequency_qualifier: [], source_position: [] },
    tier_by_heading: true,
    instruments: EMA_INSTRUMENTS,
    definition_status: 'held_not_extracted',
    definition_text: '',
    seen_in: ['curcumin', 'green_tea_folium', 'kava'],
  },
  {
    source: 'ema_hmpc',
    document_type: 'opinion',
    section_path: '*',
    admits: { frequency_qualifier: [], source_position: [] },
    tier_by_heading: true,
    instruments: EMA_INSTRUMENTS,
    definition_status: 'held_not_extracted',
    definition_text: '',
    seen_in: [],
  },
];

/**
 * THE NON-EMA FAMILIES: FREQUENCY ROWS ONLY, ADMITTING NOTHING.
 *
 * Eight families carry a governed value at HEAD and none of them speaks the
 * SmPC 4.8 band taxonomy. Measured over every verbatim and text_context the
 * corpus holds: five carry no band word at all (health_canada_nnhpd 114
 * citations, who 38, european_commission 9, eda 21, fda 34), and the three
 * that do use the words as ordinary English rather than as a taxonomy -
 * nih_ods "hypercalcemia ... are rare in healthy people", health_canada_ssr
 * "rare and unpredictable events", nih_livertox "side effects ... are
 * uncommon but may include". That is exactly the defined-terms case of a
 * plain-language source: the word is English there, not the EMA taxonomy, and
 * the qualifier is half the meaning.
 *
 * So each row declares `frequency_qualifier: []`: this registry governs the
 * enum for the family and admits no band. 23 citation-level bands at HEAD are
 * outside their row and retire to `not_reported`.
 *
 * `source_position` IS DELIBERATELY ABSENT from every row here, and the
 * absence is load-bearing. These families print position verbs under their own
 * headings - WHO under Contraindications, Health Canada under
 * Contraindication(s), the EU Commission under Annex III Part B - and the
 * defined-terms rules admit a word used in its own defined sense under the authority's own
 * heading. Writing those rows needs each family's own instrument read, which
 * has not been done. Until then the check reports a not-checked line per
 * (family, enum) with counts rather than judging, which is the opposite of
 * failing closed and is the correct treatment for a question nobody has
 * answered yet.
 *
 * FDA IS NOT "NO TAXONOMY". IT IS A CONFLICTING ONE, and this is the finding
 * that most justifies a registry. Three held FDA SPL labels -
 * fda_dailymed_fluoxetine_setid_023cef65, fda_dailymed_fluvoxamine_setid_0b107225
 * and fda_dailymed_zolpidem_setid_004bd09e - define their own convention:
 * "frequent adverse reactions are those occurring in at least 1/100 patients;
 * infrequent adverse reactions are those occurring in 1/100 to 1/1,000
 * patients; rare reactions are those occurring in fewer than 1/1,000
 * patients." FDA's `rare` is open-ended below 1/1,000 and SWALLOWS EMA's
 * `very_rare`, whose floor is 1/10,000. The word is the same and the sense is
 * not. An FDA band row therefore waits on an FDA label extraction, not on a
 * reading; the one FDA band at HEAD is `not_known` on a calcitriol ADVERSE
 * REACTIONS citation. That convention was read off the raw source captures
 * (not shipped here) as a pointer and is NOT a corpus content claim, which is the other reason the row stays
 * `not_determined`.
 *
 * HEALTH CANADA NNHPD HAS A SECOND BLOCKER, recorded here so it is not
 * rediscovered. Its authored `section` strings occur in SIX byte variants for
 * the same section: `Risk information` /
 * `Risk Information`; `Cautions and Warnings` / `Caution(s) and warning(s)` /
 * `Cautions and warnings`; `Use(s) or Purpose(s)` / `Uses or Purposes`;
 * `Dose(s)` / `Doses`; `Direction(s) for use` / `Directions for use`;
 * `Known adverse reaction(s)` / `Known adverse reactions`. None of its 114
 * citations is anchored, so every one is judged on an asserted section. Keyed
 * on exact bytes the rows would multiply by variant; normalised, this module
 * would break the no-normalisation discipline it shares with the
 * block-coverage gate's subheading list (part of the full pipeline, not
 * shipped here). That must be settled before any NNHPD
 * position row lands. `'*'` sidesteps it here only because these rows admit
 * nothing and so cannot be wrong about a section.
 */
const NON_EMA_FREQUENCY_FAMILIES: readonly SourceToken[] = [
  'eda',
  'european_commission',
  'fda',
  'health_canada_nnhpd',
  'health_canada_ssr',
  'nih_livertox',
  'nih_ods',
  'who',
];

const NON_EMA_ROWS: readonly RegistryRow[] = NON_EMA_FREQUENCY_FAMILIES.map((source) => ({
  source,
  document_type: '*',
  section_path: '*',
  admits: { frequency_qualifier: [] },
  // A frequency band is not a verb and no row here admits a position, so the
  // verb limb has nothing to say; true is the reading that checks nothing.
  tier_by_heading: true,
  instruments: [],
  definition_status: 'not_determined' as const,
  definition_text: '',
  seen_in: [],
}));

export const REGISTRY: readonly RegistryRow[] = [
  ...EMA_MONOGRAPH_ROWS,
  ...EMA_NON_MONOGRAPH_ROWS,
  ...NON_EMA_ROWS,
];

/**
 * The closed document-type list, and the parse from `canonical_filename`.
 *
 * The convention is `<store>_<type>_<subject>_<date>`, so the type token sits
 * immediately after the source prefix and nowhere else. This is the same
 * anchoring the extraction rules' `appliesTo` predicates took after an
 * unanchored substring test claimed the monograph template because its
 * SUBJECT carries the word.
 *
 * BOTH ADDENDUM SPELLINGS MAP TO ONE TYPE. The corpus holds
 * `ema_hmpc_addendum_assessment_report_curcumae_longae_rhizoma_2026-06-07.pdf`
 * and `ema_hmpc_assessment_report_addendum_camellia_sinensis_folium_2022-09-26.pdf`:
 * the same kind of document with the word order reversed. A list carrying both
 * spellings as distinct types would encode the inconsistency instead of
 * resolving it, and a test asserting "every row parses to exactly one type"
 * would pass while being wrong. They both parse to `assessment_report_addendum`.
 *
 * The prefix matched is the source's RAW STORE, not the source token, because
 * that is what the filenames actually carry: `european_commission` files are
 * named `eu_commission_...`.
 */
export const DOCUMENT_TYPES = [
  'addendum_assessment_report',
  'assessment_report_addendum',
  'assessment_report',
  'eu_herbal_monographs_list_entries',
  'herbal_medicines_dataset',
  'herbal_q_and_a',
  'monograph',
  'opinion',
  'overview_comments',
  'public_statement',
  'references',
  'template',
] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

/** The two spellings of one kind, folded to the canonical one. */
const TYPE_ALIASES: Readonly<Record<string, DocumentType>> = {
  addendum_assessment_report: 'assessment_report_addendum',
};

/**
 * The document type a filename parses to, or null.
 *
 * Longest match wins, so `assessment_report_addendum` is not shadowed by
 * `assessment_report`. Null is a finding (`document_type_unparsed`), never a
 * silent pass: a filename the convention does not fit is a filename nobody
 * checked.
 *
 * The type is followed by an underscore, exactly as the extraction rules'
 * predicates require (`/^ema_hmpc_monograph_/`, `/^ema_hmpc_opinion_/`).
 * This parse once also accepted the type alone or followed by a dot, so `ema_hmpc_monograph.pdf` was a monograph here and matched no rule
 * there. No held row has that shape, and the predicates cannot take a shared
 * helper instead: their module bytes are in every extraction's pipeline hash,
 * so the anchoring is matched here and a test holds the two to one answer.
 */
export function documentTypeOf(store: string, canonicalFilename: string): DocumentType | null {
  const prefix = `${store}_`;
  if (!canonicalFilename.startsWith(prefix)) return null;
  const rest = canonicalFilename.slice(prefix.length);
  const hits = DOCUMENT_TYPES.filter((t) => rest.startsWith(`${t}_`)).sort(
    (a, b) => b.length - a.length,
  );
  const hit = hits[0];
  if (hit === undefined) return null;
  return TYPE_ALIASES[hit] ?? hit;
}

/**
 * The row governing this (source, document_type, section), or null.
 *
 * An exact `section_path` beats a `'*'` row, and a `document_type` row beats a
 * `'*'` one, so a family can state a general refusal and a specific admission
 * without order mattering.
 */
export function rowFor(
  source: string,
  documentType: string,
  sectionPath: string,
): RegistryRow | null {
  const family = REGISTRY.filter((r) => r.source === source);
  if (family.length === 0) return null;
  const candidates = family.filter(
    (r) =>
      (r.document_type === documentType || r.document_type === '*') &&
      (r.section_path === sectionPath || r.section_path === '*'),
  );
  if (candidates.length === 0) return null;
  const score = (r: RegistryRow): number =>
    (r.document_type === '*' ? 0 : 2) + (r.section_path === '*' ? 0 : 1);
  return candidates.reduce((best, r) => (score(r) > score(best) ? r : best));
}

/** Does this registry govern `enumName` for `source` at all? */
export function governs(source: string, enumName: GovernedEnum): boolean {
  return REGISTRY.some((r) => r.source === source && r.admits[enumName] !== undefined);
}

/**
 * Is `value` admissible for `enumName` under `row`?
 *
 * Bookkeeping values are admitted by every row and are never in `admits`.
 * A row that does not declare the enum admits nothing through this function;
 * callers ask `governs` first and report a not-checked line instead.
 */
export function admits(row: RegistryRow, enumName: GovernedEnum, value: string): boolean {
  if (BOOKKEEPING_VALUES.includes(value)) return true;
  const allowed = row.admits[enumName];
  if (allowed === undefined) return false;
  return (allowed as readonly string[]).includes(value);
}

/**
 * The FAIL-CLOSED rule, stated as a function so no caller has to remember it.
 *
 * Inside a family this registry rows at all, a (document_type, section) with
 * no row admits nothing beyond bookkeeping. Silence in the registry is a
 * refusal, not a gap, for every governed enum of a rowed family.
 */
export function isRowedFamily(source: string): boolean {
  return REGISTRY.some((r) => r.source === source);
}
