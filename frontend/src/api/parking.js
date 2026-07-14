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

export const createSlotApi = async (code, area, type) => {
  return await apiFetch('/parking/slots', {
    method: "POST",
    body: JSON.stringify({ code, area, type })
  });
};

export const updateSlotApi = async (id, code, area, type) => {
  return await apiFetch(`/parking/slots/${id}`, {
    method: "PUT",
    body: JSON.stringify({ code, area, type })
  });
};

export const deleteSlotApi = async (id) => {
  return await apiFetch(`/parking/slots/${id}`, {
    method: "DELETE"
  });
};
