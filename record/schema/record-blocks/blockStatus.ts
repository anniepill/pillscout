import { z } from 'zod';
import { sourceText } from '../byte-hygiene/sourceText.js';

// The status discriminator carried by every required block and by every pole
// of a poled block.
//
// The values are not two values plus nuances. They are different epistemic
// claims and a two-value absence token would collapse them:
//
//   present        the block carries source-stated content. The word claims
//                  only that content EXISTS. It is not a judgment about what
//                  the authority concluded, so a present block may carry an
//                  authority's negative finding.
//   stated_absence a cited authority affirmatively states there is nothing.
//                  This is a positive fact with a byte anchor behind it.
//   not_found      every document the record cites, its tier_3_sources apart,
//                  is CHECKED and none addresses the question. Checked means
//                  the document's extraction is committed and every block of
//                  it is carried or dispositioned. This is a claim about
//                  the reading, not about the sources, which is why it forbids
//                  a verbatim and an absence_reason: silence has no reason and
//                  nothing to quote.
//   not_found_in_checked_sources
//                  the same claim over the checked documents only, beside the
//                  cited documents that are not checked, each named with why
//                  (sources_pending). Absence is claimed over the first list
//                  and nothing is claimed over the second.
//   not_assessed   no cited document is checked, so no absence is claimed at
//                  all: the checked list is empty and every cited document is
//                  pending. The block is still carried, because a
//                  required block is never omitted.
//
// The last three are DERIVED, never typed by an author: which one a pole takes
// is a function of its two lists, and the lists are a function of the record's
// citations, the room manifest and the extraction state. Nothing in this
// module checks that a stored status is the derived one; that is the absence
// gate's, and until it lands a status is checked for shape only.
export const blockStatusSchema = z.enum([
  'present',
  'stated_absence',
  'not_found',
  'not_found_in_checked_sources',
  'not_assessed',
]);

export type BlockStatus = z.infer<typeof blockStatusSchema>;

// absence_reason applies to stated_absence only.
//
// The first two values are carried over from the reference_values block's
// existing element-level absence_reason, deliberately reusing its vocabulary
// rather than coining a parallel one: reference_values' documented_absence IS
// this stated_absence state under an older name.
//
// no_statement_required is new and names the Health Canada NNHPD labelling
// determination: a monograph that prints "No statement required." under a
// Contraindication(s) heading has decided that no label statement is needed,
// which is an affirmative regulator finding and not a silence.
export const absenceReasonSchema = z.enum([
  'not_established_by_authority',
  'insufficient_data_in_source',
  'no_statement_required',
]);

export type AbsenceReason = z.infer<typeof absenceReasonSchema>;

// Gate 6, the stated_absence subject check, schema half.
//
// A stated_absence has to quote the authority SAYING there is nothing. A
// heading is not a statement and a table label is not a statement, and both
// are the easy thing to reach for when the section is empty. The heuristic:
// a verbatim is a sentence if it ends in terminal punctuation or runs to more
// than four words.
//
// Calibrated against the two real cases. Health Canada's "No statement
// required." is three words and passes on the terminal period, which is the
// whole reason the punctuation limb exists. A bare heading such as
// "Contraindication(s)" carries neither and fails.
//
// The spec's second limb, a test that evidence_locator is not heading-derived,
// is NOT implemented and was dropped from the spec. It cannot be written
// without false positives: vitamin_d's
// correct contraindications citation carries evidence_locator
// "Contraindication(s) line", which is heading-derived and legitimate. A
// locator names where in the document to look, so being heading-shaped is what
// a good locator does.
// Source text: a stated_absence quotes the authority saying there is nothing,
// so the quoted bytes are the source's and are governed as source bytes, not
// by the house ASCII rule. The sentence refinement below is unaffected: the
// tag is inert at parse time (schema/byte-hygiene/sourceText.ts).
export const sentenceVerbatimSchema = sourceText()
  .min(1)
  .refine(
    (v) => {
      const t = v.trim();
      return /[.!?]["')\]]?$/.test(t) || t.split(/\s+/).length > 4;
    },
    {
      message:
        'stated_absence verbatim must be a sentence: it needs terminal punctuation or more than four words (a heading or a table label is not a statement of absence)',
    },
  );
