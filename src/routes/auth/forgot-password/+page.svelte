<script lang="ts">
  import { goto } from "$app/navigation";
  import { slide, scale } from "svelte/transition";
  import { onMount, onDestroy } from "svelte";
  import { page } from "$app/stores";

  const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

  let email: string = "";
  let isLoading = false;
  let currentStep = 1;
  let message: string = "";
  let messageType: "error" | "success" = "error";
  let messageTimeout: any;
  let errorField = "";

  let returnUrl = "/auth/login"; 
  
  $: {
    const param = $page.url.searchParams.get("return_to");
    if (param) {
      returnUrl = param;
    }
  }

  function handleStorageEvent(event: StorageEvent) {
    if (event.key === "password_reset_done") {
      localStorage.removeItem("password_reset_done");
      goto(returnUrl); 
    }
  }

  onMount(() => {
    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleStorageEvent);
    }
  });

  onDestroy(() => {
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", handleStorageEvent);
    }
    if (messageTimeout) clearTimeout(messageTimeout);
  });

  function showMessage(
    msg: string,
    type: "error" | "success" = "error",
    field = ""
  ) {
    if (messageTimeout) clearTimeout(messageTimeout);
    message = msg;
    messageType = type;
    errorField = field;
    messageTimeout = setTimeout(() => {
      message = "";
      errorField = "";
    }, 4000);
  }

  function clearMessage() {
    if (message) {
      message = "";
      errorField = "";
      if (messageTimeout) clearTimeout(messageTimeout);
    }
  }

  function validateEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  async function handleSendEmail() {
    clearMessage();
    if (!email)
      return showMessage("Please enter your email.", "error", "email");
    if (!validateEmail(email))
      return showMessage("Invalid email format.", "error", "email");

    isLoading = true;
    try {
      const res = await fetch(`${API_BASE}/api/users/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        currentStep = 2;
      } else {
        const data = await res.json().catch(() => ({}));
        showMessage(data.detail || "Failed to send email.", "error");
      }
    } catch (e) {
      showMessage("Cannot connect to server.", "error");
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="app-screen">
  <div class="glass-header">
    <button
      class="back-btn"
      aria-label="Back"
      on:click={() => goto(returnUrl)} 
      disabled={isLoading}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        ><line x1="19" y1="12" x2="5" y2="12"></line><polyline
          points="12 19 5 12 12 5"
        ></polyline></svg
      >
    </button>
  </div>

  <div class="scroll-container">
    <div class="content-wrapper">
      <div class="form-card">
        {#if currentStep === 1}
          <div class="title-section" in:slide>
            <h1 class="main-title">
               {returnUrl.includes('login') ? 'FORGOT PASSWORD' : 'CHANGE PASSWORD'}
            </h1>
            <p class="sub-title">Enter your email to receive a reset link.</p>
          </div>

          <div class="form-section" in:slide>
            <div class="form-group">
              <label class="label" for="email">Email</label>
              <div
                class="input-field {errorField === 'email'
                  ? 'error-border'
                  : ''}"
              >
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  bind:value={email}
                  on:input={clearMessage}
                  disabled={isLoading}
                />
              </div>
            </div>

            {#if message}
              <div
                class="message-container {messageType}"
                transition:slide={{ duration: 200 }}
              >
                <span>{message}</span>
              </div>
            {/if}

            <button
              class="primary-btn"
              on:click={handleSendEmail}
              disabled={isLoading}
            >
              {#if isLoading}SENDING...{:else}SEND LINK{/if}
            </button>
          </div>
        {:else}
          <div class="icon-wrapper" in:scale>
            <div class="success-circle">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                ><path
                  d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
                ></path><polyline points="22,6 12,13 2,6"></polyline></svg
              >
            </div>
          </div>
          <div class="title-section" style="text-align:center;" in:slide>
            <h1 class="main-title">CHECK YOUR EMAIL</h1>
            <p class="sub-title">
              We sent a link to <span style="color:#10b981; font-weight:600;"
                >{email}</span
              >.<br />
              Please check your inbox.
            </p>
            <p class="footer-text" style="font-size: 13px; opacity: 0.7;">
              (This page will redirect automatically once reset is complete)
            </p>
          </div>
          <div class="footer-text">
            Didn't receive it? <button
              class="resend-link"
              on:click={() => {
                currentStep = 1;
              }}>Resend</button
            >
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  @import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap");

  .resend-link {
    background: none;
    border: none;
    color: #10b981;
    font-weight: 600;
    cursor: pointer;
    text-decoration: underline;
  }

  :global(body) {
    margin: 0;
    padding: 0;
    background-color: #111827;
    color: white;
    font-family: "Inter", sans-serif;
    overflow: hidden;
  }
  .app-screen {
    height: 100vh;
    display: flex;
    flex-direction: column;
    position: relative;
  }
  .glass-header {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 80px;
    z-index: 50;
    background: rgba(17, 24, 39, 0.95);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(17, 24, 39, 0.95);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .back-btn {
    position: absolute;
    left: 20px;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    cursor: pointer;
    transition: 0.2s;
    padding: 0;
  }
  .scroll-container {
    flex: 1;
    overflow-y: auto;
    padding-top: 100px;
  }
  .content-wrapper {
    width: 100%;
    max-width: 400px;
    margin: 0 auto;
    padding: 0 20px;
    box-sizing: border-box;
  }
  .form-card {
    width: 100%;
    display: flex;
    flex-direction: column;
  }
  .title-section {
    text-align: left;
    margin-bottom: 32px;
  }
  .main-title {
    color: #f3f4f6;
    font-size: 28px;
    font-weight: 700;
    line-height: 1.2;
    margin: 0 0 12px 0;
  }
  .sub-title {
    color: #9ca3af;
    font-size: 14px;
    line-height: 1.5;
  }
  .form-section {
    display: flex;
    flex-direction: column;
  }
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 24px;
  }
  .label {
    color: #f3f4f6;
    font-size: 18px;
    font-weight: 600;
  }
  .input-field {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 54px;
    padding: 0 16px;
    background: #1f2937;
    border: 2px solid #374151;
    border-radius: 12px;
    transition: all 0.2s;
  }
  .input-field:focus-within {
    border-color: #10b981;
    background: #111827;
  }
  .input-field.error-border {
    border-color: #ef4444 !important;
    background-color: rgba(239, 68, 68, 0.05) !important;
    box-shadow: 0 0 0 1px rgba(239, 68, 68, 0.5) !important;
  }
  .input-field input {
    flex: 1;
    border: none;
    background: transparent;
    color: #f3f4f6;
    font-size: 16px;
    outline: none;
    height: 100%;
  }
  .toggle-password {
    background: none;
    border: none;
    color: #9ca3af;
    cursor: pointer;
    padding: 8px;
    margin-right: -8px;
  }
  .message-container {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px 14px;
    border-radius: 8px;
    margin-bottom: 24px;
    font-size: 13px;
    font-weight: 600;
    gap: 10px;
    width: 100%;
    box-sizing: border-box;
  }
  .message-container.error {
    background-color: #fef2f2;
    border: 1px solid #fecaca;
    color: #b91c1c;
  }
  .message-container.success {
    background-color: #ecfdf5;
    border: 1px solid #a7f3d0;
    color: #047857;
  }
  .primary-btn {
    width: 100%;
    padding: 14px 16px;
    background: #10b981;
    color: #111827;
    font-size: 16px;
    font-weight: 700;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    transition: background 0.2s;
    text-transform: uppercase;
    box-shadow: 0 4px 6px rgba(16, 185, 129, 0.2);
  }
  .icon-wrapper {
    margin-bottom: 32px;
    display: flex;
    justify-content: center;
  }
  .success-circle {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    background: rgba(16, 185, 129, 0.1);
    border: 2px solid #10b981;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #10b981;
    box-shadow: 0 0 20px rgba(16, 185, 129, 0.2);
  }
  .footer-text {
    text-align: center;
    color: #9ca3af;
    font-size: 14px;
    margin-top: 14px;
  }
</style>