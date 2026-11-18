import { requestJson } from '@/client/services/httpClient';

export const householdService = {
  create: async (body) => {
    const payload = await requestJson('/api/households', { method: 'POST', body });
    return payload.household;
  },
  getDetail: async (householdId) => {
    return requestJson(`/api/households/${householdId}`);
  },
  updateDetails: async (householdId, body) => {
    const payload = await requestJson(`/api/households/${householdId}/details`, {
      method: 'POST',
      body,
    });
    return payload.household;
  },
  addAssessment: async (householdId, body) => {
    await requestJson(`/api/households/${householdId}/assessments`, { method: 'POST', body });
  },
  voidAssessment: async (householdId, assessmentId) => {
    await requestJson(`/api/households/${householdId}/assessments/${assessmentId}/void`, {
      method: 'POST',
    });
  },
  recordPayment: async (householdId, body) => {
    await requestJson(`/api/households/${householdId}/payments`, { method: 'POST', body });
  },
  rotateLink: async (householdId) => {
    return requestJson(`/api/households/${householdId}/rotate-link`, { method: 'POST' });
  },
  archiveLogin: async (householdId) => {
    await requestJson(`/api/households/${householdId}/archive-login`, { method: 'POST' });
  },
  resendEmail: async (householdId) => {
    await requestJson(`/api/households/${householdId}/resend-email`, {
      method: 'POST',
    });
  },
};
