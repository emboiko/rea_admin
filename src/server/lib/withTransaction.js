import mongoose from 'mongoose';

let transactionsUnavailable = false;

const transactionErrorText = (error) => {
  const parts = [];
  if (error && error.message) {
    parts.push(error.message);
  }
  if (error && error.originalError && error.originalError.message) {
    parts.push(error.originalError.message);
  }
  if (error && error.errorResponse && error.errorResponse.errmsg) {
    parts.push(error.errorResponse.errmsg);
  }
  return parts.join(' ');
};

const isUnsupportedTransaction = (error) => {
  const text = transactionErrorText(error);
  if (text.includes('replica set')) {
    return true;
  }
  if (text.includes('Transaction numbers')) {
    return true;
  }
  if (text.includes('retryable writes')) {
    return true;
  }
  if (text.includes('retryWrites')) {
    return true;
  }
  return false;
};

export const sessionOption = (session) => {
  if (!session) {
    return undefined;
  }
  return { session };
};

export const applySession = (query, session) => {
  if (!session) {
    return query;
  }
  return query.session(session);
};

export const withTransaction = async (work) => {
  if (transactionsUnavailable) {
    return work(null);
  }
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result;
  } catch (error) {
    if (!isUnsupportedTransaction(error)) {
      throw error;
    }
    transactionsUnavailable = true;
    return work(null);
  } finally {
    await session.endSession();
  }
};
