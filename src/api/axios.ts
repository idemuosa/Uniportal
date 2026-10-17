import axios from 'axios';
import { auth } from '../firebase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?
    (import.meta.env.VITE_API_URL.endsWith('/api') ? import.meta.env.VITE_API_URL : `${import.meta.env.VITE_API_URL}/api`) :
    'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 🛡️ THE BEST Security Interceptor
api.interceptors.request.use(
  async (config) => {
    // 1. Try to get JWT from localStorage first (for Django/Custom Backend)
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
      return config;
    }

    // 2. Fallback to Firebase ID token
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
