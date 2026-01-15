<script lang="ts">
    import { scale, slide, fade } from "svelte/transition";
    import { quintOut } from "svelte/easing";
    import { onMount } from "svelte";
    import { 
        fetchAllLeaderboardConfigs,
        fetchLeaderboardConfig,
        fetchLeaderboardEntries,
        fetchEventSummary,
        calculateRankings,
        finalizeLeaderboard,
        type LeaderboardConfig,
        type LeaderboardEntry,
        type EventSummary
    } from "$lib/api/leaderboardApi";

    // --- State ---
    let isLoading = true;
    let error: string | null = null;
    let configs: LeaderboardConfig[] = [];
    let selectedConfig: LeaderboardConfig | null = null;
    let entries: LeaderboardEntry[] = [];
    let summary: EventSummary | null = null;
    let isDropdownOpen = false;
    let showAllUsers = false;
    let isProcessing = false;

    // Language state
    let lang: 'th' | 'en' = 'th';

    const t = {
        th: {
            title: 'จัดการ Leaderboard',
            loading: 'กำลังโหลดข้อมูล...',
            noData: 'ไม่พบข้อมูล Leaderboard',
            selectEvent: 'เลือกกิจกรรม',
            totalQualified: 'ผู้ผ่านคุณสมบัติ',
            totalRewarded: 'ได้รับรางวัลแล้ว',
            totalSlots: 'รางวัลทั้งหมด',
            calculate: 'คำนวณอันดับ',
            finalize: 'ยืนยันผล',
            finalized: 'ยืนยันแล้ว',
            showAll: 'แสดงทั้งหมด',
            showQualified: 'เฉพาะผู้ผ่าน',
            rank: 'อันดับ',
            name: 'ชื่อ',
            email: 'อีเมล',
            times: 'ครั้ง',
            qualified: 'ผ่านแล้ว',
            reward: 'รางวัล',
            notQualified: 'ยังไม่ผ่าน',
            noRank: '-',
            calculating: 'กำลังคำนวณ...',
            finalizing: 'กำลังยืนยัน...',
            confirmFinalize: 'คุณแน่ใจหรือไม่? การยืนยันผลไม่สามารถย้อนกลับได้!',
            success: 'สำเร็จ!',
            error: 'เกิดข้อผิดพลาด',
            noEntries: 'ยังไม่มีผู้เข้าร่วม',
            noQualified: 'ยังไม่มีผู้ผ่านคุณสมบัติ',
        },
        en: {
            title: 'Manage Leaderboard',
            loading: 'Loading data...',
            noData: 'No Leaderboard Data',
            selectEvent: 'Select Event',
            totalQualified: 'Qualified',
            totalRewarded: 'Rewarded',
            totalSlots: 'Total Slots',
            calculate: 'Calculate Ranks',
            finalize: 'Finalize',
            finalized: 'Finalized',
            showAll: 'Show All',
            showQualified: 'Qualified Only',
            rank: 'Rank',
            name: 'Name',
            email: 'Email',
            times: 'Times',
            qualified: 'Qualified',
            reward: 'Reward',
            notQualified: 'Not Qualified',
            noRank: '-',
            calculating: 'Calculating...',
            finalizing: 'Finalizing...',
            confirmFinalize: 'Are you sure? This action cannot be undone!',
            success: 'Success!',
            error: 'Error occurred',
            noEntries: 'No participants yet',
            noQualified: 'No qualified participants',
        }
    };

    $: displayedEntries = showAllUsers ? entries : entries.filter(e => e.qualified_at);

    // --- API Functions ---
    async function loadConfigs() {
        isLoading = true;
        error = null;
        
        try {
            const data = await fetchAllLeaderboardConfigs();
            configs = data;
            
            // เลือก config แรกโดย default
            if (data.length > 0) {
                await selectConfig(data[0]);
            }
        } catch (err) {
            console.error('Error loading configs:', err);
            error = err instanceof Error ? err.message : 'Unknown error';
        } finally {
            isLoading = false;
        }
    }

    async function selectConfig(config: LeaderboardConfig) {
        selectedConfig = config;
        isDropdownOpen = false;
        
        try {
            // โหลดข้อมูลของ config ที่เลือก
            const [entriesData, summaryData] = await Promise.all([
                fetchLeaderboardEntries(config.id, false, 0, 1000),
                fetchEventSummary(config.event_id).catch(() => null)
            ]);
            
            entries = entriesData.sort((a, b) => {
                if (a.rank && b.rank) return a.rank - b.rank;
                if (a.rank) return -1;
                if (b.rank) return 1;
                return (b.total_completions || 0) - (a.total_completions || 0);
            });
            summary = summaryData;
        } catch (err) {
            console.error('Error loading config data:', err);
            alert(`${t[lang].error}: ${err instanceof Error ? err.message : 'Unknown'}`);
        }
    }

    async function handleCalculateRanks() {
        if (!selectedConfig || isProcessing) return;
        
        isProcessing = true;
        
        try {
            const result = await calculateRankings(selectedConfig.id);
            
            if (result.ranked_count === 0) {
                alert(t[lang].noQualified);
            } else {
                alert(`${t[lang].success} จัดอันดับได้ ${result.ranked_count} คน`);
                // รีเฟรชข้อมูล
                await selectConfig(selectedConfig);
            }
        } catch (err) {
            alert(`${t[lang].error}: ${err instanceof Error ? err.message : 'Unknown'}`);
        } finally {
            isProcessing = false;
        }
    }

    async function handleFinalize() {
        if (!selectedConfig || isProcessing) return;
        
        if (!confirm(t[lang].confirmFinalize)) {
            return;
        }
        
        isProcessing = true;
        
        try {
            const result = await finalizeLeaderboard(selectedConfig.id);
            alert(`${t[lang].success} ได้รับรางวัล ${result.total_rewarded} คน`);
            
            // รีเฟรชข้อมูล
            await loadConfigs();
        } catch (err) {
            alert(`${t[lang].error}: ${err instanceof Error ? err.message : 'Unknown'}`);
        } finally {
            isProcessing = false;
        }
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
        
        loadConfigs();
    });
</script>

<div class="app-screen">
    <div class="glass-header">
        <a href="/organizer" class="back-btn" aria-label="Back">
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
        
        <!-- Language Toggle -->
        <div class="lang-toggle">
            <button class:active={lang === 'th'} on:click={() => setLang('th')}>TH</button>
            <span class="sep">|</span>
            <button class:active={lang === 'en'} on:click={() => setLang('en')}>EN</button>
        </div>
    </div>

    <div class="scroll-container">
        <div class="content-wrapper">
            
            {#if selectedConfig}
                <!-- Summary Stats -->
                <div class="stats-container">
                    <div class="stat-card">
                        <div class="stat-value">{selectedConfig.total_qualified}</div>
                        <div class="stat-label">{t[lang].totalQualified}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">{selectedConfig.total_rewarded}</div>
                        <div class="stat-label">{t[lang].totalRewarded}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">{selectedConfig.total_reward_slots}</div>
                        <div class="stat-label">{t[lang].totalSlots}</div>
                    </div>
                </div>
            {/if}
            
            <!-- Config Selector -->
            {#if configs.length > 0}
                <div class="config-selector-wrapper">
                    <div class="config-selector-container">
                        <button
                            class="config-btn {isDropdownOpen ? 'open' : ''}"
                            on:click={() => (isDropdownOpen = !isDropdownOpen)}
                        >
                            <span class="config-name">
                                {selectedConfig?.name || t[lang].selectEvent}
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
                                    {#each configs as config}
                                        <button
                                            class="dropdown-item {config.id === selectedConfig?.id ? 'active' : ''}"
                                            on:click={() => selectConfig(config)}
                                        >
                                            <div class="dropdown-item-content">
                                                <div class="dropdown-item-name">{config.name}</div>
                                                <div class="dropdown-item-meta">
                                                    {config.total_qualified}/{config.max_reward_recipients}
                                                </div>
                                            </div>
                                            {#if config.is_finalized}
                                                <span class="badge-finalized">✅</span>
                                            {/if}
                                        </button>
                                    {/each}
                                </div>
                            </div>
                        {/if}
                    </div>
                </div>
            {/if}

            <!-- Action Buttons -->
            {#if selectedConfig}
                <div class="action-buttons">
                    <button 
                        class="action-btn calculate" 
                        on:click={handleCalculateRanks}
                        disabled={selectedConfig.is_finalized || isProcessing}
                    >
                        {isProcessing ? t[lang].calculating : `🔄 ${t[lang].calculate}`}
                    </button>
                    
                    <button 
                        class="action-btn finalize {selectedConfig.is_finalized ? 'finalized' : ''}" 
                        on:click={handleFinalize}
                        disabled={selectedConfig.is_finalized || isProcessing}
                    >
                        {selectedConfig.is_finalized 
                            ? `✅ ${t[lang].finalized}` 
                            : isProcessing 
                                ? t[lang].finalizing 
                                : `🏁 ${t[lang].finalize}`}
                    </button>
                </div>
                
                <!-- Filter Toggle -->
                <div class="filter-toggle">
                    <button 
                        class:active={!showAllUsers} 
                        on:click={() => showAllUsers = false}
                    >
                        {t[lang].showQualified}
                    </button>
                    <button 
                        class:active={showAllUsers} 
                        on:click={() => showAllUsers = true}
                    >
                        {t[lang].showAll}
                    </button>
                </div>
            {/if}

            <!-- Entries Table -->
            <div class="table-card">
                {#if isLoading}
                    <div class="empty-state">{t[lang].loading}</div>
                {:else if error}
                    <div class="empty-state error">{error}</div>
                {:else if !selectedConfig}
                    <div class="empty-state">{t[lang].noData}</div>
                {:else if displayedEntries.length === 0}
                    <div class="empty-state">
                        {showAllUsers ? t[lang].noEntries : t[lang].noQualified}
                    </div>
                {:else}
                    <div class="table-scroll">
                        <table class="entries-table">
                            <thead>
                                <tr>
                                    <th style="width: 60px;">{t[lang].rank}</th>
                                    <th>{t[lang].name}</th>
                                    <th style="width: 80px;">{t[lang].times}</th>
                                    <th>{t[lang].reward}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each displayedEntries as entry (entry.id)}
                                    <tr 
                                        class:qualified={entry.qualified_at}
                                        transition:fade={{ duration: 200 }}
                                    >
                                        <td class="rank">
                                            {#if entry.rank}
                                                <span class="rank-badge">#{entry.rank}</span>
                                            {:else}
                                                {t[lang].noRank}
                                            {/if}
                                        </td>
                                        <td>
                                            <div class="user-info">
                                                <div class="user-name">{entry.user_full_name || 'Anonymous'}</div>
                                                <div class="user-email">{entry.user_email || '-'}</div>
                                            </div>
                                        </td>
                                        <td class="completions">{entry.total_completions}</td>
                                        <td>
                                            {#if entry.reward_name}
                                                <span class="reward-badge">🎁 {entry.reward_name}</span>
                                            {:else if entry.qualified_at}
                                                <span class="status-qualified">{t[lang].qualified}</span>
                                            {:else}
                                                <span class="status-not">{t[lang].notQualified}</span>
                                            {/if}
                                        </td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
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
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
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
        font-size: 22px;
        font-weight: 700;
        margin: 0;
        letter-spacing: 0.5px;
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
        max-width: 1000px;
        margin: 0 auto;
        padding: 0 20px;
        box-sizing: border-box;
    }

    /* Stats Container */
    .stats-container {
        display: flex;
        gap: 16px;
        margin-bottom: 20px;
    }

    .stat-card {
        flex: 1;
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        border-radius: 16px;
        padding: 20px;
        text-align: center;
        border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .stat-value {
        font-size: 32px;
        font-weight: 700;
        color: white;
        margin-bottom: 8px;
    }

    .stat-label {
        font-size: 13px;
        color: rgba(255, 255, 255, 0.7);
        font-weight: 500;
    }

    /* Config Selector */
    .config-selector-wrapper {
        display: flex;
        justify-content: center;
        margin-bottom: 20px;
        position: relative;
        z-index: 40;
    }

    .config-selector-container {
        position: relative;
        width: 100%;
        max-width: 500px;
    }

    .config-btn {
        width: 100%;
        padding: 14px 20px;
        border-radius: 12px;
        background-color: white;
        color: #111827;
        border: none;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        transition: 0.2s;
    }

    .config-btn:active {
        transform: scale(0.98);
    }

    .config-name {
        flex: 1;
        text-align: left;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .arrow-icon {
        transition: transform 0.3s ease;
        flex-shrink: 0;
        margin-left: 12px;
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
        padding: 8px;
        box-sizing: border-box;
        max-height: 320px;
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
        padding: 14px;
        text-align: left;
        background: transparent;
        border: none;
        color: #4a5568;
        font-size: 14px;
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
        font-size: 12px;
        color: #9ca3af;
    }

    .badge-finalized {
        font-size: 18px;
    }

    /* Action Buttons */
    .action-buttons {
        display: flex;
        gap: 12px;
        margin-bottom: 20px;
    }

    .action-btn {
        flex: 1;
        padding: 14px 24px;
        border-radius: 12px;
        border: none;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
        transition: 0.2s;
        color: white;
    }

    .action-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .action-btn.calculate {
        background: linear-gradient(135deg, #3b82f6, #2563eb);
    }

    .action-btn.calculate:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
    }

    .action-btn.finalize {
        background: linear-gradient(135deg, #10b981, #059669);
    }

    .action-btn.finalize:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
    }

    .action-btn.finalize.finalized {
        background: #9ca3af;
    }

    /* Filter Toggle */
    .filter-toggle {
        display: flex;
        gap: 8px;
        justify-content: center;
        margin-bottom: 20px;
    }

    .filter-toggle button {
        padding: 10px 20px;
        border-radius: 20px;
        border: 1px solid rgba(255, 255, 255, 0.3);
        background: transparent;
        color: rgba(255, 255, 255, 0.7);
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: 0.2s;
    }

    .filter-toggle button:hover {
        background: rgba(255, 255, 255, 0.1);
        color: white;
    }

    .filter-toggle button.active {
        background: white;
        color: #111827;
        border-color: white;
    }

    /* Table Card */
    .table-card {
        background: white;
        border-radius: 16px;
        padding: 0;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        overflow: hidden;
    }

    .empty-state {
        padding: 60px 20px;
        text-align: center;
        color: #9ca3af;
        font-size: 15px;
    }

    .empty-state.error {
        color: #ef4444;
    }

    .table-scroll {
        overflow-x: auto;
        max-height: 600px;
        overflow-y: auto;
    }

    .entries-table {
        width: 100%;
        border-collapse: collapse;
    }

    .entries-table thead {
        position: sticky;
        top: 0;
        background: #f9fafb;
        z-index: 10;
    }

    .entries-table th {
        padding: 16px;
        text-align: left;
        font-size: 13px;
        font-weight: 700;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border-bottom: 2px solid #e5e7eb;
    }

    .entries-table td {
        padding: 16px;
        border-bottom: 1px solid #f3f4f6;
        font-size: 14px;
        color: #374151;
    }

    .entries-table tbody tr {
        transition: background-color 0.2s;
    }

    .entries-table tbody tr:hover {
        background-color: #f9fafb;
    }

    .entries-table tbody tr.qualified {
        background-color: rgba(16, 185, 129, 0.05);
    }

    .rank {
        text-align: center;
        font-weight: 700;
    }

    .rank-badge {
        display: inline-block;
        padding: 4px 10px;
        background: linear-gradient(135deg, #ffd700, #ffed4e);
        color: #111827;
        border-radius: 12px;
        font-weight: 700;
        font-size: 13px;
    }

    .user-info {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .user-name {
        font-weight: 600;
        color: #111827;
    }

    .user-email {
        font-size: 12px;
        color: #9ca3af;
    }

    .completions {
        text-align: center;
        font-weight: 600;
        color: #6366f1;
    }

    .reward-badge {
        display: inline-block;
        padding: 6px 12px;
        background: rgba(16, 185, 129, 0.1);
        color: #059669;
        border-radius: 12px;
        font-size: 13px;
        font-weight: 600;
    }

    .status-qualified {
        color: #10b981;
        font-weight: 600;
    }

    .status-not {
        color: #9ca3af;
        font-size: 13px;
    }

    @media (max-width: 768px) {
        .stats-container {
            flex-direction: column;
        }

        .table-scroll {
            overflow-x: auto;
        }

        .entries-table {
            min-width: 600px;
        }
    }
</style>
