1. VALUE

For a person asking about their own supplements and medicines, a current model with web search already successfully identifies severe clinical risks. As shown in `SCORECARDS.md` and the `evidence/cabinets/web_only/` files, models without the lookup file found every planted interaction (4 of 4), caught the St. John's wort and sertraline serotonin syndrome risk, and warned against combining glipizide with multiple blood-sugar-lowering supplements.

What the service adds is verifiable regulatory provenance. Web searches return generalized medical advice ("NIH says...") or synthesize secondary sources that are hard to audit. The service provides exact, word-for-word quotes from international regulators like Health Canada and the Egyptian Drug Authority (cited 4 of 4 times with the lookup, 0 of 4 without it). It replaces probabilistic synthesis with a rigid audit trail linking every claim to a source document.

The scorecards simultaneously overstate and understate this value. They overstate the current system's capability by claiming models seamlessly set aside irrelevant enzyme matches, and they hide the fact that the automated matching failed so fundamentally that an AI had to read the records to build the cabinet lookup files manually. However, the scorecards understate the value of the underlying extraction pipeline. Catching interactions is a solved problem for web-enabled LLMs; proving mathematically that a statement matches a specific page of a European Medicines Agency PDF is not. The value is not the medical advice itself, but the proof of origin.

2. STOP OR CONTINUE

**The strongest case for stopping:**
The core product—a consumer-facing software tool for checking supplement interactions—does not actually exist yet, and the pieces that do exist are brittle. Building just 21 ingredient records took months. Expanding this to the thousands of supplements on the market is economically unscalable for a solo founder. More damningly, the automated matching layer completely failed. It missed "anti-platelet" because of a hyphen and dangerously placed ginseng with glipizide under "nothing found." A human-level AI had to intervene to build the test files (`SCORECARDS.md`). Furthermore, frontier AI models with basic web access already successfully identify all planted interactions (`evidence/cabinets/web_only/cabinet_b_and_c_model_a.md`). They do not need this tool to warn a patient about St. John's wort and warfarin. The service is attempting to solve a consumer problem that LLMs have already largely solved, using a deterministic architecture that is too brittle to survive real-world product names and arithmetic.

**The strongest case for continuing:**
LLMs are convincing but inherently unreliable. While web-search models caught the planted interactions here, they are vulnerable to SEO spam, hallucination, and shifting web results. If an AI agent is going to autonomously manage a patient's regimen or purchase supplements on their behalf, it cannot rely on scraping blog posts. It requires a deterministic, ground-truth database where every claim is directly tethered to a regulatory body. The owner has successfully built the hardest part of this: the pipeline that extracts exact text from government PDFs and strictly enforces that no statement exists without a verifiable quote. This extraction and verification engine is highly valuable. You are not continuing to build a consumer app; you are continuing to build a B2B liability-reduction engine for the next generation of health AI.

3. WHO IT IS FOR

If not a person at home, this service is best suited for two audiences: builders of health AI agents, and health systems or pharmacies.

**Builders of health apps or AI agents:**
Companies building medical AI cannot afford the liability of hallucinations. They would use the service's API to ground their models in verified regulatory truth. When their AI advises a user, it would call this library to retrieve exact constraints ("The European Commission states..."). They would pay for API access and the legal peace of mind that comes from the strict quote-matching architecture.
**What is missing:** Scale (21 ingredients is a fraction of the market), and a robust software layer to resolve chaotic commercial product names into the clean ingredient terms the database uses.

**Pharmacies and health systems:**
Pharmacists often lack comprehensive, reliable databases for herbal supplements, leading to alert fatigue or missing interactions when patients bring in a bag of alternative medicines. They would use this as a reference tool integrated into Electronic Health Records (EHRs) to evaluate patient-reported supplements alongside prescriptions. They would pay for a reliable, regulator-backed shield against malpractice claims.
**What is missing:** Full market coverage, clinician review of the records, and the ability to automatically parse a patient's existing medication list and calculate cumulative dosages (like total zinc).

**Worth more used another way:**
Yes. The extraction pipeline and the method of proving a stored statement matches its source are worth far more than the specific supplement service itself. This technology is a "verifiable truth engine." It could be repurposed for legal compliance (proving marketing materials match FDA guidelines), insurance (matching patient files to policy coverage text), or financial auditing. The owner has built a highly rigorous system for tethering data to source documents; applying this to lucrative, high-liability enterprise domains is more valuable than direct-to-consumer supplement advice.

4. AGENTS

The evidence suggests an AI agent needs a service like this significantly more than a human does. A person searching their symptoms or supplements can read a probabilistic LLM summary, follow web links, and use human judgment to decide if a source looks trustworthy.

An autonomous agent acting on a person's behalf—such as optimizing a daily regimen, ordering supplements, or adjusting dosages—cannot afford probabilistic guesses. Agents fail catastrophically when grounded in SEO spam or conflicting studies. To act safely, an agent requires structured, deterministic rules with explicit constraints, which this service provides by tethering every claim to a specific regulatory document.

For an agent to actually use this, three things must be true. First, the automated matching layer must be flawless; an agent cannot fix brittle word-list failures (like missing "anti-platelet" due to a hyphen) on the fly without risking lethal errors. Second, the service must reliably resolve real-world commercial product names to their base ingredients. Third, it must be capable of cross-product arithmetic, calculating total active dosages across a patient's entire cabinet rather than just flagging isolated ingredients.

5. LAW AND LIABILITY

*(Searched: FDA Clinical Decision Support software guidance, Practice of medicine definitions)*

**High Liability / Regulated Uses:**
Using this service to provide direct, personalized advice to a consumer based on their specific medication cabinet carries massive liability. If the service takes a patient's list and outputs a synthesized recommendation, it risks crossing into the unauthorized practice of medicine or pharmacy. Furthermore, under FDA rules, software that analyzes patient-specific information to provide specific treatment recommendations can be classified as a medical device. The highest liability comes from the "nothing found" response. As the brief shows, the automated lookup dangerously placed ginseng with glipizide under "nothing found." If a patient relies on that absence of a warning, takes the combination, and suffers harm, the service is liable. A "nothing found" result gives a false sense of medical safety, and relying on brittle software matching (missing "anti-platelet" due to a hyphen) is legally indefensible.

**Safest Uses:**
The safest use is as a Non-Device Clinical Decision Support (CDS) tool or a B2B reference library. To avoid FDA device classification, the software must allow the user (ideally a clinician) to independently review the basis of the recommendation. Providing a searchable index of regulator statements where a pharmacist inputs an ingredient and reads the raw quotes is safe. Licensing the raw data to EHR vendors—where the human clinician retains all judgment and responsibility—shields the creator. Selling the truth-extraction pipeline to other businesses is the safest path of all.

6. VERDICT

Change direction. Pivot away from a consumer-facing supplement interaction tool. The consumer space is highly regulated, fraught with "nothing found" liability, and frontier LLMs already solve the basic interaction problem adequately. Instead, pivot to licensing the core technology: the pipeline that extracts exact text from complex documents and mathematically proves a statement matches its source.

**The one result that would change my mind:**
Proving that the software can reliably map messy, real-world commercial products to exact ingredients, run the interaction matching automatically without manual AI intervention, and do it economically at scale.

**The cheapest test:**
Select five new supplements. Run the extraction pipeline to see how fast it authors records with zero manual review. Then, feed ten real-world commercial product names into the software to test if it perfectly resolves them to ingredients and outputs correct regulatory quotes without hallucination.

7. WHAT THIS PACKET GETS WRONG

The packet frames the service's reliance on non-US regulators and exact quotes as a profound advantage in safety. However, it leaves out that this is merely a proxy for safety. The fact that the models found the planted interactions without the lookup file proves the service's core premise—that people are currently flying blind without it—is false.

The brief also drastically minimizes the catastrophic failure of the automated lookup. It casually mentions the first build placed ginseng with glipizide under "nothing found" and missed "anti-platelet". In a real medical product, that is a lethal failure. By using an AI model with "judgment" to create the test lookup files, the owner tested a manual Wizard-of-Oz prototype, not the actual software. Finally, it assumes resolving real products to ingredients is just a missing feature, rather than the hardest, most legally treacherous part of the entire business.