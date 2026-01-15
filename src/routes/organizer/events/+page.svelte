<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import Swal from 'sweetalert2';
  
  import OrganizerLayout from '$lib/components/organizer/OrganizerLayout.svelte';
  import { currentLang, lang, decodeJWT, type AppEvent } from '$lib/stores/organizerStore';
  import { fetchEvents, deleteEvent, API_BASE_URL, processImageUrl } from '$lib/api/organizerApi';
  import { ROUTES } from '$lib/utils/routes';
  
  // Auth
  let isAuthorized = false;
  let isLoading = true;
  
  // Events data
  let events: AppEvent[] = [];
  let filteredEvents: AppEvent[] = [];
  
  // Filters
  let searchQuery = '';
  let selectedMonth = 'all';
  let selectedYear = 'all';
  
  // Get current language
  let langValue: 'th' | 'en';
  currentLang.subscribe(v => langValue = v);
  
  let t: typeof import('$lib/stores/organizerStore').translations.th;
  lang.subscribe(v => t = v);
  
  // Available years and months
  $: availableYears = [...new Set(events.map(e => e.year))].filter(Boolean).sort().reverse();
  $: availableMonths = [...new Set(events.map(e => e.month))].filter(Boolean).sort();
  
  const monthNames: Record<string, { th: string; en: string }> = {
    '01': { th: 'มกราคม', en: 'January' },
    '02': { th: 'กุมภาพันธ์', en: 'February' },
    '03': { th: 'มีนาคม', en: 'March' },
    '04': { th: 'เมษายน', en: 'April' },
    '05': { th: 'พฤษภาคม', en: 'May' },
    '06': { th: 'มิถุนายน', en: 'June' },
    '07': { th: 'กรกฎาคม', en: 'July' },
    '08': { th: 'สิงหาคม', en: 'August' },
    '09': { th: 'กันยายน', en: 'September' },
    '10': { th: 'ตุลาคม', en: 'October' },
    '11': { th: 'พฤศจิกายน', en: 'November' },
    '12': { th: 'ธันวาคม', en: 'December' },
  };

  onMount(async () => {
    checkAuth();
    if (isAuthorized) {
      await loadEvents();
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
  }

  async function loadEvents() {
    isLoading = true;
    try {
      events = await fetchEvents();
      applyFilters();
    } catch (error) {
      console.error('Error loading events:', error);
      events = [];
    } finally {
      isLoading = false;
    }
  }

  function applyFilters() {
    let result = [...events];
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(e => 
        e.title?.toLowerCase().includes(query) ||
        e.location?.toLowerCase().includes(query) ||
        e.description?.toLowerCase().includes(query)
      );
    }
    
    // Month filter
    if (selectedMonth !== 'all') {
      result = result.filter(e => e.month === selectedMonth);
    }
    
    // Year filter
    if (selectedYear !== 'all') {
      result = result.filter(e => e.year === selectedYear);
    }
    
    filteredEvents = result;
  }

  $: if (searchQuery !== undefined || selectedMonth || selectedYear) {
    applyFilters();
  }

  async function handleDelete(event: AppEvent) {
    const result = await Swal.fire({
      title: t.deleteEventTitle,
      text: t.deleteEventText,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: t.yesDelete,
      cancelButtonText: t.cancel,
    });

    if (result.isConfirmed) {
      try {
        await deleteEvent(event.id);
        await loadEvents();
        
        Swal.fire({
          icon: 'success',
          title: t.deleted,
          text: t.eventDeletedSuccess,
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

  function getEventStatus(event: AppEvent): 'active' | 'draft' | 'closed' {
    if (!event.is_active) return 'draft';
    
    const now = new Date();
    const endDate = new Date(event.end_date);
    
    if (endDate < now) return 'closed';
    return 'active';
  }

  function getStatusClass(status: string): string {
    switch (status) {
      case 'active': return 'status-active';
      case 'draft': return 'status-draft';
      case 'closed': return 'status-closed';
      default: return '';
    }
  }

  function formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString(langValue === 'th' ? 'th-TH' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
</script>

<svelte:head>
  <title>{t.events} | KU RUN</title>
</svelte:head>

<OrganizerLayout>
  <div class="events-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-text">
        <h1>{t.events}</h1>
        <p>{t.eventList}</p>
      </div>
      <a href={ROUTES.organizer.createEvent} class="btn-create">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        {t.createEvent}
      </a>
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
          placeholder={t.searchEvents}
        />
      </div>

      <select bind:value={selectedMonth} class="filter-select">
        <option value="all">{t.allMonths}</option>
        {#each availableMonths as month}
          <option value={month}>{monthNames[month]?.[langValue] || month}</option>
        {/each}
      </select>

      <select bind:value={selectedYear} class="filter-select">
        <option value="all">{t.allYears}</option>
        {#each availableYears as year}
          <option value={year}>{year}</option>
        {/each}
      </select>
    </div>

    <!-- Events Grid -->
    {#if isLoading}
      <div class="loading-state">
        <div class="spinner"></div>
        <p>{t.loading}</p>
      </div>
    {:else if filteredEvents.length === 0}
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <h3>{t.noEventsFound}</h3>
        <p>{t.noResults}</p>
        <a href={ROUTES.organizer.createEvent} class="btn-create-empty">
          {t.createEvent}
        </a>
      </div>
    {:else}
      <div class="events-grid">
        {#each filteredEvents as event (event.id)}
          {@const status = getEventStatus(event)}
          <div class="event-card">
            <div class="card-image">
              {#if event.image_url}
                <img src={processImageUrl(event.image_url)} alt={event.title} />
              {:else}
                <div class="placeholder-image">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              {/if}
              <span class="status-badge {getStatusClass(status)}">
                {t[status]}
              </span>
            </div>

            <div class="card-content">
              <h3 class="event-title">{event.title}</h3>
              
              <div class="event-meta">
                <div class="meta-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{formatDate(event.start_date)}</span>
                </div>
                <div class="meta-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{event.location || '-'}</span>
                </div>
                <div class="meta-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>{event.participant_count || 0} / {event.capacity}</span>
                </div>
              </div>

              <div class="card-actions">
                <a href="{ROUTES.organizer.eventLog}?event={event.id}" class="btn-action">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </a>
                <a href="{ROUTES.organizer.verifyProof}?event={event.id}" class="btn-action">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </a>
                <button class="btn-action btn-delete" on:click={() => handleDelete(event)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</OrganizerLayout>

<style>
  .events-page {
    max-width: 1400px;
    margin: 0 auto;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 2rem;
    gap: 1rem;
    flex-wrap: wrap;
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

  .btn-create {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    font-weight: 600;
    font-size: 0.95rem;
    border-radius: 12px;
    text-decoration: none;
    transition: all 0.2s;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }

  .btn-create:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
  }

  .btn-create svg {
    width: 20px;
    height: 20px;
  }

  /* Filters */
  .filters-bar {
    display: flex;
    gap: 1rem;
    margin-bottom: 2rem;
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
    cursor: pointer;
  }

  .filter-select:focus {
    outline: none;
    border-color: #10b981;
  }

  /* Loading & Empty States */
  .loading-state,
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    text-align: center;
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
  .empty-state p {
    color: #94a3b8;
  }

  .empty-state svg {
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

  .btn-create-empty {
    margin-top: 1.5rem;
    padding: 0.75rem 1.5rem;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    font-weight: 600;
    border-radius: 12px;
    text-decoration: none;
  }

  /* Events Grid */
  .events-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1.5rem;
  }

  .event-card {
    background: rgba(30, 41, 59, 0.6);
    border: 1px solid rgba(100, 116, 139, 0.2);
    border-radius: 16px;
    overflow: hidden;
    transition: all 0.3s;
  }

  .event-card:hover {
    border-color: rgba(16, 185, 129, 0.3);
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
  }

  .card-image {
    position: relative;
    height: 180px;
    background: rgba(15, 23, 42, 0.5);
  }

  .card-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .placeholder-image {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%);
  }

  .placeholder-image svg {
    width: 48px;
    height: 48px;
    color: #64748b;
  }

  .status-badge {
    position: absolute;
    top: 1rem;
    right: 1rem;
    padding: 0.375rem 0.75rem;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .status-active {
    background: rgba(16, 185, 129, 0.9);
    color: white;
  }

  .status-draft {
    background: rgba(234, 179, 8, 0.9);
    color: #1e293b;
  }

  .status-closed {
    background: rgba(100, 116, 139, 0.9);
    color: white;
  }

  .card-content {
    padding: 1.25rem;
  }

  .event-title {
    margin: 0 0 1rem;
    font-size: 1.125rem;
    font-weight: 600;
    color: #f8fafc;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .event-meta {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #94a3b8;
    font-size: 0.85rem;
  }

  .meta-item svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }

  .meta-item span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .card-actions {
    display: flex;
    gap: 0.5rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(100, 116, 139, 0.2);
  }

  .btn-action {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.625rem;
    background: rgba(100, 116, 139, 0.1);
    border: 1px solid rgba(100, 116, 139, 0.2);
    border-radius: 8px;
    color: #94a3b8;
    cursor: pointer;
    transition: all 0.2s;
    text-decoration: none;
  }

  .btn-action:hover {
    background: rgba(16, 185, 129, 0.1);
    border-color: rgba(16, 185, 129, 0.3);
    color: #10b981;
  }

  .btn-action.btn-delete:hover {
    background: rgba(239, 68, 68, 0.1);
    border-color: rgba(239, 68, 68, 0.3);
    color: #ef4444;
  }

  .btn-action svg {
    width: 18px;
    height: 18px;
  }

  @media (max-width: 640px) {
    .page-header {
      flex-direction: column;
    }

    .btn-create {
      width: 100%;
      justify-content: center;
    }

    .filters-bar {
      flex-direction: column;
    }

    .search-box {
      min-width: 100%;
    }
  }
</style>
