# How it was built

I am not a developer. PillScout was built over sixteen months by directing AI models, checking their work, and ruling on what the product should and should not do.

## Tools

- **Claude (chat)**: the senior engineer. Formed opinions, wrote specs, drafted every prompt that touched a repo.
- **Claude Code (Opus)**: the executor. Reads, code, record edits, ledger entries. Halted before every commit; I pushed from Terminal.
- **Cursor**: for other models when an outside read was the point. Grok for cold reads of new code, Codex for checking code against its spec, ChatGPT and Gemini as seats in cross-model review.
- **Stack**: TypeScript, Zod, YAML records, vitest, GitHub Actions. At the end: 21 records, 745 citations, about 3,500 tests, nine CI gates.

## The relay

Claude drafted a prompt. I read it, pasted it, read what came back. The executor halted before each commit and printed what it had counted. I pushed when the counts matched what the prompt predicted.

Every prompt carried its own checks: count the thing being changed in the committed repo before editing, state what the count should be after, count again. When the numbers disagreed with the prompt, the prompt was wrong, and we said so before anything landed.

## Rules that held

- An agent's report that work is done is not evidence. The committed repo is.
- Model agreement is not verification. When two passes disagreed about a quote, printing the bytes settled it.
- A feature earned its place only if the model could not supply it already. The test was "does Claude already know this from training?" If yes, PillScout did not build it.

## Three moments

**The parser, not the corpus.** A checker flagged 184 quotes as not matching their sources. We classified every finding before fixing anything. 150 were the checker misreading PDFs: two-column pages read across the gutter, HTML entities left undecoded, a font rendering the micro sign as "lg". Thirty-four went to a human read. Seven could never be matched and were labeled a permanent ceiling rather than quietly adjusted. Separate tool faults from data faults before fixing either.

**The human grades first.** The records held thousands of single words the rules could not classify. I graded fifty blind. Two model readers were then scored against me: 31 and 36 of 50, agreeing with each other on 33. Each gave the same answer twice in a row almost every time, so their errors were stable and a second run would not find them. Ruling: a model may flag an item for a human; it may never promote one. The next day I asked how good a model is at rewriting a sentence, and we tested it under one rule: it may delete words, never add or reorder them, so every output is checkable by string match. It got six of six negations and eleven of twelve graded items. Nothing from it was stored. The model proposes; the code confirms.

**Testing against the alternative.** In October 2026 I asked whether a person at home gets a better answer from a model with PillScout than from the same model with web search. Four models, nine questions, three full medicine cabinets. Web search found every planted interaction. PillScout added regulator citations no web answer reached, and it never changed the advice. Seven outside reviews agreed. I stopped. TEST.md has the mechanics.

## What I would do differently

Build the verification ladder up to fuzzy matching plus a judge model first, measure how often exact bytes would have changed an answer, then decide whether byte-level anchoring earns its cost. I built the strictest rung first because the first fabricated quote I found, a Health Canada warning that did not exist, frightened me into it. Reasonable, and expensive.
