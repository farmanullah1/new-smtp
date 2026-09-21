import { request } from './client';

export const signup = (payload) => {
  return request('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const verifyEmail = (payload) => {
  return request('/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const resendOtp = (payload) => {
  return request('/auth/resend-otp', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const login = (payload) => {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const verifyLogin2FA = (payload) => {
  return request('/auth/verify-login-2fa', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const forgotPassword = (payload) => {
  return request('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const verifyResetOtp = (payload) => {
  return request('/auth/verify-reset-otp', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const resetPassword = (payload) => {
  return request('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const requestEmailChange = (payload) => {
  return request('/auth/change-email/request', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const verifyEmailChange = (payload) => {
  return request('/auth/change-email/verify', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const logout = () => {
  return request('/auth/logout', {
    method: 'POST'
  }).catch(() => {});
};
