import { handleRoute, readJsonBody } from '@/server/lib/http';
import { setAnnualAmount } from '@/server/lib/ledger/annual';

export const POST = handleRoute(async (request) => {
  const body = await readJsonBody(request);
  const schedule = await setAnnualAmount(body);
  return Response.json({ schedule });
});
