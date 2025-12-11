<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { scale, fade } from "svelte/transition";

  const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

  let status: "verifying" | "success" | "error" = "verifying";
  let message = "Verifying your email...";
  let countdown = 3;

  onMount(async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");

    if (!token) {
      status = "error";
      message = "Invalid link. Token is missing.";
      return;
    }

    try {
      const base = API_BASE || window.location.origin;
      const res = await fetch(`${base}/api/users/verify-email?token=${token}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        status = "success";
        message = "Your email has been successfully verified.";

        const channel = new BroadcastChannel("auth-sync");
        channel.postMessage("register-verified");
        channel.close();

        const timer = setInterval(() => {
          countdown--;
          if (countdown <= 0) {
            clearInterval(timer);
            goto("/auth/login");
          }
        }, 1000);
      } else {
        const data = await res.json().catch(() => ({}));
        status = "error";
        message =
          data.detail || "Verification failed. The link may be expired.";
      }
    } catch (e) {
      status = "error";
      message = "Cannot connect to server. Please try again later.";
    }
  });
</script>

<div class="app-screen">
  <div class="card-container">
    {#if status === "verifying"}
      <div class="content" in:fade>
        <div class="loader"></div>
        <h2 class="title">Verifying...</h2>
        <p class="desc">Please wait while we verify your email.</p>
      </div>
    {:else if status === "success"}
      <div class="content" in:scale={{ duration: 400, start: 0.8 }}>
        <div class="icon success">
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        </div>
        <h2 class="title success-text">Verified!</h2>
        <p class="desc">{message}</p>
        <div class="redirect-box">
          Redirecting to login in <span class="count">{countdown}</span>s
        </div>
      </div>
    {:else}
      <div class="content" in:scale={{ duration: 400, start: 0.8 }}>
        <div class="icon error">
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
        </div>
        <h2 class="title error-text">Verification Failed</h2>
        <p class="desc">{message}</p>
        <button class="primary-btn" on:click={() => goto("/auth/login")}>
          Back to Login
        </button>
      </div>
    {/if}
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

  .app-screen {
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    padding: 20px;
  }

  .card-container {
    background: #1f2937;
    width: 100%;
    max-width: 400px;
    padding: 40px 30px;
    border-radius: 16px;
    border: 1px solid #374151;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
    text-align: center;
  }

  .content {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .title {
    font-size: 24px;
    font-weight: 700;
    margin: 20px 0 10px;
    color: #f3f4f6;
  }
  .desc {
    color: #9ca3af;
    font-size: 15px;
    line-height: 1.5;
    margin-bottom: 24px;
  }
  .success-text {
    color: #10b981;
  }
  .error-text {
    color: #ef4444;
  }

  .icon {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 10px;
  }
  .icon.success {
    background: rgba(16, 185, 129, 0.1);
    border: 2px solid #10b981;
    color: #10b981;
    box-shadow: 0 0 20px rgba(16, 185, 129, 0.2);
  }
  .icon.error {
    background: rgba(239, 68, 68, 0.1);
    border: 2px solid #ef4444;
    color: #ef4444;
    box-shadow: 0 0 20px rgba(239, 68, 68, 0.2);
  }

  .redirect-box {
    background: rgba(255, 255, 255, 0.05);
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 14px;
    color: #d1d5db;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  .count {
    color: #10b981;
    font-weight: 700;
    font-size: 16px;
  }

  .loader {
    width: 60px;
    height: 60px;
    border: 4px solid rgba(255, 255, 255, 0.1);
    border-top: 4px solid #10b981;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 20px;
  }
  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  .primary-btn {
    width: 100%;
    padding: 14px 16px;
    background: #374151;
    color: white;
    font-size: 16px;
    font-weight: 600;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    transition: background 0.2s;
  }
  .primary-btn:hover {
    background: #4b5563;
  }
</style>
