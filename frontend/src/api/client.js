// src/api/client.js
// ============================================================
// Axios API Client
// - Base URL จาก .env
// - Auto attach JWT Token
// - Handle 401 (logout)
// ============================================================

import axios from 'axios';
import toast from 'react-hot-toast';

const client = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request Interceptor: แนบ Token ──────────────────────
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Response Interceptor: Handle Errors ─────────────────
client.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่';

    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return Promise.reject(err);
    }

    if (err.response?.status !== 422) {
      // Validation errors จัดการใน component เอง
      toast.error(msg);
    }

    return Promise.reject(err);
  }
);

export default client;