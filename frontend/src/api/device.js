import { apiFetch } from './apiFetch';

export const simulateCameraApi = async (slotId, action, plateNumber) => {
  return await apiFetch('/devices/simulate/camera', {
    method: "POST",
    body: JSON.stringify({ slotId, action, plateNumber })
  });
};

export const simulateBarrierApi = async (action) => {
  return await apiFetch(`/devices/simulate/barrier/${action}`, {
    method: "POST"
  });
};

export const getDeviceLogsApi = async () => {
  return await apiFetch('/devices/logs');
};
