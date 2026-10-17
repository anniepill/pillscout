/**
 * The 22-column manifest row: its column contract, its Zod schema, and the
 * reader that turns a room's manifest.csv (room data of the full pipeline,
 * not shipped here) into rows.
 *
 * The full pipeline's manifest schema document, not shipped here, is the
 * binding definition of column names, column order, types, allowed values,
 * required-ness and defaults. COLUMN_SPECS below encodes that table, and a
 * test in the full pipeline parses the document and fails when the two
 * disagree, so neither can drift silently.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { SOURCE_TOKENS, sourceTokenSchema } from './sourceToken.js';
// Reused, never reimplemented: a second CSV reader is a second set of quoting
// bugs, and the notes column carries commas and doubled quotes in most rooms.
import { splitCsvLine } from '../cli/detect-verbatim.js';

export const BYTE_STATES = ['held', 'governance_ceiling', 'not_retrieved'] as const;
export type ByteState = (typeof BYTE_STATES)[number];

export const RETRIEVAL_METHODS = [
  'curl',
  'manual_browser',
  'curl (wayback)',
  'url_verification',
  'unrecorded',
] as const;

export const SOURCE_CLASSES = ['1a', '1b', '2', '3', '4'] as const;

export const COMMERCIAL_STATUSES = [
  'commercial_permitted',
  'commercial_restricted',
  'cite_only',
  'licensed',
] as const;

export const PER_DOCUMENT_CHECK_STATUSES = [
  'not_required',
  'required_not_yet_performed',
  'required_completed_no_third_party_content',
  'required_completed_third_party_content_flagged',
] as const;

export const BOOLEANS = ['true', 'false'] as const;

/**
 * One row of the manifest schema document's column table. `required` carries the
 * document's own vocabulary: 'yes', 'no', or a condition string, so the
 * agreement test compares like with like instead of translating.
 */
export interface ColumnSpec {
  readonly name: string;
  readonly type: 'enum' | 'string' | 'date' | 'boolean' | 'free_text';
  /** Enum members, in the document's order. null where the type is not an enum. */
  readonly allowed: readonly string[] | null;
  readonly required: string;
  readonly default: string;
}

export const COLUMN_SPECS: readonly ColumnSpec[] = [
  { name: 'source', type: 'enum', allowed: SOURCE_TOKENS, required: 'yes', default: '(none)' },
  { name: 'document_id', type: 'string', allowed: null, required: 'yes', default: '(none)' },
  { name: 'canonical_filename', type: 'string', allowed: null, required: 'yes', default: '(none)' },
  {
    name: 'raw_path',
    type: 'string',
    allowed: null,
    required: 'iff byte_state=held',
    default: '(empty)',
  },
  { name: 'retrieval_url', type: 'string', allowed: null, required: 'yes', default: '(none)' },
  {
    name: 'retrieval_date',
    type: 'date',
    allowed: null,
    required: 'if byte_state!=not_retrieved',
    default: '(empty)',
  },
  {
    name: 'document_published_date',
    type: 'date',
    allowed: null,
    required: 'no',
    default: '(empty)',
  },
  { name: 'document_revision', type: 'string', allowed: null, required: 'no', default: '(empty)' },
  {
    name: 'retrieval_method',
    type: 'enum',
    allowed: RETRIEVAL_METHODS,
    required: 'if byte_state!=not_retrieved',
    default: '(empty)',
  },
  { name: 'notes', type: 'free_text', allowed: null, required: 'no', default: '(empty)' },
  {
    name: 'source_class',
    type: 'enum',
    allowed: SOURCE_CLASSES,
    required: 'yes',
    default: '(none)',
  },
  {
    name: 'commercial_status',
    type: 'enum',
    allowed: COMMERCIAL_STATUSES,
    required: 'yes',
    default: '(none)',
  },
  {
    name: 'extraction_prohibition_flag',
    type: 'boolean',
    allowed: BOOLEANS,
    required: 'yes',
    default: 'false',
  },
  {
    name: 'per_document_check_status',
    type: 'enum',
    allowed: PER_DOCUMENT_CHECK_STATUSES,
    required: 'yes',
    default: 'not_required',
  },
  {
    name: 'per_document_check_notes',
    type: 'free_text',
    allowed: null,
    required: 'no',
    default: '(empty)',
  },
  {
    name: 'archive_allowed_present_mode',
    type: 'boolean',
    allowed: BOOLEANS,
    required: 'yes',
    default: 'true',
  },
  {
    name: 'archive_allowed_transition_mode',
    type: 'boolean',
    allowed: BOOLEANS,
    required: 'yes',
    default: 'false',
  },
  { name: 'sui_generis_flag', type: 'boolean', allowed: BOOLEANS, required: 'yes', default: 'false' },
  {
    name: 'attribution_required',
    type: 'boolean',
    allowed: BOOLEANS,
    required: 'yes',
    default: 'false',
  },
  {
    name: 'attribution_template_ref',
    type: 'string',
    allowed: null,
    required: 'no',
    default: '(empty)',
  },
  {
    name: 'byte_state',
    type: 'enum',
    allowed: BYTE_STATES,
    required: 'yes',
    default: '(none)',
  },
  { name: 'superseded_by', type: 'string', allowed: null, required: 'no', default: '(empty)' },
];

/** The canonical header, in order. A manifest header must equal this exactly. */
export const MANIFEST_COLUMNS: readonly string[] = COLUMN_SPECS.map((c) => c.name);

/**
 * A conforming `document_revision`: a short discriminator token, never prose.
 * One alphanumeric, then up to 15 more alphanumerics, dots, underscores or
 * hyphens. Whitespace is excluded by construction, which is the property that
 * separates `r1` and `v2.1` from an SPL effective time or a portal string.
 *
 * Gated as `document_revision_token` once the non-conforming cells were
 * emptied.
 */
export const DOCUMENT_REVISION_TOKEN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,15}$/;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
/** ISO 8601 reduced precision: a year, a year and month, or a full date. */
const ISO_PARTIAL_DATE = /^\d{4}(-\d{2}(-\d{2})?)?$/;

const booleanCell = z.enum(BOOLEANS);

/** Shape only. Cross-field conditionals are applied by `checkRowContract`. */
export const manifestRowSchema = z.object({
  source: sourceTokenSchema,
  document_id: z.string().min(1),
  canonical_filename: z.string().min(1),
  raw_path: z.string(),
  retrieval_url: z.string().min(1),
  retrieval_date: z.string(),
  document_published_date: z.string(),
  document_revision: z.string(),
  retrieval_method: z.string(),
  notes: z.string(),
  source_class: z.enum(SOURCE_CLASSES),
  commercial_status: z.enum(COMMERCIAL_STATUSES),
  extraction_prohibition_flag: booleanCell,
  per_document_check_status: z.enum(PER_DOCUMENT_CHECK_STATUSES),
  per_document_check_notes: z.string(),
  archive_allowed_present_mode: booleanCell,
  archive_allowed_transition_mode: booleanCell,
  sui_generis_flag: booleanCell,
  attribution_required: booleanCell,
  attribution_template_ref: z.string(),
  byte_state: z.enum(BYTE_STATES),
  superseded_by: z.string(),
});

export type ManifestRow = z.infer<typeof manifestRowSchema>;

/** A row as read from disk, before validation: every cell a raw string. */
export type RawRow = Record<string, string>;

export interface RowLocation {
  readonly room: string;
  /** 1-based index among data rows, matching how a reader counts the file. */
  readonly line: number;
}

export interface RoomManifest {
  readonly room: string;
  readonly path: string;
  readonly header: readonly string[];
  readonly rows: readonly RawRow[];
}

/**
 * Read one room's manifest into raw string cells. Returns null where the room
 * has no manifest.csv, which the caller distinguishes from an empty manifest.
 */
export function readRoomManifest(roomsDir: string, room: string): RoomManifest | null {
  const path = join(roomsDir, room, 'manifest.csv');
  if (!existsSync(path)) return null;
  const lines = readFileSync(path, 'utf8')
    .split('\n')
    .filter((l) => l.trim() !== '');
  const headerLine = lines[0];
  if (headerLine === undefined) {
    return { room, path, header: [], rows: [] };
  }
  const header = splitCsvLine(headerLine);
  const rows: RawRow[] = [];
  for (const line of lines.slice(1)) {
    const cells = splitCsvLine(line);
    const row: RawRow = {};
    header.forEach((name, i) => {
      row[name] = (cells[i] ?? '').trim();
    });
    rows.push(row);
  }
  return { room, path, header, rows };
}

/**
 * The conditional half of the contract, which Zod's object shape cannot carry
 * because every rule here reads two cells at once. Each returned string is one
 * violation, phrased for a reader who has the row in front of them.
 *
 * Both halves of every conditional are checked. A column that must be present
 * under a condition must equally be absent otherwise; checking only presence
 * would let a retired `_PENDING` path linger in a row that says it holds
 * nothing, which is the exact defect the column was added to end.
 */
export function checkRowContract(row: RawRow): string[] {
  const out: string[] = [];
  const byteState = row['byte_state'] ?? '';
  const rawPath = row['raw_path'] ?? '';
  const retrievalDate = row['retrieval_date'] ?? '';
  const retrievalMethod = row['retrieval_method'] ?? '';

  if (byteState === 'held') {
    if (rawPath === '') {
      out.push('byte_state is held but raw_path is empty; a held row names its bytes');
    }
  } else if (rawPath !== '') {
    out.push(
      `byte_state is ${byteState} but raw_path is "${rawPath}"; a row that holds no bytes ` +
        'must not name a location, which is what the _PENDING convention did',
    );
  }

  // `if`, not `iff`. A not_retrieved row may leave both empty, and may equally
  // carry them: a document nobody fetched can still have had its URL checked,
  // which is what url_verification records. Forcing the cells empty would erase
  // a true record of work done, and pushing the fact into notes would bury it
  // where nothing can query it.
  if (byteState !== 'not_retrieved') {
    if (retrievalDate === '') {
      out.push('retrieval_date is empty on a row whose byte_state is not not_retrieved');
    }
    if (retrievalMethod === '') {
      out.push('retrieval_method is empty on a row whose byte_state is not not_retrieved');
    }
  }

  // The two date columns carry different precisions on purpose. A retrieval
  // happens on a day, so retrieval_date is full precision. A document's
  // publication date is the source's own, and many authorities state only a
  // year: requiring a day would force authoring to invent precision the source
  // does not carry.
  if (retrievalDate !== '' && !ISO_DATE.test(retrievalDate)) {
    out.push(`retrieval_date is "${retrievalDate}", which is not ISO 8601 YYYY-MM-DD`);
  }
  const published = row['document_published_date'] ?? '';
  if (published !== '' && !ISO_PARTIAL_DATE.test(published)) {
    out.push(
      `document_published_date is "${published}", which is not ISO 8601 ` +
        'YYYY, YYYY-MM or YYYY-MM-DD',
    );
  }

  if (retrievalMethod !== '' && !(RETRIEVAL_METHODS as readonly string[]).includes(retrievalMethod)) {
    out.push(
      `retrieval_method is "${retrievalMethod}", which is not one of: ` +
        RETRIEVAL_METHODS.join(', '),
    );
  }

  // The source token is deliberately not checked here. It is its own failure
  // class in the full pipeline's manifest check (not shipped here), and
  // reporting it twice would make one defect look like two.

  return out;
}
