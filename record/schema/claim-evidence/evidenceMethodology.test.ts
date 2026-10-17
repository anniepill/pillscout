import { describe, it, expect } from 'vitest';
import { evidenceMethodologySchema } from './evidenceMethodology.js';

describe('evidenceMethodologySchema', () => {
  it('accepts rct', () => {
    expect(evidenceMethodologySchema.parse('rct')).toBe('rct');
  });
  it('accepts controlled_study', () => {
    expect(evidenceMethodologySchema.parse('controlled_study')).toBe('controlled_study');
  });
  it('accepts meta_analysis', () => {
    expect(evidenceMethodologySchema.parse('meta_analysis')).toBe('meta_analysis');
  });
  it('accepts case_report', () => {
    expect(evidenceMethodologySchema.parse('case_report')).toBe('case_report');
  });
  it('accepts case_series', () => {
    expect(evidenceMethodologySchema.parse('case_series')).toBe('case_series');
  });
  it('accepts mechanism_inference', () => {
    expect(evidenceMethodologySchema.parse('mechanism_inference')).toBe('mechanism_inference');
  });
  it('accepts in_vitro', () => {
    expect(evidenceMethodologySchema.parse('in_vitro')).toBe('in_vitro');
  });
  it('accepts animal_study', () => {
    expect(evidenceMethodologySchema.parse('animal_study')).toBe('animal_study');
  });
  it('accepts regulator_assessment', () => {
    expect(evidenceMethodologySchema.parse('regulator_assessment')).toBe('regulator_assessment');
  });
  it('accepts curated_tertiary_synthesis', () => {
    expect(evidenceMethodologySchema.parse('curated_tertiary_synthesis')).toBe('curated_tertiary_synthesis');
  });
  it('accepts pharmacovigilance_database', () => {
    expect(evidenceMethodologySchema.parse('pharmacovigilance_database')).toBe('pharmacovigilance_database');
  });
  it('accepts not_reported', () => {
    expect(evidenceMethodologySchema.parse('not_reported')).toBe('not_reported');
  });
  it('rejects bare string not in enum', () => {
    expect(() => evidenceMethodologySchema.parse('observational')).toThrow();
  });
  it('rejects empty string', () => {
    expect(() => evidenceMethodologySchema.parse('')).toThrow();
  });
});
