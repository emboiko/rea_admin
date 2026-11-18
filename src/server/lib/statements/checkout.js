import { Household } from '@/server/models/Household';
import { Payment } from '@/server/models/Payment';
import { HttpError } from '@/server/lib/http';
import { getAppUrl } from '@/server/lib/appUrl';
import { createSecretToken } from '@/server/lib/tokens';
import { sumCents } from '@/shared/money';
import { allocateOldestFirst } from '@/shared/money';
import {
  loadFinancialRecords,
  markCoveredAssessments,
  openFeesFromAssessments,
} from '@/server/lib/ledger/balances';
import { stripeAdapter } from '@/server/services/stripe/stripeAdapter';
import { applySession, sessionOption, withTransaction } from '@/server/lib/withTransaction';
import { toPublicHousehold } from '@/server/lib/households/households';

const loadOpenFees = async (householdId) => {
  const records = await loadFinancialRecords([householdId]);
  const assessments = records.assessmentsByHousehold.get(String(householdId)) || [];
  const payments = records.paymentsByHousehold.get(String(householdId)) || [];
  return openFeesFromAssessments(assessments, payments);
};

export const startCheckout = async (householdId) => {
  if (!stripeAdapter.isConfigured()) {
    throw new HttpError(503, 'Card payments are not configured yet.');
  }
  const openFees = await loadOpenFees(householdId);
  if (openFees.length === 0) {
    throw new HttpError(400, 'Nothing is due right now.');
  }
  const amountCents = sumCents(openFees.map((fee) => fee.remainingCents));
  const receiptSecret = createSecretToken();
  const session = await stripeAdapter.createCheckoutSession({
    amountCents,
    householdId,
    receiptSecret,
    appUrl: getAppUrl(),
  });
  return { clientSecret: session.clientSecret };
};

const paymentIntentIdFrom = (checkoutSession) => {
  if (typeof checkoutSession.payment_intent === 'string') {
    return checkoutSession.payment_intent;
  }
  if (checkoutSession.payment_intent && typeof checkoutSession.payment_intent.id === 'string') {
    return checkoutSession.payment_intent.id;
  }
  return '';
};

const checkoutMetadata = (checkoutSession) => {
  const metadata = checkoutSession.metadata || {};
  return {
    householdId: metadata.householdId || '',
    receiptSecret: metadata.receiptSecret || '',
  };
};

const rememberPayerEmail = async (checkoutSession, householdId, session) => {
  let payerEmail = '';
  if (checkoutSession.customer_details && typeof checkoutSession.customer_details.email === 'string') {
    payerEmail = checkoutSession.customer_details.email.trim().toLowerCase();
  }
  if (!payerEmail || !payerEmail.includes('@') || payerEmail.length > 200) {
    return;
  }
  const household = await applySession(Household.findById(householdId), session);
  if (household && !household.billingEmail) {
    household.billingEmail = payerEmail;
    await household.save(sessionOption(session));
  }
};

const ensureCheckoutPayment = async (checkoutSession, dbSession) => {
  const existing = await applySession(
    Payment.findOne({
      stripeCheckoutSessionId: checkoutSession.id,
    }),
    dbSession,
  );
  if (existing) {
    return existing;
  }
  const metadata = checkoutMetadata(checkoutSession);
  if (!metadata.householdId || !metadata.receiptSecret) {
    return null;
  }
  const amountCents = checkoutSession.amount_total;
  if (typeof amountCents !== 'number') {
    return null;
  }
  const created = await Payment.create(
    [
      {
        householdId: metadata.householdId,
        amountCents,
        method: 'stripe',
        status: 'pending',
        receiptSecret: metadata.receiptSecret,
        stripeCheckoutSessionId: checkoutSession.id,
        stripePaymentIntentId: paymentIntentIdFrom(checkoutSession),
        allocations: [],
      },
    ],
    sessionOption(dbSession),
  );
  return created[0];
};

const applyCheckoutResult = async (event, nextStatus) => {
  const checkoutSession = event.data.object;
  const alreadyHandled = await Payment.findOne({ stripeEventId: event.id }).lean();
  if (alreadyHandled) {
    return;
  }
  await withTransaction(async (dbSession) => {
    const current = await ensureCheckoutPayment(checkoutSession, dbSession);
    if (!current) {
      console.error('Stripe checkout session had no matching payment.');
      return;
    }
    if (current.status === 'succeeded' || current.status === 'failed') {
      return;
    }
    current.stripePaymentIntentId = paymentIntentIdFrom(checkoutSession);
    current.stripeEventId = event.id;
    if (nextStatus === 'pending') {
      current.status = 'pending';
      await current.save(sessionOption(dbSession));
      return;
    }
    if (nextStatus === 'failed') {
      current.status = 'failed';
      current.failureReason = 'The card payment did not go through.';
      await current.save(sessionOption(dbSession));
      return;
    }
    const openFees = await loadOpenFees(current.householdId);
    const openTotal = sumCents(openFees.map((fee) => fee.remainingCents));
    if (checkoutSession.amount_total !== openTotal) {
      current.status = 'failed';
      current.failureReason = 'The paid amount did not match the dues on the statement.';
      await current.save(sessionOption(dbSession));
      return;
    }
    const planned = allocateOldestFirst(openFees, openTotal);
    current.allocations = planned.map((allocation) => ({
      assessmentId: allocation.id,
      amountCents: allocation.amountCents,
    }));
    current.status = 'succeeded';
    current.paidAt = new Date();
    await current.save(sessionOption(dbSession));
    await markCoveredAssessments(current.allocations, openFees, dbSession);
    await rememberPayerEmail(checkoutSession, current.householdId, dbSession);
  });
};

export const applyStripeEvent = async (event) => {
  if (event.type === 'checkout.session.async_payment_failed') {
    await applyCheckoutResult(event, 'failed');
    return;
  }
  if (event.type === 'checkout.session.async_payment_succeeded') {
    await applyCheckoutResult(event, 'succeeded');
    return;
  }
  if (event.type !== 'checkout.session.completed') {
    return;
  }
  const paymentStatus = event.data.object.payment_status;
  if (paymentStatus === 'paid') {
    await applyCheckoutResult(event, 'succeeded');
    return;
  }
  if (paymentStatus === 'unpaid') {
    await applyCheckoutResult(event, 'pending');
  }
};

export const getReceipt = async (receiptSecret) => {
  if (typeof receiptSecret !== 'string' || receiptSecret.length < 20) {
    throw new HttpError(404, 'Receipt not found.');
  }
  const payment = await Payment.findOne({ receiptSecret }).lean();
  if (!payment) {
    throw new HttpError(404, 'Receipt not found.');
  }
  const household = await Household.findById(payment.householdId).lean();
  let householdView = null;
  if (household) {
    householdView = toPublicHousehold(household);
  }
  return {
    status: payment.status,
    amountCents: payment.amountCents,
    paidAt: payment.paidAt ? new Date(payment.paidAt).toISOString() : null,
    failureReason: payment.failureReason || '',
    household: householdView,
  };
};
