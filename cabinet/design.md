Excerpt from the cabinet design document, September 2026. The full document is private. The design assumes a person may not tell their doctor everything they take; the product's answer was never to stand in for the doctor, but to make the list worth taking to one.

## What PillScout is

PillScout is the cabinet — the structured, persistent, honest record of what is in a human's body — exposed as MCP, designed to be the canonical layer that any agent reads from when it needs to know what someone takes.

It is not a product the user opens. It is a layer their LLM consults.

The user lives in their LLM (Claude, ChatGPT, a future agent). PillScout lives behind an MCP connection their LLM holds. The cabinet persists across sessions. The user never signs into PillScout, never sees a PillScout dashboard, never manages a PillScout account. They talk to their LLM. Their LLM reads and writes the cabinet.

### What PillScout is for

- The user who has questions every day about what they take and wants their LLM to actually know.
- The caregiver managing a parent's stack who needs a structured place to hold it that they can ask questions against.
- The honest user who tells their LLM things they don't tell their doctor and wants those things in the structured picture too.
- The other agent (a biometric MCP server, a future doctor-facing agent, a future research aggregator) that needs the cabinet as input to its own reasoning.

### What PillScout is not

- A safety engine. It does not flag dangers, run interaction matrices, or apply Beers Criteria. The LLM does that reasoning.
- A clinical decision support tool. No thresholds. No "this is dangerous." No advice.
- A consumer wellness app. No StackScores, no goal-based stack recommendations, no biohacker optimization.
- A symptom checker, scheduling engine, or pill reminder.
- A destination. There is no PillScout app the user opens.
- A Medication Action Plan generator. PillScout does not produce MAPs, deprescribing recommendations, or any clinical action output. The LLM (and, downstream, the human clinician reading the LLM's output) generates the plan. PillScout produces the structured input the plan is built from. This is the same line drawn elsewhere in this document: opinions about facts, not opinions about people. MAP generation is reasoning. Reasoning happens upstream of PillScout, never inside it.

### The positioning sentence

> PillScout is the cabinet — across pills, supplements, OTC, compounds, and the things you don't tell your doctor — that any LLM can read.

### The architectural principle: the LLM stays upstream

PillScout never calls an LLM. The LLM stays upstream — gathering messy human input, resolving products into structured proposals, asking the user clarifying questions, doing the reasoning. PillScout's job begins when the LLM hands it a structured proposal and ends when it returns a structured response. Validate, normalize, persist, compute. Deterministically.

This isolation is what makes PillScout stable across LLM provider changes, model updates, and shifts in reasoning behavior. The LLM ecosystem will evolve quickly. The cabinet should not have to evolve with it.

PillScout does not maintain a supplement or medication database. Resolution of a product into structured ingredients is performed by the LLM at the moment of entry, using whatever live sources it can reach — manufacturer sites, retailer labels, government databases when relevant and current, openFDA/RxNorm for prescriptions, image-based extraction from bottle photos. PillScout accepts the structured result, validates against the schema, applies elemental conversions deterministically, tags verification status, and caches the result so subsequent users adding the same product benefit from prior resolution work. The cache is a quiet community asset; it is not curated content PillScout maintains.

### Why the LLM uses PillScout

The forcing function for tool use is **persistence**. The LLM has no memory across sessions. PillScout does. Without PillScout, the LLM has to re-elicit a user's full stack at the start of every conversation — and users won't repeat themselves, so the picture stays incomplete. With PillScout, the LLM reads the cabinet once, has the structured truth, and answers well. "Better answers" alone is a weak forcing function. Persistence across sessions is a strong one.

This also implies that PillScout's value compounds with use. The first time a user adds their stack, the cost is high (LLM has to resolve everything). Every subsequent conversation benefits — same cabinet, no re-elicitation. The longer a user maintains a cabinet, the more painful it becomes to use an LLM without it.

---

## The engine framing

PillScout is not a database with an MCP wrapper. It is a deterministic engine that turns whatever an LLM hands it into structured truth about substances, using compiled domain knowledge and class-aware transformation rules. The MCP protocol is how the engine is reached today. The engine itself is what makes the reach worthwhile.

This framing matters because it names what is actually proprietary about PillScout. Anyone can build an MCP server. Anyone can build a substance database. The engine is the integrated combination of five deterministic transformations, applied against four hand-curated reference documents, exposed through a structured tool surface. None of those pieces individually are proprietary. The integration is.

### What the engine does

The engine performs five deterministic transformations on every cabinet item, in order:

1. **Typology classification.** Take the LLM's proposed item and classify it against the substance class typology (prescription, OTC, dietary supplement, compounded medication, hormone preparation, herbal, probiotic, medical food, lifestyle substance, investigational, homeopathic). Class determines downstream handling.

2. **Vocabulary canonicalization.** Map the LLM's proposed ingredient names against the controlled vocabulary. Aliases collapse to canonical names. Two users adding the same product through different LLM phrasings get identical canonical structure.

3. **Elemental conversion.** Apply the cited elemental conversion table to produce elemental amounts where applicable (mineral salts, certain vitamins). The conversion table is hand-curated, primary-source-cited, and class-aware.

4. **Verification tagging.** Apply class-specific verification rules to determine the verification level (user_verified, authoritative_source, inferred, pending). The level reflects the resolution path against the verification rules per class, not the LLM's self-reported confidence.

5. **Aggregation with provenance.** Total elemental amounts across items, surface overlaps across forms, expose gaps explicitly. Deterministic math producing a structured aggregate the LLM consumes.

Each of these is bounded, deterministic, and citable. The engine has opinions about facts (this form converts to that amount; this class requires this verification source). The engine does not have opinions about people (this is dangerous; this is too much; this is recommended). The first is reference knowledge. The second is reasoning. The LLM does the reasoning. The engine makes the reasoning trustworthy by giving it a structured input no other tool can produce.

### What composes the engine

The engine is the runtime composition of:

- **The five transformations** above, implemented as deterministic code in the Resolver and Aggregator modules.
- **Four reference documents** held in `domain-references/` and treated as load-bearing intellectual property:
  - **Substance class typology reference.** Defines the classes, their regulatory definitions with primary-source citations, characteristic features, authoritative sources per class, and reliability assessments.
  - **Elemental conversion reference.** Hand-curated table mapping form to percent elemental for the substances where conversion matters, with primary-source citations and confidence notes.
  - **Ingredient vocabulary reference.** Canonical names with aliases, class assignments, naming considerations, and primary-source citations for canonical name selection.
  - **Verification rules by substance class reference.** What counts as authoritative for each class, what counts as inferred, what's required for user-verified, what's commonly pending, with class-specific caveats.
- **The cabinet schema** that holds the engine's outputs persistently.
- **A surface layer** that exposes the engine to consuming clients.

Each reference document is built through a multi-model adversarial review process (draft, structural review, cross-model adversarial pass, reconciliation, citation verification) before commit. The MDs are not auxiliary documentation. They are the engine's compiled domain knowledge.

### Surfaces

The engine is reached today through MCP. CLI is deferred as a secondary surface for developer evaluation. HTTP API is an open question for v2, driven by demonstrated integration demand from healthcare-adjacent systems that don't speak MCP.

The engine itself is protocol-agnostic. Surfaces are thin wrappers around the same five transformations and the same compiled domain knowledge. The engine logic does not live in surface handlers; it lives in engine modules that surface handlers call. This discipline is load-bearing: putting business logic in MCP handlers means duplicating it when CLI lands; putting it in the engine means CLI is wrapping work, not rebuilding work.

The discipline rule for the build: implement the Resolver, the Aggregator, and the cabinet operations as engine libraries with clean function signatures. The MCP tools are thin handlers that call those functions. Future surfaces (CLI, HTTP API, protocols not yet invented) consume the same engine the same way.

### Outputs: structured for selective consumption

The engine returns structured truth in named, independently-readable sections. A composite engine response (when the consuming client wants the full picture in one call) includes cabinet summary, totals by substance, item-level provenance, gaps, intent breakdown, verification breakdown — each as a separate named field, not interleaved prose.

The consuming LLM picks the sections it needs for the question being asked. The engine does not pre-filter, pre-format, or pre-decide which sections matter. That's reasoning, and the LLM does the reasoning.

This pattern serves two cases:

- **Granular reads.** The LLM calls a focused tool (`get_totals`, `get_cabinet_summary`) when it knows exactly what it needs. Cheap, low-token, easy to reason about.
- **Composite reads.** The LLM (or, more often, an agent in a multi-skill stack) calls a single composite tool when it needs the full picture in one call. Returns all sections every time, structured by named field. The LLM consumes selectively.

Both shapes ship in v1. The granular tools are the primary surface; the composite tool serves the agent-in-stack case where round-trip count matters more than payload size.

### What the engine does not do

The engine framing does not relax the architectural principles in the rest of this document. It clarifies them.

- The engine does not call LLMs. The LLM stays upstream and does all reasoning. The engine validates, transforms, and persists deterministically.
- The engine does not run safety analysis, interaction matrices, Beers Criteria, burden scales, or any clinical decision support. Those are reasoning tasks. The engine surfaces structured facts that make reasoning easier; it does not perform reasoning.
- The engine does not categorize substances by goal, stack-fit, safety profile, or any other interpretive category. Class assignment is regulatory and structural, not interpretive.
- The engine does not learn about users. Personalization happens in the LLM. The engine holds the truth.

The line between "engine has opinions about facts" and "engine has opinions about people" is the same upstream-LLM line drawn elsewhere in this document. The engine framing does not move the line. It names what's on the engine's side of it.

The line between fact and reasoning also governs how the engine handles manufacturer-published product information. The engine stores manufacturer-stated administration instructions and Tier 1 label warnings as structured fields on the cabinet item, with provenance back to the resolution event. These are facts the manufacturer published about the product. The engine does not store full adverse event lists (the LLM can pull the live label when needed and the cabinet would bloat without value), and the engine does not store interaction-specific risk assessments (that is reasoning, and the LLM does it). The same principle applies: the engine has opinions about facts the manufacturer printed on the label. The engine has no opinions about whether those facts apply to a specific person at a specific moment. That is the LLM's job.

### Implications for the build

- The four reference documents are core IP. They live in the repo at `domain-references/`, are version-controlled, and follow the same review discipline as code. Updates require the same multi-model review pattern as initial drafts.
- The five transformations are implemented as deterministic, well-tested modules with property-based tests on the math layer. The transformations are the engine's behavior; tests prove the engine does what it claims.
- The engine is implemented as a library that surface layers consume. Engine logic does not live in MCP handlers, CLI commands, or HTTP route handlers. Surface handlers are thin wrappers.
- Build sequence is vertical (tracer-bullet style) within the engine, not horizontal layer-by-layer. Each tracer extends the engine end-to-end with a new capability. The first tracer is the smallest end-to-end engine that runs.
- Public positioning at the discovery surface (MCP directories, README, developer documentation) names the engine explicitly. PillScout is positioned as the deterministic substance engine, not as a database with tools.
- Marketing claims must match what's shipped. The engine framing is the destination and the architectural truth; it is not a license to overclaim what exists in v1.

The engine framing does not change what we are building. It clarifies what we are building, why it is hard to copy, and how to talk about it.
