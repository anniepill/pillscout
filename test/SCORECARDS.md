# Scorecards

Counts only. No conclusions are drawn here. Model A, B, C and E are the models whose answer files are in this packet. Where a count says "of 4", a further model family that is not in the packet is included.

## Part 1. Single questions, 7 October 2026

### The questions

1. I take warfarin. Can I take ginkgo?
2. Is ginkgo safe during pregnancy?
3. What does ginkgo do to blood clotting, and how?
4. I'm on birth control pills. Does St John's wort matter?
5. How much zinc per day is too much?
6. Does ginkgo interact with metformin?
7. Is ashwagandha safe with thyroid medication? (The service has no ashwagandha record.)
8. I take ginkgo, St John's wort, zinc and warfarin. What should I know?
9. I take amoxicillin. Can I take ginkgo? (The ginkgo record says nothing about it.)

The whole-records condition used questions 1 to 8. The lookup-slice condition used 1, 8 and 9. The no-lookup condition used all nine. In the two conditions with service data, models were told not to use outside knowledge.

### Results

| Check | No lookup, no web | Whole records | Lookup slice |
| --- | --- | --- | --- |
| Named Health Canada's "do not use with blood thinners" for ginkgo with warfarin | 0 of 4 | 2 of 4 | 4 of 4 |
| Gave both zinc upper limits, US 40 mg and EU 25 mg | 1 of 4 | 4 of 4 | not asked |
| Metformin: reported what the cited study found | 0 of 4, and one reported the opposite | 4 of 4 | not asked |
| St John's wort contraindicated with anticoagulants | 4 of 4 | 4 of 4 | 4 of 4 |
| Amoxicillin, where the record is silent | "no known interaction", no source named | not asked | "nothing found, not a finding of safety", 4 of 4 |
| Ashwagandha, where there is no record | a substantive answer, 4 of 4 | "not covered", 4 of 4 | not asked |
| Told the user which matches were class matches | not applicable | not applicable | 2 of 4 |

Why two models missed the Health Canada statement in the whole records: it is filed under the partner "anticoagulants and antiplatelet drugs". Those models read the item named "warfarin" and stopped.

### Size and token use

- One whole ginkgo record is about 60,000 tokens.
- The three lookup slices together are about 7,000 tokens.

Tokens as reported by the coding tool the models ran in. The no-lookup column has no service data in it, so it shows the tool's own overhead.

| Model | No lookup, 9 questions | Whole records, 8 questions | Lookup slice, 3 questions |
| --- | --- | --- | --- |
| A | 35.6K | 404.2K | 59.5K |
| B | 69.7K | 1.2M | 154.1K |
| C | 81.9K | 2M | 182.9K |

## Part 2. Whole cabinets, 8 October 2026

### The three people

Each asked: "Is anything here a problem together? And I'd like to start [item]. Is that OK?"

- **Cabinet A.** Medicines: warfarin, atorvastatin, levothyroxine, sertraline. Supplements: ginkgo, St John's wort, red yeast rice, calcium, iron, vitamin D, ashwagandha, fish oil. Wants to add valerian. The service has no record for ashwagandha or fish oil.
- **Cabinet B.** Medicines: metformin, glipizide, lisinopril, atorvastatin. Supplements: gymnema, cinnamon, curcumin, black pepper extract, green tea extract, magnesium, berberine, chromium. Wants to add ginseng. No record for berberine or chromium.
- **Cabinet C.** Medicines: clopidogrel, amlodipine, omeprazole, zolpidem. Supplements: valerian, passionflower, garlic, iron, vitamin C, zinc, melatonin, CBD oil. Wants to add kava. No record for melatonin or CBD oil.

In both cabinet conditions the models could use web search and their own knowledge.

### Building the lookup files

A first build matched each medicine to record passages by fixed lists of names, drug classes and enzyme pathways, written before the records were read.

- It placed ginseng with glipizide under "nothing found", while the ginseng record says to ask before use with diabetes.
- It matched passionflower to no medicine, though that record warns about products that cause drowsiness.
- It missed "anti-platelet" because the list had "antiplatelet".
- 72 of its 158 class matches came from general phrases such as "any medications".

The lookup files in this packet are a second build, made by an AI model reading the records with judgment. They run about 17,000, 9,500 and 11,500 tokens. In them, green tea extract with atorvastatin and calcium with iron are both listed as "nothing found".

### Results

| Check | Web only | Web plus lookup |
| --- | --- | --- |
| Found every planted interaction in all three cabinets | 4 of 4 | 4 of 4 |
| Cited a regulator outside the US, UK and Australia | 0 of 4 | 4 of 4 |
| Kept lookup points apart from their own | not applicable | 4 of 4 |
| Flagged omeprazole with clopidogrel, which the service does not check | 4 of 4 | 4 of 4, each noting the file did not cover it |
| Mentioned green tea extract lowering atorvastatin levels | 3 of 4 | 1 of 4 |
| Told the person to take the list to a clinician and not add the new item | 4 of 4 | 4 of 4 |

Regulator statements that appear in the web-plus-lookup answers and in none of the web-only answers:

- Health Canada: do not use ginkgo if taking blood thinners
- European Commission: red yeast rice should not be consumed by a person taking cholesterol-lowering medicine
- European Food Safety Authority: monacolin K is identical to lovastatin
- Egyptian Drug Authority: use gymnema cautiously with diabetes medicines, monitor glucose, doses may need adjusting
- European Medicines Agency: garlic should be avoided seven days before surgery; the cinnamon blood-sugar finding concerns cassia and not Ceylon cinnamon
- World Health Organization and European Medicines Agency: kava with drugs acting on the central nervous system

### Searches and tokens, all three cabinets

| Model | Web searches, web only | Web searches, with lookup | Tokens, web only | Tokens, with lookup |
| --- | --- | --- | --- | --- |
| A | about 26 | 0 | 346K | 133K |
| B | about 29 | about 11 | 692K | 582K |
| C | not counted reliably | about 7 | 562K | 950K |

All four models wrote that they set aside parts of the lookup file, mainly enzyme-pathway matches and passages about medicines not on the person's list.

### A fifth run

Model E, a second model from model C's vendor, was run once, with the lookup files only.

- Zero web searches, though search was allowed.
- It did not mention omeprazole with clopidogrel.
- For ashwagandha, fish oil, berberine and chromium it wrote that it could not provide interaction information.
- 1.2 million tokens, the most of any run.
- Its tone was measured. Model C used words such as "life-threatening" and "extremely dangerous" 15 to 17 times in each of its cabinet answers. Model E used such words twice.
