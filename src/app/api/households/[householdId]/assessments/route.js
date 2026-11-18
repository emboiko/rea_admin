import { handleRoute, readJsonBody } from '@/server/lib/http';
import { addHistoricalAssessment } from '@/server/lib/ledger/entries';

export const POST = handleRoute(async (request, context) => {
  const params = await context.params;
  const body = await readJsonBody(request);
  const assessment = await addHistoricalAssessment(params.householdId, body);
  return Response.json({ assessment });
});
