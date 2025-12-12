import { writable } from "svelte/store";
import { browser } from "$app/environment";

export interface UserData {
  id: number | string;
  email: string;
  name: string;
  role: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in?: number; 

  user_id?: number;
  email?: string;
  name?: string;
  role?: string;

  user?: UserData | any;
  [key: string]: any;
}

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  user: UserData | null;
}

function createAuthStore() {
  let initialToken: string | null = null;
  let initialUser: UserData | null = null;

  if (browser) {
    initialToken = localStorage.getItem("access_token");
    const storedUser = localStorage.getItem("user_info");
    if (storedUser) {
      try {
        initialUser = JSON.parse(storedUser);
      } catch (e) {
        console.error("Error parsing user info", e);
      }
    }
  }

  const { subscribe, set } = writable<AuthState>({
    token: initialToken,
    isAuthenticated: !!initialToken,
    user: initialUser,
  });

  return {
    subscribe,
    login: (data: LoginResponse) => {
      if (!browser) return;

      const token = data.access_token;
      let user: UserData;
      if (data.user && typeof data.user === "object") {
        user = {
          id: data.user.id || data.user.user_id,
          email: data.user.email,
          name: data.user.name,
          role: data.user.role,
        };
      } else {
        user = {
          id: data.user_id ?? 0,
          email: data.email ?? "",
          name: data.name ?? "",
          role: data.role ?? "",
        };
      }
      const expiryTime =
        Date.now() + (data.expires_in ? data.expires_in * 1000 : 86400000);


      localStorage.setItem("access_token", token);
      localStorage.setItem("user_info", JSON.stringify(user));
      localStorage.setItem("token_expiry", expiryTime.toString()); 

      set({
        token,
        isAuthenticated: true,
        user,
      });
    },

    logout: () => {
      if (!browser) return;

      localStorage.removeItem("access_token");
      localStorage.removeItem("user_info");
      localStorage.removeItem("token_expiry");

      sessionStorage.clear(); 

      set({
        token: null,
        isAuthenticated: false,
        user: null,
      });
    },


    checkTokenValidity: (): boolean => {
      if (!browser) return false;

      const token = localStorage.getItem("access_token");
      const expiryStr = localStorage.getItem("token_expiry");

      if (!token || !expiryStr) return false;

      const expiry = parseInt(expiryStr);
      const now = Date.now();

      if (now >= expiry - 60000) {
        return false; 
      }

      return true; 
    },
  };
}

export const auth = createAuthStore();
