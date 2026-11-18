import { handleRoute } from '@/server/lib/http';
import { getHouseholdDetail } from '@/server/lib/households/households';

export const GET = handleRoute(async (_request, context) => {
  const params = await context.params;
  const detail = await getHouseholdDetail(params.householdId);
  return Response.json(detail);
});
