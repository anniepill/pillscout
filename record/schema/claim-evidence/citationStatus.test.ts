import { describe, it, expect } from 'vitest';
import { citationStatusSchema } from './citationStatus.js';

describe('citationStatusSchema', () => {
  it('accepts cited', () => {
    expect(citationStatusSchema.parse('cited'))
      .toBe('cited');
  });
  it('accepts retained_pre_scope_lock', () => {
    expect(citationStatusSchema.parse('retained_pre_scope_lock'))
      .toBe('retained_pre_scope_lock');
  });
  it('accepts pending_retrieval', () => {
    expect(citationStatusSchema.parse('pending_retrieval'))
      .toBe('pending_retrieval');
  });
  it('accepts restricted_access', () => {
    expect(citationStatusSchema.parse('restricted_access'))
      .toBe('restricted_access');
  });
  it('accepts not_applicable', () => {
    expect(citationStatusSchema.parse('not_applicable'))
      .toBe('not_applicable');
  });
  // not_reported: an authorable member for a cited block that states no status.
  it('accepts not_reported', () => {
    expect(citationStatusSchema.parse('not_reported'))
      .toBe('not_reported');
  });
  it('rejects invalid value', () => {
    expect(() => citationStatusSchema.parse('invalid'))
      .toThrow();
  });
  it('rejects empty string', () => {
    expect(() => citationStatusSchema.parse(''))
      .toThrow();
  });
  it('rejects null', () => {
    expect(() => citationStatusSchema.parse(null))
      .toThrow();
  });
});
