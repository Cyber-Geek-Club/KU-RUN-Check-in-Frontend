<script lang="ts">
  import { goto } from "$app/navigation";
  import { slide } from "svelte/transition";

  let otpValues: string[] = ["", "", "", "", ""];

  let message: string = "";
  let messageType: "error" | "success" = "error";
  let messageTimeout: any;

  

  let errorOtpIndex: number | null = null;
  const CORRECT_OTP: string = "12345";

  function showMessage(msg: string, type: "error" | "success" = "error") {
    if (messageTimeout) clearTimeout(messageTimeout);
    message = msg;
    messageType = type;
    messageTimeout = setTimeout(() => {
      message = "";
      errorOtpIndex = null;
    }, 3000);
  }

  function clearMessage() {
    if (message) {
      message = "";
      if (messageTimeout) clearTimeout(messageTimeout);
    }
  }

  function handleFocus(index: number) {
    const firstEmptyIndex = otpValues.findIndex((val) => val === "");
    if (firstEmptyIndex !== -1 && index > firstEmptyIndex) {
      const targetInput = document.getElementById(`otp-${firstEmptyIndex}`);
      targetInput?.focus();
    }
  }

  function handleOtpInput(index: number, event: Event): void {
    clearMessage();
    const input = event.target as HTMLInputElement;
    let value = input.value;

    if (!/^\d*$/.test(value)) {
      input.value = "";
      otpValues[index] = "";
      return;
    }

    otpValues[index] = value;

    if (value) {
      let nextEmptyIndex = -1;
      for (let i = index + 1; i < otpValues.length; i++) {
        if (otpValues[i] === "") {
          nextEmptyIndex = i;
          break;
        }
      }

      if (nextEmptyIndex !== -1) {
        const targetInput = document.getElementById(`otp-${nextEmptyIndex}`);
        targetInput?.focus();
      } else if (index < otpValues.length - 1) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        nextInput?.focus();
      }
    }
  }

  function handleKeyDown(index: number, event: KeyboardEvent): void {
    if (event.key === "Backspace") {
      if (!otpValues[index] && index > 0) {
        const prevInput = document.getElementById(`otp-${index - 1}`);
        prevInput?.focus();
      } else {
        otpValues[index] = "";
        clearMessage();
      }
    }
  }

  async function verifyCode(): Promise<void> {
    const enteredOtp = otpValues.join("");

    errorOtpIndex = null; 
    if (enteredOtp.length !== 5) {
      errorOtpIndex = otpValues.indexOf("");
      showMessage("Please enter all 5 digits.");
      return;
    }

    if (enteredOtp !== CORRECT_OTP) {
      errorOtpIndex = 0; 
      showMessage("Invalid OTP code. Please try again.");
      return;
    }

    await goto("/reset-password-3");
  }

  function handleResend() {
    showMessage("Email resent successfully!", "success");
  }
</script>

<div class="app-screen">
  <div class="glass-header">
    <a href="/reset-password" class="back-btn" aria-label="Back">
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
          <h1 class="main-title">CHECK YOUR EMAIL</h1>
          <p class="sub-title">
            We sent a reset link to <span
              style="color: white; font-weight: 600;">nisitreset@ku.th</span
            ><br />
            enter 5 digit code that mentioned in email
          </p>
        </div>

        <div class="form-section">
          <div class="otp-container">
            {#each otpValues as _, index}
              <input
                id="otp-{index}"
                type="text"
                maxlength="1"
                class="otp-box"
                class:error-border={errorOtpIndex === index}
                bind:value={otpValues[index]}
                on:input={(e) => handleOtpInput(index, e)}
                on:keydown={(e) => handleKeyDown(index, e)}
                on:focus={() => handleFocus(index)}
                on:click={() => handleFocus(index)}
                inputmode="numeric"
              />
            {/each}
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

          <button class="primary-btn" type="button" on:click={verifyCode}>
            VERIFY CODE
          </button>

          <div class="footer-text">
            Haven’t got the email yet?
            <button class="resend-link" on:click={handleResend}>
              Resend email
            </button>
          </div>
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

  .error-border {
    border-color: #ef4444 !important;
    box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.25) !important;
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

  .otp-container {
    display: flex;
    justify-content: space-between;
    margin-bottom: 32px;
    gap: 8px;
  }

  .otp-box {
    width: 100%;
    height: 60px;
    background: #1f2937;
    border: 2px solid #374151;
    border-radius: 12px;
    color: white;
    font-size: 24px;
    font-weight: 700;
    text-align: center;
    outline: none;
    transition: all 0.2s;
    caret-color: #10b981;
  }

  .otp-box:focus {
    border-color: #10b981;
    background: #111827;
    box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
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
    font-family: "Inter", sans-serif !important;
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
