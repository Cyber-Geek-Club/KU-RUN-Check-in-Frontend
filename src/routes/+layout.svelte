<script lang="ts">
  import { goto, beforeNavigate } from "$app/navigation";
  import { page } from "$app/stores";
  import { browser } from "$app/environment";
  import "../app.css";

  let { children } = $props();

  const ROLE_HOME: Record<string, string> = {
    student: "/student/event-list",
    officer: "/officer/event-list",
    organizer: "/organizer/create-event",
    organize: "/organizer/create-event",
  };

  const GUEST_PATHS = [
    "/",
    "/auth/login",
    "/auth/register",
    "/auth/verify-email",
    "/auth/forgot-password",
    "/auth/reset-password",
  ];

  let isAuthorized = $state(false);
  function getUserInfo() {
    if (!browser) return { token: null, role: null };
    const token = localStorage.getItem("access_token");
    let role = null;
    try {
      const info = localStorage.getItem("user_info");
      if (info) role = JSON.parse(info).role?.toLowerCase();
    } catch {}
    return { token, role };
  }

  $effect(() => {
    if (!browser) return;

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "access_token" && event.newValue === null) {
        console.log("🔄 Logout detected from another tab.");
        window.location.href = "/auth/login";
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  });

  beforeNavigate(({ to }) => {
    if (!to) return;
    const targetPath = to.url.pathname;

    sessionStorage.setItem("authorized_ticket", targetPath);
  });

  $effect(() => {
    if (!browser) return;

    const currentPath = $page.url.pathname;
    const { token, role } = getUserInfo();

    if (!token) {
      const isGuestPath = GUEST_PATHS.some((p) => currentPath.startsWith(p));
      if (!isGuestPath) {
        goto("/auth/login", { replaceState: true });
        return;
      }
      const ticket = sessionStorage.getItem("authorized_ticket");

      if (!ticket) {
        sessionStorage.setItem("authorized_ticket", currentPath);
      } else if (ticket !== currentPath) {
        console.log(`⛔ STOP! You typed URL manually. Go back to ${ticket}`);
        goto(ticket, { replaceState: true });
        isAuthorized = false;
        return;
      }

      isAuthorized = true;
      return;
    }

    const home = role && ROLE_HOME[role] ? ROLE_HOME[role] : "/auth/login";

    if (home === "/auth/login") {
      localStorage.clear();
      sessionStorage.clear();
      goto("/auth/login", { replaceState: true });
      return;
    }

    if (currentPath.startsWith("/auth") || currentPath === "/") {
      sessionStorage.setItem("authorized_ticket", home);
      goto(home, { replaceState: true });
      return;
    }

    const ticket = sessionStorage.getItem("authorized_ticket");

    if (!ticket) {
      if (currentPath !== home) {
        console.log("⛔ No Ticket (Deep Link). Force Home.");
        sessionStorage.setItem("authorized_ticket", home);
        goto(home, { replaceState: true });
        return;
      }
      sessionStorage.setItem("authorized_ticket", currentPath);
    } else {
      if (currentPath !== ticket) {
        console.log(
          `⛔ URL TAMPERED! Expected: ${ticket}, Got: ${currentPath}`
        );
        goto(ticket, { replaceState: true });
        isAuthorized = false;
        return;
      }
    }
    isAuthorized = true;
  });
</script>

{#if isAuthorized}
  {@render children()}
{:else}
  <div
    style="width: 100vw; height: 100vh; background-color: #111827; display: flex; align-items: center; justify-content: center;"
  ></div>
{/if}
