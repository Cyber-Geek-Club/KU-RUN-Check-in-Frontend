<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
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
  
  // Bulk selection
  let selectedIds: Set<number> = new Set();
  let selectAll = false;
  
  // Currently focused submission (for keyboard navigation)
  let focusedIndex = 0;
  
  // Image viewer
  let showImageViewer = false;
  let currentImageUrl = '';
  let currentImageSubmission: ProofSubmission | null = null;
  
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
    
    // Add keyboard listeners
    window.addEventListener('keydown', handleKeydown);
  });

  onDestroy(() => {
    window.removeEventListener('keydown', handleKeydown);
  });

  function handleKeydown(e: KeyboardEvent) {
    // Don't handle if typing in an input
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    
    if (showImageViewer) {
      // Image viewer shortcuts
      if (e.key === 'Escape') {
        closeImageViewer();
      } else if (e.key === 'a' || e.key === 'A') {
        if (currentImageSubmission) handleApprove(currentImageSubmission);
      } else if (e.key === 'r' || e.key === 'R') {
        if (currentImageSubmission) handleReject(currentImageSubmission);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        navigateImage(e.key === 'ArrowRight' ? 1 : -1);
      }
      return;
    }

    // List navigation shortcuts
    if (filteredSubmissions.length === 0) return;
    
    switch (e.key) {
      case 'ArrowUp':
      case 'k':
        e.preventDefault();
        focusedIndex = Math.max(0, focusedIndex - 1);
        scrollToFocused();
        break;
      case 'ArrowDown':
      case 'j':
        e.preventDefault();
        focusedIndex = Math.min(filteredSubmissions.length - 1, focusedIndex + 1);
        scrollToFocused();
        break;
      case 'Enter':
      case 'v':
        if (filteredSubmissions[focusedIndex]?.proofImage) {
          viewProofImage(filteredSubmissions[focusedIndex]);
        }
        break;
      case 'a':
        handleApprove(filteredSubmissions[focusedIndex]);
        break;
      case 'r':
        handleReject(filteredSubmissions[focusedIndex]);
        break;
      case ' ':
        e.preventDefault();
        toggleSelection(filteredSubmissions[focusedIndex].id);
        break;
    }
  }

  function scrollToFocused() {
    const card = document.querySelector(`[data-index="${focusedIndex}"]`);
    card?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function navigateImage(direction: number) {
    const currentIndex = filteredSubmissions.findIndex(s => s.id === currentImageSubmission?.id);
    if (currentIndex === -1) return;
    
    let newIndex = currentIndex + direction;
    // Find next/prev submission with an image
    while (newIndex >= 0 && newIndex < filteredSubmissions.length) {
      if (filteredSubmissions[newIndex].proofImage) {
        viewProofImage(filteredSubmissions[newIndex]);
        focusedIndex = newIndex;
        return;
      }
      newIndex += direction;
    }
  }

  function toggleSelection(id: number) {
    if (selectedIds.has(id)) {
      selectedIds.delete(id);
    } else {
      selectedIds.add(id);
    }
    selectedIds = selectedIds; // trigger reactivity
    updateSelectAll();
  }

  function updateSelectAll() {
    selectAll = selectedIds.size === filteredSubmissions.length && filteredSubmissions.length > 0;
  }

  function handleSelectAll() {
    if (selectAll) {
      selectedIds = new Set();
    } else {
      selectedIds = new Set(filteredSubmissions.map(s => s.id));
    }
    selectAll = !selectAll;
  }

  async function bulkApprove() {
    if (selectedIds.size === 0) return;
    
    const result = await Swal.fire({
      title: langValue === 'th' ? 'อนุมัติทั้งหมด?' : 'Approve All?',
      text: langValue === 'th' 
        ? `คุณต้องการอนุมัติ ${selectedIds.size} รายการที่เลือกหรือไม่?`
        : `Do you want to approve ${selectedIds.size} selected submissions?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: t.yesApprove,
      cancelButtonText: t.cancel,
    });

    if (result.isConfirmed) {
      isLoading = true;
      let successCount = 0;
      let failCount = 0;
      
      for (const id of selectedIds) {
        try {
          await approveSubmission(id);
          successCount++;
        } catch (error) {
          failCount++;
        }
      }
      
      selectedIds = new Set();
      await loadSubmissions();
      
      Swal.fire({
        icon: failCount === 0 ? 'success' : 'warning',
        title: t.success,
        text: langValue === 'th' 
          ? `อนุมัติสำเร็จ ${successCount} รายการ${failCount > 0 ? `, ล้มเหลว ${failCount} รายการ` : ''}`
          : `Approved ${successCount} submissions${failCount > 0 ? `, ${failCount} failed` : ''}`,
        timer: 3000,
        showConfirmButton: false,
      });
    }
  }

  async function bulkReject() {
    if (selectedIds.size === 0) return;
    
    const { value: reason } = await Swal.fire({
      title: langValue === 'th' ? 'ปฏิเสธทั้งหมด?' : 'Reject All?',
      html: langValue === 'th' 
        ? `<p>คุณต้องการปฏิเสธ ${selectedIds.size} รายการที่เลือกหรือไม่?</p>`
        : `<p>Do you want to reject ${selectedIds.size} selected submissions?</p>`,
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
    });

    if (reason) {
      isLoading = true;
      let successCount = 0;
      let failCount = 0;
      
      for (const id of selectedIds) {
        try {
          await rejectSubmission(id, reason);
          successCount++;
        } catch (error) {
          failCount++;
        }
      }
      
      selectedIds = new Set();
      await loadSubmissions();
      
      Swal.fire({
        icon: failCount === 0 ? 'success' : 'warning',
        title: t.success,
        text: langValue === 'th' 
          ? `ปฏิเสธสำเร็จ ${successCount} รายการ${failCount > 0 ? `, ล้มเหลว ${failCount} รายการ` : ''}`
          : `Rejected ${successCount} submissions${failCount > 0 ? `, ${failCount} failed` : ''}`,
        timer: 3000,
        showConfirmButton: false,
      });
    }
  }

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
      currentImageUrl = processImageUrl(submission.proofImage);
      currentImageSubmission = submission;
      showImageViewer = true;
    }
  }

  function closeImageViewer() {
    showImageViewer = false;
    currentImageUrl = '';
    currentImageSubmission = null;
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
      <!-- Keyboard Shortcuts Hint -->
      <div class="keyboard-hints">
        <span class="hint"><kbd>↑</kbd><kbd>↓</kbd> {langValue === 'th' ? 'นำทาง' : 'Navigate'}</span>
        <span class="hint"><kbd>A</kbd> {t.approve}</span>
        <span class="hint"><kbd>R</kbd> {t.reject}</span>
        <span class="hint"><kbd>V</kbd> {langValue === 'th' ? 'ดูรูป' : 'View'}</span>
        <span class="hint"><kbd>Space</kbd> {langValue === 'th' ? 'เลือก' : 'Select'}</span>
      </div>

      <!-- Filters & Bulk Actions -->
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

      <!-- Bulk Actions Toolbar -->
      {#if selectedIds.size > 0}
        <div class="bulk-actions-bar">
          <div class="selection-info">
            <input type="checkbox" checked={selectAll} on:change={handleSelectAll} id="select-all" />
            <label for="select-all">
              {selectedIds.size} {langValue === 'th' ? 'รายการที่เลือก' : 'selected'}
            </label>
          </div>
          <div class="bulk-buttons">
            <button class="bulk-btn bulk-approve" on:click={bulkApprove}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              {langValue === 'th' ? 'อนุมัติทั้งหมด' : 'Approve All'}
            </button>
            <button class="bulk-btn bulk-reject" on:click={bulkReject}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              {langValue === 'th' ? 'ปฏิเสธทั้งหมด' : 'Reject All'}
            </button>
          </div>
        </div>
      {/if}

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
          {#each filteredSubmissions as submission, index (submission.id)}
            <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
            <div 
              class="submission-card" 
              class:focused={focusedIndex === index}
              class:selected={selectedIds.has(submission.id)}
              data-index={index}
              on:click={() => focusedIndex = index}
            >
              <!-- Selection Checkbox -->
              <div class="card-select">
                <input 
                  type="checkbox" 
                  checked={selectedIds.has(submission.id)} 
                  on:change={() => toggleSelection(submission.id)}
                  on:click|stopPropagation
                />
              </div>

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

  <!-- Image Viewer Modal -->
  {#if showImageViewer && currentImageSubmission}
    <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
    <div class="image-viewer-overlay" on:click={closeImageViewer}>
      <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
      <div class="image-viewer-content" on:click|stopPropagation>
        <!-- Header -->
        <div class="viewer-header">
          <div class="viewer-user-info">
            <span class="viewer-name">{currentImageSubmission.runnerName}</span>
            <span class="viewer-email">{currentImageSubmission.email}</span>
          </div>
          <button class="viewer-close" on:click={closeImageViewer} aria-label="Close image viewer">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Image -->
        <div class="viewer-image-container">
          <button class="nav-btn nav-prev" on:click={() => navigateImage(-1)} title="Previous (←)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <img src={currentImageUrl} alt="Proof" class="viewer-image" />
          <button class="nav-btn nav-next" on:click={() => navigateImage(1)} title="Next (→)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <!-- Footer with actions -->
        <div class="viewer-footer">
          <div class="viewer-hints">
            <span><kbd>←</kbd><kbd>→</kbd> {langValue === 'th' ? 'เลื่อนรูป' : 'Navigate'}</span>
            <span><kbd>A</kbd> {t.approve}</span>
            <span><kbd>R</kbd> {t.reject}</span>
            <span><kbd>Esc</kbd> {langValue === 'th' ? 'ปิด' : 'Close'}</span>
          </div>
          <div class="viewer-actions">
            <button class="btn-approve" on:click={() => currentImageSubmission && handleApprove(currentImageSubmission)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              {t.approve}
            </button>
            <button class="btn-reject" on:click={() => currentImageSubmission && handleReject(currentImageSubmission)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              {t.reject}
            </button>
          </div>
        </div>
      </div>
    </div>
  {/if}
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

    .keyboard-hints {
      display: none;
    }

    .bulk-actions-bar {
      flex-direction: column;
      gap: 1rem;
    }
  }

  /* Keyboard Hints */
  .keyboard-hints {
    display: flex;
    gap: 1.5rem;
    margin-bottom: 1rem;
    padding: 0.75rem 1rem;
    background: rgba(30, 41, 59, 0.4);
    border-radius: 10px;
    flex-wrap: wrap;
  }

  .hint {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8rem;
    color: #94a3b8;
  }

  kbd {
    display: inline-block;
    padding: 0.2rem 0.4rem;
    background: rgba(100, 116, 139, 0.3);
    border-radius: 4px;
    font-family: monospace;
    font-size: 0.75rem;
    color: #f8fafc;
  }

  /* Bulk Actions Bar */
  .bulk-actions-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    margin-bottom: 1rem;
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.3);
    border-radius: 12px;
  }

  .selection-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #f8fafc;
  }

  .selection-info input[type="checkbox"] {
    width: 18px;
    height: 18px;
    accent-color: #10b981;
  }

  .bulk-buttons {
    display: flex;
    gap: 0.75rem;
  }

  .bulk-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .bulk-btn svg {
    width: 16px;
    height: 16px;
  }

  .bulk-approve {
    background: #10b981;
    color: white;
  }

  .bulk-approve:hover {
    background: #059669;
  }

  .bulk-reject {
    background: #ef4444;
    color: white;
  }

  .bulk-reject:hover {
    background: #dc2626;
  }

  /* Card Selection */
  .card-select {
    position: absolute;
    top: 0.75rem;
    left: 0.75rem;
    z-index: 1;
  }

  .card-select input[type="checkbox"] {
    width: 20px;
    height: 20px;
    accent-color: #10b981;
    cursor: pointer;
  }

  .submission-card {
    position: relative;
  }

  .submission-card.focused {
    border-color: #10b981;
    box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.3);
  }

  .submission-card.selected {
    background: rgba(16, 185, 129, 0.1);
  }

  /* Image Viewer Modal */
  .image-viewer-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }

  .image-viewer-content {
    display: flex;
    flex-direction: column;
    max-width: 95vw;
    max-height: 95vh;
    background: #1e293b;
    border-radius: 16px;
    overflow: hidden;
  }

  .viewer-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    background: rgba(15, 23, 42, 0.8);
    border-bottom: 1px solid rgba(100, 116, 139, 0.2);
  }

  .viewer-user-info {
    display: flex;
    flex-direction: column;
  }

  .viewer-name {
    font-weight: 600;
    color: #f8fafc;
  }

  .viewer-email {
    font-size: 0.85rem;
    color: #94a3b8;
  }

  .viewer-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: rgba(100, 116, 139, 0.2);
    border: none;
    border-radius: 50%;
    color: #f8fafc;
    cursor: pointer;
    transition: all 0.2s;
  }

  .viewer-close:hover {
    background: rgba(239, 68, 68, 0.3);
  }

  .viewer-close svg {
    width: 24px;
    height: 24px;
  }

  .viewer-image-container {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
    min-height: 300px;
    max-height: 60vh;
    overflow: hidden;
    background: #0f172a;
  }

  .viewer-image {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }

  .nav-btn {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    background: rgba(0, 0, 0, 0.5);
    border: none;
    border-radius: 50%;
    color: white;
    cursor: pointer;
    transition: all 0.2s;
    z-index: 1;
  }

  .nav-btn:hover {
    background: rgba(16, 185, 129, 0.5);
  }

  .nav-btn svg {
    width: 24px;
    height: 24px;
  }

  .nav-prev {
    left: 1rem;
  }

  .nav-next {
    right: 1rem;
  }

  .viewer-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    background: rgba(15, 23, 42, 0.8);
    border-top: 1px solid rgba(100, 116, 139, 0.2);
    flex-wrap: wrap;
    gap: 1rem;
  }

  .viewer-hints {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .viewer-hints span {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.8rem;
    color: #94a3b8;
  }

  .viewer-actions {
    display: flex;
    gap: 0.75rem;
  }

  .viewer-actions .btn-approve,
  .viewer-actions .btn-reject {
    padding: 0.75rem 1.5rem;
  }
</style>
