import { handleRoute, readJsonBody } from '@/server/lib/http';
import { setOfficeLabel } from '@/server/lib/auth/members';

export const POST = handleRoute(async (request) => {
  const body = await readJsonBody(request);
  const member = await setOfficeLabel(body);
  return Response.json({ member });
});
