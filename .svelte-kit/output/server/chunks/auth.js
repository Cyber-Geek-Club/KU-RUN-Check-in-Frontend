import { w as writable } from "./index.js";
function createAuthStore() {
  let initialToken = null;
  let initialUser = null;
  const { subscribe, set } = writable({
    token: initialToken,
    isAuthenticated: false,
    user: initialUser
  });
  return {
    subscribe,
    login: (data) => {
      return;
    },
    logout: () => {
      return;
    },
    checkTokenValidity: () => {
      return false;
    }
  };
}
createAuthStore();
