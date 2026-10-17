import { describe, it, expect } from 'vitest';
import { sourcePositionSchema } from './sourcePosition.js';

describe('sourcePositionSchema (regulator stance)', () => {
  it('accepts contraindicated', () => {
    expect(sourcePositionSchema.parse('contraindicated')).toBe('contraindicated');
  });
  it('accepts not_recommended', () => {
    expect(sourcePositionSchema.parse('not_recommended')).toBe('not_recommended');
  });
  it('accepts use_with_caution', () => {
    expect(sourcePositionSchema.parse('use_with_caution')).toBe('use_with_caution');
  });
  // not_reported: the enum admits it; the landing rule in the schema file
  // governs where it may be written, and no schema can check that.
  it('accepts not_reported', () => {
    expect(sourcePositionSchema.parse('not_reported')).toBe('not_reported');
  });
  it('rejects bare string not in enum', () => {
    expect(() => sourcePositionSchema.parse('unknown')).toThrow();
  });
  it('rejects empty string', () => {
    expect(() => sourcePositionSchema.parse('')).toThrow();
  });
});
