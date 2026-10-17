/**
 * The stamp tables: the words a stamp's subject is named by, the terms an
 * authority prints for a subject in its own words, and the heading rows a
 * wordless stamp may ride.
 *
 * Every row beyond a block's own key word names its held instance, and a row
 * lands with the stamp that needs it, never ahead of one.
 *
 * SUBJECT_TERMS     a pole's word and the population words a population
 *                   block or pole is named by. The pole word is the block key
 *                   itself and needs no held instance; every other term does.
 * SUBJECT_ALIASES   a term one authority prints for a subject the item's
 *                   key names in another authority's words. An alias applies
 *                   only to a citation of its own source.
 * STAMP_HEADING_ROWS
 *                   a heading that carries a stamp's tier for a family the
 *                   defined-terms registry does not govern. The registry's own
 *                   tier-by-heading rows are read first by the stamp derivation
 *                   (part of the full pipeline, not shipped here); these rows
 *                   sit here rather than there because a registry row
 *                   admitting a position would make the defined-terms gate
 *                   govern every stamp of that family, and fail the ones in
 *                   sections no row names. A heading row carries ONE value:
 *                   a heading that admits several cannot say which one a
 *                   wordless sentence under it takes.
 * SUBJECT_GENERIC_TOKENS
 *                   words a subject key holds that name no subject on their
 *                   own: "drugs" in "anticoagulants and antiplatelet drugs"
 *                   would let any sentence about a drug name that partner.
 *                   They are dropped before plural variants are built.
 * AGE_BAND_ROWS     the rows of the ICH E11 age table a condition_span's
 *                   printed ages are read against. A band is derived only
 *                   where a printed age range equals a row's, and a row lands
 *                   with its held instance, never ahead of one.
 * POSITION_WORDING and DIRECTIVE_WORDING
 *                   the printed strings a stamp's value is read off, moved
 *                   here from schema/defined-terms/registry.ts when the
 *                   verb-limb classes that also read them retired and the
 *                   stamp derivation became their one reader.
 */
import type { SourceDirective } from '../claim-evidence/sourceDirective.js';

/** Where a row was read: the document, a locator, and the citation that prints it. */
export interface StampHeld {
  readonly source: string;
  readonly document_id: string;
  readonly locator: string;
  readonly record_path: string;
}

export interface SubjectTermRow {
  /** The block path shape the term names, `pregnancy_lactation.pregnancy` or `pediatric_use`. */
  readonly block: string;
  readonly term: string;
  /** Absent only for a pole's own key word. */
  readonly held?: StampHeld;
}

export const SUBJECT_TERMS: readonly SubjectTermRow[] = [
  { block: 'pregnancy_lactation.pregnancy', term: 'pregnancy' },
  {
    block: 'pregnancy_lactation.pregnancy',
    term: 'pregnant',
    held: {
      source: 'health_canada_nnhpd',
      document_id: 'mono_garlic_english',
      locator: 'Cautions and warnings, pregnancy bullet (PDF page 5): "before use if you are pregnant"',
      record_path: 'garlic: pregnancy_lactation.pregnancy.citations[1]',
    },
  },
  { block: 'pregnancy_lactation.lactation', term: 'lactation' },
  {
    block: 'pregnancy_lactation.lactation',
    term: 'breastfeeding',
    held: {
      source: 'health_canada_nnhpd',
      document_id: 'mono_ginkgo-biloba_english',
      locator: 'Cautions list, pregnancy and breastfeeding bullet: "if you are pregnant or breastfeeding"',
      record_path: 'ginkgo: pregnancy_lactation.lactation.citations[1]',
    },
  },
  {
    block: 'pregnancy_lactation.lactation',
    term: 'lactating',
    held: {
      source: 'european_commission',
      document_id: 'eu_commission_regulation_2022_860',
      locator: 'Annex III Part B, warnings list, vulnerable-populations warning: "pregnant or lactating women"',
      record_path: 'red_yeast_rice: pregnancy_lactation.lactation.citations[0]',
    },
  },
  { block: 'pregnancy_lactation.fertility', term: 'fertility' },
  // pediatric_use is a population block and its key word is not the source's:
  // the population is named by the term below.
  {
    block: 'pediatric_use',
    term: 'children',
    held: {
      source: 'ema_hmpc',
      document_id: 'EMA/HMPC/246774/2009',
      locator: '4.2, Traditional use column, paediatric paragraph: "The use in children and adolescents under 18 years of age"',
      record_path: 'cinnamon: pediatric_use.citations[0]',
    },
  },
];

export interface AliasRow {
  /** The subject as the item's key holds it. */
  readonly subject: string;
  /** The term the authority prints for it. */
  readonly term: string;
  /** The authority whose citations the alias applies to. */
  readonly source: string;
  readonly held: StampHeld;
}

export const SUBJECT_ALIASES: readonly AliasRow[] = [
  {
    subject: 'anticoagulants and antiplatelet drugs',
    term: 'blood thinners',
    source: 'health_canada_nnhpd',
    held: {
      source: 'health_canada_nnhpd',
      document_id: 'mono_ginkgo-biloba_english',
      locator: 'Contraindication(s), blood thinners bullet: "Do not use if you are taking blood thinners"',
      record_path: 'ginkgo: documented_interactions.items[1].citations[0]',
    },
  },
  {
    subject: 'indinavir',
    term: 'CRIXIVAN',
    source: 'fda',
    held: {
      source: 'fda',
      document_id: 'fda_dailymed_indinavir_setid_01c5574c',
      locator: 'PRECAUTIONS, Drug Interactions, St. John\'s wort paragraph: "Concomitant use of CRIXIVAN and St. John\'s wort"',
      record_path: 'st_johns_wort: documented_interactions.items[3].citations[0]',
    },
  },
];

export interface StampHeadingRow {
  readonly id: string;
  readonly source: string;
  /** A document type as registry.ts parses it, or `*` where the family's filenames parse to none. */
  readonly document_type: string;
  /** The section, matched exactly. */
  readonly section: string;
  /** The one source_position value the heading carries. */
  readonly value: string;
  /** The heading as the source prints it. */
  readonly heading: string;
  readonly held: StampHeld;
}

export const STAMP_HEADING_ROWS: readonly StampHeadingRow[] = [
  {
    id: 'eda_contraindications',
    source: 'eda',
    // EDA's filenames (eda_herbal_monograph_...) parse to no registry document type.
    document_type: '*',
    section: '6',
    value: 'contraindicated',
    heading: 'Contraindications',
    held: {
      source: 'eda',
      document_id: 'EDA/HerbalMonograph/GymnemaSylvestre/2023',
      locator: 'Section 6 (page 4): "Hypersensitivity to active substances and to other plants of the same family."',
      record_path: 'gymnema: contraindications.items[0].citations[0]',
    },
  },
  {
    id: 'who_contraindications',
    source: 'who',
    // The WHO monographs' filenames parse to no registry document type.
    document_type: '*',
    section: 'Contraindications',
    value: 'contraindicated',
    heading: 'Contraindications',
    held: {
      source: 'who',
      document_id: 'WHO/Monographs/Vol2/Rhizoma_Piperis_Methystici',
      locator: 'Contraindications: "During pregnancy and lactation, and in patients with endogenous depression or liver disease."',
      record_path: 'kava: contraindications.items[0].citations[0]',
    },
  },
];

/** Words a subject key is split into that name nothing on their own. */
export const SUBJECT_STOPWORDS: ReadonlySet<string> = new Set(['and', 'or', 'of', 'the', 'in', 'with', 'other', 'to', 'for', 'any', 'a', 'an']);

/** Words a subject key holds that name no particular subject. */
export const SUBJECT_GENERIC_TOKENS: ReadonlySet<string> = new Set(['drugs', 'drug', 'system', 'active', 'substance', 'use', 'related', 'products']);

/** An age as the ICH E11 table states a bound. */
export interface AgeBound {
  readonly n: number;
  readonly unit: 'days' | 'months' | 'years';
}

export interface AgeBandRow {
  /** The band's name in the ICH E11 table. */
  readonly band: string;
  readonly from: AgeBound;
  readonly to: AgeBound;
  readonly held: StampHeld;
}

// The ICH E11 bands: neonate 0 to 27 days, infant 28 days to 23
// months, child 2 to 11 years, adolescent 12 to 17 years. Only the adolescent
// row has a held instance, a population the corpus prints with that range; the
// other three land with the first condition that prints theirs.
export const AGE_BAND_ROWS: readonly AgeBandRow[] = [
  {
    band: 'adolescent',
    from: { n: 12, unit: 'years' },
    to: { n: 17, unit: 'years' },
    held: {
      source: 'health_canada_nnhpd',
      document_id: 'hc_nnhpd_monograph_passionflower',
      locator: 'Dose(s), Subpopulation(s) line: "Adolescents 12-17 years and Adults 18 years and older"',
      record_path: 'passionflower: regulatory_classification.health_canada_nnhpd_status.citations[1]',
    },
  },
];

/**
 * The source wording each position is read off, held ONCE and read by the
 * stamp derivation (part of the full pipeline, not shipped here), which
 * derives a stamp's value from its `position_span`, and by the stamp lint, which finds each printed
 * entry a citation leaves unstamped.
 *
 * STOP-GRADE is the required-blocks rules' own list, which reads: "contraindications admits stop-grade source wording only:
 * contraindicated, do not use, should not be used, avoid, should not be
 * consumed, should not be administered", the last two added with their held
 * instances. NOT-RECOMMENDED is the EU herbal monograph
 * template's standard statement: "The use in <children and adolescents under
 * 18 years of age> ... is not recommended". USE_WITH_CAUTION is the two
 * sentences the corpus's five stamps of that value print. Matched through the
 * wording engine (part of the full pipeline, not shipped here): folded, starting at a word
 * boundary and free to run on, so "avoid" reaches "avoided".
 *
 * An entry added since the derivation landed names its held instance in
 * POSITION_WORDING_HELD below.
 */
export const POSITION_WORDING: Readonly<Record<string, readonly string[]>> = {
  contraindicated: ['contraindicated', 'do not use', 'should not be used', 'avoid', 'should not be consumed', 'should not be administered'],
  not_recommended: ['not recommended'],
  use_with_caution: ['should be used with caution', 'use cautiously'],
};

/**
 * The held instance of each POSITION_WORDING entry added since the stamp
 * derivation landed. The entries before it are the stop-grade
 * list and the template's not-recommended statement, both stated above.
 *
 * "should not be consumed" is the European Commission's mandatory label
 * warning for red yeast rice, printed six times in the corpus, every one
 * carrying `contraindicated` with no word of the list until this entry.
 * "should not be administered" is WHO's word for kava in children. The two
 * `use_with_caution` entries are EMA's section 4.5 sentence for garlic and
 * EDA's section 7 sentences for gymnema, the five stamps of that value in the
 * corpus.
 */
export const POSITION_WORDING_HELD: Readonly<Record<string, StampHeld>> = {
  'should not be consumed': {
    source: 'european_commission',
    document_id: 'eu_commission_regulation_2022_860',
    locator: 'Annex III Part B, warnings list, vulnerable-populations warning',
    record_path: 'red_yeast_rice: regulatory_classification.eu_commission_status.citations[3]',
  },
  'should not be administered': {
    source: 'who',
    document_id: 'WHO/Monographs/Vol2/Rhizoma_Piperis_Methystici',
    locator: 'Precautions, Other precautions: "should not be administered to children without medical supervision"',
    record_path: 'kava: pediatric_use.citations[0]',
  },
  'should be used with caution': {
    source: 'ema_hmpc',
    document_id: 'EMA/HMPC/7685/2013',
    locator: '4.5: "Garlic preparations should be used with caution in patients taking oral anticoagulation therapy"',
    record_path: 'garlic: documented_interactions.items[0].citations[0]',
  },
  'use cautiously': {
    source: 'eda',
    document_id: 'EDA/HerbalMonograph/GymnemaSylvestre/2023',
    locator: 'Section 7: "Use cautiously in patients taking weight loss agents"',
    record_path: 'gymnema: documented_interactions.items[0].citations[0]',
  },
};

/**
 * The printed strings each `source_directive` value is read off, held ONCE and
 * read by the stamp derivation from a citation's `directive_span`, and by the
 * stamp lint. Matched as POSITION_WORDING is.
 *
 * Measured against the 52-row consult census (a labeled set in the full
 * pipeline's tools, not shipped here): each of the 48 ask, stop and beyond rows prints a
 * string of its own value's list and of no other, and none of the 4 generic
 * rows prints any. A test holds that measurement, through the derivation. No
 * census row prints "avoid", so `avoid` leaves it unchanged; the list is a bare "avoid" so that "avoided" and
 * "avoidance" match, and it cannot tell a co-behavior from the substance,
 * which is held at authoring. "after consultation" rather than "only be used
 * after consultation" is the entry because ginkgo's EMA 4.4 sentence breaks
 * the line after "only be", which the raw substring match these lists were
 * first written for could not cross.
 *
 * Typed over the enum, so a value added there without a list here fails the
 * type check rather than the gate.
 */
export const DIRECTIVE_WORDING: Readonly<Record<SourceDirective, readonly string[]>> = {
  ask_before_use: ['before use', 'after consultation'],
  stop_use_and_ask: ['stop use and ask'],
  ask_for_use_beyond_duration: ['for use beyond'],
  ask_if_symptoms_persist: ['symptoms persist', 'symptoms worsen'],
  avoid: ['avoid'],
};
