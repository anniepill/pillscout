import { z } from 'zod';

import { sourceText } from '../byte-hygiene/sourceText.js';
import { attributionLevelSchema } from './attributionLevel.js';
import { citationStatusSchema } from './citationStatus.js';
import { interactionAxisSchema, axisDoseDependenceSchema } from './interactionAxis.js';
import { applicabilityConditionsSchema } from './applicabilityConditions.js';
import { evidenceOutcomeSchema } from './evidenceOutcome.js';
import { evidenceMethodologySchema } from './evidenceMethodology.js';
import { evaluationStatusSchema } from './evaluationStatus.js';
import { frequencyQualifierSchema } from './frequencyQualifier.js';
import { sourcePositionSchema } from './sourcePosition.js';
import { sourceDirectiveSchema } from './sourceDirective.js';
import { unresolvedListSchema } from './unresolved.js';
import {
  biologicalRelevanceSchema,
  clinicalRelevanceSchema,
  humanRelevanceSchema,
  relevanceGradeNotQuotableSchema,
  relevanceMarksSchema,
} from './relevanceGrade.js';
import { conditionBandsSchema, conditionSpanSchema, stampMarksSchema, stampSpanSchema } from './stampSpan.js';
import { TERM_MATCHES_FIELD, mechanismMarksSchema, mechanismsSchema, termMatchesSchema } from './mechanismSpan.js';
import { effectsSchema } from './effectSpan.js';

// The citation element: one source-attributed evidence anchor.
//
// A `citations:` list hangs off nearly every claim-bearing block in an
// ingredient record: 44 distinct parent paths and 855 elements when this
// schema was written, measured on the full private corpus at the time, not on
// this repository. Until this schema it was the corpus's largest ungoverned
// surface: 13 of its keys carried leaf enum schemas, applied by key name
// wherever the walk happened to find them, and the OBJECT itself was governed
// by nothing. No schema knew which keys a citation may carry, so a coined or
// misspelled key inside one parsed clean and the citation read as covered.
//
// That is the same failure the applicability_conditions strictness pass
// closed one level down, and the reason it matters more here is that the
// unguarded keys are the provenance anchors themselves: source,
// document_id, section, evidence_locator, verbatim. A typo in `evidence_
// locator` does not fail; it silently produces a citation with no locator,
// which reads as coverage while being unauditable. A fact a consuming agent
// cannot query is worse than a recorded absence.
//
// This schema is strict. An unrecognized key is REJECTED, not stripped.
// Widening the key set is a vocabulary decision, made deliberately here.
//
// KEY SET AND REQUIRED/OPTIONAL SPLIT ARE DERIVED, NOT DESIGNED. Both were
// read off the corpus with the same YAML parser the validator uses: 26
// distinct keys across 855 citation elements, measured on the full private
// corpus at the time, not on this repository. A key present on every element
// is required; every other key is optional. Nothing here is aspirational, so
// the schema admits HEAD exactly as authored and any tightening beyond it is
// a separate, deliberate change. The exceptions are `anchor_id`, added from
// the full pipeline's extraction contract (not shipped here) rather than the
// corpus, and `source_directive`,
// whose `ask_if_symptoms_persist` enters at 0 uses because it was admitted by
// decision (schema/claim-evidence/sourceDirective.ts says why), the five
// relevance keys, admitted at 0 uses, and the five stamp keys of the stamp
// and directive recall, admitted at 0 uses; each comment says why.
//
// The 13 keys that already had a claim-evidence leaf schema keep it, imported
// rather than restated, so this schema cannot drift from the enum definitions
// the rest of the package enforces. The other 13 get the loosest type their
// corpus values permit and NO invented enum: several of them (pharmacologic_
// class, source_guidance_status, retention_note) look enum-shaped, but
// inferring a closed vocabulary from what the corpus happens to contain
// would freeze an accident into a gate. Those vocabularies accrete from
// record application, and closing one is its own decision.

export const citationElementSchema = z.strictObject({
  // --- Required. Present on all 855 elements of the full private corpus when
  // this schema was derived. ---

  // The provenance quartet. Open strings: `source` and `document_id`
  // vocabularies are cross-checked against the room manifests (the full
  // pipeline's room data, not shipped here) by a governance detector of the
  // full pipeline, which is report-only, deliberately not a gate. Closing either vocabulary here would turn that census into an
  // enforcement it was explicitly designed not to be.
  source: z.string(),
  document_id: z.string(),
  section: z.string(),
  section_title: z.string(),

  // Nullable, and the null is authored rather than missing. Two MSK
  // citations on st_johns_wort carry an explicit null for both: they are
  // `source_guidance_status: recommendation_only`, and the MSK verbatim
  // discipline strips recommendation sentences, so nothing quotable
  // survives. The key is still present, which is the corpus recording a
  // known absence rather than omitting the field. `.nullable()` encodes
  // exactly that distinction: null is a legal authored state, absent is not.
  evidence_locator: z.string().nullable(),
  // Source text: the quoted sentence, tagged so the voice layer skips it and
  // the source-text byte rules govern its bytes instead
  // (schema/byte-hygiene/sourceText.ts).
  verbatim: sourceText().nullable(),

  // --- Optional: governed by an existing claim-evidence leaf schema. ---
  citation_status: citationStatusSchema.optional(),
  attribution_level: attributionLevelSchema.optional(),
  interaction_axis: interactionAxisSchema.optional(),
  axis_dose_dependence: axisDoseDependenceSchema.optional(),
  applicability_conditions: applicabilityConditionsSchema.optional(),
  evidence_outcome: evidenceOutcomeSchema.optional(),
  evidence_methodology: evidenceMethodologySchema.optional(),
  evaluation_status: evaluationStatusSchema.optional(),
  frequency_qualifier: frequencyQualifierSchema.optional(),
  source_position: sourcePositionSchema.optional(),
  // The action the sentence directs its reader to take toward a professional,
  // separate from any position and able to sit beside one. Not read off the
  // corpus: it was admitted by decision, and sourceDirective.ts says why.
  source_directive: sourceDirectiveSchema.optional(),

  // --- Optional: no leaf schema. Loosest correct type, no invented enum. ---

  // Dates stay strings. The `yaml` package parses on the YAML 1.2 core
  // schema, where a bare ISO date is a string and not a timestamp, so this
  // is the type the validator actually receives. (YAML 1.1 parsers, Python's
  // included, hand back a date object instead; deriving this key's type from
  // one of those would have produced a schema that rejects the whole corpus.)
  document_published_date: z.string().optional(),
  document_revision: z.string().optional(),

  pharmacologic_class: z.string().optional(),
  retention_note: z.string().optional(),
  source_guidance_status: z.string().optional(),
  source_classification_note: z.string().optional(),

  // Number, as authored: when this schema was derived 2 elements carried it,
  // both bare integers, and a later corpus held none. Typed to what the
  // corpus held rather than widened to accept a string form no record used.
  // Note this schema checks SHAPE only and says nothing about
  // whether the id resolves: PMIDs are verified against PubMed esummary
  // before they are trusted, which is the job of a PMID verification step
  // outside this repo and is not something an offline schema can do.
  pmid: z.number().optional(),

  // --- Optional: the anchor reference. Not read off the corpus. ---

  // The anchor is a primitive in the per-room sidecar (a room's anchors.json,
  // the full pipeline's room data, not shipped here) and a citation carries
  // `anchor_id`, `verbatim` and `scope`, and nothing about placement. The id
  // is the first 16 hex characters of a sha256, so its shape is checked here.
  // Whether it resolves to a sidecar record is NOT checked here and is not
  // unchecked: the join needs the sidecar, which no record-loading module may
  // open, so the anchor check (`check:anchors`, part of the full pipeline and
  // not shipped here) owns it and fails closed on an id no sidecar holds, on a
  // verbatim that does not hash to the anchor's operand, and on an id with no
  // string verbatim beside it. Optional until the re-anchor makes it
  // universal; 57 elements carried it when this was written, all on ginkgo.
  anchor_id: z
    .string()
    .regex(/^[0-9a-f]{16}$/, 'anchor_id must be 16 lowercase hex characters')
    .optional(),

  // The container claim: what the source files these bytes
  // under. A list of one or more source-stated heading strings, each of which
  // must appear in the `headings` of a block the anchor's occurrences sit in;
  // the anchor check joins it to the sidecar and fails closed on zero matches.
  //
  // It is NOT placement: it names a heading, never an offset, a section number
  // or a locator, and retiring the three placement keys this element still
  // requires is a separate change, untouched here.
  //
  // Optional here, and required on a claim that attributes a use
  // category, which the anchor check enforces from the extraction because only
  // it can tell which column the bytes are in. When this was written, measured
  // on the full private corpus at the time and not on this repository, 52
  // elements carried it, all on ginkgo; the other twenty records there gain
  // theirs as the spine backfill anchors them.
  //
  // Deliberately NOT tagged sourceText(), on the `section_title` precedent in
  // schema/byte-hygiene/sourceText.ts: a hand-authored heading string stays
  // ASCII-safe under the house rule until a source byte forces that decision to
  // be revisited on purpose.
  scope: z.array(z.string().min(1)).min(1).optional(),

  // --- Optional: the unresolved marker. ---

  // This registration is what makes carrying it possible: the schema is strict,
  // so before it a citation with an unresolved block failed the parse. Nine
  // markers were carried when this was written, all on ginkgo, all class
  // `anchor_gap` and all `must_close_by: before_pilot_pass`.
  //
  // Shape only. The block's own contract lives in unresolved.ts and its
  // classes and triggers are closed vocabularies fixed there;
  // nothing about them is restated here. The firing rule, that a
  // record may not carry an open block whose must_close_by trigger has passed,
  // is a record-level gate in schema/cli/validator-core.ts and not a property
  // of this element, because a fired trigger is a fact about the repo's
  // calendar rather than about the citation's shape.
  //
  // Optional permanently, not pending a migration. A citation that resolved
  // cleanly carries no marker, and that is the expected state for nearly all
  // of them. Neither an empty list nor an empty block is a legal way to say
  // so: the list requires one entry and the entry requires all four keys.
  unresolved: unresolvedListSchema.optional(),

  // --- Optional: the source's own relevance grade. Admitted by decision. ---

  // A source grades the relevance of a finding it reports ("These types of
  // tumours are not considered relevant to humans"), and until these keys the
  // corpus carried that grade only inside a verbatim, so an agent filtering on
  // labels got the finding without the dismissal. Admitted at 0 uses rather
  // than read off the corpus, on the
  // `source_directive` precedent; relevanceGrade.ts states the grade object,
  // and the relevance gate, part of the full pipeline and not shipped here,
  // derives the field each
  // grade may sit under and the value it may carry. Source-own grades only: an
  // attributed or table-borne grade takes no field and is marked instead.
  human_relevance: humanRelevanceSchema.optional(),
  clinical_relevance: clinicalRelevanceSchema.optional(),
  biological_relevance: biologicalRelevanceSchema.optional(),
  // The relevance lint's other outcome: flagged words that grade nothing, or a
  // grade no field carries, each a verbatim span and a closed reason.
  relevance_marks: relevanceMarksSchema.optional(),
  // A finding whose grade sits in a region the corpus may not quote carries a
  // not-quotable target to the grade. Every other reverse link is derived.
  relevance_grade_not_quotable: relevanceGradeNotQuotableSchema.optional(),

  // --- Optional: the stamp's span, its condition and the stamp marks. Admitted at 0 uses. ---

  // The verbatim bytes source_position and source_directive are read off
  // (stampSpan.ts). The value beside each is derived from its span through the
  // field's printed-string list and never typed; the stamp writer writes both
  // and the stamp gate recomputes the value and holds
  // the span's sentence to the stamp's subject, both part of the full
  // pipeline and not shipped here. Optional: a stamp that prints
  // no word rides its section's heading row instead.
  position_span: stampSpanSchema.optional(),
  directive_span: stampSpanSchema.optional(),
  // The stamp lint's marks, in the shape of relevance_marks: a stamp word that
  // owes no stamp, or a subject the source names only in its own words.
  stamp_marks: stampMarksSchema.optional(),
  // The qualifier the source prints on the statement, verbatim, and the ICH
  // E11 bands derived from its printed ages, never typed. On a stamped citation the condition lies in a stamp span's sentence.
  condition_span: conditionSpanSchema.optional(),
  condition_bands: conditionBandsSchema.optional(),

  // --- Optional: the mechanism and the effect, each read off its span. ---

  // The process a source states and the effect it states, each derived from
  // a span inside the verbatim and stored with it, never typed
  // (mechanismSpan.ts, effectSpan.ts). The mechanism writer writes them
  // and the mechanism gate re-derives every value,
  // both part of the full pipeline and not shipped here.
  // They replaced the retired typed mechanism and direction keys. Each is a
  // LIST, one entry for each clause that derives.
  mechanism: mechanismsSchema.optional(),
  effect: effectsSchema.optional(),
  // The mechanism lint's marks, in the shape of stamp_marks: a process word or
  // a parameter that owes no field, each a verbatim span and a closed reason.
  mechanism_marks: mechanismMarksSchema.optional(),
  // The floor: every table word the verbatim prints on
  // a deriving block, its table, table_term, UTF-8 byte offsets and
  // rule_pointer, an index beside the entries and marks (mechanismSpan.ts;
  // the floor gate is part of the full pipeline, not shipped here).
  [TERM_MATCHES_FIELD]: termMatchesSchema.optional(),
});

export type CitationElement = z.infer<typeof citationElementSchema>;

// The block as authored: a list of elements. Registered in FIELD_SCHEMAS
// under the `citations` key, so the validator's walk applies it wherever a
// citations list appears, at any depth and under any parent.
export const citationsSchema = z.array(citationElementSchema);

export type Citations = z.infer<typeof citationsSchema>;
