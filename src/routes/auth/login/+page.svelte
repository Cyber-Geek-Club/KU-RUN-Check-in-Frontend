<script lang="ts">
  import { goto } from "$app/navigation";
  import { slide } from "svelte/transition";
  import { auth } from "$lib/utils/auth";

  let email = "";
  let password = "";
  let showPassword = false;
  let isSubmitting = false;

  let errorMessage = "";
  let errorTimeout: any = null;
  let errorField: string | null = null;

  function togglePassword() {
    showPassword = !showPassword;
  }

  function validateEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function clearError() {
    errorField = null;
    if (errorMessage) {
      errorMessage = "";
      if (errorTimeout) clearTimeout(errorTimeout);
    }
  }

  function showError(message: string, field: string) {
    if (errorTimeout) clearTimeout(errorTimeout);
    errorMessage = message;
    errorField = field;
    errorTimeout = setTimeout(() => {
      errorMessage = "";
      errorField = null;
    }, 3000);
  }

  function normalizeRole(role: any): string {
    if (!role) return "";
    const r = String(role).trim().toLowerCase();
    if (["student", "officer", "organizer"].includes(r)) return r;
    return "";
  }

  function getRoleHome(role: string): string {
    switch (role) {
      case "officer":
        return "/officer/event-list";
      case "student":
        return "/student/event-list";
      case "organizer":
        return "/organizer/events";
      default:
        return "/student/event-list";
    }
  }

  async function submitLogin() {
    clearError();

    if (isSubmitting) return;

    if (!email) return showError("Please enter your email.", "email");
    if (!validateEmail(email))
      return showError("Invalid email format.", "email");
    if (!password) return showError("Please enter your password.", "password");

    try {
      isSubmitting = true;
      const base = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
      const API_URL = `${base}/api/users/login`;

      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // Clear any stale auth state on failed login
        auth.logout();
        return showError(
          data?.detail ?? "Login failed. Please check your credentials.",
          "both"
        );
      }

      const accessToken = data.access_token;
      const refreshToken = data.refresh_token;
      const rawRole = data.role || data.user?.role;
      const userRole = normalizeRole(rawRole);

      console.log("ROLE FROM SERVER:", rawRole, "=>", userRole);

      if (!accessToken || !userRole) {
        console.error("Login Error: Missing token or role", data);
        return showError("System Error: Invalid response from server.", "both");
      }

      // Prepare user data matching LoginResponse interface
      const loginResponse = {
        access_token: accessToken,
        refresh_token: refreshToken || undefined,
        token_type: data.token_type || "Bearer",
        expires_in: data.expires_in || 3600,
        user_id: data.user_id || data.id || data.user?.id,
        email: data.email || data.user?.email || email,
        name: data.name || data.user?.name || data.username || data.user?.username || email.split('@')[0],
        role: userRole
      };

      // Use auth store - it will handle all localStorage operations
      auth.login(loginResponse);

      // Store additional role-based routing info
      try {
        localStorage.setItem("strict_allowed_path", getRoleHome(userRole));
        localStorage.setItem("strict_allowed_path_ts", Date.now().toString());
      } catch (e) {
        console.warn("localStorage write failed:", e);
      }

      const home = getRoleHome(userRole);
      console.log("REDIRECTING TO:", home);

      await goto(home, { replaceState: true });
    } catch (err) {
      console.error("Login Error:", err);
      showError("Cannot connect to server. Please try again later.", "both");
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="app-screen">
  <div class="scroll-container">
    <div class="content-wrapper">
      <div class="login-card">
        <div class="title-section">
          <h1 class="main-title">NISIT<br />LOGIN TO ACCOUNT</h1>
          <p class="sub-title">Welcome back! Please enter your details.</p>
        </div>

        <form class="form-section" on:submit|preventDefault={submitLogin}>
          <div class="form-group">
            <label class="label" for="email">Email</label>
            <div
              class="input-field {errorField === 'email' ||
              errorField === 'both'
                ? 'error'
                : ''}"
            >
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                bind:value={email}
                on:input={clearError}
              />
            </div>
          </div>

          <div class="form-group">
            <div class="password-header">
              <label class="label" for="password">Password</label>
              <a href="/auth/forgot-password" class="forgot-link">Forgot ?</a>
            </div>
            <div
              class="input-field password-field {errorField === 'password' ||
              errorField === 'both'
                ? 'error'
                : ''}"
            >
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                bind:value={password}
                on:input={clearError}
              />
              <button
                type="button"
                class="toggle-password"
                on:click={togglePassword}
                aria-label="Toggle Password Visibility"
              >
                {#if showPassword}
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

          {#if errorMessage}
            <div
              class="message-container error"
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
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>{errorMessage}</span>
            </div>
          {/if}

          <button class="login-button" type="submit" disabled={isSubmitting}> {isSubmitting ? 'LOGGING IN…' : 'LOGIN NOW'} </button>
          <div class="signup-section">
            <span class="signup-text">Don't have an account?</span>
            <a href="/auth/register" class="signup-link">Sign up</a>
          </div>
        </form>
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

  input::-ms-reveal,
  input::-ms-clear {
    display: none;
  }
  input::-webkit-password-reveal-button {
    display: none;
    -webkit-appearance: none;
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
    align-items: center;
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

  .login-card {
    width: 100%;
    display: flex;
    flex-direction: column;
  }

  .title-section {
    text-align: center;
    margin-bottom: 40px;
  }

  .input-field.error {
    border-color: #ef4444 !important;
    box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.25) !important;
  }

  .main-title {
    color: #f3f4f6;
    font-size: 28px;
    font-weight: 700;
    line-height: 1.2;
    margin: 0 0 8px 0;
  }

  .sub-title {
    color: #9ca3af;
    font-size: 14px;
    margin: 0;
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

  .password-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .forgot-link {
    color: #10b981;
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;
    transition: opacity 0.2s;
  }
  .forgot-link:hover {
    opacity: 0.8;
    text-decoration: underline;
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

  .login-button {
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
    margin-bottom: 32px;
    text-transform: uppercase;
    box-shadow: 0 4px 6px rgba(16, 185, 129, 0.2);
  }

  .login-button:hover {
    background: #059669;
  }
  .login-button:active {
    transform: scale(0.98);
  }

  .signup-section {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 6px;
  }

  .signup-text {
    color: #9ca3af;
    font-size: 14px;
  }

  .signup-link {
    color: #10b981;
    font-size: 14px;
    font-weight: 700;
    text-decoration: none;
    cursor: pointer;
    transition: opacity 0.2s;
  }
  .signup-link:hover {
    text-decoration: underline;
  }
</style>
