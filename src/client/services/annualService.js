import { requestJson } from '@/client/services/httpClient';

export const annualService = {
  getStatus: async () => {
    return requestJson('/api/annual');
  },
  setAmount: async (body) => {
    const payload = await requestJson('/api/annual/schedule', { method: 'POST', body });
    return payload.schedule;
  },
  generate: async (body) => {
    return requestJson('/api/annual/generate', { method: 'POST', body });
  },
  sendEmail: async (year) => {
    return requestJson('/api/annual/email', { method: 'POST', body: { year } });
  },
};
