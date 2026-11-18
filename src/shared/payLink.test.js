import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { splitPayUrl } from './payLink.js';

describe('splitPayUrl', () => {
  it('separates the site from the code', () => {
    assert.deepEqual(splitPayUrl('https://dues.example/pay/k7mp-q2n8-xrw4'), {
      sitePrefix: 'https://dues.example/pay/',
      code: 'k7mp-q2n8-xrw4',
    });
  });

  it('leaves a value without a pay path unchanged', () => {
    assert.deepEqual(splitPayUrl('not-a-link'), {
      sitePrefix: 'not-a-link',
      code: '',
    });
  });
});
