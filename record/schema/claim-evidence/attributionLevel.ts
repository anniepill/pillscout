import { z } from 'zod';

// attribution_level vocabulary
//
// Discriminates whether a claim attaches to a specific named
// substance, to a class the substance belongs to, or is absent
// from the source. Field is optional at the schema layer; absence
// is valid until the field is backfilled into records.

export const attributionLevelSchema = z.enum([
  'class_effect',
  'drug_specific',
  'not_reported',
]);

export type AttributionLevel = z.infer<typeof attributionLevelSchema>;
