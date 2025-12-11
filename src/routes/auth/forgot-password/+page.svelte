<script lang="ts">
  import { goto } from "$app/navigation";
  import { slide, scale } from "svelte/transition";
  import { onMount, onDestroy } from "svelte";

  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  let currentStep = 1;
  let isLoading = false;
  let channel: BroadcastChannel;

  onMount(() => {
    channel = new BroadcastChannel("auth-sync");

    channel.onmessage = (event) => {
      if (event.data === "password-reset-success") {
        try {
          window.close();
        } catch (e) {}
        goto("/auth/login");
      }
    };
  });

  onDestroy(() => {
    if (channel) channel.close();
  });

  let message: string = "";
  let messageType: "error" | "success" = "error";
  let messageTimeout: any;
  let errorField: string = "";

  function showMessage(
    msg: string,
    type: "error" | "success" = "error",
    field: string = ""
  ) {
    if (messageTimeout) clearTimeout(messageTimeout);
    message = msg;
    messageType = type;
    if (field) errorField = field;
    messageTimeout = setTimeout(() => {
      message = "";
      errorField = "";
    }, 3000);
  }

  function clearMessage() {
    if (message) {
      message = "";
      errorField = "";
      if (messageTimeout) clearTimeout(messageTimeout);
    }
  }

  let email: string = "";

  function validateEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  async function handleSendEmail(): Promise<void> {
    clearMessage();
    if (!email)
      return showMessage("Please enter your email.", "error", "email");
    if (!validateEmail(email))
      return showMessage(
        "Please enter a valid email address.",
        "error",
        "email"
      );

    isLoading = true;
    try {
      const res = await fetch(`${API_BASE}/api/users/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        currentStep = 2;
      } else {
        showMessage(data.detail || "Failed to send email.", "error", "email");
      }
    } catch (error) {
      showMessage("Cannot connect to server.", "error", "email");
    } finally {
      isLoading = false;
    }
  }

  function handleBack() {
    if (currentStep === 2) {
      currentStep = 1;
    } else {
      goto("/auth/login");
    }
  }
</script>

<div class="app-screen">
  <div class="glass-header">
    <button
      class="back-btn"
      aria-label="Back"
      on:click={handleBack}
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
      >
        <line x1="19" y1="12" x2="5" y2="12"></line>
        <polyline points="12 19 5 12 12 5"></polyline>
      </svg>
    </button>
  </div>

  <div class="scroll-container">
    <div class="content-wrapper">
      <div class="form-card">
        {#if currentStep === 1}
          <div class="title-section" in:slide>
            <h1 class="main-title">FORGOT PASSWORD</h1>
            <p class="sub-title">
              Please enter your email to reset the password
            </p>
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
              {#if isLoading}
                SENDING...
              {:else}
                SEND LINK
              {/if}
            </button>
          </div>
        {/if}

        {#if currentStep === 2}
          <div class="icon-wrapper" in:scale={{ duration: 400, start: 0.5 }}>
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
              >
                <path
                  d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
                ></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
            </div>
          </div>
          <div class="title-section" style="text-align: center;" in:slide>
            <h1 class="main-title">CHECK YOUR EMAIL</h1>
            <p class="sub-title">
              We sent a reset link to <span
                style="color: white; font-weight: 600;">{email}</span
              ><br />
              Please click the link in that email to set a new password.
            </p>
          </div>
          <div class="footer-text">
            Haven’t got the email yet?
            <button
              class="resend-link"
              on:click={() => {
                currentStep = 1;
                handleSendEmail();
              }}
              disabled={isLoading}>Resend email</button
            >
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  @import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap");

  :global(body) {
    margin: 0;
    padding: 0;
    background-color: #111827;
    color: white;
    font-family: "Inter", sans-serif;
    overflow: hidden;
  }
  :global(*) {
    font-family: "Inter", sans-serif !important;
  }
  :global(::placeholder) {
    font-family: "Inter", sans-serif !important;
    color: #6b7280;
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
    -webkit-backdrop-filter: blur(12px);
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
  .back-btn:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  .scroll-container {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
    padding-top: 100px;
    padding-bottom: 40px;
  }
  .scroll-container::-webkit-scrollbar {
    display: none;
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
    margin: 0;
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
  .input-field input {
    flex: 1;
    border: none;
    background: transparent;
    color: #f3f4f6;
    font-size: 16px;
    outline: none;
    height: 100%;
    padding: 0;
  }
  .error-border {
    border-color: #ef4444 !important;
    box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.25) !important;
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
    text-align: center;
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
  .primary-btn:hover {
    background: #059669;
  }
  .primary-btn:active {
    transform: scale(0.98);
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
    margin-top: 24px;
  }
  .resend-link {
    background: none;
    border: none;
    padding: 0;
    color: #10b981;
    font-size: 14px;
    font-weight: 600;
    text-decoration: underline;
    cursor: pointer;
    display: inline;
  }
  .resend-link:hover {
    opacity: 0.8;
  }
</style>
