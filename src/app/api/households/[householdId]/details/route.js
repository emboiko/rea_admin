import { handleRoute, readJsonBody } from '@/server/lib/http';
import { updateHouseholdDetails } from '@/server/lib/households/households';

export const POST = handleRoute(async (request, context) => {
  const params = await context.params;
  const body = await readJsonBody(request);
  const household = await updateHouseholdDetails(params.householdId, body);
  return Response.json({ household });
});
