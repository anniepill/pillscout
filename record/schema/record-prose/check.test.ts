import { mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import { NOT_CHECKED, PROSE_STAMP_CLASS, checkProseStampNames } from './check.js';
import { validateFile } from '../cli/validator-core.js';

const RECORDS_DIR = fileURLToPath(new URL('../../ingredients/records/', import.meta.url));
const paths = (doc: unknown): string[] => checkProseStampNames(doc).map((f) => f.path);

describe('the tokens', () => {
  it.each([
    'source_position',
    'source_directive',
    'regulator_position',
    'sourcePosition',
    'sourceDirective',
    'regulatorPosition',
    'not_recommended',
    'use_with_caution',
    'ask_before_use',
    'stop_use_and_ask',
    'ask_for_use_beyond_duration',
    'ask_if_symptoms_persist',
  ])('refuses a prose value naming %s', (token) => {
    expect(checkProseStampNames({ rationale: `The citation carries ${token} here.` })).toEqual([
      { path: 'rationale', tokens: [token], text: `The citation carries ${token} here.` },
    ]);
  });

  it('refuses the former field name as wrapped text left it', () => {
    expect(checkProseStampNames({ gap: 'no regulator_ position is set' })[0]?.tokens).toEqual(['regulator_ position']);
  });

  it('names each token found once, in reading order', () => {
    expect(checkProseStampNames({ gap: 'use_with_caution, then source_position, then use_with_caution' })[0]?.tokens).toEqual([
      'use_with_caution',
      'source_position',
    ]);
  });

  it('matches a token bounded by punctuation', () => {
    expect(paths({ gap: 'a stamp (source_position).' })).toEqual(['gap']);
  });

  it('does not match a token inside a longer identifier', () => {
    expect(paths({ gap: 'the not_recommended_by list and xsource_position here' })).toEqual([]);
  });

  it('matches without regard to case, naming the token as found', () => {
    expect(checkProseStampNames({ gap: 'The stamp is Not_Recommended and the field is Source_Position.' })[0]?.tokens).toEqual([
      'Not_Recommended',
      'Source_Position',
    ]);
    expect(checkProseStampNames({ gap: 'the SOURCEPOSITION field' })[0]?.tokens).toEqual(['SOURCEPOSITION']);
  });

  it('matches a token a folded block wrapped after an underscore', () => {
    expect(checkProseStampNames(parse('gap: >\n  the field source_\n  position is set\n'))[0]?.tokens).toEqual(['source_ position']);
    expect(checkProseStampNames(parse('gap: >\n  the field source_\n  directive is set\n'))[0]?.tokens).toEqual(['source_ directive']);
  });

  it('matches a token a literal block broke after an underscore', () => {
    expect(checkProseStampNames(parse('gap: |\n  the field source_\n  position is set\n'))[0]?.tokens).toEqual(['source_\nposition']);
  });

  it('does not match a hyphen or a space in place of the underscore, or an invisible character inside a token', () => {
    expect(paths({ gap: 'the value is not-recommended here' })).toEqual([]);
    expect(paths({ gap: 'The source position is not recommended.' })).toEqual([]);
    expect(paths({ gap: 'The value is not_\u200Brecommended for adults.' })).toEqual([]);
  });

  it('does not read contraindicated, avoid or not_reported as tokens', () => {
    expect(paths({ gap: 'it is contraindicated; avoid it; the band is not_reported' })).toEqual([]);
  });
});

describe('what it reads', () => {
  it('reads strings at any depth, in maps and lists, and names the path', () => {
    const doc = { a: { b: ['plain words here', { c: 'carries source_directive too' }] } };
    expect(paths(doc)).toEqual(['a.b[1].c']);
  });

  it('reads a list item under a key that is not a source-text key', () => {
    expect(paths({ notes: ['first plain item', 'second not_recommended item'] })).toEqual(['notes[1]']);
  });

  it('reads a key named version_history below the top level', () => {
    expect(paths({ friction: { version_history: 'a source_position b' } })).toEqual(['friction.version_history']);
  });

  it('returns nothing for a document that is not a map', () => {
    expect(checkProseStampNames(null)).toEqual([]);
    expect(checkProseStampNames('a source_position b')).toEqual([]);
    expect(checkProseStampNames(['a source_position b'])).toEqual([]);
  });
});

describe('the three exemptions', () => {
  it('the top-level version_history subtree', () => {
    expect(paths({ version_history: [{ summary: 'loses source_position use_with_caution' }] })).toEqual([]);
  });

  it('a value under a key isSourceTextKey names', () => {
    expect(paths({ citations: [{ verbatim: 'it is not_recommended for' }] })).toEqual([]);
  });

  it('a parent-scoped source-text key, only under its parent', () => {
    expect(paths({ stamp_marks: [{ span: 'is not_recommended for' }] })).toEqual([]);
    expect(paths({ other_marks: [{ span: 'is not_recommended for' }] })).toEqual(['other_marks[0].span']);
  });

  it('a string in a list directly under a source-text key', () => {
    expect(paths({ human_relevance: { hedge_tokens: ['may be not_recommended'] } })).toEqual([]);
  });

  it('nothing deeper than a direct string or a direct list of strings', () => {
    expect(paths({ citations: [{ verbatim: { comment: 'the source_position is not_recommended for adults' } }] })).toEqual([
      'citations[0].verbatim.comment',
    ]);
    expect(paths({ citations: [{ verbatim: [['a not_recommended b']] }] })).toEqual(['citations[0].verbatim[0][0]']);
    expect(paths({ citations: [{ verbatim: [{ comment: 'a not_recommended b' }] }] })).toEqual(['citations[0].verbatim[0].comment']);
  });

  it('a parent-scoped key in a list of maps is still direct', () => {
    expect(paths({ dispositions: [{ note: 'the source_position is not_recommended for adults' }] })).toEqual([]);
  });

  it('a bare identifier once trailing whitespace is trimmed', () => {
    expect(paths({ source_position: 'not_recommended', rationale: 'source_position' })).toEqual([]);
    expect(paths({ rationale: 'is not_recommended' })).toEqual(['rationale']);
  });

  it('a lone enum value with the newline a block scalar adds is exempt', () => {
    expect(paths({ source_position: 'not_recommended\n' })).toEqual([]);
    expect(paths(parse('source_position: |\n  not_recommended\n'))).toEqual([]);
  });

  it('a value with no whitespace that is not a bare identifier is read', () => {
    expect(paths({ a: 'not_recommended.', b: '(not_recommended)', c: 'source_position=not_recommended' })).toEqual(['a', 'b', 'c']);
  });

  it('leading whitespace is not trimmed', () => {
    expect(paths({ gap: ' not_recommended' })).toEqual(['gap']);
  });
});

describe('through validateFile', () => {
  const record = (text: string): string => {
    const root = mkdtempSync(join(tmpdir(), 'record-prose-'));
    mkdirSync(join(root, 'ingredients/records'), { recursive: true });
    const file = join(root, 'ingredients/records/mint.yaml');
    writeFileSync(file, text);
    return file;
  };

  it('refuses as a failure naming the file, the path, the token and the condition', () => {
    const file = record('citation_gaps:\n  - gap: "no source_position derives from it"\n');
    const res = validateFile(file);
    const f = res.failures.filter((x) => x.field === PROSE_STAMP_CLASS);
    expect(f.map((x) => x.path)).toEqual(['citation_gaps[0].gap']);
    expect(f[0]?.message).toBe(
      `${file} at citation_gaps[0].gap names "source_position"; ` +
        'a prose value outside version_history and the source-text keys names no stamp field or stamp value',
    );
    expect(res.warnings.filter((x) => x.field === PROSE_STAMP_CLASS)).toEqual([]);
  });

  it('is not checked outside ingredients/records/', () => {
    const root = mkdtempSync(join(tmpdir(), 'record-prose-'));
    const file = join(root, 'elsewhere.yaml');
    writeFileSync(file, 'gap: "no source_position derives from it"\n');
    expect(validateFile(file).failures.filter((x) => x.field === PROSE_STAMP_CLASS)).toEqual([]);
  });

  it('names what it does not check', () => {
    expect(NOT_CHECKED).toEqual([
      'contraindicated, avoid and not_reported, which are words sources print',
      'prose about a stamp that names no token: a paraphrase, a space or hyphen in place of an underscore, or an invisible character inside a token',
    ]);
  });
});

describe('the corpus', () => {
  const records = readdirSync(RECORDS_DIR).filter((f) => f.endsWith('.yaml')).sort();

  it('reads the 1 record present', () => {
    expect(records).toHaveLength(1);
  });

  it('every record passes', () => {
    for (const r of records) expect(checkProseStampNames(parse(readFileSync(join(RECORDS_DIR, r), 'utf8'))), r).toEqual([]);
  });

  it('every record passes through validateFile', () => {
    for (const r of records) {
      expect(validateFile(join(RECORDS_DIR, r)).failures.filter((x) => x.field === PROSE_STAMP_CLASS), r).toEqual([]);
    }
  });
});
