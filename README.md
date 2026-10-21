# PillScout

A supplement and medication safety tool, built June 2025 to October 2026 and then stopped. This repository is what I kept: the method, the test that ended it, and one runnable record.

## In four sentences

Version one was a consumer app that looked more trustworthy than it was: when it did not know a product, a model guessed, and the guess sat next to real data with nothing to tell them apart. I documented how the model drifted and rebuilt the data so that every statement is a quote from a named regulator, tied to its place in the source document, and every absence is said out loud. Then I tested the result against the alternative: the same AI models with plain web search. They found every planted interaction without it, so I stopped.

## What is here

| Page | What it is |
|---|---|
| [CASE_STUDY.md](CASE_STUDY.md) | One page: what I built, the test, what I keep |
| [TEST.md](TEST.md) | The October 2026 test, with the mechanics and the numbers so they can be judged |
| [test/](test/) | The evidence behind it: the brief, the scorecards, every raw answer, and the seven reviews |
| [HOW_IT_WAS_BUILT.md](HOW_IT_WAS_BUILT.md) | Tools, the working method, and three moments that show how I think |
| [FAILURE_MODES.md](FAILURE_MODES.md) | Ten of the fourteen ways a model drifted from the data it was given, and what we changed |
| [VERSION_ONE.md](VERSION_ONE.md) | The 2025 app and the first MCP server, with screenshots |
| [record/](record/) | One real record, its schema, a validator and 574 tests. Runs. |
| [cabinet/](cabinet/) | Two excerpts from the rebuilt server: the design, and one test with a story |

## One citation, so you can see the idea

Every statement in a record is a quote with its source. Here is ginkgo and aspirin, from the shipped record. Two sources, both the European Medicines Agency, saying different things; the record keeps them apart instead of blending them.

From the EMA monograph, section 4.5, Interactions:

> If the medicinal product is taken concomitantly with anticoagulants (e.g. phenprocoumon and warfarin) or antiplatelet drugs (e.g. clopidogrel, acetylsalicylic acid and other non-steroidal anti-inflammatory drugs), their effect may be influenced.

From the EMA assessment report that sits behind that monograph, section 4.1.1:

> Wolf (2006) suggests that coadministration of aspirin and EGb 761 to 50 healthy male volunteers (20-44 years) in a double-blind, double-dummy study did not prolong coagulation parameters, including bleeding time and agonist-induced platelet aggregation, compared to aspirin alone.

The first is labeled a class effect from a regulator assessment. The second is labeled a controlled study with a null finding. The record says nothing about whether you should take the two together. It states; the reader, or the model reading on their behalf, reasons.

## How a record was made and checked

- Every source is free to read. EMA monographs and assessment reports, Health Canada monographs, FDA labels, WHO monographs, NIH fact sheets: documents anyone can open without a subscription. They were held locally and read by code, not by a browser.
- A model drafted each record. I ruled on every question about what counts as a source and what a quote may carry. Code enforced the rulings on every commit.
- Each quote was checked against the bytes of the source document. Quotes that could not be matched were labeled, never adjusted.
- A gate required that every sentence in an FDA label naming the ingredient be either quoted or explicitly excluded, so silence in a record means the source was read and said nothing.
- Where a record has no answer, the record says so, with a reason. Nothing found is never written as safe.

At the end: 21 ingredients, 745 citations from ten regulators and public bodies, about 3,500 tests, nine checks that ran in CI.

## How it was tested, and what was decided

In October 2026 four models answered the same questions with and without the records: nine single questions, then three full medicine cabinets. With web search alone, every model found every planted interaction. With the records added, they cited regulators outside the US that no web answer reached, and gave the same advice. Seven outside reads of the raw answers agreed it was not better for a person at home. The project stopped on 8 October 2026. [TEST.md](TEST.md) has the mechanics.

## Run the record

Needs Node 22.12 or later.

```
cd record
npm ci
npm test
npm run validate -- ingredients/records/ginkgo.yaml
```

The tests check the schema and the record's shape; the validator checks the record against 28 schemas and reports one expected warning. The record is the full ginkgo record with its authoring machinery removed for publication; no quote and no label was changed. One thing it cannot do here: the quotes are anchored to byte positions in source documents that are not in this repository, so the anchors are checked for shape, not resolved. Verifying a quote against its source means opening the named document at the named section.

## What is not here

The full corpus and the server are private. Left out: the other 20 records, the held regulator documents (108 MB of PDFs), the extraction and anchoring pipeline, the working ledgers, and the server code. If you want to go deeper, ask.
