import { z } from 'zod';

// evidence_methodology vocabulary
//
// Enum carried from record usage (the early interaction records, SJW,
// ginkgo); completeness reconciled when the interaction records were
// re-tagged.
//
// regulator_assessment        — a regulator's own synthesis of the evidence base
//                               (e.g. EMA HMPC assessment reports). Statutory authority.
// curated_tertiary_synthesis  — a curated non-regulator source's own safety synthesis
//                               (e.g. NIH ODS, MSK About Herbs). No statutory authority;
//                               high clinical or federal evidence-review weight.
// pharmacovigilance_database  — a post-marketing pharmacovigilance database
//                               signal (e.g. BfArM spontaneous-report database)
// regulator_assessment and curated_tertiary_synthesis surfaced while tagging
// NCCIH/ODS/MSK sources; pharmacovigilance_database while tagging ginkgo.

export const evidenceMethodologySchema = z.enum([
  'rct',
  'controlled_study',
  'meta_analysis',
  'case_report',
  'case_series',
  'mechanism_inference',
  'in_vitro',
  'animal_study',
  'regulator_assessment',
  'curated_tertiary_synthesis',
  'pharmacovigilance_database',
  'not_reported',
]);

export type EvidenceMethodology = z.infer<typeof evidenceMethodologySchema>;
