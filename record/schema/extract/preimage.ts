/**
 * Length-prefixed preimages for the two content-derived ids.
 *
 * Both ids are a 12-hex document digest prefix, a separator, and 12 hex
 * characters of a SHA-256 over a preimage built here. Neither
 * carries the pipeline hash, an ordinal, a column or an occurrence index.
 *
 * Every variable-length field is length-prefixed with a big-endian u32 and
 * every optional field with a one-byte present flag. That is the whole point
 * of this module: a delimiter-joined preimage lets two different field
 * sequences produce the same bytes, so a heading ending in the delimiter, or a
 * heading list of ["a", "b"] against ["a\x1fb"], would collide by construction
 * rather than by accident. Length prefixes make the encoding injective, so a
 * collision means two blocks really do carry the same headings and the same
 * bytes, which is a statement about the source rather than about the encoding.
 */
import { createHash } from 'node:crypto';

/** A field length or count, big-endian, four bytes. */
export function u32be(n: number): Buffer {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(n);
  return b;
}

/** A one-byte present flag for an optional field: 1 present, 0 absent. */
function present(yes: boolean): Buffer {
  return Buffer.from([yes ? 1 : 0]);
}

/** The first 12 hex characters of the SHA-256 over a preimage. */
export function id12(preimage: Buffer): string {
  return createHash('sha256').update(preimage).digest('hex').slice(0, 12);
}

/**
 * The block preimage:
 *
 *     u32be(number of headings)
 *     per heading: u32be(byte length) then the heading bytes
 *     u32be(byte length of the block) then the block bytes
 *
 * `column` is deliberately absent. It is an extractor label, which an id
 * never carries, and it carries no information
 * the heading chain does not: the monograph rule assigns the column and
 * attaches the column-header bytes from the same header-row match, so
 * `check:extraction` (the full pipeline's extraction check, not shipped here)
 * can assert one is derivable from the other and does.
 */
export function blockPreimage(headings: readonly string[], blockBytes: Buffer): Buffer {
  const parts: Buffer[] = [u32be(headings.length)];
  for (const h of headings) {
    const hb = Buffer.from(h, 'utf8');
    parts.push(u32be(hb.length), hb);
  }
  parts.push(u32be(blockBytes.length), blockBytes);
  return Buffer.concat(parts);
}

/**
 * The unrepresentable preimage:
 *
 *     u8(page present) then u32be(page) if present
 *     u32be(byte length of reason) then the reason bytes
 *     u8(section_path present) then u32be(byte length) and the bytes if present
 *
 * `detail` is deliberately absent, and the consequence is deliberate too: this
 * ref is NOT injective. Two records equal in page, reason and section_path
 * share a ref, and that is not an extract failure, because a ref names a
 * REGION the extractor could not read rather than a cell. `detail` is prose
 * written for a human reopening the PDF, and putting it in the id would make
 * the address move when the wording improved.
 */
export function unrepresentablePreimage(
  page: number | null,
  reason: string,
  sectionPath: string | undefined,
): Buffer {
  const parts: Buffer[] = [present(page !== null)];
  if (page !== null) parts.push(u32be(page));
  const rb = Buffer.from(reason, 'utf8');
  parts.push(u32be(rb.length), rb);
  parts.push(present(sectionPath !== undefined));
  if (sectionPath !== undefined) {
    const sb = Buffer.from(sectionPath, 'utf8');
    parts.push(u32be(sb.length), sb);
  }
  return Buffer.concat(parts);
}
