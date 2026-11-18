import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  createPayToken,
  normalizePayToken,
  payTokenLookupValues,
} from './tokens.js';

const PAY_CODE_PATTERN = /^[0-9abcdefghjkmnpqrstvwxyz]{4}-[0-9abcdefghjkmnpqrstvwxyz]{4}-[0-9abcdefghjkmnpqrstvwxyz]{4}$/;

describe('createPayToken', () => {
  it('builds a lowercase code in three groups', () => {
    const payToken = createPayToken();
    assert.match(payToken, PAY_CODE_PATTERN);
  });
});

describe('normalizePayToken', () => {
  it('accepts case, spaces, and hyphens', () => {
    assert.equal(normalizePayToken('K7MP-Q2N8-XRW4'), 'k7mp-q2n8-xrw4');
    assert.equal(normalizePayToken('k7mp q2n8 xrw4'), 'k7mp-q2n8-xrw4');
    assert.equal(normalizePayToken('k7mpq2n8xrw4'), 'k7mp-q2n8-xrw4');
  });

  it('folds characters that are easy to misread', () => {
    assert.equal(normalizePayToken('otil-u234-5678'), '0t11-v234-5678');
  });

  it('rejects codes that are not a pay code', () => {
    assert.equal(normalizePayToken(''), '');
    assert.equal(normalizePayToken('short'), '');
    assert.equal(normalizePayToken('k7mp-q2n8-xrw4-extra'), '');
  });
});

describe('payTokenLookupValues', () => {
  it('keeps an older long token as an exact match', () => {
    const legacyToken = 'VuzI2-B5-IhKlpa1LnaL4NCTTUN6Ldiga4EWpxNHbuA';
    assert.deepEqual(payTokenLookupValues(legacyToken), [legacyToken]);
  });

  it('looks up a typed short code in canonical form', () => {
    assert.deepEqual(payTokenLookupValues(' K7MP q2n8 xrw4 '), ['k7mp-q2n8-xrw4']);
  });
});
