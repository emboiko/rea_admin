import { handleRoute, readJsonBody } from '@/server/lib/http';
import { generateAnnualAssessments } from '@/server/lib/ledger/annual';

export const POST = handleRoute(async (request) => {
  const body = await readJsonBody(request);
  const result = await generateAnnualAssessments(body);
  return Response.json(result);
});
