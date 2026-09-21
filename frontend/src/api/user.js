import { request } from './client';

export const getProfile = () => {
  return request('/users/me', {
    method: 'GET'
  });
};

export const updateProfile = (payload) => {
  return request('/users/me', {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
};

export const updatePassword = (payload) => {
  return request('/users/me/password', {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
};

export const toggleTwoFactor = (enabled) => {
  return request('/users/me/2fa', {
    method: 'POST',
    body: JSON.stringify({ enabled })
  });
};

export const getLoginHistory = (limit = 10) => {
  return request(`/users/me/logins?limit=${limit}`, {
    method: 'GET'
  });
};

export const deleteAccount = (password) => {
  return request('/users/me', {
    method: 'DELETE',
    body: JSON.stringify({ password })
  });
};

export const getHealth = () => {
  return request('/health', {
    method: 'GET'
  });
};

export const sendTestEmail = (to) => {
  return request('/test-email', {
    method: 'POST',
    body: JSON.stringify({ to })
  });
};
