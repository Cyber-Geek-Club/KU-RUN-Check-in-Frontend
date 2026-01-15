<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import Swal from 'sweetalert2';
  
  import OrganizerLayout from '$lib/components/organizer/OrganizerLayout.svelte';
  import { currentLang, lang, decodeJWT } from '$lib/stores/organizerStore';
  import { findUserByEmail, unlockUser } from '$lib/api/organizerApi';
  import { ROUTES } from '$lib/utils/routes';
  
  // Auth
  let isAuthorized = false;
  let isLoading = false;
  let organizerId: number | null = null;
  
  // Form
  let email = '';
  
  // Get current language
  let langValue: 'th' | 'en';
  currentLang.subscribe(v => langValue = v);
  
  let t: typeof import('$lib/stores/organizerStore').translations.th;
  lang.subscribe(v => t = v);

  onMount(() => {
    checkAuth();
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

  function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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
      // First, find the user by email
      const user = await findUserByEmail(email);
      
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
        html: `${t.confirmUnlockFor}<br><strong>${user.email}</strong>`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#10b981',
        cancelButtonColor: '#6b7280',
        confirmButtonText: t.yesUnlock,
        cancelButtonText: t.cancel,
      });

      if (result.isConfirmed) {
        await unlockUser(user.id, organizerId);
        
        await Swal.fire({
          icon: 'success',
          title: t.unlocked,
          text: t.userUnlockedSuccess,
          timer: 2000,
          showConfirmButton: false,
        });
        
        // Clear form
        email = '';
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
            on:keydown={(e) => { if (e.key === 'Enter') handleUnlock(); }}
          />
        </div>
      </div>

      <button 
        class="btn-unlock" 
        on:click={handleUnlock}
        disabled={isLoading || !email.trim()}
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
</style>
