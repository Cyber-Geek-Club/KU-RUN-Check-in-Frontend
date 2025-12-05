<script lang="ts">
  import { goto } from "$app/navigation";
  import { slide } from "svelte/transition";

  let email: string = "";

  let message: string = "";
  let messageType: "error" | "success" = "error";
  let messageTimeout: any;

  let errorActive: boolean = false;

  function validateEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function showMessage(msg: string, type: "error" | "success" = "error") {
    if (messageTimeout) clearTimeout(messageTimeout);

    message = msg;
    messageType = type;

    errorActive = type === "error";

    messageTimeout = setTimeout(() => {
      message = "";
      errorActive = false;
    }, 3000);
  }

  function clearMessage() {
    if (message) {
      message = "";
      errorActive = false;
      if (messageTimeout) clearTimeout(messageTimeout);
    }
  }

  async function handleReset(): Promise<void> {
    clearMessage();

    if (!email) {
      showMessage("Please enter your email.");
      return;
    }
    if (!validateEmail(email)) {
      showMessage("Please enter a valid email address.");
      return;
    }

    await goto("/reset-password-2");
  }
</script>

<div class="app-screen">
  <div class="glass-header">
    <a href="/login" class="back-btn" aria-label="Back">
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
          <h1 class="main-title">FORGOT PASSWORD</h1>
          <p class="sub-title">Please enter your email to reset the password</p>
        </div>

        <div class="form-section">
          <div class="form-group">
            <label class="label" for="email">Email</label>
            <div class="input-field {errorActive ? 'error-border' : ''}">
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                bind:value={email}
                on:input={clearMessage}
              />
            </div>
          </div>

          {#if message}
            <div
              class="message-container {messageType}"
              transition:slide={{ duration: 200 }}
            >
              {#if messageType === "error"}
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
                  ><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline
                    points="22 4 12 14.01 9 11.01"
                  ></polyline></svg
                >
              {/if}
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

  .page-title {
    color: white;
    font-size: 20px;
    font-weight: 700;
    margin: 0;
    letter-spacing: 1px;
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

  .error-border {
    border-color: #ef4444 !important;
    box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.25) !important;
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
</style>
