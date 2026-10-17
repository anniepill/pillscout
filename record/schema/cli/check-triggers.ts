/**
 * The fired-trigger list.
 *
 * A deferral carries a firing condition from the `must_close_by` vocabulary
 * instead of a sentence. Which triggers have fired is not derivable from the
 * record, so it is stated here, in FIRED_TRIGGERS, and moved by hand the
 * commit an event happens. The validator reads it to refuse an unresolved
 * marker whose trigger has already passed.
 */
import type { MustCloseBy } from '../claim-evidence/unresolved.js';

/** The triggers whose event has happened. Moved by hand, one commit per event. */
export const FIRED_TRIGGERS: readonly MustCloseBy[] = [
  'before_extractor_commit',
  'before_contract_cluster',
  'after_build_2',
  'after_build_3',
  'after_build_4',
  'after_build_5',
  'before_pilot_start',
];
