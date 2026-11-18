import { handleRoute } from '@/server/lib/http';
import { currentStatement } from '@/server/lib/statements/statements';

export const GET = handleRoute(async () => {
  const statement = await currentStatement();
  return Response.json({ statement });
});
