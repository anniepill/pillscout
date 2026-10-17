import { mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import { LISTED_TOP_LEVEL_KEYS } from './topLevelKeys.js';
import { CONDITIONAL_BLOCKS, REQUIRED_BLOCKS } from './requiredBlocks.js';
import {
  FIELD_SCHEMAS,
  RECORD_ROOT_CLASS,
  TOP_LEVEL_KEY_CLASS,
  TOP_LEVEL_KEY_NOT_CHECKED,
  checkTopLevelKeys,
  isRegisteredTopLevelKey,
  recordRootShape,
  validateFile,
} from '../cli/validator-core.js';
import { FAILURE_CLASSES as COMMENT_CLASSES } from '../record-comments/check.js';

const RECORDS_DIR = fileURLToPath(new URL('../../ingredients/records/', import.meta.url));
const inFieldSchemas = (k: string): boolean => Object.prototype.hasOwnProperty.call(FIELD_SCHEMAS, k);
const inRequired = (k: string): boolean => (REQUIRED_BLOCKS as readonly string[]).includes(k);
const inConditional = (k: string): boolean => Object.values(CONDITIONAL_BLOCKS).some((l) => l.includes(k));
const inBlocks = (k: string): boolean => inRequired(k) || inConditional(k);
const inList = (k: string): boolean => (LISTED_TOP_LEVEL_KEYS as readonly string[]).includes(k);

/** A file at ingredients/records/mint.yaml under a fresh temporary root. */
const recordFile = (text: string): string => {
  const root = mkdtempSync(join(tmpdir(), 'top-level-keys-'));
  mkdirSync(join(root, 'ingredients/records'), { recursive: true });
  const file = join(root, 'ingredients/records/mint.yaml');
  writeFileSync(file, text);
  return file;
};
const keyFindings = (file: string): string[] =>
  validateFile(file).failures.filter((x) => x.field === TOP_LEVEL_KEY_CLASS).map((x) => x.path);
const rootFindings = (file: string): unknown[] =>
  validateFile(file).failures.filter((x) => x.field === RECORD_ROOT_CLASS).map((x) => x.value);

describe('a registered top-level key, in each of the three places', () => {
  it('in REQUIRED_BLOCKS only', () => {
    expect([inRequired('friction'), inConditional('friction'), inList('friction')]).toEqual([true, false, false]);
    expect(checkTopLevelKeys({ friction: [] }, 'mint.yaml')).toEqual([]);
  });

  it('in CONDITIONAL_BLOCKS only, in the real registries', () => {
    expect([inRequired('reference_values'), inConditional('reference_values'), inList('reference_values')]).toEqual([false, true, false]);
    expect(checkTopLevelKeys({ reference_values: [] }, 'mint.yaml')).toEqual([]);
  });

  it('in CONDITIONAL_BLOCKS only, through a test registry', () => {
    const registries = { requiredBlocks: [], conditionalBlocks: { herb: ['herb_only_block'] }, listed: [] };
    expect(isRegisteredTopLevelKey('herb_only_block', registries)).toBe(true);
    expect(checkTopLevelKeys({ herb_only_block: [] }, 'mint.yaml', registries)).toEqual([]);
    expect(checkTopLevelKeys({ herb_only_block: [] }, 'mint.yaml', { ...registries, conditionalBlocks: {} }).map((x) => x.path)).toEqual([
      'herb_only_block',
    ]);
  });

  it('in LISTED_TOP_LEVEL_KEYS only', () => {
    expect([inBlocks('id'), inList('id')]).toEqual([false, true]);
    expect(checkTopLevelKeys({ id: 'mint' }, 'mint.yaml')).toEqual([]);
  });
});

describe('FIELD_SCHEMAS registers no top-level key', () => {
  it('refuses a key FIELD_SCHEMAS names and the block registries and the list do not', () => {
    for (const k of ['evidence_outcome', 'source_position', 'source_directive', 'citations']) {
      expect([k, inFieldSchemas(k), inBlocks(k), inList(k)]).toEqual([k, true, false, false]);
    }
    expect(
      checkTopLevelKeys({ evidence_outcome: 'positive_finding', source_position: 'not_recommended' }, 'mint.yaml').map((x) => x.path),
    ).toEqual(['evidence_outcome', 'source_position']);
  });

  it('driving_and_machinery, which only FIELD_SCHEMAS registered before, is in the list', () => {
    expect([inFieldSchemas('driving_and_machinery'), inBlocks('driving_and_machinery'), inList('driving_and_machinery')]).toEqual([
      true,
      false,
      true,
    ]);
  });
});

describe('an unregistered top-level key', () => {
  it('is refused, naming the file, the key and the places a key is registered', () => {
    const f = checkTopLevelKeys({ id: 'mint', do_not_cite_the_WHO_row_here: 'yes' }, 'ingredients/records/mint.yaml');
    expect(f).toHaveLength(1);
    expect(f[0]?.field).toBe(TOP_LEVEL_KEY_CLASS);
    expect(f[0]?.path).toBe('do_not_cite_the_WHO_row_here');
    expect(f[0]?.message).toBe(
      'ingredients/records/mint.yaml has the top-level key "do_not_cite_the_WHO_row_here", which is not registered; ' +
        'a top-level key is registered in REQUIRED_BLOCKS or CONDITIONAL_BLOCKS (schema/record-blocks/requiredBlocks.ts) ' +
        'or in LISTED_TOP_LEVEL_KEYS (schema/record-blocks/topLevelKeys.ts)',
    );
  });

  it('refuses a sentence heading over a key coined to match it', () => {
    const R = `# ${'-'.repeat(70)}`;
    const file = recordFile(
      [
        '# PillScout ingredient profile - Mint',
        '',
        'substance_identity:',
        '  preferred_display_name: Mint',
        '',
        R,
        '# Do not cite the WHO row here',
        R,
        '',
        'do_not_cite_the_WHO_row_here: yes',
        '',
        '# end of record',
        '',
      ].join('\n'),
    );
    const res = validateFile(file);
    // The comment gate passes it, which is why this gate exists.
    expect(res.failures.filter((x) => (COMMENT_CLASSES as readonly string[]).includes(x.field))).toEqual([]);
    expect(res.failures.filter((x) => x.field === TOP_LEVEL_KEY_CLASS).map((x) => x.path)).toEqual(['do_not_cite_the_WHO_row_here']);
  });

  it('refuses constructor and __proto__ as own keys, and validateFile does not throw', () => {
    expect(checkTopLevelKeys(parse('constructor: x\n__proto__:\n  unregistered_note: "a note"\nid: mint\n'), 'mint.yaml').map((x) => x.path)).toEqual([
      'constructor',
      '__proto__',
    ]);
    const file = recordFile('constructor: x\n__proto__:\n  unregistered_note: "a note"\nid: mint\n');
    expect(() => validateFile(file)).not.toThrow();
    expect(keyFindings(file)).toEqual(['constructor', '__proto__']);
  });

  it('is not checked outside ingredients/records/', () => {
    const root = mkdtempSync(join(tmpdir(), 'top-level-keys-'));
    const file = join(root, 'elsewhere.yaml');
    writeFileSync(file, 'do_not_cite_the_WHO_row_here: yes\n');
    expect(validateFile(file).failures.filter((x) => x.field === TOP_LEVEL_KEY_CLASS)).toEqual([]);
  });
});

describe('a root that is not a block mapping', () => {
  it.each([
    ['a list', '- unregistered_note: "a note"\n', 'a list'],
    ['!!pairs', '!!pairs\n- unregistered_note: "a note"\n- id: mint\n', 'a tagged collection (tag:yaml.org,2002:pairs)'],
    ['!!set', '!!set\n? unregistered_note\n? id\n', 'a tagged collection (tag:yaml.org,2002:set)'],
    ['!!omap', '!!omap\n- unregistered_note: "a note"\n- id: mint\n', 'a tagged collection (tag:yaml.org,2002:omap)'],
    ['a scalar', 'unregistered note\n', 'a scalar'],
    ['null', 'null\n', 'null'],
    ['an empty file', '', 'empty'],
    ['a flow mapping', '{id: mint, unregistered_note: "a note"}\n', 'a flow mapping'],
  ])('%s gets one finding saying what the root is, and no key is read', (_name, text, shape) => {
    const file = recordFile(text);
    expect(rootFindings(file)).toEqual([shape]);
    expect(keyFindings(file)).toEqual([]);
    const f = validateFile(file).failures.find((x) => x.field === RECORD_ROOT_CLASS);
    expect(f?.path).toBe('(root)');
    expect(f?.message).toBe(`${file} has a root that is ${shape}; a record's root is a block mapping of top-level keys`);
  });

  it('refuses a one-line flow-map record, whose heading was read against the wrong key', () => {
    const R = `# ${'-'.repeat(70)}`;
    const file = recordFile(
      [
        '# PillScout ingredient profile - Mint',
        '',
        R,
        '# Substance identity',
        R,
        '{substance_identity: {preferred_display_name: Mint}, id: mint}',
        '',
        '# end of record',
        '',
      ].join('\n'),
    );
    expect(rootFindings(file)).toEqual(['a flow mapping']);
  });

  it('a block mapping is not refused', () => {
    expect(recordRootShape('id: mint\n')).toBeNull();
    expect(rootFindings(recordFile('id: mint\n'))).toEqual([]);
  });
});

describe('keys below the top level', () => {
  it('names what it does not check', () => {
    expect(TOP_LEVEL_KEY_NOT_CHECKED).toEqual(['keys below the top level, which are checked only inside a block whose schema is strict']);
  });

  it('a nested key under a block with no strict schema passes', () => {
    const file = recordFile('substance_identity:\n  preferred_display_name: Mint\n  unregistered_note: "a sentence in a nested key"\n');
    const notComment = validateFile(file).failures.filter((x) => !(COMMENT_CLASSES as readonly string[]).includes(x.field));
    expect(notComment.filter((x) => JSON.stringify(x).includes('unregistered_note'))).toEqual([]);
  });

  it('a nested key inside a strict block is refused', () => {
    const file = recordFile('source_scope_evaluated:\n  unregistered_note: "a sentence in a nested key"\n');
    const f = validateFile(file).failures.filter((x) => x.path === 'source_scope_evaluated');
    expect(f.some((x) => x.message.includes('unregistered_note'))).toBe(true);
  });
});

describe('the corpus', () => {
  const records = readdirSync(RECORDS_DIR).filter((f) => f.endsWith('.yaml')).sort();
  const keys = new Set<string>();
  for (const r of records) for (const k of Object.keys(parse(readFileSync(join(RECORDS_DIR, r), 'utf8')) as object)) keys.add(k);

  it('reads the 1 record present', () => {
    expect(records).toHaveLength(1);
  });

  it('every top-level key in the corpus is registered', () => {
    for (const k of keys) expect(isRegisteredTopLevelKey(k), k).toBe(true);
  });

  it('every record passes, and every root is a block mapping', () => {
    for (const r of records) {
      const text = readFileSync(join(RECORDS_DIR, r), 'utf8');
      expect(recordRootShape(text), r).toBeNull();
      expect(checkTopLevelKeys(parse(text), r), r).toEqual([]);
    }
  });

  it('the list holds only keys the required-blocks registry does not name', () => {
    for (const k of LISTED_TOP_LEVEL_KEYS) expect([k, inBlocks(k)]).toEqual([k, false]);
  });

  it('the list has no duplicate', () => {
    expect(new Set(LISTED_TOP_LEVEL_KEYS).size).toBe(LISTED_TOP_LEVEL_KEYS.length);
  });

  it('the list holds 24 keys', () => {
    expect(LISTED_TOP_LEVEL_KEYS).toHaveLength(24);
  });
});
