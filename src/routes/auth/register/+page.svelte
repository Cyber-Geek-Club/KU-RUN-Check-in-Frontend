<script lang="ts">
  import { goto } from "$app/navigation";
  import { slide, fade } from "svelte/transition";
  import { onDestroy, onMount } from "svelte";

  const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

  type Role = "student" | "officer";
  type Major = { id: string; name: string };

  let role: Role = "student";
  let indicatorTransform: string;
  $: indicatorTransform = role === "student" ? "0%" : "calc(100% + 8px)";

  let title: string = "";
  let firstName: string = "";
  let lastName: string = "";

  let email: string = "";
  let password: string = "";
  let showPassword: boolean = false;
  let nisitId: string = "";
  let faculty: string = "";
  let major: string = "";
  let department: string = "";

  let isTitleOpen = false;
  let isFacultyOpen = false;
  let isMajorOpen = false;
  let isDeptOpen = false;
  let loading = false;
  let message: string = "";
  let messageType: "error" | "success" = "error";
  let messageTimeout: any;

  let errorFields = {
    title: false,
    firstName: false,
    lastName: false,
    email: false,
    nisitId: false,
    faculty: false,
    major: false,
    department: false,
    password: false,
  };

  let isRegisterSuccess = false;

  function handleStorageEvent(event: StorageEvent) {
    if (event.key === "register_verified") {
      localStorage.removeItem("register_verified");
      goto("/auth/login");
    }
  }

  onMount(() => {
    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleStorageEvent);
    }
  });

  onDestroy(() => {
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", handleStorageEvent);
    }
  });

  const titleList = ["Mr.", "Ms.", "Mrs.", "Dr.", "Prof."];

  const facultyList = [
    { id: "management", name: "Management Sciences" },
    { id: "engineering", name: "Engineering at Sriracha" },
    { id: "science", name: "Science at Sriracha" },
    { id: "economics", name: "Economics at Sriracha" },
    { id: "maritime", name: "International Maritime Studies" },
  ];

  const majorData: Record<string, Major[]> = {
    management: [
      { id: "mgt", name: "Management" },
      { id: "fin", name: "Finance and Investment" },
      { id: "ib", name: "International Business" },
      { id: "lm", name: "Logistics Management" },
      { id: "hh", name: "Hospitality Industry Management – Hotel Management" },
      {
        id: "ht",
        name: "Hospitality Industry Management – Tourism Management",
      },
      { id: "acc", name: "Accounting" },
      { id: "amb", name: "Digital Marketing and Branding" },
    ],
    engineering: [
      { id: "med", name: "Mechanical Engineering and Design" },
      { id: "mme", name: "Mechanical and Manufacturing Systems Engineering" },
      { id: "eee", name: "Electrical and Electronics Engineering" },
      { id: "ise", name: "Industrial and Systems Engineering" },
      { id: "cie", name: "Computer and Information Engineering" },
      { id: "ce", name: "Civil Engineering" },
      { id: "ee", name: "Electrical Engineering" },
      { id: "rae", name: "Robotics and Automation Engineering" },
      { id: "die", name: "Digital and Intelligent Electronics Engineering" },
      { id: "dms", name: "Digital Manufacturing Systems Engineering" },
      { id: "ae", name: "Automotive Engineering" },
    ],
    science: [
      { id: "cs", name: "Computer Science" },
      { id: "it", name: "Information Technology" },
      { id: "ps", name: "Physics" },
      { id: "est", name: "Environmental Science and Technology" },
      { id: "dst", name: "Digital Science and Technology" },
      { id: "daa", name: "Data Analytics and Actuarial Mathematics" },
      { id: "act", name: "Applied Chemistry and Technology" },
    ],
    economics: [{ id: "econ", name: "Economics" }],
    maritime: [
      { id: "nao", name: "Naval Architecture and Ocean Engineering" },
      { id: "ns", name: "Nautical Science" },
      { id: "mt", name: "Maritime Transportation" },
      { id: "me", name: "Marine Engineering" },
    ],
  };

  const officerDepartments = [
    { id: "Academic Affairs", name: "Academic Affairs" },
    { id: "Student Affairs", name: "Student Affairs" },
    { id: "Registrar Office", name: "Registrar Office" },
    { id: "Finance Department", name: "Finance Department" },
    { id: "IT Support Center", name: "IT Support Center" },
    { id: "Human Resources", name: "Human Resources" },
  ];

  let currentMajors: Major[] = [];

  $: {
    if (faculty && majorData[faculty]) {
      currentMajors = majorData[faculty];
    } else {
      currentMajors = [];
    }
  }

  function selectTitle(t: string) {
    title = t;
    isTitleOpen = false;
    clearMessage();
  }

  function selectFaculty(id: string) {
    faculty = id;
    major = "";
    isFacultyOpen = false;
    clearMessage();
  }

  function selectMajor(id: string) {
    major = id;
    isMajorOpen = false;
    clearMessage();
  }

  function selectDepartment(dept: string) {
    department = dept;
    isDeptOpen = false;
    clearMessage();
  }

  function getFacultyName(id: string) {
    const found = facultyList.find((f) => f.id === id);
    return found ? found.name : "Select Faculty";
  }

  function getMajorName(id: string) {
    const found = currentMajors.find((m) => m.id === id);
    return found ? found.name : "Select Major";
  }

  function toggleRole(newRole: Role) {
    if (role === newRole) return;
    role = newRole;
    isTitleOpen = false;
    isFacultyOpen = false;
    isMajorOpen = false;
    isDeptOpen = false;
    clearMessage();
  }

  function highlight(field: keyof typeof errorFields) {
    errorFields[field] = true;
    setTimeout(() => (errorFields[field] = false), 3000);
  }

  function showMessage(msg: string, type: "error" | "success" = "error") {
    if (messageTimeout) clearTimeout(messageTimeout);
    message = msg;
    messageType = type;
    messageTimeout = setTimeout(() => {
      message = "";
    }, 3000);
  }

  function clearMessage() {
    if (message) {
      message = "";
      if (messageTimeout) clearTimeout(messageTimeout);
    }
  }

  function validateEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function validatePassword(value: string): boolean {
    return /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(value);
  }

  async function handleSignup(): Promise<void> {
    if (loading) return;
    clearMessage();

    firstName = firstName.trim();
    lastName = lastName.trim();
    email = email.trim();
    nisitId = nisitId.trim();

    if (!title) {
      highlight("title");
      return showMessage("Please select a title.");
    }
    if (!firstName) {
      highlight("firstName");
      return showMessage("Please enter your first name.");
    }
    if (!lastName) {
      highlight("lastName");
      return showMessage("Please enter your last name.");
    }
    if (!email) {
      highlight("email");
      return showMessage("Please enter your email.");
    }
    if (!validateEmail(email)) {
      highlight("email");
      return showMessage("Invalid email format.");
    }

    if (role === "student") {
      if (!nisitId) {
        highlight("nisitId");
        return showMessage("Please enter your Nisit ID.");
      }
      if (!faculty) {
        highlight("faculty");
        return showMessage("Please select a faculty.");
      }
      if (!major) {
        highlight("major");
        return showMessage("Please select a major.");
      }
    } else {
      if (!department) {
        highlight("department");
        return showMessage("Please select your department.");
      }
    }

    if (!password) {
      highlight("password");
      return showMessage("Please enter a password.");
    }
    if (!validatePassword(password)) {
      highlight("password");
      return showMessage("Password must be 8+ chars and include a number.");
    }
    loading = true;
    if (role === "student") {
      try {
        const nisitApiUrl = `https://regis.src.ku.ac.th/res/api/gen_user_endcode.php?id=${nisitId}`;
        const nisitRes = await fetch(nisitApiUrl);
        if (!nisitRes.ok) {
          loading = false;
          return showMessage(
            "Nisit ID verification service unavailable.",
            "error"
          );
        }
        const nisitData = await nisitRes.json().catch(() => null);
        if (
          !nisitData ||
          (Array.isArray(nisitData) && nisitData.length === 0)
        ) {
          highlight("nisitId");
          loading = false;
          return showMessage(`Nisit ID ${nisitId} is not recognized.`, "error");
        }
      } catch (e) {
        console.error("Nisit Check Failed:", e);
        loading = false;
        return showMessage("Failed to verify Nisit ID.", "error");
      }
    }

    try {
      let endpoint = "";
      let payload = {};

      if (role === "student") {
        endpoint = `${API_BASE}/api/users/register/student`;
        payload = {
          email: email,
          password: password,
          first_name: firstName,
          last_name: lastName,
          title: title,
          nisit_id: nisitId,
          major: major,
          faculty: faculty,
        };
      } else {
        endpoint = `${API_BASE}/api/users/register/officer`;
        payload = {
          email: email,
          password: password,
          first_name: firstName,
          last_name: lastName,
          title: title,
          department: department,
        };
      }

      console.log(
        `🚀 Sending to [${endpoint}]:`,
        JSON.stringify(payload, null, 2)
      );

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        let errorMsg = "Register failed.";
        if (err?.detail) {
          if (typeof err.detail === "string") errorMsg = err.detail;
          else if (Array.isArray(err.detail))
            errorMsg = err.detail[0]?.msg || "Invalid input";
        }
        loading = false;
        return showMessage(errorMsg, "error");
      }

      loading = false;
      isRegisterSuccess = true;
    } catch (e) {
      console.error(e);
      loading = false;
      showMessage("Cannot connect to server.", "error");
    }
  }
</script>

<div class="app-screen">
  <div class="glass-header">
    {#if !isRegisterSuccess}
      <a href="/" class="back-btn" aria-label="Back">
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
    {/if}
    <h1 class="page-title">
      {isRegisterSuccess ? "VERIFY EMAIL" : "CREATE ACCOUNT"}
    </h1>
  </div>

  <div class="scroll-container">
    <div class="content-wrapper">
      <div class="form-card">
        {#if isRegisterSuccess}
          <div class="success-view" in:fade={{ duration: 300 }}>
            <div class="icon-circle">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#10b981"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path
                  d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
                ></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
            </div>

            <h2 class="success-title">Check your inbox</h2>
            <p class="success-desc">
              We have sent a verification link to <br />
              <span class="highlight-email">{email}</span>
            </p>
            <p class="success-note">
              <span class="pulse-dot"></span> Waiting for verification...
            </p>
            <p style="font-size: 13px; color: #6b7280; margin-top: 5px;">
              (This page will update automatically once verified)
            </p>
          </div>
        {:else}
          <div in:slide|local>
            <div class="role-switcher-container">
              <div class="segmented" role="tablist">
                <div
                  class="indicator"
                  style="transform: translateX({indicatorTransform});"
                ></div>
                <button
                  type="button"
                  class="option"
                  class:active={role === "student"}
                  on:click={() => toggleRole("student")}
                >
                  <span>Student</span>
                </button>
                <button
                  type="button"
                  class="option"
                  class:active={role === "officer"}
                  on:click={() => toggleRole("officer")}
                >
                  <span>Officer</span>
                </button>
              </div>
            </div>

            <div class="form-section">
              <div class="row-group">
                <div class="form-group" style="flex: 0 0 100px;">
                  <label class="label" for="title">Title</label>
                  <div class="custom-select-container">
                    <button
                      type="button"
                      class="select-trigger {errorFields.title ? 'error' : ''}"
                      class:placeholder={!title}
                      class:active={isTitleOpen}
                      on:click={() => {
                        isTitleOpen = !isTitleOpen;
                        isFacultyOpen = false;
                        isMajorOpen = false;
                        isDeptOpen = false;
                      }}
                    >
                      <span>{title || "Title"}</span>
                      <div class="arrow-icon" class:rotate={isTitleOpen}>
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"><path d="M6 9l6 6 6-6" /></svg
                        >
                      </div>
                    </button>
                    {#if isTitleOpen}
                      <div
                        class="options-list"
                        transition:slide={{ duration: 150 }}
                        style="z-index: 101;"
                      >
                        {#each titleList as t}
                          <button
                            type="button"
                            class="option-item"
                            on:click={() => selectTitle(t)}>{t}</button
                          >
                        {/each}
                      </div>
                    {/if}
                  </div>
                </div>

                <div class="form-group" style="flex: 1;">
                  <label class="label" for="firstName">First Name</label>
                  <div
                    class="input-field {errorFields.firstName ? 'error' : ''}"
                  >
                    <input
                      id="firstName"
                      type="text"
                      placeholder="First Name"
                      bind:value={firstName}
                      on:input={clearMessage}
                    />
                  </div>
                </div>
              </div>

              <div class="form-group">
                <label class="label" for="lastName">Last Name</label>
                <div class="input-field {errorFields.lastName ? 'error' : ''}">
                  <input
                    id="lastName"
                    type="text"
                    placeholder="Last Name"
                    bind:value={lastName}
                    on:input={clearMessage}
                  />
                </div>
              </div>

              <div class="form-group">
                <label class="label" for="email">Email</label>
                <div class="input-field {errorFields.email ? 'error' : ''}">
                  <input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    bind:value={email}
                    on:input={clearMessage}
                  />
                </div>
              </div>

              {#if role === "student"}
                <div transition:slide|local={{ duration: 200 }}>
                  <div class="form-group">
                    <label class="label" for="nisitId">Nisit ID</label>
                    <div
                      class="input-field {errorFields.nisitId ? 'error' : ''}"
                    >
                      <input
                        type="text"
                        bind:value={nisitId}
                        on:input={(e) => {
                          const t = e.target as HTMLInputElement;
                          t.value = t.value.replace(/\D/g, "").slice(0, 10);
                          nisitId = t.value;
                        }}
                        placeholder="Nisit ID"
                        maxlength="10"
                      />
                    </div>
                  </div>

                  <div class="form-group">
                    <label class="label" for="faculty">Faculty</label>
                    <div class="custom-select-container">
                      <button
                        type="button"
                        class="select-trigger {errorFields.faculty
                          ? 'error'
                          : ''}"
                        class:placeholder={!faculty}
                        class:active={isFacultyOpen}
                        on:click={() => {
                          isFacultyOpen = !isFacultyOpen;
                          isMajorOpen = false;
                          isTitleOpen = false;
                        }}
                      >
                        <span
                          >{faculty
                            ? getFacultyName(faculty)
                            : "Select Faculty"}</span
                        >
                        <div class="arrow-icon" class:rotate={isFacultyOpen}>
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"><path d="M6 9l6 6 6-6" /></svg
                          >
                        </div>
                      </button>
                      {#if isFacultyOpen}
                        <div
                          class="options-list"
                          transition:slide={{ duration: 150 }}
                        >
                          {#each facultyList as f}
                            <button
                              type="button"
                              class="option-item"
                              on:click={() => selectFaculty(f.id)}
                              >{f.name}</button
                            >
                          {/each}
                        </div>
                      {/if}
                    </div>
                  </div>

                  <div class="form-group">
                    <label class="label" for="major">Major</label>
                    <div
                      class="custom-select-container"
                      class:disabled={!faculty}
                    >
                      <button
                        type="button"
                        class="select-trigger {errorFields.major
                          ? 'error'
                          : ''}"
                        class:placeholder={!major}
                        class:active={isMajorOpen}
                        disabled={!faculty}
                        on:click={() => {
                          isMajorOpen = !isMajorOpen;
                          isFacultyOpen = false;
                          isTitleOpen = false;
                        }}
                      >
                        <span
                          >{major ? getMajorName(major) : "Select Major"}</span
                        >
                        <div class="arrow-icon" class:rotate={isMajorOpen}>
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"><path d="M6 9l6 6 6-6" /></svg
                          >
                        </div>
                      </button>
                      {#if isMajorOpen}
                        <div
                          class="options-list"
                          transition:slide={{ duration: 150 }}
                        >
                          {#each currentMajors as m}
                            <button
                              type="button"
                              class="option-item"
                              on:click={() => selectMajor(m.id)}
                              >{m.name}</button
                            >
                          {/each}
                        </div>
                      {/if}
                    </div>
                  </div>
                </div>
              {:else}
                <div transition:slide|local={{ duration: 200 }}>
                  <div class="form-group">
                    <label class="label" for="department">Department</label>
                    <div class="custom-select-container">
                      <button
                        type="button"
                        class="select-trigger {errorFields.department
                          ? 'error'
                          : ''}"
                        class:placeholder={!department}
                        class:active={isDeptOpen}
                        on:click={() => (isDeptOpen = !isDeptOpen)}
                      >
                        <span>{department || "Select Department"}</span>
                        <div class="arrow-icon" class:rotate={isDeptOpen}>
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"><path d="M6 9l6 6 6-6" /></svg
                          >
                        </div>
                      </button>
                      {#if isDeptOpen}
                        <div
                          class="options-list"
                          transition:slide={{ duration: 150 }}
                        >
                          {#each officerDepartments as dept}
                            <button
                              type="button"
                              class="option-item"
                              on:click={() => selectDepartment(dept.id)}
                              >{dept.name}</button
                            >
                          {/each}
                        </div>
                      {/if}
                    </div>
                  </div>
                </div>
              {/if}

              <div class="form-group">
                <label class="label" for="password">Password</label>
                <div class="input-field {errorFields.password ? 'error' : ''}">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    bind:value={password}
                    on:input={clearMessage}
                  />
                  <button
                    type="button"
                    class="toggle-password"
                    on:click={() => (showPassword = !showPassword)}
                  >
                    {#if showPassword}
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        ><path
                          d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                        /><circle cx="12" cy="12" r="3" /></svg
                      >
                    {:else}
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        ><path
                          d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
                        /><line x1="1" y1="1" x2="23" y2="23" /></svg
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
                  {#if messageType === "error"}
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      ><circle cx="12" cy="12" r="10"></circle><line
                        x1="12"
                        y1="8"
                        x2="12"
                        y2="12"
                      ></line><line x1="12" y1="16" x2="12.01" y2="16"
                      ></line></svg
                    >
                  {:else}
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      ><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"
                      ></path><polyline points="22 4 12 14.01 9 11.01"
                      ></polyline></svg
                    >
                  {/if}
                  <span>{message}</span>
                </div>
              {/if}

              <button
                class="primary-btn"
                on:click={handleSignup}
                disabled={loading}
              >
                {#if loading}CREATING...{:else}SIGN UP{/if}
              </button>
            </div>
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
  :global(input::-ms-reveal),
  :global(input::-ms-clear) {
    display: none !important;
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
    color: #6b7280;
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

  .role-switcher-container {
    display: flex;
    justify-content: center;
    margin-bottom: 24px;
  }
  .segmented {
    position: relative;
    display: inline-flex;
    background: rgba(243, 244, 246, 0.06);
    padding: 7px;
    border-radius: 99px;
    gap: 4px;
    width: 70%;
    max-width: 300px;
  }
  .indicator {
    position: absolute;
    left: 4px;
    top: 4px;
    bottom: 4px;
    width: calc(50% - 6px);
    background: #f3f4f6;
    border-radius: 99px;
    transition: transform 0.22s cubic-bezier(0.2, 0.9, 0.2, 1);
    z-index: 1;
  }
  .option {
    position: relative;
    z-index: 2;
    flex: 1;
    background: transparent;
    border: none;
    padding: 8px;
    border-radius: 99px;
    cursor: pointer;
    color: #9aa0a6;
    font-weight: 600;
    font-size: 14px;
    transition: color 0.16s ease;
  }
  .option.active {
    color: #0f172a;
  }

  .form-section {
    display: flex;
    flex-direction: column;
  }
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 20px;
    position: relative;
  }
  .row-group {
    display: flex;
    gap: 12px;
  }
  .label {
    color: #f3f4f6;
    font-size: 14px;
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
    width: 100%;
  }
  .input-field.error,
  .select-trigger.error {
    border-color: #ef4444 !important;
    box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.25) !important;
  }

  .custom-select-container {
    position: relative;
    width: 100%;
  }
  .custom-select-container.disabled {
    opacity: 0.5;
    pointer-events: none;
  }
  .select-trigger {
    width: 100%;
    height: 54px;
    padding: 0 16px;
    background: #1f2937;
    border: 2px solid #374151;
    border-radius: 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: #f3f4f6;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
  }
  .select-trigger.placeholder {
    color: #6b7280;
  }
  .select-trigger.active {
    border-color: #10b981;
    background: #111827;
  }
  .arrow-icon {
    color: #9ca3af;
    transition: transform 0.2s;
  }
  .arrow-icon.rotate {
    transform: rotate(180deg);
    color: #10b981;
  }
  .options-list {
    position: absolute;
    top: 100%;
    left: 0;
    width: 100%;
    margin-top: 6px;
    background: #1f2937;
    border: 2px solid #374151;
    border-radius: 12px;
    max-height: 240px;
    overflow-y: auto;
    z-index: 100;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
  }
  .option-item {
    width: 100%;
    padding: 12px 16px;
    text-align: left;
    background: transparent;
    border: none;
    color: #f3f4f6;
    cursor: pointer;
    font-size: 15px;
    transition: background 0.2s;
  }
  .option-item:hover {
    background: #374151;
  }

  /* Shared Button Styles */
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
  .primary-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* Success View Styles */
  .success-view {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 20px 0;
  }
  .icon-circle {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: rgba(16, 185, 129, 0.1);
    border: 2px solid #10b981;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 24px;
    box-shadow: 0 0 20px rgba(16, 185, 129, 0.2);
  }
  .success-title {
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 12px;
    color: #f3f4f6;
  }
  .success-desc {
    color: #9ca3af;
    font-size: 15px;
    line-height: 1.5;
    margin-bottom: 24px;
  }
  .highlight-email {
    color: white;
    font-weight: 600;
  }
  .success-note {
    font-size: 14px;
    color: #10b981;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .pulse-dot {
    width: 8px;
    height: 8px;
    background-color: #10b981;
    border-radius: 50%;
    animation: pulse 1.5s infinite;
  }
  @keyframes pulse {
    0% {
      transform: scale(0.95);
      box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
    }
    70% {
      transform: scale(1);
      box-shadow: 0 0 0 6px rgba(16, 185, 129, 0);
    }
    100% {
      transform: scale(0.95);
      box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
    }
  }

  .message-container {
    display: flex;
    align-items: center;
    padding: 12px 14px;
    border-radius: 8px;
    margin-bottom: 20px;
    font-size: 14px;
    font-weight: 600;
    gap: 10px;
    justify-content: center;
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
  .toggle-password {
    background: none;
    border: none;
    color: #9ca3af;
    cursor: pointer;
    padding: 0;
    display: flex;
    align-items: center;
  }
  .toggle-password:hover {
    color: #f3f4f6;
  }
</style>
