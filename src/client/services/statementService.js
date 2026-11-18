import { requestJson } from '@/client/services/httpClient';

export const statementService = {
  openSession: async (payToken) => {
    const payload = await requestJson('/api/statements/session', {
      method: 'POST',
      body: { payToken },
    });
    return payload.statement;
  },
  getCurrent: async () => {
    const payload = await requestJson('/api/statements/current');
    return payload.statement;
  },
  startCheckout: async () => {
    return requestJson('/api/statements/checkout', { method: 'POST' });
  },
  claimAccount: async (body) => {
    const payload = await requestJson('/api/statements/account', { method: 'POST', body });
    return payload.user;
  },
  getReceipt: async (receiptSecret) => {
    const payload = await requestJson(`/api/receipts/${receiptSecret}`);
    return payload.receipt;
  },
};
