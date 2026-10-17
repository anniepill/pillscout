import { z } from 'zod';

// source_position vocabulary: a source's own stance
//
// Carries a source's own terminal determination, attributed to it. Any roster
// source may carry it where it speaks in its own voice in stop-grade printed
// words (the speaker rule); it once read "a regulator's", and a statement a
// source relays from another body is marked attributed, not stamped.
// Attribution is anchored by the citation's existing section/document_id
// fields; it is the source_section that makes this attribution, not
// corpus-author judgment.
//
// Grounding anchors:
//   EMA SmPC  §4.3  → contraindicated
//             §4.4  → special warnings and precautions for use
//             §4.6  → fertility, pregnancy and lactation
//   FDA 21 CFR 201.57 §§ 4, 5, 8.1
//   Health Canada Product Monograph Part I
//
// AMENDED. The EMA lines once named use_with_caution for 4.4 and
// not_recommended for 4.6 and nothing else, a one-value-per-section
// roster that is too narrow against the instruments the corpus now holds. The
// EU herbal monograph template's 4.4 prints "is not recommended" in its own
// standard statement and its 4.2 carries the same under-18 sentence; the
// monographs print all three verbs in 4.5. WHICH VALUES EACH SECTION ADMITS
// IS NOT THIS FILE'S QUESTION and is stated per section in
// schema/defined-terms/registry.ts. What stays here is the grounding: which
// instrument defines the term at all. The three FDA and Health Canada
// anchors are unchanged.
//
// Landing rule: field lands ONLY on citations where the determination
// is NOT reconstructable from the citation's other structured fields
// (mechanism, evidence_outcome, evaluation_status). Reconstructable
// soft guidance (e.g. "caution with anticoagulants" where an
// antiplatelet mechanism is already tagged) is dropped, not tagged.
// Test against the schema, not against an LLM's capability.
//
// Absence-of-data stances: for precautionary not_recommended stances
// (e.g. pregnancy with no data), this field co-occurs with
// evaluation_status: not_evaluated so the precautionary basis stays
// distinguishable from an evidence-based determination.
//
// Retired FDA pregnancy letter categories (A/B/C/D/X, removed under
// PLLR 2015) are NOT represented here.
//
// not_reported is an authorable member for the case where the cited block
// states no position verb. It is a value an
// authoring session writes, never a schema default; nothing coerces an absent
// field to it.
//
// It does not displace the landing rule above, and the two answer different
// questions. Under the landing rule this field is absent on most citations
// because the determination was reconstructable or there was none to carry;
// absence stays the normal state. not_reported is for the narrower case where
// a session has read the block, found no position verb, and is recording that
// as the finding rather than leaving the reader to infer it from a missing key.
// Writing it where the landing rule says drop the field is not what it is for.
//
// The live instance of the question it touches: the 32 consult-advisory
// citations that carried a use_with_caution stamp on a sentence with no
// position verb lost it. They lost the field rather than taking not_reported,
// because a position is withheld on consult-a-practitioner advisories, and the action those
// sentences print moved to a separate field, source_directive
// (sourceDirective.ts). use_with_caution is also withheld from statutory
// packaging lines and from any sentence printing "avoid", which left five
// values, all printing "caution" or "cautiously".
//
// RENAMED. This field was named regulator_position until it took the name
// source_position, in the records, the code and the docs at once. Earlier
// version_history entries keep the former name as written.

export const sourcePositionSchema = z.enum([
  'contraindicated',
  'not_recommended',
  'use_with_caution',
  'not_reported',
]);

export type SourcePosition = z.infer<typeof sourcePositionSchema>;
