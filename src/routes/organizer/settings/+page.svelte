<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import Swal from 'sweetalert2';
  
  import OrganizerLayout from '$lib/components/organizer/OrganizerLayout.svelte';
  import { currentLang, lang, decodeJWT } from '$lib/stores/organizerStore';
  import { fetchUserProfile, updateUserProfile } from '$lib/api/organizerApi';
  import { ROUTES } from '$lib/utils/routes';
  
  // Auth
  let isAuthorized = false;
  let isLoading = true;
  let isSaving = false;
  let userId: string = '';
  
  // Profile data
  let profile = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
  };
  
  // Get current language
  let langValue: 'th' | 'en';
  currentLang.subscribe(v => langValue = v);
  
  let t: typeof import('$lib/stores/organizerStore').translations.th;
  lang.subscribe(v => t = v);

  onMount(async () => {
    checkAuth();
    if (isAuthorized) {
      await loadProfile();
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

    // Get user ID
    const userInfo = localStorage.getItem('user_info');
    if (userInfo) {
      try {
        const info = JSON.parse(userInfo);
        userId = info.id || info.user_id;
      } catch (e) {
        console.error('Error parsing user info:', e);
      }
    }

    isAuthorized = true;
  }

  async function loadProfile() {
    if (!userId) {
      isLoading = false;
      return;
    }
    
    try {
      const data = await fetchUserProfile(userId);
      profile = {
        firstName: data.first_name || data.firstName || '',
        lastName: data.last_name || data.lastName || '',
        email: data.email || '',
        phone: data.phone || '',
        department: data.department || '',
      };
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      isLoading = false;
    }
  }

  async function handleSave() {
    if (!userId) return;
    
    isSaving = true;
    
    try {
      await updateUserProfile(userId, {
        first_name: profile.firstName,
        last_name: profile.lastName,
        phone: profile.phone,
        department: profile.department,
      });
      
      Swal.fire({
        icon: 'success',
        title: t.success,
        text: t.settingsUpdated,
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error: any) {
      console.error('Error saving profile:', error);
      
      Swal.fire({
        icon: 'error',
        title: t.error,
        text: error.response?.data?.message || t.somethingWentWrong,
      });
    } finally {
      isSaving = false;
    }
  }
</script>

<svelte:head>
  <title>{t.settings} | KU RUN</title>
</svelte:head>

<OrganizerLayout>
  <div class="settings-page">
    <!-- Header -->
    <div class="page-header">
      <h1>{t.settings}</h1>
      <p>{t.settingsDesc}</p>
    </div>

    {#if isLoading}
      <div class="loading-state">
        <div class="spinner"></div>
        <p>{t.loading}</p>
      </div>
    {:else}
      <div class="settings-container">
        <div class="section">
          <h2 class="section-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {t.profileInfo}
          </h2>

          <form on:submit|preventDefault={handleSave} class="form">
            <div class="form-row">
              <div class="form-group">
                <label for="firstName">{t.firstName}</label>
                <input
                  id="firstName"
                  type="text"
                  bind:value={profile.firstName}
                  placeholder={t.enterFirstName}
                />
              </div>
              <div class="form-group">
                <label for="lastName">{t.lastName}</label>
                <input
                  id="lastName"
                  type="text"
                  bind:value={profile.lastName}
                  placeholder={t.enterLastName}
                />
              </div>
            </div>

            <div class="form-group">
              <label for="email">{t.email}</label>
              <input
                id="email"
                type="email"
                bind:value={profile.email}
                disabled
                class="disabled"
              />
              <p class="input-hint">{langValue === 'th' ? 'อีเมลไม่สามารถเปลี่ยนแปลงได้' : 'Email cannot be changed'}</p>
            </div>

            <div class="form-group">
              <label for="phone">{langValue === 'th' ? 'เบอร์โทรศัพท์' : 'Phone Number'}</label>
              <input
                id="phone"
                type="tel"
                bind:value={profile.phone}
                placeholder={langValue === 'th' ? 'กรอกเบอร์โทรศัพท์' : 'Enter phone number'}
              />
            </div>

            <div class="form-group">
              <label for="department">{t.department}</label>
              <input
                id="department"
                type="text"
                bind:value={profile.department}
                placeholder={t.selectDepartment}
              />
            </div>

            <div class="form-actions">
              <button type="submit" class="btn-save" disabled={isSaving}>
                {#if isSaving}
                  <div class="spinner-small"></div>
                  {t.saving}
                {:else}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  {t.saveChanges}
                {/if}
              </button>
            </div>
          </form>
        </div>
      </div>
    {/if}
  </div>
</OrganizerLayout>

<style>
  .settings-page {
    max-width: 700px;
    margin: 0 auto;
  }

  .page-header {
    margin-bottom: 2rem;
  }

  .page-header h1 {
    margin: 0 0 0.25rem;
    font-size: 1.75rem;
    font-weight: 700;
    color: #f8fafc;
  }

  .page-header p {
    margin: 0;
    color: #94a3b8;
    font-size: 0.95rem;
  }

  .loading-state {
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

  .loading-state p {
    color: #94a3b8;
  }

  .settings-container {
    background: rgba(30, 41, 59, 0.6);
    border: 1px solid rgba(100, 116, 139, 0.2);
    border-radius: 24px;
    padding: 2rem;
  }

  .section {
    margin-bottom: 2rem;
  }

  .section:last-child {
    margin-bottom: 0;
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin: 0 0 1.5rem;
    font-size: 1.125rem;
    font-weight: 600;
    color: #f8fafc;
  }

  .section-title svg {
    width: 24px;
    height: 24px;
    color: #10b981;
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-group label {
    font-size: 0.9rem;
    font-weight: 500;
    color: #cbd5e1;
  }

  .form-group input {
    padding: 0.75rem 1rem;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(100, 116, 139, 0.3);
    border-radius: 12px;
    color: #f8fafc;
    font-size: 0.95rem;
    transition: all 0.2s;
  }

  .form-group input:focus {
    outline: none;
    border-color: #10b981;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
  }

  .form-group input.disabled {
    background: rgba(100, 116, 139, 0.1);
    color: #94a3b8;
    cursor: not-allowed;
  }

  .input-hint {
    margin: 0;
    font-size: 0.8rem;
    color: #64748b;
  }

  .form-actions {
    margin-top: 1rem;
    padding-top: 1.5rem;
    border-top: 1px solid rgba(100, 116, 139, 0.2);
  }

  .btn-save {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.875rem 2rem;
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

  .btn-save:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
  }

  .btn-save:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .btn-save svg {
    width: 20px;
    height: 20px;
  }

  .spinner-small {
    width: 18px;
    height: 18px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @media (max-width: 640px) {
    .settings-container {
      padding: 1.5rem;
    }

    .form-row {
      grid-template-columns: 1fr;
    }
  }
</style>
