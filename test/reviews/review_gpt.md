# 1) VALUE (250 words max)

The service’s real added value is not “knowing more facts” than a strong web-enabled model; it is **forcing evidence-bounded behavior**: explicit source-grounding, explicit “nothing found is not safety,” and explicit separation of direct match vs class match. That behavior shows up in lookup-slice outputs and lookup YAMLs (`evidence/single_questions/lookup_slices/model_a.md`, `model_b.md`, `model_c.md`, `q1.yaml`, `q2.yaml`, `q3.yaml`).

On raw interaction knowledge, web-only baselines already found all planted cabinet interactions across models (`SCORECARDS.md`; `evidence/cabinets/web_only/*`). So for many common questions, a current model with web search can reach similar clinical flags.

Where your packet shows incremental value: (a) reduced false confidence on missing coverage (ashwagandha, amoxicillin-silence) in single-question tests (`evidence/single_questions/no_lookup_no_web/*` vs `whole_records/*` and `lookup_slices/*`), (b) inclusion of non-US regulator language absent in web-only runs (`SCORECARDS.md`; `evidence/cabinets/web_plus_lookup/*`), and (c) clearer provenance chains for each claim in some outputs (`evidence/cabinets/web_plus_lookup/model_a.md`, `model_b.md`).

Bottom line: this is a **trust-and-audit layer** more than a capability moat.

Do scorecards overstate or understate? Mostly **overstate**. They emphasize favorable contrasts (including no-web baselines), one run per model, and hand-built lookup files; they under-emphasize that the key retrieval/matching step is not yet software (`BRIEF.md`, `SCORECARDS.md`). They modestly understate one thing: explicit uncertainty handling is genuinely better than typical chatbot prose.

# 2) STOP OR CONTINUE (300 words max)

**Strongest case for stopping**

The core promise (“one place where everything a person takes is weighed together correctly”) is not delivered. Untested or missing: product-to-ingredient resolution, dose aggregation across products, software matching, and measured authoring cost for a new ingredient (`BRIEF.md`). The lookup step used in cabinet tests was manually/LLM-curated after deterministic matching failed (`SCORECARDS.md`), which means your current best result is artisanal, not operational. Meanwhile, incumbents already exist for drug-supplement checking (NatMed/NatMed Pro, Lexicomp, Medscape/WebMD classes of tools) and are broader by default. Regulatory/liability burden rises quickly if you move from citation library to personalized advice. If “nothing found” is wrong, the liability event is exactly where your differentiator claims safety posture. Given solo execution, no legal budget, and high maintenance burden per ingredient, this can become a permanent curation treadmill with weak commercial defensibility.

**Strongest case for continuing**

You did build something nontrivial: a source-verifiable evidence substrate with quote-level traceability and conflict-preserving representation (`BRIEF.md`; `evidence/cabinets/lookup_files/*.yaml`). In tests, this materially changed model behavior in the desired direction: better citation specificity, fewer invented certainty statements on out-of-scope items, and clearer uncertainty framing (`evidence/single_questions/*`, `evidence/cabinets/web_plus_lookup/*`). That is valuable infrastructure for any safety-sensitive AI stack. If repositioned away from direct-to-consumer “decider” and toward an auditable evidence API/tooling layer for professionals or regulated builders, the current asset could compound rather than collapse.

# 3) WHO IT IS FOR (350 words max)

Not strongest as a home-user standalone service today. Two more plausible customers:

**A) Builders of health apps / AI agents**

What they would use: your structured records + provenance model (statement, verbatim quote, source identity, match type, “nothing found” semantics), delivered as a retrieval API and policy layer (`evidence/cabinets/lookup_files/*.yaml`, `evidence/single_questions/lookup_slices/*.yaml`).

What they would pay for: (1) auditable evidence traces per claim, (2) deterministic uncertainty outputs, (3) licensing access to curated interaction records, (4) update feeds/change logs.

What is missing: production-grade automated matcher, quality benchmarks on real product labels, ingredient normalization pipeline at scale, and SLAs on freshness/correction turnaround (`BRIEF.md`, `SCORECARDS.md`).

**B) Pharmacy / health-system medication safety teams**

What they would use: a clinician-facing supplement-medication evidence companion for pharmacist review, counseling scripts, and quality/safety committees. Value is not “replace DDI systems,” but supplement-specific citation depth and cross-jurisdiction regulator statements (`evidence/cabinets/web_plus_lookup/model_a.md`, `model_b.md`).

What they would pay for: per-seat knowledge tooling, API into med-reconciliation workflows, and compliance-grade evidence exports for documentation.

What is missing: integration with existing med lists/EHR workflows, formal editorial governance, legal/regulatory positioning, and demonstrated inter-rater reliability against pharmacist review.

**Is part of what’s built worth more used another way?**

Yes. The most valuable asset appears to be the **provenance architecture** (quote-linked assertions with explicit scope and uncertainty), not the current end-user service wrapper. Repackage it as:
1) evidence infrastructure for other clinical or consumer products, or  
2) a “trust layer” that constrains model outputs in high-risk health UX.  

As designed (direct person-facing “is this safe together?”), it inherits hardest liability and workflow burdens before proving automation economics.

# 4) AGENTS (200 words max)

Evidence here suggests agents need this **more** than people do—but only after key conditions are true.

Why more: people can ask follow-ups and detect nonsense contextually; agents executing tasks need hard guardrails against hallucinated certainty. Your strongest contribution is exactly that guardrail style: explicit scope boundaries, class-vs-named match labels, and explicit unknowns (`evidence/single_questions/lookup_slices/*.yaml`, `model_*.md`).

What would have to be true:
1) automated product-to-ingredient resolution with measured error rates,  
2) reliable software matching (not manual synthesis),  
3) dosage/totals arithmetic across products,  
4) versioned evidence updates and rollback,  
5) strict “cannot conclude safety” defaults when coverage is incomplete, and  
6) human escalation pathways.

Without those, an agent can misuse partial evidence faster than a person. Right now, the packet supports “agent-consumable evidence snippets,” not “agent-safe autonomous action.”

# 5) LAW AND LIABILITY (250 words max)

Not legal advice.

Highest-risk uses are those that look like individualized treatment decisions for patients (“take/stop/add this now”), especially if automated. In US framing, software may avoid device status only under narrow CDS conditions (HCP-facing support + independent review basis); patient-facing prescriptive recommendations are more likely to trigger device analysis and/or enforcement attention. In EU framing, patient-specific software that informs therapeutic decisions or interaction alerts is commonly in medical-device-software scope (Rule 11 style logic).

Separate from device rules: state unauthorized-practice risk appears when software effectively performs medical/pharmacy judgment without licensed oversight. “Nothing found” errors create failure-to-warn and negligence exposure; disclaimers help less than controlled behavior.

Safest uses:
1) reference/evidence tool for licensed professionals,  
2) clearly advisory outputs with visible source basis,  
3) strict non-coverage flags, and  
4) no autonomous treatment directives.

Web searches run for this section included:  
- “FDA Clinical Decision Support Software guidance non-device CDS 21st Century Cures Act final guidance”  
- “FDA software as a medical device medication dosing interaction checker regulatory examples”  
- “EU MDR clinical decision support software medication interactions regulation”  
- “unauthorized practice of medicine software personalized treatment recommendations state law”  
- “FTC dietary supplement claims substantiation warnings false or misleading health claims”

# 6) VERDICT (150 words max)

**Change direction.**

Do not continue as a direct-to-consumer “is this safe together?” service in current form. Pivot to an evidence infrastructure product: auditable supplement-medication interaction records + retrieval constraints + provenance exports for licensed workflows and health-app builders.

One result that would change my mind: an end-to-end automated pilot on real products showing materially better safety-relevant performance than strong web-enabled models **and** acceptable unit economics.

Cheapest decisive test: a narrow 6-week pilot on one therapeutic area and ~150 real product labels. Measure:  
1) ingredient resolution accuracy,  
2) software match precision/recall,  
3) dose-total calculations across products,  
4) false-negative rate on known interactions, and  
5) cost/time to author one new ingredient record.  

Those are exactly the currently untested points flagged in your packet (`BRIEF.md`).

# 7) WHAT THIS PACKET GETS WRONG (150 words max)

It frames gains as product readiness when they are mostly prototype behavior gains under curated conditions.

Key omissions/favorable framing:
- benchmark design leans favorable (single runs, curated scenarios, one omitted model family output, grader with builder overlap; `SCORECARDS.md`),  
- no direct test of the hardest user reality: branded product resolution + cross-product dose arithmetic (`BRIEF.md`),  
- manual/LLM lookup construction is presented near software output, though software matching failed first (`SCORECARDS.md`),  
- incumbent landscape and switching barriers are largely absent,  
- maintenance economics (update burden, correction SLAs, legal review overhead) are not quantified.

It also mixes two propositions: “evidence substrate quality” and “consumer-safe decision service.” The first has promising signal; the second is not yet demonstrated.
