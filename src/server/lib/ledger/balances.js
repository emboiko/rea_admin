import { Assessment } from '@/server/models/Assessment';
import { Payment } from '@/server/models/Payment';
import { subtractCents, sumCents } from '@/shared/money';
import { sessionOption } from '@/server/lib/withTransaction';

export const paidCentsForAssessment = (payments, assessmentId) => {
  const amounts = [];
  for (const payment of payments) {
    if (payment.status !== 'succeeded') {
      continue;
    }
    for (const allocation of payment.allocations || []) {
      if (String(allocation.assessmentId) === String(assessmentId)) {
        amounts.push(allocation.amountCents);
      }
    }
  }
  return sumCents(amounts);
};

export const describeAssessment = (assessment, payments) => {
  const paidCents = paidCentsForAssessment(payments, assessment._id);
  let remainingCents = 0;
  if (assessment.status !== 'void') {
    if (paidCents > assessment.amountCents) {
      remainingCents = 0;
    } else {
      remainingCents = subtractCents(assessment.amountCents, paidCents);
    }
  }
  return {
    id: String(assessment._id),
    year: assessment.year,
    kind: assessment.kind,
    description: assessment.description,
    amountCents: assessment.amountCents,
    paidCents,
    remainingCents,
    status: assessment.status,
  };
};

export const openFeesFromAssessments = (assessments, payments) => {
  const openFees = [];
  for (const assessment of assessments) {
    const described = describeAssessment(assessment, payments);
    if (described.status === 'void') {
      continue;
    }
    if (described.remainingCents > 0) {
      openFees.push({
        id: described.id,
        year: described.year,
        description: described.description,
        amountCents: described.amountCents,
        remainingCents: described.remainingCents,
      });
    }
  }
  openFees.sort((leftFee, rightFee) => {
    if (leftFee.year !== rightFee.year) {
      return leftFee.year - rightFee.year;
    }
    if (leftFee.id < rightFee.id) {
      return -1;
    }
    if (leftFee.id > rightFee.id) {
      return 1;
    }
    return 0;
  });
  return openFees;
};

export const loadFinancialRecords = async (householdIds) => {
  const assessments = await Assessment.find({
    householdId: { $in: householdIds },
  }).lean();
  const payments = await Payment.find({
    householdId: { $in: householdIds },
  }).lean();
  const assessmentsByHousehold = new Map();
  const paymentsByHousehold = new Map();
  for (const householdId of householdIds) {
    assessmentsByHousehold.set(String(householdId), []);
    paymentsByHousehold.set(String(householdId), []);
  }
  for (const assessment of assessments) {
    const key = String(assessment.householdId);
    const group = assessmentsByHousehold.get(key);
    if (group) {
      group.push(assessment);
    }
  }
  for (const payment of payments) {
    const key = String(payment.householdId);
    const group = paymentsByHousehold.get(key);
    if (group) {
      group.push(payment);
    }
  }
  return { assessmentsByHousehold, paymentsByHousehold };
};

export const summarizeHousehold = (householdId, assessments, payments) => {
  const openFees = openFeesFromAssessments(assessments, payments);
  const years = openFees.map((fee) => fee.year);
  let oldestOpenYear = null;
  if (years.length > 0) {
    oldestOpenYear = years[0];
  }
  return {
    openFees,
    totalOwedCents: sumCents(openFees.map((fee) => fee.remainingCents)),
    yearsOutstanding: years.length,
    oldestOpenYear,
    openYears: years,
    householdId: String(householdId),
  };
};

export const allocationsMatchOpenFees = (allocations, openFees) => {
  if (allocations.length !== openFees.length) {
    return false;
  }
  const remainingById = new Map(
    openFees.map((fee) => [String(fee.id), fee.remainingCents]),
  );
  for (const allocation of allocations) {
    const remainingCents = remainingById.get(String(allocation.assessmentId));
    if (remainingCents !== allocation.amountCents) {
      return false;
    }
  }
  return true;
};

export const markCoveredAssessments = async (allocations, openFees, session) => {
  const remainingById = new Map(
    openFees.map((fee) => [String(fee.id), fee.remainingCents]),
  );
  for (const allocation of allocations) {
    const remainingCents = remainingById.get(String(allocation.assessmentId));
    if (remainingCents === allocation.amountCents) {
      await Assessment.updateOne(
        { _id: allocation.assessmentId },
        { status: 'paid' },
        sessionOption(session),
      );
    }
  }
};
