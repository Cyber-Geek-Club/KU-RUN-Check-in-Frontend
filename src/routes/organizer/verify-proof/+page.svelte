<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import Swal from 'sweetalert2';
  
  import OrganizerLayout from '$lib/components/organizer/OrganizerLayout.svelte';
  import { currentLang, lang, decodeJWT, type AppEvent, type ProofSubmission } from '$lib/stores/organizerStore';
  import { fetchEvents, fetchPendingSubmissions, approveSubmission, rejectSubmission, processImageUrl } from '$lib/api/organizerApi';
  import { ROUTES } from '$lib/utils/routes';
  
  // Auth
  let isAuthorized = false;
  let isLoading = true;
  
  // Data
  let events: AppEvent[] = [];
  let selectedEventId: number | null = null;
  let submissions: ProofSubmission[] = [];
  let filteredSubmissions: ProofSubmission[] = [];
  
  // Filters
  let searchQuery = '';
  
  // Get current language
  let langValue: 'th' | 'en';
  currentLang.subscribe(v => langValue = v);
  
  let t: typeof import('$lib/stores/organizerStore').translations.th;
  lang.subscribe(v => t = v);

  onMount(async () => {
    checkAuth();
    if (isAuthorized) {
      await loadEvents();
      
      const eventParam = $page.url.searchParams.get('event');
      if (eventParam) {
        selectedEventId = parseInt(eventParam);
        await loadSubmissions();
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
      Swal.fire({
        icon: 'error',
        title: t.error,
        text: t.loadEventsFailed,
      });
    }
  }

  async function loadSubmissions() {
    if (!selectedEventId) return;
    
    isLoading = true;
    try {
      submissions = await fetchPendingSubmissions(selectedEventId);
      applyFilters();
    } catch (error) {
      console.error('Error loading submissions:', error);
      submissions = [];
    } finally {
      isLoading = false;
    }
  }

  function applyFilters() {
    let result = [...submissions];
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(sub => 
        sub.runnerName?.toLowerCase().includes(query) ||
        sub.email?.toLowerCase().includes(query) ||
        sub.odySd?.toLowerCase().includes(query)
      );
    }
    
    filteredSubmissions = result;
  }

  $: if (searchQuery !== undefined) {
    applyFilters();
  }

  async function handleEventChange() {
    if (selectedEventId) {
      await loadSubmissions();
    } else {
      submissions = [];
      filteredSubmissions = [];
    }
  }

  async function handleApprove(submission: ProofSubmission) {
    const result = await Swal.fire({
      title: t.approveSubmission,
      html: `
        <p>${t.approveSubmissionDesc}</p>
        <p><strong>${submission.runnerName}</strong></p>
        ${submission.actualDistance ? `<p>${t.distance}: ${submission.actualDistance} km</p>` : ''}
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: t.yesApprove,
      cancelButtonText: t.cancel,
    });

    if (result.isConfirmed) {
      try {
        await approveSubmission(submission.id);
        await loadSubmissions();
        
        Swal.fire({
          icon: 'success',
          title: t.success,
          text: t.approved,
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

  async function handleReject(submission: ProofSubmission) {
    const { value: reason } = await Swal.fire({
      title: t.rejectSubmission,
      html: `
        <p>${t.rejectSubmissionDesc}</p>
        <p><strong>${submission.runnerName}</strong></p>
      `,
      input: 'select',
      inputOptions: {
        'unclear_image': t.unclearImage,
        'incorrect_data': t.incorrectData,
        'duplicate': t.duplicate,
        'other': t.otherReason,
      },
      inputPlaceholder: t.select,
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: t.confirmReject,
      cancelButtonText: t.cancel,
      inputValidator: (value) => {
        if (!value) {
          return t.selectHolidayOption;
        }
        return null;
      }
    });

    if (reason) {
      try {
        await rejectSubmission(submission.id, reason);
        await loadSubmissions();
        
        Swal.fire({
          icon: 'success',
          title: t.success,
          text: t.rejected,
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

  function viewProofImage(submission: ProofSubmission) {
    if (submission.proofImage) {
      Swal.fire({
        imageUrl: processImageUrl(submission.proofImage),
        imageAlt: 'Proof Image',
        showConfirmButton: false,
        showCloseButton: true,
        width: 'auto',
      });
    }
  }
</script>

<svelte:head>
  <title>{t.verifyProof} | KU RUN</title>
</svelte:head>

<OrganizerLayout>
  <div class="verify-proof-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-text">
        <h1>{t.verifyProof}</h1>
        <p>{t.verifyProofDesc}</p>
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

        <div class="pending-count">
          <span class="count">{filteredSubmissions.length}</span>
          <span class="label">{t.pendingSubmissions}</span>
        </div>
      </div>

      <!-- Submissions List -->
      {#if isLoading}
        <div class="loading-state">
          <div class="spinner"></div>
          <p>{t.loading}</p>
        </div>
      {:else if filteredSubmissions.length === 0}
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3>{t.noResults}</h3>
          <p>{t.noParticipantsYet}</p>
        </div>
      {:else}
        <div class="submissions-grid">
          {#each filteredSubmissions as submission (submission.id)}
            <div class="submission-card">
              <!-- User Info -->
              <div class="user-section">
                <div class="avatar">
                  {#if submission.runnerImage}
                    <img src={processImageUrl(submission.runnerImage)} alt={submission.runnerName} />
                  {:else}
                    <span>{submission.runnerName?.charAt(0) || '?'}</span>
                  {/if}
                </div>
                <div class="user-info">
                  <h4>{submission.runnerName}</h4>
                  <p class="email">{submission.email}</p>
                  <p class="nisit-id">{submission.odySd}</p>
                </div>
                <span class="rank-badge">#{submission.rank || '-'}</span>
              </div>

              <!-- Proof Info -->
              <div class="proof-section">
                <div class="proof-item">
                  <span class="label">{t.submittedAt}</span>
                  <span class="value">{formatDateTime(submission.submitTime)}</span>
                </div>
                {#if submission.actualDistance}
                  <div class="proof-item">
                    <span class="label">{t.distance}</span>
                    <span class="value">{submission.actualDistance} km</span>
                  </div>
                {/if}
                {#if submission.stravaLink}
                  <div class="proof-item">
                    <span class="label">{t.stravaLink}</span>
                    <a href={submission.stravaLink} target="_blank" rel="noopener" class="strava-link">
                      View on Strava
                    </a>
                  </div>
                {/if}
              </div>

              <!-- Proof Image -->
              {#if submission.proofImage}
                <button class="proof-image-btn" on:click={() => viewProofImage(submission)}>
                  <img src={processImageUrl(submission.proofImage)} alt="Proof" />
                  <span class="overlay">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </span>
                </button>
              {/if}

              <!-- Actions -->
              <div class="card-actions">
                <button class="btn-approve" on:click={() => handleApprove(submission)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  {t.approve}
                </button>
                <button class="btn-reject" on:click={() => handleReject(submission)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  {t.reject}
                </button>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    {:else}
      <div class="select-event-prompt">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p>{t.selectEvent}</p>
      </div>
    {/if}
  </div>
</OrganizerLayout>

<style>
  .verify-proof-page {
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
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
  }

  .search-box {
    flex: 1;
    min-width: 250px;
    max-width: 400px;
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

  .pending-count {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: rgba(234, 179, 8, 0.1);
    border: 1px solid rgba(234, 179, 8, 0.3);
    border-radius: 20px;
  }

  .pending-count .count {
    font-size: 1.25rem;
    font-weight: 700;
    color: #fbbf24;
  }

  .pending-count .label {
    font-size: 0.85rem;
    color: #fbbf24;
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

  /* Submissions Grid */
  .submissions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 1.5rem;
  }

  .submission-card {
    background: rgba(30, 41, 59, 0.6);
    border: 1px solid rgba(100, 116, 139, 0.2);
    border-radius: 16px;
    padding: 1.5rem;
    transition: all 0.3s;
  }

  .submission-card:hover {
    border-color: rgba(16, 185, 129, 0.3);
  }

  /* User Section */
  .user-section {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid rgba(100, 116, 139, 0.2);
  }

  .avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    overflow: hidden;
  }

  .avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .avatar span {
    font-size: 1.25rem;
    font-weight: 700;
    color: white;
  }

  .user-info {
    flex: 1;
    min-width: 0;
  }

  .user-info h4 {
    margin: 0 0 0.25rem;
    font-size: 1rem;
    font-weight: 600;
    color: #f8fafc;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .user-info .email,
  .user-info .nisit-id {
    margin: 0;
    font-size: 0.8rem;
    color: #94a3b8;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .rank-badge {
    padding: 0.25rem 0.625rem;
    background: rgba(100, 116, 139, 0.2);
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 600;
    color: #94a3b8;
  }

  /* Proof Section */
  .proof-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .proof-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .proof-item .label {
    font-size: 0.85rem;
    color: #94a3b8;
  }

  .proof-item .value {
    font-size: 0.9rem;
    color: #f8fafc;
    font-weight: 500;
  }

  .strava-link {
    color: #f97316;
    text-decoration: none;
    font-weight: 500;
  }

  .strava-link:hover {
    text-decoration: underline;
  }

  /* Proof Image */
  .proof-image-btn {
    position: relative;
    width: 100%;
    height: 150px;
    margin-bottom: 1rem;
    border: none;
    border-radius: 12px;
    overflow: hidden;
    cursor: pointer;
    background: rgba(15, 23, 42, 0.5);
  }

  .proof-image-btn img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .proof-image-btn .overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s;
  }

  .proof-image-btn:hover .overlay {
    opacity: 1;
  }

  .proof-image-btn .overlay svg {
    width: 32px;
    height: 32px;
    color: white;
  }

  /* Actions */
  .card-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }

  .btn-approve,
  .btn-reject {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem;
    border: none;
    border-radius: 10px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-approve {
    background: rgba(16, 185, 129, 0.15);
    color: #10b981;
  }

  .btn-approve:hover {
    background: rgba(16, 185, 129, 0.25);
  }

  .btn-reject {
    background: rgba(239, 68, 68, 0.15);
    color: #f87171;
  }

  .btn-reject:hover {
    background: rgba(239, 68, 68, 0.25);
  }

  .btn-approve svg,
  .btn-reject svg {
    width: 18px;
    height: 18px;
  }

  @media (max-width: 640px) {
    .submissions-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
