import axios from 'axios';
import { clearAuthToken } from '@/utils/commonFunc';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:5551/api/v1/admin/',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401: no token was sent. 403: the token was rejected (expired or invalid).
    const status = error.response?.status;
    if ((status === 401 || status === 403) && typeof window !== 'undefined') {
      clearAuthToken();
      // A full page load (not router navigation) so nothing from the dead session survives.
      window.location.replace('/login');
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
