import { z } from 'zod';
import { sourceText } from '../byte-hygiene/sourceText.js';

// reference_values - nutrient reference values and herb upper bounds
//
// This is a top-level sibling block on the per-ingredient record
// (ingredients/records/<slug>.yaml) carrying consensus-body reference
// intakes (RDA/AI/UL/EAR), toxicology bounds (NOAEL/LOAEL/ADI/TDI), and
// any differently-named source-stated upper bound.
//
// Unlike the convention-only record blocks, this block is the cabinet's
// machine-consumed contract (the engine computes aggregate intake against
// reference daily values and upper limits), so it carries a dedicated,
// strict block-level Zod schema. The schema is the authoritative key-set
// for the block: unknown keys are rejected, so the manual key-set field
// diff defers to this schema for reference_values.
//
// Wiring: registered in schema/cli/validator-core.ts FIELD_SCHEMAS under
// the single key `reference_values` (never the inner leaf keys - `construct`,
// `basis`, `status`, `unit`, `amount`, `source`, etc. are generic names
// that collide with fields elsewhere in the record, e.g. the top-level
// record `status`). All enum and shape enforcement lives inside this
// schema, applied once at the block key.
//
// Several of the block's locked authoring invariants are NOT
// schema-enforceable (never derive a range, never map one authority's named
// construct onto another's); the comments below state them where they apply.

// construct - the source's OWN name for the reference value, carried as an
// open source-named string rather than a closed cross-authority enum. It is
// assigned from the framework the source itself uses; never map one
// authority's named construct onto another's. A differently-named upper
// bound keeps its real name here (and in verbatim), not force-mapped to ul.
//
// Open field, but not free-form: the value must be lowercase snake_case
// (letters, digits, single underscores; no spaces, no leading/trailing or
// doubled underscores). The OPEN string admits any source-named construct
// at the shape level; WHICH constructs a given source may use is enforced
// separately by the per-authority construct registry
// (schema/reference-values/constructRegistry.ts), applied by the corpus
// validator. So a typo or a cross-authority construct bleed fails
// validation against the registry, while a genuinely new source-named
// construct is admitted by a one-line registry edit, not a schema change.
export const referenceValueConstructSchema = z
  .string()
  .min(1)
  .regex(
    /^[a-z0-9]+(_[a-z0-9]+)*$/,
    'construct must be lowercase snake_case (letters, digits, single underscores; no spaces)',
  );

// basis - REQUIRED on every stated value; the denominator the amount is
// stated against.
export const referenceValueBasisSchema = z.enum([
  'per_day',
  'per_kg_bw_per_day',
  'per_dose',
  'per_serving',
]);

export const referenceValueEvidenceBasisSchema = z.enum([
  'human',
  'animal',
  'in_vitro',
  'unspecified',
]);

export const referenceValueStatusSchema = z.enum([
  'present',
  'documented_absence',
]);

// absence_reason - required iff status is documented_absence.
export const referenceValueAbsenceReasonSchema = z.enum([
  'not_established_by_authority',
  'insufficient_data_in_source',
]);

// amount - a scalar number, or a [low, high] range ONLY when the source
// printed a range (authoring invariant; never derive a range).
const amountSchema = z.union([
  z.number(),
  z.tuple([z.number(), z.number()]),
]);

// A single stated value. unit is copied glyph-for-glyph from the source;
// a value the source printed in two units is authored as two stated_values
// elements (one per printed unit), never derived across units.
export const referenceValueStatedValueSchema = z
  .strictObject({
    amount: amountSchema,
    // Source text, and the glyph-for-glyph rule above is why. vitamin_d's FNB
    // values read mcg and its EFSA values read the Greek mu, because that is
    // what each authority prints. Tagging it stops the voice layer treating
    // that as a house-style inconsistency to normalise
    // (schema/byte-hygiene/sourceText.ts).
    unit: sourceText().min(1),
    basis: referenceValueBasisSchema,
  });

// population - all sub-fields optional; each carries the source's own
// wording. condition is a two-value enum or explicit null. species is
// present when the value is not human (e.g. an animal NOAEL/LOAEL).
export const referenceValuePopulationSchema = z
  .strictObject({
    label: z.string().min(1).optional(),
    life_stage: z.string().min(1).optional(),
    sex: z.string().min(1).optional(),
    condition: z.enum(['pregnancy', 'lactation']).nullable().optional(),
    species: z.string().min(1).optional(),
  });

// scope - optional. form is load-bearing (the source's wording, e.g.
// supplemental_only); route appears only when the source restricts it,
// never defaulted from silence.
export const referenceValueScopeSchema = z
  .strictObject({
    form: z.string().min(1).optional(),
    route: z.string().min(1).optional(),
  });

// source - authority and retrieved_at are required, plus at least one
// locator (document or citation): a value with an authority and a verbatim
// but no locator is human-trusted but not auditor-verifiable - the auditor
// needs the locator to fetch the source and confirm the verbatim.
// stated_date stays optional. Cite-by-reference values (e.g. EFSA, whose
// PDF 403s) still pass: the DOI rides in citation.
//
// manifest_source / manifest_document_id are the record-to-manifest join (the
// manifest is the full pipeline's room data, not shipped here). Before them the four prose fields named the
// document to a human and to nothing else: 227 verbatims across seven records
// could not be resolved to the bytes they quote. A fact buried in a free-text
// string is functionally absent, and worse than a recorded absence because it
// reads as coverage.
//
// They are REQUIRED, not optional. An optional join key is one that is
// silently absent, and the whole defect being closed here is a source
// identity that no consuming agent could query. The prose fields are kept
// unchanged: they carry the authority's own wording and the human locator,
// which the slug deliberately does not.
//
// The prefix is deliberate. `source.source` would be unreadable, and naming
// these for what they are, keys INTO the manifest, stops them being read as
// two more prose locators alongside document and citation.
//
// DEPRECATED, and retained until the reference_values migration.
// The extraction contract (not shipped here) retires this object in favour of
// the element's `anchor_id`, but the drop is not lossless as the contract
// states it. Three things here have no other home: `authority`, which is the
// construct registry's lookup key and hoists to element level at migration;
// `stated_date`, which resolves under a separate date rule; and 8
// `retrieved_at` values that differ from their manifest row's
// `retrieval_date`. Until that is resolved, every element still carries this
// object and it stays required.
export const referenceValueSourceSchema = z
  .strictObject({
    authority: z.string().min(1),
    document: z.string().min(1).optional(),
    manifest_source: z.string().min(1),
    manifest_document_id: z.string().min(1),
    citation: z.string().min(1).optional(),
    stated_date: z.string().min(1).optional(),
    retrieved_at: z.string().min(1),
  })
  .refine((s) => s.document !== undefined || s.citation !== undefined, {
    message: 'source requires at least one locator: document or citation',
    path: ['document'],
  });

// A single reference_values element: one (construct, population, source)
// determination. verbatim is REQUIRED on every element, both present and
// documented_absence - it is the verifiability anchor and is decoupled
// from archival (a cite-by-reference value still quotes its abstract/DOI
// text). The superRefine enforces the present / documented_absence xor.
export const referenceValueElementSchema = z
  .strictObject({
    construct: referenceValueConstructSchema,
    stated_values: z.array(referenceValueStatedValueSchema).optional(),
    qualifier: z.string().min(1).optional(),
    population: referenceValuePopulationSchema.optional(),
    scope: referenceValueScopeSchema.optional(),
    evidence_basis: referenceValueEvidenceBasisSchema,
    source: referenceValueSourceSchema,
    // The anchor reference: reference values route through the same anchor
    // primitive as citations, so the id has the same shape. Optional, and
    // nothing carries it yet; sidecar resolution lands later in the anchor
    // pipeline.
    //
    // A value stated in a region the extractor could not read is NOT modelled
    // here. It routes the same way: the anchor this id names carries
    // `resolution: unrepresentable` and the `unrepresentable_ref` that
    // addresses the region, and the element's `verbatim` is the stated value
    // string the anchor's `verbatim_sha256` covers. Restating the ref on the
    // element would duplicate a fact the sidecar already holds, which is
    // forbidden in both directions (nothing per block is copied into a record,
    // and nothing derivable from committed files is stored beside them), and
    // would give a reader two places to disagree about which region a value
    // came from.
    anchor_id: z
      .string()
      .regex(/^[0-9a-f]{16}$/, 'anchor_id must be 16 lowercase hex characters')
      .optional(),
    // Source text: the verifiability anchor, quoted from the source
    // (schema/byte-hygiene/sourceText.ts).
    verbatim: sourceText().min(1),
    status: referenceValueStatusSchema,
    absence_reason: referenceValueAbsenceReasonSchema.optional(),
  })
  .superRefine((el, ctx) => {
    if (el.status === 'present') {
      if (!el.stated_values || el.stated_values.length === 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['stated_values'],
          message: "status 'present' requires non-empty stated_values",
        });
      }
      if (el.absence_reason !== undefined) {
        ctx.addIssue({
          code: 'custom',
          path: ['absence_reason'],
          message: "status 'present' must not carry absence_reason",
        });
      }
    } else {
      if (el.absence_reason === undefined) {
        ctx.addIssue({
          code: 'custom',
          path: ['absence_reason'],
          message: "status 'documented_absence' requires absence_reason",
        });
      }
      if (el.stated_values !== undefined && el.stated_values.length > 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['stated_values'],
          message: "status 'documented_absence' must not carry stated_values",
        });
      }
    }
  });

// The block value as authored: an array of elements. One element per
// (construct, population, source); disagreeing or differing-jurisdiction
// sources are stored as separate elements, never merged.
export const referenceValuesSchema = z.array(referenceValueElementSchema);

export type ReferenceValueConstruct = z.infer<
  typeof referenceValueConstructSchema
>;
export type ReferenceValueBasis = z.infer<typeof referenceValueBasisSchema>;
export type ReferenceValueEvidenceBasis = z.infer<
  typeof referenceValueEvidenceBasisSchema
>;
export type ReferenceValueStatus = z.infer<typeof referenceValueStatusSchema>;
export type ReferenceValueAbsenceReason = z.infer<
  typeof referenceValueAbsenceReasonSchema
>;
export type ReferenceValueStatedValue = z.infer<
  typeof referenceValueStatedValueSchema
>;
export type ReferenceValueElement = z.infer<
  typeof referenceValueElementSchema
>;
export type ReferenceValues = z.infer<typeof referenceValuesSchema>;
