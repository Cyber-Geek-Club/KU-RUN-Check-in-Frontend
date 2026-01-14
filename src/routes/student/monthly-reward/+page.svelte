<script lang="ts">
    import { scale, slide } from "svelte/transition";
    import { elasticOut, quintOut } from "svelte/easing";
    import { onMount } from "svelte";
    import { resolveImageUrl, API_BASE_URL } from "$lib/utils/imageUtils";

    // --- Interfaces ---
    interface Reward {
        id: number;
        name: string;
        description: string;
        badge_image_url: string;
        required_completions: number;
        time_period_days: number;
    }

    interface Participation {
        id: number;
        status: string;
        event_id: number;
        completed_at: string | null;
    }

    // --- State ---
    let isLoading = true;
    let reward: Reward | null = null;
    let userParticipations: Participation[] = [];

    let currentMonthIndex = new Date().getMonth();
    let isDropdownOpen = false;

    const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ];

    $: currentMonthName = months[currentMonthIndex];

    $: completedCount = userParticipations.filter((p) => {
        if (p.status !== "completed" || !p.completed_at) return false;
        const date = new Date(p.completed_at);
        const now = new Date();
        return (
            date.getMonth() === currentMonthIndex &&
            date.getFullYear() === now.getFullYear()
        );
    }).length;

    $: totalSteps = reward?.required_completions || 3;
    $: isAllCompleted = completedCount >= totalSteps;

    // --- API Functions ---

    async function fetchData() {
        isLoading = true;
        try {
            const token = localStorage.getItem("access_token");
            const userInfoStr = localStorage.getItem("user_info");

            if (!token || !userInfoStr) {
                console.error("No token found");
                return;
            }

            const userInfo = JSON.parse(userInfoStr);
            const userId = userInfo.id;
            const [rewardRes, partRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/rewards/`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                fetch(`${API_BASE_URL}/api/participations/user/${userId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ]);

            if (rewardRes.ok) {
                const rewardsData: Reward[] = await rewardRes.json();
                if (rewardsData.length > 0) {
                    reward = rewardsData[0];
                }
            }

            if (partRes.ok) {
                userParticipations = await partRes.json();
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            isLoading = false;
        }
    }

    // --- Helper Functions ---

    function selectMonth(index: number) {
        currentMonthIndex = index;
        isDropdownOpen = false;
    }

    onMount(() => {
        fetchData();
    });
</script>

<div class="app-screen">
    <div class="glass-header">
        <a href="/student/event-list" class="back-btn" aria-label="Back">
            <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg
            >
        </a>
        <h1 class="page-title">MONTHLY REWARD</h1>
    </div>

    <div class="scroll-container">
        <div class="content-wrapper">
            <div class="month-selector-wrapper">
                <div class="month-selector-container">
                    <button
                        class="month-btn {isDropdownOpen ? 'open' : ''}"
                        on:click={() => (isDropdownOpen = !isDropdownOpen)}
                    >
                        {currentMonthName}
                        <svg
                            class="arrow-icon {isDropdownOpen ? 'rotate' : ''}"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="3"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            ><polyline points="6 9 12 15 18 9"></polyline></svg
                        >
                    </button>

                    {#if isDropdownOpen}
                        <div
                            class="dropdown-menu"
                            transition:slide={{
                                duration: 300,
                                easing: quintOut,
                                axis: "y",
                            }}
                        >
                            <div class="dropdown-inner">
                                {#each months as month, i}
                                    <button
                                        class="dropdown-item {i ===
                                        currentMonthIndex
                                            ? 'active'
                                            : ''}"
                                        on:click={() => selectMonth(i)}
                                    >
                                        {month}
                                    </button>
                                {/each}
                            </div>
                        </div>
                    {/if}
                </div>
            </div>

            <div class="reward-card">
                {#if isLoading}
                    <div style="padding: 40px; color: #9ca3af;">
                        Loading reward data...
                    </div>
                {:else if !reward}
                    <div style="padding: 40px; color: #ef4444;">
                        No Reward Available
                    </div>
                {:else}
                    <h2 class="card-title">{reward.name}</h2>
                    <p class="subtitle">{reward.description}</p>

                    <div class="stepper-container">
                        {#each Array(totalSteps) as _, i}
                            {@const isDone = i < completedCount}
                            {@const isLineActive = completedCount > i + 1}

                            <div class="step-wrapper">
                                {#if isDone}
                                    <div
                                        class="step step-done"
                                        in:scale={{
                                            duration: 500,
                                            easing: elasticOut,
                                            start: 0.5,
                                        }}
                                    >
                                        <svg
                                            width="20"
                                            height="20"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            stroke-width="3"
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            ><polyline points="20 6 9 17 4 12"
                                            ></polyline></svg
                                        >
                                    </div>
                                {:else}
                                    <div class="step step-locked">
                                        <svg
                                            width="18"
                                            height="18"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            stroke-width="2"
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            ><rect
                                                x="3"
                                                y="11"
                                                width="18"
                                                height="11"
                                                rx="2"
                                                ry="2"
                                            ></rect><path
                                                d="M7 11V7a5 5 0 0 1 10 0v4"
                                            ></path></svg
                                        >
                                    </div>
                                {/if}
                            </div>

                            {#if i < totalSteps - 1}
                                <div
                                    class="line {isLineActive
                                        ? 'line-active'
                                        : ''}"
                                ></div>
                            {/if}
                        {/each}
                    </div>

                    <div class="message-area">
                        {#if isAllCompleted}
                            <div in:scale>
                                <h3 class="congrats-text">CONGRATULATION!</h3>
                                <h3 class="congrats-text">
                                    CHALLENGE COMPLETE!
                                </h3>
                                <p class="desc-text">
                                    You've earned this badge!
                                </p>

                                <div class="trophy-container">
                                    {#if reward.badge_image_url}
                                        <img
                                            src={resolveImageUrl(
                                                reward.badge_image_url,
                                            )}
                                            alt="Badge"
                                            class="badge-img"
                                        />
                                    {:else}
                                        <span
                                            style="font-size: 80px; display: block;"
                                            >🏆</span
                                        >
                                    {/if}
                                </div>
                            </div>
                        {:else if completedCount === 0}
                            <h3
                                class="status-title locked"
                                style="color:#9CA3AF; font-weight:700;"
                            >
                                LOCKED
                            </h3>
                            <p class="desc-text">
                                Join events to start unlocking your rewards.<br
                                />The journey begins with a single step!
                            </p>
                        {:else}
                            <h3
                                class="status-title progress"
                                style="color:#00C266; font-weight:700;"
                            >
                                KEEP GOING!
                            </h3>
                            <p class="desc-text">
                                You're doing great! Just a few more steps<br
                                />to grab your exclusive reward.
                            </p>
                        {/if}
                        <p class="progress-text">
                            {completedCount}/{totalSteps} completed
                        </p>
                    </div>
                {/if}
            </div>
        </div>
    </div>
</div>

<style>
    @import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap");

    :global(body) {
        margin: 0;
        padding: 0;
        background-color: #111827;
        font-family: "Inter", sans-serif;
        overflow: hidden;
    }

    :global(*) {
        font-family: "Inter", sans-serif !important;
    }

    .app-screen {
        height: 100vh;
        display: flex;
        flex-direction: column;
        position: relative;
    }

    .glass-header {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 80px;
        z-index: 50;
        background: rgba(17, 24, 39, 0.85);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border-bottom: 1px solid rgba(17, 24, 39, 0.85);
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .back-btn {
        position: absolute;
        left: 20px;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        cursor: pointer;
        transition: 0.2s;
    }
    .back-btn:hover {
        background: rgba(255, 255, 255, 0.2);
    }

    .page-title {
        color: white;
        font-size: 28px;
        font-weight: 700;
        margin: 0;
        letter-spacing: 1px;
        text-transform: uppercase;
        line-height: 1;
    }

    .scroll-container {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        padding-top: 100px;
        padding-bottom: 40px;
    }

    .content-wrapper {
        width: 100%;
        max-width: 390px;
        margin: 0 auto;
        padding: 0 20px;
        box-sizing: border-box;
    }

    .month-selector-wrapper {
        display: flex;
        justify-content: center;
        margin-bottom: 20px;
        position: relative;
        z-index: 40;
    }

    .month-selector-container {
        position: relative;
        display: inline-block;
        width: 140px;
    }

    .month-btn {
        width: 100%;
        padding: 8px 16px;
        border-radius: 30px;
        background-color: white;
        color: #111827;
        border: none;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        transition: 0.2s;
    }

    .month-btn:active {
        transform: scale(0.98);
        background-color: #f3f4f6;
    }
    .month-btn:hover,
    .month-btn.open {
        background-color: rgba(255, 255, 255, 0.9);
    }

    .arrow-icon {
        transition: transform 0.3s ease;
    }
    .arrow-icon.rotate {
        transform: rotate(180deg);
    }

    .dropdown-menu {
        position: absolute;
        top: calc(100% + 8px);
        left: 50%;
        transform: translateX(-50%);
        width: 100%;
        background: white;
        border-radius: 16px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
        z-index: 100;
        padding: 6px;
        box-sizing: border-box;
    }

    .dropdown-inner {
        max-height: 200px;
        overflow-y: auto;
        padding-right: 2px;
    }
    .dropdown-inner::-webkit-scrollbar {
        width: 4px;
    }
    .dropdown-inner::-webkit-scrollbar-thumb {
        background-color: #cbd5e0;
        border-radius: 10px;
    }

    .dropdown-item {
        display: flex;
        align-items: center;
        width: 100%;
        padding: 8px 12px;
        text-align: left;
        background: transparent;
        border: none;
        color: #4a5568;
        font-size: 13px;
        cursor: pointer;
        border-radius: 8px;
        font-weight: 500;
        margin-bottom: 2px;
    }

    .dropdown-item:hover {
        background-color: #f7fafc;
        color: #2d3748;
    }
    .dropdown-item.active {
        background-color: #e6f9ee;
        color: #00c266;
        font-weight: 600;
    }

    .reward-card {
        background: white;
        border-radius: 20px;
        padding: 30px 20px;
        text-align: center;
        color: #111827;
        min-height: 300px;
        display: flex;
        flex-direction: column;
        align-items: center;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    }

    .card-title {
        font-size: 20px;
        font-weight: 700;
        margin: 0 0 5px 0;
        color: #111827;
    }
    .subtitle {
        font-size: 13px;
        color: #6b7280;
        margin: 0 0 25px 0;
    }

    .stepper-container {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        max-width: 270px;
        margin-bottom: 30px;
    }

    .step-wrapper {
        display: flex;
        align-items: center;
    }

    .step {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    .step-done {
        border: 2px solid #00c266;
        color: #00c266;
    }
    .step-locked {
        border: 2px solid #9ca3af;
        color: #9ca3af;
    }

    .line {
        flex-grow: 1;
        width: 40px;
        height: 2px;
        background-color: #e5e7eb;
        margin: 0 5px;
    }
    .line-active {
        background-color: #00c266;
    }

    .message-area {
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 15px;
    }

    .congrats-text {
        color: #111827;
        font-weight: 700;
        margin: 0;
        font-size: 16px;
    }
    .desc-text {
        font-size: 13px;
        color: #4b5563;
        margin: 0;
        line-height: 1.5;
        max-width: 240px;
    }
    .progress-text {
        font-size: 12px;
        color: #9ca3af;
        margin-top: 10px;
        font-weight: 600;
    }

    .trophy-container {
        margin: 20px 0;
    }
    .badge-img {
        width: 100px;
        height: 100px;
        object-fit: contain;
    }
</style>
