import { z } from 'zod';

import { sourceText } from '../byte-hygiene/sourceText.js';
import { UNREPRESENTABLE_REASONS } from '../extract/unrepresentable.js';

// A source's own grade of the relevance of a finding it reports.
//
// THREE CITATION-LEVEL FIELDS, one question each:
//
//   human_relevance       does a NON-HUMAN finding (in vitro, animal) carry to
//                         humans
//   clinical_relevance    how much does a HUMAN finding matter
//   biological_relevance  a HUMAN finding the source grades as biological or
//                         physiological relevance
//
// Which field a grade sits under is DERIVED, never typed, and the relevance
// gate, part of the full pipeline and not shipped here, holds the key to the
// derivation: human versus non-human by the derivation's steps, which read
// printed phrases and the citation's section, clinical versus biological by
// the source's grade noun. Never from the source's word
// "clinical" alone: the cinnamon WHO sentence grades an in vitro finding by
// its "clinical significance" and sits under human_relevance.
//
// EACH FIELD IS A LIST OF GRADE OBJECTS. A sentence grading two clauses
// carries two objects, and a clause grading findings of mixed evidence type
// carries one object per field, each linking only its own findings
// (held instance curcumin bleeding_risk_profile.citations[0]).
//
// THE VALUE IS DERIVED, NEVER TYPED. It is stored, because a consuming agent
// queries it, and the gate recomputes it from grade_span through the
// relevance word table (class relevance_value_underived): the relevance
// writer writes it, the gate refuses one the table
// does not give. The table and the writer are part of the full pipeline, not
// shipped here. The value sets are NOT ORDINAL: `unknown` is not a middle
// grade between two others, and no consumer may write a threshold over them.
//
// EVERY SPAN IS VERBATIM, byte-exact against the citation's stored verbatim,
// line feeds included; a finding_span is byte-exact against the
// verbatim it resolves to, which may be another citation's. Every span is
// tagged source text so the voice layer leaves the source's bytes alone.
//
// THE FIELD QUALIFIES A FINDING AND NEVER SUPPRESSES OR FILTERS IT. A grade
// rides the citation that carries it; nothing reads a value as a reason to
// drop the finding it grades.

export const RELEVANCE_FIELDS = ['human_relevance', 'clinical_relevance', 'biological_relevance'] as const;
export type RelevanceField = (typeof RELEVANCE_FIELDS)[number];

export const HUMAN_RELEVANCE_VALUES = [
  'not_relevant',
  'questioned',
  'unknown',
  'limited',
  'cannot_be_excluded',
  'relevant',
] as const;
export const CLINICAL_RELEVANCE_VALUES = [
  'not_relevant',
  'minor',
  'limited',
  'questioned',
  'unknown',
  'relevant',
] as const;
export const BIOLOGICAL_RELEVANCE_VALUES = ['not_relevant', 'unknown', 'relevant'] as const;

export type RelevanceValue =
  | (typeof HUMAN_RELEVANCE_VALUES)[number]
  | (typeof CLINICAL_RELEVANCE_VALUES)[number]
  | (typeof BIOLOGICAL_RELEVANCE_VALUES)[number];

/** The legal values of each field. Not ordinal. */
export const RELEVANCE_VALUES: Readonly<Record<RelevanceField, readonly string[]>> = {
  human_relevance: HUMAN_RELEVANCE_VALUES,
  clinical_relevance: CLINICAL_RELEVANCE_VALUES,
  biological_relevance: BIOLOGICAL_RELEVANCE_VALUES,
};

// The basis of a grade. `basis_span` is required for the three stated values
// and absent for not_reported, which records that the source gives none.
// `exposure_above_use` marks a dismissal conditional on exposure and is never
// read as "does not apply at any dose". A grade stating several reasons carries
// several entries.
export const STATED_BASES = ['species_specific_mechanism', 'exposure_above_use', 'other_stated'] as const;
export const RELEVANCE_BASES = [...STATED_BASES, 'not_reported'] as const;

export const basisEntrySchema = z.union([
  z.strictObject({ basis: z.literal('not_reported') }),
  z.strictObject({ basis: z.enum(STATED_BASES), basis_span: sourceText().min(1) }),
]);

// A target the corpus may not quote: document, locator and reason. The gate
// holds each to the extraction record of that document: the
// locator must be an unrepresentable ref in the document's committed
// unrepresentable.json (the full pipeline's room data, not shipped here) and
// the reason that entry's reason. A document with no
// committed extraction cannot be a not-quotable target and the gate fails it
// closed; nothing here is typed that the repo cannot confirm. The document must
// be the citation's own: a link never crosses documents.
export const notQuotableTargetSchema = z.strictObject({
  source: z.string().min(1),
  document_id: z.string().min(1),
  locator: z.string().min(1),
  reason: z.enum(UNREPRESENTABLE_REASONS),
});

// The pointer, stored once on the grade. A finding is named by its own words,
// resolved by a folded, word-bounded match within the same record and the same
// document, and then held byte for byte to the one verbatim it matches; the
// gate derives whether it is the grade's own verbatim (self) or
// another citation's (named), and derives the reverse index. Chosen over a
// record path, which retargeted silently when a record site moved, and over a
// hash of the finding's verbatim, which breaks on 11 of 137 re-anchors.
export const findingTargetSchema = z.union([
  z.strictObject({ finding_span: sourceText().min(1) }),
  z.strictObject({ not_quotable: notQuotableTargetSchema }),
]);

function gradeObjectSchema<V extends readonly [string, ...string[]]>(values: V) {
  return z.strictObject({
    value: z.enum(values),
    // The whole graded clause, verbatim. The word table matches inside it.
    grade_span: sourceText().min(1),
    // Each verbatim and inside grade_span. A hedge word inside grade_span must
    // sit inside one of these, or inside a basis_span or condition_span.
    hedge_tokens: z.array(sourceText().min(1)).min(1).optional(),
    bases: z.array(basisEntrySchema).min(1),
    // Present when the grade holds only under a stated condition. May hold the
    // same bytes as a basis_span.
    condition_span: sourceText().min(1).optional(),
    // Mandatory: a grade's link to its finding. A grade over plural findings
    // ("these findings") links each.
    findings: z.array(findingTargetSchema).min(1),
  });
}

export const humanRelevanceGradeSchema = gradeObjectSchema(HUMAN_RELEVANCE_VALUES);
export const clinicalRelevanceGradeSchema = gradeObjectSchema(CLINICAL_RELEVANCE_VALUES);
export const biologicalRelevanceGradeSchema = gradeObjectSchema(BIOLOGICAL_RELEVANCE_VALUES);

export const humanRelevanceSchema = z.array(humanRelevanceGradeSchema).min(1);
export const clinicalRelevanceSchema = z.array(clinicalRelevanceGradeSchema).min(1);
export const biologicalRelevanceSchema = z.array(biologicalRelevanceGradeSchema).min(1);

export type RelevanceGrade =
  | z.infer<typeof humanRelevanceGradeSchema>
  | z.infer<typeof clinicalRelevanceGradeSchema>
  | z.infer<typeof biologicalRelevanceGradeSchema>;

// The marks. A verbatim the relevance lint flags is either
// labelled or marked, and a mark is a verbatim span on the citation plus a
// reason from a closed set. Two kinds, because an attributed or table-borne
// grade IS a grade and calling it not-a-grade would be false:
//
//   not_a_grade          the flagged words grade nothing
//   grade_without_field  a grade the fields do not carry, by rule
//
// The reasons are a closed set. The relevance lint's tests, part of the full
// pipeline and not shipped here, pin a held verbatim for each reason the
// day-one set uses.
export const NOT_A_GRADE_REASONS = [
  'warning_or_prediction',
  'heading_or_title',
  'other_sense',
  'exposure_critique',
  'extrapolation_out_of_scope',
  'regulatory_scope',
  'template_or_guidance',
] as const;
export const GRADE_WITHOUT_FIELD_REASONS = ['attributed', 'table_cell', 'evidence_type_unstated'] as const;

export const relevanceMarkSchema = z.union([
  z.strictObject({ kind: z.literal('not_a_grade'), reason: z.enum(NOT_A_GRADE_REASONS), span: sourceText().min(1) }),
  z.strictObject({
    kind: z.literal('grade_without_field'),
    reason: z.enum(GRADE_WITHOUT_FIELD_REASONS),
    span: sourceText().min(1),
  }),
]);
export const relevanceMarksSchema = z.array(relevanceMarkSchema).min(1);

// The reverse of a not-quotable link: a cited finding whose grade sits in a
// region the corpus may not quote carries a not-quotable target to the grade.
// Every other reverse link is derived by the gate and never stored.
export const relevanceGradeNotQuotableSchema = z.array(notQuotableTargetSchema).min(1);
