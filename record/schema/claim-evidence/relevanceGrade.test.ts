import { describe, expect, it } from 'vitest';
import {
  BIOLOGICAL_RELEVANCE_VALUES,
  CLINICAL_RELEVANCE_VALUES,
  GRADE_WITHOUT_FIELD_REASONS,
  HUMAN_RELEVANCE_VALUES,
  NOT_A_GRADE_REASONS,
  RELEVANCE_BASES,
  RELEVANCE_FIELDS,
  biologicalRelevanceSchema,
  clinicalRelevanceSchema,
  humanRelevanceSchema,
  relevanceGradeNotQuotableSchema,
  relevanceMarksSchema,
} from './relevanceGrade.js';
import { citationElementSchema } from './citationElement.js';

// The grade object as locked, with its later amendments. Expected sets are
// literals from the lock, never read off the module.

const grade = (over: Record<string, unknown> = {}): Record<string, unknown> => ({
  value: 'unknown',
  grade_span: 'the clinical significance of this interaction has not been established',
  bases: [{ basis: 'not_reported' }],
  findings: [{ finding_span: 'markedly decreased the in vitro dissolution' }],
  ...over,
});

describe('the value sets', () => {
  it('are the locked sets, per field', () => {
    expect([...RELEVANCE_FIELDS]).toEqual(['human_relevance', 'clinical_relevance', 'biological_relevance']);
    expect([...HUMAN_RELEVANCE_VALUES].sort()).toEqual(
      ['cannot_be_excluded', 'limited', 'not_relevant', 'questioned', 'relevant', 'unknown'],
    );
    expect([...CLINICAL_RELEVANCE_VALUES].sort()).toEqual(
      ['limited', 'minor', 'not_relevant', 'questioned', 'relevant', 'unknown'],
    );
    expect([...BIOLOGICAL_RELEVANCE_VALUES].sort()).toEqual(['not_relevant', 'relevant', 'unknown']);
    expect([...RELEVANCE_BASES].sort()).toEqual(
      ['exposure_above_use', 'not_reported', 'other_stated', 'species_specific_mechanism'],
    );
  });

  it('refuses a value the field does not admit', () => {
    expect(humanRelevanceSchema.safeParse([grade({ value: 'minor' })]).success).toBe(false);
    expect(clinicalRelevanceSchema.safeParse([grade({ value: 'cannot_be_excluded' })]).success).toBe(false);
    expect(biologicalRelevanceSchema.safeParse([grade({ value: 'questioned' })]).success).toBe(false);
    expect(clinicalRelevanceSchema.safeParse([grade({ value: 'minor' })]).success).toBe(true);
    expect(humanRelevanceSchema.safeParse([grade({ value: 'cannot_be_excluded' })]).success).toBe(true);
  });
});

describe('the grade object', () => {
  it('parses a whole grade', () => {
    expect(humanRelevanceSchema.safeParse([grade()]).success).toBe(true);
  });

  it('requires at least one finding: the link is mandatory', () => {
    expect(humanRelevanceSchema.safeParse([grade({ findings: [] })]).success).toBe(false);
    const { findings: _f, ...noFindings } = grade();
    expect(humanRelevanceSchema.safeParse([noFindings]).success).toBe(false);
  });

  it('requires a basis, and a basis_span for each stated basis', () => {
    expect(humanRelevanceSchema.safeParse([grade({ bases: [] })]).success).toBe(false);
    for (const basis of ['species_specific_mechanism', 'exposure_above_use', 'other_stated']) {
      expect(humanRelevanceSchema.safeParse([grade({ bases: [{ basis }] })]).success).toBe(false);
      expect(humanRelevanceSchema.safeParse([grade({ bases: [{ basis, basis_span: 'x' }] })]).success).toBe(true);
    }
    // not_reported records that the source gives none, so it carries no span.
    expect(humanRelevanceSchema.safeParse([grade({ bases: [{ basis: 'not_reported', basis_span: 'x' }] })]).success).toBe(false);
  });

  it('is strict, and refuses an empty list, an empty span or an empty hedge list', () => {
    expect(humanRelevanceSchema.safeParse([grade({ note: 'x' })]).success).toBe(false);
    expect(humanRelevanceSchema.safeParse([]).success).toBe(false);
    expect(humanRelevanceSchema.safeParse([grade({ grade_span: '' })]).success).toBe(false);
    expect(humanRelevanceSchema.safeParse([grade({ hedge_tokens: [] })]).success).toBe(false);
    expect(humanRelevanceSchema.safeParse([grade({ hedge_tokens: ['seems to be'] })]).success).toBe(true);
    expect(humanRelevanceSchema.safeParse([grade({ condition_span: 'As the daily intake' })]).success).toBe(true);
  });

  it('takes a not-quotable finding with an unrepresentable reason', () => {
    const nq = { source: 'ema_hmpc', document_id: 'EMA/HMPC/1/2020', locator: 'abc#u1', reason: 'page_yields_no_text' };
    expect(humanRelevanceSchema.safeParse([grade({ findings: [{ not_quotable: nq }] })]).success).toBe(true);
    expect(
      humanRelevanceSchema.safeParse([grade({ findings: [{ not_quotable: { ...nq, reason: 'unreadable' } }] })]).success,
    ).toBe(false);
    expect(relevanceGradeNotQuotableSchema.safeParse([nq]).success).toBe(true);
    expect(relevanceGradeNotQuotableSchema.safeParse([]).success).toBe(false);
  });
});

describe('the marks', () => {
  it('are the locked reasons, per kind', () => {
    expect([...NOT_A_GRADE_REASONS].sort()).toEqual([
      'exposure_critique',
      'extrapolation_out_of_scope',
      'heading_or_title',
      'other_sense',
      'regulatory_scope',
      'template_or_guidance',
      'warning_or_prediction',
    ]);
    expect([...GRADE_WITHOUT_FIELD_REASONS].sort()).toEqual(['attributed', 'evidence_type_unstated', 'table_cell']);
  });

  it('refuses a reason of the other kind', () => {
    expect(relevanceMarksSchema.safeParse([{ kind: 'not_a_grade', reason: 'heading_or_title', span: 'x' }]).success).toBe(true);
    expect(relevanceMarksSchema.safeParse([{ kind: 'not_a_grade', reason: 'attributed', span: 'x' }]).success).toBe(false);
    expect(relevanceMarksSchema.safeParse([{ kind: 'grade_without_field', reason: 'attributed', span: 'x' }]).success).toBe(true);
    expect(relevanceMarksSchema.safeParse([{ kind: 'grade_without_field', reason: 'other_sense', span: 'x' }]).success).toBe(false);
    expect(relevanceMarksSchema.safeParse([{ kind: 'evidence_request', reason: 'attributed', span: 'x' }]).success).toBe(false);
  });
});

describe('the citation element carries the five keys', () => {
  const base = {
    source: 'who',
    document_id: 'WHO/Monographs/Vol1/Cortex_Cinnamomi',
    section: 'Precautions',
    section_title: 'Precautions',
    evidence_locator: 'x',
    verbatim: 'x',
  };

  it('admits each, and still refuses a coined key', () => {
    expect(citationElementSchema.safeParse({ ...base, human_relevance: [grade()] }).success).toBe(true);
    expect(citationElementSchema.safeParse({ ...base, clinical_relevance: [grade()] }).success).toBe(true);
    expect(citationElementSchema.safeParse({ ...base, biological_relevance: [grade()] }).success).toBe(true);
    expect(
      citationElementSchema.safeParse({ ...base, relevance_marks: [{ kind: 'not_a_grade', reason: 'other_sense', span: 'x' }] })
        .success,
    ).toBe(true);
    expect(
      citationElementSchema.safeParse({
        ...base,
        relevance_grade_not_quotable: [{ source: 'who', document_id: 'd', locator: 'l', reason: 'page_yields_no_text' }],
      }).success,
    ).toBe(true);
    expect(citationElementSchema.safeParse({ ...base, relevance: [grade()] }).success).toBe(false);
  });
});
