import { handleRoute, readJsonBody } from '@/server/lib/http';
import { promoteMember } from '@/server/lib/auth/members';

export const POST = handleRoute(async (request) => {
  const body = await readJsonBody(request);
  const member = await promoteMember(body);
  return Response.json({ member });
});
