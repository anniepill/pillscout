import { z } from 'zod';

// interaction axis and axis dose dependence
//
// interaction_axis tags an interaction claim with its pharmacological axis,
// pharmacokinetic or pharmacodynamic, as a non-empty list: one claim can
// carry both. The list was confirmed after an audit where the management
// recommendation of the archived sertraline and St. John's wort record was
// motivated by a pharmacokinetic pathway
// (CYP-induction loss of efficacy) and a pharmacodynamic one (additive
// serotonergic) together, its comment stating each as independently
// sufficient. The two absence values
// keep their senses: not_reported is the evidence-table NR, the cited block
// states no axis; not_applicable is the FHIR data-absent-reason code, an axis
// does not apply to the claim.
//
// axis_dose_dependence is single-valued: that audit surfaced no multi-value
// dose-dependence case. It is captured per claim, so the same partner can
// carry distinct dose-dependent PK and dose-independent PD findings without
// collision.
//
// What process or effect a claim states is not typed here. The typed
// mechanism vocabularies that sat beside the axis are retired: a citation's
// mechanisms and effects are derived from spans of
// its verbatim (mechanismSpan.ts, effectSpan.ts; the derivation itself is
// part of the full pipeline, not shipped here).

export const interactionAxisSchema = z.array(z.enum(['pharmacokinetic', 'pharmacodynamic', 'not_reported', 'not_applicable'])).min(1);

export const axisDoseDependenceSchema = z.enum([
  'dose_dependent',
  'dose_independent',
  'not_reported',
]);

export type InteractionAxis = z.infer<typeof interactionAxisSchema>;
export type AxisDoseDependence = z.infer<typeof axisDoseDependenceSchema>;
