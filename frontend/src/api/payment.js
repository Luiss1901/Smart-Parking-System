import { apiFetch } from './apiFetch';

export const getPaymentsApi = async () => {
  return await apiFetch('/payments/');
};

export const getPaymentsHistoryApi = async (userId) => {
  return await apiFetch(`/payments/history/${userId}`);
};

export const createPaymentUrlApi = async (bookingId, userId, amount) => {
  return await apiFetch('/payments/create-payment-url', {
    method: "POST",
    body: JSON.stringify({ bookingId, userId, amount })
  });
};
