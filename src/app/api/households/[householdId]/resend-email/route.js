import { handleRoute } from '@/server/lib/http';
import { resendHouseholdEmail } from '@/server/lib/email/campaigns';

export const POST = handleRoute(async (_request, context) => {
  const params = await context.params;
  const result = await resendHouseholdEmail(params.householdId);
  return Response.json(result);
});
