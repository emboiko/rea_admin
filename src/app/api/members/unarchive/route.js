import { handleRoute, readJsonBody } from '@/server/lib/http';
import { unarchiveMember } from '@/server/lib/auth/members';

export const POST = handleRoute(async (request) => {
  const body = await readJsonBody(request);
  const member = await unarchiveMember(body);
  return Response.json({ member });
});
