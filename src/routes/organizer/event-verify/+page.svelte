<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import Swal from 'sweetalert2';
  
  import OrganizerLayout from '$lib/components/organizer/OrganizerLayout.svelte';
  import { currentLang, lang, decodeJWT, type AppEvent } from '$lib/stores/organizerStore';
  import { fetchEvents, checkInByCode, checkOutByCode } from '$lib/api/organizerApi';
  import { ROUTES } from '$lib/utils/routes';
  
  // Auth
  let isAuthorized = false;
  let isLoading = true;
  
  // Data
  let events: AppEvent[] = [];
  let selectedEventId: number | null = null;
  
  // Check-in state
  let mode: 'checkin' | 'checkout' = 'checkin';
  let pinCode = '';
  let isVerifying = false;
  let autoProcess = false;
  
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

  function handlePinInput(e: Event) {
    const input = e.target as HTMLInputElement;
    // Only allow digits
    pinCode = input.value.replace(/\D/g, '').slice(0, 5);
    
    // Auto-process when 5 digits entered
    if (pinCode.length === 5 && autoProcess) {
      handleVerify();
    }
  }

  async function handleVerify() {
    if (pinCode.length !== 5) {
      Swal.fire({
        icon: 'warning',
        title: t.error,
        text: t.enterFullCode,
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }

    isVerifying = true;
    
    try {
      let result;
      if (mode === 'checkin') {
        result = await checkInByCode(pinCode, selectedEventId || undefined);
      } else {
        result = await checkOutByCode(pinCode, selectedEventId || undefined);
      }
      
      const userName = result?.user_name || result?.userName || t.participant;
      
      await Swal.fire({
        icon: 'success',
        title: mode === 'checkin' ? t.checkInSuccess : t.checkOutSuccess,
        html: `<strong>${userName}</strong> ${mode === 'checkin' ? t.hasBeenCheckedIn : t.hasBeenCheckedOut}`,
        timer: 2000,
        showConfirmButton: false,
      });
      
      // Clear PIN for next entry
      pinCode = '';
      
    } catch (error: any) {
      console.error('Verification error:', error);
      
      Swal.fire({
        icon: 'error',
        title: t.error,
        text: error.response?.data?.message || t.invalidCodeOrFailed,
      });
    } finally {
      isVerifying = false;
    }
  }

  function handleClear() {
    pinCode = '';
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      handleVerify();
    }
  }
</script>

<svelte:head>
  <title>{t.verifyCode} | KU RUN</title>
</svelte:head>

<OrganizerLayout>
  <div class="verify-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-text">
        <h1>{t.verifyCode}</h1>
        <p>{t.verifyCodeDesc}</p>
      </div>
    </div>

    <div class="verify-container">
      <!-- Event Selector -->
      <div class="event-selector">
        <label for="event-select">{t.selectEvent}</label>
        <select id="event-select" bind:value={selectedEventId}>
          <option value={null}>{t.all}</option>
          {#each events as event}
            <option value={event.id}>{event.title}</option>
          {/each}
        </select>
      </div>

      <!-- Mode Toggle -->
      <div class="mode-toggle">
        <button 
          class="mode-btn" 
          class:active={mode === 'checkin'}
          on:click={() => mode = 'checkin'}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
          {t.checkIn}
        </button>
        <button 
          class="mode-btn" 
          class:active={mode === 'checkout'}
          on:click={() => mode = 'checkout'}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {t.checkOut}
        </button>
      </div>

      <!-- PIN Input -->
      <div class="pin-section">
        <label for="pin-input">{t.pinCode}</label>
        <p class="pin-hint">
          {mode === 'checkin' ? t.enterPinCheckIn : t.enterPinCheckOut}
        </p>
        
        <input
          id="pin-input"
          type="text"
          inputmode="numeric"
          maxlength="5"
          bind:value={pinCode}
          on:input={handlePinInput}
          on:keydown={handleKeyDown}
          placeholder="00000"
          class="pin-input"
          disabled={isVerifying}
        />

        <!-- Auto-process Toggle -->
        <label class="auto-toggle">
          <input type="checkbox" bind:checked={autoProcess} />
          <span>{t.autoProcess}</span>
        </label>
      </div>

      <!-- Actions -->
      <div class="actions">
        <button 
          class="btn-verify" 
          on:click={handleVerify}
          disabled={isVerifying || pinCode.length !== 5}
        >
          {#if isVerifying}
            <div class="spinner-small"></div>
            {t.verifying}
          {:else}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {mode === 'checkin' ? t.checkIn : t.checkOut}
          {/if}
        </button>
        
        <button class="btn-clear" on:click={handleClear} disabled={isVerifying}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
          {t.clearBtn}
        </button>
      </div>
    </div>
  </div>
</OrganizerLayout>

<style>
  .verify-page {
    max-width: 600px;
    margin: 0 auto;
  }

  .page-header {
    margin-bottom: 2rem;
    text-align: center;
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

  .verify-container {
    background: rgba(30, 41, 59, 0.6);
    border: 1px solid rgba(100, 116, 139, 0.2);
    border-radius: 24px;
    padding: 2rem;
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

  /* Mode Toggle */
  .mode-toggle {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .mode-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 1rem;
    background: rgba(15, 23, 42, 0.6);
    border: 2px solid rgba(100, 116, 139, 0.3);
    border-radius: 12px;
    color: #94a3b8;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .mode-btn:hover {
    border-color: rgba(100, 116, 139, 0.5);
    color: #e2e8f0;
  }

  .mode-btn.active {
    border-color: #10b981;
    background: rgba(16, 185, 129, 0.1);
    color: #10b981;
  }

  .mode-btn svg {
    width: 20px;
    height: 20px;
  }

  /* PIN Section */
  .pin-section {
    margin-bottom: 2rem;
    text-align: center;
  }

  .pin-section label {
    display: block;
    margin-bottom: 0.5rem;
    color: #f8fafc;
    font-size: 1rem;
    font-weight: 600;
  }

  .pin-hint {
    margin: 0 0 1.5rem;
    color: #94a3b8;
    font-size: 0.9rem;
  }

  .pin-input {
    width: 100%;
    max-width: 200px;
    padding: 1.5rem;
    background: rgba(15, 23, 42, 0.8);
    border: 2px solid rgba(100, 116, 139, 0.3);
    border-radius: 16px;
    color: #f8fafc;
    font-size: 2.5rem;
    font-weight: 700;
    font-family: 'JetBrains Mono', monospace;
    text-align: center;
    letter-spacing: 0.5rem;
    transition: all 0.2s;
  }

  .pin-input:focus {
    outline: none;
    border-color: #10b981;
    box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
  }

  .pin-input::placeholder {
    color: #475569;
  }

  .pin-input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .auto-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin-top: 1rem;
    color: #94a3b8;
    font-size: 0.9rem;
    cursor: pointer;
  }

  .auto-toggle input[type="checkbox"] {
    width: 18px;
    height: 18px;
    accent-color: #10b981;
  }

  /* Actions */
  .actions {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 1rem;
  }

  .btn-verify {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 1rem;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    border: none;
    border-radius: 12px;
    color: white;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }

  .btn-verify:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
  }

  .btn-verify:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .btn-verify svg {
    width: 20px;
    height: 20px;
  }

  .btn-clear {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 1rem;
    background: rgba(100, 116, 139, 0.2);
    border: 1px solid rgba(100, 116, 139, 0.3);
    border-radius: 12px;
    color: #94a3b8;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-clear:hover:not(:disabled) {
    background: rgba(100, 116, 139, 0.3);
    color: #e2e8f0;
  }

  .btn-clear:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-clear svg {
    width: 18px;
    height: 18px;
  }

  .spinner-small {
    width: 18px;
    height: 18px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @media (max-width: 480px) {
    .verify-container {
      padding: 1.5rem;
    }

    .actions {
      grid-template-columns: 1fr;
    }
  }
</style>
