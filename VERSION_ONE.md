# Version one, 2025 to 2026

The first PillScout was a consumer web app. Built June 2025 to April 2026 in Cursor, about 1,100 commits, live at pillscout.health until October 2026.

## What it was

- One cabinet for everything a person takes: prescriptions, over-the-counter drugs, supplements, herbs, compounded medicines, the things people forget to mention.
- Scout, an owl mascot with a scripted guided setup that walked a new user through the cabinet by category and asked about the occasional items.
- My Cabinet: items grouped by type, expand for detail, print and export, a callout for medicines that need extra care after 65.
- Supplement Totals: every vitamin and mineral added up across every bottle, units converted, each total set beside its Daily Value and upper limit, with stacking warnings.
- Interaction Checker: every pair of items checked against hand-written tables, with a card showing severity, mechanism, what to watch for and a source. It knew that the aspirin hidden in Pepto-Bismol or Bengay matters to someone on warfarin.
- A Data Sources page that said in plain words that the engine was simple pattern matching on hard-coded lists, and an empty state that said finding nothing does not mean safe.

## How it was built

- Frontend: Next.js and React with Tailwind, deployed as a static site on Netlify.
- Backend: an Express server on Node, deployed on Railway, with a Postgres database for the product cache.
- Lookups: NIH RxNorm, openFDA, DailyMed and the NIH Dietary Supplement Label Database for products the local tables knew; the Gemini API for the ones they did not.
- Deploying two halves separately, pointing a domain at them and keeping them talking was most of what I learned about infrastructure.

## What was wrong with it

- Products the tables did not know were filled in by a language model from memory, with no search and no label behind it, and shown beside curated data with nothing to say it was a guess.
- The interaction tables matched substrings, so wording decided the answer: a brand word fired on every product from that brand, a missing name meant silence.
- Of 48 explanation cards, 23 had no source, and the 25 that did linked to journal and agency homepages, not to the claim.
- The app looked sourced and was not, and a user could not tell curated answers from estimated ones. Closing that gap is what the corpus and the server were for.

## The first MCP server

- March 2026: an MCP server was added to the same repo so Claude could use the cabinet directly, and the landing page became the MCP beta.
- It worked. Claude read and wrote the cabinet, remembered it from one chat to the next, took a second cabinet and answered questions about it. The bet was that a stronger model than the app's Gemini lookup, reading the same cabinet, would get the answers right.
- What did not hold was the model's behavior. It inferred a dose from a product name, invented a per-capsule number the server never returned, gave warfarin advice on top of that number, and narrated a thin scan as a complete one. Each time, the first fix was another paragraph in the server instructions, and each time the model followed the paragraph for a while and then drifted. I rewrote those instructions more times than I can count.
- The conclusion, from the April and May testing, is the whole of FAILURE_MODES.md: instructions constrain what the data shape already supports and nothing else. A field that says `per_capsule_breakdown: null` holds; a sentence telling the model not to divide does not.
- The rebuilt server, designed around that conclusion, is in `cabinet/`.

## Captures

Seven phone screenshots, taken 17 October 2026 before shutdown, are in `captures/`: the cabinet, a product's label panel, Scout's menu, the symptom check, the Interaction Checker, and Supplement Totals. The app was built for a phone, so that is how it is shown.

A three-minute screen recording of the full flow (guided setup, the cabinet, Supplement Totals, the Interaction Checker) is attached to this repository's first release, at full resolution.

One moment in the recording is kept on purpose. The vitamin B3 card in Supplement Totals shows a Daily Value percentage that is wrong. It stays, with this caption, because it is a fair picture of version one: the shape was right and the numbers could not always be trusted.
