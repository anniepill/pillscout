import { describe, it, expect } from 'vitest';
import { evidenceOutcomeSchema } from './evidenceOutcome.js';

describe('evidenceOutcomeSchema', () => {
  it('accepts positive_finding', () => {
    expect(evidenceOutcomeSchema.parse('positive_finding')).toBe('positive_finding');
  });
  it('accepts null_finding', () => {
    expect(evidenceOutcomeSchema.parse('null_finding')).toBe('null_finding');
  });
  it('accepts mixed_finding', () => {
    expect(evidenceOutcomeSchema.parse('mixed_finding')).toBe('mixed_finding');
  });
  it('accepts not_applicable', () => {
    expect(evidenceOutcomeSchema.parse('not_applicable')).toBe('not_applicable');
  });
  it('rejects bare string not in enum', () => {
    expect(() => evidenceOutcomeSchema.parse('not_reported')).toThrow();
  });
  it('rejects empty string', () => {
    expect(() => evidenceOutcomeSchema.parse('')).toThrow();
  });
});
