import { describe, it, expect } from 'vitest';
import { evaluationStatusSchema } from './evaluationStatus.js';

describe('evaluationStatusSchema', () => {
  it('accepts evaluated', () => {
    expect(evaluationStatusSchema.parse('evaluated')).toBe('evaluated');
  });
  it('accepts not_evaluated', () => {
    expect(evaluationStatusSchema.parse('not_evaluated')).toBe('not_evaluated');
  });
  it('accepts not_reported', () => {
    expect(evaluationStatusSchema.parse('not_reported')).toBe('not_reported');
  });
  it('rejects bare string not in enum', () => {
    expect(() => evaluationStatusSchema.parse('unknown')).toThrow();
  });
  it('rejects empty string', () => {
    expect(() => evaluationStatusSchema.parse('')).toThrow();
  });
});
