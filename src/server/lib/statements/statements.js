import { Household } from '@/server/models/Household';
import { User } from '@/server/models/User';
import { HttpError } from '@/server/lib/http';
import { readStatementPayload, writeStatementCookie } from '@/server/lib/auth/session';
import { toPublicHousehold, toPublicPayment } from '@/server/lib/households/households';
import { loadFinancialRecords, summarizeHousehold } from '@/server/lib/ledger/balances';
import { stripeAdapter } from '@/server/services/stripe/stripeAdapter';
import { payTokenLookupValues } from '@/server/lib/tokens';

const buildStatement = async (household) => {
  const records = await loadFinancialRecords([household._id]);
  const assessments = records.assessmentsByHousehold.get(String(household._id)) || [];
  const payments = records.paymentsByHousehold.get(String(household._id)) || [];
  const summary = summarizeHousehold(household._id, assessments, payments);
  const succeeded = payments.filter((payment) => payment.status === 'succeeded');
  const activeLogin = await User.findOne({
    householdId: household._id,
    status: 'active',
  }).lean();
  return {
    household: toPublicHousehold(household),
    openFees: summary.openFees,
    totalOwedCents: summary.totalOwedCents,
    yearsOutstanding: summary.yearsOutstanding,
    oldestOpenYear: summary.oldestOpenYear,
    payments: succeeded
      .map((payment) => toPublicPayment(payment, false))
      .sort((leftPayment, rightPayment) => {
        return new Date(rightPayment.paidAt || 0) - new Date(leftPayment.paidAt || 0);
      }),
    hasActiveLogin: Boolean(activeLogin),
    stripeConfigured: stripeAdapter.isConfigured(),
  };
};

export const openStatementSession = async (payToken) => {
  const lookupValues = payTokenLookupValues(payToken);
  if (lookupValues.length === 0) {
    throw new HttpError(404, 'That link is not valid.');
  }
  const household = await Household.findOne({
    payToken: { $in: lookupValues },
    status: 'active',
  });
  if (!household) {
    throw new HttpError(404, 'That link is not valid.');
  }
  await writeStatementCookie(household);
  return buildStatement(household);
};

export const readStatementHousehold = async () => {
  const payload = await readStatementPayload();
  if (!payload || !payload.householdId) {
    throw new HttpError(401, 'Open the link from your letter.');
  }
  const household = await Household.findOne({
    _id: payload.householdId,
    status: 'active',
  });
  if (!household) {
    throw new HttpError(404, 'That link is not valid.');
  }
  if (household.payTokenVersion !== payload.payTokenVersion) {
    throw new HttpError(401, 'This letter is no longer current.');
  }
  return household;
};

export const currentStatement = async () => {
  const household = await readStatementHousehold();
  return buildStatement(household);
};

export { buildStatement };
