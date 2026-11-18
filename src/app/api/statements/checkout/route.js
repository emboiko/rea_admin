import { handleRoute } from '@/server/lib/http';
import { readStatementHousehold } from '@/server/lib/statements/statements';
import { startCheckout } from '@/server/lib/statements/checkout';

export const POST = handleRoute(async () => {
  const household = await readStatementHousehold();
  const result = await startCheckout(household._id);
  return Response.json(result);
});
