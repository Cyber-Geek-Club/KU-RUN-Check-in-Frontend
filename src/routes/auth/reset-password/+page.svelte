<script lang="ts">
  import { goto } from "$app/navigation";
  import { slide, scale, fade } from "svelte/transition";
  import { page } from "$app/stores";
  import { onMount, onDestroy } from "svelte";

  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  let currentStep = 1;
  let isLoading = false;
  let token: string | null = null;

  let message: string = "";
  let messageType: "error" | "success" = "error";
  let messageTimeout: any;
  let errorField: "password" | "confirmPassword" | "" = "";

  let password = "";
  let confirmPassword = "";
  let showPassword1 = false;
  let showPassword2 = false;

  onMount(() => {
    token = $page.url.searchParams.get("token");
    if (!token) {
      showMessage("Invalid link. Token is missing.", "error");
    }
  });

  onDestroy(() => {
    if (messageTimeout) clearTimeout(messageTimeout);
  });

  function showMessage(
    msg: string,
    type: "error" | "success" = "error",
    field: "password" | "confirmPassword" | "" = ""
  ) {
    if (messageTimeout) clearTimeout(messageTimeout);
    message = msg;
    messageType = type;
    errorField = field;
    const duration = type === "error" ? 5000 : 3000;
    messageTimeout = setTimeout(() => {
      message = "";
      errorField = "";
    }, duration);
  }
  function clearMessage() {
    if (message) {
      message = "";
      errorField = "";
    }
  }
  function validatePassword(v: string) {
    return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(v);
  }


  async function handleResetPassword(): Promise<void> {
    clearMessage();
    if (isLoading) return;

    if (!token) return showMessage("Invalid link.", "error");
    if (!password) return showMessage("Enter password.", "error", "password");
    if (!validatePassword(password))
      return showMessage(
        "Password must be 8+ chars & include a number.",
        "error",
        "password"
      );
    if (!confirmPassword)
      return showMessage("Confirm password.", "error", "confirmPassword");
    if (password !== confirmPassword)
      return showMessage("Passwords do not match.", "error", "confirmPassword");

    isLoading = true;
    try {
      const res = await fetch(`${API_BASE}/api/users/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: password }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        currentStep = 2;
        localStorage.setItem("password_reset_done", Date.now().toString());
      } else {
        const detail = data.detail || "Failed to reset password.";
        let backendField: "password" | "confirmPassword" | "" = "";
        if (detail.toLowerCase().includes("password"))
          backendField = "password";
        showMessage(detail, "error", backendField);
      }
    } catch (error) {
      showMessage("Cannot connect to server.", "error");
    } finally {
      isLoading = false;
    }
  }

  function handleBack() {
    if (!isLoading && currentStep !== 2) {
      goto("/auth/login");
    }
  }
</script>

<div class="app-screen">
  <div class="scroll-container">
    <div class="content-wrapper">
      <div class={currentStep === 2 ? "success-card" : "form-card"}>
        {#if currentStep === 1}
          <div class="title-section" in:slide>
            <h1 class="main-title">SET NEW PASSWORD</h1>
            <p class="sub-title">
              Create a new password. Ensure it differs from previous ones.
            </p>
          </div>
          <div class="form-section" in:slide>
            <form on:submit|preventDefault={handleResetPassword}>
              <div class="form-group">
                <label class="label" for="new-password">New Password</label>
                <div
                  class="input-field {errorField === 'password'
                    ? 'error-border'
                    : ''}"
                >
                  <input
                    id="new-password"
                    type={showPassword1 ? "text" : "password"}
                    placeholder="Enter new password"
                    bind:value={password}
                    on:input={clearMessage}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    class="toggle-password"
                    on:click={() => (showPassword1 = !showPassword1)}
                    tabindex="-1"
                  >
                    {#if showPassword1}
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        ><path
                          d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
                        ></path><line x1="1" y1="1" x2="23" y2="23"></line></svg
                      >
                    {:else}
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        ><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                        ></path><circle cx="12" cy="12" r="3"></circle></svg
                      >
                    {/if}
                  </button>
                </div>
              </div>

              <div class="form-group">
                <label class="label" for="confirm-password"
                  >Confirm Password</label
                >
                <div
                  class="input-field {errorField === 'confirmPassword'
                    ? 'error-border'
                    : ''}"
                >
                  <input
                    id="confirm-password"
                    type={showPassword2 ? "text" : "password"}
                    placeholder="Confirm new password"
                    bind:value={confirmPassword}
                    on:input={clearMessage}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    class="toggle-password"
                    on:click={() => (showPassword2 = !showPassword2)}
                    tabindex="-1"
                  >
                    {#if showPassword2}
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        ><path
                          d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
                        ></path><line x1="1" y1="1" x2="23" y2="23"></line></svg
                      >
                    {:else}
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        ><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                        ></path><circle cx="12" cy="12" r="3"></circle></svg
                      >
                    {/if}
                  </button>
                </div>
              </div>

              {#if message}
                <div
                  class="message-container {messageType}"
                  transition:slide={{ duration: 200 }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    {#if messageType === "error"}
                      <circle cx="12" cy="12" r="10"></circle><line
                        x1="12"
                        y1="8"
                        x2="12"
                        y2="12"
                      ></line><line x1="12" y1="16" x2="12.01" y2="16"></line>
                    {:else}
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"
                      ></path><polyline points="22 4 12 14.01 9 11.01"
                      ></polyline>
                    {/if}
                  </svg>
                  <span>{message}</span>
                </div>
              {/if}

              <button class="primary-btn" type="submit" disabled={isLoading}>
                {#if isLoading}UPDATING...{:else}RESET PASSWORD{/if}
              </button>
            </form>
          </div>
        {:else}
          <div class="icon-wrapper" in:scale={{ duration: 400, start: 0.5 }}>
            <div class="success-circle">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
                ><polyline points="20 6 9 17 4 12"></polyline></svg
              >
            </div>
          </div>

          <div class="title-section" style="text-align: center;" in:slide>
            <h1 class="main-title success-text">PASSWORD UPDATED</h1>
            <p class="sub-title">
              Your password has been reset successfully.<br />
              <span
                style="color: #9ca3af; font-weight: 500; display: block; margin-top: 12px;"
              >
                You can close this window now.
              </span>
            </p>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  /* CSS เดิมทั้งหมด */
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
  .back-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.2);
  }
  .back-btn:disabled {
    opacity: 0.5;
    cursor: default;
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
  .success-card {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding-top: 40px;
  }
  .title-section {
    text-align: left;
    margin-bottom: 32px;
  }
  .success-card .title-section {
    text-align: center;
    margin-bottom: 40px;
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
  .success-text {
    color: #10b981;
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
    font-size: 16px;
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
    padding: 0;
    min-width: 0;
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
    font-weight: 500;
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
</style>
