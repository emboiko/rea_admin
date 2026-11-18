import { handleRoute } from '@/server/lib/http';
import { exportLedgerCsv } from '@/server/lib/ledger/ledger';

export const GET = handleRoute(async () => {
  const csv = await exportLedgerCsv();
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="delinquency.csv"',
    },
  });
});
