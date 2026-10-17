import { describe, it, expect } from 'vitest';
import { interactionAxisSchema, axisDoseDependenceSchema } from './interactionAxis.js';

// interactionAxisSchema is list-typed with a non-empty constraint. Positive
// cases pass [value]; the multi-value case exercises the shape of a
// management recommendation that states a pharmacokinetic and a
// pharmacodynamic pathway together. Empty arrays and bare strings are
// rejected. axisDoseDependenceSchema remains single-value.

describe('interactionAxisSchema — singleton positive cases', () => {
  it('accepts [pharmacokinetic]', () => {
    expect(interactionAxisSchema.parse(['pharmacokinetic']))
      .toEqual(['pharmacokinetic']);
  });
  it('accepts [pharmacodynamic]', () => {
    expect(interactionAxisSchema.parse(['pharmacodynamic']))
      .toEqual(['pharmacodynamic']);
  });
  it('accepts [not_reported]', () => {
    expect(interactionAxisSchema.parse(['not_reported']))
      .toEqual(['not_reported']);
  });
  it('accepts [not_applicable]', () => {
    expect(interactionAxisSchema.parse(['not_applicable']))
      .toEqual(['not_applicable']);
  });
  it('rejects invalid value inside the array', () => {
    expect(() => interactionAxisSchema.parse(['invalid']))
      .toThrow();
  });
});

describe('interactionAxisSchema — multi-value and shape negatives', () => {
  it('accepts [pharmacokinetic, pharmacodynamic] (management.recommendation shape)', () => {
    expect(interactionAxisSchema.parse(['pharmacokinetic', 'pharmacodynamic']))
      .toEqual(['pharmacokinetic', 'pharmacodynamic']);
  });
  it('accepts [pharmacodynamic, pharmacokinetic] (reversed order)', () => {
    expect(interactionAxisSchema.parse(['pharmacodynamic', 'pharmacokinetic']))
      .toEqual(['pharmacodynamic', 'pharmacokinetic']);
  });
  it('rejects empty array (min(1) violation)', () => {
    expect(() => interactionAxisSchema.parse([]))
      .toThrow();
  });
  it('rejects bare string input (not an array)', () => {
    expect(() => interactionAxisSchema.parse('pharmacokinetic'))
      .toThrow();
  });
});

describe('axisDoseDependenceSchema', () => {
  it('accepts dose_dependent', () => {
    expect(axisDoseDependenceSchema.parse('dose_dependent'))
      .toBe('dose_dependent');
  });
  it('accepts dose_independent', () => {
    expect(axisDoseDependenceSchema.parse('dose_independent'))
      .toBe('dose_independent');
  });
  it('accepts not_reported', () => {
    expect(axisDoseDependenceSchema.parse('not_reported'))
      .toBe('not_reported');
  });
  it('rejects invalid value', () => {
    expect(() => axisDoseDependenceSchema.parse('maybe'))
      .toThrow();
  });
});
