import { describe, it, expect } from 'vitest';
import {
  contraindicationsSchema,
  pregnancyLactationSchema,
  posologySchema,
  specialPopulationsSchema,
  pediatricUseSchema,
  hepatotoxicityAssessmentSchema,
  identifiersSchema,
  beersCriteriaSchema,
  regulatoryClassificationSchema,
  documentedInteractionsSchema,
  documentedAdverseReactionsSchema,
  otherWarningsAndPrecautionsSchema,
  doseScopedContraindicationsSchema,
  drivingAndMachinerySchema,
} from './blocks.js';
import { sourceScopeEvaluatedSchema } from './sourceScopeEvaluated.js';
import { checkRequiredBlocks } from '../cli/validator-core.js';

const CITATION = {
  source: 'health_canada_nnhpd',
  document_id: 'hc_nnhpd_multivitamin_mineral_monograph',
  section: 'Risk information',
  section_title: 'Contraindication(s)',
  evidence_locator: 'Table 14, zinc picolinate row',
  verbatim: 'Do not use if you are pregnant or breastfeeding.',
};

const READING = [
  { source: 'nih_ods', document_id: 'nih_ods_calcium' },
];

describe('contraindications', () => {
  // The zinc picolinate case: the one true contraindication sentence an
  // audit found in the six nutrient records.
  it('accepts a present block with one condition', () => {
    expect(
      contraindicationsSchema.safeParse({
        status: 'present',
        items: [
          {
            condition: 'pregnancy_or_lactation_zinc_picolinate_form_scoped',
            citations: [CITATION],
          },
        ],
      }).success,
    ).toBe(true);
  });

  // The piperine case: Health Canada printing an affirmative determination
  // that no contraindication statement is needed.
  it('accepts the no_statement_required absence', () => {
    expect(
      contraindicationsSchema.safeParse({
        status: 'stated_absence',
        absence_reason: 'no_statement_required',
        verbatim: 'No statement required.',
        citations: [CITATION],
      }).success,
    ).toBe(true);
  });

  it('rejects a present block with an empty items list', () => {
    expect(
      contraindicationsSchema.safeParse({ status: 'present', items: [] }).success,
    ).toBe(false);
  });

  it('rejects an item with no citations: a condition needs a source', () => {
    expect(
      contraindicationsSchema.safeParse({
        status: 'present',
        items: [{ condition: 'x', citations: [] }],
      }).success,
    ).toBe(false);
  });

  // A record may scope a contraindication to one preparation. Dropping the
  // key would widen a scoped finding to the whole substance.
  it('accepts a preparation-scoped condition', () => {
    expect(
      contraindicationsSchema.safeParse({
        status: 'present',
        items: [
          {
            condition: 'hepatic_disorder',
            applies_to_preparation: 'concentrated_extract_high_egcg',
            citations: [CITATION],
          },
        ],
      }).success,
    ).toBe(true);
  });
});

describe('pregnancy_lactation', () => {
  it('accepts three independently-statused poles', () => {
    expect(
      pregnancyLactationSchema.safeParse({
        // The retired keys are gone from this fixture: what it tests is three
        // poles statused independently, and carrying determination and basis
        // here would model a shape no new record may author.
        pregnancy: { status: 'present', citations: [CITATION] },
        lactation: { status: 'not_found', sources_checked: READING },
        fertility: { status: 'not_found', sources_checked: READING },
      }).success,
    ).toBe(true);
  });

  // fertility_data was a container-level scalar on the reference record and
  // could not carry a status. The pole replaces it.
  //
  // The pole is OPTIONAL in the schema and REQUIRED of every record. Seven of
  // the fifteen carriers had no fertility citation at all, so the migration
  // cannot author the pole without inventing a reading. The schema therefore
  // admits the block without it and gate 1 reports the gap as a warning, the
  // same channel a missing block uses. Both flip to errors together.
  it('admits a block with no fertility pole, which gate 1 then warns about', () => {
    expect(
      pregnancyLactationSchema.safeParse({
        pregnancy: { status: 'not_found', sources_checked: READING },
        lactation: { status: 'not_found', sources_checked: READING },
      }).success,
    ).toBe(true);
  });

  it('still requires the two poles every carrier can answer', () => {
    expect(
      pregnancyLactationSchema.safeParse({
        pregnancy: { status: 'not_found', sources_checked: READING },
      }).success,
    ).toBe(false);
  });

  it('rejects the retired container-level fertility_data scalar', () => {
    expect(
      pregnancyLactationSchema.safeParse({
        pregnancy: { status: 'not_found', sources_checked: READING },
        lactation: { status: 'not_found', sources_checked: READING },
        fertility: { status: 'not_found', sources_checked: READING },
        fertility_data: 'not_available',
      }).success,
    ).toBe(false);
  });

  // SUPERSEDED WORDING. This test read "requires determination on a present
  // pole" and asserted the parse FAILED without it. determination and basis
  // are both optional on a pole now: they are coined multi-clause tokens, and
  // a structured field never holds the corpus's own summary of a source
  // sentence. What a pole concludes sits on the citation of the authority that
  // concluded it. A pole with neither is the
  // migrated shape, not a defect.
  it('accepts a present pole with neither determination nor basis', () => {
    expect(
      pregnancyLactationSchema.safeParse({
        pregnancy: { status: 'present', citations: [CITATION] },
        lactation: { status: 'not_found', sources_checked: READING },
      }).success,
    ).toBe(true);
  });

  // This test was named 'keeps basis required where citationsShape is shared'
  // and passed only because the poled container refused its own `status`:
  // an earlier change had already dropped `basis` from the shared shape, so it
  // asserted nothing about basis. What the shared shape holds now is
  // citations, and a posology pole takes them alone and refuses `basis`.
  it('posology poles take citations alone and refuse basis', () => {
    const poles = (dose: Record<string, unknown>) =>
      posologySchema.safeParse({
        dose: { status: 'present', citations: [CITATION], ...dose },
        duration_of_use: { status: 'present', citations: [CITATION] },
      }).success;
    expect(poles({})).toBe(true);
    expect(poles({ basis: 'per_day' })).toBe(false);
  });

  // SUPERSEDED WORDING. This pinned cinnamon's
  // `use_not_recommended_per_ema_contraindicated_per_who` as a PASSING case
  // and called determination and basis "separate facts". That token is a
  // named defect: it merges two authorities into one value, and both halves
  // now sit on the citation of the authority that stated each. The parse
  // accepted both keys while ginkgo carried them; they were then deleted from
  // ginkgo and from the pole shape in one change, so a present pole
  // now refuses each key alone, and takes citations without either.
  it('refuses determination and basis on a present pole, each alone', () => {
    const pole = (extra: Record<string, unknown>) =>
      pregnancyLactationSchema.safeParse({
        pregnancy: { status: 'present', citations: [CITATION], ...extra },
        lactation: { status: 'not_found', sources_checked: READING },
      }).success;
    expect(pole({})).toBe(true);
    expect(pole({ determination: 'contraindicated' })).toBe(false);
    expect(pole({ basis: 'contraindicated' })).toBe(false);
  });

  // gymnema's fertility pole: the authority states there is nothing, so the
  // absence variant applies and determination does not.
  it('a stated_absence pole carries no determination', () => {
    expect(
      pregnancyLactationSchema.safeParse({
        pregnancy: { status: 'not_found', sources_checked: READING },
        lactation: { status: 'not_found', sources_checked: READING },
        fertility: {
          status: 'stated_absence',
          absence_reason: 'insufficient_data_in_source',
          verbatim: 'No fertility data available.',
          citations: [CITATION],
        },
      }).success,
    ).toBe(true);
  });
});

describe('posology and special_populations', () => {
  it('posology poles on dose and duration_of_use', () => {
    expect(
      posologySchema.safeParse({
        dose: { status: 'not_found', sources_checked: READING },
        duration_of_use: { status: 'present', citations: [CITATION] },
      }).success,
    ).toBe(true);
  });

  // Both posology poles are optional in the schema and owed by every record,
  // the fertility split. The schema admits one pole and gate
  // 1 counts the other, which is the whole of the split; the control is the
  // same block with the second pole, which gate 1 does not report.
  it('posology admits one pole, and gate 1 counts the missing one', () => {
    const one = { dose: { status: 'present', citations: [CITATION] } };
    expect(posologySchema.safeParse(one).success).toBe(true);
    expect(posologySchema.safeParse({}).success).toBe(true);
    const warned = checkRequiredBlocks({ substance_type: 'herb', posology: one })
      .map((w) => w.path)
      .filter((p) => p.startsWith('posology'));
    expect(warned).toEqual(['posology.duration_of_use']);
    const both = { ...one, duration_of_use: { status: 'present', citations: [CITATION] } };
    const none = checkRequiredBlocks({ substance_type: 'herb', posology: both })
      .map((w) => w.path)
      .filter((p) => p.startsWith('posology'));
    expect(none).toEqual([]);
  });

  it('posology still refuses a pole it does not declare', () => {
    expect(
      posologySchema.safeParse({ frequency: { status: 'present', citations: [CITATION] } }).success,
    ).toBe(false);
  });

  it('special_populations poles on the three subpopulation questions', () => {
    expect(
      specialPopulationsSchema.safeParse({
        renal_impairment: { status: 'present', citations: [CITATION] },
        hepatic_impairment: { status: 'not_found', sources_checked: READING },
        older_adults: { status: 'not_found', sources_checked: READING },
      }).success,
    ).toBe(true);
  });

  // Beers is a listing determination and lives on regulatory_classification.
  // older_adults here is monograph content. Merging them loses both.
  it('special_populations does not accept a beers pole', () => {
    expect(
      specialPopulationsSchema.safeParse({
        renal_impairment: { status: 'not_found', sources_checked: READING },
        hepatic_impairment: { status: 'not_found', sources_checked: READING },
        older_adults: { status: 'not_found', sources_checked: READING },
        beers_criteria: { status: 'not_found', sources_checked: READING },
      }).success,
    ).toBe(false);
  });
});

describe('pediatric_use and hepatotoxicity_assessment', () => {
  it('pediatric_use takes citations alone', () => {
    expect(
      pediatricUseSchema.safeParse({
        status: 'present',
        citations: [CITATION],
      }).success,
    ).toBe(true);
  });

  // direct_hepatotoxicity has no controlled vocabulary and stays free-form.
  it('hepatotoxicity_assessment keeps direct_hepatotoxicity free-form', () => {
    expect(
      hepatotoxicityAssessmentSchema.safeParse({
        status: 'present',
        direct_hepatotoxicity: 'monacolin_k_mediated_hepatic_injury',
        citations: [CITATION],
      }).success,
    ).toBe(true);
  });

  // ginkgo and green_tea_folium carry the block with no direct_hepatotoxicity
  // value. Requiring it would have forced one of them to invent a descriptor.
  it('hepatotoxicity_assessment accepts a regulator_disposition with no descriptor', () => {
    expect(
      hepatotoxicityAssessmentSchema.safeParse({
        status: 'present',
        regulator_disposition: 'no_hepatic_signal_in_monograph_assessment',
        scope_boundary: 'infusion_scope_only',
        citations: [CITATION],
      }).success,
    ).toBe(true);
  });

  it('hepatotoxicity_assessment accepts the indirect mechanism key', () => {
    expect(
      hepatotoxicityAssessmentSchema.safeParse({
        status: 'present',
        direct_hepatotoxicity: 'not_convincingly_established',
        indirect_hepatotoxicity_mechanism: 'cyp_induction_lowering_partner_levels',
        citations: [CITATION],
      }).success,
    ).toBe(true);
  });

  // A present hepatotoxicity block with no citation is an assertion in the
  // corpus's own voice, which is the one thing it must never be.
  it('hepatotoxicity_assessment still requires citations', () => {
    expect(
      hepatotoxicityAssessmentSchema.safeParse({
        status: 'present',
        direct_hepatotoxicity: 'x',
      }).success,
    ).toBe(false);
  });

  // The route-scoped keys stay until the records carrying them are backfilled;
  // the per-column companion that sat beside them is retired.
  it('pediatric_use accepts the route-scoped keys', () => {
    expect(
      pediatricUseSchema.safeParse({
        status: 'present',
        oral_use_under_18: 'not_recommended',
        cutaneous_use_under_12: 'not_recommended',
        citations: [CITATION],
      }).success,
    ).toBe(true);
  });
});

// RETIRED. The key sat on five blocks of
// ginkgo; no block shape declares it now, so every block that carried it
// refuses it, whatever shape it is written in.
describe('basis_by_use_category is refused', () => {
  const BBUC = { well_established_use: 'a', traditional_use: 'b' };
  it('on every pregnancy_lactation pole', () => {
    for (const pole of ['pregnancy', 'lactation', 'fertility']) {
      const r = pregnancyLactationSchema.safeParse({
        pregnancy: { status: 'present', citations: [CITATION] },
        lactation: { status: 'not_found', sources_checked: READING },
        fertility: { status: 'not_found', sources_checked: READING },
        [pole]: { status: 'present', citations: [CITATION], basis_by_use_category: BBUC },
      });
      expect(r.success, pole).toBe(false);
    }
  });

  it('on pediatric_use, which parses without it', () => {
    expect(pediatricUseSchema.safeParse({ status: 'present', citations: [CITATION] }).success).toBe(true);
    expect(
      pediatricUseSchema.safeParse({ status: 'present', citations: [CITATION], basis_by_use_category: BBUC })
        .success,
    ).toBe(false);
  });
});

// A list cannot carry a status key, so these three re-nest under items.
describe('the list-authored blocks carry their list under items', () => {
  it('documented_interactions', () => {
    expect(
      documentedInteractionsSchema.safeParse({
        status: 'present',
        items: [{ partner: 'warfarin', citations: [CITATION] }],
      }).success,
    ).toBe(true);
  });

  it('documented_adverse_reactions', () => {
    expect(
      documentedAdverseReactionsSchema.safeParse({
        status: 'present',
        items: [{ reaction_class: 'gastrointestinal', frequency: 'not_known' }],
      }).success,
    ).toBe(true);
  });

  // The element schema is loose until one record's element-shape divergence
  // is resolved, so its common/manifestations form parses too.
  it('documented_adverse_reactions admits the divergent element shape', () => {
    expect(
      documentedAdverseReactionsSchema.safeParse({
        status: 'present',
        items: [{ common: ['photosensitivity'], manifestations: ['rash'] }],
      }).success,
    ).toBe(true);
  });

  it('other_warnings_and_precautions', () => {
    expect(
      otherWarningsAndPrecautionsSchema.safeParse({
        status: 'present',
        items: [{ applies_to: 'biliary_obstruction', citations: [CITATION] }],
      }).success,
    ).toBe(true);
  });

  // A present block with an empty list claims content it does not have.
  it('rejects an empty items list', () => {
    expect(
      documentedInteractionsSchema.safeParse({ status: 'present', items: [] }).success,
    ).toBe(false);
  });

  // The whole point: the bare list these blocks are authored as today has
  // nowhere to put a status.
  it('rejects the bare list form', () => {
    expect(
      documentedInteractionsSchema.safeParse([{ partner: 'warfarin' }]).success,
    ).toBe(false);
  });
});

// Findings block, unregistered, with a single carrier record.
describe('dose_scoped_contraindications', () => {
  it('admits the high_hyperforin_dose surface without flattening it', () => {
    expect(
      doseScopedContraindicationsSchema.safeParse({
        threshold: 'hyperforin_daily_dose_gt_1_mg',
        interaction_axis: ['pharmacokinetic'],
        contraindicated_drug_categories: [{ category: 'cyclosporine' }],
      }).success,
    ).toBe(true);
  });
});

describe('driving_and_machinery', () => {
  // The ginkgo 4.7 case, which is what opened this block: both monograph
  // columns state the same declared absence, and a declared absence is a
  // statement the record carries rather than silence it disposes of.
  const DRIVING_CITATION = {
    source: 'ema_hmpc',
    document_id: 'EMA/HMPC/321097/2012',
    section: '4.7',
    section_title: 'Effects on ability to drive and use machines',
    evidence_locator: 'Well-established use column',
    verbatim:
      'No adequate studies on the effect on the ability to\ndrive and use machines have been performed.',
  };

  it('accepts a present block with one citation', () => {
    expect(
      drivingAndMachinerySchema.safeParse({
        status: 'present',
        citations: [DRIVING_CITATION],
      }).success,
    ).toBe(true);
  });

  // The per-column companion was accepted here until it retired;
  // the two columns' agreement is carried by the two scoped citations.
  it('refuses the retired per-column companion', () => {
    expect(
      drivingAndMachinerySchema.safeParse({
        status: 'present',
        basis_by_use_category: {
          well_established_use: 'no_adequate_studies_performed',
          traditional_use: 'no_adequate_studies_performed',
        },
        citations: [DRIVING_CITATION],
      }).success,
    ).toBe(false);
  });

  // STRICT, unlike dose_scoped_contraindications. The shape is derived from
  // the monograph rule rather than from a carrier, so an unknown key is a
  // coined key and fails rather than being admitted silently.
  it('rejects an unknown key inside the block', () => {
    const parsed = drivingAndMachinerySchema.safeParse({
      status: 'present',
      citations: [DRIVING_CITATION],
      effects_on_driving: 'none_stated',
    });
    expect(parsed.success).toBe(false);
  });

  it('requires a citation on a present block', () => {
    expect(
      drivingAndMachinerySchema.safeParse({
        status: 'present',
        citations: [],
      }).success,
    ).toBe(false);
  });

  // It is a findings block, so it is never absent-with-a-status on a record
  // that simply has no such finding; but where a source WAS checked and said
  // nothing, the status wrapper still applies.
  it('carries the stated-absence and not-found variants like any checked block', () => {
    expect(
      drivingAndMachinerySchema.safeParse({
        status: 'not_found',
        sources_checked: [
          { source: 'ema_hmpc', document_id: 'EMA/HMPC/321097/2012' },
        ],
      }).success,
    ).toBe(true);
  });
});

describe('sub-statuses', () => {
  // The point of the sub-status: it turns "this record has no identifiers"
  // from an omission into an answer.
  it('identifiers carries an open map when present', () => {
    expect(
      identifiersSchema.safeParse({
        status: 'present',
        values: { ema_hmpc_botanical_id: 'Ginkgo biloba L., folium' },
      }).success,
    ).toBe(true);
  });

  it('identifiers can report that no cited source supplies one', () => {
    expect(
      identifiersSchema.safeParse({ status: 'not_found', sources_checked: READING })
        .success,
    ).toBe(true);
  });

  // The listing boolean is retired: present means
  // the tables carry the substance, and a search is a lookup status.
  it('beers_criteria carries citations when present, and no listing boolean', () => {
    expect(beersCriteriaSchema.safeParse({ status: 'present', citations: [CITATION] }).success).toBe(true);
    expect(
      beersCriteriaSchema.safeParse({
        status: 'present',
        listed: true,
        citations: [CITATION],
      }).success,
    ).toBe(false);
  });

  // stated_absence stays admitted, as on every block, for a list that prints
  // a scope sentence. The 2023 tables print none for minerals; the verbatim
  // below is a fixture, not theirs.
  it('beers_criteria admits a stated_absence', () => {
    expect(
      beersCriteriaSchema.safeParse({
        status: 'stated_absence',
        absence_reason: 'not_established_by_authority',
        verbatim:
          'Beers lists active pharmaceutical drug classes only; dietary minerals do not appear.',
        citations: [CITATION],
      }).success,
    ).toBe(true);
  });
});

describe('regulatory_classification roster', () => {
  // Roster keys keep their EXISTING names. A rename on top of a reshape is
  // two changes reported as one, and the reshape is the load-bearing half.
  it('wraps each roster member under its existing key name', () => {
    expect(
      regulatoryClassificationSchema.safeParse({
        us_regulatory_status: { status: 'present', value: 'dietary_supplement_DSHEA_1994' },
        health_canada_nnhpd_status: { status: 'not_found', sources_checked: READING },
        ema_hmpc_status: { status: 'not_found', sources_checked: READING },
        beers_criteria: { status: 'not_found', sources_checked: READING },
      }).success,
    ).toBe(true);
  });

  // atc_code and the three record-specific regulator keys are findings, not
  // questions, so the container admits them. They are DECLARED rather than
  // merely allowed, because registering the container stops the validator's
  // walk and an undeclared nested citations list would go unchecked below it.
  it('admits record-specific regulator keys outside the roster', () => {
    expect(
      regulatoryClassificationSchema.safeParse({
        atc_code: { code: 'N06AX25', description: 'ginkgo folium', citations: [CITATION] },
      }).success,
    ).toBe(true);
  });

  it('still checks citations nested under a findings key', () => {
    const r = regulatoryClassificationSchema.safeParse({
      atc_code: { code: 'N06AX25', citations: [{ ...CITATION, coined_key: 1 }] },
    });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r.error?.issues)).toMatch(/coined_key/);
  });

  // us_regulatory_status is NOT wrapped and NOT checked: it carries a bare
  // uncited scalar across the corpus, and wrapping an unsupported
  // assertion as present would make the schema vouch for it.
  it('passes us_regulatory_status through unwrapped while it stays uncited', () => {
    expect(
      regulatoryClassificationSchema.safeParse({
        us_regulatory_status: 'dietary_supplement_DSHEA_1994',
      }).success,
    ).toBe(true);
  });
});

// Gate 1's pole check tests key PRESENCE, so before pregnancy_lactation was
// registered a scalar `pregnancy: use_not_recommended` satisfied it: the key
// existed, and nothing looked at what it held. That false pass was expected
// to close at registration. This is the confirmation.
describe('the gate-1 key-presence false pass closes at registration', () => {
  it('a scalar pregnancy: now fails the schema', () => {
    const scalarForm = {
      pregnancy: 'use_not_recommended',
      lactation: 'use_not_recommended',
      fertility_data: 'not_available',
      citations: [CITATION],
    };
    const r = pregnancyLactationSchema.safeParse(scalarForm);
    expect(r.success).toBe(false);
  });

  it('and gate 1 alone would have passed it, which is why the schema is needed', () => {
    // Key presence is all gate 1 ever checked. Both pole names are present as
    // scalars here, so the pole half of gate 1 sees nothing wrong; only the
    // schema does.
    const poles = ['pregnancy', 'lactation'];
    const scalarForm: Record<string, unknown> = {
      pregnancy: 'use_not_recommended',
      lactation: 'use_not_recommended',
    };
    for (const pole of poles) expect(pole in scalarForm).toBe(true);
    expect(pregnancyLactationSchema.safeParse(scalarForm).success).toBe(false);
  });
});

describe('source_scope_evaluated: an evaluated source must be identifiable', () => {
  const block = (tier1: unknown[]) => ({
    policy_class: 'authoritative_evidence_review',
    policy_version: 'source_policy_v1',
    evaluated_on: '2026-07-05',
    next_review_due: '2027-07-05',
    tier_3_policy: 'regulator_cited_only',
    tier_1_sources: tier1,
  });

  it('accepts a tier entry carrying a document_id', () => {
    const parsed = sourceScopeEvaluatedSchema.safeParse(
      block([{ source: 'efsa', retrieved_on: '2026-07-05', document_id: 'efsa_2015_iron_drv' }]),
    );
    expect(parsed.success).toBe(true);
  });

  it('still accepts a lone source with no document_id', () => {
    // Optional by design: backfilling the existing elements is authoring
    // work, not a mechanical fill.
    expect(sourceScopeEvaluatedSchema.safeParse(block([{ source: 'nih_ods', retrieved_on: '2026-06-26' }])).success).toBe(true);
  });

  it('REJECTS a repeated source token that names no particular document', () => {
    // iron's two EFSA opinions were distinguished by retrieved_on alone, and
    // the ids they stood for lived in a YAML comment.
    const parsed = sourceScopeEvaluatedSchema.safeParse(
      block([
        { source: 'efsa', retrieved_on: '2026-07-05' },
        { source: 'efsa', retrieved_on: '2026-07-14' },
      ]),
    );
    expect(parsed.success).toBe(false);
  });

  it('admits a repeated source once each entry names its own document', () => {
    const parsed = sourceScopeEvaluatedSchema.safeParse(
      block([
        { source: 'efsa', retrieved_on: '2026-07-05', document_id: 'efsa_2015_iron_drv' },
        { source: 'efsa', retrieved_on: '2026-07-14', document_id: 'efsa_2024_iron_ul' },
      ]),
    );
    expect(parsed.success).toBe(true);
  });

  it('rejects two entries claiming the same document', () => {
    const parsed = sourceScopeEvaluatedSchema.safeParse(
      block([
        { source: 'efsa', retrieved_on: '2026-07-05', document_id: 'efsa_2015_iron_drv' },
        { source: 'efsa', retrieved_on: '2026-07-14', document_id: 'efsa_2015_iron_drv' },
      ]),
    );
    expect(parsed.success).toBe(false);
  });

  it('does not confuse the same source evaluated at two different tiers', () => {
    // Uniqueness is within a tier, not across them.
    const parsed = sourceScopeEvaluatedSchema.safeParse({
      ...block([{ source: 'efsa', retrieved_on: '2026-07-05' }]),
      tier_2_sources: [{ source: 'efsa', retrieved_on: '2026-07-14' }],
    });
    expect(parsed.success).toBe(true);
  });
});
