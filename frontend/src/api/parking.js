import { apiFetch } from './apiFetch';

export const getSlotsApi = async () => {
  return await apiFetch('/parking/slots');
};

export const updateSlotStatusApi = async (id, status) => {
  return await apiFetch(`/parking/slots/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ status })
  });
};
