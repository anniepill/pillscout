# Brief: a quoted-source lookup service for supplement and medicine questions

This brief states facts. It draws no conclusions. The scorecards and the raw answer files are in this folder so that any claim here can be checked.

## What this is

An independent owner has spent about five months building a reference service for questions about dietary supplements taken alongside medicines. It is not a chatbot. It is a library plus a planned lookup layer, meant to sit behind an AI model as a tool.

- **The library.** 21 ingredient records, for example ginkgo, St John's wort, zinc, iron, kava and red yeast rice. Each record holds statements about the ingredient, and every statement carries a word-for-word quote from a named source document.
- **The sources.** Regulators and government health bodies: the European Medicines Agency's herbal committee, Health Canada, the European Food Safety Authority, the European Commission, the Egyptian Drug Authority, World Health Organization monographs, U.S. FDA drug labels and U.S. NIH pages.
- **The rule it was built on.** The service states what sources say, quoted and attributed. It does not recommend, rank or reconcile. Where two regulators differ, both are kept.
- **The lookup layer.** Given a person's list of supplements and medicines, it would return only the passages that bear on that list. Each passage would be labeled by how it matched: the source named the item, the source named a class the item belongs to, or nothing was found. It would say plainly what it has no record for. This layer is designed and not built. The lookup files in this packet are hand-built stand-ins made to test the idea.

## How it was built and what it has cost

- One person, not a software developer by training, directing AI coding tools. No team, no funding, and no legal spend so far.
- The 21 records took months, with much stopping and restarting. Most of the effort went into making stored statements provably match their source text, and into automated checks that refuse anything typed without a quote behind it.
- A pipeline exists that reads some kinds of source document and extracts text with exact positions. Whether it can now author a new ingredient from start to finish in one clean run has not been measured.

## What it does not do

- It covers 21 ingredients.
- It does not check one medicine against another.
- It does not take a product name and work out that product's ingredients and amounts. That was an original requirement and is untested here.
- It does no arithmetic across products, such as total zinc from three products against an upper limit.
- No clinician has reviewed it.

## What the owner hoped it would be

One trustworthy place where everything a person takes is weighed together correctly, from regulators' own words and not from social media or one practitioner's opinion. It was meant to be usable by a person, or by an AI agent acting for that person.

## What was tested, 7 and 8 October 2026

**Single questions.** Nine consumer questions, such as "I take warfarin. Can I take ginkgo?" Each was answered three ways:

- with nothing: the model's own knowledge, no web search
- with all 21 records in a folder and no explanation of them
- with a small lookup file holding only the passages for that question

**Whole cabinets.** Three people, each with four prescription medicines, six supplements the service covers, two it does not, and one supplement they want to add. Each cabinet was answered two ways:

- with web search only
- with web search plus a lookup file for that cabinet

The questions and the three cabinets are written out in SCORECARDS.md.

## Where the evidence is

```
evidence/single_questions/no_lookup_no_web/   answers, own knowledge only
evidence/single_questions/whole_records/      answers, given all 21 records
evidence/single_questions/lookup_slices/      the three lookup files and the answers from them
evidence/cabinets/web_only/                   answers, web search only
evidence/cabinets/lookup_files/               the three cabinet lookup files
evidence/cabinets/web_plus_lookup/            answers, web search plus the lookup file
```

Files are named by model letter. Models A, B, C and E are four different models from three vendors. The letters hide which is which.

## Caveats on the evidence

- One run per model per condition.
- The tests were designed and graded by an AI model that also helped build the records.
- The cabinet lookup files were built by an AI model reading the records with judgment, after matching on fixed word lists failed. No such matcher exists as software.
- One further model family was run and scored in every round. Its answers are left out of this packet. Where a scorecard says "of 4", that model is counted.
- Every item in every test was named as an ingredient. No real product was resolved to its ingredients.
