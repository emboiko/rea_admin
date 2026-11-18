import { handleRoute } from '@/server/lib/http';
import { getPrintBills } from '@/server/lib/bills/printBills';

export const GET = handleRoute(async () => {
  const bills = await getPrintBills();
  return Response.json({ bills });
});
