<script lang="ts">
    import {beforeNavigate, goto} from "$app/navigation";
    import {page} from "$app/stores";
    import {browser} from "$app/environment";
    import "../app.css";

    let {children} = $props();

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

    // Path ที่ยอมให้เข้าได้เสมอ แม้จะไม่มี Ticket หรือล็อกอินอยู่
    const ALLOWED_DEEP_LINKS = [
        "/auth/reset-password",
        "/auth/verify-email",
        "/auth/forgot-password"
    ];

    let isAuthorized = $state(false);

    function getUserInfo() {
        if (!browser) return {token: null, role: null};
        const token = localStorage.getItem("access_token");
        let role = null;
        try {
            const info = localStorage.getItem("user_info");
            if (info) role = JSON.parse(info).role?.toLowerCase();
        } catch {
        }
        return {token, role};
    }

    $effect(() => {
        if (!browser) return;

        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === "access_token" && event.newValue === null) {
                console.log("🔄 Logout detected.");
                window.location.href = "/auth/login";
            }
        };

        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    });

    beforeNavigate(({to}) => {
        if (!to) return;
        sessionStorage.setItem("authorized_ticket", to.url.pathname);
    });

    $effect(() => {
        if (!browser) return;

        const currentPath = $page.url.pathname;
        const {token, role} = getUserInfo();

        // 🔥 เช็คว่าเป็น Deep Link ที่อนุญาตหรือไม่ (ใช้ได้ทั้ง Guest และ Logged In)
        const isAllowedDeepLink = ALLOWED_DEEP_LINKS.some(p => currentPath.startsWith(p));

        // ---------------------------------------------------------
        // 1. กรณีไม่มี Token (Guest)
        // ---------------------------------------------------------
        if (!token) {
            const isGuestPath = GUEST_PATHS.some((p) => currentPath.startsWith(p));

            if (!isGuestPath) {
                goto("/auth/login", {replaceState: true});
                return;
            }

            const ticket = sessionStorage.getItem("authorized_ticket");

            // ถ้าไม่มี Ticket หรือเป็น Deep Link ให้สร้าง Ticket ใหม่เลย
            if (!ticket || isAllowedDeepLink) {
                sessionStorage.setItem("authorized_ticket", currentPath);
            } else if (ticket !== currentPath) {
                console.log(`⛔ STOP! Guest typed URL manually.`);
                goto(ticket, {replaceState: true});
                isAuthorized = false;
                return;
            }

            isAuthorized = true;
            return;
        }

        // ---------------------------------------------------------
        // 2. กรณีมี Token (Logged In)
        // ---------------------------------------------------------
        const home = role && ROLE_HOME[role] ? ROLE_HOME[role] : "/auth/login";

        if (home === "/auth/login") {
            localStorage.clear();
            sessionStorage.clear();
            goto("/auth/login", {replaceState: true});
            return;
        }

        // ถ้าเข้าหน้า /auth ปกติ (เช่น login/register) ให้ดีดไป Home
        // ยกเว้นว่าเป็น Allowed Deep Link (เช่น reset-password) ให้เข้าได้
        if (currentPath === "/" || (currentPath.startsWith("/auth") && !isAllowedDeepLink)) {
            sessionStorage.setItem("authorized_ticket", home);
            goto(home, {replaceState: true});
            return;
        }

        const ticket = sessionStorage.getItem("authorized_ticket");

        if (!ticket) {
            // ไม่มี Ticket (เช่น เปิดแท็บใหม่ หรือกด Link จาก Email)
            // ถ้าไม่ใช่หน้า Home และ ไม่ใช่ Deep Link -> บังคับไป Home
            if (currentPath !== home && !isAllowedDeepLink) {
                console.log("⛔ No Ticket. Force Home.");
                sessionStorage.setItem("authorized_ticket", home);
                goto(home, {replaceState: true});
                return;
            }
            // ถ้าเป็น Deep Link ให้สร้าง Ticket ที่หน้านั้นเลย
            sessionStorage.setItem("authorized_ticket", currentPath);
        } else {
            // มี Ticket แต่ URL ไม่ตรง
            if (currentPath !== ticket) {
                // 🔥 ถ้าเป็น Deep Link ให้ยอมรับ URL ใหม่ แล้วอัปเดต Ticket
                if (isAllowedDeepLink) {
                    sessionStorage.setItem("authorized_ticket", currentPath);
                } else {
                    console.log(`⛔ URL TAMPERED! Go back to ${ticket}`);
                    goto(ticket, {replaceState: true});
                    isAuthorized = false;
                    return;
                }
            }
        }

        isAuthorized = true;
    });
</script>

{#if isAuthorized}
    {@render children()}
{:else}
    <div style="width: 100vw; height: 100vh; background-color: #111827;"></div>
{/if}