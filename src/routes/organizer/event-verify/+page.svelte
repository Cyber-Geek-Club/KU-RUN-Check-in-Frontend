<script lang="ts">
  import Swal from "sweetalert2";
  import OrganizerLayout from "$lib/components/organizer/OrganizerLayout.svelte";
  import { lang } from '$lib/stores/organizerStore';
  import { checkInByCode, checkOutByCode } from '$lib/api/organizerApi';

  $: t = $lang;

  let pins = ["", "", "", "", ""];
  let inputRefs: HTMLInputElement[] = [];

  let errorMessage = "";
  let isVerifying = false;
  let errorTimeout: any;
  let errorIndex: number | null = null;

  // Check-in or Check-out mode
  let mode: 'check-in' | 'check-out' = 'check-in';

  function handleFocus(index: number) {
    const firstEmptyIndex = pins.findIndex((p) => p === "");
    if (firstEmptyIndex !== -1 && index > firstEmptyIndex) {
      inputRefs[firstEmptyIndex]?.focus();
    }
  }

  function handleInput(index: number, event: Event) {
    if (errorMessage) errorMessage = "";
    const input = event.target as HTMLInputElement;
    let value = input.value;
    value = value.replace(/\D/g, "");

    pins[index] = value;
    input.value = value;

    if (value !== "" && errorIndex === index) {
      errorIndex = null;
    }

    if (value.length === 1) {
      const nextEmptyIndex = pins.findIndex((p, i) => i > index && p === "");
      if (nextEmptyIndex !== -1) {
        inputRefs[nextEmptyIndex]?.focus();
      } else if (index < 4) {
        inputRefs[index + 1]?.focus();
      }
    }

    if (pins.every((p) => p !== "")) {
      errorIndex = null;
    }
  }

  function handleKeydown(index: number, event: KeyboardEvent) {
    if (errorMessage) errorMessage = "";
    if (event.key === "Backspace") {
      if (pins[index]) {
        pins[index] = "";
        errorIndex = index;
      } else {
        if (index > 0) {
          errorIndex = index - 1;
          inputRefs[index - 1]?.focus();
        }
      }
    }
  }

  async function handleVerify() {
    const finalPin = pins.join("");
    if (finalPin.length !== 5) {
      const firstEmpty = pins.findIndex((p) => p === "");
      errorIndex = firstEmpty !== -1 ? firstEmpty : 4;
      errorMessage = t.enterFullCode || "Please enter the full 5-digit code.";
      inputRefs[errorIndex]?.focus();
      triggerErrorTimeout();
      return;
    }

    isVerifying = true;
    errorMessage = "";
    errorIndex = null;

    try {
      const data = mode === 'check-in' 
        ? await checkInByCode(finalPin)
        : await checkOutByCode(finalPin);

      console.log(`${mode} Success:`, data);
      const participantName =
        data.participant?.user?.first_name ||
        data.participant_name ||
        t.participant || "Participant";

      const successTitle = mode === 'check-in' 
        ? (t.checkInSuccess || "Check-in Successful!")
        : (t.checkOutSuccess || "Check-out Successful!");
      
      const successText = mode === 'check-in'
        ? `${participantName} ${t.hasBeenCheckedIn || "has been checked in."}`
        : `${participantName} ${t.hasBeenCheckedOut || "has been checked out."}`;

      await Swal.fire({
        icon: "success",
        title: successTitle,
        text: successText,
        timer: 2000,
        showConfirmButton: false,
        background: "#fff",
        color: "#111827",
      });
      pins = ["", "", "", "", ""];
      inputRefs[0]?.focus();
    } catch (err: any) {
      console.error(`${mode} Error:`, err);
      errorMessage = err.message || (t.invalidCodeOrFailed || "Invalid code or operation failed");
      errorIndex = 0;
      triggerErrorTimeout();
      pins = ["", "", "", "", ""];
      inputRefs[0]?.focus();
    } finally {
      isVerifying = false;
    }
  }

  function triggerErrorTimeout() {
    if (errorTimeout) clearTimeout(errorTimeout);
    errorTimeout = setTimeout(() => {
      errorMessage = "";
      errorIndex = null;
    }, 3000);
  }
</script>

<OrganizerLayout>
<div class="app-screen">
  <div class="page-header">
    <h1 class="page-title">{t.verifyCode || 'VERIFY CODE'}</h1>
    <p class="page-subtitle">{t.verifyCodeDesc || 'Verify participants with PIN code'}</p>
  </div>

  <div class="scroll-container">
    <div class="content-wrapper">
      <!-- Mode Toggle -->
      <div class="mode-toggle">
        <button 
          class="mode-btn {mode === 'check-in' ? 'active' : ''}"
          on:click={() => mode = 'check-in'}
        >
          ✅ {t.checkIn || 'Check In'}
        </button>
        <button 
          class="mode-btn {mode === 'check-out' ? 'active' : ''}"
          on:click={() => mode = 'check-out'}
        >
          🚪 {t.checkOut || 'Check Out'}
        </button>
      </div>

      <div class="verify-card">
        <div class="card-header-wrapper">
          <h2 class="card-title">{t.verifyParticipant || 'Verify Participant'}</h2>
        </div>

        <p class="card-desc">
          {#if mode === 'check-in'}
            {t.enterPinCheckIn || "Enter the participant's 5-digit PIN code to check-in."}
          {:else}
            {t.enterPinCheckOut || "Enter the participant's 5-digit PIN code to check-out."}
          {/if}
        </p>

        <div class="pin-section">
          <h3 class="input-label">{t.pinCode || 'PIN CODE'}</h3>
          <div class="pin-inputs-wrapper">
            {#each pins as _, i}
              <input
                type="text"
                inputmode="numeric"
                maxlength="1"
                class="pin-box {errorIndex !== null &&
                (errorMessage ? true : errorIndex === i)
                  ? 'error-border'
                  : ''}"
                bind:value={pins[i]}
                bind:this={inputRefs[i]}
                on:input={(e) => handleInput(i, e)}
                on:keydown={(e) => handleKeydown(i, e)}
                on:focus={() => handleFocus(i)}
                on:click={() => handleFocus(i)}
                disabled={isVerifying}
              />
            {/each}
          </div>
        </div>

        {#if errorMessage}
          <div class="error-container">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#EF4444"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              style="margin-right: 6px; flex-shrink: 0;"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span class="error-text">{errorMessage}</span>
          </div>
        {/if}

        <button
          class="submit-btn {mode === 'check-out' ? 'checkout' : ''}"
          on:click={handleVerify}
          disabled={isVerifying}
        >
          {#if isVerifying}
            {t.verifying || 'Verifying...'}
          {:else if mode === 'check-in'}
            {t.checkIn || 'CHECK IN'}
          {:else}
            {t.checkOut || 'CHECK OUT'}
          {/if}
        </button>
      </div>
    </div>
  </div>
</div>
</OrganizerLayout>

<style>
  @import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap");

  .app-screen {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    padding: 0 1rem;
  }

  .page-header {
    text-align: center;
    margin-bottom: 1.5rem;
    padding-top: 1rem;
  }

  .page-title {
    font-size: 1.75rem;
    font-weight: 700;
    color: white;
    margin: 0 0 0.5rem 0;
    letter-spacing: 1px;
  }

  .page-subtitle {
    font-size: 0.875rem;
    color: #94a3b8;
    margin: 0;
  }

  .scroll-container {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 40px;
  }

  .content-wrapper {
    width: 100%;
    max-width: 400px;
    margin: 0 auto;
    padding: 0 20px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .mode-toggle {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
    padding: 0.5rem;
    background: rgba(15, 23, 42, 0.6);
    border-radius: 16px;
    border: 1px solid rgba(100, 116, 139, 0.3);
    width: 100%;
    max-width: 350px;
  }

  .mode-btn {
    flex: 1;
    padding: 0.75rem 1rem;
    background: transparent;
    border: none;
    border-radius: 12px;
    color: #94a3b8;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
  }

  .mode-btn:hover {
    background: rgba(16, 185, 129, 0.1);
    color: #10b981;
  }

  .mode-btn.active {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
  }

  .verify-card {
    background: white;
    width: 100%;
    max-width: 350px;
    border-radius: 20px;
    padding: 30px 24px;
    box-sizing: border-box;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    text-align: center;
  }

  .card-header-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 12px;
  }

  .card-title {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: #111827;
  }

  .card-desc {
    color: #6b7280;
    font-size: 14px;
    margin: 0 0 30px 0;
  }

  .input-label {
    font-size: 12px;
    font-weight: 700;
    color: #374151;
    margin-bottom: 12px;
    text-transform: uppercase;
    display: block;
  }
  .pin-inputs-wrapper {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin-bottom: 20px;
  }
  .pin-box {
    width: 100%;
    max-width: 50px;
    height: 50px;
    border: 2px solid #374151;
    border-radius: 10px;
    text-align: center;
    font-size: 24px;
    font-weight: 600;
    color: #111827;
    background: #f9fafb;
    outline: none;
    padding: 0;
    transition: all 0.2s;
  }
  .pin-box:focus {
    border-color: #10b981;
    box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
    background: white;
  }
  .pin-box:disabled {
    background-color: #e5e7eb;
    color: #9ca3af;
    cursor: not-allowed;
  }
  .pin-box.error-border {
    border-color: #ef4444 !important;
    box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.25) !important;
  }
  .error-container {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
    background-color: #fef2f2;
    padding: 10px;
    border-radius: 8px;
    border: 1px solid #fecaca;
    animation: fadeIn 0.3s ease;
  }
  .error-text {
    color: #b91c1c;
    font-size: 13px;
    font-weight: 500;
  }
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-5px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  .submit-btn {
    width: 100%;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    border: none;
    padding: 14px;
    border-radius: 10px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    text-transform: uppercase;
  }
  .submit-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
  }
  .submit-btn:disabled {
    background: #9ca3af;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
  .submit-btn.checkout {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  }
  .submit-btn.checkout:hover {
    box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);
  }
  @media (max-width: 380px) {
    .pin-box {
      height: 48px;
      font-size: 20px;
    }
    .verify-card {
      padding: 24px 16px;
    }
  }
</style>
