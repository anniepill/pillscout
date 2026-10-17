import { describe, expect, it } from 'vitest';
import { citationElementSchema } from './citationElement.js';
import {
  AGE_BANDS,
  NOT_A_STAMP_REASONS,
  STAMP_FIELDS,
  STAMP_MARK_REASONS,
  STAMP_SPAN_OF,
  SUBJECT_MARK_REASONS,
  stampMarksSchema,
} from './stampSpan.js';

// The stamp spans and marks. Expected sets are literals from the settled spec.

const base = {
  source: 'ema_hmpc',
  document_id: 'EMA/HMPC/246774/2009',
  section: '4.6',
  section_title: 'Fertility, pregnancy and lactation',
  evidence_locator: 'x',
  verbatim: 'In the absence of sufficient data, the use during pregnancy and lactation is not recommended.',
};

describe('the stamp spans', () => {
  it('pair each stamp field with its span key', () => {
    expect(STAMP_SPAN_OF).toEqual({ source_position: 'position_span', source_directive: 'directive_span' });
    expect(STAMP_FIELDS).toEqual(['source_position', 'source_directive']);
  });

  it('are keys the citation element admits, non-empty', () => {
    expect(citationElementSchema.safeParse({ ...base, source_position: 'not_recommended', position_span: 'not recommended' }).success).toBe(true);
    expect(citationElementSchema.safeParse({ ...base, source_directive: 'ask_before_use', directive_span: 'before use' }).success).toBe(true);
    expect(citationElementSchema.safeParse({ ...base, position_span: '' }).success).toBe(false);
    expect(citationElementSchema.safeParse({ ...base, stamp_span: 'not recommended' }).success).toBe(false);
  });
});

describe('the stamp marks', () => {
  it('are the closed set of five reasons, split by kind, attributed in place of speaker_not_regulator', () => {
    expect([...STAMP_MARK_REASONS].sort()).toEqual([
      'assessment_report_narrative',
      'attributed',
      'co_behavior_avoid',
      'other_target',
      'subject_term_coined',
    ]);
    expect([...NOT_A_STAMP_REASONS]).toEqual(['assessment_report_narrative', 'attributed', 'co_behavior_avoid', 'other_target']);
    expect([...SUBJECT_MARK_REASONS]).toEqual(['subject_term_coined']);
    expect(stampMarksSchema.safeParse([{ kind: 'not_a_stamp', reason: 'speaker_not_regulator', span: 'x' }]).success).toBe(false);
  });

  it('refuse a reason of the other kind, an unknown kind and an empty list', () => {
    expect(stampMarksSchema.safeParse([{ kind: 'not_a_stamp', reason: 'attributed', span: 'x' }]).success).toBe(true);
    expect(stampMarksSchema.safeParse([{ kind: 'subject_coined', reason: 'subject_term_coined', span: 'x' }]).success).toBe(true);
    expect(stampMarksSchema.safeParse([{ kind: 'not_a_stamp', reason: 'subject_term_coined', span: 'x' }]).success).toBe(false);
    expect(stampMarksSchema.safeParse([{ kind: 'subject_coined', reason: 'other_target', span: 'x' }]).success).toBe(false);
    expect(stampMarksSchema.safeParse([{ kind: 'not_a_grade', reason: 'other_target', span: 'x' }]).success).toBe(false);
    expect(stampMarksSchema.safeParse([]).success).toBe(false);
    expect(citationElementSchema.safeParse({ ...base, stamp_marks: [{ kind: 'not_a_stamp', reason: 'other_target', span: 'x' }] }).success).toBe(true);
  });
});

describe('the condition and its bands', () => {
  it('are keys the citation element admits: a non-empty condition, and bands the age table holds', () => {
    const qualified = { ...base, source_position: 'not_recommended', position_span: 'not recommended' };
    expect(citationElementSchema.safeParse({ ...qualified, condition_span: 'during pregnancy' }).success).toBe(true);
    expect(citationElementSchema.safeParse({ ...qualified, condition_span: '' }).success).toBe(false);
    expect(AGE_BANDS).toEqual(['adolescent']);
    expect(citationElementSchema.safeParse({ ...qualified, condition_span: 'x', condition_bands: ['adolescent'] }).success).toBe(true);
    expect(citationElementSchema.safeParse({ ...qualified, condition_span: 'x', condition_bands: ['child'] }).success).toBe(false);
    expect(citationElementSchema.safeParse({ ...qualified, condition_span: 'x', condition_bands: [] }).success).toBe(false);
  });
});
