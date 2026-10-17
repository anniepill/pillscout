# The test, October 2026

Two rounds of tests, run on 7 and 8 October 2026, asked one question: does a person at home get a better answer from an AI model with PillScout than from the same model without it? Then seven outside reviews read the results. This page shows how the tests were built and scored, so the numbers can be judged for what they are.

## Read this first

- **One run per model per condition.** No repeats. A single answer can be lucky or unlucky.
- **The lookup files were the best case for PillScout.** They were built by a model reading the records with judgment, after a software matcher failed, and the builder knew which cabinets it was building for. No software produced them. The test graded what a perfect lookup would hand a model, not a product.
- **Claude did the grading.** The same model family helped write the records, the questions and the checks. The Claude seat may be favored.
- **No pass bar was set in advance.** The decision to stop was made after reading the results, not against a number chosen beforehand.
- **The outside reviewers were models.** Four model families read a neutral packet. That is a second opinion from the same kind of system under test, not independent validation. The verdict rests on the test counts, not on the reviews.

## The models

| Model | How it ran |
|---|---|
| Grok 4.7 | Cursor agent |
| GPT 5.6 (Sol) | Cursor agent |
| Gemini 3.8 Flash | Cursor agent |
| Claude Opus | Claude Code for rounds with records; an incognito chat for the round without |
| Gemini 3.1 Pro | One extra cabinet run, lookup files only |

Every answer was asked for in two parts: ANSWER, what the model would tell the person, and RELIED ON (or SOURCES), what that answer rested on.

## Round 1: nine single questions, 7 October

Records as committed at `27ec739`. Each model answered the same consumer questions three ways.

| Condition | What the model was given | Outside knowledge |
|---|---|---|
| No PillScout | Nothing | Own knowledge, no web |
| Whole records | All 21 record files, no explanation of the fields | Records only |
| Cabinet slice | A small file holding only the passages for that question | Slice only |

The questions:

1. I take warfarin. Can I take ginkgo?
2. Is ginkgo safe during pregnancy?
3. What does ginkgo do to blood clotting, and how?
4. I'm on birth control pills. Does St John's wort matter?
5. How much zinc per day is too much?
6. Does ginkgo interact with metformin?
7. Is ashwagandha safe with thyroid medication? (No record exists. Asked on purpose.)
8. I take ginkgo, St John's wort, zinc and warfarin. What should I know?
9. I take amoxicillin. Can I take ginkgo? (The ginkgo record is silent on it. Asked on purpose.)

The whole-records condition used questions 1 to 8. The slice condition used 1, 8 and 9. The no-PillScout condition used all nine.

**How the slices were built.** Claude Code extracted them from the records by a written rule and copied every quote byte for byte. Each match carried one of four labels: the source named this drug; the passage names it but is filed under another heading; the source named a drug class and the lookup matched the drug to it; nothing found. A nothing-found match carried the line "That is not a finding of safety." One term was added to the rule knowing the answer. A slice for one question is about 3,000 tokens. One whole ginkgo record is about 60,000.

**Results.** Each cell is how many of the four models got it.

| Check | No PillScout | Whole records | Cabinet slice |
|---|---|---|---|
| Health Canada's "do not use with blood thinners" (ginkgo and warfarin) | 0 of 4 | 2 of 4 | 4 of 4 |
| Both zinc limits, US 40 mg and EU 25 mg | 1 of 4 | 4 of 4 | not asked |
| Metformin: what the cited study found | 0 of 4 | 4 of 4 | not asked |
| St John's wort contraindicated with anticoagulants | 4 of 4 | 4 of 4 | 4 of 4, with the 1 mg dose limit |
| Amoxicillin (record is silent) | "no known interaction", no source | not asked | "nothing found, not a finding of safety", 4 of 4 |
| Ashwagandha (no record) | a useful answer, 4 of 4 | "not covered", 4 of 4 | not asked |
| Named the authority behind each statement | from memory | 3 of 4 | 3 of 4 |
| Told the user which matches were class matches | n/a | n/a | 2 of 4 |

Two of four models missed the Health Canada statement in the whole records because it is filed under "anticoagulants and antiplatelet drugs" and nothing in the record links warfarin to that class. The slice made that link by hand.

**Token use, as Cursor reported it.** Whole records, eight questions: Sol 404K, Grok 1.2M, Gemini 2M. Cabinet slice, three questions: Sol 60K, Grok 154K, Gemini 183K. Opus ran outside Cursor and was not metered the same way. The three slices together are about 7,000 tokens; the answers ran from about 650 tokens (Sol) to 3,900 (Grok).

## Round 2: three cabinets, 8 October

Records as committed at `01707b1`. Three made-up people, each with four prescription medicines, six supplements the records cover, two they do not, and one item the person wants to add.

| Cabinet | Medicines | Covered supplements | Not covered | Adding |
|---|---|---|---|---|
| A | warfarin, atorvastatin, levothyroxine, sertraline | ginkgo, St John's wort, red yeast rice, calcium, iron, vitamin D | ashwagandha, fish oil | valerian |
| B | metformin, glipizide, lisinopril, atorvastatin | gymnema, cinnamon, curcumin, black pepper extract, green tea extract, magnesium | berberine, chromium | ginseng |
| C | clopidogrel, amlodipine, omeprazole, zolpidem | valerian, passionflower, garlic, iron, vitamin C, zinc | melatonin, CBD oil | kava |

Each cabinet was answered twice by each model: with web search only, then with web search plus a PillScout lookup file for that cabinet. Every item was named as an ingredient. No real product was resolved to its ingredients.

**How the lookup files were built.** The first attempt matched records to medicines on fixed word lists. It failed both ways: it filed ginseng with glipizide under "nothing found" while the record says to ask before use with diabetes medicines, matched passionflower to no medicine at all, and missed "anti-platelet" for want of a hyphen, while 72 of 158 class matches came from phrases like "any medications". The files actually used were built by a Claude model reading the records with judgment. They run about 17,000, 9,500 and 11,500 tokens. Building them also showed holes in the records: green tea extract with atorvastatin and calcium with iron both came back "nothing found" from PillScout while the web had both.

**Results.**

| Check | Web only | Web plus PillScout |
|---|---|---|
| Found every planted supplement-drug interaction | 4 of 4 | 4 of 4 |
| Cited a regulator outside the US, UK and Australia | 0 of 4 | 4 of 4 |
| Kept PillScout's points apart from its own | n/a | 4 of 4 |
| Flagged omeprazole with clopidogrel (drug-drug, which PillScout does not check) | 4 of 4 | 4 of 4, each noting the file did not cover it |
| Mentioned green tea extract lowering atorvastatin | 3 of 4 | 1 of 4 |
| Web searches run, Sol / Opus / Grok | about 26 / 27 / 29 | 0 / 10 / 11 |
| Tokens, Sol / Grok / Gemini Flash | 346K / 692K / 562K | 133K / 582K / 950K |

What PillScout added: regulator positions no web-only answer reached, quoted and attributed. Health Canada on ginkgo with blood thinners, the EU's required warning on red yeast rice, the Egyptian Drug Authority on gymnema with diabetes medicines, the EMA on garlic before surgery and on cassia against Ceylon cinnamon, the WHO and EMA on kava.

What it cost: the models searched far less once a file was in hand, and one ran no searches at all. A "nothing found" entry for green tea extract with atorvastatin suppressed a real finding three models had reached from the web. Every model reported filtering noise out of the file.

The fifth run, Gemini 3.1 Pro with the lookup files, was calm where Gemini Flash had been alarmist, but ran zero searches, never mentioned omeprazole with clopidogrel, and said it could not give information on the four uncovered supplements. It read "no record" as "nothing more to say." It also used 1.2 million tokens, the most of any run, all of it reading the lookup files.

Token figures are as Cursor reported them, one run each. Two of the three models used fewer tokens with the file than without, because they searched less. Gemini Flash used 69 percent more.

**What did not change.** The advice. In every answer, with or without PillScout, the person is told to take the list to a clinician and not to add the new item. PillScout changed who was quoted and how exactly. It did not change what the person does next.

## How answers were scored

Each check in the tables is a fact that the records hold with a quote, or a behavior the lookup file asked for. An answer passed a check if the ANSWER or RELIED ON part stated the fact, or showed the behavior, in a form the person could act on. Grading was done by Claude in one pass per round. The checks were chosen from what the records contain, so they favor the thing being tested; the outside reviewers said as much, and their corrections are below.

## Outside review, 8 October

A packet went to four model families from four vendors: a neutral brief, the scorecards above, and every raw answer file, with model names replaced by letters and no owner or product name. Three of the four had already reviewed the raw answer files alone before the brief was added, so there are seven reviews in all. Three of the seven were blind to the brief.

| Question put to the reviewers | Result |
|---|---|
| For a person at home, better than a model with web search? | No, 7 of 7 |
| Verdict on the consumer service | Stop or change direction, 7 of 7 |
| What is worth keeping | The method of proving a stored statement matches its source, 7 of 7. The 21 records, least |
| Does an AI agent need it more than a person? | Yes in principle, 7 of 7; and an incomplete tool harms an agent more, because the agent defers to it |
| Do the scorecards overstate? | Yes, 4 of 4 with the brief |
| Safest use in law | A reference a clinician reads and judges, or a tool that makes no clinical claim. Advice to a named patient is the exposed use |

What they caught in the scoring:

- The lookup files were written by a model after the software matcher failed, with the cabinets known. The tests graded an oracle, not a product.
- Two of the six cabinet checks could only be passed with the service present.
- The single-question gains were measured against models forbidden their own knowledge.
- The no-PillScout ashwagandha answers were correct and sourced, yet scored against "not covered."
- The metformin check rewarded repeating one sentence of a study whose abstract also reports effects in people with diabetes; calling one model's answer "backwards" was too harsh.
- Gemini Pro's misses sat outside the table.

Where they split: what to do with the method. An evidence layer for health apps, licensing the pipeline to other fields, a citation verifier plus a multi-country monograph reference, or nothing beyond keeping the quoted extracts as a clinician's source or as a test for models.

The reviewers also named tools the packet never compared against: NatMed Pro, Stockley's, Lexicomp, Micromedex, Drugs.com, Memorial Sloan Kettering's About Herbs, and NIH's label database for turning a product into its ingredients. Those are the reviewers' claims and were not verified.

## Product resolution probe, 15 October

October's tests named every item as an ingredient. This probe used real products, by brand name only, to see whether a model resolves a label to its ingredients before checking anything. One person, four prescriptions (warfarin, metformin, sertraline, omeprazole) and twelve supplements: a Centrum multivitamin, five multi-ingredient products (a shilajit complex with ginkgo and ginseng, a ginkgo-and-ashwagandha brain formula, two blood sugar blends with cinnamon and gymnema, a sleep blend with valerian and passionflower) and six single bottles. Together they cover all 21 records, several inside blends with ingredients the records do not cover. Three turns in one chat: can I take all of this together; I want to add Bloom Greens; how much zinc am I getting in total.

| | Claude Fable, app, web search only | Claude Fable, Cursor, 21 records plus web search |
|---|---|---|
| Resolved every brand to ingredients | yes, and said where it guessed | yes, and said where it guessed |
| Caught species traps (American vs Panax ginseng, Ceylon vs cassia cinnamon) | yes | yes, plus Passiflora caerulea vs incarnata, which the web run missed |
| Cited a regulator outside the US, UK and Australia | no | yes: Health Canada, EMA, EFSA, WHO, the Egyptian Drug Authority, each named |
| Said where a source was silent | no | every record, every medicine, with "not a finding of safety" |
| Zinc total correct (61 mg against the 40 mg UL) | yes | yes |
| Held the cabinet across three turns | yes | not run past turn 1 |
| Time and cost | about one minute, one page | 8.3 million tokens and $8.61 on one model, which did not finish; a second model spent 2.3 million more to complete the answer |
| The advice | stop St John's wort, kava and the 50 mg zinc; see the warfarin clinic | the same |

Caveats: one run each, scored by hand against the labels; the app run had seen turns 2 and 3 in advance; the Cursor run was stopped after turn 1 because of cost. The web-only run raised one point the records could not, the unmeasured vitamin K in a greens powder for a person on warfarin, because no record covers barley grass or kale.

The probe repeats October's result on a real cabinet: with the records the answer is verifiable and names its authorities; without them the person is told the same thing in a page and a minute.

## What the numbers say

Without PillScout, a current model with web search found every planted supplement-drug interaction in all three cabinets. PillScout added regulator citations from outside the US, UK and Australia that no web-only answer reached, and in return it suppressed searching, hid one real finding behind "nothing found," and never changed the advice the person received. The one clear win, four of four models landing on the same regulator statement with a checkable quote, came from a lookup file built by hand under the best possible conditions.

That is not enough to keep building a consumer product on. The project stopped on 8 October 2026.
