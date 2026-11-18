import { requestJson } from '@/client/services/httpClient';

export const sessionService = {
  getCurrentUser: async () => {
    const payload = await requestJson('/api/session');
    return payload.user;
  },
  login: async ({ email, password }) => {
    const payload = await requestJson('/api/session', {
      method: 'POST',
      body: { email, password },
    });
    return payload.user;
  },
  logout: async () => {
    await requestJson('/api/session', { method: 'DELETE' });
  },
};
