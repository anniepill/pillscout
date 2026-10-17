# Strategy review

Independent review of the quoted-source lookup service in this folder. Not legal advice. Searches outside the folder: FDA clinical decision support guidance and its non-device example for drug-interaction notices; EU MDCG 2019-11 on software that flags interactions; NatMed Pro coverage and price; Stockley's Herbal Medicines Interactions; Drugs.com's checker; Memorial Sloan Kettering About Herbs.

## 1. Value

A person asking about their own supplements and medicines does not get a better decision here than from a current model with web search. They get other citations, and sometimes a worse silence.

Both cabinet arms could search.  Web-only answers already named the pairs that change behavior: ginkgo with warfarin, St John's wort with sertraline and warfarin, red yeast rice as a second statin, calcium and iron blocking levothyroxine, gymnema with diabetes drugs, garlic with clopidogrel, sedatives with zolpidem, and kava. Both arms said see a clinician and do not add the new item, 4 of 4 (SCORECARDS.md). Files in `evidence/cabinets/web_only/` never name the European Medicines Agency, Health Canada, or the Egyptian Drug Authority. The lookup inserts those sentences. That is attribution.  Monacolin K, the gymnema glucose warning, and ginkgo's bleeding warning were already reached from NIH and FDA pages.

The file also hid findings. `cabinet_b.yaml` marks green tea extract with atorvastatin "nothing found." Web-only models A and B said the extract can lower atorvastatin levels. With the file, those answers drop it (`web_plus_lookup/model_a.md`, `model_b.md`). `cabinet_a.yaml` marks calcium with iron "nothing found"; a web-only answer said they compete. Model E, allowed to search, did not, and never mentioned omeprazole with clopidogrel (`model_e.md`).

The scorecards overstate this. A non-US citation is scored as if the advice were new. "Every planted interaction" was a tie, and the plant list is unpublished. Single-question gains are against models banned from using their own knowledge. The scorecards understate a false "nothing found."

## 2. Stop or continue

Stop. The product hoped for was not tested, and what was tested does not beat search.

Five months, 21 records, lookup unbuilt (BRIEF.md). Fixed lists marked ginseng with glipizide "nothing found" although the record says ask before diabetes drugs, missed passionflower's drowsiness warning and "anti-platelet" versus "antiplatelet," and drew 72 of 158 class matches from phrases like "any medications" (SCORECARDS.md). The good scores are a second build, a model using judgment. There is no software matcher. Names were ingredients, not bottles. The builder graded one run, and a family left out of the packet is still inside every "of 4."

Search, Drugs.com, NIH pages, and Memorial Sloan Kettering About Herbs (about 300 herbs) already answer a person. Pharmacists have NatMed Pro (about 1,400 monographs, commercial products, from about $182 a year) and Stockley's (about 200 herbs, with severity and an action). This service skips medicine against medicine. Search found the planted problems; the hand-built file hid one.

The case for continuing is the disagreement search flattened. Web-only answers make ginkgo with warfarin one bleeding warning. The record keeps three positions: Health Canada's "do not use" with blood thinners, the European monograph's "studies show no interaction, still monitor," and the US label's added effect (`cabinet_a.yaml`; `web_plus_lookup/model_b.md`). Same file: the European Commission line against red yeast rice with cholesterol medicine, EFSA's "monacolin K is lovastatin," Egypt's instruction to monitor glucose and adjust doses, and garlic stopped seven days before surgery. None of those authorities appear in the web-only files. On a gap, the slice says "nothing found, not safety" for ginkgo with amoxicillin; unaided models said "no known interaction" (`lookup_slices/q2.yaml`). The 60,000-token ginkgo record hid the Health Canada line under the class; the slice did not (SCORECARDS.md). That forced quote, and an honest gap, is all a buyer cannot get by searching.

## 3. Who it is for

Not a person at home. They need a bottle turned into ingredients and amounts, a total when zinc is in three products, medicine against medicine, and the herbs these 21 records skip. Ashwagandha, fish oil, berberine, chromium, melatonin, and CBD were on the cabinets and uncovered. The first plausible buyer is a medicines-information pharmacist. They would use verbatim sentences when a US source is thin, or when two authorities disagree and that disagreement has to survive: document id, section, quote, and a label that the source named a class, not this drug. They pay low hundreds of dollars a year for NatMed or Stockley's, and only if the herbs asked about are covered and current. Missing is what those products already sell: severity, avoid versus monitor, commercial products, dose arithmetic, clinician review, and a software query. The cabinet files are 9,500 to 17,000 tokens of enzyme matches, HIV drugs, and bath warnings that every model discarded (SCORECARDS.md). They also need medicine against medicine. On cabinet C that pair mattered most, and this service refuses it.

The second is a builder of a health app or agent. They would call for a bounded passage, the match kind, and "no record," not prose for a patient. They will not pay until a matcher does that without a person or another model reading the file. Missing: that matcher, a measured false-negative rate, product resolution, and a silence the agent may not treat as clearance.

The records, and the checks that a stored sentence matches its source, are worth more another way. "Weigh everything a person takes" is what the cabinet test fails. A quote-locked set of EMA, Health Canada, EFSA, and WHO passages, disagreements kept, could sit behind a checker that already has coverage and a clinician, or test whether a model keeps a null study beside a contraindication and treats silence as silence. The months went into the quotes. The lookup failed as software and was swapped for judgment in the demo.

## 4. Agents

An agent needs retrieval more than a person does. This retrieval is a bad thing for an agent to trust.

A person never opens the 60,000-token ginkgo record. Two of four models given that record stopped at "warfarin" and missed Health Canada's line, filed under the class (SCORECARDS.md). A prepared slice fixes that. The filing problem is real for a machine, and it is not a reason to let the machine act.

Model E could search, did not, refused uncovered supplements, and skipped omeprazole with clopidogrel (`web_plus_lookup/model_e.md`). Others discarded pathway matches. Model C stated a class match as if the source had named the drug. An agent that trusts the tool inherits green tea with atorvastatin as "nothing found," and skips the search that found the lowering.

Required before an agent should depend on it: a software matcher scored on unseen pairs, including interactions the records lack; "nothing found" must not block another tool; medicine against medicine and unknown products stay required work elsewhere; class matches stay labeled. Until that is measured, web search is safer, and a person is safer than an agent that believes the file.

## 5. Law and liability

Not legal advice.

The exposed use is a person's list and a yes or no on starting valerian or kava. FDA's clinical decision support guidance leaves drug-interaction notices outside device regulation only for a health professional, from labeling or current sources, shown so they can review the basis and not rely on the software. Patient-facing advice for or against treatment falls outside that exclusion and can still be a device. EU MDCG 2019-11 treats software that flags a person's interactions, or recommends therapy, as a medical device, generally class IIa, and higher if a wrong answer could cause serious harm. "Is this OK?" on warfarin, clopidogrel, or stacked sedatives is that case. Telling a named person not to start something also sits nearest unlicensed practice of medicine or pharmacy. The answers recommend anyway.

"Nothing found" is the omission risk. The files say silence is not safety. Cabinet B still marks green tea extract with atorvastatin that way, and these answers then omit a lowering effect search had stated. Model E also skips omeprazole with clopidogrel, which is unchecked. If an app treats silence as clearance, the wrong gap is the harm. The first matcher already did that for ginseng and diabetes.

Safest: quotes for a clinician who decides; the records as a model test; a passage, document id, and match kind shown to a professional, with no start or stop. "Do not take this" to a named person, or an agent acting on a gap, is the exposed use.

## 6. Verdict

Change direction. Stop the consumer service and any plan for an agent to weigh a cabinet on these records. Search already gives that decision. Coverage is 21 ingredients. The matcher failed the cases it was given.

If anything continues, keep the quote-locked extracts: a source a clinician can cite, or a test that a model preserves disagreement and silence. Leave the lookup unbuilt.

What would reverse this: on real labels, a blind matcher changes the advice versus web search, hides no interaction search finds, and a new ingredient is cheap enough to repeat for herbs people take.

Cheapest test: ten drugstore products. Write the expected pairs first. One model searches the names. Another sees only the fixed word-list matcher. Count changed advice and real interactions marked nothing found. Time one new ingredient. If that arm still misses a class warning and still clears a real interaction, stop.

## 7. What this packet gets wrong

It grades an oracle. A model wrote the lookup files after the matcher failed, with the cabinets known, and the scorecards treat those files as the service. The tie on planted interactions is nearly circular, and the plant list is unpublished.

It scores models banned from their own knowledge, then treats that like the cabinet test. On the cabinet test the file added no problem and suppressed some.

It never sets 21 records against existing tools or their prices. No clinician reviewed the records, and that fact is left idle. One model is omitted and still counted in every "of 4." False reassurance, class matches stated as if the source named the drug, and alarmist wording go unscored. The design forbids a recommendation. The answers recommend.
