import { z } from 'zod';

import { sourceText } from '../byte-hygiene/sourceText.js';
import { namedSchema } from './mechanismSpan.js';
import { conditionSpanSchema } from './stampSpan.js';

// The effect a source states, derived from a span inside the citation's own
// verbatim. It replaced the typed direction key, now retired, which held
// increase or decrease with no object, the object it referred to moving from
// record to record by convention.
//
// AN EFFECT CARRIES ITS SPAN. `effect_span` is the verbatim's own bytes, one
// occurrence, one sentence, line feeds included. Every other key is DERIVED
// from it through the mechanism word tables, never typed, and the mechanism
// gate re-derives them; both are part of the full pipeline, not shipped here.
//
//   parameter     the printed exposure, response or clinical-event term's row
//                 value (absorption, bleeding time, somnolence): an adverse
//                 reaction's term is a parameter like any other
//   direction     the printed direction word's row value (increased,
//                 decreased, prolonged, altered), or an occurrence word
//                 (reported, occur) on a clinical-event parameter
//   object        whose parameter it is: each printed possessor or "of" head,
//                 a list where one predicate names two ("bioavailability of
//                 carbidopa and levodopa"), each with its ROLE, ingredient,
//                 constituent, partner or other (a printed head that is none
//                 of the first three derives as other, and only a parameter
//                 with no printed head refuses).
//                 Required on an exposure parameter, never on a clinical event
//                 (the patient is the object there and is not named), and on a
//                 response parameter present only where the span or a heading
//                 row names it
//   hedge_tokens  the hedge words the span prints, verbatim, in order
//   condition_spans
//                 every condition the effect's own clause scopes it to, each
//                 the printed phrase, byte-exact inside the entry's sentence,
//                 in reading order ("in patients with pre-existing
//                 hyperoxaluria", "with impaired renal function"; a
//                 dose-qualified subject; a relative's inherited conditions and
//                 its own "especially if" clause), each in the stamp's
//                 condition_span shape (schema/claim-evidence/stampSpan.ts); a
//                 list, one condition a list of one, absent where the clause
//                 carries none. The stamp's own condition_span is unchanged
//
// A CITATION CARRIES A LIST: every top-level clause that derives contributes
// its effects, and a clause whose parameters are one coordinated list sharing
// one direction contributes one effect for each, with the same span, object
// and hedge.

export const effectSchema = z.strictObject({
  parameter: z.string().min(1),
  direction: z.string().min(1),
  object: z.array(namedSchema),
  hedge_tokens: z.array(sourceText().min(1)).min(1).optional(),
  condition_spans: z.array(conditionSpanSchema).min(1).optional(),
  effect_span: sourceText().min(1),
});
export type Effect = z.infer<typeof effectSchema>;

/** The citation's effects: every effect every deriving clause gives. */
export const effectsSchema = z.array(effectSchema).min(1);
