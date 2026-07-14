import { apiFetch } from './apiFetch';

export const getBookingsApi = async () => {
  return await apiFetch('/bookings/');
};

export const getBookingsByUserApi = async (userId) => {
  return await apiFetch(`/bookings/user/${userId}`);
};

export const createBookingApi = async (userId, slotId, startTime, endTime) => {
  return await apiFetch('/bookings/', {
    method: "POST",
    body: JSON.stringify({ userId, slotId, startTime, endTime })
  });
};

export const cancelBookingApi = async (bookingId) => {
  return await apiFetch(`/bookings/${bookingId}/cancel`, {
    method: "PUT"
  });
};

export const extendBookingApi = async (bookingId, endTime) => {
  return await apiFetch(`/bookings/${bookingId}/extend`, {
    method: "PUT",
    body: JSON.stringify({ endTime })
  });
};
