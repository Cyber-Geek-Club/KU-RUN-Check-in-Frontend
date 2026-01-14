import { writable } from 'svelte/store';
import { goto } from '$app/navigation';

interface User {
  id: string;
  email: string;
  role: string;
  [key: string]: any;
}

function createAuthStore() {
  const { subscribe, set, update } = writable<User | null>(null);

  return {
    subscribe,
    
    setUser: (user: User | null) => {
      set(user);
      if (user) {
        localStorage.setItem('user_info', JSON.stringify(user));
      } else {
        localStorage.removeItem('user_info');
      }
    },
    
    logout: () => {
      set(null);
      localStorage.removeItem('user_info');
    },
    
    init: () => {
      const userInfo = localStorage.getItem('user_info');
      if (userInfo) {
        try {
          const user = JSON.parse(userInfo);
          set(user);
        } catch (e) {
          console.error('Failed to parse user info:', e);
          localStorage.removeItem('user_info');
        }
      }
    }
  };
}

export const auth = createAuthStore();
