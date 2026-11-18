import { handleRoute } from '@/server/lib/http';
import { voidAssessment } from '@/server/lib/ledger/entries';

export const POST = handleRoute(async (_request, context) => {
  const params = await context.params;
  const assessment = await voidAssessment(params.householdId, params.assessmentId);
  return Response.json({ assessment });
});
