import apiClient from './client';

export const getAnalyticsOverview = async () => {
  const response = await apiClient.get('/api/analytics/overview');
  return response.data;
};

export const getLinkStats = async (linkId, range = 30) => {
  const response = await apiClient.get(`/api/stats/links/${linkId}?range=${range}`);
  return response.data;
};

export const getABTest = async (linkId) => {
  const response = await apiClient.get(`/api/links/${linkId}/abtest`);
  return response.data;
};

export const saveABTest = async (linkId, data) => {
  const response = await apiClient.post(`/api/links/${linkId}/abtest`, data);
  return response.data;
};

export const deleteABTest = async (linkId) => {
  const response = await apiClient.delete(`/api/links/${linkId}/abtest`);
  return response.data;
};

export default {
  getAnalyticsOverview,
  getLinkStats,
  getABTest,
  saveABTest,
  deleteABTest,
};
