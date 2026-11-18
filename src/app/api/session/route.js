import { handleRoute, readJsonBody } from '@/server/lib/http';
import { currentSession, login, logout } from '@/server/lib/auth/login';

export const GET = handleRoute(async () => {
  const user = await currentSession();
  return Response.json({ user });
});

export const POST = handleRoute(async (request) => {
  const body = await readJsonBody(request);
  const user = await login(body);
  return Response.json({ user });
});

export const DELETE = handleRoute(async () => {
  await logout();
  return Response.json({ ok: true });
});
