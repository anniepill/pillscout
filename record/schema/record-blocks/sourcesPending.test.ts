import { describe, it, expect } from 'vitest';
import { blockStatusSchema } from './blockStatus.js';
import {
  CLEARS_ON,
  PENDING_REASONS,
  clearsOnFor,
  sourcesPendingEntrySchema,
} from './sourcesPending.js';
import { sourcesCheckedEntrySchema } from './sourcesChecked.js';

// The expected values here are literals, never read back out of the
// module under test.

describe('the status enum', () => {
  it('holds exactly the five values, in order', () => {
    expect(blockStatusSchema.options).toEqual([
      'present',
      'stated_absence',
      'not_found',
      'not_found_in_checked_sources',
      'not_assessed',
    ]);
  });
});

describe('the pending vocabularies', () => {
  it('pending_reason is the seven states, in derivation order', () => {
    expect([...PENDING_REASONS]).toEqual([
      'governance_ceiling',
      'not_retrieved',
      'class_1b_scan_pending',
      'third_party_content_flagged',
      'no_extraction_rule',
      'extraction_not_committed',
      'extraction_not_accounted',
    ]);
  });

  it('clears_on is its own two values, not the must_close_by vocabulary', () => {
    expect([...CLEARS_ON]).toEqual(['extraction_accounted', 'no_clearing_event']);
  });

  it('only a governance ceiling has no clearing event', () => {
    expect(clearsOnFor('governance_ceiling')).toBe('no_clearing_event');
    for (const r of [
      'not_retrieved',
      'class_1b_scan_pending',
      'third_party_content_flagged',
      'no_extraction_rule',
      'extraction_not_committed',
      'extraction_not_accounted',
    ] as const) {
      expect(`${r}:${clearsOnFor(r)}`).toBe(`${r}:extraction_accounted`);
    }
  });
});

describe('a sources_pending entry', () => {
  const ENTRY = {
    source: 'health_canada_nnhpd',
    document_id: 'mono_ginkgo-biloba_english',
    pending_reason: 'no_extraction_rule',
    clears_on: 'extraction_accounted',
  };
  const CEILING = {
    source: 'pubmed',
    document_id: 'pmid_15801937_abstract',
    pending_reason: 'governance_ceiling',
    clears_on: 'no_clearing_event',
  };

  it('accepts a well-formed entry and a well-formed ceiling entry', () => {
    expect(sourcesPendingEntrySchema.safeParse(ENTRY).success).toBe(true);
    expect(sourcesPendingEntrySchema.safeParse(CEILING).success).toBe(true);
  });

  it('refuses a ceiling that claims a clearing event', () => {
    const r = sourcesPendingEntrySchema.safeParse({ ...CEILING, clears_on: 'extraction_accounted' });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r.error?.issues)).toMatch(/no_clearing_event exactly when/);
  });

  it('refuses a clearable reason that claims no clearing event', () => {
    const r = sourcesPendingEntrySchema.safeParse({ ...ENTRY, clears_on: 'no_clearing_event' });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r.error?.issues)).toMatch(/no_clearing_event exactly when/);
  });

  it('refuses a reason outside the list, including the manifest join failures', () => {
    for (const reason of ['tier_3_abstract', 'no_such_row', 'ambiguous_row', 'unread']) {
      const r = sourcesPendingEntrySchema.safeParse({ ...ENTRY, pending_reason: reason });
      expect(`${reason}:${r.success}`).toBe(`${reason}:false`);
    }
  });

  it('refuses a clears_on outside its list, including a trigger token', () => {
    for (const value of ['before_pilot_pass', 'legal_review', 'never']) {
      const r = sourcesPendingEntrySchema.safeParse({ ...ENTRY, clears_on: value });
      expect(`${value}:${r.success}`).toBe(`${value}:false`);
    }
  });

  it('refuses an extra key', () => {
    const r = sourcesPendingEntrySchema.safeParse({ ...ENTRY, sections: ['4.2'] });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r.error?.issues)).toMatch(/sections/);
  });

  for (const key of ['source', 'document_id', 'pending_reason', 'clears_on'] as const) {
    it(`refuses an entry missing ${key}`, () => {
      const { [key]: _drop, ...rest } = ENTRY;
      expect(sourcesPendingEntrySchema.safeParse(rest).success).toBe(false);
    });
  }

  it('refuses an empty source or document_id', () => {
    expect(sourcesPendingEntrySchema.safeParse({ ...ENTRY, source: '' }).success).toBe(false);
    expect(sourcesPendingEntrySchema.safeParse({ ...ENTRY, document_id: '' }).success).toBe(false);
  });
});

describe('a sources_checked entry, sections retired', () => {
  it('accepts the pair alone', () => {
    expect(
      sourcesCheckedEntrySchema.safeParse({ source: 'ema_hmpc', document_id: 'EMA/HMPC/61601/2015' })
        .success,
    ).toBe(true);
  });

  it('refuses the sections an author once typed', () => {
    const r = sourcesCheckedEntrySchema.safeParse({
      source: 'nih_ods',
      document_id: 'nih_ods_iron',
      sections: ['Iron and Health'],
    });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r.error?.issues)).toMatch(/sections/);
  });

  it('refuses an empty sections list too', () => {
    expect(
      sourcesCheckedEntrySchema.safeParse({ source: 'nih_ods', document_id: 'x', sections: [] })
        .success,
    ).toBe(false);
  });

  it('refuses a pending key on a checked entry', () => {
    expect(
      sourcesCheckedEntrySchema.safeParse({
        source: 'nih_ods',
        document_id: 'x',
        pending_reason: 'no_extraction_rule',
      }).success,
    ).toBe(false);
  });
});
