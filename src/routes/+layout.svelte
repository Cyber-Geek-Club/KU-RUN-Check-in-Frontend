<script lang="ts">
  import { goto, beforeNavigate } from '$app/navigation';
  import { page } from '$app/stores';
  import { browser } from '$app/environment';
  import '../app.css';

  let { children } = $props();

  let isAuthorized = $state(
      browser ? checkPermission(window.location.pathname) : false
  );

  function getSafeRedirect(role: string | null): string {
      if (role === 'student') return '/student/dashboard';
      if (role === 'officer') return '/officer/dashboard';
      if (role === 'organize') return '/organize/dashboard'; 
      
      return '/auth/login';
  }

  function checkPermission(path: string): boolean {
      if (!browser) return false;

      const token = localStorage.getItem('access_token');
      const userInfoStr = localStorage.getItem('user_info');

      if (!token) {
          const validGuestPaths = ['/', '/auth/login', '/auth/register'];
          const isAllowed = validGuestPaths.some(p => path === p || (path.startsWith(p) && p !== '/'));
          return isAllowed;
      }

      let userRole = '';
      try {
          if (userInfoStr) userRole = JSON.parse(userInfoStr).role.toLowerCase();
      } catch (e) { 
          localStorage.clear(); 
          return false; 
      }

      if (path.startsWith('/auth') || path === '/') return false;

      const isOfficerZone = path.startsWith('/officer');
      const isStudentZone = path.startsWith('/student');
      const isOrganizeZone = path.startsWith('/organize'); // ✨ เพิ่มโซน organize

      if (userRole === 'student' && (isOfficerZone || isOrganizeZone)) return false;
      
      if (userRole === 'officer' && (isStudentZone || isOrganizeZone)) return false;

      if (userRole === 'organize' && (isStudentZone || isOfficerZone)) return false;

      return true;
  }

  beforeNavigate(({ to, cancel }) => {
      if (!to) return;
      const targetPath = to.url.pathname;

      if (!checkPermission(targetPath)) {
          console.log(`⛔ Blocked Role Access: ${targetPath}`);
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
          
          if (lastValidPath) {
              goto(lastValidPath, { replaceState: true });
          } else {
              const role = token ? JSON.parse(localStorage.getItem('user_info') || '{}').role?.toLowerCase() : null;
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
         </div>
{/if}