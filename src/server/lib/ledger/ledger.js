import { Household } from '@/server/models/Household';
import { formatCentsPlain } from '@/shared/money';
import { requireLedgerAccess } from '@/server/lib/auth/guards';
import { formatMailingAddress } from '@/shared/address';
import { loadFinancialRecords, summarizeHousehold } from '@/server/lib/ledger/balances';

const csvCell = (value) => {
  const text = value === null || value === undefined ? '' : String(value);
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
};

export const getLedger = async () => {
  await requireLedgerAccess();
  const households = await Household.find({ status: 'active' }).lean();
  const records = await loadFinancialRecords(households.map((household) => household._id));
  const rows = households.map((household) => {
    const assessments = records.assessmentsByHousehold.get(String(household._id)) || [];
    const payments = records.paymentsByHousehold.get(String(household._id)) || [];
    const summary = summarizeHousehold(household._id, assessments, payments);
    return {
      id: String(household._id),
      streetAddress: household.streetAddress,
      lotNumber: household.lotNumber || '',
      occupantName: household.occupantName || '',
      mailingAddress: formatMailingAddress(household.streetAddress, household.lotNumber),
      totalOwedCents: summary.totalOwedCents,
      yearsOutstanding: summary.yearsOutstanding,
      oldestOpenYear: summary.oldestOpenYear,
      openYears: summary.openYears,
    };
  });
  rows.sort((leftRow, rightRow) => {
    if (leftRow.totalOwedCents !== rightRow.totalOwedCents) {
      return rightRow.totalOwedCents - leftRow.totalOwedCents;
    }
    return leftRow.mailingAddress.localeCompare(rightRow.mailingAddress, undefined, {
      sensitivity: 'base',
    });
  });
  return rows;
};

export const exportLedgerCsv = async () => {
  const rows = await getLedger();
  const header = [
    'address',
    'lot',
    'occupant',
    'total owed',
    'years outstanding',
    'oldest open year',
    'open years',
  ];
  const lines = [header.join(',')];
  for (const row of rows) {
    let oldest = '';
    if (row.oldestOpenYear !== null) {
      oldest = String(row.oldestOpenYear);
    }
    lines.push(
      [
        csvCell(row.mailingAddress),
        csvCell(row.lotNumber),
        csvCell(row.occupantName),
        csvCell(formatCentsPlain(row.totalOwedCents)),
        csvCell(row.yearsOutstanding),
        csvCell(oldest),
        csvCell(row.openYears.join(';')),
      ].join(','),
    );
  }
  return lines.join('\n');
};
