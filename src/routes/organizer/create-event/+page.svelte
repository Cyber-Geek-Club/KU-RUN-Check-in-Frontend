<script lang="ts">
import { onMount } from 'svelte';
import { goto } from '$app/navigation';
import { auth } from '$lib/utils/auth';

onMount(() => {
  // Get user info from localStorage or auth util
  let user: any = null;
  try {
    const userStr = localStorage.getItem('user') || localStorage.getItem('user_info');
    if (userStr) user = JSON.parse(userStr);
  } catch {}
  // Fallback: try auth util if available
  if (!user && auth?.getUser) user = auth.getUser();

  // Check role
  const role = user?.role || user?.roles?.[0];
  if (role !== 'organizer') {
    // Not allowed, redirect
    goto('/');
  }
});
</script>
<script lang="ts">
  import { onMount } from "svelte";
  import { fade, slide, scale, fly } from "svelte/transition";
  import { quintOut } from "svelte/easing";
  import Swal from "sweetalert2";
  import { enhance } from "$app/forms";
  import { goto } from "$app/navigation";
  import { auth } from "$lib/utils/auth";
  import { lazyLoadBg } from "$lib/utils/lazyLoad";
  import { resolveImageUrl, uploadImage, validateImageFile, API_BASE_URL } from "$lib/utils/imageUtils";

  let currentView: "list" | "form" = "list";
  let isEditMode = false;
  let editingId: number | null = null;
  let isLoading = false;
  let events: any[] = [];
  let fileInput!: HTMLInputElement;
  let searchQuery = "";
  let selDistance = "";
  let isActive = true;
  let isPublished = false;
  let result;

  let currentPage = 1;
  const itemsPerPage = 4;

  $: totalPages = Math.ceil(filteredEvents.length / itemsPerPage) || 1;

  $: paginatedEvents = filteredEvents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  $: {
    searchQuery;
    filterMonth;
    filterYear;
    currentPage = 1;
  }

  function nextPage() {
    if (currentPage < totalPages) currentPage++;
  }

  function prevPage() {
    if (currentPage > 1) currentPage--;
  }

  export let filterMonth: string = "";
  export let filterYear: string | number = "";
  $: availableYears = [...new Set(events.map((e) => e.year))].sort();

  let showFilterMenu = false;

  function selectMonth(m: string) {
    filterMonth = filterMonth === m ? "" : m;
  }

  function selectYear(y: string | number) {
    filterYear = filterYear === y ? "" : y;
  }

  function handleClickOutside(event: MouseEvent) {
    const target = event.target as Element;
    if (target && !target.closest(".date-filter-wrapper")) {
      showFilterMenu = false;
    }
  }

  onMount(() => {
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  });

  $: filteredEvents = events.filter((event) => {
    const eventDate = new Date(event.date);
    const eventMonthName = eventDate.toLocaleString("default", {
      month: "long",
    });
    const eventYear = eventDate.getFullYear();
    const matchesSearch =
      searchQuery === "" ||
      event.title.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesMonth = filterMonth === "" || eventMonthName === filterMonth;
    const matchesYear = filterYear === "" || eventYear === filterYear;
    return matchesSearch && matchesMonth && matchesYear;
  });

  $: if (!isEditMode) {
    isActive = false;
    isPublished = false;
  }

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  function getMonthIndex(monthName: string) {
    return months.indexOf(monthName);
  }

  function combineDateToISO(
    day: string,
    month: string,
    year: string,
    time: string
  ): string | null {
    if (!day || !month || !year || !time) return null;
    const monthIndex = getMonthIndex(month);
    const [hours, minutes] = time.split(":").map(Number);
    
    // ใช้ format YYYY-MM-DDTHH:mm:ss โดยไม่ใช้ toISOString() เพื่อหลีกเลี่ยง timezone conversion
    const y = parseInt(year);
    const m = (monthIndex + 1).toString().padStart(2, '0');
    const d = parseInt(day).toString().padStart(2, '0');
    const h = hours.toString().padStart(2, '0');
    const min = minutes.toString().padStart(2, '0');
    
    return `${y}-${m}-${d}T${h}:${min}:00`;
  }

  async function fetchEvents() {
    isLoading = true;
    try {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("NO TOKEN FOUND");

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };
      const res = await fetch(`${API_BASE_URL}/api/events`, { headers });
      if (res.status === 401) {
        handleLogout();
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch events");

      const raw = await res.json();
      const rawList = Array.isArray(raw) ? raw : raw.events || raw.data || [];
      const eventsWithCount = await Promise.all(
        rawList.map(async (e: any) => {
          let participantCount = 0;
          let studentCount = 0;
          let officerCount = 0;

          const rawActive = e.is_active ?? e.isActive ?? e.active;
          const rawPublished = e.is_published ?? e.isPublished ?? e.published;

          // 2. แปลงค่าที่ได้เป็น Boolean ทันที
          const finalActive =
            String(rawActive) === "1" || rawActive === true || rawActive === 1;
          const finalPublished =
            String(rawPublished) === "1" ||
            rawPublished === true ||
            rawPublished === 1;
          try {
            const statsRes = await fetch(
              `${API_BASE_URL}/api/events/${e.id}/stats`,
              {
                method: "GET",
                headers,
              }
            );
            if (statsRes.ok) {
              const stats = await statsRes.json();
              participantCount = stats.total || 0;
              if (stats.by_role) {
                const roles = Object.keys(stats.by_role).reduce((acc, key) => {
                  acc[key.toLowerCase()] = stats.by_role[key];
                  return acc;
                }, {} as any);
                studentCount = (roles.student || 0) + (roles.nisit || 0);
                officerCount =
                  (roles.officer || 0) +
                  (roles.staff || 0) +
                  (roles.teacher || 0);
              }
            } else {
              console.warn(
                `Failed to fetch stats for event ${e.id}: ${statsRes.status}`
              );
            }
          } catch (err) {
            console.error(`Error fetching stats for event ${e.id}`, err);
          }
          return {
            id: e.id,
            title: e.title,
            description: e.description,
            image:
              e.banner_image_url ||
              "https://images.unsplash.com/photo-1552674605-46f5383a6719?auto=format&fit=crop&w=600&q=80",
            location: e.location,
            maxParticipants: e.max_participants,
            currentParticipants: participantCount,
            studentCount: studentCount,
            officerCount: officerCount,
            distance_km: e.distance_km,
            is_active: finalActive,
            is_published: finalPublished,
            ...parseISOToUI(e.event_date, e.event_end_date),
          };
        })
      );
      events = eventsWithCount;
    } catch (err) {
      console.error("FETCH EVENTS ERROR:", err);
      events = [];
    } finally {
      isLoading = false;
    }
  }

  function parseISOToUI(startDateStr: string, endDateStr: string) {
    if (!startDateStr) return {};
    const date = new Date(startDateStr);
    let endTimeStr = "";
    if (endDateStr) {
      const endDate = new Date(endDateStr);
      const endH = endDate.getHours().toString().padStart(2, "0");
      const endM = endDate.getMinutes().toString().padStart(2, "0");
      endTimeStr = `${endH}:${endM}`;
    }
    const startH = date.getHours().toString().padStart(2, "0");
    const startM = date.getMinutes().toString().padStart(2, "0");
    return {
      day: date.getDate().toString(),
      month: months[date.getMonth()],
      year: date.getFullYear().toString(),
      startTime: `${startH}:${startM}`,
      endTime: endTimeStr,
    };
  }

  onMount(() => {
    fetchEvents();
  });

  let isMenuOpen = false;
  function toggleMenu() {
    isMenuOpen = !isMenuOpen;
  }
  function handleOverlayKeydown(event: KeyboardEvent) {
    if (event.key === "Enter" || event.key === " ") toggleMenu();
  }

  function handleDelete(id: number) {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#B4151D",
      cancelButtonColor: "#6B7280",
      confirmButtonText: "Yes, delete it!",
      customClass: { popup: "my-swal-popup" },
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const token = localStorage.getItem("access_token");
          const res = await fetch(`${API_BASE_URL}/api/events/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) throw new Error("Delete failed");
          events = events.filter((e) => e.id !== id);
          Swal.fire({
            title: "Deleted!",
            icon: "success",
            showConfirmButton: false,
            timer: 1500,
            customClass: { popup: "my-swal-popup" },
          });
        } catch (error) {
          Swal.fire("Error", "Could not delete event", "error");
        }
      }
    });
  }

  function goToCreate() {
    resetForm();
    isEditMode = false;
    currentView = "form";
  }

  function goToEdit(id: number) {
    console.log("Click Edit ID:", id);

    const event = events.find((e) => e.id === id);

    if (event) {
      console.log("Found Event Data:", event); 
      console.log(
        "Raw Active:",
        event.is_active,
        "Raw Published:",
        event.is_published
      );

      eventName = event.title;
      eventDescription = event.description;
      previewImage = event.image;
      selSlots = event.maxParticipants ? event.maxParticipants.toString() : "";
      eventLocation = event.location || "";
      selDistance = event.distance_km ? event.distance_km.toString() : "";


      selDay = event.day || "";
      selMonth = event.month || "";
      selYear = event.year || "";
      selStartTime = event.startTime || "";
      selEndTime = event.endTime || "";

      editingId = id;
      isEditMode = true;
      currentView = "form";
      isActive = !!event.is_active; 
      isPublished = !!event.is_published;
    
      console.log(
        "Converted -> isActive:",
        isActive,
        "isPublished:",
        isPublished
      );
    } else {
      console.error("Event not found in list");
    }
  }

  function backToList() {
    currentView = "list";

    resetForm();
  }
  let eventName = "";
  let selDay = "";
  let selMonth = "";
  let selYear = "";
  let selStartTime = "";
  let selEndTime = "";
  let selSlots = "";
  let eventLocation = "";
  let eventDescription = "";
  let previewImage = "";
  let activeDropdown = "";
  let errorMessage = "";
  let successMessage = "";
  let msgTimeout: any;
  let errorField: string = "";

  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) =>
    (currentYear + i).toString()
  );
  const times: string[] = [];
  for (let i = 0; i < 24; i++) {
    const hour = i.toString().padStart(2, "0");
    times.push(`${hour}:00`, `${hour}:30`);
  }
  const slotsOptions = ["10", "20", "50", "100", "200", "500"];

  function resetForm() {
    eventName = "";
    selDay = "";
    selMonth = "";
    selYear = "";
    selStartTime = "";
    selEndTime = "";
    selSlots = "";
    eventLocation = "";
    eventDescription = "";
    previewImage = "";
    errorMessage = "";
    successMessage = "";
    errorField = "";
    selDistance = "";
    isActive = false;
    isPublished = false;
    editingId = null;
    if (fileInput) fileInput.value = "";
  }

  function clearMessages() {
    if (errorMessage || successMessage) {
      errorMessage = "";
      successMessage = "";
      if (msgTimeout) clearTimeout(msgTimeout);
    }
  }

  // clearClientData removed - auth.logout() now handles all cleanup

  function handleImageUpload() {
    clearMessages();
    if (fileInput) {
      fileInput.value = "";
      fileInput.click();
    }
  }

  function removeImage(e: Event) {
    e.stopPropagation();
    previewImage = "";
    if (fileInput) fileInput.value = "";
  }

  let isImageUploading = false;

  async function onFileSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    
    // Validate file before upload
    const validation = validateImageFile(file);
    if (!validation.valid) {
      errorMessage = validation.error || "Invalid file";
      input.value = "";
      return;
    }

    isImageUploading = true;

    try {
      console.log("Start Uploading...");
      
      const result = await uploadImage(file, 'events');
      console.log("Upload success:", result);

      // Resolve URL to full path
      const finalUrl = resolveImageUrl(result.url);
      console.log("Final URL:", finalUrl);

      previewImage = finalUrl;
    } catch (err: any) {
      console.error("Upload Error:", err);
      errorMessage = "Upload failed: " + err.message;
      previewImage = "";
    } finally {
      isImageUploading = false;
      input.value = "";
    }
  }

  function toggleDropdown(name: string, event: Event) {
    event.stopPropagation();
    activeDropdown = activeDropdown === name ? "" : name;
  }
  function openDropdown(name: string) {
    activeDropdown = name;
  }
  const distanceOptions = ["10", "20", "50", "100", "200", "500"];
  function selectOption(type: string, value: any) {
    clearMessages();
    if (type === "day") selDay = value;
    if (type === "month") selMonth = value;
    if (type === "year") selYear = value;
    if (type === "startTime") selStartTime = value;
    if (type === "endTime") selEndTime = value;
    if (type === "slots") selSlots = value;
    if (type === "distance") selDistance = value;
    activeDropdown = "";
  }
  function closeDropdowns() {
    activeDropdown = "";
  }
  function handleTimeInput(event: Event, type: "start" | "end") {
    clearMessages();
    const input = event.target as HTMLInputElement;
    let v = input.value.replace(/[^0-9]/g, "");
    if (v.length > 4) v = v.slice(0, 4);
    if (v.length > 2) v = v.slice(0, 2) + ":" + v.slice(2);
    input.value = v;
    if (type === "start") selStartTime = v;
    if (type === "end") selEndTime = v;
  }
  function handleSlotInput(event: Event) {
    clearMessages();
    const input = event.target as HTMLInputElement;
    let v = input.value.replace(/[^0-9]/g, "");
    input.value = v;
    selSlots = v;
  }
  function handleLogout() {
    auth.logout();
    isMenuOpen = false;
    goto("/auth/login", { replaceState: true });
  }
  function getSelectClass(value: any) {
    return value === "" ? "text-gray" : "text-dark";
  }
  function getAuthHeaders() {
    const token = localStorage.getItem("access_token");
    if (!token) throw new Error("No access token found. Please login again.");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }

  async function handlePublish() {
    if (msgTimeout) clearTimeout(msgTimeout);
    errorMessage = "";
    successMessage = "";
    errorField = "";

    if (!eventName) {
      errorField = "eventName";
      errorMessage = "Please enter the Event name.";
    } else if (!selDay) {
      errorField = "day";
      errorMessage = "Please select the Event Day.";
    } else if (!selMonth) {
      errorField = "month";
      errorMessage = "Please select the Event Month.";
    } else if (!selYear) {
      errorField = "year";
      errorMessage = "Please select the Event Year.";
    } else if (!selStartTime) {
      errorField = "startTime";
      errorMessage = "Please enter the Start time.";
    } else if (!selEndTime) {
      errorField = "endTime";
      errorMessage = "Please enter the End time.";
    } else if (!eventLocation) {
      errorField = "eventLocation";
      errorMessage = "Please enter the Event location.";
    } else if (!selSlots) {
      errorField = "slots";
      errorMessage = "Please enter slots.";
    } else if (!previewImage) {
      errorField = "image";
      errorMessage = "Please upload an event banner.";
    }

    if (errorMessage) {
      msgTimeout = setTimeout(() => {
        errorMessage = "";
        errorField = "";
      }, 3000);
      return;
    }
    const isoStartDate = combineDateToISO(
      selDay,
      selMonth,
      selYear,
      selStartTime
    );
    const isoEndDate = combineDateToISO(selDay, selMonth, selYear, selEndTime);

    let maxParticipantsInt = 0;
    if (selSlots !== "Unlimited") {
      maxParticipantsInt = parseInt(selSlots);
      if (isNaN(maxParticipantsInt)) maxParticipantsInt = 0;
    }

    let finalDistance = parseFloat(selDistance);
    if (isNaN(finalDistance)) finalDistance = 0;

    const eventPayload = {
      title: eventName,
      description: eventDescription || "",
      event_date: isoStartDate,
      event_end_date: isoEndDate,
      location: eventLocation,
      max_participants: maxParticipantsInt,
      distance_km: finalDistance,
      is_active: isActive ? 1 : 0,
      is_published: isPublished ? 1 : 0,

      banner_image_url: previewImage || "",
    };

    console.log("Payload Sending:", eventPayload);
    isLoading = true;

    try {
      const headers = getAuthHeaders();
      let response;
      if (isEditMode && editingId) {
        response = await fetch(`${API_BASE_URL}/api/events/${editingId}`, {
          method: "PUT",
          headers: headers,
          body: JSON.stringify(eventPayload),
        });
      } else {
        response = await fetch(`${API_BASE_URL}/api/events`, {
          method: "POST",
          headers: headers,
          body: JSON.stringify(eventPayload),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || errorData.detail || "Failed to save event"
        );
      }

  
      const result = await response.json();

      let valActive = result.is_active ?? result.isActive ?? result.active;
      if (valActive === undefined) {
        valActive = isActive; 
      }

      let valPublished =
        result.is_published ?? result.isPublished ?? result.published;
      if (valPublished === undefined) {
        valPublished = isPublished; 
      }

      const newEventMapped = {
        id: result.id,
        title: result.title || eventName,
        description: result.description,
        image: result.banner_image_url || previewImage || "",
        currentParticipants: result.current_participants || 0,
        maxParticipants: result.max_participants || maxParticipantsInt,
        location: result.location || eventLocation,
        distance_km: result.distance_km || finalDistance,
        is_active: isActive === true,
        is_published: isPublished === true,

        ...parseISOToUI(
          result.event_date || isoStartDate,
          result.event_end_date || isoEndDate
        ),
      };

      if (isEditMode) {
        events = events.map((e) => (e.id === editingId ? newEventMapped : e));
        successMessage = "Event updated successfully.";
      } else {
        events = [newEventMapped, ...events];
        successMessage = "Event created successfully.";
      }

      msgTimeout = setTimeout(() => {
        successMessage = "";
        backToList();
      }, 1500);
    } catch (error: any) {
      console.error("Save Error:", error);
      errorMessage = error.message;
      if (error.message.includes("401")) {
        handleLogout();
      }
      msgTimeout = setTimeout(() => {
        errorMessage = "";
      }, 3000);
    } finally {
      isLoading = false;
    }
  }
</script>

<svelte:window on:click={closeDropdowns} />

<div class="app-screen">
  <div class="glass-header">
    {#if currentView === "list"}
      <h1 class="page-title">CREATE EVENT</h1>
      <button
        class="menu-burger"
        class:active={isMenuOpen}
        on:click|stopPropagation={toggleMenu}
        aria-label="Toggle menu"
      >
        <span class="line line-1"></span>
        <span class="line line-2"></span>
      </button>
    {:else}
      <button class="back-btn" on:click={backToList} aria-label="Back">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          ><line x1="19" y1="12" x2="5" y2="12"></line><polyline
            points="12 19 5 12 12 5"
          ></polyline></svg
        >
      </button>
      <h1 class="page-title">{isEditMode ? "EDIT EVENT" : "CREATE EVENT"}</h1>
    {/if}
  </div>

  {#if currentView === "list" && isMenuOpen}
    <div
      class="menu-overlay"
      role="button"
      tabindex="0"
      on:click={toggleMenu}
      on:keydown={handleOverlayKeydown}
      transition:fade={{ duration: 200 }}
    ></div>
    <div
      class="dropdown-menu"
      transition:scale={{
        duration: 250,
        start: 0.9,
        opacity: 0,
        easing: quintOut,
      }}
    >
      <div class="menu-arrow"></div>
      <a href="/organizer/event-verify" class="menu-item">
        <span class="icon">&#x2705;</span> Verify Code
      </a>

      <a href="/organizer/upload-proof" class="menu-item">
        <span class="icon">&#x1F9FE;</span> Verify Proof
      </a>

      <a href="/organizer/unlock-user" class="menu-item">
        <span class="icon">&#x1F513;</span> Unlock User
      </a>

      <a href="/organizer/event-log" class="menu-item">
        <span class="icon">&#x1F4CB;</span> Event Log
      </a>

      <div
        class="menu-item"
        style="opacity: 0.5; cursor: not-allowed; pointer-events: none;"
      >
        <span class="icon">&#x1F381;</span> Monthly Reward
        <span style="font-size: 12px; margin-left: 4px;">🔒</span>
      </div>

      <a href="/organizer/setting-account" class="menu-item">
        <span class="icon">&#x2699;&#xFE0F;</span> Settings
      </a>
      <div class="menu-divider"></div>
      <form
        action="?/logout"
        method="POST"
        use:enhance={() => {
          isMenuOpen = false;

          return async ({ result, update }) => {
            if (result.type === "redirect") {
              await goto(result.location);
            } else {
              await update();
            }
          };
        }}
        style="display: contents;"
      >
        <button type="button" class="menu-item logout" on:click={handleLogout}>
          <span class="icon">🚪</span> Logout
        </button>
      </form>
    </div>
  {/if}

  <div class="scroll-container">
    <div class="content-wrapper">
      {#if currentView === "list"}
        <div class="search-sticky-header" in:fade>
          <div class="search-center-wrapper">
            <div class="unified-search-bar">
              <span class="search-icon">
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
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </span>

              <input
                type="text"
                class="ghost-input"
                placeholder="Search events..."
                bind:value={searchQuery}
              />

              {#if searchQuery}
                <button
                  class="clear-btn-inside"
                  on:click={() => (searchQuery = "")}
                  aria-label="Clear search"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              {/if}

              <div class="date-filter-wrapper">
                <button
                  class="filter-icon-btn {filterMonth || filterYear
                    ? 'active'
                    : ''}"
                  on:click|stopPropagation={() =>
                    (showFilterMenu = !showFilterMenu)}
                  aria-label="Filter Date"
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
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"
                    ></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>

                  {#if filterMonth || filterYear}
                    <span class="active-dot"></span>
                  {/if}
                </button>

                {#if showFilterMenu}
                  <div class="unified-filter-menu">
                    <div class="filter-header">
                      <span class="current-selection">
                        {filterMonth ? filterMonth : "All Months"}
                        {filterYear
                          ? `, ${filterYear}`
                          : filterYear
                            ? `All Months, ${filterYear}`
                            : ""}
                      </span>
                      {#if filterMonth || filterYear}
                        <button
                          type="button"
                          class="reset-link"
                          on:click={() => {
                            filterMonth = "";
                            filterYear = "";
                          }}
                        >
                          Reset
                        </button>
                      {/if}
                    </div>

                    <div class="filter-body">
                      <div class="filter-column year-column">
                        <div class="column-label">Year</div>
                        <div class="scroll-area">
                          <button
                            type="button"
                            class="filter-chip {filterYear === ''
                              ? 'selected'
                              : ''}"
                            on:click={() => selectYear("")}
                          >
                            All
                          </button>
                          {#each availableYears as y}
                            <button
                              type="button"
                              class="filter-chip {filterYear === y
                                ? 'selected'
                                : ''}"
                              on:click={() => selectYear(y)}
                            >
                              {y}
                            </button>
                          {/each}
                        </div>
                      </div>

                      <div class="filter-column month-column">
                        <div class="column-label">Month</div>
                        <div class="month-grid">
                          <button
                            type="button"
                            class="filter-chip {filterMonth === ''
                              ? 'selected'
                              : ''}"
                            style="grid-column: span 3;"
                            on:click={() => selectMonth("")}
                          >
                            All Months
                          </button>
                          {#each months as m}
                            <button
                              type="button"
                              class="filter-chip {filterMonth === m
                                ? 'selected'
                                : ''}"
                              on:click={() => selectMonth(m)}
                            >
                              {m.substring(0, 3)}
                            </button>
                          {/each}
                        </div>
                      </div>
                    </div>
                  </div>
                {/if}
              </div>
            </div>
          </div>
        </div>

        <div class="event-list" in:fade>
          {#each paginatedEvents as event (event.id)}
            <div class="card" in:fly={{ y: 20, duration: 300, delay: 100 }}>
              <div class="card-image">
                <img src={event.image} alt={event.title} />
              </div>
              <div class="card-content">
                <div class="card-header-row">
                  <h3 class="card-title">{event.title}</h3>

                  <div class="stats-container">
                    <div class="stat-badge student" title="Students">
                      <svg
                        class="users-icon"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                        <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
                      </svg>
                      <span>{event.studentCount || 0}</span>
                    </div>

                    <div class="stat-badge officer" title="Officers">
                      <svg
                        class="users-icon"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"
                        ></rect>
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"
                        ></path>
                      </svg>
                      <span>{event.officerCount || 0}</span>
                    </div>

                    <div class="stat-badge total" title="Total Participants">
                      <svg
                        class="users-icon"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
                        ></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                      </svg>
                      <span
                        >{event.currentParticipants} / {event.maxParticipants}</span
                      >
                    </div>
                  </div>
                </div>
                <p class="card-desc">{event.description}</p>
                <div class="card-actions">
                  <button
                    class="action-btn edit-btn"
                    on:click={() => goToEdit(event.id)}>EDIT</button
                  >
                  <button
                    class="action-btn delete-btn"
                    on:click={() => handleDelete(event.id)}>DELETE</button
                  >
                </div>
              </div>
            </div>
          {/each}

          {#if paginatedEvents.length === 0}
            <div style="text-align: center; color: #888; padding: 20px;">
              No events found.
            </div>
          {/if}
        </div>

        {#if filteredEvents.length > itemsPerPage}
          <div class="pagination-controls">
            <button
              class="glass-btn prev"
              on:click={prevPage}
              disabled={currentPage === 1}
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
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
              <span>Prev</span>
            </button>

            <div class="page-indicator">
              <span class="page-number">{currentPage}</span>
              <span class="page-divider">/</span>
              <span class="page-total">{totalPages}</span>
            </div>

            <button
              class="glass-btn next"
              on:click={nextPage}
              disabled={currentPage === totalPages}
            >
              <span>Next</span>
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
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
        {/if}

        <button class="fab-btn" on:click={goToCreate} aria-label="Create Event">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            ><line x1="12" y1="5" x2="12" y2="19"></line><line
              x1="5"
              y1="12"
              x2="19"
              y2="12"
            ></line></svg
          >
        </button>
      {:else}
        <div class="form-card" in:slide={{ axis: "y", duration: 300 }}>
          <input
            type="file"
            accept="image/*"
            style="display: none;"
            bind:this={fileInput}
            on:change={onFileSelected}
          />

          <div class="upload-wrapper">
            <span class="form-label">Event Banner</span>

            <div
              role="button"
              tabindex="0"
              class="upload-box {previewImage ? 'has-image' : ''}"
              class:disabled-box={isImageUploading}
              on:click={!isImageUploading ? handleImageUpload : null}
              on:keydown={(e) =>
                (e.key === "Enter" || e.key === " ") &&
                !isImageUploading &&
                handleImageUpload()}
            >
              {#if isImageUploading}
                <div class="upload-loading">
                  <div class="spinner"></div>
                  <span>Uploading...</span>
                </div>
              {:else if previewImage}
                <div class="image-container">
                  <img src={previewImage} alt="Preview" class="uploaded-img" />
                  <div class="image-overlay">
                    <span class="edit-text">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        ><path d="M12 20h9"></path><path
                          d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"
                        ></path></svg
                      >
                      Change Image
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  class="remove-fab"
                  on:click|stopPropagation={removeImage}
                  title="Remove Image"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    ><line x1="18" y1="6" x2="6" y2="18"></line><line
                      x1="6"
                      y1="6"
                      x2="18"
                      y2="18"
                    ></line></svg
                  >
                </button>
              {:else}
                <div class="upload-placeholder">
                  <div class="icon-circle">
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      ><rect x="3" y="3" width="18" height="18" rx="2" ry="2"
                      ></rect><circle cx="8.5" cy="8.5" r="1.5"
                      ></circle><polyline points="21 15 16 10 5 21"
                      ></polyline></svg
                    >
                  </div>
                  <span class="upload-title">Upload Banner Image</span>
                  <span class="upload-desc"
                    >Recommended size 1200x675 (16:9)</span
                  >
                </div>
              {/if}
            </div>
          </div>
          <div class="divider"></div>

          <div class="form-group">
            <label class="form-label" for="eventName">Event Name</label>
            <input
              id="eventName"
              type="text"
              class="form-input"
              class:error-border={errorField === "eventName"}
              placeholder="Enter your event name"
              bind:value={eventName}
              on:input={clearMessages}
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="daySelect">Date</label>
            <div class="date-row">
              <div class="custom-select-container" style="flex: 1;">
                <button
                  class="form-input select-trigger {getSelectClass(selDay)}"
                  class:error-border={errorField === "day"}
                  on:click={(e) => toggleDropdown("day", e)}
                >
                  {selDay || "Day"}
                  <svg
                    class="chevron-icon {activeDropdown === 'day'
                      ? 'rotate'
                      : ''}"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    ><polyline points="6 9 12 15 18 9"></polyline></svg
                  >
                </button>
                {#if activeDropdown === "day"}
                  <div
                    class="dropdown-options"
                    transition:slide={{ duration: 200 }}
                  >
                    {#each days as day}
                      <button
                        class="option-item {selDay === day ? 'selected' : ''}"
                        on:click={(e) => {
                          e.stopPropagation();
                          selectOption("day", day);
                        }}>{day}</button
                      >
                    {/each}
                  </div>
                {/if}
              </div>
              <div class="custom-select-container" style="flex: 2;">
                <button
                  class="form-input select-trigger {getSelectClass(selMonth)}"
                  class:error-border={errorField === "month"}
                  on:click={(e) => toggleDropdown("month", e)}
                >
                  {selMonth || "Month"}
                  <svg
                    class="chevron-icon {activeDropdown === 'month'
                      ? 'rotate'
                      : ''}"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    ><polyline points="6 9 12 15 18 9"></polyline></svg
                  >
                </button>
                {#if activeDropdown === "month"}
                  <div
                    class="dropdown-options"
                    transition:slide={{ duration: 200 }}
                  >
                    {#each months as month}
                      <button
                        class="option-item {selMonth === month
                          ? 'selected'
                          : ''}"
                        on:click={(e) => {
                          e.stopPropagation();
                          selectOption("month", month);
                        }}>{month}</button
                      >
                    {/each}
                  </div>
                {/if}
              </div>
              <div class="custom-select-container" style="flex: 1.5;">
                <button
                  class="form-input select-trigger {getSelectClass(selYear)}"
                  class:error-border={errorField === "year"}
                  on:click={(e) => toggleDropdown("year", e)}
                >
                  {selYear || "Year"}
                  <svg
                    class="chevron-icon {activeDropdown === 'year'
                      ? 'rotate'
                      : ''}"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    ><polyline points="6 9 12 15 18 9"></polyline></svg
                  >
                </button>
                {#if activeDropdown === "year"}
                  <div
                    class="dropdown-options"
                    transition:slide={{ duration: 200 }}
                  >
                    {#each years as year}
                      <button
                        class="option-item {selYear === year ? 'selected' : ''}"
                        on:click={(e) => {
                          e.stopPropagation();
                          selectOption("year", year);
                        }}>{year}</button
                      >
                    {/each}
                  </div>
                {/if}
              </div>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="startTime">Start Time</label>
              <div class="custom-select-container">
                <input
                  id="startTime"
                  type="text"
                  class="form-input"
                  class:error-border={errorField === "startTime"}
                  placeholder="00:00"
                  value={selStartTime}
                  on:input={(e) => handleTimeInput(e, "start")}
                  on:click={(e) => {
                    e.stopPropagation();
                    openDropdown("startTime");
                  }}
                  maxlength="5"
                  inputmode="numeric"
                />
                <svg
                  class="chevron-icon overlay-icon"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  ><circle cx="12" cy="12" r="10"></circle><polyline
                    points="12 6 12 12 16 14"
                  ></polyline></svg
                >
                {#if activeDropdown === "startTime"}
                  <div
                    class="dropdown-options"
                    transition:slide={{ duration: 200 }}
                  >
                    {#each times as time}
                      <button
                        class="option-item {selStartTime === time
                          ? 'selected'
                          : ''}"
                        on:click={(e) => {
                          e.stopPropagation();
                          selectOption("startTime", time);
                        }}>{time}</button
                      >
                    {/each}
                  </div>
                {/if}
              </div>
            </div>
            <div class="form-group">
              <label class="form-label" for="endTime">End Time</label>
              <div class="custom-select-container">
                <input
                  id="endTime"
                  type="text"
                  class="form-input"
                  class:error-border={errorField === "endTime"}
                  placeholder="00:00"
                  value={selEndTime}
                  on:input={(e) => handleTimeInput(e, "end")}
                  on:click={(e) => {
                    e.stopPropagation();
                    openDropdown("endTime");
                  }}
                  maxlength="5"
                  inputmode="numeric"
                />
                <svg
                  class="chevron-icon overlay-icon"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  ><circle cx="12" cy="12" r="10"></circle><polyline
                    points="12 6 12 12 16 14"
                  ></polyline></svg
                >
                {#if activeDropdown === "endTime"}
                  <div
                    class="dropdown-options"
                    transition:slide={{ duration: 200 }}
                  >
                    {#each times as time}
                      <button
                        class="option-item {selEndTime === time
                          ? 'selected'
                          : ''}"
                        on:click={(e) => {
                          e.stopPropagation();
                          selectOption("endTime", time);
                        }}>{time}</button
                      >
                    {/each}
                  </div>
                {/if}
              </div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="eventLocation">Location</label>
            <input
              id="eventLocation"
              type="text"
              class="form-input"
              class:error-border={errorField === "eventLocation"}
              placeholder="Enter your location"
              bind:value={eventLocation}
              on:input={clearMessages}
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="eventDesc">Description</label>
            <textarea
              id="eventDesc"
              class="form-input textarea"
              class:error-border={errorField === "eventDescription"}
              placeholder="Enter your description"
              bind:value={eventDescription}
              on:input={clearMessages}
            ></textarea>
          </div>

          <div class="form-group">
            <label class="form-label" for="eventSlots">Slots</label>
            <div class="custom-select-container">
              <input
                id="eventSlots"
                type="text"
                class="form-input"
                class:error-border={errorField === "slots"}
                placeholder="Enter or select slots"
                value={selSlots}
                on:input={handleSlotInput}
                on:click={(e) => {
                  e.stopPropagation();
                  openDropdown("slots");
                }}
                inputmode="numeric"
              />
              <svg
                class="chevron-icon overlay-icon"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                ><polyline points="6 9 12 15 18 9"></polyline></svg
              >
              {#if activeDropdown === "slots"}
                <div
                  class="dropdown-options"
                  transition:slide={{ duration: 200 }}
                >
                  {#each slotsOptions as slot}
                    <button
                      class="option-item {selSlots === slot ? 'selected' : ''}"
                      on:click={(e) => {
                        e.stopPropagation();
                        selectOption("slots", slot);
                      }}>{slot}</button
                    >
                  {/each}
                </div>
              {/if}
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="eventDistance">Distance (km)</label>
            <div class="custom-select-container">
              <input
                id="eventDistance"
                type="number"
                class="form-input"
                class:error-border={errorField === "distance"}
                placeholder="Enter your distance"
                value={selDistance}
                on:input={(e) => {
                  const target = e.target as HTMLInputElement;
                  selDistance = target.value;
                }}
                on:click={(e) => {
                  e.stopPropagation();
                  openDropdown("distance");
                }}
                step="0.1"
                min="0"
              />

              <svg
                class="chevron-icon overlay-icon"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>

              {#if activeDropdown === "distance"}
                <div
                  class="dropdown-options"
                  transition:slide={{ duration: 200 }}
                >
                  {#each distanceOptions as dist}
                    <button
                      class="option-item {selDistance == dist
                        ? 'selected'
                        : ''}"
                      on:click={(e) => {
                        e.stopPropagation();
                        selectOption("distance", dist);
                      }}
                    >
                      {dist} km
                    </button>
                  {/each}
                </div>
              {/if}
            </div>
          </div>

          <div class="toggles-container">
            <div
              class="toggle-item"
              style={!isEditMode
                ? "pointer-events: none; opacity: 0.5; filter: grayscale(1);"
                : ""}
            >
              <label class="switch" class:disabled={!isEditMode}>
                <input
                  type="checkbox"
                  bind:checked={isActive}
                  disabled={!isEditMode}
                />
                <span class="slider round"></span>
              </label>

              <div class="toggle-label">
                <small class:text-green={isActive} class:text-gray={!isActive}>
                  {#if !isEditMode}
                    (Saved as Inactive)
                  {:else}
                    {isActive ? "Event is active" : "Event is inactive"}
                  {/if}
                </small>
              </div>
            </div>

            <div
              class="toggle-item"
              style={!isEditMode
                ? "pointer-events: none; opacity: 0.5; filter: grayscale(1);"
                : ""}
            >
              <label class="switch" class:disabled={!isEditMode}>
                <input
                  type="checkbox"
                  bind:checked={isPublished}
                  disabled={!isEditMode}
                />
                <span class="slider round publish"></span>
              </label>

              <div class="toggle-label">
                <small
                  class:text-blue={isPublished}
                  class:text-gray={!isPublished}
                >
                  {#if !isEditMode}
                    (Saved as Draft)
                  {:else}
                    {isPublished ? "Visible to public" : "Draft mode"}
                  {/if}
                </small>
              </div>
            </div>
          </div>

          {#if errorMessage}
            <div class="message-container error" transition:slide>
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
              <span>{errorMessage}</span>
            </div>
          {/if}
          {#if successMessage}
            <div class="message-container success" transition:slide>
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
              <span>{successMessage}</span>
            </div>
          {/if}

          <button class="publish-btn" on:click={handlePublish}>
            {isEditMode ? "UPDATE EVENT" : "PUBLISH EVENT"}
          </button>
        </div>
      {/if}
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
  :global(.swal2-container) {
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
    background: rgba(0, 0, 0, 0.5) !important;
  }
  :global(.my-swal-popup) {
    border-radius: 20px !important;
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
  .page-title {
    color: white;
    font-size: 28px;
    font-weight: 700;
    margin: 0;
    letter-spacing: 1px;
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

  .event-list {
    display: flex;
    flex-direction: column;
    gap: 24px;
    margin-top: 20px;
  }
  .card {
    background: white;
    border-radius: 20px;
    overflow: hidden;
    color: #333;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  }
  .card-image {
    height: 200px;
    width: 100%;
    position: relative;
    background-color: #f3f4f6;
    transition: opacity 0.3s ease;
  }
  .card-image:not(.lazy-loaded) {
    opacity: 0.6;
  }
  .card-image.lazy-loaded {
    opacity: 1;
  }
  .card-image img {
    height: 100%;
    width: 100%;
    object-fit: cover;
  }
  .card-content {
    padding: 20px;
  }
  .card-header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    margin-bottom: 0.5rem;
  }
  .card-title {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: #111827;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .participant-badge {
    display: flex;
    flex-direction: column;
    align-items: center;
    font-size: 11px;
    color: #6b7280;
    font-weight: 600;
    min-width: 40px;
  }
  .users-icon {
    color: #374151;
    margin-bottom: 2px;
  }
  .card-desc {
    font-size: 13px;
    color: #4b5563;
    line-height: 1.5;
    margin: 0 0 20px 0;
  }
  .card-actions {
    display: flex;
    gap: 12px;
  }
  .action-btn {
    flex: 1;
    padding: 10px 0;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 700;
    border: none;
    cursor: pointer;
    text-transform: uppercase;
    transition: 0.2s;
  }
  .edit-btn {
    background-color: #10b981;
    color: white;
  }
  .edit-btn:hover {
    background-color: #059669;
  }
  .delete-btn {
    background-color: #b4151d;
    color: white;
  }
  .delete-btn:hover {
    background-color: #991b1b;
  }

  .fab-btn {
    position: absolute;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%);
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: linear-gradient(
      135deg,
      rgba(34, 197, 94, 0.6),
      rgba(34, 197, 94, 0.2)
    );
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 2px solid #10b981;
    color: #10b981;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
    transition: 0.2s;
    z-index: 60;
  }
  .fab-btn:active {
    transform: translateX(-50%) scale(0.95);
    background-color: rgba(255, 255, 255, 0.1);
  }
  .menu-burger {
    position: absolute;
    right: 20px;
    top: 50%;
    transform: translateY(-50%);
    width: 32px;
    height: 32px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    z-index: 52;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 6px;
  }
  .line {
    display: block;
    width: 24px;
    height: 2.5px;
    background-color: white;
    border-radius: 2px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    transform-origin: center;
  }
  .menu-burger.active .line-1 {
    transform: translateY(4.25px) rotate(45deg);
  }
  .menu-burger.active .line-2 {
    transform: translateY(-4.25px) rotate(-45deg);
  }
  .dropdown-menu {
    position: absolute;
    top: 70px;
    right: 16px;
    width: 200px;
    background: white;
    z-index: 51;
    border-radius: 16px;
    padding: 8px 0;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
    transform-origin: top right;
  }
  .menu-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.3);
    z-index: 50;
    cursor: default;
  }
  .menu-arrow {
    position: absolute;
    top: -6px;
    right: 14px;
    width: 12px;
    height: 12px;
    background: white;
    transform: rotate(45deg);
    border-top-left-radius: 4px;
  }
  .menu-item {
    display: flex;
    align-items: center;
    padding: 10px 16px;
    text-decoration: none;
    color: #374151;
    font-weight: 500;
    font-size: 15px;
    border: none;
    background: none;
    cursor: pointer;
    width: auto;
    margin: 4px 8px;
    border-radius: 8px;
    transition: all 0.2s;
  }
  .menu-item:hover {
    background-color: #f3f4f6;
    color: #10b981;
    transform: translateX(4px);
  }
  .icon {
    margin-right: 12px;
    font-size: 18px;
  }
  .menu-item.logout {
    color: #ef4444;
  }
  .menu-item.logout:hover {
    background-color: #fef2f2;
    color: #b40808;
  }
  .menu-divider {
    height: 1px;
    background: #e5e7eb;
    margin: 6px 12px;
  }

  .form-card {
    background: white;
    border-radius: 20px;
    padding: 30px 24px;
    color: #111827;
  }
  .upload-section {
    width: 100%;
    height: 120px;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 20px;
    cursor: pointer;
    position: relative;
    border-radius: 12px;
    overflow: hidden;
    background: transparent;
    border: 1px dashed #9ca3af;
    padding: 0;
    font-family: inherit;
  }
  .upload-section:hover {
    background-color: #f9fafb;
  }
  .upload-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    color: #111827;
  }
  .upload-text {
    font-size: 12px;
    color: #6b7280;
    font-weight: 500;
  }
  .camera-icon {
    color: #111827;
  }
  .uploaded-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border: none;
  }
  .change-overlay {
    position: absolute;
    bottom: 0;
    width: 100%;
    background: rgba(0, 0, 0, 0.5);
    color: white;
    font-size: 10px;
    text-align: center;
    padding: 4px;
  }
  .divider {
    height: 1px;
    background-color: #e5e7eb;
    width: 60%;
    margin: 0 auto 24px auto;
  }

  .form-group {
    margin-bottom: 16px;
  }
  .form-row {
    display: flex;
    gap: 12px;
  }
  .form-row .form-group {
    flex: 1;
  }
  .date-row {
    display: flex;
    gap: 8px;
    width: 100%;
  }
  .form-label {
    display: block;
    font-size: 14px;
    font-weight: 600;
    color: #374151;
    margin-bottom: 8px;
  }
  .form-input {
    width: 100%;
    padding: 10px 12px;
    border: 2px solid #9ca3af;
    border-radius: 8px;
    font-size: 14px;
    font-family: "Inter", sans-serif;
    color: #111827;
    box-sizing: border-box;
    outline: none;
    transition: 0.2s;
    background-color: white;
  }
  .form-input:focus {
    border-color: #10b981;
  }
  .form-input::placeholder {
    color: #9ca3af;
  }
  .textarea {
    resize: vertical;
    min-height: 80px;
  }
  .error-border {
    border-color: #ef4444 !important;
    box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.25) !important;
  }

  .custom-select-container {
    position: relative;
  }
  .select-trigger {
    text-align: left;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .dropdown-options {
    position: absolute;
    top: calc(100% + 5px);
    left: 0;
    width: 100%;
    max-height: 200px;
    overflow-y: auto;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
    border: 1px solid #e5e7eb;
    z-index: 100;
  }
  .dropdown-options::-webkit-scrollbar {
    width: 6px;
  }
  .dropdown-options::-webkit-scrollbar-thumb {
    background-color: #d1d5db;
    border-radius: 10px;
  }
  .option-item {
    display: block;
    width: 100%;
    padding: 10px 12px;
    text-align: left;
    background: white;
    border: none;
    font-size: 14px;
    color: #374151;
    cursor: pointer;
    transition: 0.1s;
  }
  .option-item:hover {
    background-color: #f3f4f6;
  }
  .option-item.selected {
    background-color: #ecfdf5;
    color: #10b981;
    font-weight: 600;
  }
  .text-gray {
    color: #9ca3af;
  }
  .text-dark {
    color: #111827;
  }
  .chevron-icon {
    color: #6b7280;
    pointer-events: none;
    transition: transform 0.2s;
  }
  .chevron-icon.rotate {
    transform: rotate(180deg);
  }
  .overlay-icon {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
  }

  .message-container {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 10px 14px;
    border-radius: 8px;
    margin-top: 15px;
    margin-bottom: 5px;
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

  .publish-btn {
    width: 100%;
    background-color: #10b981;
    color: white;
    border: none;
    padding: 12px 0;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    margin-top: 15px;
    text-transform: uppercase;
    transition: 0.2s;
    font-family: "Inter", sans-serif;
  }
  .publish-btn:hover {
    background-color: #059669;
  }

  .upload-wrapper {
    margin-bottom: 1.5rem;
    width: 100%;
  }

  .upload-box {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 9;
    background-color: #f9fafb;
    border: 2px dashed #e5e7eb;
    border-radius: 16px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
  }

  .upload-box:hover {
    border-color: #b4151d;
    background-color: #fff5f5;
  }

  .upload-box.has-image {
    border: none;
    background-color: #000;
  }

  .upload-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    color: #6b7280;
  }

  .icon-circle {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background-color: #fff;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #b4151d;
    transition: transform 0.3s ease;
  }

  .upload-box:hover .icon-circle {
    transform: scale(1.1);
  }

  .upload-title {
    font-weight: 600;
    font-size: 1rem;
    color: #374151;
  }
  .upload-desc {
    font-size: 0.8rem;
    color: #9ca3af;
  }
  .image-container {
    width: 100%;
    height: 100%;
    position: relative;
  }

  .uploaded-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s ease;
  }

  .image-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease;
    backdrop-filter: blur(2px);
  }

  .edit-text {
    color: white;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border-radius: 99px;
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
  }

  .upload-box:hover .uploaded-img {
    transform: scale(1.05);
  }

  .upload-box:hover .image-overlay {
    opacity: 1;
  }

  .remove-fab {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background-color: white;
    color: #ef4444;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    cursor: pointer;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    z-index: 10;
    transition: transform 0.2s;
  }

  .remove-fab:hover {
    transform: scale(1.1);
    background-color: #ef4444;
    color: white;
  }

  .upload-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    color: #6b7280;
  }

  .spinner {
    width: 30px;
    height: 30px;
    border: 3px solid #e5e7eb;
    border-top-color: #b4151d;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .stats-container {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  .stat-badge {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 500;
    line-height: 1;
  }

  .stat-badge.total {
    background-color: #f3f4f6;
    color: #374151;
  }

  .stat-badge.student {
    background-color: #eff6ff;
    color: #1d4ed8;
  }

  .stat-badge.officer {
    background-color: #f0fdf4;
    color: #15803d;
  }

  .search-sticky-header {
    position: sticky;
    top: 0;
    z-index: 40;
    background: transparent;
    margin-top: 1px;
    padding: 0px 20px 40px 20px;
  }

  .search-center-wrapper {
    display: flex;
    justify-content: center;
    width: 100%;
  }

  .unified-search-bar {
    display: flex;
    align-items: center;
    background: #1f2937;
    border: 1px solid #374151;
    border-radius: 12px;
    padding: 0 12px;
    width: 100%;
    max-width: 600px;
    height: 48px;
    box-shadow:
      0 4px 6px -1px rgba(0, 0, 0, 0.1),
      0 2px 4px -1px rgba(0, 0, 0, 0.06);
    transition: all 0.2s ease;
  }

  .unified-search-bar:focus-within {
    border-color: #10b981;
    box-shadow: 0 0 0 2px rgba(26, 255, 110, 0.2);
  }

  .search-icon {
    color: #9ca3af;
    display: flex;
    align-items: center;
    margin-right: 8px;
  }

  .ghost-input {
    flex: 1;
    background: transparent;
    border: none;
    color: white;
    font-size: 15px;
    outline: none;
    min-width: 0;
  }

  .ghost-input::placeholder {
    color: #6b7280;
  }

  .clear-btn-inside {
    background: transparent;
    border: none;
    color: #9ca3af;
    cursor: pointer;
    display: flex;
    align-items: center;
    padding: 4px;
    margin-right: 4px;
    border-radius: 50%;
    transition:
      background 0.2s,
      color 0.2s;
  }

  .clear-btn-inside:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }

  .vertical-divider {
    width: 1px;
    height: 24px;
    background-color: #374151;
    margin: 0 8px;
  }

  .select-arrow {
    position: absolute;
    right: 4px;
    pointer-events: none;
    color: #9ca3af;
  }

  .vertical-divider {
    width: 1px;
    height: 20px;
    background-color: #4b5563;
    margin: 0 10px;
    opacity: 0.5;
    flex-shrink: 0;
  }

  .mini-select-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    cursor: pointer;
    margin-right: 4px;
  }

  .mini-select {
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    background-color: transparent;
    border: none;
    color: #e5e7eb;
    font-size: 14px;
    font-weight: 500;
    padding: 0 24px 0 8px;
    cursor: pointer;
    outline: none;
  }

  .mini-select:hover {
    color: #ffffff;
  }

  .select-arrow {
    position: absolute;
    right: 4px;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
    color: #9ca3af;
    transition: transform 0.2s ease;
  }

  .custom-dropdown-wrapper {
    position: relative;
    margin-left: 6px;
  }

  .custom-dropdown-btn {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    background-color: rgba(55, 65, 81, 0.4);
    border: 1px solid rgba(75, 85, 99, 0.4);
    border-radius: 99px;
    padding: 6px 12px;
    min-width: 90px;
    color: #e5e7eb;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .custom-dropdown-btn:hover {
    background-color: rgba(55, 65, 81, 0.8);
    color: white;
  }
  .custom-dropdown-menu {
    position: absolute;
    top: calc(100% + 8px);
    left: 0;
    z-index: 100;
    background-color: #1f2937;
    border: 1px solid #374151;
    border-radius: 12px;
    padding: 4px;
    width: 100%;
    min-width: 60px;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
    max-height: 240px;
    overflow-y: auto;
    animation: fadeIn 0.15s ease-out;
  }

  .dropdown-item {
    display: block;
    width: 100%;
    text-align: left;
    background: none;
    border: none;
    padding: 0;
    font-family: inherit;
    font-size: inherit;
    cursor: pointer;
    outline: none;
    padding: 10px 12px;
    border-radius: 8px;
    color: #e5e7eb;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.15s;
    margin-bottom: 2px;
  }

  .dropdown-item:hover,
  .dropdown-item:focus {
    background-color: rgba(55, 65, 81, 0.8);
    color: white;
  }

  .dropdown-item:last-child {
    margin-bottom: 0;
  }

  .custom-dropdown-menu::-webkit-scrollbar {
    width: 6px;
  }
  .custom-dropdown-menu::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-dropdown-menu::-webkit-scrollbar-thumb {
    background: #4b5563;
    border-radius: 3px;
  }
  .custom-dropdown-menu::-webkit-scrollbar-thumb:hover {
    background: #6b7280;
  }

  .date-filter-wrapper {
    position: relative;
    margin-left: 8px;
  }

  .filter-icon-btn {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    background-color: transparent;
    border: 1px solid transparent;
    border-radius: 50%;
    color: #9ca3af;
    cursor: pointer;
    transition: all 0.2s;
  }

  .filter-icon-btn:hover {
    background-color: rgba(55, 65, 81, 0.4);
    color: white;
  }

  .filter-icon-btn.active {
    color: white;
    background-color: rgba(55, 65, 81, 0.6);
  }

  .active-dot {
    position: absolute;
    top: 6px;
    right: 6px;
    width: 8px;
    height: 8px;
    background-color: #10b981;
    border-radius: 50%;
    border: 1px solid #1f2937;
  }

  .unified-filter-menu {
    position: fixed;
    top: 42%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1000;
    width: 320px;
    background-color: #1f2937;
    border: 1px solid #374151;
    border-radius: 16px;
    padding: 16px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
    animation: popupScale 0.2s cubic-bezier(0.18, 0.89, 0.32, 1.28);
  }

  .unified-filter-menu::before {
    content: "";
    position: absolute;
    top: -6px;
    left: 86.5%;
    transform: translateX(-50%) rotate(45deg);
    width: 12px;
    height: 12px;
    background-color: #1f2937;
    z-index: 1001;
  }

  .filter-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 999;
    backdrop-filter: blur(2px);
  }

  @keyframes popupScale {
    from {
      transform: translate(-50%, -50%) scale(0.9);
      opacity: 0;
    }
    to {
      transform: translate(-50%, -50%) scale(1);
      opacity: 1;
    }
  }

  .current-selection {
    font-size: 13px;
    color: #e5e7eb;
    font-weight: 500;
  }

  .reset-link {
    background: none;
    border: none;
    color: #10b981;
    font-size: 12px;
    cursor: pointer;
    padding: 0;
  }
  .reset-link:hover {
    text-decoration: underline;
  }

  .filter-body {
    display: flex;
    gap: 12px;
    height: 220px;
  }

  .filter-column {
    display: flex;
    flex-direction: column;
  }

  .year-column {
    flex: 1;
    border-right: 1px solid #374151;
    padding-right: 8px;
  }
  .month-column {
    flex: 2;
  }

  .column-label {
    font-size: 11px;
    text-transform: uppercase;
    color: #6b7280;
    margin-bottom: 8px;
    font-weight: 600;
  }

  .scroll-area {
    overflow-y: auto;
    flex: 1;
    /* Custom Scrollbar */
    scrollbar-width: thin;
    scrollbar-color: #4b5563 transparent;
  }

  .month-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
    overflow-y: auto;
  }

  .filter-chip {
    background: none;
    border: none;
    display: block;
    width: 100%;
    text-align: center;
    padding: 6px 4px;
    font-size: 13px;
    color: #9ca3af;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.1s;
  }

  .filter-chip:hover {
    background-color: #374151;
    color: white;
  }

  .filter-chip.selected {
    background-color: #10b981;
    color: white;
    font-weight: 600;
  }

  .pagination-controls {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 16px;
    margin-top: 30px;
    margin-bottom: 100px;
    padding: 10px;
    position: relative;
    z-index: 10;
  }

  .page-btn {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
    padding: 8px 16px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .page-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
  }

  .page-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .page-info {
    color: white;
    font-weight: bold;
  }

  .glass-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #e5e7eb;
    padding: 10px 20px;
    border-radius: 50px;
    cursor: pointer;
    font-size: 0.95rem;
    font-weight: 600;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .glass-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
    box-shadow: 0 8px 15px rgba(0, 0, 0, 0.2);
    text-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
  }

  .glass-btn:active:not(:disabled) {
    transform: translateY(0);
    background: rgba(255, 255, 255, 0.2);
  }

  .glass-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    filter: grayscale(1);
  }

  .glass-btn svg {
    transition: transform 0.3s ease;
  }

  .glass-btn.prev:hover:not(:disabled) svg {
    transform: translateX(-3px);
  }
  .glass-btn.next:hover:not(:disabled) svg {
    transform: translateX(3px);
  }

  .page-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(0, 0, 0, 0.3);
    padding: 8px 16px;
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.05);
    font-family: "Courier New", Courier, monospace;
  }

  .page-number {
    color: #fff;
    font-weight: 700;
    font-size: 1.1rem;
  }

  .page-divider {
    color: #6b7280;
  }

  .page-total {
    color: #9ca3af;
  }

  .toggles-container {
    display: flex;
    justify-content: center;
    gap: 10px;
    margin-top: -20px;
    margin-bottom: 25px;
    background: rgba(255, 255, 255, 0.03);
    margin-bottom: -20px;
    padding: 20px;
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .toggle-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1px;
    flex: 1;
  }

  .toggle-label {
    display: flex;
    flex-direction: column;
    text-align: center;
  }

  .toggle-label small {
    font-size: 0.8rem;
    opacity: 0.8;
  }

  .switch {
    position: relative;
    display: inline-block;
    width: 52px;
    height: 28px;
    flex-shrink: 0;
  }

  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #374151;
    transition: 0.4s;
    border-radius: 34px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .slider:before {
    position: absolute;
    content: "";
    height: 20px;
    width: 20px;
    left: 4px;
    bottom: 3px;
    background-color: white;
    transition: 0.4s;
    border-radius: 50%;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  input:checked + .slider {
    background-color: #10b981;
    border-color: #10b981;
  }

  input:checked + .slider.publish {
    background-color: #10b981;
    border-color: #10b981;
  }

  input:checked + .slider:before {
    transform: translateX(24px);
  }

  input[type="number"]::-webkit-outer-spin-button,
  input[type="number"]::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
