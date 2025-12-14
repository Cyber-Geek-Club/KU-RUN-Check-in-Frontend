<script lang="ts">
  import { onMount } from "svelte";
  import { slide } from "svelte/transition";
  import { quintOut } from "svelte/easing";
  import Swal from "sweetalert2";

  const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(
    /\/$/,
    ""
  );

  interface Submission {
    id: number;
    runnerName: string;
    runnerImage: string | null;
    submitTime: string;
    proofImage: string | null;
  }

  interface EventItem {
    id: number;
    title: string;
    image: string | null;
    participantCount: number;
    pendingCount: number;
    rawDate: Date | null;
    date: string;
    submissions: Submission[];
    isLoadingSubmissions: boolean;
    hasLoaded: boolean;
  }

  let events: EventItem[] = [];
  let isLoadingAll = true;
  let expandedEventId: number | null = null;

  let selectedYear: number | "All" = "All";
  let selectedMonth: number | "All" = "All";

  let mainSearchQuery = "";
  let showDateFilter = false;
  let isSearchFocused = false;

  let currentPage = 1;
  let itemsPerPage = 5;

  const filterMonths = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  $: availableYears = Array.from(
    new Set(
      events
        .map((e) => (e.rawDate ? e.rawDate.getFullYear() : null))
        .filter((y): y is number => y !== null)
    )
  ).sort((a, b) => b - a);

  $: filteredEvents = events.filter((e) => {
    const matchesText = e.title
      .toLowerCase()
      .includes(mainSearchQuery.trim().toLowerCase());

    let matchesYear = true;
    if (selectedYear !== "All" && e.rawDate) {
      matchesYear = e.rawDate.getFullYear() === selectedYear;
    }

    let matchesMonth = true;
    if (selectedMonth !== "All" && e.rawDate) {
      matchesMonth = e.rawDate.getMonth() === selectedMonth;
    }

    return matchesText && matchesYear && matchesMonth;
  });

  $: {
    if (mainSearchQuery || selectedYear || selectedMonth) {
      currentPage = 1;
    }
  }

  $: totalPages = Math.ceil(filteredEvents.length / itemsPerPage);

  $: paginatedEvents = filteredEvents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  onMount(async () => {
    await fetchEventList();
  });

  function onImageClick(proofImage: string | null, runnerName: string) {
    if (proofImage) {
      Swal.fire({
        imageUrl: proofImage,
        imageAlt: "Proof",
        showConfirmButton: false,
        showCloseButton: false,
        allowOutsideClick: true,
        backdrop: `rgba(0,0,0,0.9)`,
        background: "transparent",
        padding: 0,
        customClass: {
          popup: "swal-clean-popup",
          image: "swal-full-image",
        },
      });
    } else {
      Swal.fire("Info", "ไม่พบรูปภาพ", "info");
    }
  }

  async function fetchEventList() {
    try {
      const token = localStorage.getItem("access_token");
    
      const headers: any = { "Content-Type": "application/json" }; 
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE_URL}/api/events/`, { headers });
      if (!res.ok) throw new Error("Failed to fetch events");

      const data = await res.json();
      const list = Array.isArray(data) ? data : data.data || [];

      events = list.map((evt: any) => {
        let imgUrl = evt.banner_image_url || null;
        if (imgUrl && !imgUrl.startsWith("http")) {
          imgUrl = `${API_BASE_URL}${imgUrl}`;
        }

        return {
          id: evt.id,
          title: evt.title,
          image: imgUrl,
          participantCount: evt.participant_count || 0,
          pendingCount: 0,
          date: formatDate(evt.event_date),
          rawDate: evt.event_date ? new Date(evt.event_date) : null,
          
          submissions: [],
          isLoadingSubmissions: false,
          hasLoaded: false,
        };
      });

      await updateAllCounts();
    } catch (error) {
      console.error("Error:", error);
      Swal.fire("Error", "โหลดกิจกรรมไม่สำเร็จ", "error");
    } finally {
      isLoadingAll = false;
    }
  }

  async function updateAllCounts() {
    const token = localStorage.getItem("access_token");
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const updates = events.map(async (event, index) => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/participations/event/${event.id}`,
          { headers }
        );
        if (res.ok) {
          const data = await res.json();
          const subs = Array.isArray(data) ? data : data.data || [];
          const realPendingCount = subs.filter(
            (s: any) => s.status === "proof_submitted"
          ).length;
          events[index].pendingCount = realPendingCount;
        }
      } catch (e) {
        console.warn(`Failed to count for event ${event.id}`, e);
      }
    });

    await Promise.all(updates);
    events = [...events];
  }

  async function fetchUserProfile(userId: number) {
    try {
      const token = localStorage.getItem("access_token");
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
        headers,
      });
      if (res.ok) {
        const data = await res.json();
        return data.data || data;
      }
    } catch (e) {
      console.error(`Failed to fetch user ${userId}`, e);
    }
    return null;
  }

  function changePage(step: number) {
    const nextPage = currentPage + step;
    if (nextPage >= 1 && nextPage <= totalPages) {
      currentPage = nextPage;
      document
        .querySelector(".scroll-container")
        ?.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function fetchPendingSubmissions(eventId: number) {
    const index = events.findIndex((e) => e.id === eventId);
    if (index === -1) return;

    events[index].isLoadingSubmissions = true;
    events = [...events];

    try {
      const token = localStorage.getItem("access_token");
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(
        `${API_BASE_URL}/api/participations/event/${eventId}`,
        { headers }
      );
      if (!res.ok) throw new Error("Failed");

      const data = await res.json();
      const subs = Array.isArray(data) ? data : data.data || [];
      const pendingSubs = subs.filter(
        (s: any) => s.status === "proof_submitted"
      );

      const mappedSubs = await Promise.all(
        pendingSubs.map(async (s: any) => {
          let proofUrl = s.proof_image_url;
          if (
            proofUrl &&
            typeof proofUrl === "string" &&
            proofUrl.startsWith("/")
          ) {
            proofUrl = API_BASE_URL + proofUrl;
          }

          let fullName = `User ID: ${s.user_id}`;
          let userProfileUrl = null;
          const userData = await fetchUserProfile(s.user_id);

          if (userData) {
            const fname = userData.first_name || "";
            const lname = userData.last_name || "";
            if (fname || lname) fullName = `${fname} ${lname}`.trim();
            else if (userData.username) fullName = userData.username;

            if (userData.profile_image_url) {
              userProfileUrl = userData.profile_image_url;
              if (userProfileUrl.startsWith("/"))
                userProfileUrl = API_BASE_URL + userProfileUrl;
            }
          }

          return {
            id: s.id,
            runnerName: fullName,
            runnerImage: userProfileUrl,
            submitTime: new Date(
              s.proof_submitted_at || s.created_at
            ).toLocaleString("th-TH", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            }),
            proofImage: proofUrl || null,
          };
        })
      );

      events[index].submissions = mappedSubs;
      events[index].pendingCount = events[index].submissions.length;
    } catch (error) {
      console.error("Error fetching submissions:", error);
      events[index].submissions = [];
    } finally {
      events[index].isLoadingSubmissions = false;
      events[index].hasLoaded = true;
      events = [...events];
    }
  }

  async function verifyParticipationAPI(
    pid: number,
    approved: boolean,
    reason: string = ""
  ) {
    const token = localStorage.getItem("access_token");
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    // Construct Payload
    const payload: any = { participation_id: pid, approved };
    if (!approved) {
      payload.rejection_reason = reason;
    }

    const res = await fetch(`${API_BASE_URL}/api/participations/verify`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Verification failed");
    }
    return await res.json();
  }

  function toggleExpand(event: EventItem) {
    if (expandedEventId === event.id) {
      expandedEventId = null;
    } else {
      expandedEventId = event.id;
      if (!event.hasLoaded) fetchPendingSubmissions(event.id);
    }
  }

  function formatDate(d: string) {
    if (!d) return "-";
    try {
      return new Date(d).toLocaleDateString("th-TH", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return d;
    }
  }

  function removeSubmissionFromUI(eventId: number, subId: number) {
    const idx = events.findIndex((e) => e.id === eventId);
    if (idx === -1) return;
    events[idx].submissions = events[idx].submissions.filter(
      (s) => s.id !== subId
    );
    events[idx].pendingCount = Math.max(0, events[idx].pendingCount - 1);
    events = [...events];
  }

  function onApprove(eventId: number, sub: Submission) {
    Swal.fire({
      title:
        '<span style="color: #10b981; font-size: 20px;">Approve Submission</span>',
      html: `
        <div class="reject-container"> <p class="helper-text">Are you sure you want to verify this proof?</p>
          
          <div class="approve-card">
             <div class="ac-avatar">
                ${
                  sub.runnerImage
                    ? `<img src="${sub.runnerImage}" />`
                    : `<span class="ac-placeholder">${sub.runnerName.charAt(0)}</span>`
                }
             </div>
             <div class="card-content">
               <span class="rj-title">${sub.runnerName}</span>
               <span class="rj-desc">Submitted: ${sub.submitTime}</span>
             </div>
          </div>

          <div class="approve-info">
             <div class="info-row">
       
               <span>Status changes to <b>COMPLETED</b></span>
             </div>
             <div class="info-row">
            
               <span>System auto-assigns rewards</span>
             </div>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonColor: "#10b981", 
      cancelButtonColor: "#9ca3af",
      confirmButtonText: "Yes, Approve",
      cancelButtonText: "Cancel",
      focusConfirm: true,
      customClass: {
        popup: "swal-clean-popup-reject", 
      },
      preConfirm: async () => {
        try {
          return await verifyParticipationAPI(sub.id, true);
        } catch (e: any) {
          Swal.showValidationMessage(e.message);
        }
      },
    }).then((res) => {
      if (res.isConfirmed) {
        removeSubmissionFromUI(eventId, sub.id);
        Swal.fire({
          title: "Verified!",
          text: "Participation has been approved successfully.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
          customClass: { popup: "my-swal-font" },
        });
      }
    });
  }
  async function onReject(eventId: number, sub: Submission) {
    const { value: reason } = await Swal.fire({
      title:
        '<span style="color: #ef4444; font-size: 20px;">Reject Submission</span>',
      html: `
        <div class="reject-container">
          <p class="helper-text">Please select a reason for rejection:</p>
          
          <label class="reject-card">
            <input type="radio" name="rj_reason" value="Unclear image / Unreadable" checked>
            <div class="card-content">
              <span class="rj-title">Unclear Image</span>
              <span class="rj-desc">Photo is blurry, dark, or data is unreadable.</span>
            </div>
          </label>

          <label class="reject-card">
            <input type="radio" name="rj_reason" value="Incorrect distance or duration">
            <div class="card-content">
              <span class="rj-title">Incorrect Data</span>
              <span class="rj-desc">Distance or time does not match requirements.</span>
            </div>
          </label>

          <label class="reject-card">
            <input type="radio" name="rj_reason" value="Duplicate submission">
            <div class="card-content">
              <span class="rj-title">Duplicate</span>
              <span class="rj-desc">This proof has already been submitted.</span>
            </div>
          </label>

           <label class="reject-card">
            <input type="radio" name="rj_reason" value="other" id="rj-other">
            <div class="card-content">
              <span class="rj-title">Other Reason</span>
              <span class="rj-desc">Specify a custom reason below.</span>
            </div>
          </label>

          <div id="other-input-container" class="other-box">
             <textarea id="other-reason-text" class="custom-textarea" placeholder="Please type the reason here..."></textarea>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonColor: "#ef4444", 
      cancelButtonColor: "#9ca3af",
      confirmButtonText: "Confirm Reject",
      cancelButtonText: "Cancel",
      focusConfirm: false,
      customClass: {
        popup: "swal-clean-popup-reject",
      },
      didOpen: () => {
        const radios = document.querySelectorAll('input[name="rj_reason"]');
        const otherContainer = document.getElementById("other-input-container");
        const textArea = document.getElementById("other-reason-text");

        radios.forEach((radio) => {
          radio.addEventListener("change", (e: any) => {

            if (e.target.value === "other") {
              otherContainer!.classList.add("visible");
              setTimeout(() => textArea?.focus(), 100);
            } else {
              otherContainer!.classList.remove("visible");
              (textArea as HTMLTextAreaElement).value = ""; 
            }
          });
        });
      },
      preConfirm: () => {
        const selected: any = document.querySelector(
          'input[name="rj_reason"]:checked'
        );
        if (!selected)
          return Swal.showValidationMessage("Please select a reason");

        let finalReason = selected.value;

        if (finalReason === "other") {
          const textVal = (
            document.getElementById("other-reason-text") as HTMLTextAreaElement
          ).value.trim();
          if (!textVal)
            return Swal.showValidationMessage("Please specify the reason.");
          finalReason = textVal;
        }

        // Call API
        return verifyParticipationAPI(sub.id, false, finalReason).catch(
          (error) => {
            Swal.showValidationMessage(`Error: ${error.message}`);
          }
        );
      },
    });

    if (reason) {
      removeSubmissionFromUI(eventId, sub.id);
      Swal.fire({
        title: "Rejected",
        text: "The submission has been rejected.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
        customClass: { popup: "my-swal-font" },
      });
    }
  }
</script>

<div class="app-screen">
  <div class="glass-header">
    <a href="/organizer/create-event" class="back-btn" aria-label="Back">
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
    <h1 class="page-title">VERIFY PROOF</h1>
  </div>

  <div class="fixed-search-area">
    <div class="content-wrapper">
      <div class="search-filter-wrapper">
        <div
          class="main-search-input-box {isSearchFocused ||
          showDateFilter ||
          mainSearchQuery
            ? 'active'
            : ''}"
        >
          <div class="search-icon-wrapper">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              ><circle cx="11" cy="11" r="8"></circle><line
                x1="21"
                y1="21"
                x2="16.65"
                y2="16.65"
              ></line></svg
            >
          </div>
          <input
            type="text"
            placeholder="Search events..."
            bind:value={mainSearchQuery}
            on:focus={() => (isSearchFocused = true)}
            on:blur={() => (isSearchFocused = false)}
          />
          <button
            class="calendar-btn {showDateFilter ? 'active' : ''}"
            aria-label="Filter by Date"
            on:click={() => (showDateFilter = !showDateFilter)}
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
              ><rect x="3" y="4" width="18" height="18" rx="2" ry="2"
              ></rect><line x1="16" y1="2" x2="16" y2="6"></line><line
                x1="8"
                y1="2"
                x2="8"
                y2="6"
              ></line><line x1="3" y1="10" x2="21" y2="10"></line></svg
            >
          </button>
        </div>

        {#if showDateFilter}
          <div class="filter-popover">
            <div class="popover-triangle"></div>
            <div class="popover-content">
              <div class="filter-col year-col">
                <div class="col-sub-header">YEAR</div>
                <button
                  class="filter-btn wide {selectedYear === 'All'
                    ? 'active'
                    : ''}"
                  on:click={() => (selectedYear = "All")}>All</button
                >
                <div class="year-list">
                  {#each availableYears as yr}
                    <button
                      class="filter-text-btn {selectedYear === yr
                        ? 'active-text'
                        : ''}"
                      on:click={() => (selectedYear = yr)}>{yr}</button
                    >
                  {/each}
                </div>
              </div>
              <div class="divider"></div>
              <div class="filter-col month-col">
                <div class="col-sub-header">MONTH</div>
                <button
                  class="filter-btn wide {selectedMonth === 'All'
                    ? 'active'
                    : ''}"
                  on:click={() => (selectedMonth = "All")}>All Months</button
                >
                <div class="month-grid">
                  {#each filterMonths as m, i}
                    <button
                      class="month-btn {selectedMonth === i
                        ? 'active-month'
                        : ''}"
                      on:click={() => (selectedMonth = i)}>{m}</button
                    >
                  {/each}
                </div>
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>

  <div class="scroll-container">
    {#if isLoadingAll}
      <div class="loading-state">
        <div class="spinner"></div>
        
      </div>
    {:else}
      <div class="content-wrapper">
        {#each paginatedEvents as event (event.id)}
          <div
            class="log-card {expandedEventId === event.id ? 'expanded' : ''}"
          >
            <div
              class="card-summary"
              on:click={() => toggleExpand(event)}
              role="button"
              tabindex="0"
              on:keydown={(e) => e.key === "Enter" && toggleExpand(event)}
            >
              <div class="card-content-row">
                <div class="event-thumb">
                  {#if event.image}
                    <img src={event.image} alt="event" />
                  {:else}
                    <div class="thumb-placeholder">{event.title.charAt(0)}</div>
                  {/if}
                </div>

                <div class="info-box">
                  <div class="row-top">
                    <h2 class="title">{event.title}</h2>
                    <span class="date">{event.date}</span>
                  </div>
                  <div class="status-row">
                    <div class="participant-badge">
                      👥 {event.participantCount}
                    </div>
                    <div class="pending-status">
                      {#if event.pendingCount > 0}
                        <span class="status-dot warning"></span><span
                          class="status-text warning"
                          >{event.pendingCount} Pending</span
                        >
                      {:else}
                        <span class="status-dot success"></span><span
                          class="status-text success">Clear</span
                        >
                      {/if}
                    </div>
                    <div class="expand-icon">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        ><polyline points="6 9 12 15 18 9"></polyline></svg
                      >
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {#if expandedEventId === event.id}
              <div
                class="slide-wrapper"
                transition:slide|local={{ duration: 300, easing: quintOut }}
              >
                <div class="details-wrapper">
                  {#if event.isLoadingSubmissions}
                    <div class="inline-loader">
                      <div class="spinner small"></div>
                      <span>Loading...</span>
                    </div>
                  {:else if event.submissions.length === 0}
                    <div class="empty-state-sub">No pending submissions.</div>
                  {:else}
                    <div class="submission-list">
                      {#each event.submissions as sub (sub.id)}
                        <div class="sub-item">
                          <div class="runner-header">
                            <div class="avatar-circle">
                              {#if sub.runnerImage}
                                <img src={sub.runnerImage} alt="user" />
                              {:else}
                                <div class="avatar-placeholder">
                                  {sub.runnerName.charAt(0)}
                                </div>
                              {/if}
                            </div>
                            <div class="runner-details">
                              <span class="r-name">{sub.runnerName}</span>
                              <span class="r-time">Sent: {sub.submitTime}</span>
                            </div>
                          </div>

                          <div
                            class="proof-display clickable"
                            role="button"
                            tabindex="0"
                            on:click|stopPropagation={() =>
                              onImageClick(sub.proofImage, sub.runnerName)}
                            on:keydown|stopPropagation={(e) =>
                              (e.key === "Enter" || e.key === " ") &&
                              onImageClick(sub.proofImage, sub.runnerName)}
                          >
                            {#if sub.proofImage}
                              <img src={sub.proofImage} alt="Proof" />
                              <div class="zoom-hint">🔍 Tap to zoom</div>
                            {:else}
                              <div class="no-img">No Image</div>
                            {/if}
                          </div>

                          <div class="action-buttons">
                            <button
                              class="btn reject"
                              on:click|stopPropagation={() =>
                                onReject(event.id, sub)}>REJECT</button
                            >
                            <button
                              class="btn approve"
                              on:click|stopPropagation={() =>
                                onApprove(event.id, sub)}>APPROVE</button
                            >
                          </div>
                        </div>
                      {/each}
                    </div>
                  {/if}
                </div>
              </div>
            {/if}
          </div>
        {/each}
        {#if filteredEvents.length === 0}
          <div class="empty-state">No events match.</div>
        {/if}

        {#if totalPages > 1}
          <div class="pagination-controls">
            <button
              class="page-btn nav"
              disabled={currentPage === 1}
              on:click={() => changePage(-1)}
            >
              &lt; Prev
            </button>

            <span class="page-pill">{currentPage} / {totalPages}</span>

            <button
              class="page-btn nav"
              disabled={currentPage === totalPages}
              on:click={() => changePage(1)}
            >
              Next &gt;
            </button>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  @import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap");
  :global(body) {
    margin: 0;
    background-color: #111827;
    color: white;
    font-family: "Inter", sans-serif;
  }
  :global(.my-swal-font) {
    font-family: "Inter", sans-serif;
  }
  .app-screen {
    height: 100vh;
    display: flex;
    flex-direction: column;
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
    padding: 20px;
    padding-top: 20px;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  .scroll-container::-webkit-scrollbar {
    display: none;
  }

  .content-wrapper {
    max-width: 500px;
    margin: 0 auto;
  }
  .log-card {
    background: white;
    border-radius: 12px;
    margin-bottom: 16px;
    color: #1f2937;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }
  .card-summary {
    padding: 16px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
  }

  .card-content-row {
    display: flex;
    gap: 15px;
    align-items: center;
  }
  .event-thumb {
    width: 60px;
    height: 60px;
    flex-shrink: 0;
    border-radius: 8px;
    overflow: hidden;
    background: #e5e7eb;
  }
  .event-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .thumb-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #3b82f6;
    color: white;
    font-size: 24px;
    font-weight: 700;
  }

  .info-box {
    flex: 1;
    min-width: 0;
  }
  .row-top {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 6px;
  }
  .title {
    font-size: 16px;
    font-weight: 700;
    margin: 0;
    color: #111827;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .date {
    font-size: 11px;
    color: #6b7280;
    flex-shrink: 0;
    margin-left: 8px;
  }
  .status-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 4px;
  }

  .participant-badge {
    background: #eff6ff;
    color: #3b82f6;
    padding: 3px 6px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
  }
  .pending-status {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }
  .status-dot.warning {
    background: #f59e0b;
  }
  .status-dot.success {
    background: #10b981;
  }
  .status-text {
    font-size: 11px;
    font-weight: 600;
  }
  .status-text.warning {
    color: #d97706;
  }
  .status-text.success {
    color: #059669;
  }

  .expand-icon {
    color: #9ca3af;
    transition: transform 0.3s;
    margin-left: auto;
  }
  .log-card.expanded .expand-icon {
    transform: rotate(180deg);
  }

  /* Details & Submissions */
  .details-wrapper {
    background: #f8fafc;
    border-top: 1px solid #e2e8f0;
    max-height: 600px;
    overflow-y: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  .details-wrapper::-webkit-scrollbar {
    display: none;
  }

  .sub-item {
    padding: 16px;
    border-bottom: 1px solid #e2e8f0;
    background: #fff;
  }
  .runner-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
  }
  .avatar-circle {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    overflow: hidden;
    background: #e5e7eb;
    border: 2px solid #fff;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    flex-shrink: 0;
  }
  .avatar-circle img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .avatar-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #6366f1;
    color: white;
    font-weight: 700;
    font-size: 16px;
  }
  .runner-details {
    display: flex;
    flex-direction: column;
  }
  .r-name {
    font-weight: 700;
    font-size: 14px;
    color: #111827;
  }
  .r-time {
    font-size: 11px;
    color: #6b7280;
  }
  .proof-display {
    width: 100%;
    height: 250px;
    background: #000;
    border-radius: 8px;
    overflow: hidden;
    position: relative;
    margin-bottom: 16px;
    border: 1px solid #e5e7eb;
  }
  .proof-display img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
  .zoom-hint {
    position: absolute;
    bottom: 10px;
    right: 10px;
    background: rgba(0, 0, 0, 0.6);
    color: white;
    font-size: 11px;
    padding: 4px 10px;
    border-radius: 20px;
    pointer-events: none;
  }
  .action-buttons {
    display: flex;
    gap: 10px;
  }
  .btn {
    flex: 1;
    padding: 12px;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
  }
  .btn.reject {
    background: #fee2e2;
    color: #b91c1c;
  }
  .btn.approve {
    background: #10b981;
    color: white;
  }
  .loading-state,
  .inline-loader,
  .empty-state-sub,
 
  .spinner {
    width: 24px;
    height: 24px;
    border: 3px solid rgba(0, 0, 0, 0.1);
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: spin 1s infinite;
    margin: 0 auto 10px;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  :global(.swal-clean-popup) {
    padding: 0 !important;
    background: transparent !important;
    box-shadow: none !important;
    display: flex !important;
    align-items: center;
    justify-content: center;
  }
  :global(.swal-full-image) {
    max-height: 90vh;
    max-width: 90vw;
    width: auto;
    height: auto;
    object-fit: contain;
    background: black;
    border-radius: 4px;
    margin: 0 !important;
  }

  :global(.swal-clean-popup-reject) {
    font-family: "Inter", sans-serif !important;
    border-radius: 16px !important;
    padding: 20px !important;
    width: 450px !important;
  }

  :global(.reject-container) {
    display: flex;
    flex-direction: column;
    gap: 12px;
    text-align: left;
    margin-top: 10px;
  }

  :global(.helper-text) {
    font-size: 14px;
    color: #6b7280;
    margin-bottom: 8px;
    font-weight: 400;
  }

  :global(.reject-card) {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px 16px;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s ease;
    background: #fff;
    position: relative;
  }

  :global(.reject-card:hover) {
    background-color: #f9fafb;
    border-color: #d1d5db;
  }

  :global(.reject-card:has(input:checked)) {
    border-color: #ef4444; 
    background-color: #fef2f2; 
    box-shadow: 0 0 0 1px #ef4444;
  }

  :global(.reject-card input[type="radio"]) {
    margin-top: 4px; 
    accent-color: #ef4444;
    width: 18px;
    height: 18px;
    flex-shrink: 0;
  }

  :global(.card-content) {
    display: flex;
    flex-direction: column;
  }

  :global(.rj-title) {
    font-size: 14px;
    font-weight: 600;
    color: #1f2937;
  }

  :global(.rj-desc) {
    font-size: 12px;
    color: #6b7280;
    margin-top: 2px;
  }

  :global(.other-box) {
    max-height: 0;
    opacity: 0;
    overflow: hidden;
    transition: all 0.3s ease-in-out;
  }

  :global(.other-box.visible) {
    max-height: 100px;
    opacity: 1;
    margin-top: 4px;
  }

  :global(.custom-textarea) {
    width: 100%;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    padding: 10px;
    font-family: "Inter", sans-serif;
    font-size: 14px;
    resize: none;
    height: 80px;
    outline: none;
    background: #f9fafb;
    box-sizing: border-box;
  }

  :global(.custom-textarea:focus) {
    border-color: #ef4444;
    background: #fff;
    box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.1);
  }

  :global(.approve-card) {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    border: 1px solid #d1d5db; 
    border-left: 5px solid #10b981; 
    border-radius: 10px;
    background: #f0fdf4;
    margin-bottom: 12px;
  }

  :global(.ac-avatar) {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    overflow: hidden;
    background: #e5e7eb;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid #fff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  :global(.ac-avatar img) {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  :global(.ac-placeholder) {
    font-weight: 700;
    color: #6b7280;
    font-size: 16px;
  }

  :global(.approve-info) {
    display: flex;
    flex-direction: column;
    gap: 8px;
    background: #f9fafb;
    padding: 12px;
    border-radius: 8px;
    border: 1px dashed #e5e7eb;
  }

  :global(.info-row) {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    color: #374151;
  }

  :global(.info-row .icon) {
    font-size: 14px;
  }

    .fixed-search-area {
    flex-shrink: 0;
    z-index: 45;
    padding: 16px 20px 0 20px;
    background: transparent;
    margin-bottom: 10px;
  }


  .main-search-input-box {
    display: flex;
    align-items: center;
    background: transparent; 
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 0 12px;
    height: 48px;
    margin-top: 70px;
    transition: all 0.3s ease;
  }
  .main-search-input-box.active {
    border-color: #10b981;
    box-shadow: 0 0 0 1px #10b981;
    background: rgba(16, 185, 129, 0.05);
  }

  .content-wrapper {
    max-width: 500px;
    margin: 0 auto;
    width: 100%;
  }

  .search-filter-wrapper {
    position: relative;
    width: 100%;
  }

  .search-icon-wrapper {
    color: #9ca3af;
    margin-right: 10px;
    display: flex;
  }
  .main-search-input-box input {
    background: transparent;
    border: none;
    outline: none;
    color: white;
    flex: 1;
    font-size: 15px;
  }
  .main-search-input-box input::placeholder {
    color: #9ca3af;
  }

  .filter-popover {
    position: absolute;
    top: 56px;
    right: 0;
    width: 320px;
    background: #1e293b;
    border-radius: 16px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.05);
    padding: 20px;
    display: flex;
    flex-direction: column;
    z-index: 100;
  }
  .popover-triangle {
    position: absolute;
    top: -6px;
    right: 18px;
    width: 12px;
    height: 12px;
    background: #1e293b;
    transform: rotate(45deg);
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    border-left: 1px solid rgba(255, 255, 255, 0.05);
  }
  .popover-content {
    display: flex;
    gap: 16px;
  }
  .filter-col {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  .year-col {
    flex: 0.8;
  }
  .month-col {
    flex: 1.2;
  }
  .divider {
    width: 1px;
    background: rgba(255, 255, 255, 0.1);
    margin: 0 4px;
  }
  .col-sub-header {
    font-size: 10px;
    font-weight: 700;
    color: #64748b;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .filter-btn {
    border: none;
    border-radius: 6px;
    padding: 8px 12px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    background: #334155;
    color: #94a3b8;
    transition: all 0.2s;
    margin-bottom: 12px;
  }
  .filter-btn.wide {
    width: 100%;
    text-align: center;
  }
  .filter-btn.active {
    background: #10b981;
    color: white;
  }
  .year-list {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }
  .filter-text-btn {
    background: none;
    border: none;
    color: #94a3b8;
    font-size: 14px;
    cursor: pointer;
    padding: 4px 8px;
  }
  .filter-text-btn:hover {
    color: white;
  }
  .filter-text-btn.active-text {
    color: white;
    font-weight: bold;
  }
  .month-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
  .month-btn {
    background: none;
    border: none;
    color: #94a3b8;
    font-size: 12px;
    padding: 6px 0;
    cursor: pointer;
    border-radius: 4px;
  }
  .month-btn:hover {
    background: rgba(255, 255, 255, 0.05);
    color: white;
  }
  .month-btn.active-month {
    color: #10b981;
    font-weight: 700;
  }

  .log-card {
    background: white;
    border-radius: 12px;
    margin-bottom: 16px;
    overflow: hidden;
    color: #1f2937;
  }
  .card-summary {
    display: flex;
    padding: 12px;
    gap: 12px;
    cursor: pointer;
    outline: none;
  }
  .card-summary:focus-visible {
    background: #f3f4f6;
  }

  .info-box {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .row-top {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 6px;
  }
  .title {
    font-size: 14px;
    font-weight: 700;
    margin: 0;
  }
  .date {
    font-size: 11px;
    color: #6b7280;
  }

  .calendar-btn {
    background: none;
    border: none;
    color: #6b7280;
    cursor: pointer;
    padding: 6px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }
  .calendar-btn:hover {
    color: #e5e7eb;
    background: rgba(255, 255, 255, 0.05);
  }
  .calendar-btn.active {
    color: #10b981;
  }

  .empty-state {
    text-align: center;
    color: #9ca3af;
    padding-top: 20px;
    font-size: 14px;
  }

  .pagination-controls {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-top: 24px;
    padding-bottom: 20px;
  }
  .page-btn {
    background: #1f2937;
    color: #e5e7eb;
    border: 1px solid #374151;
    padding: 8px 16px;
    border-radius: 20px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .page-btn:hover:not(:disabled) {
    background: #374151;
    color: white;
    border-color: #4b5563;
  }
  .page-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .page-pill {
    background: #111827;
    color: white;
    padding: 6px 16px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 700;
    border: 1px solid #1f2937;
  }
</style>
