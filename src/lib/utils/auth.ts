import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

// Response from login/register
export interface LoginResponse {
    access_token: string;
    refresh_token?: string;
    token_type: string;
    expires_in?: number; // seconds
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
    refreshToken: string | null;
    tokenExpiry: number | null; // timestamp
    isAuthenticated: boolean;
    user: UserData | null;
}

// Helper: Calculate expiry timestamp
function calculateExpiry(expiresIn: number): number {
    return Date.now() + expiresIn * 1000;
}

// Helper: Check if token is expired
function isTokenExpired(expiry: number | null): boolean {
    if (!expiry) return true;
    return Date.now() >= expiry - 60000; // 1 minute buffer
}

// Create the auth store
function createAuthStore() {
    let initialToken: string | null = null;
    let initialRefreshToken: string | null = null;
    let initialExpiry: number | null = null;
    let initialUser: UserData | null = null;

    // Load from localStorage on init
    if (browser) {
        initialToken = localStorage.getItem('access_token');
        initialRefreshToken = localStorage.getItem('refresh_token');
        const storedExpiry = localStorage.getItem('token_expiry');
        initialExpiry = storedExpiry ? parseInt(storedExpiry) : null;

        const storedUser = localStorage.getItem('user_info');
        if (storedUser) {
            try {
                initialUser = JSON.parse(storedUser);
            } catch (e) {
                console.error('Failed to parse user info:', e);
            }
        }

        // Check if token is expired on load
        if (initialToken && isTokenExpired(initialExpiry)) {
            console.log('Token expired on load');
            initialToken = null;
            initialUser = null;
            localStorage.removeItem('access_token');
            localStorage.removeItem('token_expiry');
        }
    }

    const { subscribe, set, update } = writable<AuthState>({
        token: initialToken,
        refreshToken: initialRefreshToken,
        tokenExpiry: initialExpiry,
        isAuthenticated: !!initialToken,
        user: initialUser
    });

    // Auto-refresh timer
    let refreshTimer: any = null;

    function setupAutoRefresh(expiry: number) {
        if (refreshTimer) clearTimeout(refreshTimer);

        const timeUntilRefresh = expiry - Date.now() - 120000; // 2 minutes before expiry

        if (timeUntilRefresh > 0) {
            refreshTimer = setTimeout(() => {
                console.log('Auto-refreshing token...');
                refreshAccessToken();
            }, timeUntilRefresh);
        }
    }

    async function refreshAccessToken(): Promise<boolean> {
        if (!browser) return false;

        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
            console.error('No refresh token available');
            logout();
            return false;
        }

        try {
            const response = await fetch(`${API_BASE}/api/users/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: refreshToken })
            });

            if (!response.ok) {
                throw new Error('Token refresh failed');
            }

            const data = await response.json();

            // Update tokens
            const newToken = data.access_token;
            const newExpiry = calculateExpiry(data.expires_in || 3600);

            localStorage.setItem('access_token', newToken);
            localStorage.setItem('token_expiry', newExpiry.toString());

            if (data.refresh_token) {
                localStorage.setItem('refresh_token', data.refresh_token);
            }

            update(state => ({
                ...state,
                token: newToken,
                tokenExpiry: newExpiry,
                refreshToken: data.refresh_token || state.refreshToken
            }));

            setupAutoRefresh(newExpiry);
            console.log('Token refreshed successfully');
            return true;

        } catch (error) {
            console.error('Token refresh error:', error);
            logout();
            return false;
        }
    }

    function login(data: LoginResponse) {
        if (!data.access_token) {
            console.error('Login error: Missing access token');
            return;
        }

        const token = data.access_token;
        const refreshToken = data.refresh_token || null;
        const expiresIn = data.expires_in || 3600; // default 1 hour
        const expiry = calculateExpiry(expiresIn);

        const user: UserData = {
            id: data.user_id || 0,
            email: data.email || '',
            name: data.name || '',
            role: data.role || ''
        };

        if (browser) {
            localStorage.setItem('access_token', token);
            localStorage.setItem('token_expiry', expiry.toString());
            localStorage.setItem('user_info', JSON.stringify(user));

            if (refreshToken) {
                localStorage.setItem('refresh_token', refreshToken);
            }
        }

        set({
            token,
            refreshToken,
            tokenExpiry: expiry,
            isAuthenticated: true,
            user
        });

        setupAutoRefresh(expiry);
    }

    function clearAllStorageAndCookies() {
        if (!browser) return;

        // Clear ALL localStorage
        localStorage.clear();
        
        // Clear ALL sessionStorage
        sessionStorage.clear();
        
        // Clear ALL cookies
        document.cookie.split(";").forEach((c) => {
            document.cookie = c
                .replace(/^ +/, "")
                .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
    }

    function logout() {
        if (refreshTimer) {
            clearTimeout(refreshTimer);
            refreshTimer = null;
        }

        clearAllStorageAndCookies();

        set({
            token: null,
            refreshToken: null,
            tokenExpiry: null,
            isAuthenticated: false,
            user: null
        });
    }

    function forceLogoutAndRedirect() {
        if (!browser) return;
        
        console.log('🚨 Force logout due to error - clearing all storage');
        
        // Clear everything
        clearAllStorageAndCookies();
        
        // Reset store
        set({
            token: null,
            refreshToken: null,
            tokenExpiry: null,
            isAuthenticated: false,
            user: null
        });

        // Force redirect to login
        if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
        }
    }

    function checkTokenValidity(): boolean {
        if (!browser) return false;

        const token = localStorage.getItem('access_token');
        const expiryStr = localStorage.getItem('token_expiry');

        if (!token || !expiryStr) return false;

        const expiry = parseInt(expiryStr);
        if (isTokenExpired(expiry)) {
            console.log('Token expired, attempting refresh...');
            refreshAccessToken();
            return false;
        }

        return true;
    }

    // Get current user data
    function getUser(): UserData | null {
        if (!browser) return null;
        
        const storedUser = localStorage.getItem('user_info');
        if (storedUser) {
            try {
                return JSON.parse(storedUser);
            } catch (e) {
                console.error('Failed to parse user info:', e);
                return null;
            }
        }
        return null;
    }

    // Check if user is authenticated
    function isAuthenticated(): boolean {
        if (!browser) return false;
        const token = localStorage.getItem('access_token');
        const expiryStr = localStorage.getItem('token_expiry');
        
        if (!token || !expiryStr) return false;
        
        const expiry = parseInt(expiryStr);
        return !isTokenExpired(expiry);
    }

    // Expose methods
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

export const auth = createAuthStore();