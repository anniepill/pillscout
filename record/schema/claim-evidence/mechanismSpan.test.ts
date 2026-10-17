import { describe, expect, it } from 'vitest';
import { citationElementSchema } from './citationElement.js';
import { effectSchema, effectsSchema } from './effectSpan.js';
import { MECHANISM_MARK_KINDS, MECHANISM_MARK_REASONS, ROLES, mechanismMarksSchema, mechanismSchema, mechanismsSchema, namedSchema } from './mechanismSpan.js';

// The mechanism and effect fields. Expected sets are literals from the settled
// spec.

const base = {
  source: 'fda',
  document_id: 'fda_dailymed_tacrolimus_setid_1e56c550',
  section: '7.9',
  section_title: "St. John's Wort (Hypericum perforatum)",
  evidence_locator: 'x',
  verbatim: "St. John's Wort induces CYP3A enzymes and may decrease tacrolimus whole blood concentrations.",
};
const span = "St. John's Wort induces CYP3A enzymes and may decrease tacrolimus whole blood concentrations.";

describe('the mechanism', () => {
  it('carries its span, and a value only beside it', () => {
    expect(mechanismSchema.safeParse({ process: 'induction', target: ['CYP3A'], agent: { term: "St. John's Wort", role: 'ingredient' }, hedge_tokens: ['may'], mechanism_span: span }).success).toBe(true);
    expect(mechanismSchema.safeParse({ process: 'induction', target: ['CYP3A'], agent: "St. John's Wort", mechanism_span: span }).success).toBe(false);
    expect(mechanismSchema.safeParse({ process: 'unknown', target: [], mechanism_span: 'The exact mechanism is not known.' }).success).toBe(true);
    expect(mechanismSchema.safeParse({ process: 'induction', target: ['CYP3A'] }).success).toBe(false);
    expect(mechanismSchema.safeParse({ process: 'induction', target: [], mechanism_span: '' }).success).toBe(false);
    expect(mechanismSchema.safeParse({ process: 'induction', target: [], mechanism_span: span, hedge_tokens: [] }).success).toBe(false);
    expect(mechanismSchema.safeParse({ process: 'induction', target: [], mechanism_span: span, pathway: 'CYP3A' }).success).toBe(false);
  });

  it('carries its target as a list, the shape of an effect\'s object', () => {
    expect(mechanismSchema.safeParse({ process: 'induction', target: ['CYP3A4', 'CYP2B6'], mechanism_span: span }).success).toBe(true);
    expect(mechanismSchema.safeParse({ process: 'induction', target: 'CYP3A4', mechanism_span: span }).success).toBe(false);
    expect(mechanismSchema.safeParse({ process: 'induction', mechanism_span: span }).success).toBe(false);
  });
});

describe('the effect', () => {
  it('carries its span and an object list that may be empty', () => {
    expect(effectSchema.safeParse({ parameter: 'concentrations', direction: 'decreased', object: [{ term: 'tacrolimus', role: 'partner' }], hedge_tokens: ['may'], effect_span: span }).success).toBe(true);
    expect(effectSchema.safeParse({ parameter: 'concentrations', direction: 'decreased', object: ['tacrolimus'], effect_span: span }).success).toBe(false);
    expect(effectSchema.safeParse({ parameter: 'bleeding', direction: 'increased', object: [], effect_span: 'x' }).success).toBe(true);
    expect(effectSchema.safeParse({ parameter: 'bleeding', direction: 'increased', effect_span: 'x' }).success).toBe(false);
    expect(effectSchema.safeParse({ parameter: 'bleeding', direction: 'increased', object: 'x', effect_span: 'x' }).success).toBe(false);
    expect(effectSchema.safeParse({ parameter: 'bleeding', direction: 'increased', object: [] }).success).toBe(false);
  });
});

describe('the roles and the lists', () => {
  it('a printed agent or object carries one of four roles', () => {
    expect([...ROLES]).toEqual(['ingredient', 'constituent', 'partner', 'other']);
    expect(namedSchema.safeParse({ term: 'GABA', role: 'other' }).success).toBe(true);
    expect(namedSchema.safeParse({ term: 'GABA', role: 'substance' }).success).toBe(false);
    expect(namedSchema.safeParse({ term: '', role: 'other' }).success).toBe(false);
  });

  it('a citation carries its mechanisms and effects as lists of one or more', () => {
    const m = { process: 'induction', target: ['CYP3A4'], mechanism_span: span };
    expect(mechanismsSchema.safeParse([m, { ...m, target: ['CYP2C9'] }]).success).toBe(true);
    expect(mechanismsSchema.safeParse([]).success).toBe(false);
    expect(mechanismsSchema.safeParse(m).success).toBe(false);
    const e = { parameter: 'dry mouth', direction: 'occur', object: [], effect_span: 'x' };
    expect(effectsSchema.safeParse([e, { ...e, parameter: 'flatulence' }]).success).toBe(true);
    expect(effectsSchema.safeParse(e).success).toBe(false);
  });
});

describe('the mechanism marks', () => {
  it('are two kinds, the six original reasons, carried_by_stamp, other_partner, third_party_subject and partner_own_action', () => {
    expect([...MECHANISM_MARK_KINDS]).toEqual(['not_a_mechanism', 'not_an_effect']);
    expect([...MECHANISM_MARK_REASONS]).toEqual([
      'partner_class',
      'instruction_or_guidance',
      'negated',
      'table_or_list',
      'site_only',
      'other_sense',
      'carried_by_stamp',
      'other_partner',
      'third_party_subject',
      'partner_own_action',
    ]);
    // partner_own_action, the tenth reason now that not_yet_derivable is retired.
    expect(mechanismMarksSchema.safeParse([{ kind: 'not_an_effect', reason: 'partner_own_action', span: 'Statin medications reduce cholesterol synthesis.' }]).success).toBe(true);
    expect(mechanismMarksSchema.safeParse([{ kind: 'not_an_effect', reason: 'instruction_or_guidance', span: 'If adverse reactions occur' }]).success).toBe(true);
    expect(mechanismMarksSchema.safeParse([{ kind: 'not_an_effect', reason: 'duration', span: 'x' }]).success).toBe(false);
    expect(mechanismMarksSchema.safeParse([]).success).toBe(false);
  });

  it('no mark carries the retired not_yet_derivable reason, and no mark carries a class', () => {
    expect((MECHANISM_MARK_REASONS as readonly string[]).includes('not_yet_derivable')).toBe(false);
    const mark = { kind: 'not_a_mechanism', reason: 'partner_class', span: 'by binding' };
    expect(mechanismMarksSchema.safeParse([mark]).success).toBe(true);
    // The enum refuses the retired reason, with the class it carried and without.
    expect(mechanismMarksSchema.safeParse([{ ...mark, reason: 'not_yet_derivable', class: 'one_party_mutual' }]).success).toBe(false);
    expect(mechanismMarksSchema.safeParse([{ ...mark, reason: 'not_yet_derivable' }]).success).toBe(false);
    expect(mechanismMarksSchema.safeParse([{ ...mark, kind: 'not_an_effect', reason: 'not_yet_derivable', class: 'row_gap' }]).success).toBe(false);
    // The strict object refuses a class on a reason of the set: the key, not its value.
    const refused = mechanismMarksSchema.safeParse([{ ...mark, class: 'one_party_mutual' }]);
    expect(refused.success).toBe(false);
    expect(refused.success ? [] : refused.error.issues.map((i) => [i.code, i.path.join('.')])).toEqual([['unrecognized_keys', '0']]);
    expect(mechanismMarksSchema.safeParse([{ ...mark, class: 'hard' }]).success).toBe(false);
  });
});

describe('the effect condition', () => {
  it('is an optional list of printed phrases, never empty', () => {
    const e = { parameter: 'kidney stones', direction: 'contribute', object: [], effect_span: 'x' };
    expect(effectsSchema.safeParse([{ ...e, condition_spans: ['in patients with pre-existing hyperoxaluria'] }]).success).toBe(true);
    // A list: one condition is a list of one, two are in reading order; the old key is gone.
    expect(effectsSchema.safeParse([{ ...e, condition_spans: ['Acute intakes of more than 20 mg/kg iron', 'especially if food is not taken'] }]).success).toBe(true);
    expect(effectsSchema.safeParse([{ ...e, condition_spans: [] }]).success).toBe(false);
    expect(effectsSchema.safeParse([{ ...e, condition_spans: 'in patients with pre-existing hyperoxaluria' }]).success).toBe(false);
    expect(effectsSchema.safeParse([{ ...e, condition_span: 'in patients with pre-existing hyperoxaluria' }]).success).toBe(false);
    expect(effectsSchema.safeParse([e]).success).toBe(true);
    expect(effectsSchema.safeParse([{ ...e, condition_spans: [''] }]).success).toBe(false);
  });
});

describe('the citation element', () => {
  it('admits the three keys, the two fields as lists', () => {
    const mechanism = { process: 'induction', target: ['CYP3A'], agent: { term: "St. John's Wort", role: 'ingredient' }, hedge_tokens: ['may'], mechanism_span: span };
    const effect = { parameter: 'concentrations', direction: 'decreased', object: [{ term: 'tacrolimus', role: 'partner' }], hedge_tokens: ['may'], effect_span: span };
    expect(citationElementSchema.safeParse({ ...base, mechanism: [mechanism], effect: [effect] }).success).toBe(true);
    expect(citationElementSchema.safeParse({ ...base, mechanism, effect: [effect] }).success).toBe(false);
    expect(citationElementSchema.safeParse({ ...base, mechanism_marks: [{ kind: 'not_a_mechanism', reason: 'partner_class', span: 'induces' }] }).success).toBe(true);
    // A citation carries no not_yet_derivable mark and no class.
    expect(citationElementSchema.safeParse({ ...base, mechanism_marks: [{ kind: 'not_a_mechanism', reason: 'not_yet_derivable', class: 'row_gap', span: 'induces' }] }).success).toBe(false);
    expect(citationElementSchema.safeParse({ ...base, mechanism_marks: [{ kind: 'not_a_mechanism', reason: 'partner_class', class: 'row_gap', span: 'induces' }] }).success).toBe(false);
    expect(citationElementSchema.safeParse({ ...base, mechanism: [{ process: 'induction' }] }).success).toBe(false);
    expect(citationElementSchema.safeParse({ ...base, mechanism_span: span }).success).toBe(false);
  });
});
