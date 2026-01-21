<script lang="ts">
  import { onMount } from "svelte";
  import axios from "axios";
  import Swal from "sweetalert2";
  import { fade, slide } from "svelte/transition";

  // --- 1. API Configuration (FIXED) ---
  // ใส่ Default URL เพื่อป้องกันการยิงเข้า localhost:5173
  const API_BASE_URL = (
    import.meta.env.VITE_API_BASE_URL || "http://158.108.102.14:8001"
  ).replace(/\/$/, "");

  const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
  });

  api.interceptors.request.use((config) => {
    if (typeof localStorage !== "undefined") {
      const token = localStorage.getItem("access_token");
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // --- Language ---
  import { writable } from "svelte/store";
  type Lang = 'th' | 'en';
  export const appLanguage = writable<Lang>("th");
  if (typeof localStorage !== "undefined") {
    const saved = localStorage.getItem("app_language");
    if (saved === "th" || saved === "en") appLanguage.set(saved);
  }

  appLanguage.subscribe((lang) => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("app_language", lang as string);
    }
  });

  const titleOptions = {
    th: ["นาย", "นาง", "นางสาว"],
    en: ["Mr.", "Mrs.", "Ms."],
  };

  const roleOptions = [
    { value: "student", label: { th: "นิสิต", en: "Student" } },
    { value: "organizer", label: { th: "ผู้จัดงาน", en: "Organizer" } },
    { value: "officer", label: { th: "เจ้าหน้าที่", en: "Officer" } },
  ];

  // ตัวอย่าง department list (ฝ่ายจัดการ/ฝ่ายงาน ไม่ใช่ภาควิชาอาจารย์)
  const departmentOptions = [
    { th: "ฝ่ายทะเบียน", en: "Registration Office" },
    { th: "ฝ่ายกิจการนิสิต", en: "Student Affairs" },
    { th: "ฝ่ายการเงิน", en: "Finance Office" },
    { th: "ฝ่ายเทคโนโลยีสารสนเทศ", en: "IT Office" },
    { th: "ฝ่ายประชาสัมพันธ์", en: "Public Relations" },
    { th: "ฝ่ายจัดงานกิจกรรม", en: "Event Management" },
  ];

  let currentLang: Lang = 'th';
  $: currentLang = $appLanguage;
  $: lang = translations[currentLang];
  $: nameTitles = titleOptions[currentLang];
  $: roleLabelOptions = roleOptions.map((r) => ({
    value: r.value,
    label: r.label[currentLang as Lang],
  }));
  $: departmentLabelOptions = departmentOptions.map((d) => ({
    value: d.en,
    label: d[currentLang as Lang],
  }));
  $: selectedDepartmentLabel =
    departmentLabelOptions.find((d) => d.value === userData.department)
      ?.label || (currentLang === "th" ? "เลือกฝ่ายงาน" : "Select Department");

  const translations = {
    th: {
      accountSettings: "ตั้งค่าบัญชี (ผู้จัดงาน)",
      manageProfile: "จัดการข้อมูลส่วนตัวและหน่วยงาน",
      personalInfo: "ข้อมูลส่วนตัว",
      workInfo: "ข้อมูลการทำงาน",
      security: "ความปลอดภัย",
      title: "คำนำหน้า",
      firstName: "ชื่อจริง",
      lastName: "นามสกุล",
      emailAddress: "อีเมล",
      organization: "หน่วยงาน / สังกัด",
      position: "ตำแหน่ง",
      password: "รหัสผ่าน",
      changePassword: "เปลี่ยนรหัสผ่าน",
      saveChanges: "บันทึกการเปลี่ยนแปลง",
      saving: "กำลังบันทึก...",
      selectTitle: "เลือกคำนำหน้า",
      enterFirstName: "กรอกชื่อจริง",
      enterLastName: "กรอกนามสกุล",
      enterOrg: "กรอกชื่อหน่วยงาน",
      enterPos: "กรอกตำแหน่ง",
      successTitle: "สำเร็จ",
      successMsg: "อัปเดตข้อมูลเรียบร้อยแล้ว",
      errorTitle: "เกิดข้อผิดพลาด",
      errorMsg: "ไม่สามารถบันทึกข้อมูลได้",
      fillAll: "กรุณากรอกข้อมูลให้ครบถ้วน",
    },
    en: {
      accountSettings: "Organizer Settings",
      manageProfile: "Manage personal and organization info",
      personalInfo: "Personal Information",
      workInfo: "Work Information",
      security: "Security",
      title: "Title",
      firstName: "First Name",
      lastName: "Last Name",
      emailAddress: "Email Address",
      organization: "Organization",
      position: "Position",
      password: "Password",
      changePassword: "Change Password",
      saveChanges: "Save Changes",
      saving: "Saving...",
      selectTitle: "Select Title",
      enterFirstName: "Enter first name",
      enterLastName: "Enter last name",
      enterOrg: "Enter organization",
      enterPos: "Enter position",
      successTitle: "Success",
      successMsg: "Profile updated successfully",
      errorTitle: "Error",
      errorMsg: "Failed to update profile",
      fillAll: "Please complete all required fields",
    },
  };

  // --- State ---
  let loading = false;
  let saving = false;
  let showTitleDropdown = false;
  let showRoleDropdown = false;
  let showDepartmentDropdown = false;

  let userData = {
    id: "",
    email: "",
    title: "",
    firstName: "",
    lastName: "",
    organization: "",
    position: "",
    major: "",
    faculty: "",
    department: "",
    role: "",
    nisit_id: "",
    is_verified: false,
    is_locked: false,
    failed_login_attempts: 0,
    locked_at: "",
    created_at: "",
    updated_at: "",
  };

  // --- Functions ---

  function toggleTitleDropdown(event: Event) {
    event.stopPropagation();
    showTitleDropdown = !showTitleDropdown;
  }

  function closeDropdown() {
    showTitleDropdown = false;
  }

  async function loadProfile() {
    loading = true;
    try {
      // ดึง user_id จาก localStorage หรือ user_info
      let userId = "";
      if (typeof localStorage !== "undefined") {
        const userInfo = localStorage.getItem("user_info");
        if (userInfo) {
          try {
            const user = JSON.parse(userInfo);
            userId = user.id;
          } catch (e) {
            console.error("Error parsing user_info:", e);
          }
        }
      }
      if (!userId) {
        throw new Error("User ID not found in localStorage");
      }
      console.log(`Fetching profile from: ${API_BASE_URL}/api/users/${userId}`);
      const res = await api.get(`/api/users/${userId}`);
      const d = res.data;
      userData = {
        id: d.id || "",
        email: d.email || "",
        title: d.title || "",
        firstName: d.first_name || d.firstName || "",
        lastName: d.last_name || d.lastName || "",
        organization: d.organization || "",
        position: d.position || "",
        major: d.major || "",
        faculty: d.faculty || "",
        department: d.department || "",
        role: d.role || "",
        nisit_id: d.nisit_id || "",
        is_verified: d.is_verified ?? false,
        is_locked: d.is_locked ?? false,
        failed_login_attempts: d.failed_login_attempts ?? 0,
        locked_at: d.locked_at || "",
        created_at: d.created_at || "",
        updated_at: d.updated_at || "",
      };
    } catch (err: any) {
      console.error("Load Profile Error:", err);
      Swal.fire({
        icon: "error",
        title: "API Error",
        text: "ไม่พบข้อมูลผู้ใช้หรือ user_id",
        customClass: { popup: "swal-dark" },
      });
    } finally {
      loading = false;
    }
  }

  async function saveProfile() {
    if (!userData.firstName || !userData.lastName) {
      Swal.fire({
        icon: "warning",
        title: lang.errorTitle,
        text: lang.fillAll,
        customClass: { popup: "swal-dark" },
      });
      return;
    }
    saving = true;
    try {
      let userId = "";
      if (typeof localStorage !== "undefined") {
        const userInfo = localStorage.getItem("user_info");
        if (userInfo) {
          try {
            const user = JSON.parse(userInfo);
            userId = user.id;
          } catch (e) {
            console.error("Error parsing user_info:", e);
          }
        }
      }
      if (!userId) {
        throw new Error("User ID not found in localStorage");
      }
      const payload = {
        title: userData.title,
        first_name: userData.firstName,
        last_name: userData.lastName,
        major: userData.major || "",
        faculty: userData.faculty || "",
        department: userData.department || "",
      };
      await api.put(`/api/users/${userId}`, payload);
      Swal.fire({
        icon: "success",
        title: lang.successTitle,
        text: lang.successMsg,
        timer: 1500,
        showConfirmButton: false,
        customClass: { popup: "swal-dark" },
      });
    } catch (err) {
      console.error("Save Error:", err);
      Swal.fire({
        icon: "error",
        title: lang.errorTitle,
        text: lang.errorMsg,
        customClass: { popup: "swal-dark" },
      });
    } finally {
      saving = false;
    }
  }

  onMount(() => {
    loadProfile();
  });
</script>

<svelte:window on:click={closeDropdown} />

<div class="settings-container">
  {#if loading}
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Loading Profile...</p>
    </div>
  {:else}
    <div class="settings-content" in:fade={{ duration: 300 }}>
  <header class="page-header">
    <div class="header-icon-circle">
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
    </div>
    <div class="header-text">
      <h1>{lang.accountSettings}</h1>
      <p>{lang.manageProfile}</p>
    </div>
  </header>

  <section class="info-card" style="position: relative; z-index: 30;">
    <div class="card-headerr">
      <div class="card-icon">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      </div>
      <h2>{lang.personalInfo}</h2>
    </div>

    <div class="card-content">
      <div class="field-row">
        <div class="form-field" style="flex: 0 0 120px;">
          <label for="title-select">{lang.title}</label>
          <div class="custom-select">
            <button
              id="title-select"
              class="select-btn"
              class:active={showTitleDropdown}
              on:click={toggleTitleDropdown}
            >
              <span>{userData.title || lang.selectTitle}</span>
              <svg
                class="arrow"
                class:rotate={showTitleDropdown}
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"><path d="M6 9l6 6 6-6" /></svg
              >
            </button>
            {#if showTitleDropdown}
              <div
                class="dropdown-menu"
                transition:slide={{ duration: 200 }}
              >
                {#each nameTitles as t}
                  <button
                    class="dropdown-item"
                    on:click={() => {
                      userData.title = t;
                      closeDropdown();
                    }}>{t}</button
                  >
                {/each}
              </div>
            {/if}
          </div>
        </div>

        <div class="form-field" style="flex: 1;">
          <label for="first-name">{lang.firstName}</label>
          <div class="input-wrapper">
            <input
              id="first-name"
              type="text"
              bind:value={userData.firstName}
              placeholder={lang.enterFirstName}
            />
          </div>
        </div>
      </div>

      <div class="form-field">
        <label for="last-name">{lang.lastName}</label>
        <div class="input-wrapper">
          <input
            id="last-name"
            type="text"
            bind:value={userData.lastName}
            placeholder={lang.enterLastName}
          />
        </div>
      </div>

      <div class="form-field">
        <label for="email-address">{lang.emailAddress}</label>
        <div class="input-wrapper locked">
          <input id="email-address" type="email" value={userData.email} disabled />
          <svg
            class="lock-icon"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            ><rect x="3" y="11" width="18" height="11" rx="2" ry="2"
            ></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg
          >
        </div>
      </div>
    </div>
  </section>

  <section class="info-card" style="position: relative; z-index: {showDepartmentDropdown ? 50 : 20};">
    <div class="card-headerr">
      <div class="card-icon">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      </div>
      <h2>{lang.workInfo}</h2>
    </div>
    <div class="card-content">
      <div class="form-field" style="position:relative;">
        <label for="department-select">{currentLang === "th" ? "ฝ่ายงาน" : "Department"}</label>
        <div class="custom-select">
          <button
            id="department-select"
            class="select-btn"
            class:active={showDepartmentDropdown}
            on:click={(e) => {
              e.stopPropagation();
              showDepartmentDropdown = !showDepartmentDropdown;
            }}
          >
            <span>{selectedDepartmentLabel}</span>
            <svg
              class="arrow"
              class:rotate={showDepartmentDropdown}
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"><path d="M6 9l6 6 6-6" /></svg
            >
          </button>
          {#if showDepartmentDropdown}
            <div class="dropdown-menu" transition:slide={{ duration: 200 }}>
              {#each departmentLabelOptions as d}
                <button
                  class="dropdown-item"
                  on:click={() => {
                    userData.department = d.value;
                    showDepartmentDropdown = false;
                  }}>{d.label}</button
                >
              {/each}
            </div>
          {/if}
        </div>
      </div>
    </div>
  </section>

  <section class="info-card">
    <div class="card-headerr">
      <div class="card-icon">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"
          ></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
      </div>
      <h2>{lang.security}</h2>
    </div>
    <div class="card-content">
      <div class="form-field">
        <div class="password-row">
          <label for="password-display">{lang.password}</label>
          <a href="/auth/forgot-password" class="change-link"
            >{lang.changePassword}</a
          >
        </div>
        <div class="input-wrapper locked">
          <input id="password-display" type="password" value="••••••••••••" disabled />
          <svg
            class="lock-icon"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            ><rect x="3" y="11" width="18" height="11" rx="2" ry="2"
            ></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg
          >
        </div>
      </div>
    </div>
  </section>

  <div class="save-section">
    <button class="btn-save" on:click={saveProfile} disabled={saving}>
      {#if saving}
        <div class="btn-spinner"></div>
        <span>{lang.saving}</span>
      {:else}
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"
          ></path>
          <polyline points="17 21 17 13 7 13 7 21"></polyline>
          <polyline points="7 3 7 8 15 8"></polyline>
        </svg>
        <span>{lang.saveChanges}</span>
      {/if}
    </button>
  </div>
</div>
  {/if}
</div>

<style>
  /* ==================== LAYOUT & CONTAINER ==================== */
  .settings-container {
    width: 100%;
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem 1rem;
    min-height: 100vh;
    color: #f1f5f9;
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem;
    color: #64748b;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(16, 185, 129, 0.1);
    border-top-color: #10b981;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  /* ==================== HEADER ==================== */
  .page-header {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    margin-bottom: 2rem;
    padding: 1.5rem;
    background: rgba(30, 41, 59, 0.6);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 20px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  }

  .header-icon-circle {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: linear-gradient(135deg, #10b981, #059669);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    color: white;
  }

  .header-text h1 {
    font-size: 1.75rem;
    font-weight: 700;
    color: #f8fafc;
    margin: 0 0 0.25rem 0;
  }

  .header-text p {
    font-size: 0.95rem;
    color: #94a3b8;
    margin: 0;
  }

  /* ==================== CARD STYLES ==================== */
  .info-card {
    background: rgba(30, 41, 59, 0.6);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 20px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    transition: transform 0.2s ease;
  }

  .card-headerr {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .card-icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: rgba(16, 185, 129, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: #10b981;
  }

  .card-headerr h2 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #f8fafc;
    margin: 0;
  }

  .card-content {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  /* ==================== FORM FIELDS ==================== */
  .field-row {
    display: flex;
    gap: 1rem;
    align-items: flex-start;
  }

  .form-field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  label {
    font-size: 0.875rem;
    font-weight: 600;
    color: #cbd5e1;
  }

  .password-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .change-link {
    font-size: 0.85rem;
    color: #3b82f6;
    text-decoration: none;
    font-weight: 500;
    transition: color 0.2s;
  }
  .change-link:hover {
    color: #60a5fa;
    text-decoration: underline;
  }

  /* Input Wrapper */
  .input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  input {
    width: 100%;
    padding: 0.875rem 1rem;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    color: #f8fafc;
    font-size: 0.95rem;
    transition: all 0.2s;
    box-sizing: border-box;
  }

  input:focus {
    outline: none;
    border-color: #10b981;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
    background: rgba(15, 23, 42, 0.8);
  }

  input::placeholder {
    color: #64748b;
  }

  .input-wrapper.locked {
    opacity: 0.7;
  }
  .input-wrapper.locked input {
    padding-right: 2.5rem;
    cursor: not-allowed;
  }
  .input-wrapper.locked .lock-icon {
    position: absolute;
    right: 1rem;
    color: #64748b;
  }

  /* ==================== CUSTOM DROPDOWN ==================== */
  .custom-select {
    position: relative;
    width: 100%;
  }

  .select-btn {
    width: 100%;
    padding: 0.875rem 1rem;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    color: #f8fafc;
    font-size: 0.95rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
  }

  .select-btn:hover {
    border-color: rgba(16, 185, 129, 0.4);
  }
  .select-btn.active {
    border-color: #10b981;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
  }

  .arrow {
    transition: transform 0.2s;
    color: #94a3b8;
  }
  .arrow.rotate {
    transform: rotate(180deg);
  }

  .dropdown-menu {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    width: 100%;
    background: #1e293b;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    z-index: 2147483647;
    max-height: 240px;
    overflow-y: auto;
    padding: 4px;
  }

  .dropdown-item {
    width: 100%;
    padding: 0.75rem 1rem;
    background: transparent;
    border: none;
    color: #f8fafc;
    font-size: 0.95rem;
    text-align: left;
    cursor: pointer;
    border-radius: 8px;
    transition: all 0.2s;
  }

  .dropdown-item:hover {
    background: rgba(16, 185, 129, 0.15);
    color: #10b981;
  }

  /* ==================== ACTION BUTTONS ==================== */
  .save-section {
    display: flex;
    justify-content: flex-end;
    margin-top: 2rem;
  }

  .btn-save {
    padding: 0.875rem 2rem;
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    border: none;
    border-radius: 12px;
    font-weight: 600;
    font-size: 1rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    cursor: pointer;
    transition: all 0.3s;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }

  .btn-save:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4);
  }

  .btn-save:disabled {
    opacity: 0.7;
    cursor: wait;
  }

  .btn-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  /* SweetAlert Customization */
  /* Use theme variables so SweetAlert popups match the app's gray/dark theme */
  :global(.swal-dark) {
    background: var(--bg-card, #1e293b) !important;
    color: var(--text-main, #f8fafc) !important;
    border: 1px solid rgba(255, 255, 255, 0.06) !important;
    border-radius: 12px !important;
  }
  :global(.swal-dark .swal2-title) {
    color: var(--text-main, #f8fafc) !important;
  }
  :global(.swal-dark .swal2-html-container) {
    color: var(--text-muted, #cbd5e1) !important;
  }
  :global(.swal-dark .swal2-confirm) {
    background: var(--primary, #10b981) !important;
    box-shadow: none !important;
  }

  /* ==================== ANIMATIONS ==================== */
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* ==================== RESPONSIVE ==================== */
  @media (max-width: 768px) {
    .header-text h1 {
      font-size: 1.5rem;
    }
    .field-row {
      flex-direction: column;
      gap: 1rem;
    }
    .form-field {
      flex: auto !important;
      width: 100%;
    }
  }
  @media (max-width: 640px) {
    .settings-container {
      padding: 1rem 0.5rem;
    }
    .page-header {
      flex-direction: column;
      text-align: center;
    }
    .info-card {
      padding: 1.25rem;
    }
    .btn-save {
      width: 100%;
      justify-content: center;
    }
  }

  /* removed unused .lang-btn styles (no longer referenced) */
</style>
