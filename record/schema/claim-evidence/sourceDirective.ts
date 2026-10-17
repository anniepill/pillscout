import { z } from 'zod';

// The action a source sentence directs its reader to take, mirrored from the
// printed words: toward a professional for four values, and for the fifth,
// `avoid`, away from a co-behavior.
//
// It is NOT a position. `source_position` records a determination about the
// substance; this records what the sentence tells the reader to do, and the
// two may sit on one citation. A sentence that directs the reader to a
// professional takes the value mirroring its printed action: one value per
// action, never per wording, so "use only after consultation with a physician"
// is `ask_before_use`. The generic "if adverse reactions occur, consult a
// doctor" sentence takes no value. Where a sentence's heading and its
// printed verb disagree, the verb wins, and the heading decides only when no
// verb is printed.
//
// `avoid` is a regulator's instruction to the reader to avoid a
// co-behavior: a drug, a food, a timing, an exposure. A sentence telling the
// reader to avoid the SUBSTANCE itself is not a directive; it stays on the
// position side under the stop-grade rule (avoid-the-substance wording is
// contraindications-grade) and takes no value here. The printed-string gate cannot tell the two targets
// apart, since both print the verb, so that line is held at authoring.
//
// The field is named `source_directive` rather than `regulator_directive` so
// that it pairs with `source_position`, the name chosen for the field then
// named `regulator_position`. Unlike that field it was new, so it took the
// chosen name from the start; the other field migrated into its name later.
//
// WHAT ENFORCES A VALUE. Not the defined-terms registry: no authority defines
// these tokens, so no registry row can admit or refuse them and
// `schema/defined-terms/registry.ts` says so in its header. The enforcement is
// the stamp gate, part of the full pipeline and not shipped here: the value
// is derived from the citation's `directive_span` through the value's own list,
// `DIRECTIVE_WORDING` in schema/wording/stamp.ts, and the stamp lint flags a
// printed directive word no stamp or mark covers. Before the stamp gate, the
// gate was `directive_without_verb` in schema/cli/validator-core.ts, which
// asked only that the verbatim print a string of the list. There is no
// speaker check in code for this field or for `source_position`; the rule
// that the source must speak in its own voice is held at authoring.
//
// WHY THESE TOKENS ARE NOT PARAPHRASES. A structured field never holds the
// corpus's own summary of a source sentence. As amended, that rule reads: a
// token in a closed enum whose membership is enforced by a printed-string list
// names a printed action and is not a paraphrase; the rule applies to tokens
// that carry content (a condition, a population, a dose). So no token here
// names the condition, the population or the duration a sentence goes on to
// state; those stay in the verbatim.
//
// Two tokens are ASSEMBLED rather than read off one printed run, and the
// amended rule names both with their derivation:
//   - ask_for_use_beyond_duration: the printed lead ("for use beyond") plus the
//     regulator's own section name for the duration it caps (Health Canada's
//     Duration(s) of use heading).
//   - ask_if_symptoms_persist: EMA's printed "if the symptoms persist" and its
//     sibling "worsen".
// The other three are the printed actions themselves: ask_before_use,
// stop_use_and_ask, and avoid, a printed verb with no assembly (its list,
// ["avoid"], matches "avoided" and "avoidance" as substrings).
//
// ask_if_symptoms_persist ENTERS AT 0 USES. citationElement.ts says its key set
// is derived from the corpus and that nothing there is aspirational; this value
// is the stated exception, admitted by decision rather than read off a
// record, so that the first EMA sentence printing it has a value to take
// instead of prompting an ad hoc one. When it was added, no record verbatim
// printed "symptoms persist".

export const sourceDirectiveSchema = z.enum([
  'ask_before_use',
  'stop_use_and_ask',
  'ask_for_use_beyond_duration',
  'ask_if_symptoms_persist',
  'avoid',
]);

export type SourceDirective = z.infer<typeof sourceDirectiveSchema>;
