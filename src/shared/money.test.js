import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  addCents,
  allocateOldestFirst,
  formatCents,
  formatCentsPlain,
  MoneyError,
  parseDollarsToCents,
  subtractCents,
  sumCents,
} from './money.js';

describe('parseDollarsToCents', () => {
  it('converts whole dollars and one- or two-decimal amounts', () => {
    assert.equal(parseDollarsToCents('90'), 9000);
    assert.equal(parseDollarsToCents('$120.25'), 12025);
    assert.equal(parseDollarsToCents('120.2'), 12020);
    assert.equal(parseDollarsToCents('0.10'), 10);
    assert.equal(parseDollarsToCents('0.20'), 20);
  });

  it('rejects values that are not a cents amount', () => {
    const samples = ['', 'abc', '10.999', '12.2.3', '-5', '1,200.00'];
    for (const sample of samples) {
      assert.throws(() => parseDollarsToCents(sample), MoneyError);
    }
    assert.throws(() => parseDollarsToCents(120.25), MoneyError);
  });
});

describe('arithmetic', () => {
  it('adds and subtracts integer cents', () => {
    assert.equal(addCents(parseDollarsToCents('0.10'), parseDollarsToCents('0.20')), 30);
    assert.equal(sumCents([1000, 250, 1]), 1251);
    assert.equal(subtractCents(12025, 9000), 3025);
  });

  it('refuses to go negative or to accept floats', () => {
    assert.throws(() => subtractCents(100, 101), MoneyError);
    assert.throws(() => addCents(10.5, 1), MoneyError);
    assert.throws(() => sumCents([-1]), MoneyError);
  });
});

describe('formatCents', () => {
  it('renders a dollar string from cents', () => {
    assert.equal(formatCents(12025), '$120.25');
    assert.equal(formatCents(9000), '$90.00');
    assert.equal(formatCents(100000), '$1,000.00');
    assert.equal(formatCentsPlain(12025), '120.25');
    assert.equal(formatCentsPlain(5), '0.05');
  });
});

describe('allocateOldestFirst', () => {
  const twentyNineteen = { id: 'b', year: 2019, remainingCents: 10000 };
  const twentyTwenty = { id: 'a', year: 2020, remainingCents: 11000 };
  const twentyTwentyFour = { id: 'c', year: 2024, remainingCents: 12025 };

  it('pays the oldest open fee first and can stop partway through a year', () => {
    const allocations = allocateOldestFirst(
      [twentyTwentyFour, twentyNineteen, twentyTwenty],
      15000,
    );
    assert.deepEqual(allocations, [
      { id: 'b', amountCents: 10000 },
      { id: 'a', amountCents: 5000 },
    ]);
  });

  it('covers every open fee when the payment equals the total', () => {
    const allocations = allocateOldestFirst(
      [twentyTwenty, twentyNineteen],
      21000,
    );
    assert.equal(sumCents(allocations.map((allocation) => allocation.amountCents)), 21000);
    assert.equal(allocations[0].id, 'b');
    assert.equal(allocations[1].id, 'a');
  });

  it('rejects a payment larger than the amount owed', () => {
    assert.throws(() => allocateOldestFirst([twentyNineteen], 10001), MoneyError);
    assert.throws(() => allocateOldestFirst([twentyNineteen], 0), MoneyError);
  });
});
