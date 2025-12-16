<script lang="ts">
    import {page} from '$app/stores';
    import {goto} from '$app/navigation';
    import {browser} from '$app/environment';
    import {onMount} from 'svelte';

    let homePath = '/';


    // --- Config Error Map (เหมือนเดิม) ---
    const errorMap: Record<number, { title: string; defaultDesc: string }> = {
        400: { title: 'Bad Request', defaultDesc: 'The server could not understand the request due to invalid syntax.' },
        401: { title: 'Unauthorized', defaultDesc: 'You must be logged in to access this page.' },
        403: { title: 'Forbidden', defaultDesc: 'You do not have permission to view this resource.' },
        404: { title: 'Page Not Found', defaultDesc: 'The page you are looking for does not exist.' },
        500: { title: 'Internal Server Error', defaultDesc: 'The server encountered an internal error.' },
    };

    $: status = $page.status;
    $: errorInfo = errorMap[status] || { title: 'Something went wrong', defaultDesc: 'An unexpected error occurred.' };
    $: errorMessage = $page.error?.message || errorInfo.defaultDesc;

    // ✅ 1. ตรวจสอบ Link ตรงนี้ให้เป๊ะ (เติมขีด - ให้ครบ)
    function getSafeRedirect(role: string | null): string {
        const r = role?.toLowerCase() || '';
        if (r === 'student') return '/student/event-list';  // แก้เป็น event-list
        if (r === 'officer') return '/officer/event-list';  // แก้เป็น event-list
        if (r === 'organize') return '/organize/create-event';
        return '/auth/login';
    }

    onMount(() => {
        if (browser) {
            const userInfoStr = localStorage.getItem('user_info');
            const token = localStorage.getItem('access_token');

            if (token && userInfoStr) {
                try {
                    const userInfo = JSON.parse(userInfoStr);
                    // อัปเดต homePath ทันทีที่โหลดเสร็จ
                    homePath = getSafeRedirect(userInfo.role);
                } catch (e) {
                    homePath = '/auth/login';
                }
            } else {
                homePath = '/auth/login';
            }
        }
    });

    // ✅ 2. ปรับ logic ปุ่ม Back
    function goBack() {
        if (!browser) return;

        // ถ้าเป็น 404 (หาหน้าไม่เจอ) การกด Back จะพากลับไปลิงก์ที่ผิดอีก
        // ให้บังคับกลับ Home Path ที่ถูกต้องแทน
        if (status === 404) {
            goto(homePath, { replaceState: true });
        }
        // กรณีอื่นๆ ถ้ามีประวัติค่อย Back
        else if (window.history.length > 1) {
            window.history.back();
        }
        // ถ้าไม่มีทางไป ให้กลับ Home Path
        else {
            goto(homePath, { replaceState: true });
        }
    }
</script>

<svelte:head>
    <title>{status} | {errorInfo.title}</title>
</svelte:head>

<div class="error-wrapper">
    <div class="content-container">
        <h1 class="error-code">{status}</h1>
        <div class="message-section">
            <h2 class="error-title">{errorInfo.title}</h2>
            <p class="error-desc">{errorMessage}</p>
        </div>

        <div class="action-section">
            <button on:click={goBack} class="btn btn-back">
                <span class="icon">←</span> Go Back
            </button>

            <a href={homePath} class="btn btn-home">
                Go Home
            </a>
        </div>
    </div>
</div>

<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

    :global(body) { margin: 0; background-color: #111827; font-family: 'Inter', sans-serif; }
    .error-wrapper { width: 100vw; height: 100vh; display: flex; align-items: center; justify-content: center; background-color: #111827; color: white; padding: 20px; box-sizing: border-box; }
    .content-container { text-align: center; max-width: 600px; width: 100%; animation: fadeIn 0.5s ease-out; }
    .error-code { font-size: 120px; font-weight: 800; margin: 0; line-height: 1; background: linear-gradient(135deg, #00C266 0%, #00a355 50%, #059669 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; opacity: 0.9; }
    .error-title { font-size: 28px; font-weight: 700; margin: 16px 0 8px 0; text-transform: uppercase; letter-spacing: 1px; color: #F3F4F6; }
    .error-desc { color: #9CA3AF; font-size: 16px; font-weight: 300; margin-bottom: 40px; }
    .action-section { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }
    .btn { padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; text-decoration: none; cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; gap: 8px; border: 2px solid transparent; font-family: 'Inter', sans-serif; }
    .btn-back { background-color: transparent; border: 2px solid #374151; color: white; }
    .btn-back:hover { border-color: #6B7280; background-color: #1F2937; }
    .btn-home { background-color: #00C266; color: #111827; border-color: #00C266; }
    .btn-home:hover { background-color: #00a355; border-color: #00a355; transform: translateY(-2px); }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
</style>