<script lang="ts">
    import { scale, slide } from "svelte/transition";
    import { elasticOut, quintOut } from "svelte/easing";
    import { onMount } from "svelte";
    import { 
        fetchMyLeaderboards,
        type MyLeaderboardsSummary,
        type MyLeaderboardStatus
    } from "$lib/api/leaderboardApi";

    // --- State ---
    let isLoading = true;
    let error: string | null = null;
    let summary: MyLeaderboardsSummary | null = null;
    let selectedLeaderboard: MyLeaderboardStatus | null = null;
    let isDropdownOpen = false;

    // Language state
    let lang: 'th' | 'en' = 'th';

    const t = {
        th: {
            title: 'รางวัลรายเดือน',
            loading: 'กำลังโหลดข้อมูล...',
            noData: 'ไม่พบข้อมูล Leaderboard',
            selectEvent: 'เลือกกิจกรรม',
            totalEvents: 'กิจกรรมทั้งหมด',
            completed: 'ผ่านแล้ว',
            rewards: 'รางวัล',
            pending: 'รอดำเนินการ',
            progress: 'ความคืบหน้า',
            times: 'ครั้ง',
            rank: 'อันดับ',
            qualified: 'ผ่านคุณสมบัติแล้ว',
            stillQualify: 'ยังทำได้ต่อ',
            expired: 'หมดเวลาแล้ว',
            finalized: 'ประกาศผลแล้ว',
            notFinalized: 'ยังไม่ประกาศผล',
            congrats: 'ยินดีด้วย!',
            youQualified: 'คุณผ่านคุณสมบัติแล้ว!',
            keepGoing: 'สู้ๆ นะ!',
            locked: 'ล็อก',
            needMore: 'เหลืออีก',
            toQualify: 'เพื่อผ่านคุณสมบัติ',
            yourReward: 'รางวัลของคุณ',
            notStarted: 'ยังไม่เริ่ม',
        },
        en: {
            title: 'Monthly Rewards',
            loading: 'Loading data...',
            noData: 'No Leaderboard Data',
            selectEvent: 'Select Event',
            totalEvents: 'Total Events',
            completed: 'Completed',
            rewards: 'Rewards',
            pending: 'Pending',
            progress: 'Progress',
            times: 'times',
            rank: 'Rank',
            qualified: 'Qualified',
            stillQualify: 'Can still qualify',
            expired: 'Expired',
            finalized: 'Finalized',
            notFinalized: 'Not Finalized',
            congrats: 'Congratulations!',
            youQualified: 'You have qualified!',
            keepGoing: 'Keep Going!',
            locked: 'Locked',
            needMore: 'Need',
            toQualify: 'more to qualify',
            yourReward: 'Your Reward',
            notStarted: 'Not Started',
        }
    };

    $: completedCount = selectedLeaderboard?.current_completions || 0;
    $: totalSteps = selectedLeaderboard?.required_completions || 0;
    $: isAllCompleted = selectedLeaderboard?.qualified || false;
    $: progressPercentage = selectedLeaderboard?.progress_percentage || 0;

    // --- API Functions ---
    async function loadData() {
        isLoading = true;
        error = null;
        
        try {
            const data = await fetchMyLeaderboards();
            summary = data;
            
            // เลือก leaderboard แรกโดย default (ที่ยังทำอยู่)
            if (data.leaderboards.length > 0) {
                // หา leaderboard ที่ยังทำอยู่ก่อน
                const active = data.leaderboards.find(lb => !lb.is_finalized && lb.can_still_qualify);
                selectedLeaderboard = active || data.leaderboards[0];
            }
        } catch (err) {
            console.error('Error loading leaderboards:', err);
            error = err instanceof Error ? err.message : 'Unknown error';
        } finally {
            isLoading = false;
        }
    }

    function selectLeaderboard(lb: MyLeaderboardStatus) {
        selectedLeaderboard = lb;
        isDropdownOpen = false;
    }

    function setLang(newLang: 'th' | 'en') {
        lang = newLang;
    }

    onMount(() => {
        // Get language from localStorage
        const savedLang = localStorage.getItem('lang');
        if (savedLang === 'th' || savedLang === 'en') {
            lang = savedLang;
        }
        
        loadData();
    });
</script>

<div class="app-screen">
    <div class="glass-header">
        <a href="/officer/event-list" class="back-btn" aria-label="Back">
            <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg
            >
        </a>
        <h1 class="page-title">{t[lang].title}</h1>
        
        <div class="lang-toggle">
            <button class:active={lang === 'th'} on:click={() => setLang('th')}>TH</button>
            <span class="sep">|</span>
            <button class:active={lang === 'en'} on:click={() => setLang('en')}>EN</button>
        </div>
    </div>

    <div class="scroll-container">
        <div class="content-wrapper">
            
            {#if summary}
                <div class="stats-container">
                    <div class="stat-card">
                        <div class="stat-value">{summary.total_leaderboards}</div>
                        <div class="stat-label">{t[lang].totalEvents}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">{summary.completed_leaderboards}</div>
                        <div class="stat-label">{t[lang].completed}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">{summary.rewards_received}</div>
                        <div class="stat-label">{t[lang].rewards}</div>
                    </div>
                </div>
            {/if}
            
            {#if summary && summary.leaderboards.length > 0}
                <div class="event-selector-wrapper">
                    <div class="event-selector-container">
                        <button
                            class="event-btn {isDropdownOpen ? 'open' : ''}"
                            on:click={() => (isDropdownOpen = !isDropdownOpen)}
                        >
                            <span class="event-name">
                                {selectedLeaderboard?.event_name || t[lang].selectEvent}
                            </span>
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
                                    {#each summary.leaderboards as lb}
                                        <button
                                            class="dropdown-item {lb.config_id === selectedLeaderboard?.config_id ? 'active' : ''}"
                                            on:click={() => selectLeaderboard(lb)}
                                        >
                                            <div class="dropdown-item-content">
                                                <div class="dropdown-item-name">{lb.event_name}</div>
                                                <div class="dropdown-item-meta">
                                                    {lb.current_completions}/{lb.required_completions} ({lb.progress_percentage.toFixed(0)}%)
                                                </div>
                                            </div>
                                            {#if lb.qualified}
                                                <span class="badge-qualified">✅</span>
                                            {/if}
                                        </button>
                                    {/each}
                                </div>
                            </div>
                        {/if}
                    </div>
                </div>
            {/if}

            <div class="reward-card">
                {#if isLoading}
                    <div style="padding: 40px; color: #9ca3af;">
                        {t[lang].loading}
                    </div>
                {:else if error}
                    <div style="padding: 40px; color: #ef4444;">
                        {error}
                    </div>
                {:else if !selectedLeaderboard}
                    <div style="padding: 40px; color: #9ca3af;">
                        {t[lang].noData}
                    </div>
                {:else}
                    <div class="stepper-container">
                        {#each Array(Math.min(totalSteps, 5)) as _, i}
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

                            {#if i < Math.min(totalSteps, 5) - 1}
                                <div
                                    class="line {isLineActive
                                        ? 'line-active'
                                        : ''}"
                                ></div>
                            {/if}
                        {/each}
                    </div>

                    <div class="progress-bar-container">
                        <div class="progress-bar">
                            <div 
                                class="progress-fill {isAllCompleted ? 'completed' : ''}" 
                                style="width: {Math.min(100, progressPercentage)}%"
                            ></div>
                        </div>
                        <div class="progress-text-inline">
                            {completedCount}/{totalSteps} {t[lang].times} ({progressPercentage.toFixed(0)}%)
                        </div>
                    </div>

                    <div class="message-area">
                        {#if isAllCompleted}
                            <div in:scale>
                                <h3 class="congrats-text">🎉 {t[lang].congrats}</h3>
                                <h3 class="congrats-text">{t[lang].youQualified}</h3>
                                
                                {#if selectedLeaderboard.rank}
                                    <div class="rank-badge">
                                        {t[lang].rank} #{selectedLeaderboard.rank}
                                    </div>
                                {/if}
                                
                                {#if selectedLeaderboard.reward_name}
                                    <div class="reward-display">
                                        <div class="reward-label">{t[lang].yourReward}:</div>
                                        <div class="reward-name">🎁 {selectedLeaderboard.reward_name}</div>
                                    </div>
                                {/if}
                                
                                {#if selectedLeaderboard.is_finalized}
                                    <p class="status-badge finalized">✅ {t[lang].finalized}</p>
                                {:else}
                                    <p class="status-badge pending">⏳ {t[lang].notFinalized}</p>
                                {/if}
                            </div>
                        {:else if completedCount === 0}
                            <h3 class="status-title locked">{t[lang].locked}</h3>
                            <p class="desc-text">
                                {lang === 'th' 
                                    ? 'เข้าร่วมกิจกรรมเพื่อปลดล็อกรางวัล'
                                    : 'Join events to unlock rewards'}
                            </p>
                        {:else if selectedLeaderboard.can_still_qualify}
                            <h3 class="status-title progress">{t[lang].keepGoing}</h3>
                            <p class="desc-text">
                                {t[lang].needMore} {totalSteps - completedCount} {t[lang].times} {t[lang].toQualify}
                            </p>
                            <p class="status-badge active">🔥 {t[lang].stillQualify}</p>
                        {:else}
                            <h3 class="status-title expired">{t[lang].expired}</h3>
                            <p class="desc-text">
                                {lang === 'th' 
                                    ? 'กิจกรรมนี้สิ้นสุดแล้ว'
                                    : 'This event has ended'}
                            </p>
                        {/if}
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
        font-size: 24px;
        font-weight: 700;
        margin: 0;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        line-height: 1;
    }

    .lang-toggle {
        position: absolute;
        right: 20px;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        color: white;
    }

    .lang-toggle button {
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.6);
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 4px;
        transition: 0.2s;
        font-weight: 600;
    }

    .lang-toggle button:hover {
        color: white;
    }

    .lang-toggle button.active {
        color: #00c266;
        background: rgba(0, 194, 102, 0.1);
    }

    .lang-toggle .sep {
        color: rgba(255, 255, 255, 0.3);
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
        max-width: 440px;
        margin: 0 auto;
        padding: 0 20px;
        box-sizing: border-box;
    }

    .stats-container {
        display: flex;
        gap: 12px;
        margin-bottom: 20px;
    }

    .stat-card {
        flex: 1;
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        border-radius: 12px;
        padding: 16px;
        text-align: center;
        border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .stat-value {
        font-size: 28px;
        font-weight: 700;
        color: white;
        margin-bottom: 4px;
    }

    .stat-label {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.7);
        font-weight: 500;
    }

    .event-selector-wrapper {
        display: flex;
        justify-content: center;
        margin-bottom: 20px;
        position: relative;
        z-index: 40;
    }

    .event-selector-container {
        position: relative;
        width: 100%;
        max-width: 360px;
    }

    .event-btn {
        width: 100%;
        padding: 12px 16px;
        border-radius: 12px;
        background-color: white;
        color: #111827;
        border: none;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        transition: 0.2s;
    }

    .event-btn:active {
        transform: scale(0.98);
    }

    .event-name {
        flex: 1;
        text-align: left;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .arrow-icon {
        transition: transform 0.3s ease;
        flex-shrink: 0;
        margin-left: 8px;
    }
    .arrow-icon.rotate {
        transform: rotate(180deg);
    }

    .dropdown-menu {
        position: absolute;
        top: calc(100% + 8px);
        left: 0;
        right: 0;
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
        z-index: 100;
        padding: 6px;
        box-sizing: border-box;
        max-height: 280px;
        overflow-y: auto;
    }

    .dropdown-inner {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .dropdown-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        padding: 12px;
        text-align: left;
        background: transparent;
        border: none;
        color: #4a5568;
        font-size: 13px;
        cursor: pointer;
        border-radius: 8px;
        font-weight: 500;
        transition: 0.2s;
    }

    .dropdown-item:hover {
        background-color: #f7fafc;
    }

    .dropdown-item.active {
        background-color: #e6f9ee;
        color: #00c266;
        font-weight: 600;
    }

    .dropdown-item-content {
        flex: 1;
    }

    .dropdown-item-name {
        font-weight: 600;
        margin-bottom: 4px;
    }

    .dropdown-item-meta {
        font-size: 11px;
        color: #9ca3af;
    }

    .badge-qualified {
        font-size: 16px;
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

    .stepper-container {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        max-width: 320px;
        margin-bottom: 24px;
    }

    .step-wrapper {
        display: flex;
        align-items: center;
    }

    .step {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    .step-done {
        border: 2px solid #00c266;
        color: #00c266;
        background: rgba(0, 194, 102, 0.1);
    }

    .step-locked {
        border: 2px solid #9ca3af;
        color: #9ca3af;
        background: rgba(156, 163, 175, 0.05);
    }

    .line {
        flex-grow: 1;
        width: 30px;
        height: 2px;
        background-color: #e5e7eb;
        margin: 0 6px;
    }

    .line-active {
        background-color: #00c266;
    }

    .progress-bar-container {
        width: 100%;
        max-width: 320px;
        margin-bottom: 24px;
    }

    .progress-bar {
        width: 100%;
        height: 12px;
        background: #e5e7eb;
        border-radius: 10px;
        overflow: hidden;
        margin-bottom: 8px;
    }

    .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #ff9800, #00c266);
        transition: width 0.5s ease;
        border-radius: 10px;
    }

    .progress-fill.completed {
        background: #00c266;
    }

    .progress-text-inline {
        font-size: 13px;
        color: #6b7280;
        font-weight: 600;
        text-align: center;
    }

    .message-area {
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 12px;
    }

    .congrats-text {
        color: #111827;
        font-weight: 700;
        margin: 0 0 8px 0;
        font-size: 18px;
    }

    .status-title {
        font-size: 20px;
        font-weight: 700;
        margin: 0 0 12px 0;
    }

    .status-title.locked {
        color: #9ca3af;
    }

    .status-title.progress {
        color: #00c266;
    }

    .status-title.expired {
        color: #ef4444;
    }

    .desc-text {
        font-size: 14px;
        color: #6b7280;
        margin: 0;
        line-height: 1.6;
        max-width: 280px;
    }

    .rank-badge {
        display: inline-block;
        padding: 8px 20px;
        background: linear-gradient(135deg, #ffd700, #ffed4e);
        color: #111827;
        border-radius: 20px;
        font-weight: 700;
        font-size: 16px;
        margin: 12px 0;
        box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
    }

    .reward-display {
        margin: 16px 0;
        padding: 16px;
        background: rgba(0, 194, 102, 0.05);
        border-radius: 12px;
        border: 2px solid rgba(0, 194, 102, 0.2);
    }

    .reward-label {
        font-size: 12px;
        color: #6b7280;
        margin-bottom: 6px;
        font-weight: 600;
    }

    .reward-name {
        font-size: 16px;
        color: #111827;
        font-weight: 700;
    }

    .status-badge {
        display: inline-block;
        padding: 6px 16px;
        border-radius: 20px;
        font-size: 13px;
        font-weight: 600;
        margin-top: 12px;
    }

    .status-badge.finalized {
        background: rgba(0, 194, 102, 0.1);
        color: #00c266;
    }

    .status-badge.pending {
        background: rgba(255, 152, 0, 0.1);
        color: #ff9800;
    }

    .status-badge.active {
        background: rgba(255, 152, 0, 0.1);
        color: #ff9800;
    }
</style>
