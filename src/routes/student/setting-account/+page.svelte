<script lang="ts">
  import { fade, slide } from "svelte/transition";
  import { goto } from "$app/navigation";
  import { onMount, onDestroy } from "svelte";
  import { page } from "$app/stores"; 
  import { ROUTES } from "$lib/utils/routes";

  // --- CONFIG ---
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
  
  // --- TRANSLATION LOGIC ---
  // ใช้ตัวแปรชื่อ lang ตามต้นฉบับ
  let lang: 'th' | 'en' = 'th'; 

  const translations: Record<string, any> = {
    th: {
      pageTitle: "ตั้งค่าบัญชี",
      pageSubtitle: "อัปเดตข้อมูลส่วนตัวของคุณ",
      label_title: "คำนำหน้า",
      label_firstname: "ชื่อจริง",
      label_lastname: "นามสกุล",
      label_email: "อีเมล",
      label_nisitId: "รหัสนิสิต",
      label_faculty: "คณะ",
      label_major: "สาขา",
      label_dept: "หน่วยงาน",
      label_password: "รหัสผ่าน",
      btn_change: "เปลี่ยน",
      btn_save: "บันทึกการเปลี่ยนแปลง",
      btn_saving: "กำลังบันทึก...",
      select_default: "เลือก",
      select_faculty: "เลือกคณะ",
      select_major: "เลือกสาขา",
      select_dept: "เลือกหน่วยงาน",
      msg_success: "อัปเดตข้อมูลสำเร็จ!",
      msg_expired: "หมดเวลาการใช้งาน กรุณาเข้าสู่ระบบใหม่"
    },
    en: {
      pageTitle: "Account Settings",
      pageSubtitle: "Update your profile information.",
      label_title: "Title",
      label_firstname: "First Name",
      label_lastname: "Last Name",
      label_email: "Email",
      label_nisitId: "Nisit ID",
      label_faculty: "Faculty",
      label_major: "Major",
      label_dept: "Department",
      label_password: "Password",
      btn_change: "CHANGE",
      btn_save: "SAVE CHANGES",
      btn_saving: "SAVING...",
      select_default: "Select",
      select_faculty: "Select Faculty",
      select_major: "Select Major",
      select_dept: "Select Department",
      msg_success: "Profile updated successfully!",
      msg_expired: "Session expired. Please login again."
    }
  };

  // Reactive translation object
  $: t = translations[lang];

  // ฟังก์ชันเปลี่ยนภาษา (ใช้ key 'app_lang' ตามไฟล์ตัวอย่าง)
  function setLang(l: 'th' | 'en') {
    lang = l;
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem('app_lang', l);
    }
  }

  // --- NAVBAR STATE ---
  let isMobileMenuOpen = false;
  let currentView = "account-setting";
  let timeLeftStr = "00:00:00"; 
  let timeLeft = 0;
  let timerInterval: any = null;

  // เมนู
  const menuItems = [
    { id: "event-list", label: "Event list", path: ROUTES.student.eventList, svg: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" },
    { id: "my-event", label: "My event", path: ROUTES.student.myEvents, svg: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
    { id: "account-setting", label: "Account setting", path: ROUTES.student.settings, svg: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
  ];

  function handleLogout() {
    if (timerInterval) clearInterval(timerInterval);
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_info");
    goto(ROUTES.auth.login, { replaceState: true });
  }

  function handleTokenExpired() {
    if (timerInterval) clearInterval(timerInterval);
    alert(t.msg_expired);
    handleLogout();
  }

  // Parse JWT
  function parseJwt(token: string) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
  }

  function startSessionTimer() {
    if (timerInterval) clearInterval(timerInterval);
    const token = localStorage.getItem("access_token") || "";
    if (!token) { 
        handleLogout();
        return; 
    }

    try {
        const decoded = parseJwt(token);
        if (decoded && decoded.exp) {
            const expTime = decoded.exp * 1000;
            
            timerInterval = setInterval(() => {
                const now = Date.now();
                const diff = expTime - now;
                
                if (diff <= 0) {
                    timeLeftStr = "00:00:00";
                    handleTokenExpired();
                } else {
                    const totalSeconds = Math.floor(diff / 1000);
                    const h = Math.floor(totalSeconds / 3600);
                    const m = Math.floor((totalSeconds % 3600) / 60);
                    const s = totalSeconds % 60;
                    timeLeftStr = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
                }
            }, 1000);
        } else {
            handleLogout();
        }
    } catch (e) {
        console.error(e);
        handleLogout();
    }
  }

  function selectView(id: string, path: string) {
    currentView = id;
    isMobileMenuOpen = false;
    goto(path);
  }

  // --- DATA LOGIC ---
  let userId = "";
  let token = "";
  let role = "";
  let title = "", firstName = "", lastName = "", email = "";
  let nisitId = "", faculty = "", major = "", department = "";
  
  let isTitleOpen = false, isFacultyOpen = false, isMajorOpen = false, isDeptOpen = false;
  let isLoading = true;
  let isSaving = false;
  let isFormDirty = false;
  let originalData: any = {};
  let message = "", messageType = "error";

  const titleList = ["Mr.", "Ms.", "Mrs.", "Dr.", "Prof."];
  
  // --- 1. ปรับข้อมูล Department ---
  const organizerDepartments = [
    { id: "Academic Affairs", name: { th: "กองบริการการศึกษา (Academic Affairs)", en: "Academic Affairs" } },
    { id: "Student Affairs", name: { th: "กองกิจการนิสิต (Student Affairs)", en: "Student Affairs" } },
    { id: "Registrar Office", name: { th: "สำนักทะเบียน (Registrar Office)", en: "Registrar Office" } },
    { id: "Finance Department", name: { th: "กองคลัง (Finance Department)", en: "Finance Department" } },
    { id: "IT Support Center", name: { th: "ศูนย์บริการ IT (IT Support)", en: "IT Support Center" } },
    { id: "Human Resources", name: { th: "ทรัพยากรบุคคล (HR)", en: "Human Resources" } },
  ];

  // --- 2. ปรับข้อมูล Faculty ---
  const facultyList = [
    { id: "management", name: { th: "คณะวิทยาการจัดการ", en: "Management Sciences" } },
    { id: "engineering", name: { th: "คณะวิศวกรรมศาสตร์ศรีราชา", en: "Engineering at Sriracha" } },
    { id: "science", name: { th: "คณะวิทยาศาสตร์ ศรีราชา", en: "Science at Sriracha" } },
    { id: "economics", name: { th: "คณะเศรษฐศาสตร์ ศรีราชา", en: "Economics at Sriracha" } },
    { id: "maritime", name: { th: "พาณิชยนาวีนานาชาติ", en: "International Maritime Studies" } },
  ];

  // --- 3. ปรับข้อมูล Major ---
  // ต้องแก้ Type ก่อนให้รองรับ 2 ภาษา
  type Major = { id: string; name: { th: string; en: string } };
  
  const majorData: Record<string, Major[]> = {
    management: [
      { id: "mgt", name: { th: "การจัดการ", en: "Management" } },
      { id: "fin", name: { th: "การเงินและการลงทุน", en: "Finance and Investment" } },
      { id: "ib", name: { th: "ธุรกิจระหว่างประเทศ", en: "International Business" } },
      { id: "lm", name: { th: "การจัดการโลจิสติกส์", en: "Logistics Management" } },
      { id: "hh", name: { th: "การจัดการโรงแรม", en: "Hospitality - Hotel" } },
      { id: "ht", name: { th: "การจัดการท่องเที่ยว", en: "Hospitality - Tourism" } },
      { id: "acc", name: { th: "บัญชีบริหาร", en: "Accounting" } },
      { id: "amb", name: { th: "การตลาดดิจิทัล", en: "Digital Marketing" } },
    ],
    engineering: [
      { id: "med", name: { th: "วิศวกรรมเครื่องกล", en: "Mechanical Engineering" } },
      { id: "mme", name: { th: "วิศวกรรมเครื่องกลและระบบการผลิต", en: "Mechanical & Mfg Systems" } },
      { id: "eee", name: { th: "วิศวกรรมไฟฟ้าและอิเล็กทรอนิกส์", en: "Electrical & Electronics" } },
      { id: "ise", name: { th: "วิศวกรรมระบบอุตสาหกรรม", en: "Industrial Systems" } },
      { id: "cie", name: { th: "วิศวกรรมคอมพิวเตอร์", en: "Computer Engineering" } },
      { id: "ce", name: { th: "วิศวกรรมโยธา", en: "Civil Engineering" } },
      { id: "ee", name: { th: "วิศวกรรมไฟฟ้า", en: "Electrical Engineering" } },
      { id: "rae", name: { th: "วิศวกรรมหุ่นยนต์", en: "Robotics Engineering" } },
      { id: "die", name: { th: "อิเล็กทรอนิกส์ดิจิทัล", en: "Digital Electronics" } },
      { id: "dms", name: { th: "ระบบการผลิตดิจิทัล", en: "Digital Mfg Systems" } },
      { id: "ae", name: { th: "วิศวกรรมยานยนต์", en: "Automotive Engineering" } },
    ],
    science: [
      { id: "cs", name: { th: "วิทยาการคอมพิวเตอร์", en: "Computer Science" } },
      { id: "it", name: { th: "เทคโนโลยีสารสนเทศ", en: "Information Technology" } },
      { id: "ps", name: { th: "ฟิสิกส์", en: "Physics" } },
      { id: "est", name: { th: "วิทยาศาสตร์สิ่งแวดล้อม", en: "Environmental Science" } },
      { id: "dst", name: { th: "วิทยาดิจิทัล", en: "Digital Science" } },
      { id: "daa", name: { th: "การวิเคราะห์ข้อมูล", en: "Data Analytics" } },
      { id: "act", name: { th: "เคมีประยุกต์", en: "Applied Chemistry" } },
    ],
    economics: [{ id: "econ", name: { th: "เศรษฐศาสตร์", en: "Economics" } }],
    maritime: [
      { id: "nao", name: { th: "วิศวกรรมต่อเรือ", en: "Naval Architecture" } },
      { id: "ns", name: { th: "วิทยาศาสตร์การเดินเรือ", en: "Nautical Science" } },
      { id: "mt", name: { th: "การขนส่งทางทะเล", en: "Maritime Transportation" } },
      { id: "me", name: { th: "วิศวกรรมเครื่องกลเรือ", en: "Marine Engineering" } },
    ],
  };

  let currentMajors: Major[] = [];
  $: {
    if (faculty && majorData[faculty]) {
      currentMajors = majorData[faculty];
    } else {
      currentMajors = [];
    }
  }

  function selectFaculty(id: string) {
    faculty = id;
    major = ""; // รีเซ็ตสาขาเมื่อมีการเปลี่ยนคณะ
    isFacultyOpen = false;
  }

  function selectMajor(id: string) {
    major = id;
    isMajorOpen = false;
  }

  function selectDepartment(id: string) {
    department = id;
    isDeptOpen = false;
  }

  function getFacultyName(id: string) { 
      const f = facultyList.find(x => x.id === id); 
      // ใช้ [lang] เพื่อดึง th หรือ en
      return f ? f.name[lang] : t.select_faculty; 
  }

  function getMajorName(id: string) { 
      const m = currentMajors.find(x => x.id === id); 
      return m ? m.name[lang] : t.select_major; 
  }

  function getDeptName(id: string) { 
      // แก้เงื่อนไข find ให้เช็ค id หรือ name.en แทน
      const d = organizerDepartments.find(x => x.id === id || x.name.en === id); 
      return d ? d.name[lang] : id || t.select_dept; 
  }
  
  function closeAllDropdowns() { isTitleOpen = false; isFacultyOpen = false; isMajorOpen = false; isDeptOpen = false; }
  function toggleDropdown(type: string, e: Event) {
    e.stopPropagation();
    const wasOpen = type === 'title' ? isTitleOpen : type === 'faculty' ? isFacultyOpen : type === 'major' ? isMajorOpen : isDeptOpen;
    closeAllDropdowns();
    if (!wasOpen) {
        if (type === 'title') isTitleOpen = true;
        if (type === 'faculty') isFacultyOpen = true;
        if (type === 'major') isMajorOpen = true;
        if (type === 'dept') isDeptOpen = true;
    }
  }

  onMount(async () => {
    // 1. Load Language (using key 'app_lang' to sync with other pages)
    const savedLang = localStorage.getItem("app_lang");
    if (savedLang === 'th' || savedLang === 'en') {
      lang = savedLang;
    } else {
      lang = 'th'; // Default
    }

    startSessionTimer();

    // 2. Fetch Data
    isLoading = true;
    try {
        token = localStorage.getItem("access_token") || "";
        const userInfoStr = localStorage.getItem("user_info");
        if (userInfoStr) {
            const userInfo = JSON.parse(userInfoStr);
            userId = userInfo.nisit_id || userInfo.id;
        }
        if (token && userId) {
            const res = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                role = data.role ? data.role.toLowerCase() : (data.nisit_id ? "student" : "officer");
                title = data.title || "";
                firstName = data.first_name || data.firstName || "";
                lastName = data.last_name || data.lastName || "";
                email = data.email || "";
                if (role === 'student') {
                    nisitId = data.nisit_id || "";
                    faculty = data.faculty || "";
                    setTimeout(() => {
                        major = data.major || "";
                        originalData = { title, firstName, lastName, faculty, major, department };
                    }, 50);
                } else {
                    department = data.department || "";
                    originalData = { title, firstName, lastName, faculty, major, department };
                }
            }
        }
    } catch (e) { console.error(e); }
    isLoading = false;
  });

  onDestroy(() => { if (timerInterval) clearInterval(timerInterval); });
  
  $: {
    const basicChanged = title !== originalData.title || firstName !== originalData.firstName || lastName !== originalData.lastName;
    const roleChanged = role === 'student' ? (faculty !== originalData.faculty || major !== originalData.major) : (department !== originalData.department);
    isFormDirty = basicChanged || roleChanged;
  }

  async function handleSaveChanges() {
      isSaving = true;
      setTimeout(() => {
          isSaving = false;
          isFormDirty = false;
          originalData = { title, firstName, lastName, faculty, major, department };
          message = t.msg_success;
          messageType = "success";
          setTimeout(() => message = "", 3000);
      }, 1000);
  }
</script>

<svelte:window on:click={closeAllDropdowns} />

<div class="app-container">
  
  <header class="header-bar">
    <div class="header-inner">
      <div class="left-group">
        <div class="brand"><span class="brand-name">STUDENT</span></div>
        <nav class="nav-menu desktop-only">
          {#each menuItems as item}
            <button class="menu-btn" class:active={currentView === item.id} on:click={() => selectView(item.id, item.path)}>
              <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d={item.svg}></path></svg>
              <span class="btn-label">{item.label}</span>
            </button>
          {/each}
        </nav>
      </div>

      <div class="user-zone">
        <div class="timer-pill">{timeLeftStr}</div>
        
        <div class="lang-switch desktop-only">
            <button class:active={lang === 'th'} on:click={() => setLang('th')}>TH</button>
            <span class="sep">|</span>
            <button class:active={lang === 'en'} on:click={() => setLang('en')}>EN</button>
        </div>

        <button class="logout-btn desktop-only" on:click={handleLogout}>
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
        </button>
        <button class="mobile-toggle mobile-only" on:click={() => (isMobileMenuOpen = !isMobileMenuOpen)}>
          <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 9h16M4 15h16"></path></svg>
        </button>
      </div>
    </div>
  </header>

  {#if isMobileMenuOpen}
    <div class="mobile-overlay" on:click={() => (isMobileMenuOpen = false)} transition:fade={{ duration: 200 }}></div>
    <div class="mobile-drawer" transition:slide={{ axis: 'x', duration: 300 }}>
       <div class="drawer-header">
           <span class="brand-name" style="font-size: 1.4rem;">MENU</span>
           <button class="close-btn" on:click={() => (isMobileMenuOpen = false)}>&times;</button>
       </div>
       <div class="drawer-content">
        {#each menuItems as item}
          <button class="drawer-item" class:active={currentView === item.id} on:click={() => selectView(item.id, item.path)}>
            <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="margin-right: 10px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={item.svg}></path></svg>
            {item.label}
          </button>
        {/each}

        <div class="drawer-lang-item">
            <div class="lang-label-group">
                 <svg class="nav-icon" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="margin-right: 10px;">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"></path>
                 </svg>
                 Language
            </div>
            <div class="lang-toggle-pill">
                <button class:active={lang === 'th'} on:click={() => setLang('th')}>TH</button>
                <button class:active={lang === 'en'} on:click={() => setLang('en')}>EN</button>
            </div>
        </div>
       </div>
       
       <button class="drawer-item logout-special" on:click={handleLogout}>Logout</button>
    </div>
  {/if}

  <div class="scroll-container">
    <div class="content-wrapper">
        <div class="page-header">
            <h2 class="section-title">{t.pageTitle}</h2>
            <div class="title-underline"></div>
            <p style="color: #94a3b8; margin-top: 8px;">{t.pageSubtitle}</p>
        </div>

        <div class="settings-card">
            {#if isLoading}
                <div class="loading-text">Loading profile...</div>
            {:else}
                <div class="form-grid">
                    <div class="form-row three-cols">
                        <div class="form-group">
                            <label class="label">{t.label_title}</label>
                            <div class="custom-select">
                                <button class="select-trigger" on:click={(e) => toggleDropdown('title', e)}>
                                    {title || t.select_default}
                                    <svg class="arrow-icon" class:rotate={isTitleOpen} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
                                </button>
                                {#if isTitleOpen}
                                    <div class="options-list" transition:slide={{ duration: 150 }}>
                                        {#each titleList as t_item}
                                            <div class="option-item" on:click={() => { title = t_item; isTitleOpen = false; }}>{t_item}</div>
                                        {/each}
                                    </div>
                                {/if}
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="label">{t.label_firstname}</label>
                            <input type="text" class="input-field" bind:value={firstName} />
                        </div>
                    </div>
                    
                    <div class="form-group">
                         <label class="label">{t.label_lastname}</label>
                         <input type="text" class="input-field" bind:value={lastName} />
                    </div>

                    <div class="form-group">
                        <label class="label">{t.label_email}</label>
                        <div class="input-field disabled">
                            {email}
                            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                        </div>
                    </div>

                    {#if role === 'student'}
                        <div class="form-group">
                            <label class="label">{t.label_nisitId}</label>
                            <div class="input-field disabled">
                                {nisitId}
                                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                            </div>
                        </div>
                        
                        <div class="form-row two-cols">
                            <div class="form-group">
                                <label class="label">{t.label_faculty}</label>
                                <div class="custom-select">
                                    <button class="select-trigger" on:click={(e) => toggleDropdown('faculty', e)}>
                                        {getFacultyName(faculty)}
                                        <svg class="arrow-icon" class:rotate={isFacultyOpen} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
                                    </button>
                                    {#if isFacultyOpen}
                                      <div class="options-list" transition:slide={{ duration: 150 }}>
                                          {#each facultyList as f}
                                              <button class="option-item" on:click={() => selectFaculty(f.id)}>
                                                  {f.name[lang]} 
                                              </button>
                                          {/each}
                                      </div>
                                    {/if}
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="label">{t.label_major}</label>
                                <div class="custom-select" class:disabled={!faculty}>
                                    <button class="select-trigger" disabled={!faculty} on:click={(e) => faculty && toggleDropdown('major', e)}>
                                        {getMajorName(major)}
                                        <svg class="arrow-icon" class:rotate={isMajorOpen} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
                                    </button>
                                    {#if isMajorOpen}
                                      <div class="options-list" transition:slide={{ duration: 150 }}>
                                          {#each currentMajors as m}
                                              <button class="option-item" on:click={() => selectMajor(m.id)}>
                                                  {m.name[lang]}
                                              </button>
                                          {/each}
                                      </div>
                                    {/if}
                                </div>
                            </div>
                        </div>
                    {:else}
                        <div class="form-group">
                            <label class="label">{t.label_dept}</label>
                            <div class="custom-select">
                                <button class="select-trigger" on:click={(e) => toggleDropdown('dept', e)}>
                                    {getDeptName(department)}
                                    <svg class="arrow-icon" class:rotate={isDeptOpen} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
                                </button>
                                {#if isDeptOpen}
                                    <div class="options-list" transition:slide={{ duration: 150 }}>
                                        {#each organizerDepartments as dept}
                                            <button class="option-item" on:click={() => selectDepartment(dept.id)}>
                                                {dept.name[lang]}
                                            </button>
                                        {/each}
                                    </div>
                                {/if}
                            </div>
                        </div>
                    {/if}
                    
                    <div class="form-group">
                        <div class="label-row">
                            <label class="label">{t.label_password}</label>
                            <a href="/auth/forgot-password?return_to={$page.url.pathname}" class="change-link">{t.btn_change}</a>
                        </div>
                        <div class="input-field disabled">
                            <input type="password" value="12345678" disabled class="password-mask"/>
                            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                        </div>
                    </div>

                    <div class="action-row">
                        {#if message}
                            <div class="message {messageType}" transition:fade>{message}</div>
                        {/if}
                        <button class="save-btn" disabled={!isFormDirty || isSaving} on:click={handleSaveChanges}>
                            {isSaving ? t.btn_saving : t.btn_save}
                        </button>
                    </div>
                </div>
            {/if}
        </div>

    </div>

    <footer class="app-footer">
        <div class="footer-separator"></div>
        <div class="footer-content">
            <p class="copyright">&copy; 2025 Cyber Geek. All rights reserved.</p>
            <p class="credits">Designed & Developed by <span class="highlight">Cyber Geek Development</span></p>
            <p class="contact">Contact: <a href="mailto:cybergeek.dev@proton.me">cybergeek.dev@proton.me</a></p>
        </div>
    </footer>
  </div>
</div>

<style>
  @import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap");
  
  :root { 
      --bg-body: #0f172a; 
      --bg-nav: #1e293b; 
      --bg-card: #1e293b; 
      --primary: #10b981; 
      --text-main: #f8fafc; 
      --text-muted: #94a3b8; 
      --nav-height: 72px; 
  }

  :global(body) { 
    margin: 0; padding: 0; 
    background-color: var(--bg-body); 
    font-family: "Inter", sans-serif;
    color: var(--text-main);
    overflow: hidden; 
  }

  .app-container { display: flex; flex-direction: column; height: 100vh; background-color: var(--bg-body); }
  
  /* HEADER STYLES */
  .header-bar { 
    width: 100%; 
    height: var(--nav-height); 
    background-color: var(--bg-nav); 
    position: fixed; top: 0; left: 0; z-index: 1000; 
    border-bottom: 1px solid rgba(255, 255, 255, 0.05); 
    box-shadow: 0 4px 20px rgba(0,0,0,0.2); 
  }
  .header-inner { 
    width: 100%; 
    height: 100%; 
    display: flex; align-items: center; justify-content: space-between; 
    padding: 0 16px; 
    box-sizing: border-box; 
  }
  .left-group { 
    display: flex; align-items: center; 
    gap: 40px; flex: 1; overflow: hidden; 
  }
  .brand-name { 
    font-size: 2rem; 
    font-weight: 800; 
    text-transform: uppercase; 
    letter-spacing: 0.5px; 
    background: linear-gradient(135deg, #6ee7b7 0%, #10b981 100%); 
    -webkit-background-clip: text; 
    -webkit-text-fill-color: transparent; 
    background-clip: text; 
    cursor: default; 
    white-space: nowrap; 
    margin-right: 10px; 
    text-shadow: 0 0 10px rgba(16, 185, 129, 0.4), 0 0 20px rgba(16, 185, 129, 0.2);
  }
  .nav-menu { display: flex; gap: 8px; white-space: nowrap; }
  .menu-btn { 
    background: transparent; 
    border: none; 
    padding: 10px 14px; 
    border-radius: 8px; 
    cursor: pointer; 
    display: flex; align-items: center; gap: 8px; 
    font-family: 'Inter', sans-serif; 
    font-size: 0.9rem; 
    font-weight: 600; 
    color: var(--text-muted); 
    transition: all 0.2s ease; 
  }
  .nav-icon { width: 18px; height: 18px; opacity: 0.7; transition: 0.2s; }
  .menu-btn:hover { color: var(--text-main); background-color: rgba(255, 255, 255, 0.03); }
  .menu-btn:hover .nav-icon { opacity: 1; }
  .menu-btn.active { 
    background-color: #0f172a; 
    color: #10b981; 
    box-shadow: 0 0 0 1px rgba(16, 185, 129, 0.1); 
  }
  .menu-btn.active .nav-icon { opacity: 1; stroke: #10b981; }

  .user-zone { display: flex; align-items: center; gap: 12px; margin-left: auto; flex-shrink: 0; }
  
  /* Desktop Language Switcher (Copied style) */
  .lang-switch { display: flex; align-items: center; background: rgba(255, 255, 255, 0.05); padding: 4px 10px; border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.1); margin-right: 12px; }
  .lang-switch button { background: none; border: none; color: #64748b; font-size: 0.8rem; font-weight: 700; cursor: pointer; padding: 4px; transition: 0.2s; }
  .lang-switch button.active { color: #10b981; text-shadow: 0 0 10px rgba(16, 185, 129, 0.3); }
  .lang-switch .sep { color: #334155; font-size: 0.8rem; margin: 0 4px; }

  .timer-pill { 
    background-color: #0f172a; 
    color: #10b981; 
    font-weight: 700; 
    font-size: 0.95rem; 
    padding: 8px 14px; 
    border-radius: 6px; 
    border: 1px solid rgba(16, 185, 129, 0.2); 
    letter-spacing: 1px; 
    white-space: nowrap; 
  }
  .timer-pill.warning { color: #f59e0b; border-color: #f59e0b; }
  .logout-btn { 
    background: transparent; border: none; color: var(--text-muted); cursor: pointer; padding: 8px; transition: 0.2s; display: flex; align-items: center; 
  }
  .logout-btn:hover { color: #ef4444; transform: translateX(2px); }

  /* RESPONSIVE */
  .mobile-toggle { display: none; background: transparent; border: none; color: white; padding: 6px; border-radius: 6px; cursor: pointer; }
  
  @media (min-width: 1025px) { .left-group { gap: 15px; } }
  
  @media (max-width: 1024px) { 
    .desktop-only { display: none !important; }
    .mobile-toggle { display: block !important; }
    .header-inner { padding: 0 12px; } 
    .left-group { gap: 10px; } 
    .brand-name { font-size: 1.5rem; } 
  }

  /* MOBILE DRAWER */
  .mobile-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.7); z-index: 2000; backdrop-filter: blur(2px); }
  .mobile-drawer { position: fixed; top: 0; right: 0; bottom: 0; width: 70vw; max-width: 280px; background: var(--bg-nav); z-index: 2001; padding: 20px; display: flex; flex-direction: column; box-shadow: -5px 0 20px rgba(0, 0, 0, 0.5); }
  .drawer-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); }
  .close-btn { background: none; border: none; color: white; font-size: 1.5rem; cursor: pointer; }
  .drawer-content { flex: 1; display: flex; flex-direction: column; gap: 10px; }
  .drawer-item { background: transparent; border: none; color: var(--text-muted); text-align: left; padding: 12px 16px; font-size: 1rem; font-weight: 600; display: flex; align-items: center; gap: 12px; border-radius: 8px; cursor: pointer; transition: all 0.2s ease; }
  .drawer-item.active { background-color: #0f172a; color: #10b981; border: 1px solid rgba(255, 255, 255, 0.05); }
  .logout-special { color: #ef4444; margin-top: auto; border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 20px; }

  /* Mobile Language Switcher Styles (Copied style) */
  .drawer-lang-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; margin-top: 10px; border-top: 1px solid rgba(255, 255, 255, 0.05); padding-top: 20px; }
  .lang-label-group { display: flex; align-items: center; color: #94a3b8; font-weight: 600; font-size: 1rem; gap: 12px; }
  .lang-toggle-pill { display: flex; background: #0f172a; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 20px; padding: 2px; }
  .lang-toggle-pill button { background: transparent; border: none; color: #64748b; padding: 6px 14px; font-size: 0.85rem; font-weight: 700; border-radius: 18px; cursor: pointer; transition: 0.2s; }
  .lang-toggle-pill button.active { background: #10b981; color: white; }

  /* CONTENT STYLES */
  .scroll-container { 
    margin-top: calc(var(--nav-height) + 40px); 
    padding-bottom: 40px; 
    overflow: visible; 
    display: flex; flex-direction: column; flex: 1;
  }
  .content-wrapper { 
    max-width: 1400px; 
    margin: 0 auto; 
    padding: 0 24px; 
    width: 100%; 
    box-sizing: border-box; 
    flex: 1; 
  }
  
  .page-header { margin-bottom: 30px; }
  .section-title { font-size: 2rem; font-weight: 700; color: var(--text-main); margin: 0 0 8px 0; }
  .title-underline { width: 40px; height: 4px; background: var(--primary); border-radius: 2px; }

  .settings-card { 
    background: var(--bg-card); 
    padding: 40px; 
    border-radius: 16px; 
    border: 1px solid rgba(255,255,255,0.05); 
    max-width: 1000px; 
    margin: 0 auto;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
  }
  
  .form-grid { display: flex; flex-direction: column; gap: 24px; }
  .form-row { display: flex; gap: 20px; }
  .three-cols .form-group:nth-child(1) { flex: 0 0 120px; }
  .three-cols .form-group { flex: 1; }
  .two-cols .form-group { flex: 1; }
  
  .form-group { display: flex; flex-direction: column; gap: 8px; }
  .label-row { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 4px; }
  .label { font-size: 0.95rem; font-weight: 700; color: #f1f5f9; }
  .change-link { color: var(--primary); font-size: 0.75rem; font-weight: 800; text-decoration: none; cursor: pointer; letter-spacing: 0.5px; text-transform: uppercase; }
  .change-link:hover { text-decoration: underline; }

  .input-field, .select-trigger { background: #1e293b; border: 2px solid #334155; color: white; padding: 14px 16px; border-radius: 12px; width: 100%; box-sizing: border-box; font-size: 1rem; outline: none; transition: 0.2s; display: flex; align-items: center; justify-content: space-between; }
  .input-field input { background: transparent; border: none; color: white; width: 100%; font-size: 1rem; outline: none; }
  .input-field.disabled, .select-trigger[disabled] { background: #151e2e; border-color: #334155; opacity: 1; color: #94a3b8; }
  .input-field.disabled input { color: #94a3b8; }
  .password-mask { font-size: 24px; letter-spacing: 2px; line-height: 1; height: 20px; margin-top: -6px; }
  .input-field:focus-within, .select-trigger:focus { border-color: var(--primary); background: #1e293b; }
  
  /* Dropdown */
  .custom-select { position: relative; }
  .select-trigger { cursor: pointer; text-align: left; }
  .options-list { position: absolute; top: 100%; left: 0; right: 0; background: #1e293b; border: 2px solid #334155; z-index: 50; border-radius: 12px; margin-top: 5px; max-height: 200px; overflow-y: auto; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
  .option-item { width: 100%; display: block; text-align: left; background: transparent; border: none; padding: 12px 16px; cursor: pointer; color: #cbd5e1; transition: 0.2s; border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
  .option-item:hover { background: rgba(255, 255, 255, 0.05); color: white; }
  .arrow-icon { transition: transform 0.2s; color: #64748b; }
  .select-trigger:focus .arrow-icon { color: var(--primary); }
  .arrow-icon.rotate { transform: rotate(180deg); }

  .action-row { display: flex; justify-content: flex-end; align-items: center; gap: 15px; margin-top: 10px; width: 100%; }
  .save-btn { width: 100%; background: #334155; color: #64748b; padding: 16px; border-radius: 12px; font-weight: 800; border: none; cursor: not-allowed; text-transform: uppercase; letter-spacing: 0.5px; font-size: 1rem; transition: 0.2s; }
  .save-btn:not(:disabled) { background: var(--primary); color: #0f172a; cursor: pointer; }
  .save-btn:not(:disabled):hover { filter: brightness(1.1); }
  
  .message { font-size: 0.9rem; font-weight: 600; }
  .message.success { color: var(--primary); }
  .message.error { color: #ef4444; }

  @media (max-width: 768px) {
      .form-row { flex-direction: column; gap: 24px; }
      .three-cols .form-group:nth-child(1) { flex: 1; }
      .content-wrapper { padding: 20px 16px; }
      .settings-card { padding: 20px; }
  }

  /* FOOTER */
  .app-footer { margin-top: 40px; text-align: center; padding-bottom: 20px; }
  .footer-separator { height: 1px; background: rgba(255,255,255,0.1); width: 100px; margin: 0 auto 20px auto; }
  .footer-content p { font-size: 0.8rem; color: #64748b; margin: 4px 0; }
  .highlight { color: var(--primary); }
  .contact a { color: #64748b; text-decoration: none; }
</style>