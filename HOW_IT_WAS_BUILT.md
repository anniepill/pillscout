# How it was built

I am not a developer and I am not a clinician. PillScout was built over sixteen months by directing AI models, checking their work, and ruling on what the product should and should not do. Three seats did the work.

## The seats

- **Product and user: me.** What the product does and does not do, what counts as a source, where a record stops, when to stop building. I was also the user: the cabinet was built for someone like me, and I tested it as one.
- **Engineering: Claude.** In chat, the senior engineer: formed opinions, wrote specs, drafted every prompt that touched a repo. In Claude Code, the executor: reads, code, record edits, ledger entries, halting before every commit. I pushed from Terminal.
- **Clinical: four models together.** No single model made a clinical decision. ChatGPT, Grok, Gemini and Claude, the best available at the time of each question, read every proposal cold and argued it: field names, what counts as a contraindication, how an adverse event is worded, how a record is laid out. A decision was locked only when three or four of four converged, and the disagreements were written down. Before any naming question went to them, we looked up the convention the field already uses: drug-interaction ontologies, MedDRA for adverse-event wording, FDA labeling structure for interaction direction, the ordering Lexicomp and Micromedex use. Grok also read new rule modules cold, as the hostile reviewer, from September on, and a pharmacist-review check, a model reading each record the way a dispensing pharmacist would, ran as part of review and was due for a rewrite when the project stopped.

Stack: TypeScript, Zod, YAML records, vitest, GitHub Actions. At the end, in the private repositories: 21 records, 745 citations, about 3,500 tests, nine CI gates.

## The relay

Claude drafted a prompt. I read it, pasted it, read what came back. The executor halted before each commit and printed what it had counted. I pushed when the counts matched what the prompt predicted.

Every prompt carried its own checks: count the thing being changed in the committed repo before editing, state what the count should be after, count again. When the numbers disagreed with the prompt, the prompt was wrong, and we said so before anything landed.

## Rules that held

- The corpus states; the model reasons; the user decides. Nothing in a record interprets, recommends, or says what a clinician would say. It quotes what regulators said, keeps their positions apart, and tells the reader to take the list to a pharmacist or doctor. This was the rule I had to defend most often. Every model, every few weeks, wanted to add a severity scale, a critical-moderate-minor rating, a recommendation, an opinion. The answer was always no: if a regulator did not say it, the record does not say it.
- Free sources only. Every quote comes from a document anyone can open without paying: EMA monographs, Health Canada monographs, FDA labels, WHO monographs, NIH fact sheets. The tiers that define what counts as a regulator, a primary study, or a reference existed to draw that line. The point of the whole thing was that safety information a person could trust should be in one place and free, not behind a subscription database.
- No clinical decision by one model. Vocabulary, record structure and doctrine went to the four-model cluster, after a lookup of the field's existing convention.
- An agent's report that work is done is not evidence. The committed repo is.
- Model agreement is not verification. When two passes disagreed about a quote, printing the bytes settled it.
- A feature earned its place only if the model could not supply it already. The test was "does Claude already know this from training?" If yes, PillScout did not build it.

## Three moments

**The parser, not the corpus.** A checker flagged 184 quotes as not matching their sources. We classified every finding before fixing anything. 150 were the checker misreading PDFs: two-column pages read across the gutter, HTML entities left undecoded, a font rendering the micro sign as "lg". Thirty-four went to a human read. Seven could never be matched and were labeled a permanent ceiling rather than quietly adjusted. Separate tool faults from data faults before fixing either.

**Earning the right to take the human out.** The goal from the start was a system that reads, writes and checks itself, with me in it only where a machine could not yet be trusted. So when the records held thousands of single words the rules could not classify, the question was not "should a person grade these" but "can a model be trusted to." To find out, I graded fifty blind, once, and two model readers were scored against me: 31 and 36 of 50, agreeing with each other on 33. Each gave the same answer twice in a row almost every time, so their errors were stable and a second run would not catch them. Not yet trustworthy, so the ruling was: a model may flag an item for review; it may not promote one until a reader agrees with two human graders on 95 of 100. The next day I asked how good a model is at rewriting a sentence, and we tested it under one rule: it may delete words, never add or reorder them, so code can check every output by string match. Six of six negations, eleven of twelve graded items. That is the shape I wanted everything to have: the model proposes, the code confirms, and the human steps out once the numbers say so.

**Testing against the alternative.** In October 2026 I asked whether a person at home gets a better answer from a model with PillScout than from the same model with web search. Four models, nine questions, three full medicine cabinets. Web search found every planted interaction. PillScout added regulator citations no web answer reached, and it never changed the advice. Seven outside reviews agreed. I stopped. TEST.md has the mechanics.

## What I would do differently

Build the verification ladder up to fuzzy matching plus a judge model first, measure how often exact bytes would have changed an answer, then decide whether byte-level anchoring earns its cost. I built the strictest rung first because the first fabricated quote I found was a Health Canada warning that did not exist, and in health you cannot afford to be wrong once. The reasoning was sound. The cost was most of a year.

And test the assumption underneath the bet. I knew the models were getting better. What I believed was that a structured, tagged corpus would beat them on cost and precedence even when they could reach the right answer: that a model would read it faster, favor it, and spend fewer tokens. That belief could have been tested in an afternoon on five records, and it was not. I was building on my own time to learn; with someone else's money on it, that test comes first.
