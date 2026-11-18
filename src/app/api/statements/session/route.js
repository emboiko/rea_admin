import { handleRoute, readJsonBody } from '@/server/lib/http';
import { openStatementSession } from '@/server/lib/statements/statements';

export const POST = handleRoute(async (request) => {
  const body = await readJsonBody(request);
  const statement = await openStatementSession(body.payToken);
  return Response.json({ statement });
});
