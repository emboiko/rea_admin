import { requestJson } from '@/client/services/httpClient';

export const accountService = {
  getStatement: async () => {
    const payload = await requestJson('/api/account');
    return payload.statement;
  },
  startCheckout: async () => {
    return requestJson('/api/account/checkout', { method: 'POST' });
  },
};
