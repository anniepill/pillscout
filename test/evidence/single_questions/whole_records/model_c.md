# Answers to Dietary Supplement Inquiries

## 1. I take warfarin. Can I take ginkgo?

### ANSWER
You should not take ginkgo while taking warfarin without first consulting your doctor or healthcare provider.

The evidence in the official records presents two key aspects:
1. Controlled clinical studies in healthy volunteers (testing the standardized ginkgo extract EGb 761 at recommended doses) showed that ginkgo did not significantly alter warfarin's blood-thinning effect—it had no significant effect on the international normalised ratio (INR), prothrombin time, platelet aggregation, or overall clotting status, and did not affect CYP2C9 enzyme clearance of warfarin.
2. However, major regulatory health authorities and official drug labels advise strong caution. Ginkgo contains compounds that inhibit platelet aggregation and may increase your susceptibility to bleeding. Prescribing information for warfarin (such as Jantoven) warns that botanicals like Ginkgo biloba may cause bleeding events when taken alone, may have anticoagulant, antiplatelet, or fibrinolytic properties, and these effects would be expected to be additive to warfarin's blood-thinning effects. It also notes potential CYP450 interactions. The European Medicines Agency (EMA) monograph states that taking ginkgo concomitantly with anticoagulants like warfarin may influence their effect and that in patients with bleeding tendencies or concurrent anticoagulant treatment, ginkgo should only be used after consultation with a doctor.

If your doctor agrees that you may take ginkgo, you should have adequate medical monitoring (such as routine INR checks) whenever you start taking ginkgo, change your dose, stop taking it, or switch brands/products.

### RELIED ON
records/ginkgo.yaml: bleeding_risk_profile.substance_level_statement ("Ginkgo extracts may increase susceptibility to")
records/ginkgo.yaml: bleeding_risk_profile.citations[0].verbatim ("In patients with a pathologically increased")
records/ginkgo.yaml: bleeding_risk_profile.citations[1].verbatim ("Preparations containing Ginkgo might increase susceptibility")
records/ginkgo.yaml: documented_interactions.items[partner: warfarin].citations[0].verbatim ("If the medicinal product is taken")
records/ginkgo.yaml: documented_interactions.items[partner: warfarin].citations[1].verbatim ("Available studies with warfarin do not")
records/ginkgo.yaml: documented_interactions.items[partner: warfarin].citations[2].verbatim ("International normalised ratio of prothrombine time")
records/ginkgo.yaml: documented_interactions.items[partner: warfarin].citations[3].verbatim ("INR and platelet aggregation were not")
records/ginkgo.yaml: documented_interactions.items[partner: warfarin].citations[4].verbatim ("Ginkgo may increase the risk of")
records/ginkgo.yaml: documented_interactions.items[partner: warfarin].citations[5].verbatim ("Some botanicals may cause bleeding events")
records/ginkgo.yaml: documented_interactions.items[partner: warfarin].citations[6].verbatim ("Some botanicals and foods can interact")
records/ginkgo.yaml: enzyme_inhibition_profile.citations[4].verbatim ("The mean ratio (90% CI) for")

---

## 2. Is ginkgo safe during pregnancy?

### ANSWER
No, ginkgo is not considered safe during pregnancy.

According to the records:
- The European Medicines Agency (EMA) explicitly lists pregnancy as a contraindication for well-established use dry extracts of Ginkgo biloba. This contraindication is because ginkgo extracts can impair the ability of blood platelets to aggregate and may increase the tendency for bleeding, while animal studies regarding reproductive toxicity are insufficient.
- For traditional herbal ginkgo preparations, safety during pregnancy has not been established, and in the absence of sufficient data, its use is not recommended.
- The National Center for Complementary and Integrative Health (NCCIH) states that ginkgo may be unsafe for use during pregnancy, warning that it might cause early labor or cause extra bleeding during delivery if taken close to that time.
- Health Canada cautions that you must ask a healthcare practitioner/doctor before use if you are pregnant or breastfeeding.

### RELIED ON
records/ginkgo.yaml: contraindications.items[condition: pregnancy].applies_to_preparation
records/ginkgo.yaml: contraindications.items[condition: pregnancy].citations[0].verbatim ("Pregnancy (see section 4.6. ‘Fertility, pregnancy")
records/ginkgo.yaml: pregnancy_lactation.pregnancy.citations[0].verbatim ("G. biloba extracts may impair the")
records/ginkgo.yaml: pregnancy_lactation.pregnancy.citations[1].verbatim ("Ask a health care practitioner/health care")
records/ginkgo.yaml: pregnancy_lactation.pregnancy.citations[2].verbatim ("Ginkgo may be unsafe for use")
records/ginkgo.yaml: pregnancy_lactation.pregnancy.citations[3].verbatim ("Safety during pregnancy and lactation has")

---

## 3. What does ginkgo do to blood clotting, and how?

### ANSWER
What it does:
Ginkgo can reduce the clumping (aggregation) of blood platelets, which can decrease the blood's clotting ability and potentially increase susceptibility to bleeding.
- Because of this antiplatelet activity, regulatory authorities advise that ginkgo preparations be stopped as a precaution 3 to 4 days prior to surgery.
- Published case reports and pharmacovigilance registries associate ginkgo use with bleeding incidents in single organs, including spontaneous nosebleeds (epistaxis), bleeding in the eyes (retrobulbar haemorrhage, hyphema), gastrointestinal haemorrhage, postoperative bleeding, and intracranial bleeding (such as cerebral haemorrhage and subdural haematoma). The FDA-approved label for warfarin also notes that botanicals like Ginkgo biloba may have anticoagulant, antiplatelet, or fibrinolytic properties and may cause bleeding events when taken alone.
- However, the overall evidence presents a distinction between individual case reports and clinical trials: systematic meta-analyses of haemostasis outcomes (such as Kellermann and Kloft 2011) and large randomized controlled trials (such as the GEM study by DeKosky et al. 2008) found that standardized ginkgo extract (EGb 761) at recommended doses did not show an increased risk of major bleeding compared to placebo, including in individuals concurrently taking aspirin.

How it does it:
The primary mechanism responsible for ginkgo's antiplatelet activity is receptor antagonism of Platelet-Activating Factor (PAF).
- Platelet-Activating Factor (PAF) is a potent substance in the body that normally stimulates platelets to clump together and initiate clot formation.
- Ginkgo biloba contains specific active terpene constituents known as ginkgolides (ginkgolide A, ginkgolide B, and ginkgolide C).
- These ginkgolides act as PAF-receptor antagonists—they bind to PAF receptors on human platelets and inhibit PAF from binding. Ginkgolide B is by far the most powerful antagonist of the group.
- By blocking PAF receptors, ginkgolides inhibit PAF-mediated platelet aggregation in a dose-dependent manner (without inhibiting oxidant-induced aggregation), thereby reducing platelet clumping and slowing blood clotting.

### RELIED ON
records/ginkgo.yaml: paf_antagonism_profile.mechanism_summary ("Ginkgolides A, B, and C antagonize")
records/ginkgo.yaml: paf_antagonism_profile.driver_constituents
records/ginkgo.yaml: paf_antagonism_profile.most_potent_constituent
records/ginkgo.yaml: paf_antagonism_profile.citations[0].verbatim ("PAF-mediated aggregation of human platelets was")
records/ginkgo.yaml: paf_antagonism_profile.citations[1].verbatim ("Purified ginkgolide A, B and C,")
records/ginkgo.yaml: paf_antagonism_profile.citations[2].verbatim ("The ginkgolides, and in particular ginkgolide")
records/ginkgo.yaml: bleeding_risk_profile.substance_level_statement ("Ginkgo extracts may increase susceptibility to")
records/ginkgo.yaml: bleeding_risk_profile.citations[1].verbatim ("Preparations containing Ginkgo might increase susceptibility")
records/ginkgo.yaml: bleeding_risk_profile.citations[4].verbatim ("Bleeding of individual organs has been")
records/ginkgo.yaml: bleeding_risk_profile.citations[5].verbatim ("Referring to published case reports the")
records/ginkgo.yaml: bleeding_risk_profile.citations[6].verbatim ("According to the pharmacovigilance database of")
records/ginkgo.yaml: bleeding_risk_profile.citations[7].verbatim ("Based on meta-analysis of haemostasis outcomes,")
records/ginkgo.yaml: bleeding_risk_profile.citations[8].verbatim ("Of particular note rates of major")
records/ginkgo.yaml: documented_interactions.items[partner: warfarin].citations[5].verbatim ("Some botanicals may cause bleeding events")

---

## 4. I'm on birth control pills. Does St John's wort matter?

### ANSWER
Yes, St. John's wort matters significantly if you are taking birth control pills.

St. John's wort can reduce the blood concentrations of hormonal contraceptives (birth control pills). This reduction in contraceptive hormone levels can lead to breakthrough bleeding (increased intermenstrual bleeding) and, more importantly, reduced safety and effectiveness in preventing pregnancy.

How it works:
St. John's wort contains hyperforin, an active constituent that activates the pregnane X receptor (PXR) system. When daily hyperforin intake exceeds 1 mg, it dose-dependently induces (speeds up) the activity of crucial drug-metabolizing enzymes (including CYP3A4, CYP2B6, CYP2C9, and CYP2C19) and the drug transporter P-glycoprotein. Because hormonal contraceptives are metabolized by these enzymes, this induction accelerates the elimination of the hormones from your body, causing their plasma levels to drop.

What you should do:
Under European Medicines Agency (EMA) guidance, women who take hormonal contraceptives and use St. John's wort should take additional (non-hormonal/barrier) contraceptive measures to prevent unintended pregnancy. (For traditional preparations with a low daily dose of hyperforin of less than 1 mg used for no longer than 2 weeks, no clinically relevant interactions have been reported, but standard St. John's wort extracts typically exceed this threshold).

### RELIED ON
records/st_johns_wort.yaml: special_care_interactions.hormonal_contraceptives
records/st_johns_wort.yaml: special_care_interactions.citations[1].verbatim ("The reduction of plasma concentrations of")
records/st_johns_wort.yaml: enzyme_induction_profile.mechanism
records/st_johns_wort.yaml: enzyme_induction_profile.driver_constituent
records/st_johns_wort.yaml: enzyme_induction_profile.induced_enzymes
records/st_johns_wort.yaml: enzyme_induction_profile.hyperforin_threshold_for_induction
records/st_johns_wort.yaml: enzyme_induction_profile.citations[0].verbatim ("Hyperforin induces the activity of the")
records/st_johns_wort.yaml: regulatory_classification.ema_hmpc_status.traditional_use.hyperforin_dose_tiers[0].low_dose_tier
records/st_johns_wort.yaml: regulatory_classification.ema_hmpc_status.traditional_use.citations[0].verbatim ("As the daily intake of hyperforin")

---

## 5. How much zinc per day is too much?

### ANSWER
The amount of zinc per day that is considered "too much" is defined by authoritative health bodies through the Tolerable Upper Intake Level (UL)—the maximum daily intake from all sources (food and supplements) that is unlikely to cause adverse health effects:

1. Upper Limits for Adults:
- In the United States, the Food and Nutrition Board (FNB) of the National Academies sets the UL for adults aged 19 and older (including pregnant and lactating women) at 40 mg per day.
- In Europe, the Scientific Committee on Food (SCF) established an adult UL of 25 mg per day (which also applies to pregnant and lactating women).
- Health Canada sets a maximum daily supplement dose of 50 mg per day for non-picolinate zinc (and 25 mg per day for zinc picolinate) in adults 19 and older, and requires a specific use or purpose statement for any product providing more than 40 mg per day.

2. Upper Limits for Children and Adolescents:
- Infants 0 to 6 months: 4 mg per day (FNB)
- Infants 7 to 12 months: 5 mg per day (FNB)
- Children 1 to 3 years: 7 mg per day (FNB and SCF)
- Children 4 to 8 years: 12 mg per day (FNB; SCF sets 10 mg/day for ages 4–6 and 13 mg/day for ages 7–10)
- Children 9 to 13 years: 23 mg per day (FNB; SCF sets 18 mg/day for ages 11–14)
- Adolescents 14 to 18 years: 34 mg per day (FNB; SCF sets 22 mg/day for ages 15–17)

3. Why These Limits Exist and What Happens When You Take Too Much:
- The adult UL was established primarily because excessive zinc impairs the body's absorption of copper.
- Acute excess intake: Consuming high doses of zinc can cause acute symptoms including nausea, vomiting, gastric distress, dizziness, headaches, and loss of appetite.
- Chronic excess intake: Taking doses of 50 mg of zinc or more per day for several weeks (typically from dietary supplements or excessive use of zinc-containing denture adhesive creams) interferes with copper absorption, resulting in copper deficiency, reduced immune function, and lower HDL ("good") cholesterol levels.
- Severe overuse of denture creams containing zinc has also been reported to cause anemia and severe neurological damage (such as sensory ataxia and myelopathy).
- At very high doses (142 mg per day), zinc supplements can also interfere with magnesium absorption and disrupt magnesium balance.

### RELIED ON
records/zinc.yaml: reference_values (construct: ul, life_stage: adult, FNB)
records/zinc.yaml: reference_values (construct: ul, life_stage: infant/child/adolescent, FNB)
records/zinc.yaml: reference_values (construct: ul, life_stage: adult, SCF)
records/zinc.yaml: reference_values (construct: ul, life_stage: child/adolescent, SCF)
records/zinc.yaml: reference_values[6].verbatim ("Tolerable Upper Intake Levels (ULs) for")
records/zinc.yaml: reference_values[6].qualifier ("The FNB has established ULs for")
records/zinc.yaml: reference_values[41].verbatim ("An UL of 25 mg/day is")
records/zinc.yaml: reference_values[41].qualifier
records/zinc.yaml: regulatory_classification.health_canada_nnhpd_status.daily_dose_range_mg
records/zinc.yaml: regulatory_classification.health_canada_nnhpd_status.citations[1].verbatim ("Zinc (from non-picolinate sources) (mg/day). Infants")
records/zinc.yaml: documented_adverse_reactions.items[0].citations[0].verbatim ("High zinc intakes can cause nausea,")
records/zinc.yaml: documented_adverse_reactions.items[1].citations[0].verbatim ("If used for weeks, doses of")
records/zinc.yaml: documented_adverse_reactions.items[2].citations[0].verbatim ("According to a few reports, overuse")
records/zinc.yaml: documented_interactions.items[partner: magnesium (high supplemental doses of zinc)].citations[0].verbatim ("Very high doses of zinc from")

---

## 6. Does ginkgo interact with metformin?

### ANSWER
According to clinical study data in the records, ginkgo does not have a significant pharmacokinetic interaction with metformin.

Specifically, a controlled clinical study evaluated in the European Medicines Agency (EMA) assessment report (Kudolo et al. 2006) investigated the coadministration of 120 mg of the standardized ginkgo extract EGb 761 and 500 mg of metformin and concluded that ginkgo did not significantly affect the pharmacokinetic properties (absorption, distribution, or clearance) of metformin.

However, Health Canada's regulatory monograph on Ginkgo biloba includes a general caution advising consumers to consult a healthcare practitioner/doctor prior to use if they are taking medications for diabetes (alongside medications for high blood pressure or seizures).

### RELIED ON
records/ginkgo.yaml: documented_interactions.items[partner: metformin].citations[0].verbatim ("In conclusion, coingestion of 120 mg")
records/ginkgo.yaml: documented_interactions.items[partner: diabetes medications].citations[0].verbatim ("Ask a health care practitioner/health care")
records/ginkgo.yaml: citation_gaps[1].gap ("RESOLVED 2026-08-16 (was INTEGRITY FLAG, Q4")

---

## 7. Is ashwagandha safe with thyroid medication?

### ANSWER
There is no profile or information for ashwagandha in the provided records. Because these answers must rely strictly on the contents of the files in `records/` without using outside knowledge or external sources, it is not possible to determine from the provided records whether ashwagandha is safe with thyroid medication.

### RELIED ON
None (no record or file for ashwagandha exists under records/).

---

## 8. I take ginkgo, St John's wort, zinc and warfarin. What should I know?

### ANSWER
Taking this combination of supplements together with warfarin poses serious, clinically significant interaction risks. You should immediately discuss this regimen with your prescribing doctor or anticoagulation specialist before continuing.

Here is what you need to know about each component and how they interact:

1. Major Contraindication: St. John's Wort and Warfarin
- Concomitant use of St. John's wort with coumarin-type anticoagulants (which includes warfarin) is explicitly contraindicated in the European Medicines Agency (EMA) monograph (for well-established use extracts and traditional use extracts providing more than 1 mg daily hyperforin).
- St. John's wort contains hyperforin, which strongly activates the PXR receptor and induces liver and intestinal enzymes—most notably CYP2C9 (the principal enzyme that clears active S-warfarin), as well as CYP3A4, CYP2B6, CYP2C19, and P-glycoprotein.
- This induction accelerates the metabolism and elimination of warfarin, leading to lower warfarin blood levels and a potential loss of anticoagulant efficacy. This significantly increases your risk of developing dangerous blood clots. The FDA label for warfarin (Jantoven) also explicitly lists St. John's wort as interacting through CYP450 enzymes.

2. Bleeding Risk Caution: Ginkgo and Warfarin
- Ginkgo biloba acts as an antagonist to Platelet-Activating Factor (PAF) and inhibits platelet aggregation.
- Official drug labeling for warfarin (Jantoven) warns that botanicals like Ginkgo biloba can have anticoagulant, antiplatelet, and/or fibrinolytic properties, can cause bleeding events on their own, and would be expected to produce additive bleeding effects when taken with warfarin. NCCIH similarly warns that ginkgo may increase bleeding risk in people taking anticoagulants such as warfarin.
- While controlled trials in healthy individuals with standardized extract EGb 761 found no significant change in INR, prothrombin time, or platelet aggregation at recommended doses, the EMA monograph warns that ginkgo might increase bleeding tendency and may influence anticoagulant effects. It recommends that ginkgo only be taken after consulting a doctor, with adequate INR monitoring when starting, stopping, changing the dose, or switching products.

3. Combined Conflicting Effects on Warfarin:
- Combining both St. John's wort and ginkgo with warfarin is particularly unpredictable and hazardous. St. John's wort accelerates warfarin breakdown (reducing drug levels and increasing clotting risk), while ginkgo impairs platelet aggregation and can cause additive bleeding risks. These opposing and erratic pharmacodynamic and pharmacokinetic forces make stable anticoagulation control difficult and dangerous.

4. Timing and Safety for Zinc:
- Under Health Canada guidelines, products providing zinc should be taken with food and spaced a few hours before or after taking other medications or health products to avoid interfering with absorption.
- Ensure your total daily zinc intake from all sources does not exceed safe upper limits (the adult Tolerable Upper Intake Level is 40 mg/day according to the US FNB, or 25 mg/day according to the European SCF), because chronic doses of 50 mg/day or more can cause copper deficiency, anemia, and impaired immune function.

Bottom line: St. John's wort is contraindicated with warfarin and should be avoided; ginkgo requires physician approval and close INR monitoring due to bleeding risks; and zinc should be taken hours apart from your medications and within safe daily dosage limits.

### RELIED ON
records/st_johns_wort.yaml: dose_scoped_contraindications.contraindicated_drug_categories
records/st_johns_wort.yaml: dose_scoped_contraindications.citations[0].verbatim ("Concomitant use with coumarin-type anticoagulants, cyclosporine,")
records/st_johns_wort.yaml: enzyme_induction_profile.mechanism
records/st_johns_wort.yaml: enzyme_induction_profile.induced_enzymes
records/st_johns_wort.yaml: enzyme_induction_profile.citations[0].verbatim ("Hyperforin induces the activity of the")
records/ginkgo.yaml: bleeding_risk_profile.substance_level_statement ("Ginkgo extracts may increase susceptibility to")
records/ginkgo.yaml: bleeding_risk_profile.citations[0].verbatim ("In patients with a pathologically increased")
records/ginkgo.yaml: documented_interactions.items[partner: warfarin].citations[0].verbatim ("If the medicinal product is taken")
records/ginkgo.yaml: documented_interactions.items[partner: warfarin].citations[1].verbatim ("Available studies with warfarin do not")
records/ginkgo.yaml: documented_interactions.items[partner: warfarin].citations[2].verbatim ("International normalised ratio of prothrombine time")
records/ginkgo.yaml: documented_interactions.items[partner: warfarin].citations[4].verbatim ("Ginkgo may increase the risk of")
records/ginkgo.yaml: documented_interactions.items[partner: warfarin].citations[5].verbatim ("Some botanicals may cause bleeding events")
records/ginkgo.yaml: documented_interactions.items[partner: warfarin].citations[6].verbatim ("Some botanicals and foods can interact")
records/zinc.yaml: documented_interactions.items[partner: other oral medications and health products (concurrent administration)].citations[0].verbatim ("Products providing calcium, iron or zinc.")
records/zinc.yaml: reference_values[6].verbatim ("Tolerable Upper Intake Levels (ULs) for")
records/zinc.yaml: reference_values[41].verbatim ("An UL of 25 mg/day is")
records/zinc.yaml: documented_adverse_reactions.items[1].citations[0].verbatim ("If used for weeks, doses of")

---

## FILES OPENED:
records/ginkgo.yaml
records/st_johns_wort.yaml
records/zinc.yaml
