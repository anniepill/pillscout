import { z } from 'zod';

// applicability conditions block
//
// Captures structured constraints under which a claim or citation
// applies. Six optional sub-fields: population, route, formulation,
// condition, duration, genotype, open string arrays whose vocabularies
// accrete from record application under public-vocabulary discipline.
//
// dose_range, the seventh sub-field of the original spec, a typed
// numeric threshold, unit and direction, is retired: the quote carries
// the dose.
// It is not declared below, so the strict object refuses it on a
// citation or a block.
//
// All sub-fields are optional; an empty applicability_conditions
// object validates. Absence of a sub-field means "the source did
// not specify that dimension" rather than "the dimension is open."

// The object below is strict: an unrecognized key is REJECTED, not
// stripped. A plain z.object() silently drops what it does not declare, so
// a coined or misspelled sub-field parsed clean and the block read as
// schema-covered while covering nothing. The closed dimension set is the
// point of this block; a key outside it is a finding, not a value to discard.
// Widening the key set is a vocabulary decision, made deliberately here
// rather than absorbed silently at parse time.

export const applicabilityConditionsSchema = z.strictObject({
  population: z.array(z.string()).optional(),
  route: z.array(z.string()).optional(),
  formulation: z.array(z.string()).optional(),
  condition: z.array(z.string()).optional(),
  duration: z.array(z.string()).optional(),
  genotype: z.array(z.string()).optional(),
});

export type ApplicabilityConditions = z.infer<typeof applicabilityConditionsSchema>;
