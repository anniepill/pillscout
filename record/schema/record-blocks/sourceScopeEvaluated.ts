import { z } from 'zod';

// source_scope_evaluated - the block that records which sources a record
// evaluated, at what tier, and when. It is a required block
// (schema/record-blocks/requiredBlocks.ts).
//
// STRICT, and the key set is DERIVED rather than designed: it was read off the
// carriers with the same yaml parser the validator uses, following
// the citationElement precedent. A key present on every carrier is required,
// every other key is optional, and no enum is invented for a value whose
// vocabulary the corpus has not settled. Any tightening beyond it is a
// separate, deliberate change.
//
// Required: policy_class, policy_version, evaluated_on, next_review_due,
// tier_1_sources and tier_3_policy. Optional: tier_2_sources,
// retained_sources_note and tier_3_sources.
//
// tier_1_sources and tier_2_sources are lists of evaluated sources, each an
// element of the shape below; a source repeated within one tier must carry a
// distinct document_id on every entry.
//
// tier_3_policy is a policy scalar and is NOT closed to an enum: closing one on
// the single value the corpus has used, `regulator_cited_only`, would freeze a
// default into a gate. It is a different field from tier_3_sources and does
// not collide with it: one states the policy, the other lists the documents
// the policy has been applied to.
//
// tier_3_sources holds DOCUMENT IDS, not source names, and lists the partner
// drug labels the absence derivation (part of the full pipeline, not shipped
// here) excludes.
// Document ids are the right granularity: a tier_3 label and a
// tier_1 determination from the same authority would collapse together under
// a source name, and per-label exclusion is what the tier_3 rule means. The
// values are the same strings that appear in each citation's document_id. A
// record with an absence pole and no source_scope_evaluated at all fails
// absence_without_scope, because with no declaration every partner label
// would derive as a pending source.

// One evaluated source, with the date it was retrieved. source and
// retrieved_on are present on every element in the corpus, so both are
// required.
//
// document_id names WHICH document of that source was evaluated, using the
// same (source, document_id) pair that is the record-to-manifest join. Before
// it, a tier entry could only name a source, so iron's two EFSA opinions were
// distinguished by retrieved_on alone and the ids they stood for lived in a
// YAML comment. A fact in a comment is one a consuming agent cannot query: it
// is functionally absent, and worse than a recorded absence.
//
// It is OPTIONAL rather than required, and the uniqueness invariant below is
// what makes that honest. Requiring it would mean backfilling every element
// that lacks one, which is authoring work: deciding which document a tier
// entry meant is a judgment about what was evaluated, not a mechanical fill.
// That belongs to a separate backfill.
export const evaluatedSourceSchema = z.strictObject({
  source: z.string().min(1),
  retrieved_on: z.string().min(1),
  document_id: z.string().min(1).optional(),
});

export type EvaluatedSource = z.infer<typeof evaluatedSourceSchema>;

/**
 * Every element of a tier array must be distinguishable from its siblings.
 *
 * A source token alone identifies an element only while it appears once. The
 * moment a record evaluates two documents from one authority, the entries
 * collapse into a pair a reader cannot tell apart, and resolving them by
 * position or by retrieval date is inference rather than record. This is the
 * same shape as the removed single-row manifest fallback: a
 * source resolving to a document by uniqueness, which is silent and correct
 * right up until it is silent and wrong.
 *
 * So duplicates are admitted only when each carries a distinct document_id.
 */
function requireDistinguishableSources(
  tier: EvaluatedSource[] | undefined,
  field: string,
  ctx: z.RefinementCtx,
): void {
  if (tier === undefined) return;
  const bySource = new Map<string, EvaluatedSource[]>();
  for (const entry of tier) {
    const group = bySource.get(entry.source);
    if (group === undefined) bySource.set(entry.source, [entry]);
    else group.push(entry);
  }
  for (const [source, group] of bySource) {
    if (group.length === 1) continue;
    const ids = group.map((e) => e.document_id);
    if (ids.some((id) => id === undefined)) {
      ctx.addIssue({
        code: 'custom',
        path: [field],
        message:
          `${field} lists source '${source}' ${group.length} times; each entry must carry a ` +
          'document_id, because a repeated source token names no particular document',
      });
      continue;
    }
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({
        code: 'custom',
        path: [field],
        message: `${field} lists source '${source}' with a repeated document_id`,
      });
    }
  }
}

export const sourceScopeEvaluatedSchema = z
  .strictObject({
    policy_class: z.string().min(1),
    policy_version: z.string().min(1),
    evaluated_on: z.string().min(1),
    next_review_due: z.string().min(1),
    tier_1_sources: z.array(evaluatedSourceSchema),
    tier_3_policy: z.string().min(1),
    tier_2_sources: z.array(evaluatedSourceSchema).optional(),
    retained_sources_note: z.string().min(1).optional(),
    tier_3_sources: z.array(z.string().min(1)).optional(),
  })
  .superRefine((block, ctx) => {
    // Uniqueness is checked WITHIN each tier, not across them: the same source
    // may legitimately be evaluated at two tiers, and that is not ambiguity.
    requireDistinguishableSources(block.tier_1_sources, 'tier_1_sources', ctx);
    requireDistinguishableSources(block.tier_2_sources, 'tier_2_sources', ctx);
  });

export type SourceScopeEvaluated = z.infer<typeof sourceScopeEvaluatedSchema>;
