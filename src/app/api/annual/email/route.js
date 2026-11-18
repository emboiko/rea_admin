import { handleRoute, readJsonBody } from '@/server/lib/http';
import { sendAnnualEmail } from '@/server/lib/email/campaigns';

export const POST = handleRoute(async (request) => {
  const body = await readJsonBody(request);
  const result = await sendAnnualEmail(body);
  return Response.json(result);
});
