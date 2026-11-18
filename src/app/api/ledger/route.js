import { handleRoute } from '@/server/lib/http';
import { getLedger } from '@/server/lib/ledger/ledger';

export const GET = handleRoute(async () => {
  const rows = await getLedger();
  return Response.json({ rows });
});
