import { Household } from '@/server/models/Household';
import { HttpError } from '@/server/lib/http';
import { requireLedgerAccess } from '@/server/lib/auth/guards';
import { getAppUrl } from '@/server/lib/appUrl';
import { requireObjectId } from '@/server/lib/validation';
import { loadFinancialRecords } from '@/server/lib/ledger/balances';
import { buildBill } from '@/server/lib/bills/printBills';

export const getPrintBill = async (householdId) => {
  await requireLedgerAccess();
  const id = requireObjectId(householdId, 'house');
  const household = await Household.findOne({ _id: id, status: 'active' });
  if (!household) {
    throw new HttpError(404, 'That house was not found.');
  }
  const records = await loadFinancialRecords([household._id]);
  const assessments = records.assessmentsByHousehold.get(String(household._id)) || [];
  const payments = records.paymentsByHousehold.get(String(household._id)) || [];
  return buildBill(household, assessments, payments, getAppUrl());
};
