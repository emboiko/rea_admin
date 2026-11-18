import { handleRoute } from '@/server/lib/http';
import { archiveHouseholdLogin } from '@/server/lib/households/households';

export const POST = handleRoute(async (_request, context) => {
  const params = await context.params;
  const result = await archiveHouseholdLogin(params.householdId);
  return Response.json(result);
});
