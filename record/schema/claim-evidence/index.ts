// claim-evidence axis: vocabularies describing properties of claims
// and citations in interaction records and ingredient profiles

export {
  attributionLevelSchema,
  type AttributionLevel,
} from './attributionLevel.js';
export {
  citationStatusSchema,
  type CitationStatus,
} from './citationStatus.js';
export {
  interactionAxisSchema,
  axisDoseDependenceSchema,
  type InteractionAxis,
  type AxisDoseDependence,
} from './interactionAxis.js';
export {
  applicabilityConditionsSchema,
  type ApplicabilityConditions,
} from './applicabilityConditions.js';
export {
  evidenceOutcomeSchema,
  type EvidenceOutcome,
} from './evidenceOutcome.js';
export {
  evidenceMethodologySchema,
  type EvidenceMethodology,
} from './evidenceMethodology.js';
export {
  evaluationStatusSchema,
  type EvaluationStatus,
} from './evaluationStatus.js';
export {
  frequencyQualifierSchema,
  type FrequencyQualifier,
} from './frequencyQualifier.js';
export {
  sourcePositionSchema,
  type SourcePosition,
} from './sourcePosition.js';
export {
  sourceDirectiveSchema,
  type SourceDirective,
} from './sourceDirective.js';
export {
  RELEVANCE_FIELDS,
  RELEVANCE_VALUES,
  RELEVANCE_BASES,
  NOT_A_GRADE_REASONS,
  GRADE_WITHOUT_FIELD_REASONS,
  humanRelevanceSchema,
  clinicalRelevanceSchema,
  biologicalRelevanceSchema,
  relevanceMarksSchema,
  relevanceGradeNotQuotableSchema,
  type RelevanceField,
  type RelevanceValue,
  type RelevanceGrade,
} from './relevanceGrade.js';
export {
  STAMP_SPAN_OF,
  STAMP_FIELDS,
  NOT_A_STAMP_REASONS,
  SUBJECT_MARK_REASONS,
  STAMP_MARK_REASONS,
  stampSpanSchema,
  stampMarkSchema,
  stampMarksSchema,
  type StampField,
  type StampMark,
} from './stampSpan.js';
export {
  MECHANISM_MARK_REASONS,
  MECHANISM_MARK_KINDS,
  RULE_POINTERS,
  TERM_MATCHES_DESCRIPTION,
  TERM_MATCHES_FIELD,
  TERM_TABLES,
  ROLES,
  mechanismSchema,
  mechanismsSchema,
  mechanismMarkSchema,
  mechanismMarksSchema,
  termMatchSchema,
  termMatchesSchema,
  namedSchema,
  type Mechanism,
  type MechanismMark,
  type MechanismMarkReason,
  type RulePointer,
  type TermMatchItem,
  type TermTable,
  type Named,
  type Role,
} from './mechanismSpan.js';
export { effectSchema, effectsSchema, type Effect } from './effectSpan.js';
export {
  citationElementSchema,
  citationsSchema,
  type CitationElement,
  type Citations,
} from './citationElement.js';
export {
  UNRESOLVED_CLASSES,
  MUST_CLOSE_BY,
  FIRST_RECORD_OF,
  unresolvedClassSchema,
  mustCloseBySchema,
  unresolvedBlockSchema,
  unresolvedListSchema,
  type UnresolvedClass,
  type MustCloseBy,
  type UnresolvedBlock,
  type UnresolvedList,
} from './unresolved.js';
