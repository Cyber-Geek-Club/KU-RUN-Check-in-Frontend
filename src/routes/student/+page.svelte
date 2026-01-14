<script lang="ts">
    import {goto} from "$app/navigation";
    import {slide} from "svelte/transition";
    import {onMount} from "svelte";
    import {page} from "$app/stores";
    import {ROUTES} from "$lib/utils/routes";

    const API_BASE_URL =
        import.meta.env.VITE_API_BASE_URL || "";

    let userId: string = "";
    let token: string = "";
    let role: string = "";

    let backUrl: string = "/";

    $: {
        if (role === "student") {
            backUrl = ROUTES.student.eventList;
        } else {
            backUrl = ROUTES.organizer.createEvent;
        }
    }

    let title: string = "";
    let firstName: string = "";
    let lastName: string = "";
    let email: string = "";

    let nisitId: string = "";
    let faculty: string = "";
    let major: string = "";

    let department: string = "";

    let isTitleOpen = false;
    let isFacultyOpen = false;
    let isMajorOpen = false;
    let isDeptOpen = false;

    let isLoading: boolean = true;
    let isSaving: boolean = false;

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

    const titleList = ["Mr.", "Ms.", "Mrs.", "Dr.", "Prof."];
    const organizerDepartments = [
        {id: "Academic Affairs", name: "Academic Affairs"},
        {id: "Student Affairs", name: "Student Affairs"},
        {id: "Registrar Office", name: "Registrar Office"},
        {id: "Finance Department", name: "Finance Department"},
        {id: "IT Support Center", name: "IT Support Center"},
        {id: "Human Resources", name: "Human Resources"},
    ];
    const facultyList = [
        {id: "management", name: "Management Sciences"},
        {id: "engineering", name: "Engineering at Sriracha"},
        {id: "science", name: "Science at Sriracha"},
        {id: "economics", name: "Economics at Sriracha"},
        {id: "maritime", name: "International Maritime Studies"},
    ];

    type Major = { id: string; name: string };
    const majorData: Record<string, Major[]> = {
        management: [
            {id: "mgt", name: "Management"},
            {id: "fin", name: "Finance and Investment"},
            {id: "ib", name: "International Business"},
            {id: "lm", name: "Logistics Management"},
            {id: "hh", name: "Hospitality - Hotel"},
            {id: "ht", name: "Hospitality - Tourism"},
            {id: "acc", name: "Accounting"},
            {id: "amb", name: "Digital Marketing"},
        ],
        engineering: [
            {id: "med", name: "Mechanical Engineering"},
            {id: "mme", name: "Mechanical & Mfg Systems"},
            {id: "eee", name: "Electrical & Electronics"},
            {id: "ise", name: "Industrial Systems"},
            {id: "cie", name: "Computer Engineering"},
            {id: "ce", name: "Civil Engineering"},
            {id: "ee", name: "Electrical Engineering"},
            {id: "rae", name: "Robotics Engineering"},
            {id: "die", name: "Digital Electronics"},
            {id: "dms", name: "Digital Mfg Systems"},
            {id: "ae", name: "Automotive Engineering"},
        ],
        science: [
            {id: "cs", name: "Computer Science"},
            {id: "it", name: "Information Technology"},
            {id: "ps", name: "Physics"},
            {id: "est", name: "Environmental Science"},
            {id: "dst", name: "Digital Science"},
            {id: "daa", name: "Data Analytics"},
            {id: "act", name: "Applied Chemistry"},
        ],
        economics: [{id: "econ", name: "Economics"}],
        maritime: [
            {id: "nao", name: "Naval Architecture"},
            {id: "ns", name: "Nautical Science"},
            {id: "mt", name: "Maritime Transportation"},
            {id: "me", name: "Marine Engineering"},
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

    function getFacultyName(id: string) {
        const f = facultyList.find((x) => x.id === id);
        return f ? f.name : "Select Faculty";
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
                if (response.status === 401) return goto("/login");
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

            if (role === "student") {
                nisitId = data.nisit_id || data.nisitId || "";
                faculty = data.faculty || "";
                setTimeout(() => {
                    major = data.major || "";
                }, 50);
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
                major: role === "student" ? major : null,
                faculty: role === "student" ? faculty : null,
                department: role === "officer" ? department : null,
            };

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
            setTimeout(() => window.location.reload(), 1500);
        } catch (error: any) {
            console.error(error);
            showMessage(error.message, "error");
        } finally {
            isSaving = false;
        }
    }
</script>

<svelte:window on:click={closeAllDropdowns}/>

<div class="app-screen">
    <div class="glass-header">
        <a aria-label="Back" class="back-btn" href={backUrl}>
            <svg
                    fill="none"
                    height="24"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    viewBox="0 0 24 24"
                    width="24"
            >
                <line x1="19" x2="5" y1="12" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
        </a>
    </div>

    <div class="scroll-container">
        <div class="content-wrapper">
            <div class="form-card">
                <div class="title-section">
                    <h1 class="main-title">ACCOUNT SETTINGS</h1>
                    <p class="sub-title">Update your profile information.</p>
                </div>

                {#if isLoading}
                    <div style="text-align: center; color: #9ca3af; padding: 40px;">
                        <p>Loading...</p>
                    </div>
                {:else}
                    <div class="form-section" transition:slide>
                        <div class="row-group">
                            <div class="form-group" style="flex: 0 0 90px;">
                                <label class="label" for="title-trigger">Title</label>
                                <div class="custom-select-container">
                                    <button
                                            type="button"
                                            id="title-trigger"
                                            class="select-trigger {errorFields.title
                      ? 'error-border'
                      : ''}"
                                            class:active={isTitleOpen}
                                            on:click={(e) => toggleDropdown("title", e)}
                                    >
                                        <span>{title || "Title"}</span>
                                        <div class="arrow-icon" class:rotate={isTitleOpen}>
                                            <svg
                                                    width="16"
                                                    height="16"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    stroke-width="2">
                                                <path d="M6 9l6 6 6-6"/>
                                            </svg
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
                                <label class="label" for="firstname">First Name</label>
                                <div
                                        class="input-field"
                                        class:error-border={errorFields.firstName}
                                >
                                    <input
                                            id="firstname"
                                            type="text"
                                            bind:value={firstName}
                                            on:input={clearMessage}
                                            placeholder="First Name"
                                    />
                                </div>
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="label" for="lastname">Last Name</label>
                            <div
                                    class="input-field"
                                    class:error-border={errorFields.lastName}
                            >
                                <input
                                        id="lastname"
                                        type="text"
                                        bind:value={lastName}
                                        on:input={clearMessage}
                                        placeholder="Last Name"
                                />
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="label" for="email">Email</label>
                            <div class="input-field disabled">
                                <input id="email" type="email" value={email} disabled/>
                                <svg
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="#6b7280"
                                        stroke-width="2"
                                >
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"
                                    ></rect>
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                </svg
                                >
                            </div>
                        </div>

                        {#if role === "student"}
                            <div class="form-group" transition:slide|local>
                                <label class="label" for="nisitId">Nisit ID</label>
                                <div class="input-field disabled">
                                    <input id="nisitId" type="text" value={nisitId} disabled/>
                                    <svg
                                            width="18"
                                            height="18"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="#6b7280"
                                            stroke-width="2"
                                    >
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"
                                        ></rect>
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                    </svg
                                    >
                                </div>
                            </div>

                            <div class="form-group" transition:slide|local>
                                <label class="label" for="faculty-trigger">Faculty</label>
                                <div class="custom-select-container">
                                    <button
                                            type="button"
                                            id="faculty-trigger"
                                            class="select-trigger {errorFields.faculty
                      ? 'error-border'
                      : ''}"
                                            class:active={isFacultyOpen}
                                            on:click={(e) => toggleDropdown("faculty", e)}
                                    >
                                        <span>{getFacultyName(faculty)}</span>
                                        <div class="arrow-icon" class:rotate={isFacultyOpen}>
                                            <svg
                                                    width="20"
                                                    height="20"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    stroke-width="2">
                                                <path d="M6 9l6 6 6-6"/>
                                            </svg
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
                                                >
                                                    {f.name}
                                                </button>
                                            {/each}
                                        </div>
                                    {/if}
                                </div>
                            </div>

                            <div class="form-group" transition:slide|local>
                                <label class="label" for="major-trigger">Major</label>
                                <div class="custom-select-container" class:disabled={!faculty}>
                                    <button
                                            type="button"
                                            id="major-trigger"
                                            class="select-trigger {errorFields.major
                      ? 'error-border'
                      : ''}"
                                            class:active={isMajorOpen}
                                            disabled={!faculty}
                                            class:placeholder={!major}
                                            on:click={(e) => {
                      if (faculty) toggleDropdown("major", e);
                    }}
                                    >
                                        <span>{getMajorName(major)}</span>
                                        <div class="arrow-icon" class:rotate={isMajorOpen}>
                                            <svg
                                                    width="20"
                                                    height="20"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    stroke-width="2">
                                                <path d="M6 9l6 6 6-6"/>
                                            </svg
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
                                                >
                                                    {m.name}
                                                </button>
                                            {/each}
                                        </div>
                                    {/if}
                                </div>
                            </div>
                        {:else}
                            <div class="form-group" transition:slide|local>
                                <label class="label" for="dept-trigger">Department</label>
                                <div class="custom-select-container">
                                    <button
                                            type="button"
                                            id="dept-trigger"
                                            class="select-trigger {errorFields.department
                      ? 'error-border'
                      : ''}"
                                            class:active={isDeptOpen}
                                            on:click={(e) => toggleDropdown("dept", e)}
                                    >
                                        <span>{getDeptName(department)}</span>
                                        <div class="arrow-icon" class:rotate={isDeptOpen}>
                                            <svg
                                                    width="20"
                                                    height="20"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    stroke-width="2">
                                                <path d="M6 9l6 6 6-6"/>
                                            </svg
                                            >
                                        </div>
                                    </button>
                                    {#if isDeptOpen}
                                        <div
                                                class="options-list"
                                                transition:slide={{ duration: 150 }}
                                        >
                                            {#each organizerDepartments as dept}
                                                <button
                                                        type="button"
                                                        class="option-item"
                                                        on:click={() => selectDepartment(dept.id)}
                                                >
                                                    {dept.name}
                                                </button>
                                            {/each}
                                        </div>
                                    {/if}
                                </div>
                            </div>
                        {/if}

                        <div class="form-group">
                            <div class="password-label-row">
                                <span class="label">Password</span>
                                <a
                                        href="/auth/forgot-password?return_to={$page.url.pathname}"
                                        class="text-btn">CHANGE</a
                                >
                            </div>

                            <div class="input-field disabled" transition:slide|local>
                                <input type="password" value="••••••••" disabled/>
                                <svg
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="#6b7280"
                                        stroke-width="2"
                                >
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"
                                    ></rect>
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                </svg
                                >
                            </div>
                        </div>

                        {#if message}
                            <div
                                    class="message-container {messageType}"
                                    transition:slide={{ duration: 200 }}
                            >
                                {#if messageType === "error"}
                                    <svg
                                            style="flex-shrink: 0;"
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
                                {:else}
                                    <svg
                                            style="flex-shrink: 0;"
                                            width="20"
                                            height="20"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            stroke-width="2"
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
                                disabled={!isFormDirty || isSaving}
                        >
                            {isSaving ? "SAVING..." : "SAVE CHANGES"}
                        </button>
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

    :global(button),
    :global(input),
    :global(label),
    :global(span),
    :global(h1),
    :global(p),
    :global(a),
    :global(div) {
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

    .row-group {
        display: flex;
        gap: 8px;
        width: 100%;
        margin-bottom: 20px;
    }

    .row-group .form-group {
        margin-bottom: 0;
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
        font-size: 14px;
        font-weight: 600;
    }

    .password-label-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .text-btn {
        background: none;
        border: none;
        color: #10b981;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        letter-spacing: 0.5px;
        text-decoration: none;
    }

    .text-btn:hover {
        text-decoration: underline;
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

    .input-field.disabled,
    .custom-select-container.disabled .select-trigger {
        background: #111827;
        border-color: #374151;
        opacity: 0.7;
        cursor: not-allowed;
    }

    .input-field.disabled input {
        color: #9ca3af;
    }

    .error-border {
        border-color: #ef4444 !important;
        box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.25) !important;
    }

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

    .message-container svg {
        flex-shrink: 0;
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

    .primary-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        background: #374151;
        color: #9ca3af;
        box-shadow: none;
    }
</style>
