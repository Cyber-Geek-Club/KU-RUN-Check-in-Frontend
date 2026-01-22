import axios, { type AxiosError, type AxiosInstance } from 'axios';
import Swal from 'sweetalert2';

// กำหนด URL API
// Use VITE_API_BASE_URL when provided. In dev (no env) use the Vite proxy '/api'.
const rawApiBase = import.meta.env.VITE_API_BASE_URL;
const DEFAULT_API_HOST = 'https://reg1.src.ku.ac.th:8005';
const computedApiBase = (rawApiBase && rawApiBase.trim() !== "")
  ? rawApiBase.replace(/\/$/, '')
  : DEFAULT_API_HOST;
export const API_BASE_URL = computedApiBase;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

// ตัวแปรกันการ Refresh ซ้ำซ้อน
let isRefreshing = false;
let failedQueue: any[] = [];

// ฟังก์ชันเคลียร์คิวที่รอ Token
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// ฟังก์ชันหน่วงเวลา
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// สร้าง Axios Instance
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ 1. Request Interceptor: แนบ Token เสมอ
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    // Debug: log if Authorization header is set
    console.log('📤 Request:', config.method?.toUpperCase(), config.url, {
      hasAuth: !!config.headers['Authorization']
    });
    (config as any).__retryCount = (config as any).__retryCount || 0;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ✅ 2. Response Interceptor: จัดการ 401 และ Auto Refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    if (error.response?.status) {
      const status = error.response.status;

      // 👉 ถ้าเจอ 401: ให้ลอง Refresh Token ก่อน (อย่าเพิ่ง Logout)
      if (status === 401 && !originalRequest._retry) {

        if (isRefreshing) {
          return new Promise(function (resolve, reject) {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers.Authorization = 'Bearer ' + token;
              return api(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        const refreshToken = localStorage.getItem('refresh_token');

        if (!refreshToken) {
          isRefreshing = false;
          return handleLogout(error);
        }

        try {
          // ยิงไปขอ Token ใหม่
          const response = await fetch(`${API_BASE_URL}/api/users/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken }),
          });

          if (!response.ok) throw new Error('Refresh failed');

          const data = await response.json();

          if (data.access_token) {
            console.log('🔄 Token refreshed successfully');
            localStorage.setItem('access_token', data.access_token);
            if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token);

            // Update token expiry if provided
            if (data.expires_in) {
              const expiry = Date.now() + data.expires_in * 1000;
              localStorage.setItem('token_expiry', expiry.toString());
            }

            // ⚠️ สำคัญมาก: ต้องอัปเดต Authorization header ใน originalRequest
            const newToken = data.access_token;

            // อัปเดต default header ของ axios instance
            api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

            // อัปเดต header ใน originalRequest - ใช้ bracket notation
            if (!originalRequest.headers) {
              originalRequest.headers = {};
            }
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;

            console.log('🔄 Retrying request with new token:', {
              hasAuthHeader: !!originalRequest.headers['Authorization'],
              url: originalRequest.url
            });

            processQueue(null, newToken);
            isRefreshing = false;

            return api(originalRequest); // ยิงซ้ำ
          } else {
            // No access_token in response - treat as refresh failure
            throw new Error('No access_token in refresh response');
          }
        } catch (refreshError) {
          processQueue(refreshError, null);
          isRefreshing = false;
          return handleLogout(refreshError);
        }
      }

      // 👉 ถ้าเป็น 401 ที่ retry แล้วยังไม่ผ่าน หรือเป็น 403 ให้ Logout
      if (status === 401 && originalRequest._retry) {
        // Already tried refresh, still got 401 - force logout
        return handleLogout(error);
      }

      if (status === 403) {
        // 403 Forbidden - no permission, force logout
        return handleLogout(error);
      }

      console.warn(`⚠️ API Error ${status}: ${error.response?.statusText || 'Unknown'}`);
      return Promise.reject(error);
    }

    // จัดการ Network Error
    const isNetworkError = !error.response && error.code === 'ECONNABORTED';
    if (isNetworkError && originalRequest && originalRequest.__retryCount < MAX_RETRIES) {
      originalRequest.__retryCount += 1;
      await delay(RETRY_DELAY * originalRequest.__retryCount);
      return api(originalRequest);
    }

    return Promise.reject(error);
  }
);

// ✅ 3. ฟังก์ชัน Logout แบบมี Popup ค้างไว้
function handleLogout(error: any) {
  console.error('❌ Session expired. Logging out...');

  if (typeof window !== 'undefined') {
    Swal.fire({
      title: '<span style="color: #f87171">Session Expired</span>',
      text: 'Your login session has timed out. Please log in again.',
      icon: 'warning',
      background: '#1e293b',
      color: '#cbd5e1',
      confirmButtonText: 'Go to Login',
      confirmButtonColor: '#ef4444',
      allowOutsideClick: false,
      allowEscapeKey: false
    }).then(() => {
      // กดปุ่มแล้วค่อยเด้ง
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/auth/login';
    });
  }

  return Promise.reject(error);
}

export default api;