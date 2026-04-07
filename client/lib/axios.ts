import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
});

api.interceptors.request.use((config) => {
  const token = Cookies.get('access_token');

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      const isLoginPath = typeof window !== 'undefined' && window.location.pathname.startsWith('/login');
      const isAuthApi = error.config.url?.includes('/api/auth/login');

      if (!isAuthApi) {
        Cookies.remove('access_token', { path: '/' });

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('auth-changed'));

          if (!isLoginPath) {
            window.location.href = '/login';
          }
        }
      }
    }

    return Promise.reject(error);
  },
);

export default api;
