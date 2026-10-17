import { z } from 'zod';

// sources_checked - the documents an absence pole read and found nothing in.
//
// An entry once recorded that an author read named sections of a document,
// in any form the author held. Now a document is checked only when its
// extraction is committed and every block of it is carried or dispositioned,
// so what was read is the whole committed extraction, and an entry names the
// document by the pair that joins it to the room manifest.
//
// `sections` is RETIRED. It held the section names an author typed, AS
// PRINTED, and the lists are now derived and never typed; a derivation also
// has no section list to write for an extraction with no headings, which the
// ginkgo EMA opinion is (twelve blocks, every section_path and headings list
// empty). It was optional while a bridge was needed, until no record carried
// it. The entry is strict, so the key is now an unrecognized key, and
// checkRetiredKeys in schema/cli/validator-core.ts names it as retired.
export const sourcesCheckedEntrySchema = z.strictObject({
  source: z.string().min(1),
  document_id: z.string().min(1),
});

export type SourcesCheckedEntry = z.infer<typeof sourcesCheckedEntrySchema>;

export const sourcesCheckedSchema = z.array(sourcesCheckedEntrySchema).min(1);

export type SourcesChecked = z.infer<typeof sourcesCheckedSchema>;
