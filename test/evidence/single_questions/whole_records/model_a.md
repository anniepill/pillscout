# 1. I take warfarin. Can I take ginkgo?

ANSWER: Do not start or change ginkgo without first consulting the clinician who manages your warfarin. The record is mixed: studies at recommended ginkgo doses in healthy people did not find a significant effect on INR, clotting status, platelet aggregation, or warfarin pharmacodynamics, but ginkgo can reduce platelet aggregation and may increase bleeding. A warfarin label says those effects are expected to add to warfarin's anticoagulant effect. If your clinician agrees to its use, the record advises adequate monitoring when ginkgo is started, stopped, changed in dose, or switched to a different product.

RELIED ON:
records/ginkgo.yaml — documented_interactions.items[partner=warfarin].citations
records/ginkgo.yaml — bleeding_risk_profile.citations

# 2. Is ginkgo safe during pregnancy?

ANSWER: No—the record says ginkgo is contraindicated during pregnancy. It says ginkgo may impair platelet aggregation and increase bleeding, while animal evidence is insufficient regarding reproductive toxicity. Another regulator advises asking a health professional before use if pregnant or breastfeeding.

RELIED ON:
records/ginkgo.yaml — pregnancy_lactation.pregnancy.citations

# 3. What does ginkgo do to blood clotting, and how?

ANSWER: Ginkgo can reduce platelet aggregation and may make bleeding more likely. The record describes ginkgolides A, B, and C as antagonists of platelet-activating factor (PAF) receptors, with ginkgolide B the most potent; blocking PAF-mediated platelet aggregation is the stated antiplatelet mechanism. Human pharmacology data also report reduced blood viscosity. The record nevertheless says ginkgo's exact overall mechanism is not known.

RELIED ON:
records/ginkgo.yaml — pharmacology.pharmacodynamics
records/ginkgo.yaml — paf_antagonism_profile
records/ginkgo.yaml — bleeding_risk_profile

# 4. I'm on birth control pills. Does St John's wort matter?

ANSWER: Yes. St John's wort can lower hormonal-contraceptive concentrations, which may cause more bleeding between periods and reduce contraceptive safety. The record says women using hormonal contraceptives should use additional contraceptive measures. The interaction is linked to hyperforin-driven, dose-dependent induction of CYP enzymes and P-glycoprotein, which can speed the elimination of other drugs.

RELIED ON:
records/st_johns_wort.yaml — special_care_interactions.hormonal_contraceptives
records/st_johns_wort.yaml — special_care_interactions.citations
records/st_johns_wort.yaml — enzyme_induction_profile
records/st_johns_wort.yaml — transporter_induction_profile

# 5. How much zinc per day is too much?

ANSWER: For a healthy adult, the record contains two different authority limits for total daily zinc: the US Food and Nutrition Board UL is 40 mg/day, including during pregnancy and lactation, while the European Scientific Committee on Food UL is 25 mg/day. These are upper limits, not target doses. The US age-specific limits are 4 mg for 0–6 months, 5 mg for 7–12 months, 7 mg for ages 1–3, 12 mg for ages 4–8, 23 mg for ages 9–13, 34 mg for ages 14–18, and 40 mg for ages 19 and older. The US limits cover zinc from food and supplements and do not apply to medically supervised zinc treatment.

RELIED ON:
records/zinc.yaml — reference_values[construct=ul, source.authority=Food and Nutrition Board]
records/zinc.yaml — reference_values[construct=ul, source.authority=Scientific Committee on Food]

# 6. Does ginkgo interact with metformin?

ANSWER: In the study described by the record, taking 120 mg of EGb 761 ginkgo extract with 500 mg of metformin did not significantly change metformin's pharmacokinetics. That is a null finding for that studied extract and dose; the record does not establish that every ginkgo product and dosing pattern is interaction-free.

RELIED ON:
records/ginkgo.yaml — documented_interactions.items[partner=metformin].citations

# 7. Is ashwagandha safe with thyroid medication?

ANSWER: I cannot answer this from the supplied records. There is no ashwagandha record or field in `records/`, so the files provide no information about combining it with thyroid medication.

RELIED ON:
None — no ashwagandha file or field is present in records/.

# 8. I take ginkgo, St John's wort, zinc and warfarin. What should I know?

ANSWER: This combination needs review by the clinician managing your warfarin before you continue, stop, or change the supplements. Ginkgo may inhibit platelet aggregation and increase bleeding, and a warfarin label says its anticoagulant or antiplatelet effects are expected to add to warfarin's effect. Although controlled studies at recommended ginkgo doses found no significant warfarin effect in healthy subjects, the record still advises monitoring when ginkgo is started, stopped, dose-changed, or product-switched.

St John's wort is a separate concern. For products providing more than 1 mg of hyperforin daily, the record classifies use with coumarin-type anticoagulants as contraindicated. Hyperforin dose-dependently induces CYP enzymes and P-glycoprotein and can accelerate drug elimination, lowering drug concentrations; a warfarin label also identifies St John's wort among botanicals that can interact through CYP450.

For zinc, stay within the applicable total-intake upper limit unless it is being used under medical supervision. The adult limits in the record differ by authority: 40 mg/day from the US Food and Nutrition Board and 25 mg/day from the European Scientific Committee on Food.

RELIED ON:
records/ginkgo.yaml — documented_interactions.items[partner=warfarin].citations
records/ginkgo.yaml — bleeding_risk_profile
records/st_johns_wort.yaml — dose_scoped_contraindications
records/st_johns_wort.yaml — enzyme_induction_profile
records/st_johns_wort.yaml — transporter_induction_profile
records/zinc.yaml — reference_values[construct=ul, population.life_stage=adult]

# FILES OPENED

records/ginkgo.yaml
records/st_johns_wort.yaml
records/zinc.yaml
