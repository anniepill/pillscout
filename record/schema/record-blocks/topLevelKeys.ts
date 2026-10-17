// Top-level record keys registered by name, outside the required-blocks registry.
//
// A record's top-level key is registered when it is in REQUIRED_BLOCKS or
// CONDITIONAL_BLOCKS (./requiredBlocks.ts), or in this list, and nowhere else:
// FIELD_SCHEMAS names keys at every depth, so its membership registers nothing
// here. The validator refuses any other key (validator-core checkTopLevelKeys),
// so a key cannot be coined to carry a note, as a heading-matching key once
// could.
//
// This list holds exactly the corpus's top-level keys that the required-blocks
// registry does not name, driving_and_machinery among them, which FIELD_SCHEMAS
// alone once registered. A new key is added here in the commit that introduces
// it.
export const LISTED_TOP_LEVEL_KEYS = [
  'amended_by',
  'authored_at',
  'authored_by',
  'bleeding_risk_profile',
  'canonical_name',
  'dose_scoped_contraindications',
  'driving_and_machinery',
  'enzyme_induction_profile',
  'enzyme_inhibition_profile',
  'forms',
  'id',
  'latin_binomial',
  'lung_cancer_risk_profile',
  'paf_antagonism_profile',
  'photosensitivity',
  'reviewed_by',
  'seizure_risk_profile',
  'serotonergic_profile',
  'special_care_interactions',
  'status',
  'substance_type',
  'transporter_induction_profile',
  'transporter_inhibition_profile',
  'vocabulary_entry',
] as const;
