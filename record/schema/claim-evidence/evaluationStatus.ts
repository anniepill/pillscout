import { z } from 'zod';

// evaluation_status vocabulary
//
// evaluated = source investigated and reports a finding.
// not_evaluated = source explicitly attests non-investigation
//   ("Studies have not been performed").
// not_reported = source silent.
//
// Grounds to CDISC SDTM completion-status convention (NOT DONE) and the
// ICH E3 / CONSORT not-assessed vs not-reported distinction.

export const evaluationStatusSchema = z.enum([
  'evaluated',
  'not_evaluated',
  'not_reported',
]);

export type EvaluationStatus = z.infer<typeof evaluationStatusSchema>;
