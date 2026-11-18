import { handleRoute } from '@/server/lib/http';
import { accountStatement } from '@/server/lib/statements/accounts';

export const GET = handleRoute(async () => {
  const statement = await accountStatement();
  return Response.json({ statement });
});
