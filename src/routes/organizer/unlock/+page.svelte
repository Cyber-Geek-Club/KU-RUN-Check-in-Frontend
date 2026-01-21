<script lang="ts">
  import axios from 'axios';
  import { onMount } from 'svelte';
  
  // ✅ Import API Endpoints
  import { endpoints } from '../_lib/api/endpoints';
  
  // API Configuration
  const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
  
  const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
  });
  
  // Attach Token if available
  api.interceptors.request.use((config) => {
    if (typeof localStorage !== 'undefined') {
        const token = localStorage.getItem('access_token');
        if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Handle 404 silently
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response && error.response.status === 404) {
         return Promise.reject(error);
      }
      return Promise.reject(error);
    }
  );
  
  // Language Setup
  type Language = "th" | "en";
  let currentLang: Language = "th";
  
  if (typeof localStorage !== "undefined") {
    const saved = localStorage.getItem("app_language");
    if (saved === "th" || saved === "en") currentLang = saved;
  }
  
  const translations = {
    th: {
      title: "ปลดล็อคบัญชี",
      subtitle: "ระบบช่วยกู้คืนสถานะบัญชี",
      emailLabel: "อีเมลที่ต้องการปลดล็อค",
      placeholder: "example@ku.th",
      submitBtn: "ส่งคำขอปลดล็อค",
      processing: "กำลังดำเนินการ...",
      success: "ปลดล็อคสำเร็จ! กรุณาตรวจสอบอีเมล",
      error_404: "ไม่พบข้อมูลผู้ใช้งานในระบบ",
      error_generic: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง",
      invalid_email: "รูปแบบอีเมลไม่ถูกต้อง",
      empty_email: "กรุณากรอกอีเมล",
    },
    en: {
      title: "Unlock Account",
      subtitle: "Account Recovery System",
      emailLabel: "User Email Address",
      placeholder: "example@ku.th",
      submitBtn: "Request Unlock",
      processing: "Processing...",
      success: "Success! Please check your email.",
      error_404: "User account not found.",
      error_generic: "An error occurred. Please try again.",
      invalid_email: "Invalid email format",
      empty_email: "Email is required",
    },
  };
  
  $: lang = translations[currentLang];
  
  // State
  let email = "";
  let isLoading = false;
  let statusMessage = "";
  let statusType: "success" | "error" | "info" = "info";
  let inputElement: HTMLInputElement;

  function validateEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  async function handleSubmit() {
    statusMessage = "";
    
    if (!email.trim()) {
      statusMessage = lang.empty_email;
      statusType = "error";
      inputElement?.focus();
      return;
    }

    if (!validateEmail(email)) {
      statusMessage = lang.invalid_email;
      statusType = "error";
      inputElement?.focus();
      return;
    }
    
    isLoading = true;
    
    try {
      // ✅ ใช้ API Endpoint ที่ถูกต้อง (endpoints.users.unlock)
      // ปกติคือ /api/users/unlock
      await api.post(endpoints.users.unlock, { email: email.trim() });
      
      statusMessage = lang.success;
      statusType = "success";
      email = ""; // Clear input on success
      
    } catch (error: any) {
      statusType = "error";
      if (error.response?.status === 404) {
        statusMessage = lang.error_404;
      } else {
        statusMessage = error.response?.data?.message || lang.error_generic;
      }
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="unlock-container">
  <div class="unlock-card">
    
    <div class="unlock-icon-wrapper">
      <div class="unlock-icon-bg"></div>
      <svg class="unlock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
      </svg>
    </div>

    <div class="unlock-header">
      <h1 class="unlock-title">{lang.title}</h1>
      <p class="unlock-subtitle">{lang.subtitle}</p>
    </div>

    <div class="unlock-form">
      <div class="input-group">
        <label for="email">{lang.emailLabel}</label>
        <div class="input-wrapper" class:error={statusType === 'error' && statusMessage}>
          <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
            <polyline points="22,6 12,13 2,6"></polyline>
          </svg>
          <input 
            id="email"
            type="email" 
            bind:this={inputElement}
            bind:value={email} 
            placeholder={lang.placeholder}
            disabled={isLoading}
            on:input={() => statusMessage = ""}
            on:keydown={(e) => e.key === 'Enter' && handleSubmit()}
          />
        </div>
      </div>

      {#if statusMessage}
        <div class="status-box {statusType}">
          {#if statusType === 'success'}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
          {:else}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          {/if}
          <span>{statusMessage}</span>
        </div>
      {/if}

      <button class="unlock-btn" on:click={handleSubmit} disabled={isLoading || !email}>
        {#if isLoading}
          <div class="loader"></div>
          <span>{lang.processing}</span>
        {:else}
          <span>{lang.submitBtn}</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        {/if}
      </button>

    </div>
  </div>
</div>

<style>
  /* --- Global Variables --- */
  :root {
    --c-card: rgba(30, 41, 59, 0.6);
    --c-border: rgba(255, 255, 255, 0.08);
    --c-primary: #10b981;
    --c-primary-hover: #059669;
    --c-error: #ef4444;
    --c-text-main: #ffffff;
    --c-text-sub: #94a3b8;
    --c-input-bg: rgba(15, 23, 42, 0.8);
  }

  /* --- Layout --- */
  .unlock-container {
    /* ✅ ลบ background ออกเพื่อไม่ให้ซ้อนกับ Layout หลัก */
    /* background: linear-gradient(to bottom right, #0f172a, #1e293b); */
    
    /* ✅ ปรับ min-height เป็น auto หรือ 100% ตามความเหมาะสมของ container */
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 2rem 1.5rem;
    font-family: 'Inter', sans-serif;
  }

  .unlock-card {
    width: 100%;
    max-width: 440px;
    background: var(--c-card);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid var(--c-border);
    border-radius: 24px;
    padding: 2.5rem;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    text-align: center;
    animation: fadeIn 0.4s ease-out;
  }

  /* --- Header & Icon --- */
  .unlock-icon-wrapper {
    width: 80px;
    height: 80px;
    margin: 0 auto 1.5rem;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .unlock-icon-bg {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.1));
    border-radius: 50%;
    animation: pulse 2s infinite;
  }

  .unlock-icon {
    position: relative;
    width: 36px;
    height: 36px;
    color: var(--c-primary);
  }

  .unlock-header { margin-bottom: 2rem; }

  .unlock-title {
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--c-text-main);
    margin: 0 0 0.5rem 0;
  }

  .unlock-subtitle {
    font-size: 1rem;
    color: var(--c-text-sub);
    margin: 0;
  }

  /* --- Form & Inputs --- */
  .unlock-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    text-align: left;
  }

  .input-group label {
    display: block;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--c-text-main);
    margin-bottom: 0.5rem;
  }

  .input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    background: var(--c-input-bg);
    border: 1px solid var(--c-border);
    border-radius: 12px;
    transition: all 0.2s;
  }

  .input-wrapper:focus-within {
    border-color: var(--c-primary);
    box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
  }

  .input-wrapper.error {
    border-color: var(--c-error);
  }

  .input-icon {
    position: absolute;
    left: 1rem;
    width: 20px;
    height: 20px;
    color: var(--c-text-sub);
  }

  .input-wrapper input {
    width: 100%;
    background: transparent;
    border: none;
    padding: 1rem 1rem 1rem 3rem;
    color: var(--c-text-main);
    font-size: 1rem;
    outline: none;
  }

  .input-wrapper input::placeholder {
    color: #475569;
  }

  .input-wrapper input:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }

  /* --- Status Box --- */
  .status-box {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    border-radius: 10px;
    font-size: 0.9rem;
    font-weight: 500;
    animation: slideDown 0.2s ease-out;
  }

  .status-box svg { width: 18px; height: 18px; flex-shrink: 0; }

  .status-box.error {
    background: rgba(239, 68, 68, 0.1);
    color: #fca5a5;
    border: 1px solid rgba(239, 68, 68, 0.2);
  }

  .status-box.success {
    background: rgba(16, 185, 129, 0.1);
    color: #6ee7b7;
    border: 1px solid rgba(16, 185, 129, 0.2);
  }

  /* --- Button --- */
  .unlock-btn {
    width: 100%;
    padding: 1rem;
    background: linear-gradient(135deg, var(--c-primary), var(--c-primary-hover));
    border: none;
    border-radius: 12px;
    color: white;
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    transition: all 0.2s;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }

  .unlock-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4);
  }

  .unlock-btn:active:not(:disabled) {
    transform: translateY(0);
  }

  .unlock-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .unlock-btn svg { width: 20px; height: 20px; }

  /* --- Loader --- */
  .loader {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  /* --- Animations --- */
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
  @keyframes slideDown { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.1); opacity: 0.8; } 100% { transform: scale(1); opacity: 1; } }

  /* --- Mobile --- */
  @media (max-width: 480px) {
    .unlock-card { padding: 2rem 1.5rem; }
    .unlock-title { font-size: 1.5rem; }
  }
</style>