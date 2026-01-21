import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';

export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  tokenExpiry: number | null;
  timeLeft: number;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  tokenExpiry: null,
  timeLeft: 3600 // 60 minutes default
};

function createAuthStore() {
  const { subscribe, set, update }: Writable<AuthState> = writable(initialState);

  // Load from localStorage on init
  if (typeof window !== 'undefined') {
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    const userData = localStorage.getItem('user_data');
    const tokenExpiry = localStorage.getItem('token_expiry');

    if (accessToken && refreshToken) {
      const user = userData ? JSON.parse(userData) : null;
      const expiry = tokenExpiry ? parseInt(tokenExpiry) : null;
      const now = Math.floor(Date.now() / 1000);
      const timeLeft = expiry ? Math.max(0, expiry - now) : 3600;

      update(state => ({
        ...state,
        user,
        accessToken,
        refreshToken,
        isAuthenticated: true,
        tokenExpiry: expiry,
        timeLeft
      }));
    }
  }

  return {
    subscribe,
    set,
    update,
    
    login: (accessToken: string, refreshToken: string, user: User, expiresIn: number = 3600) => {
      if (typeof window !== 'undefined') {
        const expiry = Math.floor(Date.now() / 1000) + expiresIn;
        
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);
        localStorage.setItem('user_data', JSON.stringify(user));
        localStorage.setItem('token_expiry', expiry.toString());
        
        update(state => ({
          ...state,
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          tokenExpiry: expiry,
          timeLeft: expiresIn
        }));
      }
    },
    
    logout: () => {
      if (typeof window !== 'undefined') {
        const lang = localStorage.getItem('app_language');
        localStorage.clear();
        sessionStorage.clear();
        if (lang) localStorage.setItem('app_language', lang);
      }
      set(initialState);
    },
    
    updateToken: (accessToken: string, expiresIn: number = 3600) => {
      if (typeof window !== 'undefined') {
        const expiry = Math.floor(Date.now() / 1000) + expiresIn;
        
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('token_expiry', expiry.toString());
        
        update(state => ({
          ...state,
          accessToken,
          tokenExpiry: expiry,
          timeLeft: expiresIn
        }));
      }
    }
  };
}

export const auth = createAuthStore();