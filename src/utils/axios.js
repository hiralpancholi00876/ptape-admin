// lib/axios.js
import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: 'http://109.199.120.152:5551/api/v1/admin/', // Set base URL here
    // baseURL: 'http://localhost:5551/api/v1/admin/',
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json'
    }
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
        // Handle global errors here
        return Promise.reject(error);
    }
);

export default axiosInstance;
