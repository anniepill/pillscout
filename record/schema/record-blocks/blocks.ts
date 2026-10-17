import { z } from 'zod';
import { citationElementSchema } from '../claim-evidence/index.js';
import { checkedBlock, citationsShape } from './checkedBlock.js';
import { unresolvedListSchema } from '../claim-evidence/unresolved.js';
import { poledBlock } from './poledBlock.js';
import { lookupPole } from './nameLookup.js';

// The required blocks, each wrapped in its status-discriminated schema
// (checkedBlock.ts).
//
// REGISTRATION. None of these is registered in validator-core.ts FIELD_SCHEMAS
// by the commit that adds this file, and that is deliberate rather than
// unfinished. No record carries the wrapper shape yet, so registering
// contraindications here would fail all 13 of its current carriers on a
// missing `status` and report a migration that has not run as 13 defects. Each
// block registers in the migration commit, at the moment records actually
// carry the shape. Until then these schemas are exercised by their unit tests
// and by the fixture set, which is what pins their behaviour.
//
// That migration has run for every required block below except three, each
// left unregistered for a reason stated beside its schema here or in
// validator-core.ts's registry: hepatotoxicity_assessment, pharmacology and
// substance_identity.
// posology and special_populations were the last to register, their carriers
// parsing as they stood; until then nothing parsed their poles, and a status
// of `bogus` on one passed.
//
// STRICT VERSUS LOOSE PRESENT PAYLOADS. A block gets a strict present payload
// where its key set is known: from the vitamin_d reference record, or because
// the block is new in this pass and the spec defines it. Everything else gets
// a loose payload, because inventing a key set for a populated block would
// freeze an accident into a gate, which is the failure citationElement's
// header warns about. Loose is a placeholder for a derivation the migration
// commit owes, not a judgment that the block has no shape.

// --- Strict: shape known from vitamin_d, the reference record ---

// basis_by_use_category - RETIRED.
//
// It was the per-column basis: EMA monographs run two regulatory columns,
// well-established use and traditional use, and a monograph can reach a
// different conclusion in each. ginkgo, its only carrier, held ten coined
// per-column tokens under it, several of them positions per column. A single
// field cannot hold two determinations, and the answer the defined-terms
// rules give is that neither belongs in a block-level field at all: each
// sits on the citation of the authority that stated it, and `scope` on that
// citation carries the column. ginkgo's values were deleted, every one beside
// a scoped citation that already said the same thing.
// No block shape declares the key now, so the strict blocks refuse it, and
// `checkRetiredKeys` in schema/cli/validator-core.ts names it at any path.

// contraindications. Positive payload is a list of conditions, each with its
// own citations: one source sentence can support several condition entries and
// the citation is preserved per condition rather than collapsed.
//
// applies_to_preparation scopes a condition to one preparation of the
// substance. Carried by curcumin, ginkgo, green_tea_extract, green_tea_folium
// and valerian, where a contraindication attaches to an extract or a
// concentration rather than to the substance at large. Optional because most
// contraindications are substance-wide, and dropping it would widen a scoped
// finding to the whole substance, which is the opposite of a silent narrowing
// but just as wrong.
export const contraindicationItemSchema = z.strictObject({
  condition: z.string().min(1),
  applies_to_preparation: z.string().min(1).optional(),
  citations: z.array(citationElementSchema).min(1),
});

export const contraindicationsSchema = checkedBlock({
  items: z.array(contraindicationItemSchema).min(1),
});

// pediatric_use.
//
// oral_use_under_18 and cutaneous_use_under_12 are route-and-age scoped
// determinations (curcumin and st_johns_wort carry the first, st_johns_wort
// both). They are separate keys rather than free text inside `basis` because
// the age boundary is the queryable part: a consuming agent asks whether a
// 14-year-old is in scope, and a sentence buried in a basis token cannot
// answer that.
export const pediatricUseSchema = checkedBlock({
  ...citationsShape,
  oral_use_under_18: z.string().min(1).optional(),
  cutaneous_use_under_12: z.string().min(1).optional(),
});

// hepatotoxicity_assessment.
//
// direct_hepatotoxicity is a free-form descriptor and stays one: the field has
// no controlled vocabulary, and the records that carry it (cinnamon's
// constituent-mediated value, red_yeast_rice's monacolin-mediated value) show
// why closing it would be premature.
//
// It is now OPTIONAL. ginkgo and green_tea_folium carry the block with no
// direct_hepatotoxicity value at all, holding instead a regulator_disposition
// (what the regulator did about the hepatic question) or a scope_boundary
// (which preparation the hepatic finding attaches to). Requiring the field
// would have forced one of those records to invent a descriptor, and an
// invented descriptor in a hepatotoxicity block is the worst place in the
// corpus to put one.
//
// citations STAYS required. A present hepatotoxicity_assessment with no
// citation is an assertion in the corpus's own voice.
export const hepatotoxicityAssessmentSchema = checkedBlock({
  direct_hepatotoxicity: z.string().min(1).optional(),
  indirect_hepatotoxicity_mechanism: z.string().min(1).optional(),
  regulator_disposition: z.string().min(1).optional(),
  // scope_boundary is a STRING OR AN OBJECT. An earlier schema typed it a
  // string from the corpus key scan, which reports key names and not value
  // shapes; registration surfaced that its one carrier, green_tea_folium, holds
  // a structured pointer ({sibling_record, sibling_field, boundary_basis})
  // naming the sibling record that carries the extract-preparation hepatic
  // hazard. Both forms are admitted, and the object stays loose: deriving a
  // strict shape from a single carrier freezes an accident.
  scope_boundary: z.union([z.string().min(1), z.looseObject({})]).optional(),
  citations: z.array(citationElementSchema).min(1),
});

// --- Strict: poled blocks ---

// pregnancy_lactation. The fertility pole is new in this pass; it replaces the
// container-level fertility_data scalar, which could not carry a status.
//
// A pole carries BOTH the determination and the reason, because the container
// it replaces carried both and they are not the same fact.
//
// The container held `pregnancy: <determination>` beside `basis: <reason>`:
// what the authorities concluded, and why. Folding them into one string would
// have dropped one of the two on all fourteen carriers, and collapsing them
// would put two regulators on one stance.
//
// cinnamon's `use_not_recommended_per_ema_contraindicated_per_who` illustrated
// that here once and is a NAMED DEFECT under the defined-terms rules: no value
// is merged across authorities, and a position sits on the citation of the
// authority that stated it, so `determination` retires. An author does not
// imitate it.
//
// determination and basis first became OPTIONAL and were then REMOVED, and
// the comment above them is superseded history rather than the rule.
//
// They read "required on a present pole for the same reason citations are: a
// pole that states no conclusion has not answered its question". The reasoning
// was sound and the field was the wrong place for it. Both are coined
// multi-clause tokens under the defined-terms rule that a structured field
// never holds the corpus's own summary of a source sentence, and cinnamon's
// `use_not_recommended_per_ema_contraindicated_per_who` merged two authorities
// into one token while iron's `basis` ran to 288 characters. What a pole
// concludes now sits on the citation of the authority that concluded it.
//
// REMOVED. They stayed optional until then because ginkgo carried both on all
// three poles, and ginkgo's were deleted in the same change as this schema
// change. The pole is strict, so it now
// refuses both keys, and `checkRetiredKeys` in schema/cli/validator-core.ts
// names them as retired on every record, with no exception left. Every `basis`
// in the corpus is now `reference_values[].stated_values[].basis`, the closed
// dosing-denominator enum that shares the name.
const pregnancyPoleShape = {
  citations: citationsShape.citations,
};

// The fertility pole is OPTIONAL in the schema and REQUIRED of every record
// (REQUIRED_POLES), which is a deliberate split and not a loophole.
//
// Seven of the fifteen carriers have no fertility citation at all: their
// retired fertility_data scalar reads not_available or not_reported, which maps
// to a status that requires sources_checked, and no such reading exists. The
// migration cannot invent one. Making the pole optional lets the other twelve
// blocks migrate now; gate 1 reports every missing pole as a warning, on the
// same channel and for the same reason as a missing block, so the debt is
// counted rather than hidden. Both flip to errors at the gate-1 flip.
export const REQUIRED_POLES: Record<string, readonly string[]> = {
  // The regulator roster plus the Beers question. Each is a sub-status: the
  // question "has this regulator classified the substance" must be answered on
  // every record, and an absent key answers nothing. A record that does not
  // carry one of these poles warns, as for any missing pole.
  regulatory_classification: [
    'health_canada_nnhpd_status',
    'ema_hmpc_status',
    'us_regulatory_status',
    'beers_criteria',
  ],
  pregnancy_lactation: ['pregnancy', 'lactation', 'fertility'],
  posology: ['dose', 'duration_of_use'],
  special_populations: ['renal_impairment', 'hepatic_impairment', 'older_adults'],
};

export const pregnancyLactationSchema = poledBlock({
  pregnancy: checkedBlock(pregnancyPoleShape),
  lactation: checkedBlock(pregnancyPoleShape),
  fertility: checkedBlock(pregnancyPoleShape).optional(),
});

// posology. Nutrient records may carry an absence status on dose where
// reference_values holds the numbers; the pole then points nowhere and the
// reader prompt says reference_values is the nutrient dose home.
//
// Both poles are OPTIONAL in the schema and REQUIRED of every record, the split
// the fertility pole above already takes and for its reason: gate 1 is the one
// place a missing pole is counted, as a warning until the gate-1 flip, and a
// pole the schema required would turn that count into a parse failure on the
// first record to carry the block with one pole authored. The case that
// forced it, iron dropping posology.duration_of_use, no longer arises: every
// pole now stays and is re-derived, so the split stands on the precedent.
//
// The subheading guard's subkeys on these two poles are unaffected. A subkey
// names a pole the record OWES (REQUIRED_POLES), not one the schema requires,
// which the block-coverage gate (part of the full pipeline, not shipped here)
// states and its test holds.
export const posologySchema = poledBlock({
  dose: checkedBlock(citationsShape).optional(),
  duration_of_use: checkedBlock(citationsShape).optional(),
});

// special_populations. older_adults here is monograph content. The Beers
// listing question is a sub-status of regulatory_classification, not this
// pole: one is a listing determination and the other is what a monograph says
// about older people, and merging them would lose both.
export const specialPopulationsSchema = poledBlock({
  renal_impairment: checkedBlock(citationsShape),
  hepatic_impairment: checkedBlock(citationsShape),
  older_adults: checkedBlock(citationsShape),
});

// --- Loose: key set not yet derived from the corpus ---

// pharmacology holds its citations NESTED (active_constituents,
// pharmacodynamics, pharmacokinetics each carry their own), so no top-level
// declaration reaches them and registering this block would cost the checks
// inside it. It stays unregistered until its payload is derived.
export const pharmacologySchema = checkedBlock({}, 'loose');
export const preclinicalSafetySchema = checkedBlock(
  { citations: z.array(citationElementSchema).optional() },
  'loose',
);
// overdose and preclinical_safety carry citations at their own top level, so
// declaring the key keeps nested citation checking alive past registration.
export const overdoseSchema = checkedBlock(
  { citations: z.array(citationElementSchema).optional() },
  'loose',
);

// The three formerly LIST-AUTHORED blocks, now wrapped.
//
// documented_interactions, documented_adverse_reactions and
// other_warnings_and_precautions were authored as bare YAML lists. A list cannot
// carry a `status` key, so they could not wrap in place: the list moved under
// `items` inside the present variant, the same re-nesting contraindications
// took. That structural edit landed in the migration commit and every carrier
// holds it, 21 of 21, 19 of 19 and 7 of 7 respectively as measured (6 of 6
// at the migration; piperine gained the third block since), so all three are
// registered in validator-core.ts FIELD_SCHEMAS. items is required non-empty:
// a present block with an empty list is a block claiming content it does not
// have.
//
// The ELEMENT schema is still LOOSE. The key sets are known from the corpus
// (partner/partner_key/citations; reaction_class/frequency/citations plus
// st_johns_wort's divergent `common`; applies_to/mechanism_status/citations,
// the caution-level key having retired) but closing them means resolving
// the st_johns_wort element-shape divergence first, which is its own item.
// That divergence was also a coverage hole and is no longer one: `common` is
// admitted unread by this loose element, so the citations list inside it was
// checked by nothing until sweepCitationCarriers (validator-core.ts) began
// reaching every citations list on the document's shape rather than through
// block registration.
//
// LOOSE, and the declarations below are no longer what keeps citations and
// unresolved checked. They were: registering a block stops the validator's
// walk at that key, so anything the block schema did not itself declare went
// unchecked from there down, and an empty looseObject here once silently
// disabled the citation-element check inside every registered list block --
// four defect fixtures went green and corpus coverage fell from 444 checked
// field values to 276. The sweep now reaches both keys wherever they sit,
// including under a `common` this element never declared, so neither
// declaration is load-bearing for reach any more.
//
// They are kept for a different reason, and only that one: they put citations
// and unresolved in this element's DECLARED key set, so when the set is
// finally closed strict (the st_johns_wort divergence above is the blocker)
// they are already the right shape rather than becoming unrecognized keys.
const listItemSchema = z.looseObject({
  citations: z.array(citationElementSchema).optional(),
  unresolved: unresolvedListSchema.optional(),
});

export const otherWarningsAndPrecautionsSchema = checkedBlock({
  items: z.array(listItemSchema).min(1),
});
export const documentedAdverseReactionsSchema = checkedBlock({
  items: z.array(listItemSchema).min(1),
});
export const documentedInteractionsSchema = checkedBlock({
  items: z.array(listItemSchema).min(1),
});

// dose_scoped_contraindications - FINDINGS BLOCK, unregistered.
//
// Not a required question. It appears only where a substance actually has a
// dose-scoped contraindication surface, and its absence asserts nothing.
//
// SOLE CARRIER: st_johns_wort, whose `contraindications` is not a list but a
// keyed object holding `universal` (an ordinary condition list) beside
// `high_hyperforin_dose`, which is a different animal entirely: a threshold
// (hyperforin daily dose above 1 mg), interaction_axis tagging,
// applicability_conditions.dose_range (since retired), an applies_to
// list over the two EMA use categories, and contraindicated_drug_categories.
// Wrapping that as one contraindications item would flatten a dose-threshold
// interaction surface into a condition string.
//
// So the migration split the block, and that split has run: `universal` became
// st_johns_wort's contraindications items, which now hold the wrapper shape,
// and high_hyperforin_dose moved here, carrying threshold, interaction_axis,
// axis_dose_dependence, applies_to, contraindicated_drug_categories and
// citations. The schema stays LOOSE and unregistered all the same, because the
// shape is still one record's and deriving a schema from a single carrier
// freezes an accident.
export const doseScopedContraindicationsSchema = z.looseObject({});

// driving_and_machinery - FINDINGS BLOCK, not a required question.
//
// It appears only where a regulator states something under effects on ability
// to drive and use machines, and its absence on a record asserts nothing. That
// is the dose_scoped_contraindications posture and it is deliberate: this
// question stays OUT of REQUIRED_BLOCKS, so no record owes an answer and no
// record needs a status for staying silent.
//
// EMA monograph section 4.7 sits inside the safety surface the block-coverage
// gate reads. Before it was placed there, 4.7 was the one section of
// 4.3 through 4.9 the corpus had no home for: the section is a safety section
// by the gate's own list of safety sections, while `effects on driving and
// machinery` sat on the required-question list's explicit out-of-scope list as
// a REQUIRED question that had been declined. Both readings were right about
// different things, and the gap between them is what this block closes. A
// declared absence ("no adequate studies have been performed") is a statement
// and is carried; it is not silence, and disposing of it as
// states_nothing_in_scope would have written off a source sentence.
//
// UNLIKE dose_scoped_contraindications this schema is STRICT and IS registered
// in validator-core's FIELD_SCHEMAS. The two words pull apart here and the
// distinction is worth stating: "unregistered" on that block means both "not a
// required question" AND "not checked", because its shape is one record's and
// deriving a schema from a single carrier freezes an accident. This block's
// shape is derived from the monograph rule instead of from a carrier, it has
// no carrier yet, and an unchecked block is one nothing reads. So it is not
// required and it is checked.
export const drivingAndMachinerySchema = checkedBlock({
  ...citationsShape,
});

// substance_identity, with the identifiers sub-status.
//
// identifiers is z.record(string, string) rather than a fixed shape because
// the id key names vary by substance: ginkgo carries ema_hmpc_botanical_id,
// other records carry CAS and RxCUI. Deriving a strict key set means reading
// all 12 carriers; until then an open map is the honest type. The sub-status is what matters here, since it turns "this
// record has no identifiers" from an omission into an answer.
export const identifiersSchema = checkedBlock({
  values: z.record(z.string().min(1), z.string().min(1)),
});

export const substanceIdentitySchema = checkedBlock({}, 'loose');

// --- The regulator roster, registered ---

// regulatory_classification. Its roster members keep their EXISTING key names
// (us_regulatory_status, health_canada_nnhpd_status, ema_hmpc_status) rather
// than the spec's first-draft us_fda: a rename on top of a reshape is two
// changes reported as one, and the reshape is the load-bearing half.
//
// The members do not share a shape. health_canada_nnhpd_status is a rich
// object (use_claims, daily_dose_range_mg, age_population, citations) while
// us_regulatory_status is a bare uncited scalar on 20 records. Both
// get a loose present payload for that reason.
// Loose payload, but citations MUST be declared. Registering
// regulatory_classification stops the validator's walk at that key, and an
// undeclared citations list below the stop goes unchecked -- the same
// regression caught in the list blocks. The roster members carry their own
// citations (use_claims and dose values are cited per member), so the key is
// declared here to keep citationElementSchema reachable.
//
// The rest stays open: the members do not share a payload. Most hold
// use_claims / daily_dose_range / age_population, ginkgo adds a standardized
// extract specification, kava holds a monograph_status and benefit_risk_
// balance, and green_tea_folium holds a substance_corpus_status with a
// rationale. Closing that would freeze five shapes into one.
export const regulatorStatusSchema = checkedBlock(
  { citations: z.array(citationElementSchema).optional() },
  'loose',
);

// ema_hmpc_status and beers_criteria are the two NAME-LOOKUP poles: besides
// the five statuses every required block takes, each admits not_listed and
// listed, a recorded search of a registered list (nameLookup.ts).
// health_canada_nnhpd_status does not, and neither does
// us_regulatory_status, which stays a bare scalar.
//
// ema_hmpc_status keeps the loose present payload it had as a
// regulatorStatusSchema member, for the reason given there: its present
// carriers hold per-column objects (well_established_use, traditional_use)
// and kava a monograph_status, and closing that would freeze their shapes.
export const emaHmpcStatusSchema = lookupPole(
  { citations: z.array(citationElementSchema).optional() },
  'loose',
);

// beers_criteria. A present pole cites what the Beers tables say about the
// substance. A search of the tables that finds nothing is not_listed, and one
// that finds the substance on a copy the corpus may not hold is listed.
//
// `listed`, a boolean the present variant required, RETIRED with 0 carriers:
// present already means the tables carry the substance,
// so the boolean could only restate the status or contradict it, and the
// lookup statuses now carry the search itself. The strict present variant
// refuses the key and `checkRetiredKeys` names it.
//
// SUPERSEDED here at the same change: this comment called stated_absence "the
// expected state for a mineral", the scope statement being the quotable
// absence. Iron's reading found that the Beers scope statement names the
// criteria's own subject and never states that minerals are out of scope
// (iron citation_gaps), so no such sentence exists to quote.
// stated_absence stays admitted, as on every block, for a list that does print
// one.
export const beersCriteriaSchema = lookupPole({
  citations: z.array(citationElementSchema).min(1),
});

// The container stays loose until the rest of its key set is derived (record-specific regulator keys such as atc_code, eda_status,
// fda_status and eu_commission_status sit outside the roster and are findings
// blocks, not questions). Every roster member is optional here because the
// migration that populates them has not run.
// The container stays LOOSE, and deliberately so on two counts.
//
// First, its non-roster keys (atc_code, eda_status, fda_status,
// eu_commission_status) are findings keys whose absence asserts nothing, and
// they carry their own citations; a strict container would reject them.
//
// Second, us_regulatory_status is NOT wrapped and is NOT checked here. It
// carries a bare uncited scalar on 20 records, and wrapping an unsupported
// assertion as `present` would make the schema vouch for a claim no source
// backs. It stays as authored until one archived statutory anchor lands and
// its citation is backfilled, and only then does it wrap.
// The four findings keys are declared for ONE reason: to keep their citations
// checked. Registering the container stops the walk here, so an undeclared
// nested citations list goes unchecked below it -- measured as 12 lost field
// checks before these were added. All six carriers (ginkgo, st_johns_wort and
// valerian on atc_code, gymnema on eda_status, red_yeast_rice on both
// fda_status and eu_commission_status) hold citations, and each stays loose
// otherwise: they are findings, their absence asserts nothing, and their
// payloads differ.
const findingsRegulatorKeySchema = z
  .looseObject({ citations: z.array(citationElementSchema).optional() })
  .optional();

export const regulatoryClassificationSchema = z.looseObject({
  health_canada_nnhpd_status: regulatorStatusSchema.optional(),
  ema_hmpc_status: emaHmpcStatusSchema.optional(),
  beers_criteria: beersCriteriaSchema.optional(),
  atc_code: findingsRegulatorKeySchema,
  eda_status: findingsRegulatorKeySchema,
  fda_status: findingsRegulatorKeySchema,
  eu_commission_status: findingsRegulatorKeySchema,
});
