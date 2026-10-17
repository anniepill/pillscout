/**
 * Single-record validator (CLI). Checks one record's shape against the schema.
 *
 * Usage:  tsx schema/cli/validate.ts <record.yaml>
 *   or:   npm run validate -- <record.yaml>
 *
 * Exit: 0 = full conformance, 1 = mismatch(es), 2 = usage/IO error.
 */
import { validateFile, FIELD_SCHEMAS, type ValidateResult } from './validator-core.js';

function main(): void {
  const file = process.argv[2];
  if (!file) {
    console.error('usage: tsx schema/cli/validate.ts <record.yaml>');
    process.exit(2);
  }

  let res: ValidateResult;
  try {
    res = validateFile(file);
  } catch (err) {
    console.error(`error: could not read/parse ${file}: ${(err as Error).message}`);
    process.exit(2);
  }

  const mapped = Object.keys(FIELD_SCHEMAS).length;

  // Warnings are reported and do not affect the exit code.
  if (res.warnings.length > 0) {
    console.warn(`! ${file}: ${res.warnings.length} warning(s) (non-blocking):`);
    for (const w of res.warnings) console.warn(`    ${w.path} - ${w.message}`);
    console.warn('');
  }

  // Set the exit code rather than exiting, so piped output drains first.
  if (res.failures.length === 0) {
    console.log(`✓ ${file}: ${res.checks} field value(s) checked against ${mapped} mapped schemas — 0 mismatches`);
    process.exitCode = 0;
    return;
  }

  console.error(`✗ ${file}: ${res.failures.length} mismatch(es) across ${res.checks} checked field value(s):\n`);
  for (const f of res.failures) {
    console.error(`  ${f.path}`);
    console.error(`    field: ${f.field}`);
    console.error(`    value: ${JSON.stringify(f.value)}`);
    console.error(`    error: ${f.message}\n`);
  }
  process.exitCode = 1;
}

main();
