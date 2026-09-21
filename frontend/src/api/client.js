const BASE_URL = '/api/v1';

let isRefreshing = false;
let refreshPromise = null;

const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await fetch(`${BASE_URL}/auth/refresh-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });

  const data = await response.json();
  if (!response.ok || !data.tokens?.accessToken) {
    throw new Error(data.error || 'Failed to refresh token');
  }

  localStorage.setItem('accessToken', data.tokens.accessToken);
  if (data.tokens.refreshToken) {
    localStorage.setItem('refreshToken', data.tokens.refreshToken);
  }

  return data.tokens.accessToken;
};

export const request = async (endpoint, options = {}) => {
  let token = localStorage.getItem('accessToken');
  const timeoutMs = options.timeout || 30000;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const makeFetch = async (authToken) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...options.headers
    };

    const url = `${BASE_URL}${endpoint}`;
    return fetch(url, {
      ...options,
      headers,
      signal: controller.signal
    });
  };

  try {
    let response = await makeFetch(token);

    // If 401 Unauthorized, attempt token refresh once
    if (response.status === 401 && !options._isRetry) {
      const storedRefreshToken = localStorage.getItem('refreshToken');
      if (storedRefreshToken) {
        try {
          if (!isRefreshing) {
            isRefreshing = true;
            refreshPromise = refreshAccessToken().finally(() => {
              isRefreshing = false;
              refreshPromise = null;
            });
          }
          const newToken = await refreshPromise;
          // Retry original request with new token
          response = await makeFetch(newToken);
        } catch {
          // Refresh failed, clean up and notify
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.dispatchEvent(new Event('auth:unauthorized'));
        }
      } else {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(data.error || `HTTP error ${response.status}`);
      error.status = response.status;
      error.data = data;
      error.requiresEmailVerification = data.requiresEmailVerification;
      throw error;
    }

    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
      const timeoutError = new Error('Network request timed out. Please try again.');
      timeoutError.status = 408;
      throw timeoutError;
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
};

export default { request };
