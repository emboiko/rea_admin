import { Assessment } from '@/server/models/Assessment';
import { FeeSchedule } from '@/server/models/FeeSchedule';
import { Household } from '@/server/models/Household';
import { HttpError } from '@/server/lib/http';
import { requireLedgerAccess } from '@/server/lib/auth/guards';
import { requireCurrentYear, requirePositiveMoney, requireYear } from '@/server/lib/validation';
import { sessionOption, withTransaction } from '@/server/lib/withTransaction';

export const setAnnualAmount = async (input) => {
  await requireLedgerAccess();
  const year = requireCurrentYear(input.year);
  const amountCents = requirePositiveMoney(input.amount);
  const schedule = await FeeSchedule.findOne({ year });
  if (schedule && schedule.lockedAt) {
    throw new HttpError(409, 'Dues for this year were already generated.');
  }
  if (schedule) {
    schedule.amountCents = amountCents;
    await schedule.save();
    return { year, amountCents, locked: false };
  }
  await FeeSchedule.create({ year, amountCents, lockedAt: null });
  return { year, amountCents, locked: false };
};

export const generateAnnualAssessments = async (input) => {
  const actor = await requireLedgerAccess();
  const year = requireCurrentYear(input.year);
  const confirmationYear = requireYear(input.confirmationYear);
  if (year !== confirmationYear) {
    throw new HttpError(400, 'Type the year to confirm.');
  }
  const schedule = await FeeSchedule.findOne({ year });
  if (!schedule) {
    throw new HttpError(400, 'Set the dues amount for this year first.');
  }
  if (schedule.lockedAt) {
    throw new HttpError(409, 'Dues for this year were already generated.');
  }
  const existingAssessments = await Assessment.find({ year, kind: 'annual' });
  const assessmentByHouseholdId = new Map();
  for (const assessment of existingAssessments) {
    assessmentByHouseholdId.set(String(assessment.householdId), assessment);
  }
  const households = await Household.find({ status: 'active' });
  if (households.length === 0) {
    throw new HttpError(400, 'Add at least one house before generating dues.');
  }
  const householdsToInsert = [];
  const voidedAssessments = [];
  let alreadyBilledCount = 0;
  for (const household of households) {
    const existingAssessment = assessmentByHouseholdId.get(String(household._id));
    if (!existingAssessment) {
      householdsToInsert.push(household);
      continue;
    }
    if (existingAssessment.status === 'void') {
      voidedAssessments.push(existingAssessment);
      continue;
    }
    alreadyBilledCount += 1;
  }
  if (householdsToInsert.length === 0 && voidedAssessments.length === 0) {
    throw new HttpError(409, 'Every active house already has dues for this year, so nothing was generated.');
  }
  const lockedAt = new Date();
  await withTransaction(async (session) => {
    schedule.lockedAt = lockedAt;
    await schedule.save(sessionOption(session));
    for (const assessment of voidedAssessments) {
      assessment.status = 'open';
      assessment.amountCents = schedule.amountCents;
      assessment.description = 'Annual dues';
      await assessment.save(sessionOption(session));
    }
    if (householdsToInsert.length > 0) {
      await Assessment.insertMany(
        householdsToInsert.map((household) => ({
          householdId: household._id,
          year,
          kind: 'annual',
          description: 'Annual dues',
          amountCents: schedule.amountCents,
          status: 'open',
        })),
        sessionOption(session),
      );
    }
  });
  const storedSchedule = await FeeSchedule.findById(schedule._id).select('lockedAt').lean();
  if (!storedSchedule || !storedSchedule.lockedAt) {
    await FeeSchedule.updateOne({ _id: schedule._id, lockedAt: null }, { $set: { lockedAt } });
  }
  return {
    year,
    householdCount: householdsToInsert.length + voidedAssessments.length,
    skippedHouseholdCount: alreadyBilledCount,
    amountCents: schedule.amountCents,
    generatedBy: String(actor._id),
  };
};
