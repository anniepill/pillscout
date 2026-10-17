import { z } from 'zod';

import { sourceText } from '../byte-hygiene/sourceText.js';

// The mechanism a source states, derived from a span inside the citation's own
// verbatim. It replaced the typed mechanism tokens, now retired.
//
// A MECHANISM CARRIES ITS SPAN. `mechanism_span` is the verbatim's own bytes,
// one occurrence, one sentence, line feeds included, resolved the way a
// relevance finding_span is. Every other key is DERIVED from the span through
// the mechanism word tables and stored once so a consuming agent can query
// it; the mechanism writer (full pipeline, not shipped here) writes span and values
// together and the mechanism gate re-derives them and refuses a stored value
// the span does not give. The tables, the writer and the gate are part of the
// full pipeline, not shipped here. No value without a span. No span does
// NOT mean the source stated nothing: a clause the derivation cannot yet read
// carries no entry and no mark, and nothing on the record says so. It is held
// in the pipeline's NOT_YET_DERIVABLE_HELD table and listed by the
// mechanism report; its table words read `see_verbatim` in term_matches, and a word
// no table holds leaves no trace on the record at all. A description block is
// not read by the rules, and a word no row holds is below the lint's floor.
//
//   process       the printed process word's row value (induction, chelation)
//                 or `unknown`, where the source prints that it does not know
//   target        the enzymes, transporters, receptors or systems the process
//                 acts on, as their rows give them: a LIST in printed order,
//                 every target row in the process's clause and the list it
//                 runs into, the shape of an effect's object; empty where the
//                 clause prints none, and on `unknown`
//   agent         the printed term that names the process's subject, as the
//                 verbatim prints it, with its ROLE: ingredient (a pole word or
//                 an ingredient term row), constituent (a name in the record's
//                 active_constituents block), partner (the item's partner
//                 terms), or other (a printed head that is none of those
//                 three). Absent on `unknown`, on a process_only word
//                 (chelation, complex, binding, adsorption, sequestrants),
//                 whose sentence must still name the ingredient, and on a
//                 nominal process whose clause prints no subject for it
//                 ("because of induction of CYP3A4")
//   hedge_tokens  the hedge words the span prints, verbatim, in order: a hedge
//                 derives the value and travels with it (the relevance pattern)
//
// The values are open strings here and held to the tables by the gate
// (mechanism_value_unheld), so a value no row gives is named as such rather
// than reported as a shape failure.
//
// A CITATION CARRIES A LIST: every top-level clause of its verbatim that
// derives contributes one entry, so a citation whose verbatim states two
// mechanisms carries both, each with its own span.

/** Who a printed agent or object is. */
export const ROLES = ['ingredient', 'constituent', 'partner', 'other'] as const;
export type Role = (typeof ROLES)[number];

/** A printed agent or object term and its role. The term is the verbatim's printed words. */
export const namedSchema = z.strictObject({
  term: sourceText().min(1),
  role: z.enum(ROLES),
});
export type Named = z.infer<typeof namedSchema>;

export const mechanismSchema = z.strictObject({
  process: z.string().min(1),
  target: z.array(z.string().min(1)),
  agent: namedSchema.optional(),
  hedge_tokens: z.array(sourceText().min(1)).min(1).optional(),
  mechanism_span: sourceText().min(1),
});
export type Mechanism = z.infer<typeof mechanismSchema>;

/** The citation's mechanisms: one entry for each clause that derives one. */
export const mechanismsSchema = z.array(mechanismSchema).min(1);

// The marks the mechanism lint takes, in the shape of stamp_marks: a kind, a
// reason from a closed set, and a verbatim span. One list carries both kinds.
//
//   not_a_mechanism  a process word with a target in its clause states no
//                    mechanism the citation owes
//   not_an_effect    a parameter with a direction or occurrence word in its
//                    clause states no effect the citation owes
//
// The first six reasons are a fixed set; a reason beyond them is added only
// with a held instance, and the report that adds it says so. The seventh,
// `carried_by_stamp`, was added so: a not_an_effect mark on a sentence whose
// claim the citation's source_position stamp carries, held by the five
// "Hypersensitivity to the active substance" contraindication lines (curcumin,
// garlic, ginkgo twice, green_tea_folium, 4.3). It marks a parameter the lint
// does not flag, as a negated mark may, and so may a mark of any other reason
// on an event in a clause the lint does not flag; it alone stands only beside
// a stamp (the mechanism lint, part of the full pipeline and not shipped
// here). The eighth, `other_partner`, marks a
// clause whose subject is another item's partner: the effect it states is that
// partner's, held by the potassium-sparing diuretics sentence cited on
// magnesium's loop and thiazide diuretics item. The ninth,
// `third_party_subject`, marks a clause whose subject is neither party, their
// co-use nor the parameter (the subject_third_party refusal): the effect it
// states is a third party's, held by curcumin's pharmacodynamics sentence
// "Both the essential oil and sodium curcuminate increase bile secretion after
// intravenous administration to dogs". The tenth of the ten that stand (the
// eleventh added: not_yet_derivable, retired below, was added before it),
// `partner_own_action`, marks a clause on a documented_interactions item where
// the partner acts alone on a third thing and the ingredient is no agent,
// object, by-phrase party or co-use subject: held by vitamin D's statin line
// "Statin medications reduce cholesterol synthesis" (PARTNER_OWN_ACTION_HELD).
//
// RETIRED: `not_yet_derivable`, the tenth reason added, for a clause that
// states an effect or a mechanism the citation owes and that the derivation
// cannot yet read, with a `class` saying why. A stored class is a statement an
// agent reads, and stored classes were found false. No mark carries the
// reason and no mark carries a `class`: the enum refuses the one and the strict object the other, and
// checkRetiredKeys (schema/cli/validator-core.ts) names why. The class is
// computed each run from the clause's refusal (REFUSAL_CLASS) and printed by
// the full pipeline's mechanism report, never stored on a
// record and never served; the clauses are pinned in NOT_YET_DERIVABLE_HELD
// and the lint checks that table both ways (the report, the table and the
// lint are part of the full pipeline, not shipped here). The words under the
// retired marks stay term_matches items.
//
// Every reason is checked, not trusted: each has a mechanical condition the
// lint verifies on the word the mark clears, and a mark whose reason fails it
// fails the full pipeline's corpus run (validate:all). The definitions the conditions check:
//
//   third_party_subject      the clause refuses subject_third_party
//   other_partner            the clause refuses subject_other_partner
//   partner_own_action       the clause refuses partner_own_action
//   negated                  a direction word of the word's clause binds it
//                            and a negation is attached to that direction:
//                            printed before it, one held stretch between
//                            them (NEGATION_STRETCH_ROWS). A reporting or
//                            knowledge predicate in the clause refuses it
//                            (not known, not reported, not implicated), and
//                            so does another direction word, not negated,
//                            printed against the word, and a negated noun
//                            phrase that is the subject of a later predicate
//                            ("No increase has been documented"). What the rule cannot
//                            attach is not marked negated: a miss, never a
//                            wrong negative
//   carried_by_stamp         the citation carries a source_position stamp
//                            whose position_span lies in the word's clause
//   other_sense              a sense row fires on the marked word, or an
//                            evaluative row on its clause's predicate
//   instruction_or_guidance  the clause refuses occurrence_conditional; or,
//                            in the word's own clause, the directive_span of
//                            a source_directive, a conditional or an
//                            instruction frame
//   partner_class            the word sits inside a partner-class noun phrase,
//                            a class noun with the ingredient outside it
//   table_or_list            a flattened SPL table cell whose claim cannot be
//                            placed until the SPL table module: the
//                            citation's section_title or evidence_locator
//                            names a table; or a bracketed list with no
//                            predicate
//   site_only                a site row fires on the word; none is held
//
// The mechanism writer, run to mark, takes the reason from these
// conditions and refuses a typed reason that fails its own.
export const MECHANISM_MARK_REASONS = [
  'partner_class',
  'instruction_or_guidance',
  'negated',
  'table_or_list',
  'site_only',
  'other_sense',
  'carried_by_stamp',
  'other_partner',
  'third_party_subject',
  'partner_own_action',
] as const;
export type MechanismMarkReason = (typeof MECHANISM_MARK_REASONS)[number];

export const MECHANISM_MARK_KINDS = ['not_a_mechanism', 'not_an_effect'] as const;

// One strict object: a kind, a reason of the set and a span. No mark carries a
// `class` (retired with not_yet_derivable, above).
export const mechanismMarkSchema = z.strictObject({
  kind: z.enum(MECHANISM_MARK_KINDS),
  reason: z.enum(MECHANISM_MARK_REASONS),
  span: sourceText().min(1),
});
export const mechanismMarksSchema = z.array(mechanismMarkSchema).min(1);
export type MechanismMark = z.infer<typeof mechanismMarkSchema>;

// The floor: every printed occurrence of a parameter, process or target
// table's word on a deriving block, stored on its citation as `term_matches`,
// an index beside the entries and marks, never in place of them (the floor
// gate, part of the full pipeline and not shipped here). An item is the
// table, the table's form of the word (table_term), the occurrence's UTF-8
// byte offsets, half-open, into the stored verbatim, as the extraction's
// offsets are (byte_start,
// byte_end), and its rule_pointer: see_entry, see_verbatim_negation,
// see_verbatim_instruction or see_verbatim, where to look and what the entries
// and marks on the same citation detected there (the key was formerly
// rule_reading and the values keyed, negated, instruction and unread; both are
// refused by name, below). Nothing is typed: the mechanism writer (full pipeline, not shipped here) writes the list and the floor
// gate re-derives every item, its pointer included.
export const TERM_MATCHES_FIELD = 'term_matches' as const;
export const TERM_TABLES = ['parameter', 'process', 'target'] as const;
export type TermTable = (typeof TERM_TABLES)[number];
export const RULE_POINTERS = ['see_entry', 'see_verbatim_negation', 'see_verbatim_instruction', 'see_verbatim'] as const;
export type RulePointer = (typeof RULE_POINTERS)[number];
/** The retired key, refused by name: checkRetiredKeys names it, and the floor gate's shape finding. */
export const RETIRED_RULE_READING_KEY = 'rule_reading' as const;
/** The four values retired with it, each with the pointer that took its place; the floor gate's shape finding names one it meets. */
export const RETIRED_RULE_READING_VALUES: Readonly<Record<string, RulePointer>> = {
  keyed: 'see_entry',
  negated: 'see_verbatim_negation',
  instruction: 'see_verbatim_instruction',
  unread: 'see_verbatim',
};
/**
 * The field's description: a pointer says what the rules RECORDED, see_verbatim says only that none of the three is
 * recorded, and the verbatim must be read in every case.
 */
export const TERM_MATCHES_DESCRIPTION =
  'Words from the word tables found in this quote, with byte positions. rule_pointer says where to look and what the rules detected there; the pointer itself is never a finding. see_entry: a rule-written entry in this citation\'s mechanism or effect list covers the word. see_verbatim_negation: the rules recorded a negated change word (for example "did not differ", "no higher") governing the word. see_verbatim_instruction: the rules recorded the word as sitting inside advice, which may itself state a risk. see_verbatim: none of the above is recorded for this word; it may still be negated or inside advice. In every case the verbatim is the source and must be read.';

export const termMatchSchema = z
  .strictObject({
    table: z.enum(TERM_TABLES),
    table_term: z.string().min(1),
    byte_start: z.number().int().nonnegative(),
    byte_end: z.number().int().positive(),
    rule_pointer: z.enum(RULE_POINTERS),
  })
  .refine((m) => m.byte_end > m.byte_start, { message: 'byte_end is after byte_start' });
export const termMatchesSchema = z.array(termMatchSchema).min(1).describe(TERM_MATCHES_DESCRIPTION);
export type TermMatchItem = z.infer<typeof termMatchSchema>;
