import { requestJson } from '@/client/services/httpClient';

export const billService = {
  getBills: async () => {
    const payload = await requestJson('/api/bills');
    return payload.bills;
  },
  getBill: async (householdId) => {
    const payload = await requestJson(`/api/households/${householdId}/bill`);
    return payload.bill;
  },
};
