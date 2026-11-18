import { handleRoute } from '@/server/lib/http';
import { listArchivedMembers, listMembers } from '@/server/lib/auth/members';

export const GET = handleRoute(async () => {
  const members = await listMembers();
  const archivedMembers = await listArchivedMembers();
  return Response.json({ members, archivedMembers });
});
