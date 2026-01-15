<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import Swal from 'sweetalert2';
  
  import OrganizerLayout from '$lib/components/organizer/OrganizerLayout.svelte';
  import { currentLang, lang, decodeJWT, type AppEvent, type RewardUser } from '$lib/stores/organizerStore';
  import { fetchEvents, fetchLeaderboard, calculateRanks, finalizeRewards } from '$lib/api/organizerApi';
  import { ROUTES } from '$lib/utils/routes';
  
  // Auth
  let isAuthorized = false;
  let isLoading = true;
  
  // Data
  let events: AppEvent[] = [];
  let selectedEventId: number | null = null;
  let leaderboardEntries: RewardUser[] = [];
  let filteredEntries: RewardUser[] = [];
  let configId: number | null = null;
  let isFinalized = false;
  
  // Filters
  let searchQuery = '';
  let tierFilter = 'all';
  let sortBy = 'globalRank';
  
  // Get current language
  let langValue: 'th' | 'en';
  currentLang.subscribe(v => langValue = v);
  
  let t: typeof import('$lib/stores/organizerStore').translations.th;
  lang.subscribe(v => t = v);

  // Tier colors
  const tierColors: Record<string, { bg: string; text: string }> = {
    'Gold': { bg: 'rgba(234, 179, 8, 0.2)', text: '#fbbf24' },
    'Silver': { bg: 'rgba(156, 163, 175, 0.2)', text: '#9ca3af' },
    'Bronze': { bg: 'rgba(180, 83, 9, 0.2)', text: '#d97706' },
  };

  // Available tiers
  $: availableTiers = [...new Set(leaderboardEntries.map(e => e.tier))].filter(Boolean);

  onMount(async () => {
    checkAuth();
    if (isAuthorized) {
      await loadEvents();
      
      const eventParam = $page.url.searchParams.get('event');
      if (eventParam) {
        selectedEventId = parseInt(eventParam);
        await loadLeaderboard();
      }
    }
  });

  function checkAuth() {
    const token = typeof localStorage !== 'undefined' 
      ? localStorage.getItem('access_token') 
      : null;
      
    if (!token) {
      goto(ROUTES.auth.login);
      return;
    }

    const decoded = decodeJWT(token);
    if (!decoded || !decoded.exp) {
      localStorage.removeItem('access_token');
      goto(ROUTES.auth.login);
      return;
    }

    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp < now) {
      localStorage.removeItem('access_token');
      goto(ROUTES.auth.login);
      return;
    }

    isAuthorized = true;
    isLoading = false;
  }

  async function loadEvents() {
    try {
      events = await fetchEvents();
    } catch (error) {
      console.error('Error loading events:', error);
      events = [];
    }
  }

  async function loadLeaderboard() {
    if (!selectedEventId) return;
    
    isLoading = true;
    try {
      const result = await fetchLeaderboard(selectedEventId);
      leaderboardEntries = result.entries;
      configId = result.configId;
      isFinalized = result.finalized;
      applyFilters();
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      leaderboardEntries = [];
    } finally {
      isLoading = false;
    }
  }

  function applyFilters() {
    let result = [...leaderboardEntries];
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(entry => 
        entry.name?.toLowerCase().includes(query) ||
        entry.email?.toLowerCase().includes(query)
      );
    }
    
    // Tier filter
    if (tierFilter !== 'all') {
      result = result.filter(entry => entry.tier === tierFilter);
    }
    
    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'globalRank':
          return a.globalRank - b.globalRank;
        case 'tierRank':
          return a.tierRank - b.tierRank;
        case 'completedCount':
          return b.completedCount - a.completedCount;
        default:
          return 0;
      }
    });
    
    filteredEntries = result;
  }

  $: if (searchQuery !== undefined || tierFilter || sortBy) {
    applyFilters();
  }

  async function handleEventChange() {
    if (selectedEventId) {
      await loadLeaderboard();
    } else {
      leaderboardEntries = [];
      filteredEntries = [];
      configId = null;
      isFinalized = false;
    }
  }

  async function handleCalculateRanks() {
    if (!configId) return;
    
    const result = await Swal.fire({
      title: t.confirm,
      text: langValue === 'th' ? 'คำนวณอันดับใหม่?' : 'Recalculate ranks?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: t.confirm,
      cancelButtonText: t.cancel,
    });

    if (result.isConfirmed) {
      try {
        await calculateRanks(configId);
        await loadLeaderboard();
        
        Swal.fire({
          icon: 'success',
          title: t.success,
          timer: 2000,
          showConfirmButton: false,
        });
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: t.error,
          text: t.somethingWentWrong,
        });
      }
    }
  }

  async function handleFinalizeRewards() {
    if (!configId) return;
    
    const result = await Swal.fire({
      title: t.confirm,
      text: langValue === 'th' ? 'ยืนยันการแจกรางวัล? (ไม่สามารถย้อนกลับได้)' : 'Confirm reward distribution? (Cannot be undone)',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: t.confirm,
      cancelButtonText: t.cancel,
    });

    if (result.isConfirmed) {
      try {
        await finalizeRewards(configId);
        await loadLeaderboard();
        
        Swal.fire({
          icon: 'success',
          title: t.success,
          timer: 2000,
          showConfirmButton: false,
        });
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: t.error,
          text: t.somethingWentWrong,
        });
      }
    }
  }

  function getTierStyle(tier: string): string {
    const colors = tierColors[tier] || { bg: 'rgba(100, 116, 139, 0.2)', text: '#94a3b8' };
    return `background: ${colors.bg}; color: ${colors.text};`;
  }
</script>

<svelte:head>
  <title>{t.rewards} | KU RUN</title>
</svelte:head>

<OrganizerLayout>
  <div class="rewards-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-text">
        <h1>{t.rewards}</h1>
        <p>{t.monthlyRewardDesc}</p>
      </div>
    </div>

    <!-- Event Selector -->
    <div class="event-selector">
      <label for="event-select">{t.selectEvent}</label>
      <select id="event-select" bind:value={selectedEventId} on:change={handleEventChange}>
        <option value={null}>{t.selectEvent}...</option>
        {#each events as event}
          <option value={event.id}>{event.title}</option>
        {/each}
      </select>
    </div>

    {#if selectedEventId}
      <!-- Actions -->
      {#if configId && !isFinalized}
        <div class="actions-bar">
          <button class="btn-calculate" on:click={handleCalculateRanks}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {langValue === 'th' ? 'คำนวณอันดับ' : 'Calculate Ranks'}
          </button>
          <button class="btn-finalize" on:click={handleFinalizeRewards}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {langValue === 'th' ? 'ยืนยันแจกรางวัล' : 'Finalize Rewards'}
          </button>
        </div>
      {/if}

      {#if isFinalized}
        <div class="finalized-badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {langValue === 'th' ? 'รางวัลถูกยืนยันแล้ว' : 'Rewards Finalized'}
        </div>
      {/if}

      <!-- Filters -->
      <div class="filters-bar">
        <div class="search-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            bind:value={searchQuery}
            placeholder={t.searchByName}
          />
        </div>

        <select bind:value={tierFilter} class="filter-select">
          <option value="all">{t.allTiers}</option>
          {#each availableTiers as tier}
            <option value={tier}>{tier}</option>
          {/each}
        </select>

        <select bind:value={sortBy} class="filter-select">
          <option value="globalRank">{t.globalBestFirst}</option>
          <option value="tierRank">{t.tierBestFirst}</option>
          <option value="completedCount">{langValue === 'th' ? 'จำนวนครั้งสูงสุด' : 'Most Completions'}</option>
        </select>
      </div>

      <!-- Leaderboard -->
      {#if isLoading}
        <div class="loading-state">
          <div class="spinner"></div>
          <p>{t.loading}</p>
        </div>
      {:else if filteredEntries.length === 0}
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V6a2 2 0 10-2 2h2zm0 0h4l-4 4-4-4h4z" />
          </svg>
          <h3>{t.noRewards}</h3>
          <p>{t.noParticipantsYet}</p>
        </div>
      {:else}
        <div class="leaderboard">
          <div class="leaderboard-header">
            <span class="col-rank">{t.globalRank}</span>
            <span class="col-user">{t.user}</span>
            <span class="col-tier">{langValue === 'th' ? 'ระดับ' : 'Tier'}</span>
            <span class="col-count">{langValue === 'th' ? 'จำนวนครั้ง' : 'Completions'}</span>
          </div>
          
          {#each filteredEntries as entry, index (entry.id)}
            <div class="leaderboard-row" class:top-3={entry.globalRank <= 3}>
              <span class="col-rank">
                <span class="rank-badge" class:gold={entry.globalRank === 1} class:silver={entry.globalRank === 2} class:bronze={entry.globalRank === 3}>
                  #{entry.globalRank}
                </span>
              </span>
              <div class="col-user">
                <span class="user-name">{entry.name}</span>
                <span class="user-email">{entry.email}</span>
              </div>
              <span class="col-tier">
                <span class="tier-badge" style={getTierStyle(entry.tier)}>
                  {entry.tier}
                </span>
              </span>
              <span class="col-count">
                <span class="count-value">{entry.completedCount}</span>
                <span class="count-label">{t.times}</span>
              </span>
            </div>
          {/each}
        </div>

        <div class="table-footer">
          <span>{t.showing} {filteredEntries.length} {t.of} {leaderboardEntries.length} {t.users}</span>
        </div>
      {/if}
    {:else}
      <div class="select-event-prompt">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V6a2 2 0 10-2 2h2zm0 0h4l-4 4-4-4h4z" />
        </svg>
        <p>{t.selectEvent}</p>
      </div>
    {/if}
  </div>
</OrganizerLayout>

<style>
  .rewards-page {
    max-width: 1000px;
    margin: 0 auto;
  }

  .page-header {
    margin-bottom: 2rem;
  }

  .header-text h1 {
    margin: 0 0 0.25rem;
    font-size: 1.75rem;
    font-weight: 700;
    color: #f8fafc;
  }

  .header-text p {
    margin: 0;
    color: #94a3b8;
    font-size: 0.95rem;
  }

  /* Event Selector */
  .event-selector {
    margin-bottom: 1.5rem;
  }

  .event-selector label {
    display: block;
    margin-bottom: 0.5rem;
    color: #cbd5e1;
    font-size: 0.9rem;
    font-weight: 500;
  }

  .event-selector select {
    width: 100%;
    max-width: 400px;
    padding: 0.75rem 1rem;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(100, 116, 139, 0.3);
    border-radius: 12px;
    color: #f8fafc;
    font-size: 0.95rem;
  }

  .event-selector select:focus {
    outline: none;
    border-color: #10b981;
  }

  /* Actions Bar */
  .actions-bar {
    display: flex;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .btn-calculate,
  .btn-finalize {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.25rem;
    border: none;
    border-radius: 10px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-calculate {
    background: rgba(59, 130, 246, 0.15);
    color: #60a5fa;
  }

  .btn-calculate:hover {
    background: rgba(59, 130, 246, 0.25);
  }

  .btn-finalize {
    background: rgba(16, 185, 129, 0.15);
    color: #10b981;
  }

  .btn-finalize:hover {
    background: rgba(16, 185, 129, 0.25);
  }

  .btn-calculate svg,
  .btn-finalize svg {
    width: 18px;
    height: 18px;
  }

  .finalized-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.25rem;
    background: rgba(16, 185, 129, 0.15);
    border: 1px solid rgba(16, 185, 129, 0.3);
    border-radius: 20px;
    color: #10b981;
    font-weight: 600;
    margin-bottom: 1.5rem;
  }

  .finalized-badge svg {
    width: 20px;
    height: 20px;
  }

  /* Filters */
  .filters-bar {
    display: flex;
    gap: 1rem;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
  }

  .search-box {
    flex: 1;
    min-width: 250px;
    position: relative;
  }

  .search-box svg {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    width: 20px;
    height: 20px;
    color: #64748b;
  }

  .search-box input {
    width: 100%;
    padding: 0.75rem 1rem 0.75rem 3rem;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(100, 116, 139, 0.3);
    border-radius: 12px;
    color: #f8fafc;
    font-size: 0.95rem;
  }

  .search-box input:focus {
    outline: none;
    border-color: #10b981;
  }

  .filter-select {
    padding: 0.75rem 1rem;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(100, 116, 139, 0.3);
    border-radius: 12px;
    color: #f8fafc;
    font-size: 0.95rem;
  }

  /* States */
  .loading-state,
  .empty-state,
  .select-event-prompt {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    text-align: center;
    background: rgba(30, 41, 59, 0.4);
    border: 1px solid rgba(100, 116, 139, 0.2);
    border-radius: 16px;
  }

  .spinner {
    width: 48px;
    height: 48px;
    border: 4px solid rgba(16, 185, 129, 0.2);
    border-top-color: #10b981;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .loading-state p,
  .empty-state p,
  .select-event-prompt p {
    color: #94a3b8;
  }

  .empty-state svg,
  .select-event-prompt svg {
    width: 64px;
    height: 64px;
    color: #64748b;
    margin-bottom: 1rem;
  }

  .empty-state h3 {
    margin: 0 0 0.5rem;
    color: #f8fafc;
    font-size: 1.25rem;
  }

  /* Leaderboard */
  .leaderboard {
    background: rgba(30, 41, 59, 0.4);
    border: 1px solid rgba(100, 116, 139, 0.2);
    border-radius: 16px;
    overflow: hidden;
  }

  .leaderboard-header {
    display: grid;
    grid-template-columns: 80px 1fr 120px 100px;
    gap: 1rem;
    padding: 1rem 1.5rem;
    background: rgba(15, 23, 42, 0.5);
    border-bottom: 1px solid rgba(100, 116, 139, 0.2);
  }

  .leaderboard-header span {
    font-size: 0.85rem;
    font-weight: 600;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .leaderboard-row {
    display: grid;
    grid-template-columns: 80px 1fr 120px 100px;
    gap: 1rem;
    padding: 1rem 1.5rem;
    align-items: center;
    border-bottom: 1px solid rgba(100, 116, 139, 0.1);
    transition: background 0.2s;
  }

  .leaderboard-row:last-child {
    border-bottom: none;
  }

  .leaderboard-row:hover {
    background: rgba(16, 185, 129, 0.05);
  }

  .leaderboard-row.top-3 {
    background: rgba(234, 179, 8, 0.05);
  }

  .rank-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.25rem 0.625rem;
    background: rgba(100, 116, 139, 0.2);
    border-radius: 20px;
    font-weight: 700;
    font-size: 0.85rem;
    color: #94a3b8;
  }

  .rank-badge.gold {
    background: rgba(234, 179, 8, 0.2);
    color: #fbbf24;
  }

  .rank-badge.silver {
    background: rgba(156, 163, 175, 0.2);
    color: #9ca3af;
  }

  .rank-badge.bronze {
    background: rgba(180, 83, 9, 0.2);
    color: #d97706;
  }

  .col-user {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    min-width: 0;
  }

  .user-name {
    font-weight: 500;
    color: #f8fafc;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .user-email {
    font-size: 0.8rem;
    color: #94a3b8;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .tier-badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 600;
  }

  .col-count {
    display: flex;
    align-items: baseline;
    gap: 0.25rem;
  }

  .count-value {
    font-size: 1.125rem;
    font-weight: 700;
    color: #f8fafc;
  }

  .count-label {
    font-size: 0.75rem;
    color: #94a3b8;
  }

  .table-footer {
    padding: 1rem;
    text-align: center;
    color: #64748b;
    font-size: 0.85rem;
    border-top: 1px solid rgba(100, 116, 139, 0.2);
  }

  @media (max-width: 768px) {
    .leaderboard-header,
    .leaderboard-row {
      grid-template-columns: 60px 1fr 80px;
    }

    .col-count {
      display: none;
    }

    .leaderboard-header .col-count {
      display: none;
    }
  }
</style>
