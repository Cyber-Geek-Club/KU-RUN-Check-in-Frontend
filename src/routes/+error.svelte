<script lang="ts">
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { browser } from '$app/environment';
    import { onMount } from 'svelte';
    import { auth } from '$lib/utils/auth';

    let homePath = '/';

    // Enhanced error map with more status codes
    const errorMap: Record<number, { title: string; defaultDesc: string; icon: string }> = {
        400: { 
            title: 'Bad Request', 
            defaultDesc: 'The server could not understand the request due to invalid syntax.',
            icon: '⚠️'
        },
        401: { 
            title: 'Unauthorized', 
            defaultDesc: 'You must be logged in to access this page.',
            icon: '🔐'
        },
        403: { 
            title: 'Forbidden', 
            defaultDesc: 'You do not have permission to view this resource.',
            icon: '🚫'
        },
        404: { 
            title: 'Page Not Found', 
            defaultDesc: 'The page you are looking for does not exist.',
            icon: '🔍'
        },
        405: {
            title: 'Method Not Allowed',
            defaultDesc: 'The request method is not supported for this resource.',
            icon: '⛔'
        },
        408: {
            title: 'Request Timeout',
            defaultDesc: 'The server timed out waiting for the request.',
            icon: '⏱️'
        },
        429: {
            title: 'Too Many Requests',
            defaultDesc: 'You have sent too many requests in a given amount of time.',
            icon: '🚦'
        },
        500: { 
            title: 'Internal Server Error', 
            defaultDesc: 'The server encountered an internal error.',
            icon: '💥'
        },
        502: {
            title: 'Bad Gateway',
            defaultDesc: 'The server received an invalid response from the upstream server.',
            icon: '🌐'
        },
        503: {
            title: 'Service Unavailable',
            defaultDesc: 'The server is temporarily unable to handle the request.',
            icon: '🔧'
        },
        504: {
            title: 'Gateway Timeout',
            defaultDesc: 'The server did not receive a timely response from the upstream server.',
            icon: '⏰'
        }
    };

    $: status = $page.status;
    $: errorInfo = errorMap[status] || { 
        title: 'Something Went Wrong', 
        defaultDesc: 'An unexpected error occurred.',
        icon: '❌'
    };
    $: errorMessage = $page.error?.message || errorInfo.defaultDesc;

    // Get safe redirect based on user role
    function getSafeRedirect(role: string | null): string {
        const r = role?.toLowerCase() || '';
        if (r === 'student') return '/student/event-list';
        if (r === 'officer') return '/officer/event-list';
        if (r === 'organizer') return '/organizer/create-event';
        return '/auth/login';
    }

    onMount(() => {
        if (browser) {
            // Check if user is authenticated
            const isAuth = auth.isAuthenticated();
            
            if (isAuth) {
                const user = auth.getUser();
                homePath = getSafeRedirect(user?.role || null);
            } else {
                homePath = '/auth/login';
            }

            // Auto-redirect to login on 401
            if (status === 401) {
                auth.logout();
                setTimeout(() => {
                    goto('/auth/login', { replaceState: true });
                }, 2000);
            }
        }
    });

    function goBack() {
        if (!browser) return;

        // For 404 or 403, redirect to home instead of going back
        if (status === 404 || status === 403) {
            goto(homePath, { replaceState: true });
        }
        // For other errors, try to go back if history exists
        else if (window.history.length > 1) {
            window.history.back();
        }
        // Fallback to home
        else {
            goto(homePath, { replaceState: true });
        }
    }

    function goHome() {
        goto(homePath, { replaceState: true });
    }
</script>

<svelte:head>
    <title>{status} | {errorInfo.title}</title>
</svelte:head>

<div class="error-wrapper">
    <div class="content-container">
        <div class="error-icon">{errorInfo.icon}</div>
        <h1 class="error-code">{status}</h1>
        <div class="message-section">
            <h2 class="error-title">{errorInfo.title}</h2>
            <p class="error-desc">{errorMessage}</p>
        </div>

        <div class="action-section">
            {#if status !== 401}
                <button on:click={goBack} class="btn btn-back">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                    <span>Go Back</span>
                </button>
            {/if}

            <button on:click={goHome} class="btn btn-home">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
                <span>Go Home</span>
            </button>
        </div>

        {#if status === 401}
            <p class="redirect-notice">Redirecting to login...</p>
        {/if}
    </div>
</div>

<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

    :global(body) { 
        margin: 0; 
        background-color: #111827; 
        font-family: 'Inter', sans-serif; 
        overflow: hidden;
    }

    .error-wrapper { 
        width: 100vw; 
        height: 100vh; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        color: white; 
        padding: 20px; 
        box-sizing: border-box; 
    }

    .content-container { 
        text-align: center; 
        max-width: 600px; 
        width: 100%; 
        animation: fadeIn 0.6s ease-out; 
    }

    .error-icon {
        font-size: 80px;
        margin-bottom: 20px;
        animation: bounce 2s infinite;
    }

    .error-code { 
        font-size: 120px; 
        font-weight: 800; 
        margin: 0; 
        line-height: 1; 
        background: linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%); 
        -webkit-background-clip: text; 
        -webkit-text-fill-color: transparent; 
        background-clip: text;
        opacity: 0.9; 
        text-shadow: 0 0 40px rgba(16, 185, 129, 0.3);
    }

    .message-section {
        margin: 24px 0 40px 0;
    }

    .error-title { 
        font-size: 28px; 
        font-weight: 700; 
        margin: 16px 0 12px 0; 
        text-transform: uppercase; 
        letter-spacing: 1px; 
        color: #F3F4F6; 
    }

    .error-desc { 
        color: #9CA3AF; 
        font-size: 16px; 
        font-weight: 400; 
        margin: 0;
        line-height: 1.6;
    }

    .action-section { 
        display: flex; 
        gap: 16px; 
        justify-content: center; 
        flex-wrap: wrap; 
        margin-bottom: 20px;
    }

    .btn { 
        padding: 14px 28px; 
        border-radius: 10px; 
        font-size: 15px; 
        font-weight: 600; 
        text-decoration: none; 
        cursor: pointer; 
        transition: all 0.3s ease; 
        display: flex; 
        align-items: center; 
        gap: 8px; 
        border: 2px solid transparent; 
        font-family: 'Inter', sans-serif;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
    }

    .btn:active {
        transform: scale(0.98);
    }

    .btn-back { 
        background-color: rgba(55, 65, 81, 0.5); 
        border: 2px solid #374151; 
        color: white;
        backdrop-filter: blur(10px);
    }

    .btn-back:hover { 
        border-color: #6B7280; 
        background-color: rgba(75, 85, 99, 0.5); 
        box-shadow: 0 6px 12px -2px rgba(0, 0, 0, 0.4);
    }

    .btn-home { 
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white; 
        border-color: #10b981; 
    }

    .btn-home:hover { 
        background: linear-gradient(135deg, #059669 0%, #047857 100%);
        border-color: #059669; 
        transform: translateY(-2px); 
        box-shadow: 0 8px 16px -4px rgba(16, 185, 129, 0.4);
    }

    .redirect-notice {
        color: #10b981;
        font-size: 14px;
        font-weight: 500;
        margin-top: 20px;
        animation: pulse 2s infinite;
    }

    @keyframes fadeIn { 
        from { 
            opacity: 0; 
            transform: translateY(30px); 
        } 
        to { 
            opacity: 1; 
            transform: translateY(0); 
        } 
    }

    @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-20px); }
    }

    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
    }

    @media (max-width: 640px) {
        .error-icon {
            font-size: 60px;
        }

        .error-code {
            font-size: 80px;
        }

        .error-title {
            font-size: 22px;
        }

        .error-desc {
            font-size: 14px;
        }

        .action-section {
            flex-direction: column;
            width: 100%;
        }

        .btn {
            width: 100%;
            justify-content: center;
        }
    }
</style>