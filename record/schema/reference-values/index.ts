// reference-values axis: the per-ingredient reference_values block —
// nutrient reference intakes (RDA/AI/UL/EAR), toxicology bounds
// (NOAEL/LOAEL/ADI/TDI), and source-stated upper bounds.

export {
  referenceValuesSchema,
  referenceValueElementSchema,
  referenceValueStatedValueSchema,
  referenceValuePopulationSchema,
  referenceValueScopeSchema,
  referenceValueSourceSchema,
  referenceValueConstructSchema,
  referenceValueBasisSchema,
  referenceValueEvidenceBasisSchema,
  referenceValueStatusSchema,
  referenceValueAbsenceReasonSchema,
  type ReferenceValues,
  type ReferenceValueElement,
  type ReferenceValueStatedValue,
  type ReferenceValueConstruct,
  type ReferenceValueBasis,
  type ReferenceValueEvidenceBasis,
  type ReferenceValueStatus,
  type ReferenceValueAbsenceReason,
} from './referenceValues.js';

export {
  constructRegistry,
  isRegisteredConstruct,
} from './constructRegistry.js';
