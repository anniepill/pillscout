# Review: quoted-source supplement and medicine lookup service

Reviewer family: claude

Web searches run: FDA clinical decision support guidance (January 2026); TRC NatMed Pro interaction checker and API; NIH Dietary Supplement Label Database (DSLD) API; Health Canada Licensed Natural Health Products Database API; EFSA zinc upper limit; Kudolo 2006 ginkgo and metformin study; EU MDR Rule 11 and MDCG 2019-11 on interaction software.

## 1. VALUE

For a person at home, almost nothing that changes what they should do. Every condition, including no data and no web, told the warfarin-and-ginkgo asker not to combine without their clinician (no_lookup_no_web/model_a.md, model_b.md, model_c.md). In the cabinets, web search alone found every planted interaction in all four models (SCORECARDS.md). The lookup added no detection.

What it adds is real but narrow: exact non-US regulator wording (Health Canada's ginkgo contraindication, the European Commission's red yeast rice rule, the Egyptian gymnema caution), both zinc limits, scope conditions such as the cassia-versus-verum caveat (cabinet_b.yaml), and an honest "nothing found is not safety" on amoxicillin (lookup_slices/model_b.md). That matters to professionals more than patients.

It also subtracted. cabinet_b.yaml lists green tea extract with atorvastatin as "nothing found". Model A caught that interaction with web only, citing NCCIH (web_only/cabinet_b_and_c_model_a.md), and missed it with the lookup. Models A and E ran zero searches once given the file. E missed omeprazole with clopidogrel and kava's liver risk, and turned "nothing found" into "no specific interactions were noted" (web_plus_lookup/model_e.md).

The scorecards overstate. Two of six cabinet checks can only be scored by the service. E's omissions sit outside the table. The metformin check rewards repeating one conclusion sentence; the study abstract (Kudolo 2006, searched) also reports a longer metformin half-life and lower HbA1c in diabetics.

## 2. STOP OR CONTINUE

**Stop.** Five months produced 21 ingredients and no software lookup. The parts a consumer service needs (product to ingredients and amounts, totals across products, software matching) are untested, and the one matcher attempt failed badly: 72 of 158 class matches came from phrases like "any medications", and it put ginseng with glipizide under "nothing found" (SCORECARDS.md). Authoring cost is unknown. NatMed Pro already sells checks across 1,400 ingredients and 300,000 products, with an API (searched). The evidence shows no detection gain and measured harm: a false "nothing found", models that stopped searching, a model that read silence as clearance. The rule "quote, never reconcile" pushes judgment onto the model, which is where errors arose: model C presented a ginseng blood-pressure syndrome that its EMA source had dismissed (web_plus_lookup/model_c.md), and model A told a person to space zinc from warfarin on the strength of a generic Health Canada line (lookup_slices/model_a.md). Every step toward consumers raises regulatory exposure. No clinician has reviewed it.

**Continue.** The provenance is real and rare. Every statement carries an exact, located quote with its conditions, so anyone can check it; no web answer and no proprietary database offers that. Where retrieval was right it fixed a real failure: two of four models missed Health Canada in whole records, all four found it in slices. With a disciplined model the file produced the best answers in the packet, keeping regulators' disagreement visible, searching for uncovered items, and stating limits (web_plus_lookup/model_b.md). Model A's tokens fell from 346K to 133K. NatMed is paywalled editorial synthesis, not quotable regulator text. The slowest work, the verification method, is done and generalizes. What failed was matching and coverage, which are cheaper to fix than trust is to earn.

## 3. WHO IT IS FOR

Not a person at home. Two candidates are plausible.

**Builders of health apps and AI agents.** They need answers they can defend line by line. They would use the records as grounding and, more valuably, the verification method as a checker: given a sentence a model wrote and a cited regulator document, confirm the quote exists, where, and under what conditions. They would pay per call or by licence for coverage, an update feed when monographs change, and an audit trail to show a hospital customer or regulator. Missing: coverage in the hundreds, a software matcher with measured recall, change tracking, per-source licensing clarity, and evidence that it reduces errors in their product rather than only adding citations.

**Supplement makers' regulatory and labelling teams.** Firms selling into Canada, the EU, the US and the Middle East need exact regulator wording: Health Canada monograph cautions and dose ranges, the EU red yeast rice rule, EMA monograph positions. The records already store source position, directive (ask before use, stop use) and dose thresholds. They would pay for a side-by-side multi-jurisdiction monograph view with change alerts. Missing: far more ingredients, claims and dose sections rather than interactions only, completeness per jurisdiction, and monitoring. There is no clinical liability, buyers have budgets, and "never reconcile" is a feature here.

Pharmacists and health systems are a weaker third: they already have NatMed and Lexicomp and buy breadth and workflow integration, which this lacks. Insurers and regulators have no clear purchase.

The part worth most is the method of proving a stored statement matches its source. It is not specific to supplements. Any team putting AI-written health text in front of users faces the same question, whether the quote exists verbatim in the cited document, and few have a working answer. The extraction pipeline with exact positions comes second, if it can be shown to author an ingredient in one clean run. The 21 records are least valuable: a demonstration, too small to sell. Used as a verifier, the build is worth more than the service as designed.

## 4. AGENTS

Partly, and the evidence cuts both ways. An agent needs a filtered, labelled slice more than a person does. Given whole records, models used up to 2 million tokens and half missed the Health Canada line filed under a class heading; given slices, all four found it (SCORECARDS.md). A person would never read a 60,000-token record anyway.

But agents also over-trust the tool. Models A and E stopped searching once they had the file, and E treated silence as clearance (web_plus_lookup/model_e.md). A person who keeps searching is protected from a gap; an agent that defers is not. An incomplete tool therefore harms an agent more than a person.

For it to help an agent: coverage limits must be machine-readable and say what was searched, not just "nothing"; the tool must instruct the agent to search beyond its coverage; matching must be software with measured recall; products must resolve to ingredients; and a test must show agents with the tool miss fewer real interactions than agents with search alone. Model B shows the right behaviour is possible. It is not yet reliable.

## 5. LAW AND LIABILITY

This is not legal advice.

**US.** FDA's January 2026 decision support guidance (searched) excludes software from device rules only when it supports a health professional who can independently review the basis. Patient-facing tools fail that test. A consumer or agent-for-a-person service that takes someone's list and returns flagged interactions is the riskiest use and may be a device function.

**EU.** MDCG 2019-11 rev. 1 under MDR Rule 11 (searched) lists software that flags drug interactions for a patient as medical device software, class IIa or higher. The service leans on EU sources and would plausibly be offered there.

**Practice of pharmacy or medicine.** Individual advice on a named person's regimen, especially "do not start", can approach state limits on practice. "We only quote" helps less once passages are selected for that person.

**Wrong "nothing found".** This is demonstrated, not hypothetical: green tea extract with atorvastatin (cabinet_b.yaml). The "not a finding of safety" note did not survive model E's paraphrase. A harmed consumer has a negligence argument; disclaimers carry less weight with consumers; and platform immunity is unlikely for content the service authored.

**Source licences.** Some sources, such as WHO monographs, carry copyright terms that may restrict commercial reuse. Check each.

**Safest uses.** Non-patient-specific ones: a professional reference showing regulators' text side by side; a labelling-compliance tool for manufacturers; a verifier that only checks whether a quote matches its source and makes no clinical claim. Professional-facing, transparent, non-urgent decision support comes next.

## 6. VERDICT

Change direction. Stop building a consumer or agent-for-a-person interaction service. Repackage the verification method and pipeline as a citation verifier for health AI builders, and the records as a multi-jurisdiction monograph reference for supplement regulatory teams. Add no consumer features until the test below passes.

What would change my mind: a lookup using software matching on real products, given to a model alongside search, missing fewer real interactions than search alone, with no false "nothing found".

Cheapest test: pull about 20 real labels for the three cabinets from NIH's free DSLD API, resolve them to ingredients, run a simple software matcher, generate web-only and web-plus-lookup answers, and have one pharmacist grade them blind for misses and false reassurance. In the same week, time the authoring of ashwagandha end to end. If that takes more than a week, the cost question is answered too.

## 7. WHAT THIS PACKET GETS WRONG

It buries the lead: the lookup added no detection, because web search found every planted interaction. Two of six cabinet checks can only be scored by the service; only one measures harm, and lost searching is not measured at all. Model E's misses sit outside the table. The grader helped build the records, a hidden fifth model is counted in every "of 4", and no clinician graded. The no-lookup ashwagandha answers were correct and sourced to NCCIH, yet are framed as failures against "not covered". The metformin check rewards a quote that omits part of the study. Tokens rose with the lookup for model C (562K to 950K) and E used 1.2 million, unremarked. There is no comparison with NatMed, DSLD or Health Canada's product database, no error rate for "nothing found", and the lookup files were built by AI judgment, not by the product under evaluation.
