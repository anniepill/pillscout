import { z } from 'zod';
import { sourceTokenSchema } from '../manifest/sourceToken.js';
import { checkedBlockVariants } from './checkedBlock.js';

// The roster name-lookup primitive.
//
// A roster question asks whether a list names the substance: the EMA herbal
// medicines inventory for `ema_hmpc_status`, the AGS Beers tables for
// `beers_criteria`. It is answered by LOOKING A NAME UP, not by reading a cited
// document for a sentence, so it is not an absence over sources and it
// never enters that derivation. It is a recorded search act: which list, which
// edition of it, which terms, how many entries matched, and no bytes of the
// list at all.
//
// Two statuses, on these two poles only:
//
//   not_listed  the list was searched for every term and no entry matched.
//               Derived from hits 0, on either resolution.
//   listed      entries matched, on a list the corpus may never hold
//               (governance_ceiling), so the entry cannot be cited. Carries
//               `matched`, the terms that hit, which a human confirmed are
//               the substance and not a homonym. A hit on a HELD list never
//               becomes listed: it resolves `present` by citing the held row,
//               or the pole stays not_assessed until a human does.
//
// DERIVED, NEVER TYPED. The status is a function of the act, and the lookup
// tool is what writes both; the lookup gate, part of the full pipeline and not
// shipped here like the tool, recomputes what it can and refuses a pole whose
// act does not derive it. What this module checks is SHAPE: which keys, which
// forms, and the one relation the act states about itself, that `matched` is a
// subset of `terms`. Which lists are registered, whether the list row joins,
// whether the edition and the terms are current and whether the count
// recomputes are repo state and the gate's.
//
// NO BYTES. Every field is closed. `list` names a manifest row by the pair a
// sources_checked entry uses. `edition` is a date, never a label. `terms` and
// `matched` are corpus vocabulary strings, and the gate holds `terms` equal to
// the vocabulary's current set, so no string of the list can ride in either. `hits` is a count. The attestation fields are
// hashes, a commit and a date. Every object is strict, so a verbatim, a
// context window, a matched cell or a note is refused wherever it is put.

/** The two statuses this primitive adds, carried by the two lookup poles only. */
export const LOOKUP_STATUSES = ['not_listed', 'listed'] as const;
export type LookupStatus = (typeof LOOKUP_STATUSES)[number];

/** The two poles a lookup answers. us_regulatory_status is not one. */
export const LOOKUP_POLES = [
  'regulatory_classification.ema_hmpc_status',
  'regulatory_classification.beers_criteria',
] as const;
export type LookupPole = (typeof LOOKUP_POLES)[number];

const hex = (n: number, what: string) =>
  z.string().regex(new RegExp(`^[0-9a-f]{${n}}$`), `${what} must be ${n} lowercase hex characters`);

/**
 * The list searched, named by its manifest pair. A document_id is an
 * identifier, never prose: no whitespace anywhere, which every document_id in
 * the corpus meets.
 */
export const lookupListSchema = z.strictObject({
  source: sourceTokenSchema,
  document_id: z
    .string()
    .max(128)
    .regex(/^[A-Za-z0-9][A-Za-z0-9_./:-]*$/, 'a list document_id is an identifier and carries no whitespace'),
});

/**
 * The edition: an ISO date at year, month or day precision, or a date and a
 * time to the minute for a register whose export stamps one. Never a label,
 * so it cannot carry a string of the list.
 */
export const EDITION = /^\d{4}(-\d{2}(-\d{2}(T\d{2}:\d{2})?)?)?$/;

/**
 * One search term: a vocabulary string on one line, trimmed, at most 80
 * characters. The shape cannot tell a vocabulary string from any other short
 * phrase; the gate's terms check can, and does.
 */
export const lookupTermSchema = z
  .string()
  .max(80, 'a search term is a vocabulary string, at most 80 characters')
  .regex(/^\S(?:[^\n\r\t]*\S)?$/, 'a search term is one trimmed line');

const uniqueTerms = (what: string) =>
  z
    .array(lookupTermSchema)
    .min(1)
    .refine((ts) => new Set(ts).size === ts.length, { message: `${what} repeats a term` });

const CORE = {
  list: lookupListSchema,
  edition: z.string().regex(EDITION, 'edition is an ISO date, or a date and a time to the minute'),
  terms: uniqueTerms('terms'),
};

/**
 * The attestation a count over a copy the corpus may not hold carries: the four
 * fields an attested anchor (the anchor into bytes the corpus may never hold)
 * carries, reused under their names. The copy hash is required, not optional
 * as an attested anchor allows: a lookup is attested with the copy hash.
 *
 * One field more than an attested anchor, verified_text_sha256: the hash of
 * the text layer the count ran over. A recount on another machine (the lookup
 * tool's recount mode, not shipped here) compares it, and that is what lets a
 * mismatch be read as a different copy, a different reader, or the same copy
 * and reader extracting different text. Its consumer is the recount; the
 * attested anchor dropped context_hash for having none.
 */
const ATTESTATION = {
  resolution: z.literal('attested'),
  verifier_hash: hex(64, 'verifier_hash'),
  verified_document_sha256: hex(64, 'verified_document_sha256'),
  verified_text_sha256: hex(64, 'verified_text_sha256'),
  verified_at_commit: hex(40, 'verified_at_commit'),
  verified_at: z.iso.date(),
};

/** A not_listed act: nothing matched, on a held list (recomputed) or a ceiling copy (attested). */
export const notListedLookupSchema = z.discriminatedUnion('resolution', [
  z.strictObject({ ...CORE, hits: z.literal(0), resolution: z.literal('recomputed') }),
  z.strictObject({ ...CORE, hits: z.literal(0), ...ATTESTATION }),
]);

/**
 * A listed act: entries matched on a ceiling copy. Attested only, because a hit
 * on a held list resolves present by citing the row and never lands here.
 */
export const listedLookupSchema = z
  .strictObject({
    ...CORE,
    hits: z.number().int().min(1, 'a listed act counts at least one entry'),
    matched: uniqueTerms('matched'),
    ...ATTESTATION,
  })
  .refine((l) => l.matched.every((m) => l.terms.includes(m)), {
    message: 'matched names only terms that were searched: every matched term is one of terms',
    path: ['matched'],
  });

export const notListedVariantSchema = z.strictObject({
  status: z.literal('not_listed'),
  lookup: notListedLookupSchema,
});

export const listedVariantSchema = z.strictObject({
  status: z.literal('listed'),
  lookup: listedLookupSchema,
});

/**
 * A lookup pole: the five variants every required block takes, plus the two
 * lookup statuses. Built from checkedBlockVariants so the five stay defined in
 * one place.
 */
export function lookupPole<Shape extends z.ZodRawShape>(
  presentShape: Shape,
  presentMode: 'strict' | 'loose' = 'strict',
) {
  return z.discriminatedUnion('status', [
    ...checkedBlockVariants(presentShape, presentMode),
    notListedVariantSchema,
    listedVariantSchema,
  ]);
}

/**
 * The served wordings, held here verbatim. The
 * angle-bracketed slots are filled by the renderer; nothing else in them may
 * change. Rendering is cabinet work; the templates are held here so the words
 * have one home the tool and the doc both read.
 *
 * <unit>: a row list serves "entries" and a text
 * list serves "matches", because the xlsx reader counts rows and the text
 * reader counts places the terms match. The lookup registry (part of the full
 * pipeline, not shipped here) states each list's unit and the renderer reads it
 * there.
 */
export const SERVED_NOT_LISTED =
  'NOT LISTED. <list> (<edition>) was searched for <terms> (whole word, any case): 0 <unit>. ' +
  'This says only that the list does not name <substance>; it is not evidence of safety.';

export const SERVED_LISTED =
  'LISTED. <list> (<edition>) names <substance> (matched: <matched>; <hits> <unit>). ' +
  'What the entry says cannot be checked (licensing); this is not a quoted finding.';

export const SERVED_ATTESTED_CLAUSE =
  'Searched by an author on <date> in a copy the corpus may not hold (licensing), so the search ' +
  'cannot be re-run from the corpus.';
