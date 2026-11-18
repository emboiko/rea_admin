import { handleRoute } from '@/server/lib/http';
import { getAnnualStatus } from '@/server/lib/email/campaigns';

export const GET = handleRoute(async (request) => {
  const url = new URL(request.url);
  const year = url.searchParams.get('year');
  const status = await getAnnualStatus(year);
  return Response.json(status);
});
