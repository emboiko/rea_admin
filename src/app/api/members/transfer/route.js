import { handleRoute, readJsonBody } from '@/server/lib/http';
import { transferPresidency } from '@/server/lib/auth/members';

export const POST = handleRoute(async (request) => {
  const body = await readJsonBody(request);
  const member = await transferPresidency(body);
  return Response.json({ member });
});
