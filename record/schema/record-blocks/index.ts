// record-blocks axis: the required-block wrapper, the status discriminator,
// and the per-block schemas.
//
// The status set grew from three values to five: absence is claimed over
// checked documents only, and the two new values carry the documents that are
// not.

export {
  blockStatusSchema,
  absenceReasonSchema,
  sentenceVerbatimSchema,
  type BlockStatus,
  type AbsenceReason,
} from './blockStatus.js';

export {
  sourcesCheckedEntrySchema,
  sourcesCheckedSchema,
  type SourcesCheckedEntry,
  type SourcesChecked,
} from './sourcesChecked.js';

export {
  PENDING_REASONS,
  CLEARS_ON,
  clearsOnFor,
  pendingReasonSchema,
  clearsOnSchema,
  sourcesPendingEntrySchema,
  type PendingReason,
  type ClearsOn,
  type SourcesPendingEntry,
} from './sourcesPending.js';

export {
  checkedBlock,
  checkedBlockVariants,
  citationsShape,
  statedAbsenceVariantSchema,
  notFoundVariantSchema,
  notFoundInCheckedSourcesVariantSchema,
  notAssessedVariantSchema,
} from './checkedBlock.js';

export { poledBlock } from './poledBlock.js';

export {
  LOOKUP_STATUSES,
  LOOKUP_POLES,
  EDITION,
  lookupListSchema,
  lookupTermSchema,
  notListedLookupSchema,
  listedLookupSchema,
  notListedVariantSchema,
  listedVariantSchema,
  lookupPole,
  SERVED_NOT_LISTED,
  SERVED_LISTED,
  SERVED_ATTESTED_CLAUSE,
  type LookupStatus,
  type LookupPole,
} from './nameLookup.js';

export {
  REQUIRED_BLOCKS,
  CONDITIONAL_BLOCKS,
  requiredBlocksFor,
  type RequiredBlock,
} from './requiredBlocks.js';

export { LISTED_TOP_LEVEL_KEYS } from './topLevelKeys.js';

export {
  sourceScopeEvaluatedSchema,
  evaluatedSourceSchema,
  type SourceScopeEvaluated,
  type EvaluatedSource,
} from './sourceScopeEvaluated.js';

export {
  REQUIRED_POLES,
  doseScopedContraindicationsSchema,
  drivingAndMachinerySchema,
  contraindicationItemSchema,
  contraindicationsSchema,
  pediatricUseSchema,
  hepatotoxicityAssessmentSchema,
  pregnancyLactationSchema,
  posologySchema,
  specialPopulationsSchema,
  pharmacologySchema,
  preclinicalSafetySchema,
  overdoseSchema,
  otherWarningsAndPrecautionsSchema,
  documentedAdverseReactionsSchema,
  documentedInteractionsSchema,
  identifiersSchema,
  substanceIdentitySchema,
  regulatorStatusSchema,
  emaHmpcStatusSchema,
  beersCriteriaSchema,
  regulatoryClassificationSchema,
} from './blocks.js';
