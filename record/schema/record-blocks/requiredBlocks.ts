// The frozen required-question list, as DATA.
//
// This is a list and not a schema because gate 1 asks about a key's ABSENCE,
// and no Zod schema can be applied to a key that is not there. The validator's
// walk is key-driven (it iterates Object.entries and looks each key up in
// FIELD_SCHEMAS), so it can never fire on a missing block. Gate 1 is therefore
// a second pass over the document root, and this array is its input.
//
// A question belongs here if the cabinet engine computes on it, or if the
// downstream flag layer would be wrong without it. Regulator section headings
// are discovery input and not membership criteria, which is why eight
// monograph-shaped candidates were declined rather than deferred.

export const REQUIRED_BLOCKS = [
  'substance_identity',
  'regulatory_classification',
  'source_scope_evaluated',
  'pharmacology',
  'posology',
  'hepatotoxicity_assessment',
  'contraindications',
  'other_warnings_and_precautions',
  'pregnancy_lactation',
  'pediatric_use',
  'special_populations',
  'documented_adverse_reactions',
  'documented_interactions',
  'overdose',
  'preclinical_safety',
  'citation_gaps',
  'version_history',
  'friction',
] as const;

export type RequiredBlock = (typeof REQUIRED_BLOCKS)[number];

// Conditional on substance_type. Nutrient records additionally carry
// reference_values; herb records add nothing beyond the universal list.
//
// Botanical identity attributes (latin_binomial, family, plant_part,
// plant_part_common_name) are NOT here. They are conditional on
// substance_type: herb and they are attributes rather than questions, so their
// absence on a nutrient record asserts nothing and needs no status.
export const CONDITIONAL_BLOCKS: Record<string, readonly string[]> = {
  nutrient: ['reference_values'],
  herb: [],
};

/**
 * The blocks a record of this substance_type must carry.
 *
 * An unknown or missing substance_type yields the universal list only. It is
 * deliberately not an error here: substance_type conformance is a different
 * question from block presence, and folding them would report one defect as
 * two.
 */
export function requiredBlocksFor(
  substanceType: unknown,
): readonly string[] {
  const conditional =
    typeof substanceType === 'string'
      ? (CONDITIONAL_BLOCKS[substanceType] ?? [])
      : [];
  return [...REQUIRED_BLOCKS, ...conditional];
}
