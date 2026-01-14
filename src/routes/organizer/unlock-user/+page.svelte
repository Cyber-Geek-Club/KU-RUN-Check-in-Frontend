<script lang="ts">
  import { fade, slide } from "svelte/transition";
  import { onMount } from "svelte";
  import Swal from "sweetalert2";
  import OrganizerLayout from "$lib/components/organizer/OrganizerLayout.svelte";
  import { lang } from '$lib/stores/organizerStore';
  import { unlockUser, findUserByEmail } from '$lib/api/organizerApi';

  $: t = $lang;

  let email = "";
  let isLoading = false;
  let organizerId: number | null = null;
  let notificationMessage = "";
  let notificationType: "error" | "success" = "error";
  let notificationTimeout: any = null;
  let errorField: string | null = null;

  onMount(() => {
    const userInfoStr = localStorage.getItem("user_info");
    if (userInfoStr) {
      try {
        const userInfo = JSON.parse(userInfoStr);
        organizerId = userInfo.id || userInfo.organizer_id || userInfo.user_id;
      } catch (e) {
        console.error("Error parsing user info", e);
      }
    }
  });
  
  function validateEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function clearNotification() {
    errorField = null;
    if (notificationMessage) {
      notificationMessage = "";
      if (notificationTimeout) clearTimeout(notificationTimeout);
    }
  }

  function showNotification(
    message: string,
    type: "error" | "success" = "error",
    field: string | null = null
  ) {
    if (notificationTimeout) clearTimeout(notificationTimeout);
    notificationMessage = message;
    notificationType = type;
    errorField = field;

    notificationTimeout = setTimeout(() => {
      notificationMessage = "";
      errorField = null;
    }, 3000);
  }

  async function handleUnlock() {
    clearNotification();

    if (!organizerId) {
      showNotification(t.organizerInfoMissing || "Organizer info missing. Please login again.", "error");
      return;
    }
    if (!email || !validateEmail(email)) {
      showNotification(t.enterValidEmail || "Please enter a valid email address.", "error", "email");
      return;
    }

    isLoading = true;

    try {
      const targetUserId = await findUserByEmail(email);

      if (!targetUserId) {
        showNotification(t.userNotFound || "User with this email not found.", "error", "email");
        isLoading = false;
        return;
      }

      isLoading = false;
      Swal.fire({
        title: t.unlockAccount || "Unlock Account?",
        text: `${t.confirmUnlockFor || "Confirm unlock for"} ${email}?`, 
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#10B981", 
        iconColor: "#10B981", 
        cancelButtonColor: "#6B7280", 
        confirmButtonText: t.yesUnlock || "Yes, Unlock",
        cancelButtonText: t.cancel || "Cancel",
        width: "320px",
        customClass: { popup: "my-swal-popup" },
      }).then(async (result) => {
        if (result.isConfirmed) {
          isLoading = true;
          try {
            await unlockUser(targetUserId, organizerId!);
            Swal.fire({
              title: t.unlocked || "Unlocked!",
              text: t.userUnlockedSuccess || "User account has been successfully unlocked.",
              icon: "success",
              iconColor: "#10B981",
              showConfirmButton: false,
              timer: 1500,
              width: "320px",
              customClass: { popup: "swal-white-popup" },
            });
            email = ""; 
          } catch (err: any) {
            Swal.fire({
              title: t.error || "Error",
              text: err.message || t.somethingWentWrong || "Something went wrong.",
              icon: "error",
              iconColor: "#EF4444",
              showConfirmButton: false,
              timer: 2000,
              width: "320px",
              customClass: { popup: "swal-white-popup" },
            });
          } finally {
            isLoading = false;
          }
        }
      });
    } catch (error) {
      console.error(error);
      showNotification(t.systemError || "System error occurred.", "error");
      isLoading = false;
    }
  }
</script>

<OrganizerLayout>
<div class="app-screen">
  <div class="page-header">
    <h1 class="page-title">{t.unlockUser || 'UNLOCK USER'}</h1>
    <p class="page-subtitle">{t.unlockUserDesc || 'Restore access to locked accounts'}</p>
  </div>

  <div class="scroll-container">
    <div class="content-wrapper">
      <div class="card-container" in:fade={{ duration: 300, delay: 100 }}>
        <div class="card-header">
          <div class="icon-circle">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
            </svg>
          </div>
          <h2 class="main-title">Unlock Account</h2>
          <p class="sub-title">
            Enter the user's email address to restore their access.
          </p>
        </div>

        <form
          class="form-section"
          on:submit|preventDefault={handleUnlock}
          autocomplete="off"
        >
          <div class="form-group">
            <label class="label" for="email">User Email Address</label>
            <div class="input-wrapper {errorField === 'email' ? 'error' : ''}">
              <input
                id="email"
                type="email"
                placeholder="Enter email address"
                bind:value={email}
                on:input={clearNotification}
                disabled={isLoading}
              />
            </div>
          </div>

          {#if notificationMessage}
            <div
              class="notification {notificationType}"
              transition:slide={{ duration: 200 }}
            >
              <div class="notif-icon">
                {#if notificationType === "error"}
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                {:else}
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    ><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"
                    ></path><polyline points="22 4 12 14.01 9 11.01"
                    ></polyline></svg
                  >
                {/if}
              </div>
              <span>{notificationMessage}</span>
            </div>
          {/if}

          <button class="submit-btn" type="submit" disabled={isLoading}>
            {#if isLoading}
              <div class="spinner"></div>
              Processing...
            {:else}
              Unlock User
            {/if}
          </button>
        </form>
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
    width: 100%; 
    overflow-y: auto;
    display: flex;
    flex-direction: column; 
    align-items: center; 
    justify-content: flex-start; 
    padding: 0 24px 40px 24px;
    box-sizing: border-box;
  }
  .content-wrapper {
    width: 100%;
    max-width: 460px;
    padding: 24px;
  }

  .card-container {
    background: #ffffff;
    border-radius: 20px;
    padding: 40px 32px;
    box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.1);
    border: 1px solid #f3f4f6;
    text-align: center;
  }

  .card-header {
    margin-bottom: 32px;
  }
  .icon-circle {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: #ecfdf5;
    color: #10b981;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px auto;
  }
  .main-title {
    font-size: 24px;
    font-weight: 700;
    color: #111827;
    margin: 0 0 8px 0;
  }
  .sub-title {
    font-size: 14px;
    color: #6b7280;
    line-height: 1.5;
    margin: 0;
  }

  .form-section {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  .form-group {
    text-align: left;
  }
  .label {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: #374151;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    background: #ffffff;
    border: 1px solid #d1d5db;
    border-radius: 12px;
    transition: all 0.2s;
    height: 52px;
    overflow: hidden;
  }

  .input-wrapper:focus-within {
    border-color: #10b981;
    box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
  }

  .input-wrapper.error {
    border-color: #ef4444 !important;
    box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1) !important;
  }

  .input-icon {
    padding: 0 12px 0 16px;
    color: #9ca3af;
    display: flex;
    align-items: center;
    z-index: 10;
  }

  .input-wrapper input {
    width: 100%;
    height: 100%;
    border: none;
    background: transparent;
    color: #111827;
    font-size: 15px;
    padding: 0 16px 0 8px;
    outline: none;
    border-radius: 0 12px 12px 0;
  }

  .input-wrapper input::placeholder {
    color: #9ca3af;
  }

  :global(.input-wrapper input:-webkit-autofill),
  :global(.input-wrapper input:-webkit-autofill:hover),
  :global(.input-wrapper input:-webkit-autofill:focus),
  :global(.input-wrapper input:-webkit-autofill:active) {
    -webkit-box-shadow: 0 0 0 1000px #ffffff inset !important;
    -webkit-text-fill-color: #111827 !important;
    caret-color: #111827;
    transition: background-color 5000s ease-in-out 0s;
  }

  .notification {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 14px 16px;
    border-radius: 10px;
    font-size: 14px;
    text-align: left;
    line-height: 1.4;
    font-weight: 500;
  }
  .notification.error {
    background: #fef2f2;
    color: #dc2626;
    justify-content: center;
    border: 1px solid #fecaca;
  }
  .notification.success {
    background: #ecfdf5;
    color: #059669;
    border: 1px solid #a7f3d0;
  }
  .notif-icon {
    flex-shrink: 0;
    margin-top: 1px;
  }

  .submit-btn {
    width: 100%;
    height: 50px;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    background: #10b981;
    color: #ffffff;
    font-weight: 600;
    font-size: 16px;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.3);
  }
  .submit-btn:hover:not(:disabled) {
    background: #059669;
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.4);
  }
  .submit-btn:active:not(:disabled) {
    transform: translateY(0);
  }
  .submit-btn:disabled {
    background: #e5e7eb;
    color: #9ca3af;
    cursor: not-allowed;
    box-shadow: none;
  }

  .spinner {
    width: 18px;
    height: 18px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid #fff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  :global(.swal-white-popup) {
    background: #ffffff !important;
    border-radius: 20px !important;
    padding: 0 !important;
    border: none !important;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15) !important;
    font-family: "Inter", sans-serif !important;
    overflow: hidden;
  }

  .swal-content-wrapper {
    padding: 32px 24px 24px 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .swal-header-icon {
    width: 64px;
    height: 64px;
    background: #ecfdf5;
    color: #10b981;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
    position: relative;
  }

  .icon-pulse {
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    border: 1px solid #10b981;
    opacity: 0.3;
    animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
  }

  .swal-title-text {
    font-size: 1.25rem;
    font-weight: 700;
    color: #111827;
    margin: 0 0 16px 0;
  }

  .target-user-card {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 12px 16px;
    width: 100%;
    margin-bottom: 20px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .card-label {
    font-size: 0.75rem;
    text-transform: uppercase;
    color: #6b7280;
    font-weight: 600;
    letter-spacing: 0.5px;
  }
  .card-value {
    font-size: 1rem;
    font-weight: 600;
    color: #1f2937;
    word-break: break-all;
  }

  .swal-desc {
    font-size: 0.95rem;
    color: #4b5563;
    margin: 0;
    line-height: 1.5;
  }
  .sub-desc {
    font-size: 0.85rem;
    color: #9ca3af;
    margin-top: 4px;
    display: block;
  }

  :global(.swal-white-actions) {
    width: 100%;
    padding: 0 24px 24px 24px !important;
    margin: 0 !important;
    display: flex !important;
    gap: 12px;
    justify-content: center;
  }

  :global(.swal-white-confirm) {
    background: #10b981 !important;
    color: white !important;
    border: none;
    padding: 12px 20px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    flex: 1;
    box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.3);
    transition: 0.2s;
  }
  :global(.swal-white-confirm:hover) {
    background: #059669 !important;
    transform: translateY(-1px);
  }

  :global(.swal-white-cancel) {
    background: #ffffff !important;
    color: #374151 !important;
    border: 1px solid #d1d5db !important;
    padding: 12px 20px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    flex: 1;
    transition: 0.2s;
  }
  :global(.swal-white-cancel:hover) {
    background: #f3f4f6 !important;
    color: #111827 !important;
  }

  :global(.swal-compact-popup) {
    width: auto !important;
    min-width: 300px;
    padding: 16px 24px !important;
    border-radius: 12px !important;
    border: 1px solid #e5e7eb !important;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1) !important;
    background-color: #ffffff !important;
    display: flex;
    align-items: center;
    color: #1f2937 !important;
  }
  :global(.swal2-icon.swal2-success) {
    border-color: #10b981 !important;
  }
  :global(.swal2-icon.swal2-success [class^="swal2-success-line"]) {
    background-color: #10b981 !important;
  }
  :global(.swal2-icon.swal2-success .swal2-success-ring) {
    border: 0.25em solid rgba(16, 185, 129, 0.3) !important;
  }
  :global(.swal2-title) {
    color: #111827 !important;
  }
  :global(.swal2-html-container) {
    color: #4b5563 !important;
  }
</style>
