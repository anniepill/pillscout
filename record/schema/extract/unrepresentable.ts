/**
 * The unrepresentable state.
 *
 * Anything the rules cannot represent faithfully is recorded with a reason.
 * Never silently dropped, never approximated, never absorbed into a whole-page
 * or whole-document fallback. A block that cannot be bounded is not a block,
 * and a fallback here would make the containment invariant vacuous over
 * exactly the pages the extractor could not read.
 *
 * This vocabulary is PROVISIONAL and deliberately not locked. The `class` and
 * `must_close_by` enums are locked and live in
 * schema/claim-evidence/unresolved.ts; a region recorded here is what that
 * module's `anchor_gap` class names (a source that is held and a claim that is
 * real, which the byte contract cannot reach yet), and any mapping from
 * these reasons onto it belongs in this one file.
 */
import { id12, unrepresentablePreimage } from './preimage.js';

/**
 * Three reasons retired. A declared reason no emitter can reach is a promise the extraction does not keep: it reads as
 * coverage of a condition nothing records.
 *
 * `divider_not_detected` and `multiple_divider_candidates` name refusals of a
 * whole document, not of a region inside one. The monograph rule's
 * `fingerprint`, part of the full pipeline and not shipped here, refuses a
 * body table carrying no interior vertical divider, and refuses one whose
 * divider does not carry DIVIDER_DOMINANCE times
 * the next vertical, both before `extract` runs and over the same
 * `classifyTables` call, so neither condition can survive into a rule that
 * emits. `divider_not_detected` carried a branch in `extract` and retires with
 * it; a probe that made that branch throw extracted all ten committed documents
 * without firing. HEADING_WRAP_AMBIGUOUS in the same rule already states this
 * call for the heading wrap: a record says the extractor could not read one
 * region of a document it otherwise read, and an inability to read the
 * document's structure is a statement about the whole of it, which is a
 * fingerprint failure and not a per-region record.
 *
 * `no_rule_for_document` has no artifact to live in. A row whose source family
 * has no rule is never extracted, so it has no extraction directory and no
 * unrepresentable.json (both room data of the full pipeline, not shipped
 * here); writing one would be the whole-document fallback the
 * header above forbids, and would assert an extraction of a document nothing
 * extracted. 77 eligible rows were in that state when it retired, and the
 * extractor's `run` (full pipeline, not shipped here) reports each as
 * ineligible carrying the rule-selection message, which is where a row with
 * no rule belongs.
 */
export const UNREPRESENTABLE_REASONS = [
  'merged_cell_spans_divider',
  'unexpected_column_count',
  'page_continuation_unmatched',
  'page_yields_no_text',
  'table_not_classified',
  'text_outside_any_block',
] as const;

export type UnrepresentableReason = (typeof UNREPRESENTABLE_REASONS)[number];

/**
 * Does a record under this reason account for the section it sits in, for the
 * structural gate (the extractor's `sectionGate`, part of the full pipeline and
 * not shipped here)?
 *
 * The gate used to read the SHAPE of a record: a `section_path` carried that
 * one section, and its absence carried every section printed on the page. Shape
 * is the wrong question, because two records can share a shape and mean
 * opposite things. A region the rule MET AND COULD NOT READ is the only account
 * of whatever was in it, so it must carry its section or the gate would demand
 * a block for text that is provably unreadable. That is what the five covering
 * reasons below have in common, and apparatus the rule REMOVED BY DESIGN sits
 * on the other side of the same cut, accounting for nothing.
 *
 * `text_outside_any_block` does not carry, and that call rests on the reason's
 * own meaning rather than on which side of that cut it falls. It records that
 * text was found outside every block, which says nothing about whether a
 * section's own content reached a block; a record answering a different
 * question cannot stand in for the answer to this one. Letting it carry would
 * mean a record of text somewhere on a page satisfying the gate for every
 * section printed on that page.
 *
 * Measured over the nine committed monographs: furniture sits on 69
 * of the 73 text-bearing pages, so had a removed-furniture record been allowed
 * to carry, 153 of 153 printed sections would have been carried by a record
 * rather than by a block and the gate would have been fully vacuous. It is the
 * gate that caught cinnamon's 4.1, 4.3, 4.6, 5.3 and 6 filed under the section
 * before each.
 *
 * A Record over the reason type, not a Set, so that a reason coined later
 * cannot compile until someone classifies it. An unclassified reason silently
 * defaulting to either answer is the failure this table exists to prevent.
 */
export const COVERS_SECTIONS: Readonly<Record<UnrepresentableReason, boolean>> = {
  // Page-scoped refusal, and the only reason here that covers a page honestly.
  // The rule skips the page's whole text, but `printedSections` still reads its
  // headings, so the sections ARE printed and this record is their only
  // account. Contrast `page_yields_no_text` below, where nothing is printed at
  // all.
  merged_cell_spans_divider: true,
  // A body row the rule would not guess at. Its cells' text leaves, and the
  // record carries the section that text was in.
  page_continuation_unmatched: true,
  // No characters on the page at all, and therefore NO SECTION PRINTED ON IT.
  // `printedSections` reads the page's words and this reason's emitters fire
  // only where there are none (`char_count === 0`, or an opinion page that
  // yields no words), so a real record under it can never sweep in a section:
  // there is nothing on that page for the gate to have expected a block for.
  // Measured over the ten committed extractions, flipping this flag
  // changes 0 carried sets; the one real record, the ginkgo opinion's scanned
  // page 1, sits on a page printing 0 sections.
  //
  // It is false rather than true because true was only ever inert, and an inert
  // true is a licence waiting for a caller: the gate would honour a CONSTRUCTED
  // record on a page that did print sections, which is what a test used to
  // build on cinnamon page 5. Marking it false costs nothing
  // real and removes the licence. A page that genuinely yields no text now
  // fails the gate on `expected but not printed`, which is the honest verdict:
  // the sections were never read, and a record saying so is not a block.
  page_yields_no_text: false,
  // A table the rule could not classify. Its cells' text leaves with the record.
  table_not_classified: true,
  // A body row whose cell count the rule does not represent. Same as above.
  unexpected_column_count: true,
  // Text found outside every block: a statement about where some text was, not
  // about whether a section's own content reached a block, so it cannot carry
  // one. The only reason here that does not. No record uses it yet.
  text_outside_any_block: false,
};

export interface Unrepresentable {
  /** 1-based page, or null where the finding is document-scoped. */
  page: number | null;
  reason: UnrepresentableReason;
  /** What a human needs to see it without reopening the PDF. */
  detail: string;
  /**
   * The section the region sits in, on a row-level record only.
   *
   * Absent, not null, on a page-level record: a page that yields no text or
   * carries a merged cell covers every section printed on it, and the structural
   * gate reads it that way. A row-level record without its section would cover
   * the whole page and hide a lost section behind it.
   */
  section_path?: string;
}

export function unrepresentable(
  page: number | null,
  reason: UnrepresentableReason,
  detail: string,
  sectionPath?: string,
): Unrepresentable {
  return sectionPath === undefined
    ? { page, reason, detail }
    : { page, reason, detail, section_path: sectionPath };
}

/**
 * The stable ref of one entry:
 *
 *     <document_sha256[0:12]>#u<sha256(Q)[0:12]>
 *
 * Q is the length-prefixed preimage in schema/extract/preimage.ts: page,
 * reason and section_path. `detail` is not in it, and neither is file order.
 *
 * THIS REF IS DELIBERATELY NOT INJECTIVE. Two entries equal in page, reason
 * and section_path share a ref, and that is not an extract failure. A block id
 * collision is one because a block is a cell a citation quotes and two
 * indistinguishable cells cannot be addressed apart; a ref names a REGION the
 * extractor could not read, and two such regions on one page under one reason
 * are the same answer to the only question a reader asks of it, which is where
 * to look and why the corpus has nothing.
 *
 * File order was the previous address and is retired with the extraction-hash
 * prefix: an index moved every ref when an earlier region was found first, and
 * the prefix moved every ref on any pipeline change.
 *
 * A ref names a REGION, not a cell. Two anchors on one ref are not gated for
 * agreement, because a region the extractor could not read may hold more than
 * one stated value, and pretending otherwise would invent a precision the
 * extraction does not have.
 */
export function unrepresentableRef(documentSha256: string, u: Unrepresentable): string {
  return `${documentSha256.slice(0, 12)}#u${id12(
    unrepresentablePreimage(u.page, u.reason, u.section_path),
  )}`;
}

/**
 * An entry as committed: the finding plus its stable ref.
 *
 * The ref is assigned at the serialization edge, not by the factory above,
 * because it derives from the document digest and a rule does not know it.
 * Identity is the edge's job here exactly as it is for a block (the
 * extractor's serializer, part of the full pipeline and not shipped here).
 */
export interface SerializedUnrepresentable extends Unrepresentable {
  ref: string;
}
