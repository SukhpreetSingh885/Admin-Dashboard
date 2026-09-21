import axios from 'axios';

export const TOKEN_KEY =
  'viralstan_admin_token';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token =
    sessionStorage.getItem(TOKEN_KEY) ??
    localStorage.getItem(TOKEN_KEY);

  if (token) {
    config.headers.Authorization =
      `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,

  (error: unknown) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401
    ) {
      sessionStorage.removeItem(
        TOKEN_KEY,
      );

      sessionStorage.removeItem(
        'viralstan_admin_user',
      );

      localStorage.removeItem(
        TOKEN_KEY,
      );

      localStorage.removeItem(
        'viralstan_admin_user',
      );

      if (
        window.location.pathname !==
        '/login'
      ) {
        window.location.assign(
          '/login',
        );
      }
    }

    return Promise.reject(error);
  },
);

export const getApiError = (
  error: unknown,
  fallback = 'Something went wrong',
) => {
  if (!axios.isAxiosError(error)) {
    return fallback;
  }

  const data =
    error.response?.data as
      | {
          message?: string | string[];
        }
      | undefined;

  return Array.isArray(data?.message)
    ? data.message.join(', ')
    : data?.message ?? fallback;
};

export default api;