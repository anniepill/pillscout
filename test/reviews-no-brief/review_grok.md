## 1. Value

For a person asking about their own supplements and medicines, a current model with web search already reaches the decisions in these cases.

With no lookup and no web, three models already told a warfarin user not to add ginkgo, told a person on birth-control pills that St John's wort matters, and gave the adult zinc ceiling of 40 mg (`evidence/single_questions/no_lookup_no_web/model_a.md`, `model_b.md`, `model_c.md`). With web search and no lookup, they named the cabinet actions that matter: St John's wort with sertraline and warfarin, red yeast rice with atorvastatin, calcium and iron held away from levothyroxine, and do not start valerian (`evidence/cabinets/web_only/cabinet_a_model_a.md`, `cabinet_a_model_b.md`). They also covered ashwagandha and fish oil, marked "no record" in `evidence/cabinets/lookup_files/cabinet_a.yaml`. Web-only answers caught medicine-medicine problems the lookup skips, including omeprazole with clopidogrel (`evidence/cabinets/web_only/cabinet_b_and_c_model_a.md`).

The lookup adds a typed bundle: verbatim lines, document ids, whether the source named the drug or only a class or an enzyme, dose conditions such as hyperforin above 1 mg, and a line that an empty result is not safety (`evidence/single_questions/lookup_slices/q1.yaml`, `q2.yaml`). Careful models already said the ginkgo evidence is mixed. Less careful ones invented magnitudes anyway (`cabinet_a_model_c.md`). In `evidence/cabinets/web_plus_lookup/model_e.md` a missing valerian pairing became "no major direct interactions." When lookup was supplied and web search was unused, ashwagandha and fish oil fell back to unnamed general knowledge (`web_plus_lookup/model_a.md`, `model_e.md`).

`BRIEF.md` and `SCORECARDS.md` are not in the folder. A claim that this beats a model with web search for a person at home would overstate these files. They show a citation format.

## 2. Stop or continue

The strongest case for stopping is that the consumer job is already done, and the unfinished job is the expensive one.

The questions are the famous ones: warfarin, ginkgo, St John's wort, zinc, statins, levothyroxine. NatMed Pro screens natural products against drugs and expands a commercial product into its ingredients. Stockley's Herbal Medicines Interactions sells clinician monographs. Drugs.com runs a free checker that includes supplements (searched those three names). This packet never resolves a real bottle, never totals across products, and never shows a matcher running as software. The cabinets arrive with ingredient names already typed (`cabinet_a.yaml`). Models with web search reached the same stop, do-not-start, and four-hour-separation advice. The record set named in `evidence/single_questions/whole_records/model_b.md` is about twenty ingredient files, and every cabinet includes items with no record. An empty answer is the dangerous output. One model with the lookup in hand turned emptiness into reassurance (`web_plus_lookup/model_e.md`). A person who can ask a pharmacist or a model will not pay to finish that catalog.

The strongest case for continuing is that a model invents, and the record can stop a kind of invention.

Without the record, one model asserted a ginkgo-metformin transporter effect. Tied to the record, another reported a single null pharmacokinetic study (`no_lookup_no_web/model_c.md`, `whole_records/model_a.md`). With web search, one model wrote "nearly 40%" and "up to one-third" of a levothyroxine dose never absorbed (`cabinet_a_model_c.md`). The slices keep distinctions a prose answer flattens: named versus class versus pathway, a null finding beside a warning, a dose threshold, and "nothing is not safety" (`q1.yaml`, `q2.yaml`, `q3.yaml`). Models that obeyed them kept the ginkgo contradiction intact and named calcium carbonate and ferrous sulfate (`web_plus_lookup/model_b.md`). A buyer who must show why a sentence was said can use that object. Continuing means keeping the control layer for that buyer.

## 3. Who it is for

A person at home is the wrong buyer. The two plausible buyers are a builder of a health app or agent, and a pharmacist or a health system.

A builder would use the lookup as a retrieval object. The fields worth having are the match kind, the verbatim, the document id, the dose and preparation conditions, and a typed empty result, so silence stays unknown. They would pay for an API that returns those fields, a license to show the sentence, and a written promise of what an empty result means. Missing: the catalog, the step from a bottle to its ingredients, medicine-medicine pairs (the lookup "does not check prescription medicines against one another," `web_plus_lookup/model_a.md`), and any sign that the matcher is software. NatMed already expands commercial products. A builder will not pay for another twenty monographs of ginkgo.

A pharmacist or a health system would use the passages inside a medication review, to show which sentence was relied on and whether the source named the drug. They would pay if the file attached to products on the shelf and to medicines already in the profile, and if it stayed current. Missing: the supplements patients actually bring. Ashwagandha, fish oil, berberine, chromium, melatonin, and CBD oil are "no record" across the three cabinets (`cabinet_a.yaml`, `cabinet_b.yaml`, `cabinet_c.yaml`). Also missing is a severity a pharmacist can rank beside Lexicomp or NatMed, and the medicine-medicine check that led the clopidogrel answer on the open web (`cabinet_b_and_c_model_a.md`). A health system will not swap its checker for a folder of passages.

The records, and the rule that a stored line has to match a source passage, are worth more as a provenance method than as this service. That method can constrain any model that quotes a regulator. The extraction pipeline is worth keeping only if one new ingredient is cheap to author and cheap to re-check when the monograph changes. That cost is untested. A person asking and an answer coming back is the weak use of the method. The answer is what a model already writes.

## 4. Agents

An agent needs a store like this more than a person does, for one job: refusing to invent, and refusing to treat a miss as a clearance.

A person can ask again, show the bottle, and call a pharmacist. An agent allowed to act has to decide from a list. Here the unconstrained failure is confident invention (`no_lookup_no_web/model_c.md`, `cabinet_a_model_c.md`). The constrained failure runs the other way. Given the lookup and no web, one model told person A there were no major direct interactions between valerian and warfarin, levothyroxine, or sertraline (`web_plus_lookup/model_e.md`). The slice for a missing pair says that absence is not a finding of safety (`q2.yaml`). The store gives the agent a type. The agent can ignore it.

What would have to be true is stricter than these files. The agent would have to emit the match kind and refuse to act on "nothing," on class matches, and on pathway matches. The store would have to cover real labels, including these cabinets' blanks. Medicine-medicine pairs would have to be in scope before any action. A person would still confirm a stop, a start, or a dose change. Until then the agent is a model with a smaller library.

## 5. Law and liability

This is not legal advice. Searched: FDA Clinical Decision Support Software guidance (29 January 2026) on FD&C Act section 520(o)(1)(E); Baker v. Arbor Drugs (Mich. Ct. App. 1996); Hardin v. PDX, Inc. (Cal. Ct. App. 2014).

Patient-facing advice about a person's own medicines is the use most likely to be a device. The non-device exclusion needs all four criteria. FDA reads the third as a recommendation to a health care professional, and says recommendations to patients or caregivers meet the device definition. These cabinet answers direct the person: do not start valerian, deal with St John's wort, separate levothyroxine by four hours. A clinician list, basis visible and judgment left with the clinician, is the closer case. Medical and pharmacy practice limits make information-plus-referral the ordinary pattern. Telling a particular person to stop or change a prescription is the unauthorized-practice exposure.

"Nothing found" is a separate liability problem. Baker let a claim proceed where a pharmacy advertised interaction detection and missed a pair. Hardin let a claim proceed against a firm whose configuration omitted a patient warning. This service says an empty result is not safety (`q2.yaml`). The cabinets are full of empties: ashwagandha, fish oil, and no medicine-medicine check. Sold as checking "what you take," a clean screen matches that pattern. Model E already said it (`model_e.md`).

Safest: a licensed clinician or pharmacist sees the verbatim, the match kind, and the empty-result warning, and decides. Next safest: a publisher shows sourced excerpts and makes no recommendation.

## 6. Verdict

Change direction. Stop the service as a way for a person at home to ask about their own supplements. Keep the provenance method only if a buyer who needs typed passages will pay for them. Stop writing the consumer answers.

The result that would reverse this is a head-to-head on real products, in which the lookup changes an action a pharmacist would take, on pairs a model with web search gets wrong, often enough to matter, at an authoring cost that can fill the gaps these cabinets already show.

The cheapest test: ten real bottles plus the prescription list, labels photographed, ingredients not pre-typed. One pharmacist writes the actions that matter. One strong model with web search answers. Time one author producing one new ingredient to the standard of the ginkgo passages, including the empty-result rule. If the model matches the pharmacist, or one ingredient takes days, stop.

## 7. What this packet gets wrong

`BRIEF.md` and `SCORECARDS.md` are not in the folder, so the stakeholder's scores could not be checked. That is a gap in a packet meant to be audited.

What is here sets the lookup against a model's memory. The comparison that matters is the lookup against a model that can search. On that comparison the lookup is silent where it has no record, and it skips medicine against medicine. Several "web plus lookup" runs used no web search (`web_plus_lookup/model_a.md`, `model_e.md`), so they measure a substitute. Cabinets arrive with ingredients already named, which skips the step listed as untested. The sample is the interactions public pages already cover. Models still overwrite the records: they add urgency, drop null findings, and turn "nothing" into "no major interaction." Scoring the careful answers and leaving out model E flatters the service.
