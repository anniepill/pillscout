/**
 * The prose-stamp gate: a record's prose does not say what its stamps are.
 * The stamp fields, source_position and source_directive, are the record's
 * statement of its stamps; a prose sentence that restates them goes false when
 * they change. 22 prose values in 7 records once named source_position, some
 * of them falsely; those words were removed, and this gate refuses all 22.
 *
 * It reads every string value in the parsed record, at any depth and under any
 * key, and refuses one that names a stamp field or a stamp value (the tokens
 * below). Three exemptions, and no other:
 *
 * - the top-level version_history subtree, which is history;
 * - a string directly under a key isSourceTextKey names
 *   (schema/byte-hygiene/sourceText.ts), or a string in a list directly under
 *   one, where the source speaks; nothing deeper;
 * - a value that, with trailing whitespace trimmed, is a bare identifier of
 *   letters, digits and underscores: an enum value on its own field, such as
 *   `source_position: not_recommended`, a block scalar's newline included.
 *
 * A token is matched whole-word, without regard to case, and with optional
 * whitespace after each underscore, so a token a folded or literal block
 * wrapped at an underscore is still one token. Scope: ingredients/records/*.yaml
 * only; validator-core's validateFile runs it on a path under
 * ingredients/records/, beside the comment and top-level key gates.
 */
import { isSourceTextKey } from '../byte-hygiene/sourceText.js';

/** The stamp fields, their former name and their camelCase forms. */
export const STAMP_FIELD_TOKENS: readonly string[] = [
  'source_position',
  'source_directive',
  'regulator_position',
  'sourcePosition',
  'sourceDirective',
  'regulatorPosition',
];

/**
 * The stamp values that are distinct identifiers. contraindicated and avoid
 * are words sources print, and not_reported is the silence value of many
 * enums, so none of the three is a token.
 */
export const STAMP_VALUE_TOKENS: readonly string[] = [
  'not_recommended',
  'use_with_caution',
  'ask_before_use',
  'stop_use_and_ask',
  'ask_for_use_beyond_duration',
  'ask_if_symptoms_persist',
];

/** A token as a pattern: each underscore may be followed by whitespace. */
const tokenPattern = (token: string): string => token.split('_').join('_\\s*');

const TOKEN_RE = new RegExp(
  `(?<![A-Za-z0-9_])(?:${[...STAMP_FIELD_TOKENS, ...STAMP_VALUE_TOKENS].map(tokenPattern).join('|')})(?![A-Za-z0-9_])`,
  'gi',
);

/** The one-token exemption: a bare identifier once trailing whitespace is trimmed. */
const BARE_IDENTIFIER = /^[A-Za-z0-9_]+$/;

export const PROSE_STAMP_CLASS = 'prose_names_stamp';

export const PROSE_STAMP_CONDITION =
  'a prose value outside version_history and the source-text keys names no stamp field or stamp value';

/** What this gate does not check, printed by the full pipeline's corpus-wide runner (not shipped here). */
export const NOT_CHECKED: readonly string[] = [
  'contraindicated, avoid and not_reported, which are words sources print',
  'prose about a stamp that names no token: a paraphrase, a space or hyphen in place of an underscore, or an invisible character inside a token',
];

export interface ProseStampFinding {
  readonly path: string;
  readonly tokens: readonly string[];
  readonly text: string;
}

/** The tokens a string names, as found, in reading order, each once. */
export function stampTokens(text: string): string[] {
  return [...new Set([...text.matchAll(TOKEN_RE)].map((m) => m[0]))];
}

export function checkProseStampNames(doc: unknown): ProseStampFinding[] {
  const out: ProseStampFinding[] = [];
  const check = (text: string, path: string): void => {
    if (BARE_IDENTIFIER.test(text.trimEnd())) return;
    const tokens = stampTokens(text);
    if (tokens.length > 0) out.push({ path, tokens, text });
  };
  // `key` is the key the node hangs under and `parent` the key of the map that
  // holds it, lists passing both through, so `stamp_marks[0].span` has the key
  // span and the parent stamp_marks. `direct` is false for a list inside a
  // list, which is deeper than the source-text exemption reaches.
  const walk = (node: unknown, path: string, key: string | undefined, parent: string | undefined, direct: boolean): void => {
    const sourceText = direct && key !== undefined && isSourceTextKey(key, parent);
    if (typeof node === 'string') {
      if (!sourceText) check(node, path);
      return;
    }
    if (Array.isArray(node)) {
      node.forEach((item, i) => {
        if (typeof item === 'string') {
          if (!sourceText) check(item, `${path}[${i}]`);
        } else {
          walk(item, `${path}[${i}]`, key, parent, false);
        }
      });
      return;
    }
    if (node !== null && typeof node === 'object') {
      for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
        if (path === '' && k === 'version_history') continue;
        walk(v, path === '' ? k : `${path}.${k}`, k, key, true);
      }
    }
  };
  if (doc === null || typeof doc !== 'object' || Array.isArray(doc)) return out;
  walk(doc, '', undefined, undefined, true);
  return out;
}
