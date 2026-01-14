<script lang="ts">
  import { onMount } from "svelte";
  import { slide } from "svelte/transition";
  import { quintOut } from "svelte/easing";
  import Swal from "sweetalert2";
  import { lazyLoad } from '$lib/utils/lazyLoad';
  import OrganizerLayout from "$lib/components/organizer/OrganizerLayout.svelte";
  import { lang } from '$lib/stores/organizerStore';
  import { api, fetchPendingSubmissions as fetchSubmissionsAPI, approveSubmission, rejectSubmission } from '$lib/api/organizerApi';

  $: t = $lang;

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
      const response = await api.get('/api/events/');
      const data = response.data;
      const list = Array.isArray(data) ? data : data.data || [];

      const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
      
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
      Swal.fire("Error", t.loadEventsFailed || "โหลดกิจกรรมไม่สำเร็จ", "error");
    } finally {
      isLoadingAll = false;
    }
  }

  async function updateAllCounts() {
    const updates = events.map(async (event, index) => {
      try {
        const response = await api.get(`/api/participations/event/${event.id}`);
        const data = response.data;
        const subs = Array.isArray(data) ? data : data.data || [];
        const realPendingCount = subs.filter(
          (s: any) => s.status === "proof_submitted"
        ).length;
        events[index].pendingCount = realPendingCount;
      } catch (e) {
        console.warn(`Failed to count for event ${event.id}`, e);
      }
    });

    await Promise.all(updates);
    events = [...events];
  }

  async function fetchUserProfile(userId: number) {
    try {
      const response = await api.get(`/api/users/${userId}`);
      const data = response.data;
      return data.data || data;
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

    const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

    try {
      const response = await api.get(`/api/participations/event/${eventId}`);
      const data = response.data;
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
    if (approved) {
      return await approveSubmission(pid);
    } else {
      return await rejectSubmission(pid, reason);
    }
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

<OrganizerLayout>
<div class="app-screen">
  <div class="page-header">
    <h1 class="page-title">{t.verifyProof || 'VERIFY PROOF'}</h1>
    <p class="page-subtitle">{t.verifyProofDesc || 'Review and verify participant submissions'}</p>
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
                    <img use:lazyLoad={event.image} alt="event" />
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
                                <img use:lazyLoad={sub.runnerImage} alt="user" />
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
                              <img use:lazyLoad={sub.proofImage} alt="Proof" />
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
</OrganizerLayout>

<style>
  @import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap");
  :global(.my-swal-font) {
    font-family: "Inter", sans-serif;
  }
  
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

  .fixed-search-area {
    margin-bottom: 1.5rem;
  }

  .scroll-container {
    flex: 1;
    overflow-y: auto;
    padding: 0 0 40px 0;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
</style>