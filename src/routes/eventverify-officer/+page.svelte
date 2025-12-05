<script lang="ts">
  import { onMount } from "svelte";

  let pins = ["", "", "", "", ""];
  let inputRefs: HTMLInputElement[] = [];

  let errorMessage = "";
  let isVerifying = false;
  let errorTimeout: any;

  let errorIndex: number | null = null;

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

  function handleVerify() {
    const finalPin = pins.join("");

    if (finalPin.length === 5) {
      errorMessage = "";
      errorIndex = null;
      if (errorTimeout) clearTimeout(errorTimeout);

      isVerifying = true;

      setTimeout(() => {
        isVerifying = false;
        console.log("Success");
      }, 1000);
    } else {
      const firstEmpty = pins.findIndex((p) => p === "");
      
      errorIndex = firstEmpty; 
      errorMessage = "Please enter the full 5-digit code.";

      inputRefs[firstEmpty]?.focus();

      if (errorTimeout) clearTimeout(errorTimeout);
      errorTimeout = setTimeout(() => {
        errorMessage = "";
        errorIndex = null;
      }, 3000);
    }
  }
</script>

<div class="app-screen">
  <div class="glass-header">
    <a href="/createevent-officer" class="back-btn" aria-label="Back">
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
    <h1 class="page-title">VERIFY CODE</h1>
  </div>

  <div class="scroll-container">
    <div class="content-wrapper">
      <div class="verify-card">
        <div class="card-header-wrapper">
          <h2 class="card-title">Verify Participant</h2>
        </div>

        <p class="card-desc">Enter the participant's PIN code.</p>

        <div class="pin-section">
          <h3 class="input-label">PIN CODE</h3>
          <div class="pin-inputs-wrapper">
            {#each pins as _, i}
              <input
                type="text"
                inputmode="numeric"
                maxlength="1"
                class="pin-box {errorIndex === i ? 'error-border' : ''}"
                bind:value={pins[i]}
                bind:this={inputRefs[i]}
                on:input={(e) => handleInput(i, e)}
                on:keydown={(e) => handleKeydown(i, e)}
                on:focus={() => handleFocus(i)}
                on:click={() => handleFocus(i)}
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
              style="margin-right: 6px;"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span class="error-text">{errorMessage}</span>
          </div>
        {/if}

        <button
          class="submit-btn"
          on:click={handleVerify}
          disabled={isVerifying}
        >
          {isVerifying ? "Verifying..." : "VERIFY"}
        </button>
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
    font-size: 28px;
    font-weight: 700;
    margin: 0;
    letter-spacing: 1px;
    text-transform: uppercase;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
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
    display: flex;
    flex-direction: column;
    align-items: center;
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
    background-color: #10b981;
    color: #111827;
    border: none;
    padding: 14px;
    border-radius: 10px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
    text-transform: uppercase;
    font-family: "Inter", sans-serif;
  }
  .submit-btn:hover {
    background-color: #059669;
  }
  .submit-btn:disabled {
    background-color: #9ca3af;
    cursor: not-allowed;
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