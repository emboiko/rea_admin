import { HttpError, handleRoute } from '@/server/lib/http';
import { requireUser } from '@/server/lib/auth/guards';
import { startCheckout } from '@/server/lib/statements/checkout';

export const POST = handleRoute(async () => {
  const user = await requireUser();
  if (!user.householdId) {
    throw new HttpError(404, 'No house is linked to this login.');
  }
  const result = await startCheckout(user.householdId);
  return Response.json(result);
});
