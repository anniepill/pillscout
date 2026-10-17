import { describe, it, expect } from 'vitest';
import { frequencyQualifierSchema } from './frequencyQualifier.js';

describe('frequencyQualifierSchema (EMA SmPC 4.8)', () => {
  it('accepts very_common', () => {
    expect(frequencyQualifierSchema.parse('very_common')).toBe('very_common');
  });
  it('accepts common', () => {
    expect(frequencyQualifierSchema.parse('common')).toBe('common');
  });
  it('accepts uncommon', () => {
    expect(frequencyQualifierSchema.parse('uncommon')).toBe('uncommon');
  });
  it('accepts rare', () => {
    expect(frequencyQualifierSchema.parse('rare')).toBe('rare');
  });
  it('accepts very_rare', () => {
    expect(frequencyQualifierSchema.parse('very_rare')).toBe('very_rare');
  });
  it('accepts not_known', () => {
    expect(frequencyQualifierSchema.parse('not_known')).toBe('not_known');
  });
  it('accepts not_applicable', () => {
    expect(frequencyQualifierSchema.parse('not_applicable')).toBe('not_applicable');
  });
  // not_reported was added because the enum had no token for a cited block
  // that states no frequency. It is not not_known, the EMA category a source
  // assigns.
  it('accepts not_reported', () => {
    expect(frequencyQualifierSchema.parse('not_reported')).toBe('not_reported');
  });
  it('rejects bare string not in enum', () => {
    expect(() => frequencyQualifierSchema.parse('occasional')).toThrow();
  });
  it('rejects empty string', () => {
    expect(() => frequencyQualifierSchema.parse('')).toThrow();
  });
});
