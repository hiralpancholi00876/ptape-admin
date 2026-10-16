// lib/axios.js
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'https://api.nudefiles.xyz/api/v1/admin/',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Optional: Add interceptors for request/response
axiosInstance.interceptors.request.use(
  (config) => {
    // Example: attach auth token
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
