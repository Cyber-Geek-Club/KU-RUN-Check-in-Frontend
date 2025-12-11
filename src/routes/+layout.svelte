<script lang="ts">
    import { goto, beforeNavigate } from '$app/navigation';
    import { page } from '$app/stores';
    import { browser } from '$app/environment';
    import { auth } from '$lib/utils/auth';
    import { onMount } from 'svelte';
    import '../app.css';

    let { children } = $props();

    let isAuthorized = $state(
        browser ? checkPermission(window.location.pathname) : false
    );

    // Check token validity on mount
    onMount(() => {
        if (browser) {
            const token = localStorage.getItem('access_token');
            if (token) {
                // Validate token on app load
                const isValid = auth.checkTokenValidity();
                if (!isValid) {
                    console.log('Token invalid on mount, logging out');
                    auth.logout();
                    goto('/auth/login', { replaceState: true });
                }
            }
        }

        // Set up interval to check token validity periodically (every 5 minutes)
        const intervalId = setInterval(() => {
            if (browser) {
                const token = localStorage.getItem('access_token');
                if (token) {
                    const isValid = auth.checkTokenValidity();
                    if (!isValid) {
                        console.log('Token expired, logging out');
                        auth.logout();
                        goto('/auth/login', { replaceState: true });
                    }
                }
            }
        }, 5 * 60 * 1000); // 5 minutes

        return () => clearInterval(intervalId);
    });

    function getSafeRedirect(role: string | null): string {
        if (role === 'student') return '/student/event-list';
        if (role === 'officer') return '/officer/event-list';
        if (role === 'organize') return '/organize/create-event';
        return '/auth/login';
    }

    function checkPermission(path: string): boolean {
        if (!browser) return false;

        const token = localStorage.getItem('access_token');
        const userInfoStr = localStorage.getItem('user_info');
        const expiryStr = localStorage.getItem('token_expiry');

        // Check token expiration
        if (token && expiryStr) {
            const expiry = parseInt(expiryStr);
            const now = Date.now();

            if (now >= expiry - 60000) { // 1 minute buffer
                console.log('Token expired in checkPermission');
                localStorage.clear();
                return path === '/' || path === '/auth/login' || path === '/auth/register';
            }
        }

        if (!token) {
            const validGuestPaths = ['/', '/auth/login', '/auth/register', '/auth/verify-email', '/auth/forgot-password'];
            const isAllowed = validGuestPaths.some(p =>
                path === p ||
                (p !== '/' && path.startsWith(p))
            );
            return isAllowed;
        }

        let userRole = '';
        try {
            if (userInfoStr) userRole = JSON.parse(userInfoStr).role.toLowerCase();
        } catch (e) {
            console.error('Failed to parse user info:', e);
            localStorage.clear();
            return false;
        }

        // Logged in users shouldn't access auth pages
        if (path.startsWith('/auth') || path === '/') return false;

        // Role-based access control
        const isOfficerZone = path.startsWith('/officer');
        const isStudentZone = path.startsWith('/student');
        const isOrganizeZone = path.startsWith('/organize');

        if (userRole === 'student' && (isOfficerZone || isOrganizeZone)) return false;
        if (userRole === 'officer' && (isStudentZone || isOrganizeZone)) return false;
        if (userRole === 'organize' && (isStudentZone || isOfficerZone)) return false;

        return true;
    }

    beforeNavigate(({ to, cancel }) => {
        if (!to) return;
        const targetPath = to.url.pathname;

        if (!checkPermission(targetPath)) {
            console.log(`⛔ Blocked Access: ${targetPath}`);
            cancel();
            return;
        }

        sessionStorage.setItem('strict_allowed_path', targetPath);
    });

    $effect(() => {
        if (browser) {
            const currentPath = $page.url.pathname;
            const token = localStorage.getItem('access_token');

            const isRoleAllowed = checkPermission(currentPath);

            if (!isRoleAllowed) {
                console.log(`⛔ Access Denied: ${currentPath}`);
                isAuthorized = false;

                const lastValidPath = sessionStorage.getItem('strict_allowed_path');

                if (lastValidPath && checkPermission(lastValidPath)) {
                    goto(lastValidPath, { replaceState: true });
                } else {
                    const role = token
                        ? JSON.parse(localStorage.getItem('user_info') || '{}').role?.toLowerCase()
                        : null;
                    goto(getSafeRedirect(role), { replaceState: true });
                }
                return;
            }

            if (token) {
                const allowedPath = sessionStorage.getItem('strict_allowed_path');

                if (allowedPath && allowedPath !== currentPath) {
                    console.log(`⛔ Direct Jump Denied! Expected: ${allowedPath}, Got: ${currentPath}`);
                    isAuthorized = false;
                    goto(allowedPath, { replaceState: true });
                    return;
                }
            }

            if (!sessionStorage.getItem('strict_allowed_path')) {
                sessionStorage.setItem('strict_allowed_path', currentPath);
            } else if (!token) {
                sessionStorage.setItem('strict_allowed_path', currentPath);
            }

            isAuthorized = true;
        }
    });
</script>

{#if isAuthorized}
    {@render children()}
{:else}
    <div style="width: 100vw; height: 100vh; background-color: #111827; display: flex; align-items: center; justify-content: center;">
        <!-- Loading or blocked indicator -->
    </div>
{/if}