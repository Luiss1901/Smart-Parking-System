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
