import { Household } from '@/server/models/Household';
import { User } from '@/server/models/User';
import { HttpError } from '@/server/lib/http';
import { requireLedgerAccess } from '@/server/lib/auth/guards';
import { createPayToken } from '@/server/lib/tokens';
import { getAppUrl } from '@/server/lib/appUrl';
import { buildAddressKey, formatMailingAddress } from '@/shared/address';
import {
  optionalEmail,
  optionalText,
  requireObjectId,
  requireText,
} from '@/server/lib/validation';
import {
  describeAssessment,
  loadFinancialRecords,
  summarizeHousehold,
} from '@/server/lib/ledger/balances';

export const toPublicHousehold = (household) => {
  return {
    id: String(household._id),
    streetAddress: household.streetAddress,
    lotNumber: household.lotNumber || '',
    occupantName: household.occupantName || '',
    billingEmail: household.billingEmail || '',
    status: household.status,
    mailingAddress: formatMailingAddress(household.streetAddress, household.lotNumber),
  };
};

export const toPublicPayment = (payment, includeInternal) => {
  const record = {
    id: String(payment._id),
    amountCents: payment.amountCents,
    method: payment.method,
    status: payment.status,
    paidAt: payment.paidAt ? new Date(payment.paidAt).toISOString() : null,
    failureReason: payment.failureReason || '',
  };
  if (includeInternal) {
    record.checkNumber = payment.checkNumber || '';
  }
  return record;
};

export const requireActiveHousehold = async (householdId) => {
  const id = requireObjectId(householdId, 'house');
  const household = await Household.findOne({ _id: id, status: 'active' });
  if (!household) {
    throw new HttpError(404, 'That house was not found.');
  }
  return household;
};

const isDuplicatePayToken = (error) => {
  if (!error || error.code !== 11000) {
    return false;
  }
  if (error.keyPattern && error.keyPattern.payToken) {
    return true;
  }
  if (error.keyValue && Object.prototype.hasOwnProperty.call(error.keyValue, 'payToken')) {
    return true;
  }
  return false;
};

export const createHousehold = async (input) => {
  await requireLedgerAccess();
  const streetAddress = requireText(input.streetAddress, 'street address', 200);
  const lotNumber = optionalText(input.lotNumber, 40);
  try {
    const household = await Household.create({
      streetAddress,
      lotNumber,
      occupantName: optionalText(input.occupantName, 120),
      billingEmail: optionalEmail(input.billingEmail),
      addressKey: buildAddressKey(streetAddress, lotNumber),
      status: 'active',
      payToken: createPayToken(),
      payTokenVersion: 1,
    });
    return toPublicHousehold(household);
  } catch (error) {
    if (isDuplicatePayToken(error)) {
      throw new HttpError(409, 'Could not create a pay link. Try again.');
    }
    if (error && error.code === 11000) {
      throw new HttpError(409, 'A house with that address and lot already exists.');
    }
    throw error;
  }
};

export const updateHouseholdDetails = async (householdId, input) => {
  await requireLedgerAccess();
  const household = await requireActiveHousehold(householdId);
  const streetAddress = requireText(input.streetAddress, 'street address', 200);
  const lotNumber = optionalText(input.lotNumber, 40);
  household.streetAddress = streetAddress;
  household.lotNumber = lotNumber;
  household.occupantName = optionalText(input.occupantName, 120);
  household.billingEmail = optionalEmail(input.billingEmail);
  household.addressKey = buildAddressKey(streetAddress, lotNumber);
  try {
    await household.save();
  } catch (error) {
    if (error && error.code === 11000) {
      throw new HttpError(409, 'A house with that address and lot already exists.');
    }
    throw error;
  }
  return toPublicHousehold(household);
};

export const rotatePayLink = async (householdId) => {
  await requireLedgerAccess();
  const household = await requireActiveHousehold(householdId);
  household.payToken = createPayToken();
  household.payTokenVersion += 1;
  try {
    await household.save();
  } catch (error) {
    if (isDuplicatePayToken(error)) {
      throw new HttpError(409, 'Could not create a pay link. Try again.');
    }
    throw error;
  }
  return {
    household: toPublicHousehold(household),
    payUrl: `${getAppUrl()}/pay/${household.payToken}`,
  };
};

export const archiveHouseholdLogin = async (householdId) => {
  await requireLedgerAccess();
  const household = await requireActiveHousehold(householdId);
  const user = await User.findOne({ householdId: household._id, status: 'active' });
  if (!user) {
    throw new HttpError(404, 'That house has no active login.');
  }
  if (user.role === 'president') {
    throw new HttpError(409, 'Transfer the presidency before archiving this login.');
  }
  user.status = 'archived';
  await user.save();
  return { archivedUserId: String(user._id) };
};

export const getHouseholdDetail = async (householdId) => {
  await requireLedgerAccess();
  const household = await requireActiveHousehold(householdId);
  const records = await loadFinancialRecords([household._id]);
  const assessments = records.assessmentsByHousehold.get(String(household._id)) || [];
  const payments = records.paymentsByHousehold.get(String(household._id)) || [];
  const succeededPayments = payments.filter((payment) => payment.status === 'succeeded');
  const activeUser = await User.findOne({
    householdId: household._id,
    status: 'active',
  }).lean();
  let login = null;
  if (activeUser) {
    login = {
      id: String(activeUser._id),
      email: activeUser.email,
      role: activeUser.role,
      officeLabel: activeUser.officeLabel || '',
    };
  }
  const describedAssessments = assessments
    .map((assessment) => describeAssessment(assessment, succeededPayments))
    .sort((leftItem, rightItem) => rightItem.year - leftItem.year);
  const listedPayments = payments.filter((payment) => {
    if (payment.method !== 'stripe' || payment.status !== 'pending') {
      return true;
    }
    return Boolean(payment.stripePaymentIntentId);
  });
  return {
    household: toPublicHousehold(household),
    payUrl: `${getAppUrl()}/pay/${household.payToken}`,
    summary: summarizeHousehold(household._id, assessments, payments),
    login,
    assessments: describedAssessments,
    payments: listedPayments
      .map((payment) => toPublicPayment(payment, true))
      .sort((leftPayment, rightPayment) => {
        return new Date(rightPayment.paidAt || 0) - new Date(leftPayment.paidAt || 0);
      }),
  };
};
