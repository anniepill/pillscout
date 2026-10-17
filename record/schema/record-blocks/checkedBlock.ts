import { z } from 'zod';
import { citationElementSchema } from '../claim-evidence/index.js';
import {
  absenceReasonSchema,
  sentenceVerbatimSchema,
} from './blockStatus.js';
import { sourcesCheckedEntrySchema } from './sourcesChecked.js';
import { sourcesPendingEntrySchema } from './sourcesPending.js';
import { unresolvedListSchema } from '../claim-evidence/unresolved.js';

// The uniform wrapper. Every required block is a discriminated union on
// `status`, one variant per value of blockStatus.ts; the positive payload
// keeps whatever convention the block already had, so an already-complete
// record migrates by WRAPPING its existing content rather than by rewriting it.
//
// Why a discriminated union rather than one object with optional fields.
// Optional fields cannot express "stated_absence forbids sources_checked":
// they would admit a block carrying a quoted absence AND a reading, which are
// two different claims that must not co-occur. Each variant is its own
// strictObject, so the forbids half of gates 3 and 4 falls out of strictness
// and needs no custom refinement. Verified against zod 4.4.3: a strictObject
// inside a discriminated union still reports `Unrecognized key`.
//
// The same strictness carries most of the absence status rule. The three
// absence-over-sources variants differ only in which of the two lists is empty,
// and each variant's shape admits exactly its own case: not_found refuses a
// sources_pending key, not_found_in_checked_sources requires both lists
// non-empty, and not_assessed requires the checked list empty and the pending
// list not. So a stored status that contradicts its own lists fails the parse.
// What the parse cannot see is whether the lists are the DERIVED ones, which is
// the absence gate's question and not this file's.
//
// Gate 2 also falls out: a missing or misspelled `status` fails on the
// discriminator, so no separate presence check is needed for it.

// stated_absence - a cited authority affirmatively states there is nothing.
// Requires the quote, the byte anchor (carried inside the citation element as
// document_id / section / evidence_locator) and a reason. Forbids
// sources_checked by strictness.
export const statedAbsenceVariantSchema = z.strictObject({
  status: z.literal('stated_absence'),
  absence_reason: absenceReasonSchema,
  verbatim: sentenceVerbatimSchema,
  citations: z.array(citationElementSchema).min(1),
});

// not_found - every cited document, tier_3_sources apart, is checked and none
// addressed the question. Requires the checked list. Forbids verbatim,
// citations and absence_reason by strictness: there is nothing to quote,
// nothing to cite, and silence has no reason. Forbids sources_pending too: a
// pending document means the reading is partial, which is the next variant and
// never this one.
export const notFoundVariantSchema = z.strictObject({
  status: z.literal('not_found'),
  sources_checked: z.array(sourcesCheckedEntrySchema).min(1),
});

// not_found_in_checked_sources - absence over the checked documents, with the
// cited documents that are not checked named beside them. Both lists are
// required non-empty: an empty pending list is plain not_found, and an empty
// checked list is not_assessed.
export const notFoundInCheckedSourcesVariantSchema = z.strictObject({
  status: z.literal('not_found_in_checked_sources'),
  sources_checked: z.array(sourcesCheckedEntrySchema).min(1),
  sources_pending: z.array(sourcesPendingEntrySchema).min(1),
});

// not_assessed - no cited document is checked, so no absence is claimed.
// The checked list is REQUIRED and EMPTY rather than absent, so all three
// absence-over-sources variants carry the same two keys and a reader computes
// "N of M checked" the same way on each: here N is zero and says so.
export const notAssessedVariantSchema = z.strictObject({
  status: z.literal('not_assessed'),
  sources_checked: z
    .array(sourcesCheckedEntrySchema)
    .max(
      0,
      'not_assessed checks no document; a pole with a checked document is not_found or ' +
        'not_found_in_checked_sources',
    ),
  sources_pending: z.array(sourcesPendingEntrySchema).min(1),
});

/**
 * What every `present` block may carry whatever its payload is.
 *
 * The `unresolved` marker records a fact the session could not file, and until
 * now a block could not carry one: `unresolved` is registered in FIELD_SCHEMAS
 * and on the citation element, but a strict `present` variant rejected the key,
 * so the marker could sit only on a citation, on a loose block or on a block no
 * schema governs. The one place it is most needed is the one place it was
 * refused: a fact with no citation yet, in a required block.
 *
 * A LIST, so a block that owes two deferrals can hold both; one slot forced
 * the corpus's first nine markers into homes chosen by what was free rather
 * than by what the fact is about.
 *
 * Declared here rather than per block so every required block gains it in one
 * edit, and declared rather than merely admitted so a LOOSE block's marker is
 * shape-checked too. The walk in validator-core does not descend into a
 * registered block schema, so before this a marker inside a loose block passed
 * unread; now the block's own schema parses it. A marker nested DEEPER than the
 * block's own keys, on a sub-object the shape does not describe, is still
 * unchecked by shape, and gate 6 is what reads it there.
 *
 * Only the `present` variant takes it. A `stated_absence` block has a source
 * sentence and a citation, and the three absence-over-sources variants have
 * their two lists, whose pending half is already the record of what could not
 * be read and why; none of them is a fact the session could not file, so
 * admitting a marker there would blur the one distinction the discriminator
 * exists to make.
 */
const SHARED_PRESENT_SHAPE = {
  unresolved: unresolvedListSchema.optional(),
};

/**
 * Build a required block's status-discriminated schema from its positive
 * payload.
 *
 * Takes a raw shape rather than a built schema so the `present` variant is
 * assembled exactly once, strict from the start. Building it by `.extend()`ing
 * a caller-supplied object would let a caller hand in a loose object and
 * silently produce a non-strict present variant.
 *
 * presentMode: 'strict' rejects unknown keys inside `present`. Use it where
 * the payload key set is KNOWN, either from the vitamin_d reference record or
 * because the block is new in this pass. 'loose' admits unknown keys and is
 * for blocks whose key set has not been derived from the corpus yet; those
 * derivations belong to a later migration and follow the citationElement
 * precedent (key set read off the corpus with the validator's own parser,
 * never designed). A loose present variant is a placeholder, not a decision.
 */
export function checkedBlock<Shape extends z.ZodRawShape>(
  presentShape: Shape,
  presentMode: 'strict' | 'loose' = 'strict',
) {
  return z.discriminatedUnion('status', checkedBlockVariants(presentShape, presentMode));
}

/**
 * The five variants checkedBlock unions, as a tuple, so a block that admits
 * more than the five can union these with its own and the five stay defined
 * once. The two name-lookup poles are the one such block (nameLookup.ts).
 */
export function checkedBlockVariants<Shape extends z.ZodRawShape>(
  presentShape: Shape,
  presentMode: 'strict' | 'loose' = 'strict',
) {
  const presentVariant =
    presentMode === 'strict'
      ? z.strictObject({ status: z.literal('present'), ...SHARED_PRESENT_SHAPE, ...presentShape })
      : z.looseObject({ status: z.literal('present'), ...SHARED_PRESENT_SHAPE, ...presentShape });

  return [
    presentVariant,
    statedAbsenceVariantSchema,
    notFoundVariantSchema,
    notFoundInCheckedSourcesVariantSchema,
    notAssessedVariantSchema,
  ] as const;
}

// SUPERSEDED WORDING. This read: "The payload shared by most blocks whose
// positive content is a PROSE BASIS plus its citations". That sentence is the
// defect, not a description of one. A prose basis is the corpus's own summary
// of why a block says what it says, and the defined-terms rule refuses exactly
// that: a structured field never holds the corpus's own summary of a source
// sentence.
// The field was designed to hold what the rule forbids.
//
// Measured over the 21 values that were not the reference_values
// enum: 4 were near-verbatim compressions of a single cited sentence, and the
// other 17 summarised - five of them ACROSS AUTHORITIES, which also breaks the
// rule that no value is merged across authorities. iron's pediatric_use synthesised 7 citations from 4 authorities into
// 225 characters, the largest instance in the corpus. `insufficient_data`
// appeared on 8 records and the word "insufficient" was in no cited verbatim
// of any of them: the sources say "lack of data", "has not been established"
// and "no data available", three different statements collapsed into one
// corpus word that none of them uses.
//
// `basis` IS GONE from this shape, with the records that carried it. It was
// optional for exactly one commit, because the key was
// required before: deleting it from a record without a schema change fails the
// parse, and removing it from a strict shape while a record still carries it
// fails the parse the other way. Optional is the only state valid with and
// without, so it was the bridge and not a destination.
//
// The shape is RENAMED here rather than a commit earlier, so the rename lands
// when the name actually changes meaning. What it holds now is citations, and
// that is all it ever should have held: a block's positive content is what its
// sources say, carried on the citations that say it.
//
// ginkgo's three pregnancy_lactation poles carried `basis`, declared on their
// own shape in blocks.ts and not through this one, until it was removed from
// both the record and that shape.
export const citationsShape = {
  citations: z.array(citationElementSchema).min(1),
};
