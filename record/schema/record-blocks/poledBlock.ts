import { z } from 'zod';

// A poled block is a container of named poles, each of which is a full
// checkedBlock carrying its own status.
//
// The container carries NO status of its own. That is the whole point of
// poling: a record can state a pregnancy finding and a lactation silence in
// the same block without either contaminating the other, and a container-level
// status would force one verdict over both. Strictness enforces it for free,
// since `status` is not among the declared pole keys and a strictObject
// rejects it as unrecognized.
//
// Unlike checkedBlock this is a thin factory. It exists so that the
// no-container-status rule is stated in one place and cannot be forgotten by a
// block author reaching for a bare z.strictObject.
export function poledBlock<Poles extends z.ZodRawShape>(poles: Poles) {
  return z.strictObject(poles);
}
