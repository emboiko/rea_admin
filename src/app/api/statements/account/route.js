import { handleRoute, readJsonBody } from '@/server/lib/http';
import { claimHouseholdAccount } from '@/server/lib/statements/accounts';

export const POST = handleRoute(async (request) => {
  const body = await readJsonBody(request);
  const user = await claimHouseholdAccount(body);
  return Response.json({ user });
});
