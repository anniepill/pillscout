import { z } from 'zod';

// evidence_outcome vocabulary
//
// mixed_finding is scoped to within-citation conflicting results on one
// endpoint, NOT GRADE between-study heterogeneity. not_reported is
// deliberately excluded here; source-silence routes to evaluationStatus.

export const evidenceOutcomeSchema = z.enum([
  'positive_finding',
  'null_finding',
  'mixed_finding',
  'not_applicable',
]);

export type EvidenceOutcome = z.infer<typeof evidenceOutcomeSchema>;
