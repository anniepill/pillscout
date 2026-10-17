import { describe, it, expect } from 'vitest';
import { applicabilityConditionsSchema } from './applicabilityConditions.js';

describe('applicabilityConditionsSchema — sub-field optionality', () => {
  it('accepts an empty object (all sub-fields optional)', () => {
    expect(applicabilityConditionsSchema.parse({})).toEqual({});
  });
  it('accepts population alone', () => {
    const value = { population: ['pregnant', 'lactating'] };
    expect(applicabilityConditionsSchema.parse(value)).toEqual(value);
  });
  it('accepts route alone', () => {
    const value = { route: ['oral', 'cutaneous'] };
    expect(applicabilityConditionsSchema.parse(value)).toEqual(value);
  });
  it('accepts formulation alone', () => {
    const value = { formulation: ['high_extract_standardized'] };
    expect(applicabilityConditionsSchema.parse(value)).toEqual(value);
  });
  it('accepts condition alone', () => {
    const value = { condition: ['liver_impairment'] };
    expect(applicabilityConditionsSchema.parse(value)).toEqual(value);
  });
  it('accepts duration alone', () => {
    const value = { duration: ['chronic_use_over_4_weeks'] };
    expect(applicabilityConditionsSchema.parse(value)).toEqual(value);
  });
  it('accepts genotype alone', () => {
    const value = { genotype: ['cyp2c19_poor_metabolizer'] };
    expect(applicabilityConditionsSchema.parse(value)).toEqual(value);
  });
});

describe('applicabilityConditionsSchema - dose_range retired', () => {
  it('refuses a conformant dose_range and names the key', () => {
    // The shape the field had while it was declared, every key and value
    // conformant to it, so the only reason to refuse is the retirement.
    const result = applicabilityConditionsSchema.safeParse({
      dose_range: { threshold: 1, threshold_unit: 'mg', threshold_direction: 'above' },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toHaveLength(1);
      expect(result.error.issues[0]?.code).toBe('unrecognized_keys');
      expect(result.error.issues.map((i) => i.message).join('; ')).toContain('dose_range');
    }
  });
});

describe('applicabilityConditionsSchema — malformed shapes', () => {
  it('rejects population given as string instead of array', () => {
    expect(() =>
      applicabilityConditionsSchema.parse({ population: 'pregnant' }),
    ).toThrow();
  });
  it('rejects route given as string instead of array', () => {
    expect(() =>
      applicabilityConditionsSchema.parse({ route: 'oral' }),
    ).toThrow();
  });
  it('rejects array sub-field containing non-string elements', () => {
    expect(() =>
      applicabilityConditionsSchema.parse({ condition: [42] }),
    ).toThrow();
  });
});
