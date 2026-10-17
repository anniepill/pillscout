import { describe, it, expect } from 'vitest';
import { attributionLevelSchema } from './attributionLevel.js';

describe('attributionLevelSchema', () => {
  it('accepts class_effect', () => {
    expect(attributionLevelSchema.parse('class_effect'))
      .toBe('class_effect');
  });
  it('accepts drug_specific', () => {
    expect(attributionLevelSchema.parse('drug_specific'))
      .toBe('drug_specific');
  });
  it('accepts not_reported', () => {
    expect(attributionLevelSchema.parse('not_reported'))
      .toBe('not_reported');
  });
  it('rejects invalid value', () => {
    expect(() => attributionLevelSchema.parse('invalid'))
      .toThrow();
  });
  it('rejects empty string', () => {
    expect(() => attributionLevelSchema.parse(''))
      .toThrow();
  });
  it('rejects null', () => {
    expect(() => attributionLevelSchema.parse(null))
      .toThrow();
  });
});
