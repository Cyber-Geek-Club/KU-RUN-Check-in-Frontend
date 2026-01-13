<script lang="ts">
  import { goto } from "$app/navigation";
  import { slide, scale, fade } from "svelte/transition";
  import { onMount } from "svelte";

  const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

  let verifyStatus: "loading" | "success" | "error" = "loading";
  let message: string = "Verifying your email...";
  let countdown: number = 5;
  let countdownInterval: any = null;

  onMount(async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");

    if (!token) {
      verifyStatus = "error";
      message = "Oops! We couldn't find a verification token in this link.";
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE}/api/users/verify-email?token=${token}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        verifyStatus = "success";
        message = "Your email has been verified successfully! 🎉";
        localStorage.setItem("register_verified", Date.now().toString());
        const channel = new BroadcastChannel("auth-sync");
        channel.postMessage("register-verified");
        channel.close();
        
        // Start countdown for auto-redirect
        startCountdown();
      } else {
        verifyStatus = "error";
        if (data.detail?.includes("expired") || data.message?.includes("expired")) {
          message = "This verification link has expired. Please request a new one.";
        } else if (data.detail?.includes("already") || data.message?.includes("already")) {
          message = "Great news! Your email is already verified. You can log in now.";
        } else {
          message = data.detail || data.message || "Verification failed. Please try again or contact support.";
        }
      }
    } catch (error) {
      verifyStatus = "error";
      message = "We couldn't connect to the server. Please check your internet connection and try again.";
    }
  });

  function startCountdown() {
    countdownInterval = setInterval(() => {
      countdown--;
      if (countdown <= 0) {
        clearInterval(countdownInterval);
        goto("/auth/login");
      }
    }, 1000);
  }

  function handleGoToLogin() {
    if (countdownInterval) clearInterval(countdownInterval);
    goto("/auth/login");
  }

  function handleBackToHome() {
    if (countdownInterval) clearInterval(countdownInterval);
    goto("/");
  }
</script>

<div class="app-screen">
  <div class="scroll-container">
    <div class="content-wrapper">
      <div class="form-card">
        {#if verifyStatus === "loading"}
          <div class="icon-wrapper" in:scale={{ duration: 400 }}>
            <div class="loader-container">
              <div class="loader"></div>
              <div class="pulse-ring"></div>
            </div>
          </div>
          <div class="title-section" style="text-align: center;" in:slide>
            <h1 class="main-title">Verifying Your Email</h1>
            <p class="sub-title">Hang tight! We're confirming your email address...</p>
            <div class="loading-dots">
              <span></span><span></span><span></span>
            </div>
          </div>
        {/if}

        {#if verifyStatus === "success"}
          <div class="icon-wrapper" in:scale={{ duration: 500, start: 0.3 }}>
            <div class="success-circle">
              <svg
                width="56"
                height="56"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
          </div>
          <div class="title-section" style="text-align: center;" in:slide={{ delay: 200 }}>
            <h1 class="main-title" style="color: #10b981;">All Set! ✓</h1>
            <p class="sub-title success-message">
              {message}
            </p>
            <p class="sub-title" style="margin-top: 20px; color: #d1d5db; font-size: 15px;">
              You're all set to explore KU Run Check-in!
            </p>
          </div>
          <div class="form-section" in:fade={{ delay: 400 }}>
            <div class="countdown-box">
              <p>Redirecting to login in <strong>{countdown}</strong> seconds...</p>
            </div>
            <button class="primary-btn" on:click={handleGoToLogin}>
              <span class="btn-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                  <polyline points="10 17 15 12 10 7"></polyline>
                  <line x1="15" y1="12" x2="3" y2="12"></line>
                </svg>
              </span>
              GO TO LOGIN
            </button>
            <button class="secondary-btn" on:click={handleBackToHome}>
              BACK TO HOME
            </button>
          </div>
        {/if}

        {#if verifyStatus === "error"}
          <div class="icon-wrapper" in:scale={{ duration: 400, start: 0.5 }}>
            <div class="error-circle">
              <svg
                width="56"
                height="56"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
          </div>
          <div class="title-section" style="text-align: center;" in:slide={{ delay: 200 }}>
            <h1 class="main-title" style="color: #ef4444;">
              Verification Issue
            </h1>
            <p class="sub-title error-message">
              {message}
            </p>
            {#if message.includes("already verified")}
              <p class="sub-title" style="margin-top: 16px; color: #10b981; font-weight: 600;">
                ✓ You can proceed to login!
              </p>
            {/if}
          </div>
          <div class="form-section" in:fade={{ delay: 400 }}>
            {#if message.includes("already verified")}
              <button class="primary-btn" on:click={handleGoToLogin}>
                <span class="btn-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                    <polyline points="10 17 15 12 10 7"></polyline>
                    <line x1="15" y1="12" x2="3" y2="12"></line>
                  </svg>
                </span>
                GO TO LOGIN
              </button>
            {:else}
              <button class="primary-btn error-btn" on:click={handleBackToHome}>
                <span class="btn-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                  </svg>
                </span>
                BACK TO HOME
              </button>
            {/if}
            <a href="/auth/register" class="help-link">
              Need to register again? Click here
            </a>
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

  .app-screen {
    height: 100vh;
    display: flex;
    flex-direction: column;
    position: relative;
  }

  .scroll-container {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
    padding-top: 100px;
    padding-bottom: 40px;
    display: flex;
    align-items: flex-start;
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
    font-size: 32px;
    font-weight: 700;
    line-height: 1.2;
    margin: 0 0 16px 0;
    letter-spacing: -0.5px;
  }
  .sub-title {
    color: #9ca3af;
    font-size: 15px;
    margin: 0;
    line-height: 1.6;
  }
  .success-message {
    color: #d1d5db;
    font-size: 16px;
    font-weight: 500;
  }
  .error-message {
    color: #fca5a5;
    font-size: 15px;
    font-weight: 500;
    line-height: 1.7;
  }
  .form-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .primary-btn {
    width: 100%;
    padding: 16px;
    background: #10b981;
    color: #111827;
    font-size: 15px;
    font-weight: 700;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    text-transform: uppercase;
    box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    letter-spacing: 0.5px;
  }
  .primary-btn:hover {
    background: #059669;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
  }
  .primary-btn:active {
    transform: translateY(0);
  }
  .primary-btn.error-btn {
    background: #ef4444;
    color: white;
    box-shadow: 0 4px 14px rgba(239, 68, 68, 0.3);
  }
  .primary-btn.error-btn:hover {
    background: #dc2626;
    box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
  }
  .secondary-btn {
    width: 100%;
    padding: 14px;
    background: transparent;
    color: #9ca3af;
    font-size: 14px;
    font-weight: 600;
    border: 1.5px solid #374151;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .secondary-btn:hover {
    background: rgba(55, 65, 81, 0.3);
    border-color: #4b5563;
    color: #d1d5db;
  }
  .btn-icon {
    display: flex;
    align-items: center;
  }
  .help-link {
    text-align: center;
    color: #60a5fa;
    font-size: 14px;
    text-decoration: none;
    margin-top: 8px;
    padding: 8px;
    transition: color 0.2s;
  }
  .help-link:hover {
    color: #3b82f6;
    text-decoration: underline;
  }
  .countdown-box {
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.3);
    border-radius: 10px;
    padding: 16px;
    text-align: center;
    margin-bottom: 8px;
  }
  .countdown-box p {
    margin: 0;
    color: #d1d5db;
    font-size: 14px;
  }
  .countdown-box strong {
    color: #10b981;
    font-size: 18px;
    font-weight: 700;
  }

  .icon-wrapper {
    margin-bottom: 32px;
    display: flex;
    justify-content: center;
  }
  .loader-container {
    position: relative;
    width: 80px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .success-circle {
    width: 110px;
    height: 110px;
    border-radius: 50%;
    background: rgba(16, 185, 129, 0.15);
    border: 3px solid #10b981;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #10b981;
    box-shadow: 0 0 30px rgba(16, 185, 129, 0.3), 0 0 60px rgba(16, 185, 129, 0.1);
    animation: success-pulse 2s ease-in-out infinite;
  }
  .error-circle {
    width: 110px;
    height: 110px;
    border-radius: 50%;
    background: rgba(239, 68, 68, 0.15);
    border: 3px solid #ef4444;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ef4444;
    box-shadow: 0 0 30px rgba(239, 68, 68, 0.3), 0 0 60px rgba(239, 68, 68, 0.1);
    animation: error-shake 0.5s ease-in-out;
  }

  .loader {
    border: 4px solid rgba(16, 185, 129, 0.2);
    border-top: 4px solid #10b981;
    border-radius: 50%;
    width: 60px;
    height: 60px;
    animation: spin 1s linear infinite;
  }
  .pulse-ring {
    position: absolute;
    width: 80px;
    height: 80px;
    border: 2px solid #10b981;
    border-radius: 50%;
    animation: pulse-ring 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
  }
  
  .loading-dots {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin-top: 20px;
  }
  .loading-dots span {
    width: 8px;
    height: 8px;
    background: #10b981;
    border-radius: 50%;
    animation: loading-bounce 1.4s infinite ease-in-out both;
  }
  .loading-dots span:nth-child(1) {
    animation-delay: -0.32s;
  }
  .loading-dots span:nth-child(2) {
    animation-delay: -0.16s;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  @keyframes pulse-ring {
    0% {
      transform: scale(0.8);
      opacity: 1;
    }
    100% {
      transform: scale(1.3);
      opacity: 0;
    }
  }
  @keyframes success-pulse {
    0%, 100% {
      box-shadow: 0 0 30px rgba(16, 185, 129, 0.3), 0 0 60px rgba(16, 185, 129, 0.1);
    }
    50% {
      box-shadow: 0 0 40px rgba(16, 185, 129, 0.5), 0 0 80px rgba(16, 185, 129, 0.2);
    }
  }
  @keyframes error-shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
    20%, 40%, 60%, 80% { transform: translateX(8px); }
  }
  @keyframes loading-bounce {
    0%, 80%, 100% {
      transform: scale(0);
      opacity: 0.5;
    }
    40% {
      transform: scale(1);
      opacity: 1;
    }
  }
</style>
