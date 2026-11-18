import { handleRoute } from '@/server/lib/http';
import { getPrintBill } from '@/server/lib/bills/printBill';

export const GET = handleRoute(async (_request, context) => {
  const params = await context.params;
  const bill = await getPrintBill(params.householdId);
  return Response.json({ bill });
});
