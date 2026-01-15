<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import Swal from 'sweetalert2';
  
  import OrganizerLayout from '$lib/components/organizer/OrganizerLayout.svelte';
  import { currentLang, lang, decodeJWT } from '$lib/stores/organizerStore';
  import { findUserByEmail, unlockUser, processImageUrl } from '$lib/api/organizerApi';
  import { ROUTES } from '$lib/utils/routes';
  
  // Auth
  let isAuthorized = false;
  let isLoading = false;
  let isSearching = false;
  let organizerId: number | null = null;
  
  // Form
  let email = '';
  
  // User preview
  let foundUser: {
    id: number;
    email: string;
    first_name?: string;
    last_name?: string;
    avatar?: string;
    department?: string;
    nisit_id?: string;
  } | null = null;
  
  // Recent unlocks history (stored in localStorage)
  interface UnlockRecord {
    email: string;
    name: string;
    timestamp: string;
  }
  let recentUnlocks: UnlockRecord[] = [];
  
  // Debounce timer
  let searchTimer: ReturnType<typeof setTimeout>;
  
  // Get current language
  let langValue: 'th' | 'en';
  currentLang.subscribe(v => langValue = v);
  
  let t: typeof import('$lib/stores/organizerStore').translations.th;
  lang.subscribe(v => t = v);

  onMount(() => {
    checkAuth();
    loadRecentUnlocks();
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

    // Get organizer ID from token or user info
    const userInfo = localStorage.getItem('user_info');
    if (userInfo) {
      try {
        const info = JSON.parse(userInfo);
        organizerId = info.id || info.user_id;
      } catch (e) {
        console.error('Error parsing user info:', e);
      }
    }

    isAuthorized = true;
  }

  function loadRecentUnlocks() {
    try {
      const stored = localStorage.getItem('recent_unlocks');
      if (stored) {
        recentUnlocks = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error loading recent unlocks:', e);
    }
  }

  function saveUnlockRecord(user: typeof foundUser) {
    if (!user) return;
    
    const record: UnlockRecord = {
      email: user.email,
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
      timestamp: new Date().toISOString(),
    };
    
    // Add to front, remove duplicates, keep only last 10
    recentUnlocks = [
      record,
      ...recentUnlocks.filter(r => r.email !== record.email)
    ].slice(0, 10);
    
    localStorage.setItem('recent_unlocks', JSON.stringify(recentUnlocks));
  }

  function formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleString(langValue === 'th' ? 'th-TH' : 'en-US', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Debounced search as user types
  function handleEmailInput() {
    foundUser = null;
    clearTimeout(searchTimer);
    
    if (!email.trim() || !isValidEmail(email)) {
      return;
    }
    
    searchTimer = setTimeout(async () => {
      await searchUser();
    }, 500);
  }

  async function searchUser() {
    if (!email.trim() || !isValidEmail(email)) return;
    
    isSearching = true;
    try {
      const user = await findUserByEmail(email);
      foundUser = user || null;
    } catch (error) {
      foundUser = null;
    } finally {
      isSearching = false;
    }
  }

  function quickFillEmail(emailToFill: string) {
    email = emailToFill;
    handleEmailInput();
  }

  async function handleUnlock() {
    if (!email.trim()) {
      Swal.fire({
        icon: 'warning',
        title: t.error,
        text: t.enterValidEmail,
      });
      return;
    }

    if (!isValidEmail(email)) {
      Swal.fire({
        icon: 'warning',
        title: t.error,
        text: t.enterValidEmail,
      });
      return;
    }

    if (!organizerId) {
      Swal.fire({
        icon: 'error',
        title: t.error,
        text: t.organizerInfoMissing,
      });
      return;
    }

    isLoading = true;

    try {
      // First, find the user by email if not already found
      let user = foundUser;
      if (!user) {
        user = await findUserByEmail(email);
      }
      
      if (!user) {
        Swal.fire({
          icon: 'error',
          title: t.error,
          text: t.userNotFound,
        });
        return;
      }

      // Confirm before unlocking
      const result = await Swal.fire({
        title: t.confirm,
        html: `${t.confirmUnlockFor}<br><strong>${user.first_name || ''} ${user.last_name || ''}</strong><br><span style="color: #94a3b8">${user.email}</span>`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#10b981',
        cancelButtonColor: '#6b7280',
        confirmButtonText: t.yesUnlock,
        cancelButtonText: t.cancel,
      });

      if (result.isConfirmed) {
        await unlockUser(String(user.id), organizerId!);
        
        // Save to recent unlocks
        saveUnlockRecord(user);
        
        await Swal.fire({
          icon: 'success',
          title: t.unlocked,
          text: t.userUnlockedSuccess,
          timer: 2000,
          showConfirmButton: false,
        });
        
        // Clear form
        email = '';
        foundUser = null;
      }
    } catch (error: any) {
      console.error('Error unlocking user:', error);
      
      Swal.fire({
        icon: 'error',
        title: t.error,
        text: error.response?.data?.message || t.somethingWentWrong,
      });
    } finally {
      isLoading = false;
    }
  }

  function getInitials(name: string): string {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  }
</script>

<svelte:head>
  <title>{t.unlock} | KU RUN</title>
</svelte:head>

<OrganizerLayout>
  <div class="unlock-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
        </svg>
      </div>
      <h1>{t.unlockUser}</h1>
      <p>{t.unlockUserDesc}</p>
    </div>

    <div class="unlock-container">
      <div class="form-group">
        <label for="email-input">{t.userEmailAddress}</label>
        <div class="input-wrapper">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <input
            id="email-input"
            type="email"
            bind:value={email}
            placeholder={t.enterEmailPlaceholder}
            disabled={isLoading}
            on:input={handleEmailInput}
            on:keydown={(e) => { if (e.key === 'Enter') handleUnlock(); }}
          />
          {#if isSearching}
            <div class="input-spinner"></div>
          {/if}
        </div>
      </div>

      <!-- User Preview Card -->
      {#if foundUser}
        <div class="user-preview">
          <div class="preview-avatar">
            {#if foundUser.avatar}
              <img src={processImageUrl(foundUser.avatar)} alt="Avatar" />
            {:else}
              <span>{getInitials(`${foundUser.first_name || ''} ${foundUser.last_name || ''}`.trim() || foundUser.email)}</span>
            {/if}
          </div>
          <div class="preview-info">
            <h4>{foundUser.first_name || ''} {foundUser.last_name || ''}</h4>
            <p class="preview-email">{foundUser.email}</p>
            {#if foundUser.nisit_id}
              <p class="preview-nisit">{langValue === 'th' ? 'รหัสนิสิต' : 'Student ID'}: {foundUser.nisit_id}</p>
            {/if}
            {#if foundUser.department}
              <p class="preview-dept">{foundUser.department}</p>
            {/if}
          </div>
          <div class="preview-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            {langValue === 'th' ? 'พบผู้ใช้' : 'User Found'}
          </div>
        </div>
      {:else if email && isValidEmail(email) && !isSearching}
        <div class="user-not-found">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{t.userNotFound}</span>
        </div>
      {/if}

      <button 
        class="btn-unlock" 
        on:click={handleUnlock}
        disabled={isLoading || !email.trim() || !foundUser}
      >
        {#if isLoading}
          <div class="spinner"></div>
          {t.loading}
        {:else}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
          </svg>
          {t.unlock}
        {/if}
      </button>
    </div>

    <!-- Recent Unlocks Section -->
    {#if recentUnlocks.length > 0}
      <div class="recent-section">
        <h3 class="recent-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {langValue === 'th' ? 'ปลดล็อกล่าสุด' : 'Recent Unlocks'}
        </h3>
        <div class="recent-list">
          {#each recentUnlocks as record (record.email + record.timestamp)}
            <button class="recent-item" on:click={() => quickFillEmail(record.email)}>
              <div class="recent-avatar">
                <span>{getInitials(record.name)}</span>
              </div>
              <div class="recent-info">
                <span class="recent-name">{record.name}</span>
                <span class="recent-email">{record.email}</span>
              </div>
              <span class="recent-time">{formatTimestamp(record.timestamp)}</span>
            </button>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</OrganizerLayout>

<style>
  .unlock-page {
    max-width: 500px;
    margin: 0 auto;
    padding: 2rem 0;
  }

  .page-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .header-icon {
    width: 80px;
    height: 80px;
    margin: 0 auto 1.5rem;
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%);
    border: 2px solid rgba(16, 185, 129, 0.3);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .header-icon svg {
    width: 40px;
    height: 40px;
    color: #10b981;
  }

  .page-header h1 {
    margin: 0 0 0.5rem;
    font-size: 1.75rem;
    font-weight: 700;
    color: #f8fafc;
  }

  .page-header p {
    margin: 0;
    color: #94a3b8;
    font-size: 0.95rem;
  }

  .unlock-container {
    background: rgba(30, 41, 59, 0.6);
    border: 1px solid rgba(100, 116, 139, 0.2);
    border-radius: 24px;
    padding: 2rem;
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.75rem;
    color: #cbd5e1;
    font-size: 0.9rem;
    font-weight: 500;
  }

  .input-wrapper {
    position: relative;
  }

  .input-wrapper svg {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    width: 20px;
    height: 20px;
    color: #64748b;
  }

  .input-wrapper input {
    width: 100%;
    padding: 1rem 1rem 1rem 3rem;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(100, 116, 139, 0.3);
    border-radius: 12px;
    color: #f8fafc;
    font-size: 1rem;
    transition: all 0.2s;
  }

  .input-wrapper input:focus {
    outline: none;
    border-color: #10b981;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
  }

  .input-wrapper input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-unlock {
    width: 100%;
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

  .btn-unlock:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
  }

  .btn-unlock:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .btn-unlock svg {
    width: 20px;
    height: 20px;
  }

  .spinner {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Input spinner */
  .input-spinner {
    position: absolute;
    right: 1rem;
    top: 50%;
    transform: translateY(-50%);
    width: 20px;
    height: 20px;
    border: 2px solid rgba(16, 185, 129, 0.2);
    border-top-color: #10b981;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  /* User Preview Card */
  .user-preview {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    margin-bottom: 1.5rem;
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.3);
    border-radius: 16px;
  }

  .preview-avatar {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: linear-gradient(135deg, #10b981, #059669);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    overflow: hidden;
  }

  .preview-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .preview-avatar span {
    font-size: 1.25rem;
    font-weight: 700;
    color: white;
  }

  .preview-info {
    flex: 1;
    min-width: 0;
  }

  .preview-info h4 {
    margin: 0 0 0.25rem;
    font-size: 1rem;
    font-weight: 600;
    color: #f8fafc;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .preview-email,
  .preview-nisit,
  .preview-dept {
    margin: 0;
    font-size: 0.8rem;
    color: #94a3b8;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .preview-badge {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.375rem 0.75rem;
    background: rgba(16, 185, 129, 0.2);
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    color: #10b981;
    white-space: nowrap;
  }

  .preview-badge svg {
    width: 14px;
    height: 14px;
  }

  /* User Not Found */
  .user-not-found {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 1rem;
    margin-bottom: 1.5rem;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 12px;
    color: #f87171;
    font-size: 0.9rem;
  }

  .user-not-found svg {
    width: 20px;
    height: 20px;
  }

  /* Recent Unlocks Section */
  .recent-section {
    margin-top: 2rem;
  }

  .recent-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0 0 1rem;
    font-size: 1rem;
    font-weight: 600;
    color: #f8fafc;
  }

  .recent-title svg {
    width: 20px;
    height: 20px;
    color: #10b981;
  }

  .recent-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .recent-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: rgba(30, 41, 59, 0.6);
    border: 1px solid rgba(100, 116, 139, 0.2);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
    width: 100%;
  }

  .recent-item:hover {
    background: rgba(30, 41, 59, 0.8);
    border-color: rgba(16, 185, 129, 0.3);
  }

  .recent-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: rgba(100, 116, 139, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .recent-avatar span {
    font-size: 0.85rem;
    font-weight: 600;
    color: #f8fafc;
  }

  .recent-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .recent-name {
    font-size: 0.9rem;
    font-weight: 500;
    color: #f8fafc;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .recent-email {
    font-size: 0.75rem;
    color: #94a3b8;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .recent-time {
    font-size: 0.75rem;
    color: #64748b;
    white-space: nowrap;
  }

  @media (max-width: 480px) {
    .user-preview {
      flex-direction: column;
      text-align: center;
    }

    .preview-info {
      text-align: center;
    }

    .recent-time {
      display: none;
    }
  }
</style>
