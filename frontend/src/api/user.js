import { apiFetch } from './apiFetch';

export const getProfileApi = async (userId) => {
  return await apiFetch(`/users/${userId}`);
};

export const updateProfileApi = async (userId, data) => {
  return await apiFetch(`/users/${userId}`, {
    method: "PUT",
    body: JSON.stringify(data)
  });
};

export const changePasswordApi = async (userId, oldPassword, newPassword) => {
  return await apiFetch(`/users/${userId}/change-password`, {
    method: "PUT",
    body: JSON.stringify({ oldPassword, newPassword })
  });
};
