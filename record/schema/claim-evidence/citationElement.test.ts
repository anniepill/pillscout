import { describe, it, expect } from 'vitest';
import { citationElementSchema } from './citationElement.js';

// A minimal valid element: the six keys present on every citation.
const minimalCitation = () => ({
  source: 'ema_hmpc',
  document_id: 'ema_hmpc_monograph_ginkgo',
  section: '4.5',
  section_title: 'Interactions with other medicinal products',
  evidence_locator: 'section 4.5',
  verbatim: 'None reported.',
});

describe('citationElementSchema - anchor_id', () => {
  it('accepts a 16-character lowercase hex anchor_id', () => {
    const el = { ...minimalCitation(), anchor_id: '0123456789abcdef' };
    expect(citationElementSchema.safeParse(el).success).toBe(true);
  });
  it('rejects a 15-character or uppercase anchor_id', () => {
    for (const anchor_id of ['0123456789abcde', '0123456789ABCDEF']) {
      const el = { ...minimalCitation(), anchor_id };
      expect(citationElementSchema.safeParse(el).success).toBe(false);
    }
  });
});

describe('citationElementSchema - scope, the container claim', () => {
  it('is optional, and accepts a list of source-stated heading strings', () => {
    expect(citationElementSchema.safeParse(minimalCitation()).success).toBe(true);
    const el = {
      ...minimalCitation(),
      scope: ['4.3. Contraindications', 'Well-established use'],
    };
    expect(citationElementSchema.safeParse(el).success).toBe(true);
  });

  it('rejects an empty list and an empty string, which claim nothing', () => {
    for (const scope of [[], ['']]) {
      expect(citationElementSchema.safeParse({ ...minimalCitation(), scope }).success).toBe(false);
    }
  });

  it('rejects a bare string: scope is a list even when it names one heading', () => {
    const el = { ...minimalCitation(), scope: '4.3. Contraindications' };
    expect(citationElementSchema.safeParse(el).success).toBe(false);
  });
});
