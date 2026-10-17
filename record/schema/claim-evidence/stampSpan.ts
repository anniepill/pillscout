import { z } from 'zod';

import { sourceText } from '../byte-hygiene/sourceText.js';
import { AGE_BAND_ROWS } from '../wording/stamp.js';

// The span a stamp is read off, and the marks the stamp lint takes.
//
// A STAMP CARRIES ITS SPAN. `source_position` is read off `position_span`
// and `source_directive` off `directive_span`: the verbatim bytes of the
// citation that print the position or the action, byte-contained in the
// verbatim, line feeds included. The value is DERIVED from the span through
// the field's printed-string list (POSITION_WORDING or DIRECTIVE_WORDING in
// schema/wording/stamp.ts), exactly as a relevance value derives from
// its grade_span: the stamp writer (full pipeline, not shipped here) writes the span and the
// value together and the stamp gate recomputes the value and refuses one
// the list does not give; the writer and the gate are part of the full
// pipeline, not shipped here. A stamp that prints no word rides the heading of the
// section it is filed under instead, where a row says that heading carries the
// tier; a stamp with neither fails.
//
// The span also names the SENTENCE the stamp sits on, and the gate holds that
// sentence to the stamp's subject: the pole, the partner or the population the
// stamp is filed under. That is what the verb-anywhere check could not see: two
// fertility poles carried a stamp read off a sentence about pregnancy and
// lactation. A span occurs once in the verbatim and lies within one sentence,
// so the sentence it names is never in doubt.
//
// A CONDITION TRAVELS WITH ITS STOP. `condition_span`
// is the qualifier the source prints on the statement, "except on medical
// advice" or "before bedtime", verbatim, one occurrence, one sentence; on a
// stamped citation it lies in a stamp span's sentence, so a qualified stop is
// never served without its qualifier. `condition_bands` is DERIVED from it,
// never typed: the ICH E11 rows whose age range the condition prints
// (AGE_BAND_ROWS in schema/wording/stamp.ts), and absent where it prints none.

/** The span key each stamp field is read off. */
export const STAMP_SPAN_OF = {
  source_position: 'position_span',
  source_directive: 'directive_span',
} as const;
export type StampField = keyof typeof STAMP_SPAN_OF;
export const STAMP_FIELDS = Object.keys(STAMP_SPAN_OF) as StampField[];

export const stampSpanSchema = sourceText().min(1);

// The marks, in the shape of relevance_marks: a kind, a reason from a closed
// set, and a verbatim span. Two kinds, because they answer two questions:
//
//   not_a_stamp     a stamp word is printed and no stamp is owed: the sentence
//                   is assessment-report narrative, the source relays another
//                   body's statement rather than speaking in its own voice
//                   (attributed), the word is `avoid` aimed at a co-behavior
//                   the directive already carries, or it targets something
//                   other than the subject. One mark clears one printed
//                   occurrence.
//   subject_coined  a stamp stands, but the block's subject term is a coined
//                   token the source never prints, so the span's sentence
//                   cannot name it; the mark's span is the source's own words
//                   for the subject, and holds no stamp word
//
// The five reasons are a closed set, each drawn from a held classification.
// `attributed` replaced `speaker_not_regulator`: any roster source speaking in
// its own voice may carry a stamp, so what leaves a stop word unstamped is
// relaying, not the speaker's kind.
export const NOT_A_STAMP_REASONS = [
  'assessment_report_narrative',
  'attributed',
  'co_behavior_avoid',
  'other_target',
] as const;
export const SUBJECT_MARK_REASONS = ['subject_term_coined'] as const;
export const STAMP_MARK_REASONS = [...NOT_A_STAMP_REASONS, ...SUBJECT_MARK_REASONS] as const;

export const stampMarkSchema = z.union([
  z.strictObject({ kind: z.literal('not_a_stamp'), reason: z.enum(NOT_A_STAMP_REASONS), span: sourceText().min(1) }),
  z.strictObject({ kind: z.literal('subject_coined'), reason: z.enum(SUBJECT_MARK_REASONS), span: sourceText().min(1) }),
]);
export const stampMarksSchema = z.array(stampMarkSchema).min(1);
export type StampMark = z.infer<typeof stampMarkSchema>;

/** The condition key and its derived bands. */
export const CONDITION_SPAN = 'condition_span';
export const CONDITION_BANDS = 'condition_bands';
export const conditionSpanSchema = sourceText().min(1);
export const AGE_BANDS = AGE_BAND_ROWS.map((r) => r.band) as [string, ...string[]];
export const conditionBandsSchema = z.array(z.enum(AGE_BANDS)).min(1);
