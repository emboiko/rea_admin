import { handleRoute, readJsonBody } from '@/server/lib/http';
import { demoteMember } from '@/server/lib/auth/members';

export const POST = handleRoute(async (request) => {
  const body = await readJsonBody(request);
  const member = await demoteMember(body);
  return Response.json({ member });
});
