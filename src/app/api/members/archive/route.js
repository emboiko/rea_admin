import { handleRoute, readJsonBody } from '@/server/lib/http';
import { archiveMember } from '@/server/lib/auth/members';

export const POST = handleRoute(async (request) => {
  const body = await readJsonBody(request);
  const member = await archiveMember(body);
  return Response.json({ member });
});
