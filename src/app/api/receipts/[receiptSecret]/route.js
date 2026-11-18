import { handleRoute } from '@/server/lib/http';
import { getReceipt } from '@/server/lib/statements/checkout';

export const GET = handleRoute(async (_request, context) => {
  const params = await context.params;
  const receipt = await getReceipt(params.receiptSecret);
  return Response.json({ receipt });
});
