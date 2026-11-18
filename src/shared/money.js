export class MoneyError extends Error {
  constructor(message) {
    super(message);
    this.name = 'MoneyError';
  }
}

export const assertCents = (value) => {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    throw new MoneyError('Amount must be a whole number of cents.');
  }
};

export const addCents = (leftCents, rightCents) => {
  assertCents(leftCents);
  assertCents(rightCents);
  const totalCents = leftCents + rightCents;
  if (!Number.isSafeInteger(totalCents)) {
    throw new MoneyError('That amount is too large.');
  }
  return totalCents;
};

export const sumCents = (amounts) => {
  let totalCents = 0;
  for (const amountCents of amounts) {
    totalCents = addCents(totalCents, amountCents);
  }
  return totalCents;
};

export const subtractCents = (leftCents, rightCents) => {
  assertCents(leftCents);
  assertCents(rightCents);
  if (rightCents > leftCents) {
    throw new MoneyError('Cannot subtract more cents than are available.');
  }
  return leftCents - rightCents;
};

const DOLLARS_PATTERN = /^(\d+)(?:\.(\d{1,2}))?$/;

export const parseDollarsToCents = (input) => {
  if (typeof input !== 'string') {
    throw new MoneyError('Enter an amount like 120.25.');
  }
  let unsigned = input.trim();
  if (unsigned.startsWith('$')) {
    unsigned = unsigned.slice(1).trim();
  }
  const match = unsigned.match(DOLLARS_PATTERN);
  if (!match) {
    throw new MoneyError('Enter an amount like 120.25.');
  }
  const dollars = Number(match[1]);
  let centsText = '00';
  if (match[2]) {
    centsText = match[2];
    if (centsText.length === 1) {
      centsText = `${centsText}0`;
    }
  }
  const cents = Number(centsText);
  if (!Number.isSafeInteger(dollars)) {
    throw new MoneyError('That amount is too large.');
  }
  const totalCents = dollars * 100 + cents;
  if (!Number.isSafeInteger(totalCents)) {
    throw new MoneyError('That amount is too large.');
  }
  assertCents(totalCents);
  return totalCents;
};

export const formatCents = (cents) => {
  assertCents(cents);
  const dollars = Math.floor(cents / 100);
  const remainder = cents % 100;
  const dollarText = new Intl.NumberFormat('en-US').format(dollars);
  const remainderText = String(remainder).padStart(2, '0');
  return `$${dollarText}.${remainderText}`;
};

export const formatCentsPlain = (cents) => {
  assertCents(cents);
  const dollars = Math.floor(cents / 100);
  const remainder = cents % 100;
  const remainderText = String(remainder).padStart(2, '0');
  return `${dollars}.${remainderText}`;
};

export const allocateOldestFirst = (openFees, paymentCents) => {
  assertCents(paymentCents);
  if (paymentCents === 0) {
    throw new MoneyError('Payment amount must be greater than zero.');
  }
  const orderedFees = [...openFees].sort((leftFee, rightFee) => {
    if (leftFee.year !== rightFee.year) {
      return leftFee.year - rightFee.year;
    }
    const leftId = String(leftFee.id);
    const rightId = String(rightFee.id);
    if (leftId < rightId) {
      return -1;
    }
    if (leftId > rightId) {
      return 1;
    }
    return 0;
  });
  let remainingPaymentCents = paymentCents;
  const allocations = [];
  for (const openFee of orderedFees) {
    assertCents(openFee.remainingCents);
    if (openFee.remainingCents === 0) {
      continue;
    }
    if (remainingPaymentCents === 0) {
      break;
    }
    let appliedCents = openFee.remainingCents;
    if (appliedCents > remainingPaymentCents) {
      appliedCents = remainingPaymentCents;
    }
    allocations.push({
      id: openFee.id,
      amountCents: appliedCents,
    });
    remainingPaymentCents = subtractCents(remainingPaymentCents, appliedCents);
  }
  if (remainingPaymentCents !== 0) {
    throw new MoneyError('Payment is larger than the amount owed.');
  }
  return allocations;
};
