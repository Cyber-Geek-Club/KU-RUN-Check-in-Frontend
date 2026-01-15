<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { ROUTES } from '$lib/utils/routes';
  import Swal from 'sweetalert2';
  import { 
    currentLang, 
    lang, 
    isMobileMenuOpen, 
    tokenTimeLeft,
    formatTime,
    getTokenTimeLeft,
    type Language 
  } from '$lib/stores/organizerStore';

  // Get current language value
  let langValue: Language;
  currentLang.subscribe(v => langValue = v);
  
  // Get current translations
  let t: typeof import('$lib/stores/organizerStore').translations.th;
  lang.subscribe(v => t = v);

  // User dropdown state
  let showUserDropdown = false;
  let userName = '';
  let userEmail = '';

  // Menu items
  $: menuItems = [
    {
      id: 'events',
      href: ROUTES.organizer.events,
      label: t.events,
      svg: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
    },
    {
      id: 'event-log',
      href: ROUTES.organizer.eventLog,
      label: t.activityLogs,
      svg: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    {
      id: 'event-verify',
      href: ROUTES.organizer.eventVerify,
      label: t.verifyCode,
      svg: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    {
      id: 'verify-proof',
      href: ROUTES.organizer.verifyProof,
      label: t.verifyProof,
      svg: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    },
    {
      id: 'unlock-user',
      href: ROUTES.organizer.unlockUser,
      label: t.unlock,
      svg: 'M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z',
    },
    {
      id: 'monthly-reward',
      href: ROUTES.organizer.monthlyReward,
      label: t.rewards,
      svg: 'M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V6a2 2 0 10-2 2h2zm0 0h4l-4 4-4-4h4z',
    },
    {
      id: 'settings',
      href: ROUTES.organizer.settings,
      label: t.settings,
      svg: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
    },
  ];

  // Mobile menu state
  let mobileMenuOpen = false;
  isMobileMenuOpen.subscribe(v => mobileMenuOpen = v);

  // Token timer
  let timeLeft = 0;
  let timerInterval: ReturnType<typeof setInterval>;
  
  tokenTimeLeft.subscribe(v => timeLeft = v);

  // Get current route for active state
  $: currentPath = $page.url.pathname;

  function isActive(href: string): boolean {
    return currentPath.startsWith(href);
  }

  function toggleLanguage() {
    currentLang.toggle();
  }

  function handleLogout() {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_info');
    }
    goto(ROUTES.auth.login);
  }

  function closeMobileMenu() {
    isMobileMenuOpen.set(false);
  }

  onMount(() => {
    // Start token timer
    tokenTimeLeft.set(getTokenTimeLeft());
    timerInterval = setInterval(() => {
      const remaining = getTokenTimeLeft();
      tokenTimeLeft.set(remaining);
      
      // Warning at 2 minutes
      if (remaining === 120) {
        Swal.fire({
          icon: 'warning',
          title: langValue === 'th' ? 'เซสชันใกล้หมดอายุ' : 'Session Expiring Soon',
          text: langValue === 'th' ? 'เซสชันจะหมดอายุใน 2 นาที' : 'Your session will expire in 2 minutes',
          confirmButtonText: langValue === 'th' ? 'ตกลง' : 'OK',
          confirmButtonColor: '#10b981',
        });
      }
      
      if (remaining <= 0) {
        handleLogout();
      }
    }, 1000);

    // Load user info
    if (typeof localStorage !== 'undefined') {
      const userInfo = localStorage.getItem('user_info');
      if (userInfo) {
        try {
          const info = JSON.parse(userInfo);
          userName = info.first_name || info.name || 'User';
          userEmail = info.email || '';
        } catch (e) {
          console.error('Error parsing user info:', e);
        }
      }
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', handleClickOutside);
  });

  onDestroy(() => {
    if (timerInterval) clearInterval(timerInterval);
    document.removeEventListener('click', handleClickOutside);
  });

  function handleClickOutside(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (!target.closest('.user-dropdown-container')) {
      showUserDropdown = false;
    }
  }

  function toggleUserDropdown() {
    showUserDropdown = !showUserDropdown;
  }

  // Get breadcrumb from current path
  $: breadcrumb = getBreadcrumb(currentPath);

  function getBreadcrumb(path: string): { label: string; href: string }[] {
    const crumbs: { label: string; href: string }[] = [{ label: t.organizer, href: ROUTES.organizer.events }];
    
    if (path.includes('/events') && !path.includes('/event-')) {
      crumbs.push({ label: t.events, href: ROUTES.organizer.events });
    } else if (path.includes('/create-event')) {
      crumbs.push({ label: t.events, href: ROUTES.organizer.events });
      crumbs.push({ label: t.createEvent, href: ROUTES.organizer.createEvent });
    } else if (path.includes('/event-log')) {
      crumbs.push({ label: t.activityLogs, href: ROUTES.organizer.eventLog });
    } else if (path.includes('/event-verify')) {
      crumbs.push({ label: t.verifyCode, href: ROUTES.organizer.eventVerify });
    } else if (path.includes('/verify-proof')) {
      crumbs.push({ label: t.verifyProof, href: ROUTES.organizer.verifyProof });
    } else if (path.includes('/unlock-user')) {
      crumbs.push({ label: t.unlock, href: ROUTES.organizer.unlockUser });
    } else if (path.includes('/monthly-reward')) {
      crumbs.push({ label: t.rewards, href: ROUTES.organizer.monthlyReward });
    } else if (path.includes('/settings')) {
      crumbs.push({ label: t.settings, href: ROUTES.organizer.settings });
    }
    
    return crumbs;
  }
</script>

<div class="app-container">
  <header class="header-bar">
    <div class="header-inner">
      <div class="brand">
        <div class="logo-container"></div>
        <span class="brand-name">{t.organizer}</span>
      </div>

      <nav class="nav-menu desktop-only">
        {#each menuItems as item (item.id)}
          <a
            class="menu-btn"
            class:active={isActive(item.href)}
            href={item.href}
          >
            <svg
              class="line-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d={item.svg}
              ></path>
            </svg>
            <span class="btn-label">{item.label}</span>
          </a>
        {/each}
      </nav>

      <div class="user-zone">
        <!-- Language Toggle -->
        <button
          class="lang-toggle-btn"
          on:click={toggleLanguage}
          title={langValue === 'th' ? 'Switch to English' : 'เปลี่ยนเป็นภาษาไทย'}
        >
          <span class="lang-option" class:active={langValue === 'th'}>TH</span>
          <span class="lang-divider">/</span>
          <span class="lang-option" class:active={langValue === 'en'}>EN</span>
        </button>

        <div class="token-timer" class:warning={timeLeft < 60} title={langValue === 'th' ? 'เวลาเซสชันที่เหลือ' : 'Session time remaining'}>
          <svg class="timer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {formatTime(timeLeft)}
        </div>

        <!-- User Dropdown -->
        <div class="user-dropdown-container desktop-only">
          <button class="user-avatar-btn" on:click={toggleUserDropdown}>
            <div class="user-avatar">
              {userName.charAt(0).toUpperCase()}
            </div>
            <svg class="dropdown-arrow" class:open={showUserDropdown} viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {#if showUserDropdown}
            <div class="user-dropdown">
              <div class="dropdown-header">
                <span class="dropdown-name">{userName}</span>
                <span class="dropdown-email">{userEmail}</span>
              </div>
              <div class="dropdown-divider"></div>
              <a href={ROUTES.organizer.settings} class="dropdown-item" on:click={() => showUserDropdown = false}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                </svg>
                {t.settings}
              </a>
              <button class="dropdown-item logout" on:click={handleLogout}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                {t.logout}
              </button>
            </div>
          {/if}
        </div>

        <!-- Mobile menu button -->
        <div class="mobile-controls mobile-only">
          <button
            class="mobile-icon-btn"
            on:click={() => isMobileMenuOpen.set(!mobileMenuOpen)}
            aria-label="Open menu"
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </header>

  {#if mobileMenuOpen}
    <div
      class="mobile-overlay"
      on:click={closeMobileMenu}
      on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') closeMobileMenu(); }}
      role="button"
      tabindex="0"
      aria-label="Close menu overlay"
    ></div>
    <div class="mobile-drawer">
      <div class="drawer-header">
        <span class="brand-name">{t.navigation}</span>
        <button class="close-btn" on:click={closeMobileMenu} aria-label="Close menu">&times;</button>
      </div>
      <div class="drawer-content">
        <!-- Language Toggle in Mobile -->
        <button class="drawer-item lang-drawer-item" on:click={toggleLanguage}>
          <svg class="lang-icon-mobile" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
          </svg>
          <span class="drawer-label">
            <span class="mobile-lang-option" class:active={langValue === 'th'}>TH</span>
            <span class="mobile-lang-divider">/</span>
            <span class="mobile-lang-option" class:active={langValue === 'en'}>EN</span>
          </span>
        </button>
        <div class="drawer-divider"></div>
        {#each menuItems as item (item.id)}
          <a
            class="drawer-item"
            class:active={isActive(item.href)}
            href={item.href}
            on:click={closeMobileMenu}
          >
            <svg class="line-icon fixed-size" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={item.svg}></path>
            </svg>
            <span class="drawer-label">{item.label}</span>
          </a>
        {/each}
        <div class="drawer-divider"></div>
        <button class="drawer-item logout-drawer" on:click={handleLogout}>
          <svg class="line-icon fixed-size" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
          </svg>
          <span class="drawer-label">{t.logout}</span>
        </button>
      </div>
    </div>
  {/if}

  <main class="page-content">
    <!-- Breadcrumb -->
    {#if breadcrumb.length > 1}
      <nav class="breadcrumb" aria-label="Breadcrumb">
        {#each breadcrumb as crumb, i (crumb.href)}
          {#if i > 0}
            <svg class="breadcrumb-separator" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          {/if}
          {#if i === breadcrumb.length - 1}
            <span class="breadcrumb-current">{crumb.label}</span>
          {:else}
            <a href={crumb.href} class="breadcrumb-link">{crumb.label}</a>
          {/if}
        {/each}
      </nav>
    {/if}
    <slot />
  </main>
</div>

<style>
  .app-container {
    min-height: 100vh;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
    color: #f8fafc;
    display: flex;
    flex-direction: column;
  }

  .header-bar {
    position: sticky;
    top: 0;
    z-index: 100;
    background: rgba(15, 23, 42, 0.95);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(100, 116, 139, 0.2);
    padding: 0.75rem 1.5rem;
  }

  .header-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    max-width: 1600px;
    margin: 0 auto;
    gap: 1.5rem;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .logo-container {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .brand-name {
    font-size: 1.125rem;
    font-weight: 700;
    background: linear-gradient(135deg, #10b981, #34d399);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: 0.5px;
  }

  .nav-menu {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .menu-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.875rem;
    background: transparent;
    border: none;
    border-radius: 10px;
    color: #94a3b8;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    text-decoration: none;
    white-space: nowrap;
  }

  .menu-btn:hover {
    background: rgba(100, 116, 139, 0.15);
    color: #e2e8f0;
  }

  .menu-btn.active {
    background: rgba(16, 185, 129, 0.15);
    color: #10b981;
  }

  .line-icon {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
  }

  .btn-label {
    display: none;
  }

  @media (min-width: 1200px) {
    .btn-label {
      display: inline;
    }
  }

  .user-zone {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .lang-toggle-btn {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.375rem 0.75rem;
    background: rgba(100, 116, 139, 0.15);
    border: 1px solid rgba(100, 116, 139, 0.2);
    border-radius: 8px;
    color: #94a3b8;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .lang-toggle-btn:hover {
    background: rgba(100, 116, 139, 0.25);
    border-color: rgba(100, 116, 139, 0.3);
  }

  .lang-option {
    transition: color 0.2s;
  }

  .lang-option.active {
    color: #10b981;
  }

  .lang-divider {
    color: #64748b;
  }

  .token-timer {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.375rem 0.75rem;
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.2);
    border-radius: 8px;
    color: #10b981;
    font-size: 0.875rem;
    font-weight: 600;
    font-family: 'JetBrains Mono', monospace;
  }

  .timer-icon {
    width: 14px;
    height: 14px;
  }

  .token-timer.warning {
    background: rgba(239, 68, 68, 0.1);
    border-color: rgba(239, 68, 68, 0.3);
    color: #ef4444;
    animation: pulse 1s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }

  /* User Dropdown */
  .user-dropdown-container {
    position: relative;
  }

  .user-avatar-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.25rem;
    background: transparent;
    border: none;
    cursor: pointer;
    border-radius: 8px;
    transition: background 0.2s;
  }

  .user-avatar-btn:hover {
    background: rgba(100, 116, 139, 0.15);
  }

  .user-avatar {
    width: 36px;
    height: 36px;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    color: white;
    font-size: 1rem;
  }

  .dropdown-arrow {
    width: 16px;
    height: 16px;
    color: #94a3b8;
    transition: transform 0.2s;
  }

  .dropdown-arrow.open {
    transform: rotate(180deg);
  }

  .user-dropdown {
    position: absolute;
    top: calc(100% + 0.5rem);
    right: 0;
    width: 220px;
    background: rgba(30, 41, 59, 0.98);
    border: 1px solid rgba(100, 116, 139, 0.3);
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    z-index: 200;
    overflow: hidden;
    animation: dropdownFade 0.2s ease;
  }

  @keyframes dropdownFade {
    from { opacity: 0; transform: translateY(-8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .dropdown-header {
    padding: 1rem;
    background: rgba(15, 23, 42, 0.5);
  }

  .dropdown-name {
    display: block;
    font-weight: 600;
    color: #f8fafc;
    font-size: 0.95rem;
  }

  .dropdown-email {
    display: block;
    font-size: 0.8rem;
    color: #94a3b8;
    margin-top: 0.25rem;
  }

  .dropdown-divider {
    height: 1px;
    background: rgba(100, 116, 139, 0.2);
  }

  .dropdown-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    padding: 0.75rem 1rem;
    background: transparent;
    border: none;
    color: #cbd5e1;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s;
    text-decoration: none;
    text-align: left;
  }

  .dropdown-item:hover {
    background: rgba(100, 116, 139, 0.15);
    color: #f8fafc;
  }

  .dropdown-item.logout {
    color: #f87171;
  }

  .dropdown-item.logout:hover {
    background: rgba(239, 68, 68, 0.1);
  }

  .dropdown-item svg {
    width: 18px;
    height: 18px;
  }

  .logout-icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.2);
    border-radius: 10px;
    color: #f87171;
    cursor: pointer;
    transition: all 0.2s;
  }

  .logout-icon-btn:hover {
    background: rgba(239, 68, 68, 0.2);
    border-color: rgba(239, 68, 68, 0.3);
    transform: scale(1.05);
  }

  .mobile-icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: rgba(100, 116, 139, 0.15);
    border: 1px solid rgba(100, 116, 139, 0.2);
    border-radius: 10px;
    color: #94a3b8;
    cursor: pointer;
  }

  .desktop-only {
    display: none;
  }

  .mobile-only {
    display: flex;
  }

  @media (min-width: 768px) {
    .desktop-only {
      display: flex;
    }
    .mobile-only {
      display: none;
    }
  }

  /* Mobile Drawer */
  .mobile-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    z-index: 150;
  }

  .mobile-drawer {
    position: fixed;
    top: 0;
    right: 0;
    width: min(300px, 85vw);
    height: 100vh;
    background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
    border-left: 1px solid rgba(100, 116, 139, 0.2);
    z-index: 200;
    display: flex;
    flex-direction: column;
    animation: slideIn 0.3s ease;
  }

  @keyframes slideIn {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
  }

  .drawer-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.25rem;
    border-bottom: 1px solid rgba(100, 116, 139, 0.2);
  }

  .close-btn {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(100, 116, 139, 0.15);
    border: none;
    border-radius: 8px;
    color: #94a3b8;
    font-size: 1.5rem;
    cursor: pointer;
  }

  .drawer-content {
    flex: 1;
    overflow-y: auto;
    padding: 1rem 0.75rem;
  }

  .drawer-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    padding: 0.875rem 1rem;
    background: transparent;
    border: none;
    border-radius: 10px;
    color: #94a3b8;
    font-size: 0.9375rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    text-decoration: none;
    text-align: left;
  }

  .drawer-item:hover {
    background: rgba(100, 116, 139, 0.15);
    color: #e2e8f0;
  }

  .drawer-item.active {
    background: rgba(16, 185, 129, 0.15);
    color: #10b981;
  }

  .drawer-item.logout-drawer {
    color: #f87171;
  }

  .drawer-item.logout-drawer:hover {
    background: rgba(239, 68, 68, 0.15);
  }

  .drawer-divider {
    height: 1px;
    background: rgba(100, 116, 139, 0.2);
    margin: 0.75rem 0.5rem;
  }

  .fixed-size {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }

  .lang-drawer-item {
    justify-content: flex-start;
  }

  .lang-icon-mobile {
    flex-shrink: 0;
  }

  .mobile-lang-option {
    transition: color 0.2s;
  }

  .mobile-lang-option.active {
    color: #10b981;
  }

  .mobile-lang-divider {
    color: #64748b;
    margin: 0 0.25rem;
  }

  /* Page Content */
  .page-content {
    flex: 1;
    padding: 1.5rem;
    max-width: 1600px;
    margin: 0 auto;
    width: 100%;
  }

  /* Breadcrumb */
  .breadcrumb {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
    padding: 0.75rem 1rem;
    background: rgba(15, 23, 42, 0.4);
    border-radius: 10px;
    font-size: 0.875rem;
  }

  .breadcrumb-link {
    color: #94a3b8;
    text-decoration: none;
    transition: color 0.2s;
  }

  .breadcrumb-link:hover {
    color: #10b981;
  }

  .breadcrumb-separator {
    width: 14px;
    height: 14px;
    color: #64748b;
  }

  .breadcrumb-current {
    color: #f8fafc;
    font-weight: 500;
  }

  @media (min-width: 768px) {
    .page-content {
      padding: 2rem;
    }
  }
</style>
