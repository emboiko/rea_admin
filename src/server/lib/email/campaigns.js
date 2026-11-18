import { Assessment } from '@/server/models/Assessment';
import { EmailCampaign } from '@/server/models/EmailCampaign';
import { FeeSchedule } from '@/server/models/FeeSchedule';
import { Household } from '@/server/models/Household';
import { HttpError } from '@/server/lib/http';
import { requireLedgerAccess } from '@/server/lib/auth/guards';
import { getAppUrl } from '@/server/lib/appUrl';
import { formatMailingAddress } from '@/shared/address';
import { formatCents } from '@/shared/money';
import { splitPayUrl } from '@/shared/payLink';
import { requireActiveHousehold } from '@/server/lib/households/households';
import { loadFinancialRecords, summarizeHousehold } from '@/server/lib/ledger/balances';
import { currentCalendarYear, requireCurrentYear } from '@/server/lib/validation';
import { emailAdapter } from '@/server/services/email/emailAdapter';

const messageFor = ({ mailingAddress, totalOwedCents, payUrl, year }) => {
  const payParts = splitPayUrl(payUrl);
  const lines = [
    'Redfield Estates Association',
    '',
    `Annual dues for ${year} are ready for ${mailingAddress}.`,
    `Amount currently due, including any older unpaid dues: ${formatCents(totalOwedCents)}.`,
    '',
    `Pay online: ${payUrl}`,
  ];
  if (payParts.code) {
    lines.push(`Code, if you are typing it: ${payParts.code}`);
  }
  lines.push('');
  lines.push('This link is private to your house. Anyone with it can see the balance and pay.');
  return lines.join('\n');
};

const sendHouseholdMessage = async (household, year) => {
  if (!household.billingEmail) {
    return false;
  }
  const records = await loadFinancialRecords([household._id]);
  const assessments = records.assessmentsByHousehold.get(String(household._id)) || [];
  const payments = records.paymentsByHousehold.get(String(household._id)) || [];
  const summary = summarizeHousehold(household._id, assessments, payments);
  const payUrl = `${getAppUrl()}/pay/${household.payToken}`;
  await emailAdapter.send({
    to: household.billingEmail,
    subject: `Redfield Estates dues for ${year}`,
    text: messageFor({
      mailingAddress: formatMailingAddress(household.streetAddress, household.lotNumber),
      totalOwedCents: summary.totalOwedCents,
      payUrl,
      year,
    }),
  });
  return true;
};

export const getAnnualStatus = async (yearValue) => {
  await requireLedgerAccess();
  let year = currentCalendarYear();
  if (yearValue !== null && yearValue !== undefined && yearValue !== '') {
    year = requireCurrentYear(yearValue);
  }
  const schedule = await FeeSchedule.findOne({ year }).lean();
  const campaign = await EmailCampaign.findOne({ year }).lean();
  let feeSchedule = null;
  if (schedule) {
    let updatedAt = null;
    if (schedule.updatedAt) {
      updatedAt = new Date(schedule.updatedAt).toISOString();
    }
    let lockedAt = null;
    if (schedule.lockedAt) {
      lockedAt = new Date(schedule.lockedAt).toISOString();
    }
    feeSchedule = {
      year: schedule.year,
      amountCents: schedule.amountCents,
      updatedAt,
      lockedAt,
    };
  }
  let emailSentAt = null;
  if (campaign) {
    emailSentAt = new Date(campaign.sentAt).toISOString();
  }
  return {
    year,
    feeSchedule,
    emailSentAt,
    smtpConfigured: emailAdapter.isConfigured(),
  };
};

export const sendAnnualEmail = async (input) => {
  const actor = await requireLedgerAccess();
  if (!emailAdapter.isConfigured()) {
    throw new HttpError(503, 'Email is not configured.');
  }
  const year = requireCurrentYear(input.year);
  const schedule = await FeeSchedule.findOne({ year }).lean();
  if (!schedule || !schedule.lockedAt) {
    throw new HttpError(400, 'Generate dues for that year before sending email.');
  }
  const assessmentCount = await Assessment.countDocuments({
    year,
    kind: 'annual',
    status: { $ne: 'void' },
  });
  if (assessmentCount === 0) {
    throw new HttpError(400, 'Generate dues for that year before sending email.');
  }
  const existing = await EmailCampaign.findOne({ year });
  if (existing) {
    throw new HttpError(409, 'The annual email for that year was already sent.');
  }
  const households = await Household.find({ status: 'active' });
  let campaign;
  try {
    campaign = await EmailCampaign.create({
      year,
      sentAt: new Date(),
      sentByUserId: actor._id,
      sentCount: 0,
      skippedCount: 0,
    });
  } catch (error) {
    if (error && error.code === 11000) {
      throw new HttpError(409, 'The annual email for that year was already sent.');
    }
    throw error;
  }
  let sentCount = 0;
  const skippedHouseholds = [];
  for (const household of households) {
    if (!household.billingEmail) {
      skippedHouseholds.push({
        id: String(household._id),
        mailingAddress: formatMailingAddress(household.streetAddress, household.lotNumber),
      });
      continue;
    }
    try {
      await sendHouseholdMessage(household, year);
      sentCount += 1;
    } catch {
      console.error(`Annual dues email failed for household ${household._id}.`);
      skippedHouseholds.push({
        id: String(household._id),
        mailingAddress: formatMailingAddress(household.streetAddress, household.lotNumber),
      });
    }
  }
  if (sentCount === 0) {
    await EmailCampaign.deleteOne({ _id: campaign._id });
    throw new HttpError(502, 'No dues emails were sent. The annual button is still available.');
  }
  campaign.sentCount = sentCount;
  campaign.skippedCount = skippedHouseholds.length;
  await campaign.save();
  return { year, sentCount, skippedHouseholds };
};

export const resendHouseholdEmail = async (householdId) => {
  await requireLedgerAccess();
  if (!emailAdapter.isConfigured()) {
    throw new HttpError(503, 'Email is not configured.');
  }
  const year = new Date().getFullYear();
  const household = await requireActiveHousehold(householdId);
  if (!household.billingEmail) {
    throw new HttpError(400, 'Add a billing email for this house first.');
  }
  await sendHouseholdMessage(household, year);
  return { sent: true };
};
