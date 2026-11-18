import { requestJson } from '@/client/services/httpClient';

export const memberService = {
  list: async () => {
    const payload = await requestJson('/api/members');
    return {
      members: payload.members,
      archivedMembers: payload.archivedMembers,
    };
  },
  promote: async (userId) => {
    await requestJson('/api/members/promote', { method: 'POST', body: { userId } });
  },
  demote: async (userId) => {
    await requestJson('/api/members/demote', { method: 'POST', body: { userId } });
  },
  transfer: async (userId, confirmation) => {
    await requestJson('/api/members/transfer', { method: 'POST', body: { userId, confirmation } });
  },
  archive: async (userId) => {
    await requestJson('/api/members/archive', { method: 'POST', body: { userId } });
  },
  unarchive: async (userId) => {
    await requestJson('/api/members/unarchive', { method: 'POST', body: { userId } });
  },
  setOfficeLabel: async (userId, officeLabel) => {
    await requestJson('/api/members/office-label', {
      method: 'POST',
      body: { userId, officeLabel },
    });
  },
};
