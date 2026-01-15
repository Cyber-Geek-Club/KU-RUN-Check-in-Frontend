import axios, { type AxiosError } from "axios";
import { goto } from "$app/navigation";

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://158.108.102.14:8001").replace(/\/$/, "");

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.set("Authorization", `Bearer ${token}`);
    }
    (config as any).__retryCount = (config as any).__retryCount || 0;
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor with retry logic
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as any;

    // Handle 401 - Token expired
    if (error.response?.status === 401) {
      console.error("Token expired or invalid, redirecting to login");
      localStorage.removeItem("access_token");
      goto("/auth/login");
      return Promise.reject(error);
    }

    // Handle 502, 503, 504 - Gateway errors with retry
    const retryableStatuses = [502, 503, 504];
    const isRetryable = error.response?.status && retryableStatuses.includes(error.response.status);
    const isNetworkError = !error.response && error.code === "ECONNABORTED";

    if ((isRetryable || isNetworkError) && config && config.__retryCount < MAX_RETRIES) {
      config.__retryCount += 1;
      console.warn(
        `🔄 Retry attempt ${config.__retryCount}/${MAX_RETRIES} for ${config.url} (status: ${error.response?.status || "network error"})`
      );
      await delay(RETRY_DELAY * config.__retryCount);
      return api(config);
    }

    return Promise.reject(error);
  }
);

// Helper to get auth headers
export function getAuthHeaders() {
  const token = localStorage.getItem("access_token");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

// Helper to get axios config with auth
export function getAxiosConfig() {
  return { headers: getAuthHeaders() };
}

export default api;
