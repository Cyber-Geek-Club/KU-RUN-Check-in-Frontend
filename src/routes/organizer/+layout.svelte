<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount, onDestroy } from 'svelte';
  import './app.css';
  
  type Language = "th" | "en";
  let currentLang: Language = "th";
  
  if (typeof localStorage !== "undefined") {
    const savedLang = localStorage.getItem("app_language");
    if (savedLang === "th" || savedLang === "en") {
      currentLang = savedLang;
    } else {
      localStorage.setItem("app_language", "th");
    }
  }
  
  function toggleLanguage() {
    currentLang = currentLang === "th" ? "en" : "th";
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("app_language", currentLang);
    }
  }
  
  const translations = {
    th: {
      organizer: "ผู้จัดงาน",
      events: "กิจกรรม",
      createEvent: "สร้างกิจกรรม",
      verifyCode: "ตรวจรหัส",
      verifyProof: "ตรวจสอบหลักฐาน",
      unlock: "ปลดล็อค",
      logs: "ประวัติ",
      rewards: "รางวัล",
      settings: "ตั้งค่า",
      logout: "ออกจากระบบ",
      navigation: "เมนู",
    },
    en: {
      organizer: "Organizer",
      events: "Events",
      createEvent: "Create Event",
      verifyCode: "Verify Code",
      verifyProof: "Verify Proof",
      unlock: "Unlock",
      logs: "Logs",
      rewards: "Rewards",
      settings: "Settings",
      logout: "Logout",
      navigation: "Navigation",
    },
  };
  
  $: lang = translations[currentLang];
  
  $: menuItems = [
    {
      id: "list",
      path: "/organizer/events",
      label: lang.events,
      svg: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01",
    },
    { 
      id: "create", 
      path: "/organizer/create-event",
      label: lang.createEvent, 
      svg: "M12 4v16m8-8H4" 
    },
    {
      id: "verify-code",
      path: "/organizer/verify-code",
      label: lang.verifyCode,
      svg: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    },
    {
      id: "verify-proof",
      path: "/organizer/verify-proof",
      label: lang.verifyProof,
      svg: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    },
    {
      id: "unlock",
      path: "/organizer/unlock",
      label: lang.unlock,
      svg: "M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z",
    },
    {
      id: "log",
      path: "/organizer/logs",
      label: lang.logs,
      svg: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    },
    {
      id: "reward",
      path: "/organizer/rewards",
      label: lang.rewards,
      svg: "M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V6a2 2 0 10-2 2h2zm0 0h4l-4 4-4-4h4z",
    },
    {
      id: "settings",
      path: "/organizer/settings",
      label: lang.settings,
      svg: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
    },
  ];
  
  $: currentPath = $page.url.pathname;
  $: currentView = menuItems.find(item => currentPath.startsWith(item.path))?.id || 'list';
  
  let isMobileMenuOpen = false;
  let timeLeft = 0; 
  let timerInterval: any;
  const currentYear = new Date().getFullYear();
  
  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  function selectView(itemId: string) {
    isMobileMenuOpen = false;
    const item = menuItems.find(m => m.id === itemId);
    if (item) {
      goto(item.path);
    }
  }
  
  async function handleLogout() {
    if (typeof localStorage !== "undefined") {
      const lang = localStorage.getItem("app_language");
      localStorage.clear();
      sessionStorage.clear();
      if (lang) localStorage.setItem("app_language", lang);
    }
    goto('/auth/login');
  }
  
  onMount(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      goto('/auth/login');
      return;
    }
    
    // ✅ ฟังก์ชันคำนวณเวลา
    const updateTimeLeft = () => {
      const expiryStr = localStorage.getItem('token_expiry');
      if (expiryStr) {
        let expiry = parseInt(expiryStr, 10);
        
        if (expiry.toString().length > 11) {
             expiry = Math.floor(expiry / 1000);
        }

        const now = Math.floor(Date.now() / 1000);
        timeLeft = Math.max(0, expiry - now);
      } else {
        timeLeft = 0;
      }
    };

    updateTimeLeft();

    timerInterval = setInterval(() => {
      updateTimeLeft();
      if (timeLeft <= 0) {
        handleLogout();
      }
    }, 1000);
  });
  
  onDestroy(() => {
    if (timerInterval) {
      clearInterval(timerInterval);
    }
  });
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
</svelte:head>

<div class="app-container">
  <header class="header-bar">
    <div class="header-inner">
      <div class="brand">
        <div class="logo-container">
          <img src="/logo-ku.png" alt="Logo" class="brand-logo" />
        </div>
        <span class="brand-name">{lang.organizer}</span>
      </div>

      <nav class="nav-menu desktop-only">
        {#each menuItems as item}
          <button
            class="menu-btn"
            class:active={currentView === item.id}
            on:click={() => selectView(item.id)}
          >
            <svg class="line-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={item.svg}></path>
            </svg>
            <span class="btn-label">{item.label}</span>
          </button>
        {/each}
      </nav>

      <div class="user-zone">
        <button class="lang-toggle-btn" on:click={toggleLanguage}>
          <span class="lang-option" class:active={currentLang === "th"}>TH</span>
          <span class="lang-divider">/</span>
          <span class="lang-option" class:active={currentLang === "en"}>EN</span>
        </button>

        <div class="token-timer" class:warning={timeLeft < 60}>
          {formatTime(timeLeft)}
        </div>

        <button class="logout-icon-btn desktop-only" aria-label={lang.logout} on:click={handleLogout}>
          <svg class="line-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
          </svg>
        </button>

        <div class="mobile-controls mobile-only">
          <button class="mobile-icon-btn" aria-label={lang.navigation} on:click={() => (isMobileMenuOpen = !isMobileMenuOpen)}>
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </header>

  {#if isMobileMenuOpen}
    <div class="mobile-overlay" role="button" tabindex="0" on:click={() => (isMobileMenuOpen = false)} on:keydown={(e: globalThis.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') isMobileMenuOpen = false; }}></div>
    <div class="mobile-drawer">
      <div class="drawer-header">
        <span class="brand-name">{lang.navigation}</span>
        <button class="close-btn" on:click={() => (isMobileMenuOpen = false)}>&times;</button>
      </div>
      <div class="drawer-content">
        <button class="drawer-item lang-drawer-item" on:click={toggleLanguage}>
          <span class="drawer-label">
            <span class="mobile-lang-option" class:active={currentLang === "th"}>TH</span>
            /
            <span class="mobile-lang-option" class:active={currentLang === "en"}>EN</span>
          </span>
        </button>
        <div class="drawer-divider"></div>
        {#each menuItems as item}
          <button class="drawer-item" class:active={currentView === item.id} on:click={() => selectView(item.id)}>
            <svg class="line-icon fixed-size" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={item.svg}></path>
            </svg>
            <span class="drawer-label">{item.label}</span>
          </button>
        {/each}
      </div>
      <div class="drawer-footer">
        <button class="drawer-item logout-special" on:click={handleLogout}>
          <svg class="line-icon fixed-size" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
          </svg>
          <span>{lang.logout}</span>
        </button>
      </div>
    </div>
  {/if}

  <main class="page-content">
    <slot />
  </main>

  <footer class="app-footer">
  
    <p class="copyright">© {currentYear} Cyber Geek. All rights reserved.</p>

    <p class="credits">
      Designed & Developed by <span class="dev-name">Cyber Geek Development</span>
    </p>

    <p class="credits" style="margin-top: 5px;">
      Contact:
      <a href="mailto:cybergeek.dev@proton.me" class="footer-email">
        cybergeek.dev@proton.me
      </a>
    </p>
  </footer>
</div>

<style>
  /* ✅ Hide scrollbars */
  .app-container { scrollbar-width: none !important; -ms-overflow-style: none !important; }
  .page-content { scrollbar-width: none !important; -ms-overflow-style: none !important; }
  .app-container::-webkit-scrollbar, .page-content::-webkit-scrollbar { width: 0 !important; height: 0 !important; display: none !important; background: transparent !important; }

  :global(:root) {
    --bg-deep: #0f172a;
    --bar-dark: #1e293b;
    --text-pure: #f8fafc;
    --text-muted: #94a3b8;
    --emerald-pri: #10b981;
    --teal-sec: #14b8a6;
    --nav-height: 70px;
  }

  :global(body) {
    background-color: var(--bg-deep);
    color: var(--text-pure);
    font-family: "Inter", sans-serif;
    margin: 0;
    padding: 0;
    overflow: hidden;
  }

  /* ✅ Layout */
  .app-container {
    min-height: 100vh;
    height: 100vh;
    display: flex;
    flex-direction: column;
    overflow-y: auto !important;
    position: relative;
  }

  /* Header Styles */
  .header-bar {
    width: 100%;
    height: var(--nav-height);
    background-color: var(--bar-dark);
    position: fixed;
    top: 0;
    left: 0;
    z-index: 1000;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
  }
  .header-inner { height: 100%; display: flex; align-items: center; padding: 0 1.5rem; justify-content: space-between; gap: 1rem; }
  .brand { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
  .logo-container { width: 45px; height: 45px; background: transparent; display: flex; align-items: center; justify-content: center; flex-shrink: 0; padding: 0; }
  .brand-logo { width: 100%; height: 100%; object-fit: contain; }
  .brand-name {
    font-weight: 800;
    font-size: 1.5rem;
    text-transform: uppercase;
    letter-spacing: 1px;
    background: linear-gradient(to right, #6ee7b7, #10b981);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    color: transparent;
    filter: drop-shadow(0 2px 10px rgba(16, 185, 129, 0.4));
    white-space: nowrap;
    cursor: default;
  }
  
  .nav-menu { display: flex; gap: 6px; flex: 1; justify-content: center; align-items: center; }
  .menu-btn { background: transparent; border: 1px solid transparent; padding: 8px 14px; border-radius: 12px; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 0.85rem; transition: all 0.2s; }
  .menu-btn.active { color: var(--emerald-pri); background: #141d2b; border: 1px solid rgba(16, 185, 129, 0.2); box-shadow: inset 4px 4px 8px rgba(0, 0, 0, 0.5); transform: translateY(1px) scale(0.97); }
  .menu-btn:hover:not(.active) { color: var(--text-pure); background: rgba(255, 255, 255, 0.03); }
  
  .line-icon { width: 20px; height: 20px; flex-shrink: 0; stroke-width: 2; }
  .user-zone { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
  
  .lang-toggle-btn { background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(255, 255, 255, 0.08); padding: 6px 12px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 4px; font-size: 0.75rem; font-weight: 600; transition: all 0.2s; }
  .lang-toggle-btn:hover { border-color: var(--emerald-pri); background: rgba(16, 185, 129, 0.1); }
  .lang-option { color: var(--text-muted); transition: color 0.2s; }
  .lang-option.active { color: var(--emerald-pri); }
  .lang-divider { color: rgba(255, 255, 255, 0.2); }
  
  .token-timer { padding: 6px 14px; background: rgba(0, 0, 0, 0.3); border-radius: 10px; border: 1px solid rgba(255, 255, 255, 0.08); color: var(--emerald-pri); font-family: monospace; font-weight: bold; font-size: 0.85rem; }
  .token-timer.warning { color: #ef4444; border-color: rgba(239, 68, 68, 0.3); background: rgba(239, 68, 68, 0.1); animation: pulse 1s infinite; }
  
  .logout-icon-btn { background: none; border: none; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; padding: 8px; border-radius: 50%; transition: all 0.3s ease; }
  .logout-icon-btn:hover { background-color: rgba(239, 68, 68, 0.15); color: #ef4444; transform: scale(1.1); box-shadow: 0 0 10px rgba(239, 68, 68, 0.3); }
  
  .page-content {
    margin-top: var(--nav-height);
    flex: 1 0 auto;
    width: 100%;
    padding-bottom: 2rem;
  }

  /* ✅ New Footer Styles matching requested format */
  .app-footer {
    flex-shrink: 0;
    padding: 1.5rem 1rem;
    margin-top: auto;
    width: 100%;
    text-align: center;
    background: linear-gradient(to top, rgba(15, 23, 42, 1), rgba(30, 41, 59, 0.2));
  }

  /* .footer-divider removed (unused selector) */

  .copyright {
    font-size: 0.85rem;
    color: var(--text-muted);
    margin: 0.25rem 0;
  }

  .credits {
    font-size: 0.8rem;
    color: var(--text-muted);
    margin: 0.25rem 0;
  }

  .dev-name {
    color: var(--emerald-pri);
    font-weight: 600;
  }

  .footer-email {
    color: var(--teal-sec);
    text-decoration: none;
    font-weight: 600;
  }
  .footer-email:hover {
    text-decoration: underline;
  }

  /* Mobile Controls (Original) */
  .desktop-only { display: flex; }
  .mobile-only { display: none; }
  .mobile-controls { display: none; gap: 8px; align-items: center; }
  .mobile-icon-btn { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.05); padding: 8px; border-radius: 10px; color: var(--text-muted); cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: center; }
  
  /* Mobile Drawer */
  .mobile-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.7); z-index: 2000; backdrop-filter: blur(5px); }
  .mobile-drawer { position: fixed; top: 0; right: 0; bottom: 0; width: 75vw; max-width: 280px; background: rgba(30, 41, 59, 0.98); backdrop-filter: blur(10px); z-index: 2001; padding: 1.25rem; box-shadow: -10px 0 30px rgba(0, 0, 0, 0.5); display: flex; flex-direction: column; border-left: 1px solid rgba(255, 255, 255, 0.1); }
  .drawer-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; border-bottom: 1px solid rgba(255, 255, 255, 0.05); padding-bottom: 0.75rem; }
  .close-btn { background: none; border: none; color: var(--text-muted); font-size: 2rem; cursor: pointer; }
  .drawer-content { flex: 1; display: flex; flex-direction: column; gap: 4px; overflow-y: auto; }
  .drawer-item { background: transparent; border: none; color: var(--text-muted); padding: 12px 14px; border-radius: 10px; cursor: pointer; display: flex; align-items: center; gap: 12px; font-size: 0.95rem; width: 100%; text-align: left; }
  .drawer-item.active { background: rgba(16, 185, 129, 0.15); color: var(--emerald-pri); border-left: 3px solid var(--emerald-pri); }
  .drawer-footer { margin-top: auto; padding-top: 1rem; border-top: 1px solid rgba(255, 255, 255, 0.08); }
  .logout-special { color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); justify-content: center; }

  @media (max-width: 900px) {
    .desktop-only { display: none; }
    .mobile-only { display: flex !important; }
    .mobile-controls.mobile-only { display: flex !important; }
    .brand-name { font-size: 1.2rem; }
  }
  @media (max-width: 640px) {
    .header-inner { padding: 0 1rem; }
    .brand-name { font-size: 1rem; }
    .logo-container { width: 40px; height: 40px; }
  }
</style>