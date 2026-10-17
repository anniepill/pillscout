import { z } from 'zod';

// The unresolved marker.
//
// Any field or citation may carry an `unresolved` block recording a fact the
// authoring session could not file, so that it neither guesses nor stops:
// `class`, `note`, `opened`, `must_close_by`.
//
// Both enums are fixed by the full pipeline's extraction contract (not
// shipped here). They are closed vocabularies consumers will read, which is
// why they belong to the contract and are not coined here; the values below
// must not widen without a deliberate vocabulary decision.
//
// This module is the shape contract and nothing else. The schema is
// registered in FIELD_SCHEMAS and as an optional key on citationElementSchema,
// and the firing rule is gate 6 (checkUnresolvedTriggers) in schema/cli/
// validator-core.ts, which reads FIRED_TRIGGERS from check-triggers.ts so the
// fired-trigger list has one code copy.
//
// One narrowing stands, recorded in gate 6's own comment: the rule says a
// record may not LEAVE AUTHORING STATUS carrying an overdue block, and there
// is no authoring status to read. The gate checks every record instead, which
// is stricter than the rule and never laxer. It resolves when a block-status
// discriminator gives "authoring status" a meaning.

// The six classes. Routing for each lives in the extraction contract rather
// than being restated. scope_call versus product_call: if the scope lists
// answer the question it is a scope_call, looked up; if the answer depends on
// what the product should do rather than on what the source or the lists say,
// it is a product_call and halts to the product owner.
export const UNRESOLVED_CLASSES = [
  'no_slot',
  'vocabulary_gap',
  'scope_call',
  'source_conflict',
  'product_call',
  'anchor_gap',
] as const;

export const unresolvedClassSchema = z.enum(UNRESOLVED_CLASSES);

// The fixed triggers.
export const MUST_CLOSE_BY = [
  'before_extractor_commit',
  'before_contract_cluster',
  'before_pilot_start',
  'before_pilot_pass',
  'before_rollout',
  'before_cabinet_3c',
  'legal_review',
  'after_build_2',
  'after_build_3',
  'after_build_4',
  'after_build_5',
] as const;

// The parameterised twelfth trigger. `<category>` is drawn from the
// substance class typology's closed list; no code home for that list exists
// yet, so the category is checked for shape (lowercase snake_case, non-empty)
// and not for membership.
export const FIRST_RECORD_OF = /^first_record_of:[a-z0-9]+(_[a-z0-9]+)*$/;

export const mustCloseBySchema = z.union([
  z.enum(MUST_CLOSE_BY),
  z
    .string()
    .regex(FIRST_RECORD_OF, 'must_close_by must be a fixed trigger or first_record_of:<category>'),
]);

export const unresolvedBlockSchema = z.strictObject({
  class: unresolvedClassSchema,
  note: z.string().min(1),
  opened: z.iso.date(),
  must_close_by: mustCloseBySchema,
});

/**
 * A field, a citation or a block carries a LIST of markers, never one.
 *
 * One slot once held one marker, and the first nine markers the
 * corpus wrote broke on it immediately: two facts owed to the same block had
 * nowhere to go and were filed against blocks that were true but not the
 * nearest, because the nearer one was taken. A container that can hold one
 * deferral can hold two, and which container a marker sits in is the only
 * thing that tells a reader what the deferral is about.
 *
 * List-only, minimum one, no union with the bare object. A reader that has to
 * handle two shapes is a reader that will handle one of them wrong, and at
 * nine markers corpus-wide the migration is cheaper than the branch.
 *
 * No two entries in one list share a `class` AND a `note`. This replaces
 * the earlier rule that a repeat attaches to the first: with a list there is
 * something to attach to, and the duplicate is the thing to refuse. Two
 * genuinely different deferrals differ in their note, which is the field that
 * says what is owed.
 */
export const unresolvedListSchema = z
  .array(unresolvedBlockSchema)
  .min(1, 'an unresolved list carries at least one marker; omit the key instead')
  .refine(
    (list) => new Set(list.map((m) => `${m.class}\u0000${m.note}`)).size === list.length,
    'two markers in one list carry the same class and note; one deferral is one entry',
  );

export type UnresolvedClass = z.infer<typeof unresolvedClassSchema>;
export type UnresolvedList = z.infer<typeof unresolvedListSchema>;
export type MustCloseBy = z.infer<typeof mustCloseBySchema>;
export type UnresolvedBlock = z.infer<typeof unresolvedBlockSchema>;
