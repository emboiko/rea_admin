import { handleRoute, readJsonBody } from '@/server/lib/http';
import { createHousehold } from '@/server/lib/households/households';

export const POST = handleRoute(async (request) => {
  const body = await readJsonBody(request);
  const household = await createHousehold(body);
  return Response.json({ household });
});
