import { mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  END_LINE,
  FAILURE_CLASSES,
  IGNORED_WORD,
  NOT_CHECKED,
  RULE_DASHES,
  RULE_LINE,
  TITLE_PREFIX,
  checkRecordComments,
  comparable,
  type CommentFailureClass,
} from './check.js';
import { checkCommentGrammar, isRecordPath, validateFile } from '../cli/validator-core.js';

const RECORDS_DIR = fileURLToPath(new URL('../../ingredients/records/', import.meta.url));
const R = `# ${'-'.repeat(70)}`;
const TITLE = `${TITLE_PREFIX}Mint`;

/** A record whose every comment line is allowed. Each case changes one thing. */
const BASE: readonly string[] = [
  TITLE, //                                            1
  '', //                                               2
  'id: mint', //                                       3
  '', //                                               4
  R, //                                                5
  '# Substance identity', //                           6
  R, //                                                7
  '', //                                               8
  'substance_identity:', //                            9
  '  preferred_display_name: Mint', //                 10
  '', //                                               11
  R, //                                                12
  '# Reference values', //                             13
  R, //                                                14
  '', //                                               15
  'reference_values:', //                              16
  '  - construct: rda', //                             17
  '    label: "an # inside a quoted string is not a comment"', // 18
  '  - construct: ul', //                              19
  '    text: |', //                                    20
  '      # a block-scalar line is not a comment', //   21
  '', //                                               22
  END_LINE, //                                         23
];
const text = (lines: readonly string[]): string => `${lines.join('\n')}\n`;
const classes = (t: string): CommentFailureClass[] => checkRecordComments(t).map((f) => f.failureClass);
/** BASE with its line i (0-based) replaced, or with lines inserted before it. */
const replace = (i: number, line: string): string[] => BASE.map((l, j) => (j === i ? line : l));
const at = (i: number, ...insert: string[]): string[] => [...BASE.slice(0, i), ...insert, ...BASE.slice(i)];
/** A small record: title, display name, one block above `key`, end line. */
const small = (heading: string, keyLine: string, extra: string[] = []): string =>
  text([TITLE, '', 'substance_identity:', '  preferred_display_name: Mint', '', R, heading, R, '', keyLine, ...extra, '', END_LINE]);

/**
 * Every refusal case: its input and the classes it must produce, exactly. The
 * class-coverage test below runs these and reads the classes they produce, so
 * a class no case reaches fails it.
 */
const CASES: { name: string; input: string; want: CommentFailureClass[] }[] = [
  // Checked first: a carriage return or byte order mark gets one finding naming which, no other.
  { name: 'a carriage return before every line feed', input: text(BASE).replace(/\n/g, '\r\n'), want: ['carriage_return'] },
  { name: 'a carriage return as the only line ending', input: text(BASE).replace(/\n/g, '\r'), want: ['carriage_return'] },
  { name: 'a byte order mark before the title', input: `\uFEFF${text(BASE)}`, want: ['byte_order_mark'] },
  { name: 'a comment after data on the same line', input: text(replace(2, 'id: mint # a note')), want: ['comment_after_data'] },
  { name: 'a bare "#" outside a block', input: text(at(10, '#')), want: ['comment_not_allowed'] },
  { name: 'a prose comment', input: text(at(10, '# Mint is authored against the spine.')), want: ['comment_not_allowed'] },
  { name: 'an indented prose comment', input: text(at(10, '  # a note inside a block')), want: ['comment_not_allowed'] },
  // The sub-heading class is gone, so both of its notes are refused.
  { name: 'a sub-heading carrying an eight-word note', input: text(at(17, '  # --- Do not treat this block as verified yet ---')), want: ['comment_not_allowed'] },
  { name: 'a sub-heading that is a sentence', input: text(at(17, '  # --- See the room notes, then stop ---')), want: ['comment_not_allowed'] },
  { name: 'a plain sub-heading', input: text(at(17, '  # --- FNB RDA and AI ---')), want: ['comment_not_allowed'] },
  { name: 'a lone rule', input: text(at(10, R)), want: ['rule_without_heading'] },
  { name: 'a heading with no rule below it', input: text(BASE.filter((_, j) => j !== 6)), want: ['rule_without_heading', 'comment_not_allowed'] },
  { name: 'a rule one dash short', input: text(replace(4, `# ${'-'.repeat(69)}`)), want: ['comment_not_allowed', 'comment_not_allowed', 'rule_without_heading'] },
  { name: 'a rule one dash long', input: text(replace(4, `# ${'-'.repeat(71)}`)), want: ['comment_not_allowed', 'comment_not_allowed', 'rule_without_heading'] },
  { name: 'an indented block', input: text(BASE.map((l, j) => (j >= 4 && j <= 6 ? `  ${l}` : l))), want: ['comment_not_allowed', 'comment_not_allowed', 'comment_not_allowed'] },
  { name: 'a comment between the block and its key', input: text(at(8, '# prose before the key')), want: ['comment_between_heading_and_key'] },
  { name: 'a block above a nested key', input: text([TITLE, '', 'substance_identity:', R, '# Preferred display name', R, '  preferred_display_name: Mint', '', END_LINE]), want: ['heading_not_above_key'] },
  { name: 'a block above no key', input: text([TITLE, '', 'substance_identity:', '  preferred_display_name: Mint', '', R, '# Friction', R, '', END_LINE]), want: ['heading_not_above_key'] },
  { name: 'a block above nested data, with a top-level key further on', input: text([TITLE, '', 'substance_identity:', R, '# Friction', R, '  preferred_display_name: Mint', 'friction: []', '', END_LINE]), want: ['heading_not_above_key'] },
  // A double space is refused, and says so.
  { name: 'a heading with a double space', input: small('# Notes  here', 'notes_here: 1'), want: ['heading_spacing'] },
  { name: 'a heading with a trailing space', input: small('# Notes here ', 'notes_here: 1'), want: ['heading_spacing'] },
  { name: 'a bare "#" between two rules', input: small('#', 'notes: 1'), want: ['heading_spacing'] },
  // Nothing is collapsed or trimmed.
  { name: 'a heading whose extra words are hyphens only', input: small('# Notes here -- --', 'notes_here: 1'), want: ['heading_empty_word'] },
  { name: 'a key with a leading underscore', input: small('# Notes', '_notes: 1'), want: ['key_empty_word'] },
  { name: 'a heading that names another key', input: text(replace(5, '# Pregnancy and lactation')), want: ['heading_not_key'] },
  { name: 'a heading carrying a parenthetical', input: text(replace(5, '# Substance identity (record-level)')), want: ['heading_not_key'] },
  { name: 'a second ignored word', input: small('# Pregnancy or lactation', 'pregnancy_lactation: 1'), want: ['heading_not_key'] },
  // The title is the display name, and nothing more.
  { name: 'a title carrying a note', input: text(replace(0, `${TITLE}. Do not cite the WHO monograph; the UL row was dropped because EFSA had not published.`)), want: ['title_not_display_name'] },
  { name: 'a title in another case', input: text(replace(0, `${TITLE_PREFIX}mint`)), want: ['title_not_display_name'] },
  { name: 'a record with no display name', input: text(BASE.filter((_, j) => j !== 9)), want: ['title_without_display_name'] },
  { name: 'no title line', input: text(BASE.slice(2)), want: ['title_count'] },
  { name: 'two title lines', input: text(at(2, TITLE)), want: ['title_count'] },
  { name: 'the title line not on line 1', input: text(['id: mint', ...BASE.filter((_, j) => j !== 2)]), want: ['title_not_first'] },
  { name: 'a first line not in the title form', input: text(replace(0, '# Ingredient profile - Mint')), want: ['comment_not_allowed', 'title_count'] },
  { name: 'no end line', input: text(BASE.slice(0, -1)), want: ['end_count'] },
  { name: 'two end lines', input: text(at(8, END_LINE)), want: ['comment_between_heading_and_key', 'end_count'] },
  { name: 'data after the end line', input: text([...BASE, 'friction: []']), want: ['end_not_last'] },
  { name: 'a blank line after the end line', input: text([...BASE, '']), want: ['end_not_last'] },
  { name: 'an empty file', input: '', want: ['title_count', 'end_count'] },
];

describe('the allowed forms', () => {
  it('passes a record holding only the title, rule-heading-rule blocks and the end line', () => {
    expect(checkRecordComments(text(BASE))).toEqual([]);
  });

  it('never reads a "#" inside a quoted or block scalar as a comment', () => {
    // The lines must hold "#" for this test to mean anything.
    expect(BASE[17]).toContain('#');
    expect(BASE[20]).toContain('#');
    const lines = checkRecordComments(text(BASE)).map((f) => f.line);
    expect(lines).not.toContain(18);
    expect(lines).not.toContain(21);
  });

  it('states the rule length it was measured at', () => {
    expect(RULE_DASHES).toBe(70);
    expect(RULE_LINE).toBe(R);
  });

  it('names what it does not check', () => {
    expect(NOT_CHECKED).toEqual(['prose inside field values']);
  });

  it('finds the key through the parse: quoted', () => {
    expect(classes(small('# Pharmacology', '"pharmacology": {}'))).toEqual([]);
  });

  it('finds the key through the parse: hyphenated', () => {
    expect(classes(small('# Dose-scoped', 'dose-scoped: 1'))).toEqual([]);
  });

  it('finds the key on a line that also holds a comment, and refuses only that comment', () => {
    const f = checkRecordComments(small('# Notes', 'notes: x # note on this key'));
    expect(f.map((x) => [x.line, x.failureClass])).toEqual([[10, 'comment_after_data']]);
  });

  it('allows a nine-word heading that names a nine-word key', () => {
    expect(classes(small('# Alpha Beta Gamma Delta Epsilon Zeta Eta Theta Iota', 'alpha_beta_gamma_delta_epsilon_zeta_eta_theta_iota: 1'))).toEqual([]);
  });

  it('allows digits and a long word', () => {
    expect(classes(small('# Item 2', 'item_2: 1'))).toEqual([]);
    expect(classes(small(`# ${'a'.repeat(81)}`, `${'a'.repeat(81)}: 1`))).toEqual([]);
  });

  it('ignores "and" on both sides, and nothing else', () => {
    expect(IGNORED_WORD).toBe('and');
    expect(classes(small('# Pregnancy and lactation', 'pregnancy_lactation: 1'))).toEqual([]);
    expect(classes(small('# Pregnancy lactation', 'pregnancy_and_lactation: 1'))).toEqual([]);
    expect(classes(small('# Other warnings and precautions', 'other_warnings_and_precautions: 1'))).toEqual([]);
    expect(comparable(['Of', 'And', 'the'])).toEqual(['of', 'the']);
  });

  it('reads case as no difference and a hyphen as a word break', () => {
    expect(classes(text(replace(5, '# Substance-Identity')))).toEqual([]);
  });

  it('allows blank lines between the block and its key', () => {
    expect(classes(text(at(8, '', '')))).toEqual([]);
  });
});

describe('each refusal', () => {
  for (const c of CASES) {
    it(c.name, () => {
      expect(classes(c.input)).toEqual(c.want);
    });
  }

  it('a carriage return or byte order mark yields no finding but its own', () => {
    for (const c of CASES.slice(0, 3)) expect(checkRecordComments(c.input)).toHaveLength(1);
  });

  it('a heading that does not name its key prints both', () => {
    const f = checkRecordComments(text(replace(5, '# Pregnancy and lactation')))[0];
    expect(f?.detail).toContain('"Pregnancy and lactation"');
    expect(f?.detail).toContain('"substance_identity"');
    expect(f?.detail).toContain('[pregnancy, lactation]');
    expect(f?.detail).toContain('[substance, identity]');
  });

  it('a block above no key and a block above nested data are told apart', () => {
    const none = checkRecordComments(CASES.find((c) => c.name === 'a block above no key')!.input)[0];
    expect(none?.detail).toContain('has no top-level key after it');
    const nested = checkRecordComments(CASES.find((c) => c.name.startsWith('a block above nested data'))!.input)[0];
    expect(nested?.detail).toContain('is followed by data at line 7 before the top-level key at line 8');
  });

  it('a title carrying a note prints the display name the title derives from', () => {
    const f = checkRecordComments(CASES.find((c) => c.name.startsWith('a title carrying'))!.input)[0];
    expect(f?.detail).toContain('the record\'s display name is "Mint"');
  });

  it('every class is produced by some case', () => {
    // Derived from the findings the cases produce at runtime.
    const produced = new Set(CASES.flatMap((c) => classes(c.input)));
    expect([...produced].sort()).toEqual([...FAILURE_CLASSES].sort());
  });
});

describe('the gate in validator-core', () => {
  const root = mkdtempSync(join(tmpdir(), 'record-comments-'));
  const recordFile = join(root, 'ingredients/records/mint.yaml');
  mkdirSync(join(root, 'ingredients/records'), { recursive: true });
  const otherFile = join(root, 'elsewhere.yaml');

  it('scopes itself to ingredients/records/<name>.yaml', () => {
    expect(isRecordPath('ingredients/records/mint.yaml')).toBe(true);
    expect(isRecordPath('/x/ingredients/records/mint.yaml')).toBe(true);
    expect(isRecordPath('ingredients/records/sub/mint.yaml')).toBe(false);
    expect(isRecordPath('schema/cli/__fixtures__/mint.yaml')).toBe(false);
    expect(isRecordPath('ingredients/_rooms/mint/authoring_notes.md')).toBe(false);
  });

  it('turns each finding into a failure of the record', () => {
    const lines = at(8, '# a prose note.');
    writeFileSync(recordFile, text(lines));
    const res = validateFile(recordFile);
    const f = res.failures.filter((x) => x.field === 'comment_between_heading_and_key');
    expect(f).toHaveLength(1);
    expect(f[0]?.path).toBe('line 9');
    expect(checkCommentGrammar(text(lines))).toHaveLength(1);
  });

  it('does not read a file outside the records directory', () => {
    writeFileSync(otherFile, text(at(8, '# a prose note.')));
    expect(validateFile(otherFile).failures.filter((x) => (FAILURE_CLASSES as readonly string[]).includes(x.field))).toEqual([]);
  });
});

describe('the corpus', () => {
  const records = readdirSync(RECORDS_DIR).filter((f) => f.endsWith('.yaml')).sort();

  it('reads the 1 record present', () => {
    expect(records).toHaveLength(1);
  });

  it('every record passes', () => {
    for (const r of records) expect(checkRecordComments(readFileSync(join(RECORDS_DIR, r), 'utf8')), r).toEqual([]);
  });

  it('every rule in the corpus is the measured rule', () => {
    let rules = 0;
    for (const r of records) {
      for (const l of readFileSync(join(RECORDS_DIR, r), 'utf8').split('\n')) {
        if (/^\s*#\s*-{10,}\s*$/.test(l)) {
          rules++;
          expect(l, r).toBe(RULE_LINE);
        }
      }
    }
    expect(rules).toBe(46);
  });

  it('every record passes through validateFile', () => {
    for (const r of records) {
      const failures = validateFile(join(RECORDS_DIR, r)).failures.filter((x) => (FAILURE_CLASSES as readonly string[]).includes(x.field));
      expect(failures, r).toEqual([]);
    }
  });
});
