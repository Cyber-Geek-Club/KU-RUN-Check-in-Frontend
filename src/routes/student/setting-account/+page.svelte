<script lang="ts">
  import { goto } from "$app/navigation";
  import { slide } from "svelte/transition";


  type Major = { id: string; name: string };

  let fullName: string = "Somchai Nisit";
  let nisitId: string = "64xxxxxxxx";
  let email: string = "somchai.n@ku.th";
  let faculty: string = "";
  let major: string = "";
  let password: string = "";
  let showPassword: boolean = false;

  let isFacultyOpen = false;
  let isMajorOpen = false;
  let errorField: string = ""; 

  // --- Data ---
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
      { id: "fin", name: "Finance" },
      { id: "ib", name: "International Business" },
      { id: "acc", name: "Accounting" },
    ],
    engineering: [
      { id: "cpe", name: "Computer Engineering" },
      { id: "me", name: "Mechanical Engineering" },
      { id: "ie", name: "Industrial Engineering" },
      { id: "ee", name: "Electrical Engineering" },
    ],
    science: [
      { id: "cs", name: "Computer Science" },
      { id: "it", name: "Information Technology" },
    ],
    economics: [{ id: "econ", name: "Economics" }],
    maritime: [{ id: "ns", name: "Nautical Science" }],
  };

  let currentMajors: Major[] = [];

  $: {
    if (faculty && majorData[faculty]) {
      currentMajors = majorData[faculty];
    } else {
      currentMajors = Object.values(majorData).flat();
    }
  }

  let message: string = "";
  let messageType: "error" | "success" = "error";
  let messageTimeout: any;

  function closeAllDropdowns() {
    isFacultyOpen = false;
    isMajorOpen = false;
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
    if (!faculty) {
      for (const [facKey, majors] of Object.entries(majorData)) {
        if (majors.find((m) => m.id === id)) {
          faculty = facKey;
          break;
        }
      }
    }
    clearMessage();
  }

  function getFacultyName(id: string) {
    const found = facultyList.find((f) => f.id === id);
    return found ? found.name : "Select Faculty";
  }

  function getMajorName(id: string) {
    let found = currentMajors.find((m) => m.id === id);
    if (!found) {
      found = Object.values(majorData)
        .flat()
        .find((m) => m.id === id);
    }
    return found ? found.name : "Select Major";
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

  function validateEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  async function handleSaveChanges(): Promise<void> {
    clearMessage();

    if (!fullName) {
      errorField = "fullname";
      return showMessage("Please enter your full name.");
    }
    if (!nisitId) {
      errorField = "nisitId";
      return showMessage("Please enter your Nisit ID.");
    }
    if (!email) {
      errorField = "email";
      return showMessage("Please enter your email.");
    }
    if (!validateEmail(email)) {
      errorField = "email";
      return showMessage("Invalid email format.");
    }
    if (!faculty) {
      errorField = "faculty";
      return showMessage("Please select a faculty.");
    }
    if (!major) {
      errorField = "major";
      return showMessage("Please select a major.");
    }
    if (!password) {
      errorField = "password";
      return showMessage("Please confirm your password to save.");
    }

    const updateData = {
      role: "student",
      fullName,
      nisitId,
      email,
      faculty,
      major,
      password,
    };
    console.log("Student Settings Updated:", updateData);

    showMessage("Account updated successfully!", "success");
    setTimeout(() => goto("/eventlist"), 1500);
  }
</script>

<svelte:window on:click={closeAllDropdowns} />

<div class="app-screen">
  <div class="glass-header">
    <a href="/student/event-list" class="back-btn" aria-label="Back">
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
          <h1 class="main-title">ACCOUNT SETTINGS</h1>
          <p class="sub-title">Update your student profile information.</p>
        </div>

        <div class="form-section">
          <div class="form-group">
            <label class="label" for="fullname">Full Name</label>
            <div
              class="input-field"
              class:error-border={errorField === "fullname"}
            >
              <input
                id="fullname"
                type="text"
                placeholder="Enter your name"
                bind:value={fullName}
                on:input={clearMessage}
              />
            </div>
          </div>

          <div class="form-group">
            <label class="label" for="nisitId">Nisit ID</label>
            <div
              class="input-field"
              class:error-border={errorField === "nisitId"}
            >
              <input
                id="nisitId"
                type="text"
                placeholder="Enter your ID"
                bind:value={nisitId}
                on:input={clearMessage}
              />
            </div>
          </div>

          <div class="form-group">
            <label class="label" for="email">Email</label>
            <div
              class="input-field"
              class:error-border={errorField === "email"}
            >
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                bind:value={email}
                on:input={clearMessage}
              />
            </div>
          </div>

          <div class="form-group">
            <label class="label" for="faculty-trigger">Faculty</label>
            <div class="custom-select-container">
              <button
                id="faculty-trigger"
                type="button"
                class="select-trigger"
                class:placeholder={!faculty}
                class:active={isFacultyOpen}
                class:error-border={errorField === "faculty"}
                on:click={(e) => {
                  e.stopPropagation();
                  isFacultyOpen = !isFacultyOpen;
                  isMajorOpen = false;
                }}
              >
                <span
                  >{faculty ? getFacultyName(faculty) : "Select Faculty"}</span
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
                <div class="options-list" transition:slide={{ duration: 150 }}>
                  {#each facultyList as f}
                    <button
                      type="button"
                      class="option-item"
                      on:click={() => selectFaculty(f.id)}
                    >
                      {f.name}
                    </button>
                  {/each}
                </div>
              {/if}
            </div>
          </div>

          <div class="form-group">
            <label class="label" for="major-trigger">Major</label>
            <div class="custom-select-container">
              <button
                id="major-trigger"
                type="button"
                class="select-trigger"
                class:placeholder={!major}
                class:active={isMajorOpen}
                class:error-border={errorField === "major"}
                on:click={(e) => {
                  e.stopPropagation();
                  isMajorOpen = !isMajorOpen;
                  isFacultyOpen = false;
                }}
              >
                <span>{major ? getMajorName(major) : "Select Major"}</span>
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
                <div class="options-list" transition:slide={{ duration: 150 }}>
                  {#each currentMajors as m}
                    <button
                      type="button"
                      class="option-item"
                      on:click={() => selectMajor(m.id)}
                    >
                      {m.name}
                    </button>
                  {/each}
                </div>
              {/if}
            </div>
          </div>

          <div class="form-group">
            <label class="label" for="password">Confirm Password</label>
            <div
              class="input-field"
              class:error-border={errorField === "password"}
            >
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
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
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
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              {/if}
              <span>{message}</span>
            </div>
          {/if}

          <button
            class="primary-btn"
            type="button"
            on:click={handleSaveChanges}
          >
            SAVE CHANGES
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

  .title-section {
    text-align: left;
    margin-bottom: 24px;
  }
  .main-title {
    color: #f3f4f6;
    font-size: 28px;
    font-weight: 700;
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
    margin-bottom: 20px;
    position: relative;
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
  }
  .input-field input::placeholder {
    color: #6b7280;
  }

  /* Custom Dropdown */
  .custom-select-container {
    position: relative;
    width: 100%;
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
    font-size: 14px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    transition: background 0.1s;
  }
  .option-item:last-child {
    border-bottom: none;
  }
  .option-item:hover {
    background: #374151;
  }

  .toggle-password {
    background: none;
    border: none;
    color: #9ca3af;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
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
  }
  .message-container.error {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #b91c1c;
  }
  .message-container.success {
    background: #ecfdf5;
    border: 1px solid #a7f3d0;
    color: #047857;
  }
  .error-border {
    border-color: #ef4444 !important;
    box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.25) !important;
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
