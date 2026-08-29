import apiClient from './client';

export const registerUser = async ({ username, email, password }) => {
  const { data } = await apiClient.post('/api/auth/register', {
    username,
    email,
    password,
  });
  return data;
};

export const loginUser = async ({ email, password }) => {
  const { data } = await apiClient.post('/api/auth/login', {
    email,
    password,
  });
  return data;
};

export const fetchCurrentUser = async () => {
  const { data } = await apiClient.get('/api/auth/me');
  return data;
};
