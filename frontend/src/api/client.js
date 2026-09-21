const BASE_URL = '/api/v1';

export const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem('accessToken');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // If token expired / unauthorized, trigger logout event if not already on auth
    if (response.status === 401 && token) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.dispatchEvent(new Event('auth:unauthorized'));
    }

    const error = new Error(data.error || `HTTP error ${response.status}`);
    error.status = response.status;
    error.data = data;
    error.requiresEmailVerification = data.requiresEmailVerification;
    throw error;
  }

  return data;
};

export default { request };
