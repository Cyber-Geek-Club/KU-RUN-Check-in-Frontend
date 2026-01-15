<script lang="ts">
  import { goto } from "$app/navigation";
  import { slide, fade } from "svelte/transition";
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { ROUTES } from "$lib/utils/routes";
  import Swal from "sweetalert2";

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

  // --- User Data ---
  let userId: string = "";
  let token: string = "";
  let role: string = "";
  let profileImage: string = "";
  let isEmailVerified: boolean = true;

  // --- Form Fields ---
  let title: string = "";
  let firstName: string = "";
  let lastName: string = "";
  let email: string = "";
  let nisitId: string = "";
  let faculty: string = "";
  let major: string = "";
  let department: string = "";

  // --- UI State ---
  let activeSection: string = "profile";
  let isTitleOpen = false;
  let isFacultyOpen = false;
  let isMajorOpen = false;
  let isDeptOpen = false;
  let isLoading: boolean = true;
  let isSaving: boolean = false;
  let isUploadingImage: boolean = false;

  // --- Form Validation ---
  let originalData: any = {};
  let isFormDirty: boolean = false;
  let message: string = "";
  let messageType: "error" | "success" = "error";
  let messageTimeout: any;
  let errorTimeout: any;

  let errorFields = {
    title: false,
    firstName: false,
    lastName: false,
    faculty: false,
    major: false,
    department: false,
  };
  type ErrorKey = keyof typeof errorFields;

  // --- Sections ---
  const sections = [
    { id: "profile", icon: "user", label: "Profile" },
    { id: "academic", icon: "book", label: "Academic" },
    { id: "security", icon: "shield", label: "Security" },
  ];

  // --- Data Lists ---
  const titleList = ["Mr.", "Ms.", "Mrs.", "Dr.", "Prof."];
  const organizerDepartments = [
    { id: "Academic Affairs", name: "Academic Affairs" },
    { id: "Student Affairs", name: "Student Affairs" },
    { id: "Registrar Office", name: "Registrar Office" },
    { id: "Finance Department", name: "Finance Department" },
    { id: "IT Support Center", name: "IT Support Center" },
    { id: "Human Resources", name: "Human Resources" },
  ];
  const facultyList = [
    { id: "management", name: "Management Sciences", icon: "📊" },
    { id: "engineering", name: "Engineering at Sriracha", icon: "⚙️" },
    { id: "science", name: "Science at Sriracha", icon: "🔬" },
    { id: "economics", name: "Economics at Sriracha", icon: "💹" },
    { id: "maritime", name: "International Maritime Studies", icon: "🚢" },
  ];

  type Major = { id: string; name: string };
  const majorData: Record<string, Major[]> = {
    management: [
      { id: "mgt", name: "Management" },
      { id: "fin", name: "Finance and Investment" },
      { id: "ib", name: "International Business" },
      { id: "lm", name: "Logistics Management" },
      { id: "hh", name: "Hospitality - Hotel" },
      { id: "ht", name: "Hospitality - Tourism" },
      { id: "acc", name: "Accounting" },
      { id: "amb", name: "Digital Marketing" },
    ],
    engineering: [
      { id: "med", name: "Mechanical Engineering" },
      { id: "mme", name: "Mechanical & Mfg Systems" },
      { id: "eee", name: "Electrical & Electronics" },
      { id: "ise", name: "Industrial Systems" },
      { id: "cie", name: "Computer Engineering" },
      { id: "ce", name: "Civil Engineering" },
      { id: "ee", name: "Electrical Engineering" },
      { id: "rae", name: "Robotics Engineering" },
      { id: "die", name: "Digital Electronics" },
      { id: "dms", name: "Digital Mfg Systems" },
      { id: "ae", name: "Automotive Engineering" },
    ],
    science: [
      { id: "cs", name: "Computer Science" },
      { id: "it", name: "Information Technology" },
      { id: "ps", name: "Physics" },
      { id: "est", name: "Environmental Science" },
      { id: "dst", name: "Digital Science" },
      { id: "daa", name: "Data Analytics" },
      { id: "act", name: "Applied Chemistry" },
    ],
    economics: [{ id: "econ", name: "Economics" }],
    maritime: [
      { id: "nao", name: "Naval Architecture" },
      { id: "ns", name: "Nautical Science" },
      { id: "mt", name: "Maritime Transportation" },
      { id: "me", name: "Marine Engineering" },
    ],
  };

  let currentMajors: Major[] = [];
  $: {
    if (faculty && majorData[faculty]) {
      currentMajors = majorData[faculty];
    } else {
      currentMajors = [];
    }
  }

  // --- Computed ---
  $: backUrl = role === "student" ? ROUTES.student.eventList : ROUTES.organizer.createEvent;
  $: userInitials = firstName && lastName 
    ? `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
    : "?";
  $: fullName = firstName && lastName ? `${title} ${firstName} ${lastName}` : "Loading...";

  // --- Helper Functions ---
  function getFacultyName(id: string) {
    const f = facultyList.find((x) => x.id === id);
    return f ? f.name : "Select Faculty";
  }
  function getFacultyIcon(id: string) {
    const f = facultyList.find((x) => x.id === id);
    return f ? f.icon : "🎓";
  }
  function getMajorName(id: string) {
    const m = currentMajors.find((x) => x.id === id);
    return m ? m.name : "Select Major";
  }
  function getDeptName(id: string) {
    const d = organizerDepartments.find((x) => x.id === id || x.name === id);
    return d ? d.name : id || "Select Department";
  }

  function closeAllDropdowns() {
    isTitleOpen = false;
    isFacultyOpen = false;
    isMajorOpen = false;
    isDeptOpen = false;
  }

  function toggleDropdown(
    type: "title" | "faculty" | "major" | "dept",
    e: Event
  ) {
    e.stopPropagation();
    const wasOpen =
      (type === "title" && isTitleOpen) ||
      (type === "faculty" && isFacultyOpen) ||
      (type === "major" && isMajorOpen) ||
      (type === "dept" && isDeptOpen);
    closeAllDropdowns();
    if (!wasOpen) {
      if (type === "title") isTitleOpen = true;
      if (type === "faculty") isFacultyOpen = true;
      if (type === "major") isMajorOpen = true;
      if (type === "dept") isDeptOpen = true;
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
  function selectDepartment(id: string) {
    department = id;
    isDeptOpen = false;
    clearMessage();
  }

  function showMessage(msg: string, type: "error" | "success" = "error") {
    if (messageTimeout) clearTimeout(messageTimeout);
    message = msg;
    messageType = type;
    messageTimeout = setTimeout(() => {
      message = "";
    }, 5000);
  }

  function clearMessage() {
    if (message) {
      message = "";
      if (messageTimeout) clearTimeout(messageTimeout);
    }
  }

  function triggerErrorHighlight() {
    if (errorTimeout) clearTimeout(errorTimeout);
    errorTimeout = setTimeout(() => {
      Object.keys(errorFields).forEach(
        (k) => (errorFields[k as ErrorKey] = false)
      );
    }, 3000);
  }

  // --- Profile Image Upload ---
  async function handleImageUpload(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    if (!file.type.startsWith("image/")) {
      showMessage("Please select an image file", "error");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showMessage("Image must be less than 5MB", "error");
      return;
    }

    isUploadingImage = true;
    
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_BASE_URL}/api/users/${userId}/avatar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        profileImage = data.avatar_url || URL.createObjectURL(file);
        showMessage("Profile photo updated!", "success");
      } else {
        profileImage = URL.createObjectURL(file);
        showMessage("Photo preview updated", "success");
      }
    } catch (error) {
      profileImage = URL.createObjectURL(file);
      showMessage("Photo preview updated", "success");
    } finally {
      isUploadingImage = false;
    }
  }

  onMount(async () => {
    isLoading = true;
    try {
      token = localStorage.getItem("access_token") || "";
      const userInfoStr = localStorage.getItem("user_info");

      if (userInfoStr) {
        try {
          const userInfo = JSON.parse(userInfoStr);
          userId = userInfo.nisit_id || userInfo.id;
        } catch (e) {
          console.error("Error parsing user_info", e);
        }
      }

      if (!token || !userId) throw new Error("User not authenticated");

      const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) return goto("/auth/login");
        throw new Error("Failed to fetch user data");
      }

      const data = await response.json();
      console.log("Fetched:", data);

      if (data.role) role = data.role.toLowerCase();
      else role = data.nisit_id || data.nisitId ? "student" : "officer";

      title = data.title || "";
      firstName = data.first_name || data.firstName || "";
      lastName = data.last_name || data.lastName || "";
      email = data.email || "";
      profileImage = data.avatar_url || data.profile_image || "";
      isEmailVerified = data.email_verified !== false;

      if (role === "student") {
    nisitId = data.nisit_id || data.nisitId || "";
    
    // แก้: แปลงเป็นตัวพิมพ์เล็ก เพื่อให้ match กับ id ใน facultyList
    faculty = (data.faculty || "").toLowerCase();
    
    // รอสักนิดเพื่อให้ faculty อัปเดต list ของ major
    setTimeout(() => {
        // แก้: แปลงเป็นตัวพิมพ์เล็ก
        major = (data.major || "").toLowerCase();
        
        // อัปเดต originalData ตรงนี้อีกครั้งเพื่อให้ปุ่ม Save ทำงานถูก
        originalData = { ...originalData, faculty, major };
    }, 100);
} else {
        department = data.department || "";
      }

      originalData = {
        title,
        firstName,
        lastName,
        faculty,
        major,
        department,
      };

      if (role === "student") {
        setTimeout(() => {
          originalData.major = data.major || "";
        }, 50);
      }
    } catch (error) {
      console.error(error);
      showMessage("Could not load profile info.", "error");
    } finally {
      isLoading = false;
    }
  });

  $: {
    const basicChanged =
      title !== originalData.title ||
      firstName !== originalData.firstName ||
      lastName !== originalData.lastName;

    let roleChanged = false;
    if (role === "student") {
      roleChanged =
        faculty !== originalData.faculty || major !== originalData.major;
    } else {
      roleChanged = department !== originalData.department;
    }

    isFormDirty = basicChanged || roleChanged;
  }

  async function handleSaveChanges() {
    clearMessage();
    let isValid = true;

    Object.keys(errorFields).forEach(
      (k) => (errorFields[k as ErrorKey] = false)
    );

    // Validate Basic Info
    if (!title) {
      errorFields.title = true;
      isValid = false;
    }
    if (!firstName.trim()) {
      errorFields.firstName = true;
      isValid = false;
    }
    if (!lastName.trim()) {
      errorFields.lastName = true;
      isValid = false;
    }

    if (role === "student") {
      if (!faculty) {
        errorFields.faculty = true;
        isValid = false;
      }
      if (!major) {
        errorFields.major = true;
        isValid = false;
      }
    } else {
      if (!department) {
        errorFields.department = true;
        isValid = false;
      }
    }

    if (!isValid) {
      triggerErrorHighlight();
      if (!message) showMessage("Please fill in all required fields.");
      return;
    }

    isSaving = true;

    try {
      const updateData = {
        title: title,
        first_name: firstName,
        last_name: lastName,
        major: major || originalData.major,
    faculty: faculty || originalData.faculty,
    department: department || originalData.department,
      };


      console.log("Sending Payload:", JSON.stringify(updateData, null, 2));
console.log("To URL:", `${API_BASE_URL}/api/users/${userId}`);
      console.log("Updating Profile with:", updateData);
      const putRes = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!putRes.ok) {
        const err = await putRes.json();
        throw new Error(err.message || "Failed to update profile info");
      }

      showMessage("Settings updated successfully!", "success");
      
      await Swal.fire({
        icon: "success",
        title: "Saved!",
        text: "Your settings have been updated.",
        timer: 1500,
        showConfirmButton: false,
        background: "#1f2937",
        color: "#f3f4f6",
      });

      setTimeout(() => window.location.reload(), 500);
    } catch (error: any) {
      console.error(error);
      showMessage(error.message, "error");
    } finally {
      isSaving = false;
    }
  }

  // --- Logout ---
  async function handleLogout() {
    const result = await Swal.fire({
      title: "Logout?",
      text: "Are you sure you want to logout?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, logout",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#ef4444",
      background: "#1f2937",
      color: "#f3f4f6",
    });

    if (result.isConfirmed) {
      // ✅ Clear ALL storage and cookies
      if (typeof localStorage !== 'undefined') {
        localStorage.clear();
      }
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.clear();
      }
      if (typeof document !== 'undefined') {
        document.cookie.split(";").forEach((c) => {
          document.cookie = c
            .replace(/^ +/, "")
            .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
      }
      
      window.location.href = "/auth/login";
    }
  }
</script>

<svelte:window on:click={closeAllDropdowns} />

<div class="app-container">
  <!-- Header -->
  <header class="header">
    <a href={backUrl} class="back-btn" aria-label="Back">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
        <path d="M19 12H5M12 19l-7-7 7-7"/>
      </svg>
    </a>
    <h1 class="header-title">Settings</h1>
    <div style="width: 40px;"></div>
  </header>

  <main class="main-content">
    {#if isLoading}
      <div class="loading-state" transition:fade>
        <div class="loading-spinner"></div>
        <p>Loading your profile...</p>
      </div>
    {:else}
      <!-- Profile Card -->
      <section class="profile-card" transition:slide>
        <div class="profile-header">
          <div class="avatar-wrapper">
            {#if profileImage}
              <img src={profileImage} alt="Profile" class="avatar-image" />
            {:else}
              <div class="avatar-placeholder">
                <span>{userInitials}</span>
              </div>
            {/if}
            
            <label class="avatar-upload-btn" class:uploading={isUploadingImage}>
              <input type="file" accept="image/*" on:change={handleImageUpload} hidden />
              {#if isUploadingImage}
                <div class="mini-spinner"></div>
              {:else}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              {/if}
            </label>
          </div>
          
          <div class="profile-info">
            <h2 class="profile-name">{fullName}</h2>
            <p class="profile-email">
              {email}
              {#if isEmailVerified}
                <span class="verified-badge" title="Email verified">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                  </svg>
                </span>
              {/if}
            </p>
            {#if nisitId}
              <span class="profile-badge">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="2" y="7" width="20" height="14" rx="2"/>
                  <path d="M16 7V5a4 4 0 0 0-8 0v2"/>
                </svg>
                {nisitId}
              </span>
            {/if}
          </div>
        </div>
      </section>

      <!-- Section Tabs -->
      <nav class="section-tabs">
        {#each sections as sec}
          <button 
            class="tab-btn" 
            class:active={activeSection === sec.id}
            on:click={() => activeSection = sec.id}
          >
            {#if sec.icon === "user"}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            {:else if sec.icon === "book"}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                <path d="M6 12v5c3 3 9 3 12 0v-5"/>
              </svg>
            {:else if sec.icon === "shield"}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            {/if}
            <span>{sec.label}</span>
          </button>
        {/each}
      </nav>

      <!-- Profile Section -->
      {#if activeSection === "profile"}
        <section class="settings-section" transition:slide>
          <h3 class="section-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            Personal Information
          </h3>

          <div class="form-row">
            <!-- Title -->
            <div class="form-group small">
              <span class="form-label">Title</span>
              <div class="custom-select">
                <button type="button" class="select-btn"
                  class:active={isTitleOpen} class:error={errorFields.title}
                  on:click={(e) => toggleDropdown("title", e)}>
                  <span class:placeholder={!title}>{title || "Select"}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class:rotate={isTitleOpen}>
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </button>
                {#if isTitleOpen}
                  <div class="select-dropdown" transition:slide={{ duration: 150 }}>
                    {#each titleList as t}
                      <button type="button" class="select-option" on:click={() => selectTitle(t)}>{t}</button>
                    {/each}
                  </div>
                {/if}
              </div>
            </div>

            <!-- First Name -->
            <div class="form-group flex-1">
              <label class="form-label" for="firstName">First Name</label>
              <div class="input-wrapper" class:error={errorFields.firstName}>
                <input id="firstName" type="text" bind:value={firstName} on:input={clearMessage} placeholder="Enter first name" />
              </div>
            </div>
          </div>

          <!-- Last Name -->
          <div class="form-group">
            <label class="form-label" for="lastName">Last Name</label>
            <div class="input-wrapper" class:error={errorFields.lastName}>
              <input id="lastName" type="text" bind:value={lastName} on:input={clearMessage} placeholder="Enter last name" />
            </div>
          </div>

          <!-- Email (Disabled) -->
          <div class="form-group">
            <span class="form-label">Email Address</span>
            <div class="input-wrapper disabled">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <input type="email" value={email} disabled />
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <span class="input-hint">Email cannot be changed</span>
          </div>
        </section>
      {/if}

      <!-- Academic Section -->
      {#if activeSection === "academic"}
        <section class="settings-section" transition:slide>
          <h3 class="section-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
              <path d="M6 12v5c3 3 9 3 12 0v-5"/>
            </svg>
            Academic Information
          </h3>

          {#if role === "student"}
            <!-- Nisit ID (Disabled) -->
            <div class="form-group">
              <span class="form-label">Student ID</span>
              <div class="input-wrapper disabled">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="2" y="7" width="20" height="14" rx="2"/>
                  <path d="M16 7V5a4 4 0 0 0-8 0v2"/>
                </svg>
                <input type="text" value={nisitId} disabled />
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <span class="input-hint">Student ID cannot be changed</span>
            </div>

            <!-- Faculty -->
            <div class="form-group">
              <span class="form-label">Faculty</span>
              <div class="custom-select">
                <button type="button" class="select-btn"
                  class:active={isFacultyOpen} class:error={errorFields.faculty}
                  on:click={(e) => toggleDropdown("faculty", e)}>
                  <span class="select-content">
                    {#if faculty}<span class="select-icon">{getFacultyIcon(faculty)}</span>{/if}
                    <span class:placeholder={!faculty}>{getFacultyName(faculty)}</span>
                  </span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class:rotate={isFacultyOpen}>
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </button>
                {#if isFacultyOpen}
                  <div class="select-dropdown" transition:slide={{ duration: 150 }}>
                    {#each facultyList as f}
                      <button type="button" class="select-option" on:click={() => selectFaculty(f.id)}>
                        <span class="option-icon">{f.icon}</span>{f.name}
                      </button>
                    {/each}
                  </div>
                {/if}
              </div>
            </div>

            <!-- Major -->
            <div class="form-group">
              <span class="form-label">Major</span>
              <div class="custom-select" class:disabled={!faculty}>
                <button type="button" class="select-btn"
                  class:active={isMajorOpen} class:error={errorFields.major}
                  disabled={!faculty}
                  on:click={(e) => faculty && toggleDropdown("major", e)}>
                  <span class:placeholder={!major}>{getMajorName(major)}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class:rotate={isMajorOpen}>
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </button>
                {#if isMajorOpen}
                  <div class="select-dropdown" transition:slide={{ duration: 150 }}>
                    {#each currentMajors as m}
                      <button type="button" class="select-option" on:click={() => selectMajor(m.id)}>{m.name}</button>
                    {/each}
                  </div>
                {/if}
              </div>
              {#if !faculty}<span class="input-hint">Please select a faculty first</span>{/if}
            </div>
          {:else}
            <!-- Department (Officer) -->
            <div class="form-group">
              <span class="form-label">Department</span>
              <div class="custom-select">
                <button type="button" class="select-btn"
                  class:active={isDeptOpen} class:error={errorFields.department}
                  on:click={(e) => toggleDropdown("dept", e)}>
                  <span class:placeholder={!department}>{getDeptName(department)}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class:rotate={isDeptOpen}>
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </button>
                {#if isDeptOpen}
                  <div class="select-dropdown" transition:slide={{ duration: 150 }}>
                    {#each organizerDepartments as dept}
                      <button type="button" class="select-option" on:click={() => selectDepartment(dept.id)}>{dept.name}</button>
                    {/each}
                  </div>
                {/if}
              </div>
            </div>
          {/if}
        </section>
      {/if}

      <!-- Security Section -->
      {#if activeSection === "security"}
        <section class="settings-section" transition:slide>
          <h3 class="section-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Security Settings
          </h3>

          <!-- Password -->
          <div class="form-group">
            <div class="form-label-row">
              <span class="form-label">Password</span>
              <a href="/auth/forgot-password?return_to={$page.url.pathname}" class="link-btn">Change Password</a>
            </div>
            <div class="input-wrapper disabled">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input type="password" value="••••••••••" disabled />
            </div>
          </div>

          <!-- Account Status Info -->
          <div class="info-card">
            <div class="info-row">
              <span class="info-label">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                Account Status
              </span>
              <span class="status-badge active">Active</span>
            </div>
            <div class="info-row">
              <span class="info-label">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                Email Verification
              </span>
              <span class="status-badge" class:verified={isEmailVerified} class:pending={!isEmailVerified}>
                {isEmailVerified ? 'Verified' : 'Pending'}
              </span>
            </div>
            <div class="info-row">
              <span class="info-label">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                Role
              </span>
              <span class="status-badge role">{role === 'student' ? 'Student' : 'Officer'}</span>
            </div>
          </div>

          <!-- Logout Button -->
          <button class="logout-btn" on:click={handleLogout}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Logout
          </button>
        </section>
      {/if}

      <!-- Message Toast -->
      {#if message}
        <div class="toast {messageType}" transition:slide={{ duration: 200 }}>
          {#if messageType === "error"}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          {:else}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          {/if}
          <span>{message}</span>
        </div>
      {/if}

      <!-- Save Button (Sticky) -->
      <div class="save-bar" class:visible={isFormDirty}>
        <button class="save-btn" on:click={handleSaveChanges} disabled={isSaving}>
          {#if isSaving}
            <div class="btn-spinner"></div>
            Saving...
          {:else}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>
            Save Changes
          {/if}
        </button>
      </div>
    {/if}
  </main>
</div>

<style>
  @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");

  :global(body) {
    margin: 0;
    padding: 0;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    min-height: 100vh;
    font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
  }

  .app-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  /* Header */
  .header {
    position: sticky;
    top: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    background: rgba(15, 23, 42, 0.95);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .back-btn {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #e2e8f0;
    cursor: pointer;
    transition: all 0.2s;
    text-decoration: none;
  }

  .back-btn:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: translateX(-2px);
  }

  .header-title {
    font-size: 18px;
    font-weight: 600;
    color: #f1f5f9;
    margin: 0;
  }

  /* Main Content */
  .main-content {
    flex: 1;
    padding: 20px;
    padding-bottom: 100px;
    max-width: 480px;
    margin: 0 auto;
    width: 100%;
    box-sizing: border-box;
  }

  /* Loading State */
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    color: #94a3b8;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(16, 185, 129, 0.2);
    border-top-color: #10b981;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin-bottom: 16px;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Profile Card */
  .profile-card {
    background: linear-gradient(145deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9));
    border-radius: 20px;
    padding: 24px;
    margin-bottom: 20px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  }

  .profile-header {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  .avatar-wrapper {
    position: relative;
    flex-shrink: 0;
  }

  .avatar-image,
  .avatar-placeholder {
    width: 80px;
    height: 80px;
    border-radius: 20px;
    object-fit: cover;
  }

  .avatar-placeholder {
    background: linear-gradient(135deg, #10b981, #059669);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 28px;
    font-weight: 700;
  }

  .avatar-upload-btn {
    position: absolute;
    bottom: -4px;
    right: -4px;
    width: 28px;
    height: 28px;
    border-radius: 8px;
    background: #10b981;
    border: 2px solid #0f172a;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    cursor: pointer;
    transition: all 0.2s;
  }

  .avatar-upload-btn:hover {
    background: #059669;
    transform: scale(1.1);
  }

  .avatar-upload-btn.uploading {
    pointer-events: none;
  }

  .mini-spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  .profile-info {
    flex: 1;
    min-width: 0;
  }

  .profile-name {
    font-size: 20px;
    font-weight: 700;
    color: #f1f5f9;
    margin: 0 0 4px 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .profile-email {
    font-size: 14px;
    color: #94a3b8;
    margin: 0 0 8px 0;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .verified-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    background: #10b981;
    border-radius: 50%;
    color: white;
  }

  .profile-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    background: rgba(16, 185, 129, 0.15);
    border: 1px solid rgba(16, 185, 129, 0.3);
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    color: #10b981;
  }

  /* Section Tabs */
  .section-tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 20px;
    padding: 4px;
    background: rgba(30, 41, 59, 0.5);
    border-radius: 14px;
  }

  .tab-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 16px;
    background: transparent;
    border: none;
    border-radius: 10px;
    color: #94a3b8;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .tab-btn:hover {
    color: #e2e8f0;
    background: rgba(255, 255, 255, 0.05);
  }

  .tab-btn.active {
    background: rgba(16, 185, 129, 0.2);
    color: #10b981;
  }

  /* Settings Section */
  .settings-section {
    background: rgba(30, 41, 59, 0.6);
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 16px;
    border: 1px solid rgba(255, 255, 255, 0.06);
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 16px;
    font-weight: 600;
    color: #e2e8f0;
    margin: 0 0 20px 0;
  }

  .section-title svg {
    color: #10b981;
  }

  /* Form Elements */
  .form-row {
    display: flex;
    gap: 12px;
  }

  .form-group {
    margin-bottom: 16px;
  }

  .form-group.small {
    flex: 0 0 100px;
  }

  .form-group.flex-1 {
    flex: 1;
  }

  .form-label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    color: #94a3b8;
    margin-bottom: 8px;
  }

  .form-label-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .link-btn {
    font-size: 12px;
    font-weight: 600;
    color: #10b981;
    text-decoration: none;
    transition: color 0.2s;
  }

  .link-btn:hover {
    color: #34d399;
    text-decoration: underline;
  }

  .input-wrapper {
    display: flex;
    align-items: center;
    gap: 12px;
    height: 52px;
    padding: 0 16px;
    background: rgba(15, 23, 42, 0.6);
    border: 2px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    transition: all 0.2s;
  }

  .input-wrapper:focus-within {
    border-color: #10b981;
    background: rgba(15, 23, 42, 0.8);
    box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.15);
  }

  .input-wrapper.error {
    border-color: #ef4444;
    box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.15);
  }

  .input-wrapper.disabled {
    background: rgba(15, 23, 42, 0.4);
    opacity: 0.7;
  }

  .input-wrapper input {
    flex: 1;
    border: none;
    background: transparent;
    color: #f1f5f9;
    font-size: 15px;
    outline: none;
  }

  .input-wrapper input::placeholder {
    color: #64748b;
  }

  .input-wrapper input:disabled {
    color: #64748b;
  }

  .input-wrapper svg {
    color: #64748b;
    flex-shrink: 0;
  }

  .input-hint {
    display: block;
    font-size: 12px;
    color: #64748b;
    margin-top: 6px;
  }

  /* Custom Select */
  .custom-select {
    position: relative;
  }

  .custom-select.disabled {
    opacity: 0.6;
    pointer-events: none;
  }

  .select-btn {
    width: 100%;
    height: 52px;
    padding: 0 16px;
    background: rgba(15, 23, 42, 0.6);
    border: 2px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: #f1f5f9;
    font-size: 15px;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
  }

  .select-btn:hover {
    border-color: rgba(255, 255, 255, 0.2);
  }

  .select-btn.active {
    border-color: #10b981;
    box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.15);
  }

  .select-btn.error {
    border-color: #ef4444;
    box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.15);
  }

  .select-btn .placeholder {
    color: #64748b;
  }

  .select-btn svg {
    color: #64748b;
    transition: transform 0.2s;
    flex-shrink: 0;
  }

  .select-btn svg.rotate {
    transform: rotate(180deg);
    color: #10b981;
  }

  .select-content {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .select-icon {
    font-size: 18px;
  }

  .select-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    margin-top: 8px;
    background: #1e293b;
    border: 2px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    max-height: 240px;
    overflow-y: auto;
    z-index: 50;
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.4);
  }

  .select-option {
    width: 100%;
    padding: 14px 16px;
    background: transparent;
    border: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    color: #e2e8f0;
    font-size: 14px;
    text-align: left;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 10px;
    transition: background 0.15s;
  }

  .select-option:last-child {
    border-bottom: none;
  }

  .select-option:hover {
    background: rgba(16, 185, 129, 0.15);
  }

  .option-icon {
    font-size: 16px;
  }

  /* Info Card */
  .info-card {
    background: rgba(15, 23, 42, 0.5);
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 20px;
  }

  .info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }

  .info-row:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  .info-row:first-child {
    padding-top: 0;
  }

  .info-label {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    color: #94a3b8;
  }

  .status-badge {
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
  }

  .status-badge.active {
    background: rgba(16, 185, 129, 0.15);
    color: #10b981;
  }

  .status-badge.verified {
    background: rgba(59, 130, 246, 0.15);
    color: #3b82f6;
  }

  .status-badge.pending {
    background: rgba(245, 158, 11, 0.15);
    color: #f59e0b;
  }

  .status-badge.role {
    background: rgba(139, 92, 246, 0.15);
    color: #a78bfa;
    text-transform: capitalize;
  }

  /* Logout Button */
  .logout-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 14px;
    background: rgba(239, 68, 68, 0.1);
    border: 2px solid rgba(239, 68, 68, 0.3);
    border-radius: 12px;
    color: #ef4444;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .logout-btn:hover {
    background: rgba(239, 68, 68, 0.2);
    border-color: #ef4444;
  }

  /* Toast Message */
  .toast {
    position: fixed;
    bottom: 100px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 20px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 500;
    z-index: 200;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    max-width: 90%;
  }

  .toast.error {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #b91c1c;
  }

  .toast.success {
    background: #ecfdf5;
    border: 1px solid #a7f3d0;
    color: #047857;
  }

  /* Save Bar */
  .save-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 16px 20px;
    padding-bottom: calc(16px + env(safe-area-inset-bottom, 0));
    background: rgba(15, 23, 42, 0.98);
    backdrop-filter: blur(20px);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    transform: translateY(100%);
    transition: transform 0.3s ease;
    z-index: 100;
  }

  .save-bar.visible {
    transform: translateY(0);
  }

  .save-btn {
    width: 100%;
    max-width: 480px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 16px;
    background: linear-gradient(135deg, #10b981, #059669);
    border: none;
    border-radius: 14px;
    color: white;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 4px 20px rgba(16, 185, 129, 0.4);
  }

  .save-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 24px rgba(16, 185, 129, 0.5);
  }

  .save-btn:active {
    transform: scale(0.98);
  }

  .save-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }

  .btn-spinner {
    width: 18px;
    height: 18px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  /* Responsive */
  @media (max-width: 400px) {
    .profile-header {
      flex-direction: column;
      text-align: center;
    }

    .profile-info {
      width: 100%;
    }

    .profile-email {
      justify-content: center;
    }

    .tab-btn span {
      display: none;
    }

    .tab-btn {
      padding: 12px;
    }
  }
</style>
