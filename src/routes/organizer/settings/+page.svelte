<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import Swal from 'sweetalert2';
  
  import OrganizerLayout from '$lib/components/organizer/OrganizerLayout.svelte';
  import { currentLang, lang, decodeJWT } from '$lib/stores/organizerStore';
  import { fetchUserProfile, updateUserProfile, processImageUrl } from '$lib/api/organizerApi';
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
    avatar: '',
  };
  
  // Password change
  let showPasswordSection = false;
  let passwordData = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  };
  let isChangingPassword = false;
  
  // Avatar upload
  let avatarFile: File | null = null;
  let avatarPreview = '';
  
  // Preferences
  let preferences = {
    language: 'th',
    emailNotifications: true,
    soundEffects: true,
  };
  
  // Get current language
  let langValue: 'th' | 'en';
  currentLang.subscribe(v => {
    langValue = v;
    preferences.language = v;
  });
  
  let t: typeof import('$lib/stores/organizerStore').translations.th;
  lang.subscribe(v => t = v);

  onMount(async () => {
    checkAuth();
    if (isAuthorized) {
      await loadProfile();
      loadPreferences();
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
        avatar: data.avatar || data.profile_image || '',
      };
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      isLoading = false;
    }
  }

  function loadPreferences() {
    try {
      const stored = localStorage.getItem('user_preferences');
      if (stored) {
        const parsed = JSON.parse(stored);
        preferences = { ...preferences, ...parsed };
      }
    } catch (e) {
      console.error('Error loading preferences:', e);
    }
  }

  function savePreferences() {
    localStorage.setItem('user_preferences', JSON.stringify(preferences));
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

  function handleAvatarChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      avatarFile = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        avatarPreview = e.target?.result as string;
      };
      reader.readAsDataURL(avatarFile);
    }
  }

  async function uploadAvatar() {
    if (!avatarFile || !userId) return;
    
    // TODO: Implement actual upload
    Swal.fire({
      icon: 'info',
      title: langValue === 'th' ? 'กำลังพัฒนา' : 'Coming Soon',
      text: langValue === 'th' ? 'ฟีเจอร์นี้กำลังพัฒนาอยู่' : 'This feature is under development',
    });
  }

  async function handlePasswordChange() {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      Swal.fire({
        icon: 'warning',
        title: t.error,
        text: langValue === 'th' ? 'กรุณากรอกข้อมูลให้ครบ' : 'Please fill in all fields',
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Swal.fire({
        icon: 'error',
        title: t.error,
        text: langValue === 'th' ? 'รหัสผ่านใหม่ไม่ตรงกัน' : 'New passwords do not match',
      });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      Swal.fire({
        icon: 'error',
        title: t.error,
        text: langValue === 'th' ? 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' : 'Password must be at least 8 characters',
      });
      return;
    }

    isChangingPassword = true;
    
    // TODO: Implement actual API call
    setTimeout(() => {
      isChangingPassword = false;
      passwordData = { currentPassword: '', newPassword: '', confirmPassword: '' };
      showPasswordSection = false;
      
      Swal.fire({
        icon: 'success',
        title: t.success,
        text: langValue === 'th' ? 'เปลี่ยนรหัสผ่านสำเร็จ' : 'Password changed successfully',
        timer: 2000,
        showConfirmButton: false,
      });
    }, 1500);
  }

  function handleLanguageChange() {
    currentLang.set(preferences.language as 'th' | 'en');
    savePreferences();
  }

  function togglePreference(key: 'emailNotifications' | 'soundEffects') {
    preferences[key] = !preferences[key];
    savePreferences();
  }

  function getInitials(): string {
    const first = profile.firstName?.charAt(0) || '';
    const last = profile.lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || '?';
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
        <!-- Avatar Section -->
        <div class="section avatar-section">
          <div class="avatar-display">
            {#if avatarPreview || profile.avatar}
              <img src={avatarPreview || processImageUrl(profile.avatar)} alt="Avatar" class="avatar-image" />
            {:else}
              <div class="avatar-placeholder">{getInitials()}</div>
            {/if}
            <div class="avatar-info">
              <h3>{profile.firstName} {profile.lastName}</h3>
              <p>{profile.email}</p>
            </div>
          </div>
          <div class="avatar-actions">
            <input 
              type="file" 
              id="avatar-input" 
              accept="image/*" 
              on:change={handleAvatarChange}
              class="hidden"
            />
            <label for="avatar-input" class="btn-upload">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {langValue === 'th' ? 'เปลี่ยนรูป' : 'Change Photo'}
            </label>
            {#if avatarFile}
              <button class="btn-save-avatar" on:click={uploadAvatar}>
                {langValue === 'th' ? 'บันทึกรูป' : 'Save Photo'}
              </button>
            {/if}
          </div>
        </div>

        <!-- Profile Info Section -->
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

        <!-- Password Section -->
        <div class="section">
          <div class="section-header-row">
            <h2 class="section-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              {langValue === 'th' ? 'เปลี่ยนรหัสผ่าน' : 'Change Password'}
            </h2>
            <button 
              class="btn-toggle" 
              on:click={() => showPasswordSection = !showPasswordSection}
            >
              {showPasswordSection 
                ? (langValue === 'th' ? 'ยกเลิก' : 'Cancel')
                : (langValue === 'th' ? 'เปลี่ยนรหัสผ่าน' : 'Change Password')}
            </button>
          </div>

          {#if showPasswordSection}
            <div class="password-form">
              <div class="form-group">
                <label for="currentPassword">{langValue === 'th' ? 'รหัสผ่านปัจจุบัน' : 'Current Password'}</label>
                <input
                  id="currentPassword"
                  type="password"
                  bind:value={passwordData.currentPassword}
                  placeholder="••••••••"
                />
              </div>
              <div class="form-group">
                <label for="newPassword">{langValue === 'th' ? 'รหัสผ่านใหม่' : 'New Password'}</label>
                <input
                  id="newPassword"
                  type="password"
                  bind:value={passwordData.newPassword}
                  placeholder="••••••••"
                />
                <p class="input-hint">{langValue === 'th' ? 'อย่างน้อย 8 ตัวอักษร' : 'At least 8 characters'}</p>
              </div>
              <div class="form-group">
                <label for="confirmPassword">{langValue === 'th' ? 'ยืนยันรหัสผ่านใหม่' : 'Confirm New Password'}</label>
                <input
                  id="confirmPassword"
                  type="password"
                  bind:value={passwordData.confirmPassword}
                  placeholder="••••••••"
                />
              </div>
              <button 
                class="btn-change-password" 
                on:click={handlePasswordChange}
                disabled={isChangingPassword}
              >
                {#if isChangingPassword}
                  <div class="spinner-small"></div>
                  {langValue === 'th' ? 'กำลังเปลี่ยน...' : 'Changing...'}
                {:else}
                  {langValue === 'th' ? 'เปลี่ยนรหัสผ่าน' : 'Change Password'}
                {/if}
              </button>
            </div>
          {/if}
        </div>

        <!-- Preferences Section -->
        <div class="section">
          <h2 class="section-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {langValue === 'th' ? 'การตั้งค่า' : 'Preferences'}
          </h2>

          <div class="preferences-list">
            <!-- Language -->
            <div class="preference-item">
              <div class="preference-info">
                <span class="preference-label">{langValue === 'th' ? 'ภาษา' : 'Language'}</span>
                <span class="preference-desc">{langValue === 'th' ? 'เลือกภาษาที่ใช้แสดงผล' : 'Choose display language'}</span>
              </div>
              <select 
                bind:value={preferences.language} 
                on:change={handleLanguageChange}
                class="preference-select"
              >
                <option value="th">ไทย</option>
                <option value="en">English</option>
              </select>
            </div>

            <!-- Email Notifications -->
            <div class="preference-item">
              <div class="preference-info">
                <span class="preference-label">{langValue === 'th' ? 'แจ้งเตือนทางอีเมล' : 'Email Notifications'}</span>
                <span class="preference-desc">{langValue === 'th' ? 'รับการแจ้งเตือนกิจกรรมทางอีเมล' : 'Receive event notifications via email'}</span>
              </div>
              <button 
                class="toggle-switch" 
                class:active={preferences.emailNotifications}
                on:click={() => togglePreference('emailNotifications')}
                aria-label="{langValue === 'th' ? 'สลับการแจ้งเตือนอีเมล' : 'Toggle email notifications'}"
              >
                <span class="toggle-thumb"></span>
              </button>
            </div>

            <!-- Sound Effects -->
            <div class="preference-item">
              <div class="preference-info">
                <span class="preference-label">{langValue === 'th' ? 'เสียงเอฟเฟกต์' : 'Sound Effects'}</span>
                <span class="preference-desc">{langValue === 'th' ? 'เปิดเสียงเมื่อทำรายการสำเร็จ' : 'Play sound on successful actions'}</span>
              </div>
              <button 
                class="toggle-switch" 
                class:active={preferences.soundEffects}
                on:click={() => togglePreference('soundEffects')}
                aria-label="{langValue === 'th' ? 'สลับเสียงเอฟเฟกต์' : 'Toggle sound effects'}"
              >
                <span class="toggle-thumb"></span>
              </button>
            </div>
          </div>
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

    .avatar-section {
      flex-direction: column;
      text-align: center;
    }

    .avatar-display {
      flex-direction: column;
      text-align: center;
    }

    .section-header-row {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.75rem;
    }
  }

  /* Avatar Section */
  .avatar-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    background: rgba(15, 23, 42, 0.4);
    border-radius: 16px;
    gap: 1.5rem;
    flex-wrap: wrap;
  }

  .avatar-display {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .avatar-image,
  .avatar-placeholder {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .avatar-image {
    object-fit: cover;
    border: 3px solid #10b981;
  }

  .avatar-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #10b981, #059669);
    font-size: 1.75rem;
    font-weight: 700;
    color: white;
  }

  .avatar-info h3 {
    margin: 0 0 0.25rem;
    font-size: 1.25rem;
    color: #f8fafc;
  }

  .avatar-info p {
    margin: 0;
    font-size: 0.9rem;
    color: #94a3b8;
  }

  .avatar-actions {
    display: flex;
    gap: 0.75rem;
  }

  .hidden {
    display: none;
  }

  .btn-upload {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1rem;
    background: rgba(100, 116, 139, 0.2);
    border: 1px solid rgba(100, 116, 139, 0.3);
    border-radius: 10px;
    color: #f8fafc;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-upload:hover {
    background: rgba(100, 116, 139, 0.3);
  }

  .btn-upload svg {
    width: 18px;
    height: 18px;
  }

  .btn-save-avatar {
    padding: 0.625rem 1rem;
    background: #10b981;
    border: none;
    border-radius: 10px;
    color: white;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-save-avatar:hover {
    background: #059669;
  }

  /* Section Header Row */
  .section-header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .section-header-row .section-title {
    margin-bottom: 0;
  }

  .btn-toggle {
    padding: 0.5rem 1rem;
    background: rgba(100, 116, 139, 0.2);
    border: 1px solid rgba(100, 116, 139, 0.3);
    border-radius: 8px;
    color: #f8fafc;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-toggle:hover {
    background: rgba(100, 116, 139, 0.3);
  }

  /* Password Form */
  .password-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(100, 116, 139, 0.2);
  }

  .btn-change-password {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: linear-gradient(135deg, #f97316, #ea580c);
    border: none;
    border-radius: 10px;
    color: white;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    align-self: flex-start;
  }

  .btn-change-password:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
  }

  .btn-change-password:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* Preferences */
  .preferences-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .preference-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: rgba(15, 23, 42, 0.4);
    border-radius: 12px;
    gap: 1rem;
  }

  .preference-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .preference-label {
    font-weight: 500;
    color: #f8fafc;
  }

  .preference-desc {
    font-size: 0.8rem;
    color: #94a3b8;
  }

  .preference-select {
    padding: 0.5rem 0.75rem;
    background: rgba(100, 116, 139, 0.2);
    border: 1px solid rgba(100, 116, 139, 0.3);
    border-radius: 8px;
    color: #f8fafc;
    font-size: 0.9rem;
  }

  .toggle-switch {
    position: relative;
    width: 52px;
    height: 28px;
    background: rgba(100, 116, 139, 0.3);
    border: none;
    border-radius: 20px;
    cursor: pointer;
    transition: all 0.3s;
    flex-shrink: 0;
  }

  .toggle-switch.active {
    background: #10b981;
  }

  .toggle-thumb {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 22px;
    height: 22px;
    background: white;
    border-radius: 50%;
    transition: all 0.3s;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  .toggle-switch.active .toggle-thumb {
    left: 27px;
  }
</style>
