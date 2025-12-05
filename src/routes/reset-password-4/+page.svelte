<script lang="ts">
  import { goto } from "$app/navigation";
  import { slide } from "svelte/transition";

  let password: string = "";
  let confirmPassword: string = "";

  let showPassword1: boolean = false;
  let showPassword2: boolean = false;

  let message: string = "";
  let messageType: "error" | "success" = "error";
  let messageTimeout: any;

  let errorField: string = "";

  function validatePassword(value: string): boolean {
    return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(value);
  }

  function showMessage(msg: string, type: "error" | "success" = "error") {
    if (messageTimeout) clearTimeout(messageTimeout);
    message = msg;
    messageType = type;
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

  async function handleReset(): Promise<void> {
    clearMessage();
    errorField = "";

    if (!password) {
      errorField = "password";
      showMessage("Please enter a new password.");
      return;
    }

    if (!validatePassword(password)) {
      errorField = "password";
      showMessage("Password must be at least 8 chars & include a number.");
      return;
    }

    if (password && !confirmPassword) {
      errorField = "confirmPassword";
      showMessage("Please confirm your password.");
      return;
    }

    if (password !== confirmPassword) {
      errorField = "confirmPassword";
      showMessage("Passwords do not match.");
      return;
    }

    await goto("/login");
  }
</script>

<div class="app-screen">
  <div class="glass-header">
    <a href="/reset-password-3" class="back-btn" aria-label="Back">
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
    </a>
  </div>

  <div class="scroll-container">
    <div class="content-wrapper">
      <div class="form-card">
        <div class="title-section">
          <h1 class="main-title">SET A NEW PASSWORD</h1>
          <p class="sub-title">
            Create a new password. Ensure it differs from<br />previous ones for
            security.
          </p>
        </div>

        <div class="form-section">
          <div class="form-group">
            <label class="label" for="new-password">Password</label>
            <div
              class="input-field"
              class:error-border={errorField === "password"}
            >
              <input
                id="new-password"
                type={showPassword1 ? "text" : "password"}
                placeholder="Enter new password"
                bind:value={password}
                on:input={clearMessage}
              />
              <button
                type="button"
                class="toggle-password"
                on:click={() => (showPassword1 = !showPassword1)}
                aria-label="Toggle Password Visibility"
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
                    ><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                    ></path><circle cx="12" cy="12" r="3"></circle></svg
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
                    ><path
                      d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
                    ></path><line x1="1" y1="1" x2="23" y2="23"></line></svg
                  >
                {/if}
              </button>
            </div>
          </div>

          <div class="form-group">
            <label class="label" for="confirm-password">Confirm Password</label>
            <div
              class="input-field"
              class:error-border={errorField === "confirmPassword"}
            >
              <input
                id="confirm-password"
                type={showPassword2 ? "text" : "password"}
                placeholder="Confirm new password"
                bind:value={confirmPassword}
                on:input={clearMessage}
              />
              <button
                type="button"
                class="toggle-password"
                on:click={() => (showPassword2 = !showPassword2)}
                aria-label="Toggle Password Visibility"
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
                    ><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                    ></path><circle cx="12" cy="12" r="3"></circle></svg
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
                    ><path
                      d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
                    ></path><line x1="1" y1="1" x2="23" y2="23"></line></svg
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
                ><circle cx="12" cy="12" r="10"></circle><line
                  x1="12"
                  y1="8"
                  x2="12"
                  y2="12"
                ></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg
              >
              <span>{message}</span>
            </div>
          {/if}

          <button class="primary-btn" type="button" on:click={handleReset}>
            RESET PASSWORD
          </button>
        </div>
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

  :global(button),
  :global(input),
  :global(textarea),
  :global(select),
  :global(h1),
  :global(h2),
  :global(h3),
  :global(h4),
  :global(h5),
  :global(h6),
  :global(p),
  :global(span),
  :global(a),
  :global(div),
  :global(label) {
    font-family: "Inter", sans-serif !important;
  }

  :global(::placeholder) {
    font-family: "Inter", sans-serif !important;
  }


  .app-screen {
    height: 100vh;
    display: flex;
    flex-direction: column;
    position: relative;
  }

  .error-border {
    border-color: #ef4444 !important;
    box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.25) !important;
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

  .input-field input::placeholder {
    color: #6b7280;
  }

  .toggle-password {
    background: none;
    border: none;
    color: #9ca3af;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    transition: color 0.2s;
  }
  .toggle-password:hover {
    color: #f3f4f6;
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
</style>
