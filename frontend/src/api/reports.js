import { apiFetch } from './apiFetch';

export const getRevenueApi = async () => {
  return await apiFetch('/reports/revenue');
};

export const getUsageApi = async () => {
  return await apiFetch('/reports/usage');
};
