import { apiFetch } from './apiFetch';

export const loginApi = async (email, password) => {
  return await apiFetch('/auth/login', {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
};

export const registerApi = async (name, email, password, plateNumber) => {
  return await apiFetch('/auth/register', {
    method: "POST",
    body: JSON.stringify({ name, email, password, plateNumber })
  });
};

export const verifyApi = async (email, otp) => {
  return await apiFetch('/auth/verify', {
    method: "POST",
    body: JSON.stringify({ email, otp })
  });
};

export const getMailApi = async () => {
  return await apiFetch('/notifications/');
};

export const verifyTokenApi = async () => {
  return await apiFetch('/auth/verify-token', {
    method: "GET"
  });
};
