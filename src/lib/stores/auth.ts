import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// 1. กำหนด Type ให้ตรงกับ Response Body เป๊ะๆ
export interface LoginResponse {
  access_token: string;
  token_type: string;
  user_id: number;
  email: string;
  name: string;
  role: string;
}

interface UserData {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  user: UserData | null;
}

// 3. สร้าง Store
function createAuthStore() {
  let initialToken: string | null = null;
  let initialUser: UserData | null = null;

  if (browser) {
    initialToken = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user_info');
    if (storedUser) {
      initialUser = JSON.parse(storedUser);
    }
  }

  const { subscribe, set } = writable<AuthState>({
    token: initialToken,
    isAuthenticated: !!initialToken,
    user: initialUser
  });

  return {
    subscribe,
    
    // ฟังก์ชัน Login: รับ JSON ก้อนใหญ่จาก API
    login: (data: LoginResponse) => {
      const token = data.access_token;
      
      // แยกเฉพาะข้อมูล User ออกมาเก็บ
      const user: UserData = {
        id: data.user_id,
        email: data.email,
        name: data.name,
        role: data.role
      };

      if (browser) {
        localStorage.setItem('access_token', token);
        localStorage.setItem('user_info', JSON.stringify(user));
      }

      // อัปเดต Store
      set({
        token,
        isAuthenticated: true,
        user
      });
    },

    // ฟังก์ชัน Logout
    logout: () => {
      if (browser) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_info');
      }
      set({
        token: null,
        isAuthenticated: false,
        user: null
      });
    }
  };
}

export const auth = createAuthStore();