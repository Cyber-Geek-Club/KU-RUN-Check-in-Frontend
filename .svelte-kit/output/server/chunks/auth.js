import { w as writable } from "./index.js";
function calculateExpiry(expiresIn) {
  return Date.now() + expiresIn * 1e3;
}
function createAuthStore() {
  let initialToken = null;
  let initialRefreshToken = null;
  let initialExpiry = null;
  let initialUser = null;
  const { subscribe, set, update } = writable({
    token: initialToken,
    refreshToken: initialRefreshToken,
    tokenExpiry: initialExpiry,
    isAuthenticated: false,
    user: initialUser
  });
  let refreshTimer = null;
  function setupAutoRefresh(expiry) {
    if (refreshTimer) clearTimeout(refreshTimer);
    const timeUntilRefresh = expiry - Date.now() - 12e4;
    if (timeUntilRefresh > 0) {
      refreshTimer = setTimeout(() => {
        console.log("Auto-refreshing token...");
        refreshAccessToken();
      }, timeUntilRefresh);
    }
  }
  async function refreshAccessToken() {
    return false;
  }
  function login(data) {
    if (!data.access_token) {
      console.error("Login error: Missing access token");
      return;
    }
    const token = data.access_token;
    const refreshToken = data.refresh_token || null;
    const expiresIn = data.expires_in || 3600;
    const expiry = calculateExpiry(expiresIn);
    const user = {
      id: data.user_id || 0,
      email: data.email || "",
      name: data.name || "",
      role: data.role || ""
    };
    set({
      token,
      refreshToken,
      tokenExpiry: expiry,
      isAuthenticated: true,
      user
    });
    setupAutoRefresh(expiry);
  }
  function logout() {
    if (refreshTimer) {
      clearTimeout(refreshTimer);
      refreshTimer = null;
    }
    set({
      token: null,
      refreshToken: null,
      tokenExpiry: null,
      isAuthenticated: false,
      user: null
    });
  }
  function forceLogoutAndRedirect() {
    return;
  }
  function checkTokenValidity() {
    return false;
  }
  function getUser() {
    return null;
  }
  function isAuthenticated() {
    return false;
  }
  return {
    subscribe,
    login,
    logout,
    refreshAccessToken,
    checkTokenValidity,
    getUser,
    isAuthenticated,
    forceLogoutAndRedirect
  };
}
createAuthStore();
