import { describe, it, expect } from 'vitest';
import { sourceDirectiveSchema } from './sourceDirective.js';
import { citationElementSchema } from './citationElement.js';

describe('sourceDirectiveSchema', () => {
  it('holds exactly the five settled values', () => {
    expect([...sourceDirectiveSchema.options].sort()).toEqual([
      'ask_before_use',
      'ask_for_use_beyond_duration',
      'ask_if_symptoms_persist',
      'avoid',
      'stop_use_and_ask',
    ]);
  });
  // Admitted at 0 uses; the schema file's header says why.
  it('accepts ask_if_symptoms_persist', () => {
    expect(sourceDirectiveSchema.parse('ask_if_symptoms_persist')).toBe('ask_if_symptoms_persist');
  });
  // The generic consult sentence takes NO value, so there is no token for it.
  it('has no value for the generic consult sentence', () => {
    expect(() => sourceDirectiveSchema.parse('consult_if_adverse_reactions')).toThrow();
    expect(() => sourceDirectiveSchema.parse('generic_consult')).toThrow();
  });
  // The census label for the beyond-duration shape is not the settled token.
  it('rejects the census label beyond_duration', () => {
    expect(() => sourceDirectiveSchema.parse('beyond_duration')).toThrow();
  });
  it('rejects empty string', () => {
    expect(() => sourceDirectiveSchema.parse('')).toThrow();
  });
});

describe('source_directive on the citation element', () => {
  const base = {
    source: 'health_canada_nnhpd',
    document_id: 'd',
    section: 's',
    section_title: 't',
    evidence_locator: null,
    verbatim: 'Ask a doctor before use.',
  };
  it('is optional', () => {
    expect(citationElementSchema.safeParse(base).success).toBe(true);
  });
  // The two fields may co-occur on one citation.
  it('may sit beside source_position', () => {
    const c = { ...base, source_directive: 'ask_before_use', source_position: 'contraindicated' };
    expect(citationElementSchema.safeParse(c).success).toBe(true);
  });
  it('refuses a value outside the enum', () => {
    expect(citationElementSchema.safeParse({ ...base, source_directive: 'ask' }).success).toBe(false);
  });
  // source_directive is the settled name. An earlier working name must not parse.
  it('refuses the earlier working name regulator_directive', () => {
    expect(
      citationElementSchema.safeParse({ ...base, regulator_directive: 'ask_before_use' }).success,
    ).toBe(false);
  });
});
