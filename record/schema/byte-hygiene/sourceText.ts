/**
 * The source-text allowlist: the one place that records which string values
 * are a source speaking rather than the corpus speaking.
 *
 * The byte-hygiene mechanism is two layers, not one. A BYTE layer rejects the
 * C0 controls, CR and BOM that no committed text file may carry, and gates
 * hard. A VOICE layer applies the ASCII house rule, and it applies ONLY where
 * the corpus is speaking. A verbatim quotes a source, and a source's own bytes
 * are not the corpus's to normalize: a separate rule governs which non-ASCII
 * is legitimate inside a quoted span, and a voice layer that did not skip
 * these keys would re-litigate it on every run. The concrete cost is
 * measurable at HEAD. The ginkgo artifact carries three `(R)` marks inside
 * verbatim SPL label titles and the ginkgo record carries the U+2013
 * confidence-interval range that an earlier pass deliberately corrected TO
 * source bytes. A gate treating every non-zero count as a defect would drive
 * a pass to strip exactly what an earlier pass restored.
 *
 * ONE allowlist, exported once, consumed twice: by the `sourceText()` type
 * below, which tags the schema call sites, and by the voice layer's file
 * walker, which must make the same judgment about raw YAML it never parsed
 * through a schema. Two copies would be free to drift, and the drift is silent
 * in the direction that matters: a key missing from the walker's copy turns a
 * legitimate source byte into a reported defect.
 *
 * DERIVED, NOT DESIGNED. The key set was read off the corpus rather than
 * imagined. Measured on the full private corpus at the time, not on this
 * repository: all 939 `verbatim` values in its 21 records sat inside a
 * schema-governed object (711 citation elements, 227 reference_values
 * elements, 1 block wrapper) and none sat at the untyped element level of a
 * loose block, so tagging the schema call sites reaches every one of them. The
 * artifact keys come from the two room artifacts of the full pipeline, not
 * shipped here.
 *
 * `section_title` is deliberately NOT here, and the exclusion was measured
 * rather than assumed. It is hand-authored (the section heading as an author
 * transcribed it), and when measured no `section_title` value in any record or
 * room artifact carries a single non-ASCII byte. It stays off the allowlist so
 * that headings remain quoted ASCII-safe going forward; the day one needs a
 * source byte is the day this decision is revisited, deliberately, and not the
 * day a gate quietly stops looking at 711 strings (the full private corpus's
 * count at the time).
 */
import { z } from 'zod';

/** The metadata flag a tagged string schema carries. */
export const SOURCE_TEXT_META_KEY = 'sourceText';

/**
 * One allowlisted key, with the parent it is allowlisted under.
 *
 * `parent: null` means the key carries source text wherever it appears, at any
 * depth and under any parent. `parent: '<key>'` scopes the allowance to values
 * whose NEAREST NAMED ANCESTOR is that key. Array indices are not named
 * ancestors, so `assertions[3].members[7].title` has nearest named ancestor
 * `members` and is allowed, while a `title` anywhere else is not.
 *
 * The scoping exists because `title` is a common key name. Allowing it
 * unconditionally would exempt every future `title` in the corpus from the
 * house rule on the strength of one SPL label field, which is the "reads as
 * coverage" failure.
 */
export interface SourceTextKey {
  readonly key: string;
  readonly parent: string | null;
}

/**
 * The allowlist. Thirty-three entries, counted off the array below: twelve
 * base entries, nine for the relevance grade, three for the stamp spans, one
 * unscoped `condition_span` that both carry, and eight for the mechanism and
 * the effect.
 *
 * The relevance-grade entries are the grade's spans: grade_span and
 * hedge_tokens, each scoped to the three field keys it can sit under, and
 * condition_span, unscoped (below); basis_span scoped to `bases`;
 * finding_span scoped to `findings`; and the relevance mark's `span`, scoped
 * to `relevance_marks` because `span` is the most generic name here. Every one of them is copied from a verbatim
 * byte for byte (the relevance gate holds each to the verbatim it sits beside),
 * so the source's own characters must survive in them exactly as in the
 * verbatim.
 *
 * The stamp entries are the same kind of copy: `position_span` and
 * `directive_span`, the verbatim bytes a stamp is read off, unscoped on the
 * `context_before` precedent because both names are specific to a stamp, and
 * the stamp mark's `span`, scoped to `stamp_marks` as the relevance mark's is
 * to `relevance_marks`. The stamp's `condition_span` sits on the citation
 * element itself, a document root of its own in the JSON Schema export, so it
 * has no parent to be scoped to. It shares its name and its kind with the
 * relevance grade's condition span, a qualifier copied from the verbatim, so
 * the one name is allowed unscoped for both, and the grade's three scoped
 * entries were folded into it. An effect entry's conditions are the same kind
 * of copy, and rode the same entry while they were one condition_span; they
 * are now a list, `condition_spans`, scoped to `effect` as its `hedge_tokens`
 * are.
 *
 * The mechanism and effect entries are the same kind of copy:
 * `mechanism_span` and `effect_span`, unscoped on the `position_span`
 * precedent because both names are specific to their field; `term` scoped to
 * `agent` and to `object` (a printed agent or object and its role: the role
 * is an enum and not source text), and
 * `hedge_tokens` scoped to each field, because all three are generic names and
 * each holds the verbatim's printed words byte for byte; and the mechanism
 * mark's `span`, scoped to `mechanism_marks` as the stamp mark's is to
 * `stamp_marks`. A field is a list of entries, and an array index is not a
 * named ancestor, so `mechanism[0].hedge_tokens` resolves to `mechanism`.
 *
 * verbatim         the quoted source sentence, in citation elements, in
 *                  reference_values elements, and on a stated_absence block
 * text_verbatim    the SPL assertion sentence as printed
 * text_normalized  its normalized form, which is also the grouping key
 * text_context     the source text surrounding an assertion
 * context_before   the extraction bytes preceding an anchor's first occurrence
 * context_after    the extraction bytes following it
 * note             the block-coverage disposition's note, ONLY under
 *                  `dispositions`
 * title            the SPL label title as printed, ONLY under `members`
 * unit             the reference value's unit as the authority printed it,
 *                  ONLY under `stated_values`
 * bytes            a tile's span bytes, ONLY under `tiles`
 * prefix           the bytes a tile's span is preceded by in its block, ONLY
 *                  under `tiles`
 * suffix           the bytes it is followed by, ONLY under `tiles`
 *
 * `context_before` and `context_after` were added with the first bytes
 * anchors. They are written by the anchor tool into a room's anchors.json
 * (both part of the full pipeline, not shipped here), and are defined as up
 * to 256 bytes of the committed extraction each side of the first
 * occurrence, kept as recovery data for the solver. Those characters are the authority's exactly as a verbatim's
 * are: the ginkgo monograph prints U+2013, U+2018 and U+2019, and a selector
 * that normalised them would no longer locate the span it exists to relocate.
 * Unscoped, on the `text_context` precedent: both names are specific to an
 * anchor record and neither is a generic key the corpus reuses elsewhere.
 *
 * They are also the entries that show the derivation rule reaching a file the
 * original pass could not have read. The allowlist was derived off HEAD, and at
 * that time the only anchor in the corpus was `attested`, whose schema carries
 * no context fields at all, so there was nothing to derive from.
 *
 * `note` was added with the first block-coverage disposition files. It is
 * tagged by the block-coverage gate's schema (full pipeline, not shipped
 * here), whose excluded variant says why: a disposition explains why a block is owed nothing, and
 * explaining that often means quoting the block, so the house ASCII rule would
 * fight the text it describes. The tag was there from that block's first
 * commit; this entry is the half that was missing, and until it landed a note
 * quoting a source's en-dash would have been reported as a defect and an
 * author told to strip exactly what the schema invited them to keep.
 *
 * SCOPED to `dispositions`, not allowed bare. `note` is the most generic key
 * name on this list: the corpus uses it for authoring commentary in several
 * places, and an unscoped allowance would exempt every one of those from the
 * house rule on the strength of one block. Under the parent rule an array
 * index is not a named ancestor, so `dispositions[3].note` resolves its parent
 * to `dispositions` and a `note` anywhere else does not.
 *
 * `unit` was added later, and it is the entry that shows how the original derivation could miss one. The
 * other five were read off the corpus by key name. This one is only visible in
 * the DOCTRINE: schema/reference-values/referenceValues.ts states, above the
 * stated-value schema, that "unit is copied glyph-for-glyph from the source",
 * and vitamin_d was keeping that invariant exactly. Its FNB values read `mcg`
 * because the National Academies print mcg, and its EFSA values read the Greek
 * mu because EFSA prints the Greek mu. That is not an inconsistency to clean
 * up; it is two authorities quoted faithfully, and a pass that normalised it
 * would have destroyed the distinction and reported the destruction as
 * housekeeping. It is the same class of error as stripping a verbatim, arriving
 * through a field nobody had labelled as a quote.
 *
 * `bytes`, `prefix` and `suffix` were added with the block-coverage gate's
 * span tile (full pipeline, not shipped here). A tile is
 * addressed by the raw bytes it covers, and by the raw bytes around them where
 * those repeat inside the block, so all three are the extraction's bytes
 * exactly, U+2019 and the rest included; a disambiguator is very often a single
 * LF, which is exactly the byte a normaliser would move. Scoped to `tiles`
 * because all three are generic names. A tile's `note` is deliberately NOT
 * here: it is the corpus speaking about a span, so it stays under the house
 * rule, and the span's bytes are a field of their own so that the note never
 * has to quote them.
 *
 * Scoped to `stated_values` for the reason `title` is scoped to `members`:
 * `unit` is a generic name, and an unscoped allowance would exempt every future
 * `unit` in the corpus on the strength of one block's invariant.
 */
export const SOURCE_TEXT_KEYS: readonly SourceTextKey[] = [
  { key: 'verbatim', parent: null },
  { key: 'text_verbatim', parent: null },
  { key: 'text_normalized', parent: null },
  { key: 'text_context', parent: null },
  { key: 'context_before', parent: null },
  { key: 'context_after', parent: null },
  { key: 'note', parent: 'dispositions' },
  { key: 'title', parent: 'members' },
  { key: 'unit', parent: 'stated_values' },
  { key: 'bytes', parent: 'tiles' },
  { key: 'prefix', parent: 'tiles' },
  { key: 'suffix', parent: 'tiles' },
  { key: 'grade_span', parent: 'human_relevance' },
  { key: 'grade_span', parent: 'clinical_relevance' },
  { key: 'grade_span', parent: 'biological_relevance' },
  { key: 'hedge_tokens', parent: 'human_relevance' },
  { key: 'hedge_tokens', parent: 'clinical_relevance' },
  { key: 'hedge_tokens', parent: 'biological_relevance' },
  { key: 'basis_span', parent: 'bases' },
  { key: 'finding_span', parent: 'findings' },
  { key: 'span', parent: 'relevance_marks' },
  { key: 'position_span', parent: null },
  { key: 'directive_span', parent: null },
  { key: 'span', parent: 'stamp_marks' },
  { key: 'condition_span', parent: null },
  { key: 'mechanism_span', parent: null },
  { key: 'term', parent: 'agent' },
  { key: 'hedge_tokens', parent: 'mechanism' },
  { key: 'effect_span', parent: null },
  { key: 'term', parent: 'object' },
  { key: 'hedge_tokens', parent: 'effect' },
  { key: 'condition_spans', parent: 'effect' },
  { key: 'span', parent: 'mechanism_marks' },
];

/**
 * Does a value at `key`, whose nearest named ancestor is `parentKey`, hold
 * source text?
 *
 * This is the walker's entry point and the test's oracle, so the parent rule
 * lives here rather than being restated at each call site. `parentKey` is
 * undefined at the document root.
 */
export function isSourceTextKey(
  key: string,
  parentKey: string | undefined,
): boolean {
  return SOURCE_TEXT_KEYS.some(
    (entry) =>
      entry.key === key &&
      (entry.parent === null || entry.parent === parentKey),
  );
}

/**
 * A string leaf whose value is source text.
 *
 * Composes with whatever the call site already had. `.min(1)`, `.nullable()`,
 * `.optional()` and `.refine()` all preserve the metadata (verified against
 * zod 4.4.3), and the tag is inert at parse time, so retyping a call site
 * changes no validation behaviour whatsoever. What it changes is that the key
 * is now queryable as source text from the schema itself, rather than from a
 * list somebody has to remember to update.
 *
 * The tag survives under wrappers but is carried by the INNER type, so a
 * consumer reading it back must unwrap `def.innerType` / `def.element` before
 * calling `.meta()`.
 */
export function sourceText() {
  return z.string().meta({ [SOURCE_TEXT_META_KEY]: true });
}

/**
 * Read the source-text tag off a schema, unwrapping array and optional /
 * nullable wrappers to reach the type that carries it.
 */
export function carriesSourceTextMeta(schema: unknown): boolean {
  let node: unknown = schema;
  for (let hops = 0; hops < 8; hops++) {
    if (node === null || typeof node !== 'object') return false;
    const meta = (node as { meta?: () => Record<string, unknown> | undefined }).meta?.();
    if (meta?.[SOURCE_TEXT_META_KEY] === true) return true;
    const def = (node as { def?: { innerType?: unknown; element?: unknown } }).def;
    node = def?.innerType ?? def?.element;
    if (node === undefined) return false;
  }
  return false;
}
