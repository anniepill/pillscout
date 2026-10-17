/**
 * The record-comment gate: a record carries data and plain section labels,
 * and no free-text notes. Authoring reasoning lives in the room's authoring
 * notes (room data of the full pipeline, not shipped here), which are history
 * and never a source for a field. No
 * comment in a record is typed: the title is derived from a field and every
 * heading from the key it sits above.
 *
 * Comments are read through the yaml CST, never by matching text: a CST token
 * of type `comment` is a comment, so a `#` inside a quoted or block scalar is
 * never one. Every comment must fill its line, and every comment line must be
 * exactly one of these:
 *
 * - TITLE: `# PillScout ingredient profile - ` and the record's
 *   substance_identity.preferred_display_name, exactly once, on line 1. A
 *   comment line that starts with that prefix is a title line.
 * - RULE: `#`, one space and RULE_DASHES dashes, at column 0. The length is
 *   measured, not chosen: all 560 rules in the 21 records were 70 dashes.
 *   Every rule belongs to a block.
 * - HEADING: any comment line with a RULE directly above it and a RULE directly
 *   below it. The three lines are a block. The block sits directly above a
 *   top-level key, found through the parsed document (plain, quoted or
 *   hyphenated, with or without a comment after it on its line): only blank
 *   lines may come between the block and the key's line. The heading names the
 *   key under the word rule (headingWords, keyWords).
 * - END: `# end of record`, exactly once, and the last line of the file.
 *
 * A file holding a carriage return or a byte order mark gets one finding that
 * names which, and no other: every line of such a file would otherwise be
 * misread, and a finding for each would describe the wrong defect.
 *
 * Scope: ingredients/records/*.yaml only. validator-core's validateFile runs it
 * on a path under ingredients/records/, beside checkRequiredBlocks.
 */
import { Parser, isMap, isScalar, parseDocument } from 'yaml';

export const RULE_DASHES = 70;
export const RULE_LINE = `# ${'-'.repeat(RULE_DASHES)}`;
export const TITLE_PREFIX = '# PillScout ingredient profile - ';
export const END_LINE = '# end of record';
/** The one word the word rule ignores, on both sides. */
export const IGNORED_WORD = 'and';

export const FAILURE_CLASSES = [
  'carriage_return',
  'byte_order_mark',
  'comment_after_data',
  'comment_not_allowed',
  'rule_without_heading',
  'comment_between_heading_and_key',
  'heading_not_above_key',
  'heading_spacing',
  'heading_empty_word',
  'key_empty_word',
  'heading_not_key',
  'title_count',
  'title_not_first',
  'title_without_display_name',
  'title_not_display_name',
  'end_count',
  'end_not_last',
] as const;
export type CommentFailureClass = (typeof FAILURE_CLASSES)[number];

export interface CommentFinding {
  readonly line: number;
  readonly failureClass: CommentFailureClass;
  readonly text: string;
  readonly detail: string;
}

/** What this gate does not check, printed by the full pipeline's corpus-wide runner (not shipped here). */
export const NOT_CHECKED: readonly string[] = [
  'prose inside field values',
];

/**
 * The heading's words: the text after `# `, split on single spaces, each word
 * split on `-`. A heading with a double, leading or trailing space has an
 * empty word between spaces; a word made only of hyphens, or with a leading or
 * trailing hyphen, has an empty part. Both are returned as found, and the
 * caller refuses them. Nothing is collapsed or trimmed.
 */
export function headingWords(heading: string): { spaced: string[]; parts: string[] } {
  const spaced = heading.split(' ');
  return { spaced, parts: spaced.flatMap((w) => w.split('-')) };
}

/** The key's words: split on `_` and `-`, as found. */
export function keyWords(key: string): string[] {
  return key.split(/[_-]/);
}

/** Lowercase, then drop IGNORED_WORD. Nothing else is ignored. */
export function comparable(words: readonly string[]): string[] {
  return words.map((w) => w.toLowerCase()).filter((w) => w !== IGNORED_WORD);
}

/** Line number (1-based) of each offset. */
function lineIndex(text: string): (offset: number) => number {
  const starts = [0];
  for (let i = 0; i < text.length; i++) if (text[i] === '\n') starts.push(i + 1);
  return (off: number): number => {
    let lo = 0;
    let hi = starts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (starts[mid]! <= off) lo = mid;
      else hi = mid - 1;
    }
    return lo + 1;
  };
}

/** The lines that hold a comment token, with whether data precedes it on the line. */
function commentLines(text: string, lineOf: (off: number) => number): Map<number, { afterData: boolean }> {
  const offsets = new Set<number>();
  const visit = (node: unknown): void => {
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (node === null || typeof node !== 'object') return;
    const t = node as { type?: unknown; offset?: unknown };
    if (t.type === 'comment' && typeof t.offset === 'number') {
      offsets.add(t.offset);
      return;
    }
    for (const v of Object.values(node)) visit(v);
  };
  for (const token of new Parser().parse(text)) visit(token);
  const out = new Map<number, { afterData: boolean }>();
  for (const off of offsets) {
    const n = lineOf(off);
    const lineStart = text.lastIndexOf('\n', off - 1) + 1;
    const before = text.slice(lineStart, off);
    out.set(n, { afterData: (out.get(n)?.afterData ?? false) || !/^[ \t]*$/.test(before) });
  }
  return out;
}

/** Each top-level key of the parsed document, by the line its key starts on. */
function topLevelKeys(text: string, lineOf: (off: number) => number): Map<number, unknown> {
  const doc = parseDocument(text);
  const out = new Map<number, unknown>();
  if (!isMap(doc.contents)) return out;
  for (const pair of doc.contents.items) {
    const key = pair.key as { range?: [number, number, number] } | null;
    if (key?.range) out.set(lineOf(key.range[0]), isScalar(pair.key) ? pair.key.value : pair.key);
  }
  return out;
}

/** The display name the title is derived from, or null where the record has none. */
function displayName(text: string): string | null {
  try {
    const doc = parseDocument(text).toJS() as unknown;
    const si = doc !== null && typeof doc === 'object' ? (doc as Record<string, unknown>)['substance_identity'] : undefined;
    const name = si !== null && typeof si === 'object' ? (si as Record<string, unknown>)['preferred_display_name'] : undefined;
    return typeof name === 'string' && name !== '' ? name : null;
  } catch {
    return null;
  }
}

/**
 * Every comment-line finding in one record's text. An empty list is a pass.
 * Line numbers are 1-based.
 */
export function checkRecordComments(text: string): CommentFinding[] {
  if (text.includes('\r')) {
    const line = text.slice(0, text.indexOf('\r')).split('\n').length;
    return [{ line, failureClass: 'carriage_return', text: '', detail: `the file holds a carriage return (U+000D), first on line ${line}; a record's lines end with a line feed alone` }];
  }
  if (text.includes('\uFEFF')) {
    const line = text.slice(0, text.indexOf('\uFEFF')).split('\n').length;
    return [{ line, failureClass: 'byte_order_mark', text: '', detail: `the file holds a byte order mark (U+FEFF), first on line ${line}; a record holds none` }];
  }

  const lines = text.split('\n');
  // A final newline ends the last line; it does not start another.
  if (lines.length > 1 && lines[lines.length - 1] === '') lines.pop();
  const lineOf = lineIndex(text);
  const comments = commentLines(text, lineOf);
  const keys = topLevelKeys(text, lineOf);
  const out: CommentFinding[] = [];
  const raw = (n: number): string => lines[n - 1] ?? '';
  const push = (line: number, failureClass: CommentFailureClass, detail: string): void => {
    out.push({ line, failureClass, text: raw(line), detail });
  };
  const fullLine = (n: number): boolean => comments.has(n) && !comments.get(n)!.afterData;
  const isRule = (n: number): boolean => fullLine(n) && raw(n) === RULE_LINE;

  const titles: number[] = [];
  const ends: number[] = [];
  const headings: number[] = [];
  const inBlock = new Set<number>();

  // Blocks first: any full-line comment with a rule directly above and below.
  for (const n of [...comments.keys()].sort((a, b) => a - b)) {
    if (fullLine(n) && !isRule(n) && isRule(n - 1) && isRule(n + 1)) {
      headings.push(n);
      inBlock.add(n - 1).add(n).add(n + 1);
    }
  }

  // After each block: the comment lines before its first data line, and that line.
  const between = new Map<number, number>(); // comment line -> the heading it follows
  const nextData = new Map<number, number>(); // heading -> first line after the block that is neither blank nor a full-line comment
  for (const h of headings) {
    let j = h + 2;
    const seen: number[] = [];
    while (j <= lines.length && (raw(j).trim() === '' || fullLine(j))) {
      if (fullLine(j)) seen.push(j);
      j++;
    }
    // Only where a data line ends the run: with nothing after, nothing stands between.
    if (j <= lines.length) for (const k of seen) between.set(k, h);
    nextData.set(h, j);
  }

  for (const [n, c] of [...comments.entries()].sort((a, b) => a[0] - b[0])) {
    const l = raw(n);
    if (c.afterData) {
      push(n, 'comment_after_data', `line ${n} holds a comment after data on the same line`);
      continue;
    }
    // Counted wherever they stand, so a count never misstates the record.
    if (l.startsWith(TITLE_PREFIX)) titles.push(n);
    if (l === END_LINE) ends.push(n);
    if (between.has(n)) {
      push(n, 'comment_between_heading_and_key', `line ${n} holds a comment between the heading at line ${between.get(n)} and the next data line; only blank lines stand there`);
      continue;
    }
    if (inBlock.has(n) || l.startsWith(TITLE_PREFIX) || l === END_LINE) continue;
    if (l === RULE_LINE) {
      push(n, 'rule_without_heading', `line ${n} is a rule with no heading between it and another rule`);
      continue;
    }
    push(
      n,
      'comment_not_allowed',
      `line ${n} holds a comment that is not the title line, a rule of ${RULE_DASHES} dashes at column 0, ` +
        'a line between two rules, or the end line',
    );
  }

  for (const h of headings) {
    const label = raw(h).startsWith('# ') ? raw(h).slice(2) : null;
    const j = nextData.get(h)!;
    let keyLine: number | null = null;
    for (let k = h + 2; k <= lines.length; k++) {
      if (keys.has(k)) {
        keyLine = k;
        break;
      }
    }
    if (keyLine === null) {
      push(h, 'heading_not_above_key', `the heading at line ${h} has no top-level key after it`);
      continue;
    }
    if (j !== keyLine) {
      push(h, 'heading_not_above_key', `the heading at line ${h} is followed by data at line ${j} before the top-level key at line ${keyLine}`);
      continue;
    }
    const key = keys.get(keyLine);
    if (typeof key !== 'string') {
      push(h, 'heading_not_key', `the heading at line ${h} sits above a top-level key at line ${keyLine} that is not a string`);
      continue;
    }
    if (label === null) {
      push(h, 'heading_spacing', `the heading at line ${h} does not start with "#" and one space`);
      continue;
    }
    const { spaced, parts } = headingWords(label);
    if (spaced.some((w) => w === '')) {
      push(h, 'heading_spacing', `the heading at line ${h} reads "${label}", which has a double, leading or trailing space; words are separated by exactly one space`);
      continue;
    }
    if (parts.some((w) => w === '')) {
      push(h, 'heading_empty_word', `the heading at line ${h} reads "${label}", which has an empty word where a hyphen starts, ends or repeats`);
      continue;
    }
    const kw = keyWords(key);
    if (kw.some((w) => w === '')) {
      push(h, 'key_empty_word', `the heading at line ${h} sits above the key "${key}", which has an empty word where an underscore or hyphen starts, ends or repeats`);
      continue;
    }
    const a = comparable(parts);
    const b = comparable(kw);
    if (a.length !== b.length || a.some((w, i) => w !== b[i])) {
      push(
        h,
        'heading_not_key',
        `the heading at line ${h} reads "${label}" and the key below it is "${key}": lowercased, with "${IGNORED_WORD}" removed, ` +
          `the heading's words are [${a.join(', ')}] and the key's are [${b.join(', ')}]`,
      );
    }
  }

  if (titles.length !== 1) {
    push(titles[1] ?? 1, 'title_count', `the record holds ${titles.length} title line(s); a record holds exactly one`);
  } else {
    const t = titles[0]!;
    if (t !== 1) push(t, 'title_not_first', `the title line is line ${t}; the title line is line 1`);
    const name = displayName(text);
    if (name === null) {
      push(t, 'title_without_display_name', `the record has no non-empty substance_identity.preferred_display_name, so its title cannot be derived`);
    } else if (raw(t) !== `${TITLE_PREFIX}${name}`) {
      push(t, 'title_not_display_name', `the title line reads "${raw(t)}" and the record's display name is "${name}"; the title is "${TITLE_PREFIX}${name}"`);
    }
  }
  if (ends.length !== 1) {
    push(ends[1] ?? lines.length, 'end_count', `the record holds ${ends.length} end line(s); a record holds exactly one`);
  } else if (ends[0] !== lines.length) {
    push(ends[0]!, 'end_not_last', `the end line is line ${ends[0]} and the record runs to line ${lines.length}`);
  }

  return out.sort((a, b) => a.line - b.line);
}
