import { Assessment } from '@/server/models/Assessment';
import { Payment } from '@/server/models/Payment';
import { HttpError } from '@/server/lib/http';
import { requireLedgerAccess } from '@/server/lib/auth/guards';
import { requireActiveHousehold } from '@/server/lib/households/households';
import {
  optionalText,
  requirePositiveMoney,
  requireYear,
} from '@/server/lib/validation';
import { allocateOldestFirst } from '@/shared/money';
import {
  loadFinancialRecords,
  markCoveredAssessments,
  openFeesFromAssessments,
  paidCentsForAssessment,
} from '@/server/lib/ledger/balances';
import { sessionOption, withTransaction } from '@/server/lib/withTransaction';

const MANUAL_METHODS = ['check', 'cash', 'other'];

export const addHistoricalAssessment = async (householdId, input) => {
  await requireLedgerAccess();
  const household = await requireActiveHousehold(householdId);
  const year = requireYear(input.year);
  const amountCents = requirePositiveMoney(input.amount);
  let description = optionalText(input.description, 120);
  if (!description) {
    description = 'Annual dues';
  }
  const existing = await Assessment.findOne({
    householdId: household._id,
    year,
    kind: 'annual',
  });
  if (existing) {
    throw new HttpError(409, 'That house already has annual dues for that year.');
  }
  await Assessment.create({
    householdId: household._id,
    year,
    kind: 'annual',
    description,
    amountCents,
    status: 'open',
  });
  return { year, amountCents };
};

export const voidAssessment = async (householdId, assessmentId) => {
  await requireLedgerAccess();
  const household = await requireActiveHousehold(householdId);
  const assessment = await Assessment.findOne({
    _id: assessmentId,
    householdId: household._id,
  });
  if (!assessment) {
    throw new HttpError(404, 'That dues record was not found.');
  }
  if (assessment.status === 'void') {
    throw new HttpError(409, 'Those dues are already void.');
  }
  const payments = await Payment.find({
    householdId: household._id,
    status: 'succeeded',
  }).lean();
  const paidCents = paidCentsForAssessment(payments, assessment._id);
  if (paidCents > 0) {
    throw new HttpError(409, 'Dues with a recorded payment cannot be voided.');
  }
  assessment.status = 'void';
  await assessment.save();
  return { id: String(assessment._id), status: assessment.status };
};

export const recordManualPayment = async (householdId, input) => {
  const actor = await requireLedgerAccess();
  const household = await requireActiveHousehold(householdId);
  if (!MANUAL_METHODS.includes(input.method)) {
    throw new HttpError(400, 'Choose check, cash, or other.');
  }
  const amountCents = requirePositiveMoney(input.amount);
  const checkNumber = optionalText(input.checkNumber, 40);
  let paidAt = new Date();
  if (typeof input.paidOn === 'string' && input.paidOn) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.paidOn)) {
      throw new HttpError(400, 'Enter the date as YYYY-MM-DD.');
    }
    paidAt = new Date(`${input.paidOn}T12:00:00.000Z`);
    if (Number.isNaN(paidAt.getTime())) {
      throw new HttpError(400, 'Enter a real date.');
    }
  }
  const records = await loadFinancialRecords([household._id]);
  const assessments = records.assessmentsByHousehold.get(String(household._id)) || [];
  const payments = records.paymentsByHousehold.get(String(household._id)) || [];
  const openFees = openFeesFromAssessments(assessments, payments);
  const allocations = allocateOldestFirst(openFees, amountCents);
  const storedAllocations = allocations.map((allocation) => ({
    assessmentId: allocation.id,
    amountCents: allocation.amountCents,
  }));
  await withTransaction(async (session) => {
    await Payment.create(
      [
        {
          householdId: household._id,
          amountCents,
          method: input.method,
          status: 'succeeded',
          allocations: storedAllocations,
          checkNumber,
          recordedByUserId: actor._id,
          paidAt,
        },
      ],
      sessionOption(session),
    );
    await markCoveredAssessments(storedAllocations, openFees, session);
  });
  return { amountCents };
};
