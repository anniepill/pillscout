import { z } from 'zod';

// citation_status vocabulary
//
// Per-citation status discriminator. Allows citations to carry
// retrieval and applicability state structurally rather than via
// comment-based markers.
//
// not_reported is an authorable member for the case where the cited block
// states no status. It is a value an
// authoring session writes, never a schema default; nothing coerces an absent
// field to it.

export const citationStatusSchema = z.enum([
  'cited',
  'retained_pre_scope_lock',
  'pending_retrieval',
  'restricted_access',
  'not_applicable',
  'not_reported',
]);

export type CitationStatus = z.infer<typeof citationStatusSchema>;
