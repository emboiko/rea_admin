import { handleRoute } from '@/server/lib/http';
import { rotatePayLink } from '@/server/lib/households/households';

export const POST = handleRoute(async (_request, context) => {
  const params = await context.params;
  const result = await rotatePayLink(params.householdId);
  return Response.json(result);
});
