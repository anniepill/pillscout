import { z } from 'zod';

// frequency_qualifier vocabulary
//
// Maps 1:1 to EMA SmPC section 4.8 ADR frequency taxonomy.
// not_known is the EMA "not known (cannot be estimated from the available
// data)" category.
//
// not_reported is an authorable member for the case where the cited block
// states no frequency. It is a value an
// authoring session writes, never a schema default; nothing coerces an absent
// field to it. It is NOT not_known: not_known is the EMA category above, a
// frequency a source assigned, and not_reported is the corpus recording that
// no source assigned one.
//
// That distinction was once a gap, and ginkgo rows were flagged for it. They
// were audited against the committed extraction, once the bytes anchors made
// the source text checkable: all four not_known values in that record, one in
// bleeding_risk_profile and three in documented_adverse_reactions, cite bytes
// that state EMA's own "the frequency is not known" category outright.
// not_known is faithful on every one and no correction is owed.

export const frequencyQualifierSchema = z.enum([
  'very_common',
  'common',
  'uncommon',
  'rare',
  'very_rare',
  'not_known',
  'not_applicable',
  'not_reported',
]);

export type FrequencyQualifier = z.infer<typeof frequencyQualifierSchema>;
