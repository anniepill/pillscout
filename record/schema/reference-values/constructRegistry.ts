// Per-authority construct registry (enforcing).
//
// The reference_values `construct` field is an open, source-named string at
// the shape level (schema/reference-values/referenceValues.ts). This registry
// is the second gate: it pins WHICH construct names each source authority is
// allowed to use. The corpus validator (schema/cli/validator-core.ts) checks
// every reference_values element's (source.authority, construct) pair against
// this map; an unregistered pair fails validation with a message naming both
// the source and the construct.
//
// Why two gates. The open string lets a genuinely new source-named construct
// be admitted by a one-line edit HERE (the fast-fix path) instead of a schema
// change. The registry stops the open field from silently absorbing a typo
// (e.g. `rdaa`) or a cross-authority construct bleed (one authority's named
// construct attached to another's value), both of which the closed enum used
// to block. Doctrine (never map one authority's named construct onto
// another's) is why the map is keyed PER authority rather than as one global
// allow-list.
//
// Seeding. The base seed is derived strictly from the constructs present in
// the corpus across the 7 reference_values-bearing records (beta_carotene, calcium, iron, magnesium, vitamin_c, vitamin_d,
// zinc). The corpus carries three source authorities. EFSA additionally uses
// pri and ar: vitamin_c authors EFSA's Average Requirement (AR) and Population
// Reference Intake (PRI) per-population intake values under EFSA's own
// construct names (2013 vitamin C DRV opinion, Tables 4-6). pri and ar are
// EFSA-only here; FNB does not use them. SCF (Scientific Committee on Food, the
// European Commission predecessor body EFSA succeeded in 2002) uses ul only:
// magnesium authors SCF's 2001 supplemental Tolerable Upper Intake Level (250
// mg/day, SCF/CS/NUT/UPPLEV/54) as a ul element beside the FNB UL. SCF is
// ul-only here.
//
// FNB additionally carries an operator seed of two known-good constructs not
// yet present in any record: `ear` (the FNB's published Estimated Average
// Requirement construct) and `source_stated_upper_bound` (a first-class
// construct in the prior closed enum). Pre-registering these is validator
// configuration, not corpus data: it asserts no fact and creates no record,
// so it is outside the no-invent / stopping-principle discipline that governs
// record data. The operator seed is scoped to FNB only; EFSA stays at the
// corpus-derived ai / rda / ul. noael, loael, adi, tdi remain unseeded for
// every authority (they enter the registry the session a record first authors
// one). The authority key is the verbatim source.authority string, matched
// exactly.

export const constructRegistry: Record<string, readonly string[]> = {
  'Food and Nutrition Board (FNB), National Academies of Sciences, Engineering, and Medicine':
    ['ai', 'rda', 'ul', 'ear', 'source_stated_upper_bound'],
  'European Food Safety Authority (EFSA), NDA Panel': [
    'ai',
    'rda',
    'ul',
    'pri',
    'ar',
  ],
  'Scientific Committee on Food (SCF), European Commission': ['ul'],
};

// True iff `construct` is registered for `authority`. An authority absent
// from the registry returns false for every construct (an unregistered
// source is itself a failure the validator should surface).
export function isRegisteredConstruct(
  authority: string,
  construct: string,
): boolean {
  const allowed = constructRegistry[authority];
  return allowed !== undefined && allowed.includes(construct);
}
