import QRCode from 'qrcode';
import { Household } from '@/server/models/Household';
import { requireLedgerAccess } from '@/server/lib/auth/guards';
import { getAppUrl } from '@/server/lib/appUrl';
import { formatMailingAddress } from '@/shared/address';
import { loadFinancialRecords, summarizeHousehold } from '@/server/lib/ledger/balances';

export const buildBill = async (household, assessments, payments, appUrl) => {
  const summary = summarizeHousehold(household._id, assessments, payments);
  const payUrl = `${appUrl}/pay/${household.payToken}`;
  const qrCodeDataUrl = await QRCode.toDataURL(payUrl, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 240,
  });
  return {
    householdId: String(household._id),
    mailingAddress: formatMailingAddress(household.streetAddress, household.lotNumber),
    occupantName: household.occupantName || '',
    openFees: summary.openFees,
    totalOwedCents: summary.totalOwedCents,
    payUrl,
    qrCodeDataUrl,
  };
};

export const getPrintBills = async () => {
  await requireLedgerAccess();
  const households = await Household.find({ status: 'active' }).lean();
  households.sort((leftHouse, rightHouse) => {
    const addressCompare = leftHouse.streetAddress.localeCompare(rightHouse.streetAddress, undefined, {
      sensitivity: 'base',
    });
    if (addressCompare !== 0) {
      return addressCompare;
    }
    return String(leftHouse.lotNumber || '').localeCompare(String(rightHouse.lotNumber || ''), undefined, {
      numeric: true,
    });
  });
  const records = await loadFinancialRecords(households.map((household) => household._id));
  const appUrl = getAppUrl();
  const bills = [];
  for (const household of households) {
    const assessments = records.assessmentsByHousehold.get(String(household._id)) || [];
    const payments = records.paymentsByHousehold.get(String(household._id)) || [];
    const bill = await buildBill(household, assessments, payments, appUrl);
    bills.push(bill);
  }
  return bills;
};
