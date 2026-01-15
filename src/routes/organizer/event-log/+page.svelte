<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import Swal from 'sweetalert2';
  
  import OrganizerLayout from '$lib/components/organizer/OrganizerLayout.svelte';
  import { currentLang, lang, decodeJWT, type AppEvent, type Log } from '$lib/stores/organizerStore';
  import { fetchEvents, fetchEventLogs, API_BASE_URL, processImageUrl } from '$lib/api/organizerApi';
  import { ROUTES } from '$lib/utils/routes';
  
  // Auth
  let isAuthorized = false;
  let isLoading = true;
  
  // Data
  let events: AppEvent[] = [];
  let selectedEventId: number | null = null;
  let logs: Log[] = [];
  let filteredLogs: Log[] = [];
  
  // Pagination
  let currentPage = 1;
  let itemsPerPage = 20;
  $: totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  $: paginatedLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  
  // Filters
  let searchQuery = '';
  let statusFilter = 'all';
  let dateFrom = '';
  let dateTo = '';
  
  // Get current language
  let langValue: 'th' | 'en';
  currentLang.subscribe(v => langValue = v);
  
  let t: typeof import('$lib/stores/organizerStore').translations.th;
  lang.subscribe(v => t = v);

  onMount(async () => {
    checkAuth();
    if (isAuthorized) {
      await loadEvents();
      
      // Check URL params for pre-selected event
      const eventParam = $page.url.searchParams.get('event');
      if (eventParam) {
        selectedEventId = parseInt(eventParam);
        await loadLogs();
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

  async function loadLogs() {
    if (!selectedEventId) return;
    
    isLoading = true;
    try {
      logs = await fetchEventLogs(selectedEventId);
      applyFilters();
    } catch (error) {
      console.error('Error loading logs:', error);
      logs = [];
    } finally {
      isLoading = false;
    }
  }

  function applyFilters() {
    let result = [...logs];
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(log => 
        log.user_name?.toLowerCase().includes(query) ||
        log.user_email?.toLowerCase().includes(query) ||
        log.nisit_id?.toLowerCase().includes(query)
      );
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(log => log.action === statusFilter);
    }
    
    // Date filter
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      result = result.filter(log => new Date(log.created_at) >= fromDate);
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      result = result.filter(log => new Date(log.created_at) <= toDate);
    }
    
    filteredLogs = result;
    currentPage = 1; // Reset to first page when filters change
  }

  $: if (searchQuery !== undefined || statusFilter || dateFrom || dateTo) {
    applyFilters();
  }

  function goToPage(page: number) {
    if (page >= 1 && page <= totalPages) {
      currentPage = page;
    }
  }

  function exportToCSV() {
    if (filteredLogs.length === 0) return;
    
    const selectedEvent = events.find(e => e.id === selectedEventId);
    const eventName = selectedEvent?.title || 'logs';
    
    const headers = [
      langValue === 'th' ? 'ชื่อ' : 'Name',
      langValue === 'th' ? 'อีเมล' : 'Email',
      langValue === 'th' ? 'รหัสนิสิต' : 'Student ID',
      langValue === 'th' ? 'รหัสเข้าร่วม' : 'Join Code',
      langValue === 'th' ? 'สถานะ' : 'Status',
      langValue === 'th' ? 'วันที่' : 'Date'
    ];
    
    const rows = filteredLogs.map(log => [
      log.user_name || '',
      log.user_email || '',
      log.nisit_id || '',
      log.join_code || '',
      getActionLabel(log.action),
      formatDateTime(log.created_at)
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${eventName}_logs_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
    
    Swal.fire({
      icon: 'success',
      title: t.success,
      text: langValue === 'th' ? 'ส่งออกข้อมูลสำเร็จ' : 'Export successful',
      timer: 2000,
      showConfirmButton: false,
    });
  }

  async function handleEventChange() {
    if (selectedEventId) {
      await loadLogs();
    } else {
      logs = [];
      filteredLogs = [];
    }
  }

  function formatDateTime(dateStr: string | undefined): string {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString(langValue === 'th' ? 'th-TH' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function getActionLabel(action: string): string {
    switch (action) {
      case 'joined': return t.actionJoined;
      case 'checked_in': return t.actionCheckedIn;
      case 'completed': return t.actionCompleted;
      case 'cancelled': return t.actionCancelled;
      case 'rejected': return t.actionRejected;
      default: return action;
    }
  }

  function getActionClass(action: string): string {
    switch (action) {
      case 'joined': return 'action-joined';
      case 'checked_in': return 'action-checkedin';
      case 'completed': return 'action-completed';
      case 'cancelled': return 'action-cancelled';
      case 'rejected': return 'action-rejected';
      default: return '';
    }
  }
</script>

<svelte:head>
  <title>{t.activityLogs} | KU RUN</title>
</svelte:head>

<OrganizerLayout>
  <div class="logs-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-text">
        <h1>{t.activityLogs}</h1>
        <p>{t.eventLogDesc}</p>
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
      <!-- Stats Summary -->
      <div class="stats-bar">
        <div class="stat-item">
          <span class="stat-value">{logs.length}</span>
          <span class="stat-label">{langValue === 'th' ? 'ทั้งหมด' : 'Total'}</span>
        </div>
        <div class="stat-item">
          <span class="stat-value stat-joined">{logs.filter(l => l.action === 'joined').length}</span>
          <span class="stat-label">{t.actionJoined}</span>
        </div>
        <div class="stat-item">
          <span class="stat-value stat-checkedin">{logs.filter(l => l.action === 'checked_in').length}</span>
          <span class="stat-label">{t.actionCheckedIn}</span>
        </div>
        <div class="stat-item">
          <span class="stat-value stat-completed">{logs.filter(l => l.action === 'completed').length}</span>
          <span class="stat-label">{t.actionCompleted}</span>
        </div>
      </div>

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

        <select bind:value={statusFilter} class="filter-select">
          <option value="all">{t.all}</option>
          <option value="joined">{t.actionJoined}</option>
          <option value="checked_in">{t.actionCheckedIn}</option>
          <option value="completed">{t.actionCompleted}</option>
          <option value="cancelled">{t.actionCancelled}</option>
          <option value="rejected">{t.actionRejected}</option>
        </select>

        <div class="date-filters">
          <div class="date-input">
            <label>{langValue === 'th' ? 'จาก' : 'From'}</label>
            <input type="date" bind:value={dateFrom} />
          </div>
          <div class="date-input">
            <label>{langValue === 'th' ? 'ถึง' : 'To'}</label>
            <input type="date" bind:value={dateTo} />
          </div>
        </div>

        <button class="export-btn" on:click={exportToCSV} disabled={filteredLogs.length === 0}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          {langValue === 'th' ? 'ส่งออก CSV' : 'Export CSV'}
        </button>
      </div>

      <!-- Logs Table -->
      {#if isLoading}
        <div class="loading-state">
          <div class="spinner"></div>
          <p>{t.loading}</p>
        </div>
      {:else if filteredLogs.length === 0}
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3>{t.noParticipantsYet}</h3>
          <p>{t.noOneJoined}</p>
        </div>
      {:else}
        <div class="logs-table-container">
          <table class="logs-table">
            <thead>
              <tr>
                <th>{t.user}</th>
                <th>{t.stdId}</th>
                <th>{t.joinCode}</th>
                <th>{t.status}</th>
                <th>{t.timestamp}</th>
              </tr>
            </thead>
            <tbody>
              {#each paginatedLogs as log (log.id)}
                <tr>
                  <td>
                    <div class="user-info">
                      <span class="user-name">{log.user_name}</span>
                      <span class="user-email">{log.user_email}</span>
                    </div>
                  </td>
                  <td>{log.nisit_id || '-'}</td>
                  <td>
                    <code class="join-code">{log.join_code || '-'}</code>
                  </td>
                  <td>
                    <span class="action-badge {getActionClass(log.action)}">
                      {getActionLabel(log.action)}
                    </span>
                  </td>
                  <td class="timestamp">{formatDateTime(log.created_at)}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        <!-- Mobile Cards View -->
        <div class="logs-cards">
          {#each paginatedLogs as log (log.id)}
            <div class="log-card">
              <div class="card-header">
                <div class="user-info">
                  <span class="user-name">{log.user_name}</span>
                  <span class="user-email">{log.user_email}</span>
                </div>
                <span class="action-badge {getActionClass(log.action)}">
                  {getActionLabel(log.action)}
                </span>
              </div>
              <div class="card-body">
                <div class="card-row">
                  <span class="card-label">{t.stdId}:</span>
                  <span>{log.nisit_id || '-'}</span>
                </div>
                <div class="card-row">
                  <span class="card-label">{t.joinCode}:</span>
                  <code class="join-code">{log.join_code || '-'}</code>
                </div>
                <div class="card-row">
                  <span class="card-label">{t.timestamp}:</span>
                  <span class="timestamp">{formatDateTime(log.created_at)}</span>
                </div>
              </div>
            </div>
          {/each}
        </div>

        <!-- Pagination -->
        {#if totalPages > 1}
          <div class="pagination">
            <button 
              class="page-btn" 
              on:click={() => goToPage(1)} 
              disabled={currentPage === 1}
              title={langValue === 'th' ? 'หน้าแรก' : 'First page'}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
            <button 
              class="page-btn" 
              on:click={() => goToPage(currentPage - 1)} 
              disabled={currentPage === 1}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div class="page-info">
              <span>{langValue === 'th' ? 'หน้า' : 'Page'}</span>
              <select bind:value={currentPage} class="page-select">
                {#each Array(totalPages) as _, i}
                  <option value={i + 1}>{i + 1}</option>
                {/each}
              </select>
              <span>{langValue === 'th' ? 'จาก' : 'of'} {totalPages}</span>
            </div>

            <button 
              class="page-btn" 
              on:click={() => goToPage(currentPage + 1)} 
              disabled={currentPage === totalPages}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button 
              class="page-btn" 
              on:click={() => goToPage(totalPages)} 
              disabled={currentPage === totalPages}
              title={langValue === 'th' ? 'หน้าสุดท้าย' : 'Last page'}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        {/if}

        <div class="table-footer">
          <span>{t.showing} {paginatedLogs.length} {t.of} {filteredLogs.length} {t.users}</span>
          {#if filteredLogs.length !== logs.length}
            <span class="filter-note">({langValue === 'th' ? 'กรองจาก' : 'filtered from'} {logs.length})</span>
          {/if}
        </div>
      {/if}
    {:else}
      <div class="select-event-prompt">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p>{t.selectEvent}</p>
      </div>
    {/if}
  </div>
</OrganizerLayout>

<style>
  .logs-page {
    max-width: 1200px;
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

  /* Table */
  .logs-table-container {
    background: rgba(30, 41, 59, 0.4);
    border: 1px solid rgba(100, 116, 139, 0.2);
    border-radius: 16px;
    overflow: hidden;
  }

  .logs-table {
    width: 100%;
    border-collapse: collapse;
  }

  .logs-table th,
  .logs-table td {
    padding: 1rem;
    text-align: left;
  }

  .logs-table th {
    background: rgba(15, 23, 42, 0.5);
    color: #94a3b8;
    font-size: 0.85rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 1px solid rgba(100, 116, 139, 0.2);
  }

  .logs-table td {
    color: #f8fafc;
    font-size: 0.9rem;
    border-bottom: 1px solid rgba(100, 116, 139, 0.1);
  }

  .logs-table tr:last-child td {
    border-bottom: none;
  }

  .logs-table tr:hover td {
    background: rgba(16, 185, 129, 0.05);
  }

  .user-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .user-name {
    font-weight: 500;
  }

  .user-email {
    font-size: 0.8rem;
    color: #94a3b8;
  }

  .join-code {
    padding: 0.25rem 0.5rem;
    background: rgba(100, 116, 139, 0.2);
    border-radius: 4px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.85rem;
  }

  .action-badge {
    display: inline-block;
    padding: 0.25rem 0.625rem;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .action-joined {
    background: rgba(59, 130, 246, 0.2);
    color: #60a5fa;
  }

  .action-checkedin {
    background: rgba(16, 185, 129, 0.2);
    color: #34d399;
  }

  .action-completed {
    background: rgba(16, 185, 129, 0.3);
    color: #10b981;
  }

  .action-cancelled {
    background: rgba(234, 179, 8, 0.2);
    color: #fbbf24;
  }

  .action-rejected {
    background: rgba(239, 68, 68, 0.2);
    color: #f87171;
  }

  .timestamp {
    color: #94a3b8;
    font-size: 0.85rem;
  }

  .table-footer {
    padding: 1rem;
    text-align: center;
    color: #64748b;
    font-size: 0.85rem;
    border-top: 1px solid rgba(100, 116, 139, 0.2);
  }

  @media (max-width: 768px) {
    .logs-table-container {
      overflow-x: auto;
    }

    .logs-table {
      min-width: 700px;
    }
  }
</style>
