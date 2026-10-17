import { describe, it, expect } from 'vitest';
import {
  UNRESOLVED_CLASSES,
  unresolvedBlockSchema,
} from './unresolved.js';

const block = (over: Record<string, unknown> = {}) => ({
  class: 'no_slot',
  note: 'The source states a fact the schema has no field for.',
  opened: '2026-09-14',
  must_close_by: 'before_pilot_pass',
  ...over,
});

describe('unresolvedBlockSchema', () => {
  it('declares exactly the six locked classes', () => {
    expect([...UNRESOLVED_CLASSES]).toEqual([
      'no_slot',
      'vocabulary_gap',
      'scope_call',
      'source_conflict',
      'product_call',
      'anchor_gap',
    ]);
  });
  for (const c of UNRESOLVED_CLASSES) {
    it(`accepts class ${c}`, () => {
      expect(unresolvedBlockSchema.safeParse(block({ class: c })).success).toBe(true);
    });
  }
  it('rejects a seventh class', () => {
    expect(unresolvedBlockSchema.safeParse(block({ class: 'judgment_call' })).success).toBe(false);
  });
  it('accepts first_record_of:botanical', () => {
    expect(
      unresolvedBlockSchema.safeParse(block({ must_close_by: 'first_record_of:botanical' })).success,
    ).toBe(true);
  });
  it('rejects first_record_of: with an empty category', () => {
    expect(
      unresolvedBlockSchema.safeParse(block({ must_close_by: 'first_record_of:' })).success,
    ).toBe(false);
  });
});
