import { handleRoute, readJsonBody } from '@/server/lib/http';
import { recordManualPayment } from '@/server/lib/ledger/entries';

export const POST = handleRoute(async (request, context) => {
  const params = await context.params;
  const body = await readJsonBody(request);
  const payment = await recordManualPayment(params.householdId, body);
  return Response.json({ payment });
});
