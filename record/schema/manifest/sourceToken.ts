/**
 * The closed source vocabulary, and the store map that resolves a token to the
 * directory its bytes live in under the raw source captures (`_raw/`, not
 * shipped here).
 *
 * The vocabulary is closed because an open one cannot be gated, and an
 * ungated vocabulary makes a legitimate new authority indistinguishable from a
 * typo. The worked example: `eda` sat recorded as an "unrecognized
 * source token, probably efsa, unverified" for six weeks, and it is the
 * Egyptian Drug Authority. Nothing was wrong with the row. What was missing
 * was any file that said which tokens exist.
 *
 * Adding a token is a deliberate edit here paired with an edit to the `source`
 * row of the full pipeline's manifest schema document (not shipped here). It
 * is never an authoring-time decision taken inside a manifest cell.
 */
import { z } from 'zod';

/** The 16 tokens, sorted. Order here is the order the manifest schema document lists. */
export const SOURCE_TOKENS = [
  'ags',
  'ayurvedic_pharmacopoeia_india',
  'eda',
  'efsa',
  'ema_hmpc',
  'european_commission',
  'fda',
  'health_canada_nnhpd',
  'health_canada_ssr',
  'national_academies',
  'nccih',
  'nih_livertox',
  'nih_ods',
  'pubmed',
  'scf',
  'who',
] as const;

export type SourceToken = (typeof SOURCE_TOKENS)[number];

export interface SourceDefinition {
  /** The authority the token names, taken from the source's own documents. */
  readonly authority: string;
  /**
   * The `_raw/` subdirectory holding this source's bytes. Usually the token
   * itself. Two sources deliberately differ, which is the whole reason this is
   * a map rather than an identity function: the alternative was renaming
   * directories to satisfy a derivation rule, which would move bytes to make a
   * validator's arithmetic simpler.
   */
  readonly store: string;
}

export const SOURCE_DEFINITIONS: Record<SourceToken, SourceDefinition> = {
  ags: { authority: 'American Geriatrics Society', store: 'ags' },
  ayurvedic_pharmacopoeia_india: {
    authority: 'Ayurvedic Pharmacopoeia of India (PCIM&H)',
    store: 'ayurvedic_pharmacopoeia_india',
  },
  eda: { authority: 'Egyptian Drug Authority', store: 'eda' },
  efsa: { authority: 'European Food Safety Authority', store: 'efsa' },
  ema_hmpc: {
    authority: 'European Medicines Agency, Committee on Herbal Medicinal Products',
    store: 'ema_hmpc',
  },
  // Stored under eu_commission: a plain naming drift between the token and the
  // directory, recorded rather than renamed.
  european_commission: { authority: 'European Commission', store: 'eu_commission' },
  fda: { authority: 'US Food and Drug Administration', store: 'fda' },
  health_canada_nnhpd: {
    authority: 'Health Canada, Natural and Non-prescription Health Products Directorate',
    store: 'health_canada_nnhpd',
  },
  health_canada_ssr: {
    authority: 'Health Canada, Summary Safety Review',
    store: 'health_canada_ssr',
  },
  national_academies: {
    authority: 'National Academies of Sciences, Engineering, and Medicine, Food and Nutrition Board',
    store: 'national_academies',
  },
  nccih: {
    authority: 'NIH National Center for Complementary and Integrative Health',
    store: 'nccih',
  },
  nih_livertox: { authority: 'NIH LiverTox (NIDDK)', store: 'nih_livertox' },
  nih_ods: { authority: 'NIH Office of Dietary Supplements', store: 'nih_ods' },
  pubmed: { authority: 'PubMed (NCBI)', store: 'pubmed' },
  // Stored under efsa: SCF is EFSA's predecessor body and its documents sit in
  // the EFSA store by the lineage convention, while SCF stays a distinct
  // authority in the vocabulary. The store map is what lets both be true.
  scf: { authority: 'Scientific Committee on Food (EFSA predecessor)', store: 'efsa' },
  who: { authority: 'World Health Organization', store: 'who' },
};

export const sourceTokenSchema = z.enum(SOURCE_TOKENS);

const TOKEN_SET: ReadonlySet<string> = new Set(SOURCE_TOKENS);

export function isSourceToken(value: string): value is SourceToken {
  return TOKEN_SET.has(value);
}

/** The `_raw/` subdirectory this source's bytes belong in. */
export function storeFor(token: SourceToken): string {
  return SOURCE_DEFINITIONS[token].store;
}

/**
 * The path a row's bytes must occupy when they are held. The derivation exists
 * so a validator can catch a typo; nothing resolves bytes by deriving a path,
 * because consumers read `raw_path` directly.
 */
export function expectedRawPath(token: SourceToken, canonicalFilename: string): string {
  return `_raw/${storeFor(token)}/${canonicalFilename}`;
}
