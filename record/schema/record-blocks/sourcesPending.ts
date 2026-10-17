import { z } from 'zod';

// sources_pending - the cited documents an absence pole could NOT read, each
// with why and with what clears it.
//
// A pole may claim absence over checked documents only. A cited document that
// is not checked is never dropped from the pole and never read as silent: it
// is listed here, and the served statement names it as not yet checked, or as
// not checkable at all.
//
// DERIVED, never typed. The status, the checked list and this list are all
// computed from the record's citations, the room manifest and the extraction
// state. Nothing in this file checks that a stored list is the derived one;
// that is the absence gate's job, and until it lands the lists are checked for
// shape only.

/**
 * Why a cited document is pending, in the order the derivation asks.
 *
 * The first four are the refusals the manifest eligibility check (part of the
 * full pipeline, not shipped here) already returns, in its own order and under its own names, because the extractor
 * asks eligibility before it reads a byte and a document the extractor would
 * refuse cannot have been checked. The last three are the states after
 * eligibility: no source-family rule claims the row, a rule claims it and no
 * extraction is committed, or an extraction is committed and some block of it
 * is neither carried nor dispositioned, which is short of checked.
 *
 * Eligibility's `no_such_row` and `ambiguous_row` are NOT reasons: a cited
 * document that does not join to exactly one manifest row is a defect the
 * manifest check (part of the full pipeline) already fails, and listing it as pending would serve a
 * broken join as an honest gap.
 */
export const PENDING_REASONS = [
  'governance_ceiling',
  'not_retrieved',
  'class_1b_scan_pending',
  'third_party_content_flagged',
  'no_extraction_rule',
  'extraction_not_committed',
  'extraction_not_accounted',
] as const;

export const pendingReasonSchema = z.enum(PENDING_REASONS);
export type PendingReason = z.infer<typeof pendingReasonSchema>;

/**
 * What clears a pending entry. Its own closed list and not the `must_close_by`
 * vocabulary: that vocabulary says by when a deferral must close, and this
 * says which event makes the document checkable, which is a question about the
 * repo's state and not its calendar. Neither vocabulary gains a token for the
 * other's sake.
 *
 * Two values, because every reason but one clears on the same event. A
 * `governance_ceiling` document may never be committed, so no event in this
 * repo makes it checkable; every other document becomes checked when its
 * extraction is committed with every block carried or dispositioned, whatever
 * stands in the way first.
 */
export const CLEARS_ON = ['extraction_accounted', 'no_clearing_event'] as const;

export const clearsOnSchema = z.enum(CLEARS_ON);
export type ClearsOn = z.infer<typeof clearsOnSchema>;

/** The one value of `clears_on` each reason admits. */
export function clearsOnFor(reason: PendingReason): ClearsOn {
  return reason === 'governance_ceiling' ? 'no_clearing_event' : 'extraction_accounted';
}

/**
 * One pending document. It names the document by the pair a `sources_checked`
 * entry uses, (source, document_id), which joins to the room manifest on the
 * two-part rule; it never quotes the document, so it never anchors.
 *
 * `clears_on` is a function of `pending_reason`, and the refinement holds it
 * to that function in both directions, so a stored pair can never say a
 * licensing ceiling will clear or that a missing rule never will.
 */
export const sourcesPendingEntrySchema = z
  .strictObject({
    source: z.string().min(1),
    document_id: z.string().min(1),
    pending_reason: pendingReasonSchema,
    clears_on: clearsOnSchema,
  })
  .refine((e) => e.clears_on === clearsOnFor(e.pending_reason), {
    message:
      'clears_on is no_clearing_event exactly when pending_reason is governance_ceiling: a ' +
      'governance_ceiling document may never be committed, so nothing clears it, and every ' +
      'other document clears when its extraction is committed with every block accounted for',
    path: ['clears_on'],
  });

export type SourcesPendingEntry = z.infer<typeof sourcesPendingEntrySchema>;
