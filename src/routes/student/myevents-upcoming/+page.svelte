<script lang="ts">
  import { slide } from "svelte/transition";
  import { onMount } from "svelte";
  import Swal from "sweetalert2";
  import { goto } from "$app/navigation";

  // --- Configuration ---
  const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(
    /\/$/,
    "",
  );

  // --- Interfaces ---
  interface EventDetail {
    id: number;
    title: string;
    date: string;
    rawDate: Date;
    rawEndDate: Date;
    time: string;
    image: string;
    location: string;
  }

  interface RawParticipation {
    id: number;
    user_id: number;
    event_id: number;
    status: string;
    join_code: string;
    rejection_reason?: string;
    proof_image_url?: string;
  }

  interface Participation {
    id: number;
    event: EventDetail;
    status: string;
    join_code: string;
    rejection_reason?: string;
    proof_image_url?: string;
  }

  let isRefreshing = false;

  // --- State ---
  let participations: Participation[] = [];
  let isLoading = true;
  let isSubmitting = false;
  let errorMessage = "";
  let token = "";
  let currentUserId: number | null = null;

  // UI State
  let activeTab: "upcoming" | "history" = "upcoming";
  let expandedEventId: number | null = null;
  let selectedFile: File | null = null;
  let previewUrl: string | null = null;
  let fileInput: HTMLInputElement;

  // --- Helper Functions ---

  const formatTimeRange = (startDateStr: string, endDateStr?: string) => {
    if (!startDateStr) return "N/A";
    const options: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Bangkok",
    };
    const start = new Date(startDateStr).toLocaleTimeString("th-TH", options);

    if (endDateStr) {
      const end = new Date(endDateStr).toLocaleTimeString("th-TH", options);
      if (start === end) return start;
      return `${start} - ${end}`;
    }
    return start;
  };

  async function handleSessionExpired() {
    await Swal.fire({
      icon: "warning",
      title: "Session Expired",
      text: "Your token is times up",
      confirmButtonText: "Login",
      confirmButtonColor: "#10B981",
      allowOutsideClick: false,
    });
    localStorage.removeItem("user_info");
    localStorage.removeItem("access_token");
    goto("/auth/login", { replaceState: true });
  }

  async function loadData() {
    if (!token || !currentUserId) {
      errorMessage = "ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่";
      isLoading = false;
      return;
    }

    if (!isRefreshing) isLoading = true;
    isRefreshing = true;
    errorMessage = "";

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/participations/user/${currentUserId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (res.status === 401) {
        await handleSessionExpired();
        return;
      }

      if (!res.ok) throw new Error("Failed to load participations");

      const rawData: RawParticipation[] = await res.json();

      const enrichedData = await Promise.all(
        rawData.map(async (p) => {
          try {
            const eventRes = await fetch(
              `${API_BASE_URL}/api/events/${p.event_id}`,
              { headers: { Authorization: `Bearer ${token}` } },
            );

            if (eventRes.status === 401) {
              await handleSessionExpired();
              throw new Error("Session Expired");
            }

            let eventDetail: EventDetail;

            if (eventRes.ok) {
              const eData = await eventRes.json();
              const resolvedImage = resolveImageUrl(eData.banner_image_url);

              const rawDate = eData.event_date
                ? new Date(eData.event_date)
                : new Date();

              let rawEndDate: Date;
              if (eData.event_end_date) {
                rawEndDate = new Date(eData.event_end_date);
              } else {
                rawEndDate = new Date(rawDate);
                rawEndDate.setHours(23, 59, 59, 999);
              }

              const dateStr = eData.event_date
                ? new Date(eData.event_date).toLocaleDateString("th-TH", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    timeZone: "Asia/Bangkok",
                  })
                : "N/A";
              const displayTime =
                eData.time || eData.event_time
                  ? eData.time || eData.event_time
                  : formatTimeRange(eData.event_date, eData.event_end_date);

              eventDetail = {
                ...eData,
                image: resolvedImage,
                date: dateStr,
                rawDate: rawDate,
                rawEndDate: rawEndDate,
                time: displayTime,
                location: eData.location || "-",
              };
            } else {
              const now = new Date();
              const endOfDay = new Date(now);
              endOfDay.setHours(23, 59, 59, 999);

              eventDetail = {
                id: p.event_id,
                title: `Unknown Event #${p.event_id}`,
                date: "N/A",
                rawDate: now,
                rawEndDate: endOfDay,
                time: "",
                image: "",
                location: "-",
              };
            }

            const resolvedProofUrl = resolveImageUrl(p.proof_image_url);

            return {
              id: p.id,
              event: eventDetail,
              status: p.status,
              join_code: p.join_code,
              rejection_reason: p.rejection_reason,
              proof_image_url: resolvedProofUrl,
            } as Participation;
          } catch (err) {
            console.error(`Error loading event ${p.event_id}`, err);
            return {
              id: p.id,
              event: {
                id: p.event_id,
                title: "Error loading event",
                date: "N/A",
                rawDate: new Date(),
                rawEndDate: new Date(),
                time: "",
                image: "",
                location: "",
              },
              status: p.status,
              join_code: p.join_code,
            } as Participation;
          }
        }),
      );

      participations = enrichedData;
    } catch (error: any) {
      if (error.message !== "Session Expired") {
        console.error(error);
        errorMessage = "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้";
      }
    } finally {
      isLoading = false;
      isRefreshing = false;
    }
  }

  function isPast24Hours(eventEndDate: Date): boolean {
    const now = new Date();
    const oneDayAfter = new Date(eventEndDate);
    oneDayAfter.setTime(oneDayAfter.getTime() + 24 * 60 * 60 * 1000); // บวกเพิ่ม 24 ชม.
    return now > oneDayAfter;
  }

  function resolveImageUrl(path: string | undefined | null): string {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
  }

  function isEventEnded(eventEndDate: Date): boolean {
    const now = new Date();
    return eventEndDate < now;
  }

  function isFutureEvent(eventDate: Date): boolean {
    if (!eventDate) return false;
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setHours(0, 0, 0, 0);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return eventDate >= tomorrow;
  }

  function isEventActive(eventDate: Date): boolean {
    if (!eventDate) return false;
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const eDate = new Date(eventDate);
    eDate.setHours(0, 0, 0, 0);
    return eDate <= todayStart;
  }

  async function fetchUserParticipations() {
    if (!token || !currentUserId) {
      errorMessage = "ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่";
      isLoading = false;
      return;
    }

    isLoading = true;
    errorMessage = "";

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/participations/user/${currentUserId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (!res.ok) throw new Error("Failed to load participations");

      const rawData: RawParticipation[] = await res.json();

      const enrichedData = await Promise.all(
        rawData.map(async (p) => {
          try {
            const eventRes = await fetch(
              `${API_BASE_URL}/api/events/${p.event_id}`,
              { headers: { Authorization: `Bearer ${token}` } },
            );

            let eventDetail: EventDetail;

            if (eventRes.ok) {
              const eData = await eventRes.json();
              const resolvedImage = resolveImageUrl(eData.banner_image_url);

              const rawDate = eData.event_date
                ? new Date(eData.event_date)
                : new Date();

              let rawEndDate: Date;
              if (eData.event_end_date) {
                rawEndDate = new Date(eData.event_end_date);
              } else {
                rawEndDate = new Date(rawDate);
                rawEndDate.setHours(23, 59, 59, 999);
              }

              const dateStr = eData.event_date
                ? new Date(eData.event_date).toLocaleDateString()
                : "N/A";

              const timeStr = formatTimeRange(
                eData.event_date,
                eData.event_end_date,
              );

              eventDetail = {
                ...eData,
                image: resolvedImage,
                date: dateStr,
                rawDate: rawDate,
                rawEndDate: rawEndDate,
                time: timeStr,
                location: eData.location || "-",
              };
            } else {
              const now = new Date();
              const endOfDay = new Date(now);
              endOfDay.setHours(23, 59, 59, 999);

              eventDetail = {
                id: p.event_id,
                title: `Unknown Event #${p.event_id}`,
                date: "N/A",
                rawDate: now,
                rawEndDate: endOfDay,
                time: "",
                image: "",
                location: "-",
              };
            }

            const resolvedProofUrl = resolveImageUrl(p.proof_image_url);

            return {
              id: p.id,
              event: eventDetail,
              status: p.status,
              join_code: p.join_code,
              rejection_reason: p.rejection_reason,
              proof_image_url: resolvedProofUrl,
            } as Participation;
          } catch (err) {
            console.error(`Error loading event ${p.event_id}`, err);
            return {
              id: p.id,
              event: {
                id: p.event_id,
                title: "Error",
                date: "N/A",
                rawDate: new Date(),
                rawEndDate: new Date(),
                time: "",
                image: "",
                location: "",
              },
              status: p.status,
              join_code: p.join_code,
            } as Participation;
          }
        }),
      );

      participations = enrichedData;
    } catch (error: any) {
      console.error(error);
      errorMessage = "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้";
    } finally {
      isLoading = false;
    }
  }

  async function submitProof(
    participationId: number,
    participationStatus: string,
  ) {
    if (!selectedFile || !token) {
      Swal.fire("Error", "กรุณาเลือกไฟล์รูปภาพก่อนส่ง", "warning");
      return;
    }

    const isResubmit = participationStatus === "rejected";

    const confirmResult = await Swal.fire({
      title: isResubmit ? "ส่งหลักฐานใหม่?" : "ยืนยันการส่งหลักฐาน?",
      text: isResubmit
        ? "คุณต้องการส่งภาพนี้เพื่อแก้ไขการถูกปฏิเสธใช่หรือไม่?"
        : "เมื่อส่งแล้วสถานะจะเปลี่ยนเป็น 'รอตรวจสอบ' (Proof Submitted)",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#10B981",
      cancelButtonColor: "#6B7280",
      confirmButtonText: isResubmit ? "Yes, Resubmit" : "Yes, Submit",
    });

    if (!confirmResult.isConfirmed) return;

    isSubmitting = true;

    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", selectedFile);
      uploadFormData.append("subfolder", "proofs");

      const uploadRes = await fetch(`${API_BASE_URL}/api/images/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: uploadFormData,
      });

      if (!uploadRes.ok) {
        const errData = await uploadRes.json();
        throw new Error(errData.detail || "Image upload failed");
      }

      const uploadData = await uploadRes.json();
      const imageUrl =
        uploadData.url || uploadData.path || uploadData.file_path;

      if (!imageUrl) {
        throw new Error("Server ไม่ส่ง URL รูปภาพกลับมา");
      }
      let proofRes;
      const bodyPayload = JSON.stringify({
        proof_image_url: imageUrl,
      });

      if (isResubmit) {
        // --- CASE: RESUBMIT (PUT) ---
        proofRes = await fetch(
          `${API_BASE_URL}/api/participations/${participationId}/resubmit-proof`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: bodyPayload,
          },
        );
      } else {
        // --- CASE: SUBMIT FIRST TIME (POST) ---
        proofRes = await fetch(
          `${API_BASE_URL}/api/participations/${participationId}/submit-proof`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: bodyPayload,
          },
        );
      }

      if (!proofRes.ok) {
        const errData = await proofRes.json();
        throw new Error(errData.detail || "Proof submission failed");
      }

      await fetchUserParticipations();
      resetFileState();
      expandedEventId = null;

      await Swal.fire({
        title: "Success!",
        text: isResubmit
          ? "ส่งหลักฐานใหม่เรียบร้อยแล้ว"
          : "ส่งหลักฐานเรียบร้อยแล้ว",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error: any) {
      console.error("Submit proof error:", error);
      Swal.fire({
        title: "Error",
        text: error.message || "เกิดข้อผิดพลาดในการส่งข้อมูล",
        icon: "error",
      });
    } finally {
      isSubmitting = false;
    }
  }

  // --- UI Helpers ---
  function getStepNumber(status: string): number {
    switch (status) {
      case "joined":
        return 1; // PIN
      case "checked_in":
        return 2; // PROOF (Upload)
      case "rejected":
        return 2; // PROOF (Re-upload)
      case "proof_submitted":
        return 3; // VERIFIED (Waiting)
      case "completed":
        return 4; // DONE
      default:
        return 1;
    }
  }

  function toggleExpand(p: Participation) {
    if (activeTab === "history") return;
    if (activeTab === "upcoming" && isFutureEvent(p.event.rawDate)) return;

    if (expandedEventId === p.id) {
      expandedEventId = null;
      resetFileState();
    } else {
      expandedEventId = p.id;
      resetFileState();
      if (p.proof_image_url) previewUrl = p.proof_image_url;
    }
  }

  function handleFileSelect(e: any) {
    const files = e.target.files;
    if (files.length > 0) {
      selectedFile = files[0];
      previewUrl = URL.createObjectURL(files[0]);
    }
  }

  function triggerFileUpload() {
    if (fileInput) fileInput.click();
  }
  function removeFile() {
    resetFileState();
  }
  function resetFileState() {
    selectedFile = null;
    previewUrl = null;
    if (fileInput) fileInput.value = "";
  }

  // --- Filtering Logic ---
  $: filteredEvents = participations.filter((p) => {
    if (!p.event) return false;

    const isEnded = isEventEnded(p.event.rawEndDate);
    const isPast24 = isPast24Hours(p.event.rawEndDate);
    const status = p.status ? p.status.toLowerCase() : "";

    if (activeTab === "upcoming") {
      if (status === "completed") {
        return !isPast24;
      }
      return status !== "cancel" && status !== "cancelled" && !isEnded;
    } else {
      if (status === "cancel" || status === "cancelled") {
        return false;
      }
      if (status === "completed") {
        return isPast24;
      }
      return isEnded;
    }
  });

  onMount(async () => {
    try {
      const storedToken = localStorage.getItem("access_token");
      const userInfoStr = localStorage.getItem("user_info");

      if (!storedToken || !userInfoStr) {
        handleSessionExpired();
        return;
      }

      const userInfo = JSON.parse(userInfoStr);
      token = storedToken;
      currentUserId = userInfo.id;
      await loadData();
    } catch (err) {
      console.error("Auth Error:", err);
      errorMessage = "ข้อมูลผู้ใช้ผิดพลาด";
      isLoading = false;
    }
  });
</script>

<div class="app-screen">
  <div class="glass-header">
    <a
      href="/"
      class="back-btn"
      on:click|preventDefault={() => history.back()}
      aria-label="Back"
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg
      >
    </a>
    <h1 class="page-title">MY EVENTS</h1>
    <button
      class="refresh-btn"
      on:click={loadData}
      disabled={isRefreshing}
      class:spinning={isRefreshing}
      aria-label="Refresh data"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M23 4v6h-6"></path>
        <path d="M1 20v-6h6"></path>
        <path
          d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"
        ></path>
      </svg>
    </button>
  </div>

  <div class="pinned-tabs-wrapper">
    <div class="tabs-bg">
      <button
        class="tab-btn {activeTab === 'upcoming' ? 'active' : ''}"
        on:click={() => {
          activeTab = "upcoming";
          expandedEventId = null;
        }}>Upcoming</button
      >
      <button
        class="tab-btn {activeTab === 'history' ? 'active' : ''}"
        on:click={() => {
          activeTab = "history";
          expandedEventId = null;
        }}>History</button
      >
    </div>
  </div>

  <div class="scroll-container">
    <div class="content-wrapper">
      {#if isLoading}
        <div style="text-align: center; margin-top: 50px; color: #9ca3af;">
          Loading events...
        </div>
      {:else if errorMessage}
        <div style="text-align: center; margin-top: 50px; color: #ef4444;">
          {errorMessage}
        </div>
      {:else}
        <div class="events-list">
          {#each filteredEvents as p (p.id)}
            {@const isFuture = isFutureEvent(p.event.rawDate)}
            {@const isActive = isEventActive(p.event.rawDate)}
            {@const step = getStepNumber(p.status)}

            <div
              class="event-card {activeTab === 'upcoming' && !isFuture ? 'clickable' : ''} {expandedEventId === p.id ? 'expanded' : ''} {isFuture ? 'locked' : ''}"
              role="button"
              tabindex="0"
              on:click={() => toggleExpand(p)}
              on:keydown={() => {}}
            >
              <div class="card-image-wrapper">
                 <img
                  src={p.event.image || "https://via.placeholder.com/400x200"}
                  alt={p.event.title}
                  class="card-img"
                />
                {#if activeTab === "upcoming" && isFuture}
                  <div class="lock-overlay">
                    <div class="lock-icon-circle">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                    </div>
                    <span>Available on {p.event.date}</span>
                  </div>
                {/if}
              </div>
              <div class="card-content">
                <h2 class="event-title">{p.event.title}</h2>
                <div class="meta-row">
                  <div class="meta-left">
                    <div class="info-item">
                      <span class="icon">📅</span>
                      <span>{p.event.date}</span>
                    </div>
                    {#if p.event.time}
                      <div class="info-item">
                        <span class="icon">🕒</span>
                        <span>{p.event.time}</span>
                      </div>
                    {/if}
                  </div>

                  <div class="meta-right">
                    {#if p.status === "completed"}
                      <span class="status-badge complete-glow">COMPLETED</span>
                    {:else if isEventEnded(p.event.rawEndDate)}
                      <span class="status-badge expired-glow">TIME OUT</span>
                    {:else if p.status === "rejected"}
                      <span class="status-badge rejected-glow">REJECTED</span>
                    {:else if p.status === "proof_submitted"}
                      <span class="status-badge waiting-glow">WAITING</span>
                    {:else if p.status === "checked_in"}
                      <span class="status-badge upload-glow">UPLOAD PROOF</span>
                    {:else if p.status === "joined"}
                      <span class="status-badge joined-glow">REGISTERED</span>
                    {:else}
                      <span class="status-badge joined-glow">{p.status}</span>
                    {/if}
                  </div>
                </div>
                {#if activeTab === "upcoming" && !isFuture}
                  <div class="interaction-handle"></div>
                {/if}
              </div>
              {#if expandedEventId === p.id}
                <div
                  class="details-section"
                  transition:slide
                  on:click|stopPropagation={() => {}}
                >
                  <div class="separator"></div>

                  {#if activeTab === "upcoming"}
                    <div class="timeline-wrapper">
                      <div class="progress-bar-bg">
                        <div
                          class="progress-bar-fill"
                          style="width: {(step - 1) * 33}%"
                        ></div>
                      </div>
                      <div class="steps-row">
                        {#each ["PIN", "PROOF", "VERIFIED", "DONE"] as label, i}
                          <div class="step-col {step >= i + 1 ? 'active' : ''}">
                            <div class="step-circle">
                              {#if step > i + 1}✓{:else}{i + 1}{/if}
                            </div>
                            <span class="step-label">{label}</span>
                          </div>
                        {/each}
                      </div>
                    </div>

                    <div class="action-box">
                      {#if p.status === "joined" && isActive}
                        <div class="info-content">
                          <h3>Registration Successful</h3>
                          <p>Show this code to organizer to Check-in.</p>
                          <div class="pin-display">
                            {p.join_code || "LOADING..."}
                          </div>
                        </div>
                      {:else if p.status === "proof_submitted"}
                        <div class="info-content">
                          <div class="waiting-icon">⏳</div>
                          <h3 style="margin-top: 10px; color: #8b5cf6;">
                            Verification Pending
                          </h3>
                          <p style="margin-bottom: 0;">
                            You are sending, and wait organizer approve.
                          </p>
                        </div>
                      {:else if p.status === "checked_in" || p.status === "rejected"}
                        <div class="upload-content">
                          {#if p.status === "rejected"}
                            <div class="rejection-box">
                              <div class="rejection-header">
                                <span class="rejection-icon">⚠️</span>
                                <span class="rejection-title"
                                  >Submission Rejected</span
                                >
                              </div>
                              <p class="rejection-reason">
                                "{p.rejection_reason || "No reason specified"}"
                              </p>
                              <div class="rejection-action">
                                Please upload a new photo.
                              </div>
                            </div>
                          {:else}
                            <h3>Upload Proof</h3>
                            <p>
                              Please upload a photo to verify your activity.
                            </p>
                          {/if}

                          <input
                            type="file"
                            accept="image/*"
                            class="hidden-input"
                            bind:this={fileInput}
                            on:change={handleFileSelect}
                          />

                          {#if !selectedFile}
                            <button
                              type="button"
                              class="upload-placeholder"
                              on:click|stopPropagation={triggerFileUpload}
                            >
                              <div class="upload-icon-circle">
                                <svg
                                  width="24"
                                  height="24"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  stroke-width="2"
                                >
                                  <path
                                    d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
                                  ></path>
                                  <polyline points="17 8 12 3 7 8"></polyline>
                                  <line x1="12" y1="3" x2="12" y2="15"></line>
                                </svg>
                              </div>
                              <span class="upload-hint"
                                >Tap to upload {p.status === "rejected"
                                  ? "New "
                                  : ""}Photo</span
                              >
                            </button>
                          {:else}
                            <div class="file-preview-card">
                              <div class="preview-info-group">
                                <div class="preview-img-container">
                                  {#if previewUrl}<img
                                      src={previewUrl}
                                      alt="Preview"
                                      class="preview-img"
                                    />{/if}
                                </div>
                                <div class="file-details">
                                  <span class="filename"
                                    >{selectedFile.name}</span
                                  >
                                  <span class="filesize"
                                    >{(selectedFile.size / 1024 / 1024).toFixed(
                                      2,
                                    )} MB</span
                                  >
                                </div>
                              </div>
                              <div class="file-actions">
                                <button
                                  type="button"
                                  class="action-btn edit"
                                  on:click|stopPropagation={triggerFileUpload}
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="20"
                                    height="20"
                                    fill="currentColor"
                                    viewBox="0 0 256 256"
                                    ><path
                                      d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152.69a16,16,0,0,0-4.69,11.31v44.69a16,16,0,0,0,16,16H92.69a16,16,0,0,0,11.31-4.69L227.31,96a16,16,0,0,0,0-22.63ZM51.31,160l90.35-90.35,16,16L67.31,176H51.31Zm41.38,41.38L76.69,185.31,166.63,95.31,182.69,111.38ZM202,114.75,141.25,54,160,35.31,220.69,96Z"
                                    ></path></svg
                                  >
                                </button>
                                <button
                                  type="button"
                                  class="action-btn remove"
                                  on:click|stopPropagation={removeFile}
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="20"
                                    height="20"
                                    fill="currentColor"
                                    viewBox="0 0 256 256"
                                    ><path
                                      d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM112,168a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm0-120V48H96V40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8Z"
                                    ></path></svg
                                  >
                                </button>
                              </div>
                            </div>
                          {/if}

                          <button
                            class="primary-btn"
                            disabled={!selectedFile || isSubmitting}
                            on:click|stopPropagation={() =>
                              submitProof(p.id, p.status)}
                          >
                            {isSubmitting
                              ? "Uploading..."
                              : p.status === "rejected"
                                ? "RESUBMIT PROOF"
                                : "SUBMIT PROOF"}
                          </button>
                        </div>
                      {:else if p.status === "completed"}
                        <div class="info-content success">
                          <div
                            class="success-icon"
                            style="margin-bottom: 10px;"
                          >
                            🎉
                          </div>
                          <h3 style="color: #10b981;">Mission Complete!</h3>
                          <p>You have successfully completed this event.</p>
                        </div>
                      {/if}
                    </div>
                  {:else}
                    <div
                      class="action-box"
                      style="min-height: auto; padding: 1px;"
                    ></div>
                  {/if}
                </div>
              {/if}
            </div>
          {/each}
          {#if filteredEvents.length === 0}
            <div
              style="text-align: center; color: #6b7280; margin-top: 40px; font-size: 14px;"
            >
              No {activeTab} events found.
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  /* ลบ @import ออกแล้ว เพราะเราไปโหลดใน app.html แทน */

  :global(body) {
    margin: 0;
    padding: 0;
    background-color: #111827;
    color: white;
    font-family: "Inter", sans-serif;
    overflow: hidden;
  }
  :global(*) {
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
    padding: 0;
  }
  .page-title {
    color: white;
    font-size: 28px;
    font-weight: 700;
    margin: 0;
    letter-spacing: 0.5px;
  }
  .pinned-tabs-wrapper {
    position: absolute;
    top: 80px;
    left: 0;
    width: 100%;
    z-index: 40;
    background: transparent;
    padding-top: 15px;
    display: flex;
    justify-content: center;
    pointer-events: none;
  }
  .tabs-bg {
    background-color: #374151;
    border-radius: 50px;
    padding: 4px;
    display: flex;
    width: 100%;
    max-width: 240px;
    pointer-events: auto;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  }
  .tab-btn {
    flex: 1;
    background: transparent;
    border: none;
    padding: 8px 0;
    border-radius: 40px;
    color: #9ca3af;
    font-weight: 500;
    cursor: pointer;
    transition: 0.2s;
    font-size: 14px;
  }
  .tab-btn.active {
    background-color: white;
    color: #111827;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    font-weight: 700;
  }
  .scroll-container {
    flex: 1;
    overflow-y: auto;
    padding-top: 150px;
    padding-bottom: 40px;
  }
  .content-wrapper {
    width: 100%;
    max-width: 400px;
    margin: 0 auto;
    padding: 0 20px;
    box-sizing: border-box;
  }
  .event-card {
    background: white;
    border-radius: 16px;
    overflow: hidden;
    margin-bottom: 20px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s;
    cursor: pointer;
  }
  .event-card.locked {
    opacity: 0.75;
    filter: grayscale(0.8);
    cursor: not-allowed;
  }
  .card-image-wrapper {
    position: relative;
    height: 160px;
  }
  .card-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .lock-overlay {
    position: absolute;
    inset: 0;
    background: rgba(17, 24, 39, 0.7);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 600;
    font-size: 14px;
  }
  .lock-icon-circle {
    width: 40px;
    height: 40px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 8px;
  }
  .card-content {
    padding: 16px;
  }
  .event-title {
    margin: 0 0 10px 0;
    font-size: 16px;
    font-weight: 700;
    color: #111827;
    text-transform: uppercase;
  }
  .event-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #6b7280;
  }
  .event-info-stack {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .info-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #6b7280;
    font-weight: 500;
  }

  .status-row {
    margin-top: 4px;
  }
  .status-row-left {
    margin-top: 4px;
  }

  .status-pill {
    font-weight: 700;
    font-size: 12px;
    padding: 2px 0;
    display: inline-flex;
    align-items: center;
  }

  .status-pill::before {
    content: "•";
    margin-right: 6px;
    font-size: 14px;
  }

  .status-pill.completed {
    color: #10b981;
  }
  .status-pill.cancel {
    color: #ef4444;
  }
  .status-pill.rejected {
    color: #dc2626;
  }
  .status-pill.expired {
    color: #6b7280;
  }
  .status-badge {
    padding: 8px 12px;
    border-radius: 30px;
    font-weight: 800;
    font-size: 11px;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    min-width: 100px;
    text-align: center;
  }
  .complete-glow {
    background-color: rgba(16, 185, 129, 0.15);
    color: #10b981;
    border: 1px solid rgba(16, 185, 129, 0.4);
    box-shadow: 0 0 15px rgba(16, 185, 129, 0.3);
  }

  /* 2. TIME OUT (เทา) */
  .expired-glow {
    background-color: rgba(107, 114, 128, 0.15);
    color: #9ca3af;
    border: 1px solid rgba(107, 114, 128, 0.4);
    box-shadow: 0 0 15px rgba(107, 114, 128, 0.2);
  }

  /* 3. REGISTERED (ฟ้า) */
  .joined-glow {
    background-color: rgba(59, 130, 246, 0.15);
    color: #3b82f6;
    border: 1px solid rgba(59, 130, 246, 0.4);
    box-shadow: 0 0 15px rgba(59, 130, 246, 0.3);
  }

  /* 4. UPLOAD PROOF (ส้ม) */
  .upload-glow {
    background-color: rgba(245, 158, 11, 0.15);
    color: #f59e0b;
    border: 1px solid rgba(245, 158, 11, 0.4);
    box-shadow: 0 0 15px rgba(245, 158, 11, 0.3);
  }

  /* 5. WAITING (ม่วง) */
  .waiting-glow {
    background-color: rgba(139, 92, 246, 0.15);
    color: #8b5cf6;
    border: 1px solid rgba(139, 92, 246, 0.4);
    box-shadow: 0 0 15px rgba(139, 92, 246, 0.3);
  }

  /* 6. REJECTED (แดง) */
  .rejected-glow {
    background-color: rgba(239, 68, 68, 0.15);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.4);
    box-shadow: 0 0 15px rgba(239, 68, 68, 0.3);
  }

  .meta-left {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .info-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: #6b7280;
    font-weight: 500;
  }

  .info-item .icon {
    font-size: 14px;
    width: 18px;
    text-align: center;
  }
  .meta-right {
    text-align: right;
    padding-left: 10px;
    flex-shrink: 0;
  }

  .status-text {
    font-weight: 800;
    font-size: 12px;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    display: block;
  }
  .status-text.completed {
    color: #10b981;
  }
  .status-text.joined {
    color: #3b82f6;
  }
  .status-text.checked_in {
    color: #d97706;
  }
  .status-text.cancel {
    color: #ef4444;
  }
  .status-text.proof_submitted {
    color: #f59e0b;
  }
  .status-text.rejected {
    color: #dc2626;
  }

  .details-section {
    padding: 0 16px 20px 16px;
    background: #f9fafb;
    border-top: 1px solid #e5e7eb;
    cursor: default;
  }
  .separator {
    width: 40px;
    height: 4px;
    background: #e5e7eb;
    border-radius: 2px;
    margin: 12px auto 20px;
  }
  .timeline-wrapper {
    position: relative;
    margin-bottom: 24px;
    padding: 0 10px;
  }
  .progress-bar-bg {
    position: absolute;
    top: 14px;
    left: 40px;
    right: 40px;
    height: 3px;
    background: #e5e7eb;
    z-index: 1;
  }
  .progress-bar-fill {
    height: 100%;
    background: #10b981;
    transition: width 0.5s ease;
  }
  .steps-row {
    display: flex;
    justify-content: space-between;
    position: relative;
    z-index: 2;
  }
  .step-col {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    width: 60px;
  }
  .step-circle {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: white;
    border: 2px solid #e5e7eb;
    color: #9ca3af;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 12px;
    transition: 0.3s;
  }
  .step-label {
    font-size: 10px;
    font-weight: 600;
    color: #9ca3af;
  }
  .step-col.active .step-circle {
    background: #10b981;
    border-color: #10b981;
    color: white;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
  }
  .step-col.active .step-label {
    color: #10b981;
  }
  .action-box {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 20px;
    text-align: center;
    min-height: 180px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .info-content h3 {
    margin: 10px 0 5px;
    color: #111827;
    font-size: 16px;
  }
  .info-content p {
    color: #6b7280;
    font-size: 13px;
    margin: 0 0 15px;
  }
  .pin-display {
    background: #ecfdf5;
    color: #047857;
    font-size: 20px;
    font-weight: 800;
    padding: 12px;
    border-radius: 8px;
    border: 1px dashed #10b981;
    letter-spacing: 2px;
  }
  .success-icon,
  .error-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    margin: 0 auto;
  }
  .success-icon {
    background: #d1fae5;
    color: #10b981;
  }
  .error-icon {
    background: #fee2e2;
    color: #ef4444;
  }
  .history-location-box {
    margin-top: 10px;
    padding: 10px;
    background: #f3f4f6;
    border-radius: 8px;
    display: inline-block;
    border: 1px solid #e5e7eb;
  }
  .history-status-row {
    margin-top: 6px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }
  .history-desc {
    font-size: 11px;
    font-weight: 500;
  }

  .history-desc.success {
    color: #059669;
  }

  .history-desc.error {
    color: #6b7280;
  }
  .loc-label {
    display: block;
    font-size: 11px;
    color: #6b7280;
    font-weight: 600;
    text-transform: uppercase;
    margin-bottom: 2px;
  }
  .loc-value {
    display: block;
    font-size: 14px;
    color: #1f2937;
    font-weight: 500;
  }
  .waiting-note {
    margin-top: 15px;
    padding: 8px 12px;
    background: #eff6ff;
    border: 1px solid #dbeafe;
    border-radius: 8px;
    color: #1e40af;
    font-size: 12px;
    line-height: 1.4;
  }
  .waiting-icon {
    font-size: 32px;
    animation: pulse 2s infinite;
  }

  .hidden-input {
    display: none;
  }
  .upload-content {
    text-align: center;
  }
  .upload-content h3 {
    color: #111827;
    margin: 0 0 8px 0;
    font-size: 18px;
    font-weight: 700;
  }
  .upload-content p {
    color: #4b5563;
    font-size: 14px;
    margin-bottom: 20px;
  }
  .upload-placeholder {
    width: 100%;
    border: 2px dashed #d1d5db;
    border-radius: 12px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    background: #f9fafb;
    transition: all 0.2s;
    margin-bottom: 20px;
  }
  .upload-placeholder:hover {
    background: #f3f4f6;
    border-color: #10b981;
  }
  .upload-icon-circle {
    width: 48px;
    height: 48px;
    background: #ecfdf5;
    border-radius: 50%;
    color: #10b981;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 8px;
  }
  .upload-hint {
    font-weight: 600;
    color: #374151;
    font-size: 14px;
  }
  .file-preview-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
  }
  .preview-info-group {
    display: flex;
    align-items: center;
    flex: 1;
    overflow: hidden;
    margin-right: 10px;
  }
  .preview-img-container {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #e5e7eb;
    flex-shrink: 0;
    background: #f9fafb;
  }
  .preview-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .file-details {
    margin-left: 12px;
    text-align: left;
    display: flex;
    flex-direction: column;
    justify-content: center;
    overflow: hidden;
  }
  .filename {
    font-size: 13px;
    font-weight: 600;
    color: #1f2937;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .filesize {
    font-size: 11px;
    color: #9ca3af;
  }
  .file-actions {
    display: flex;
    gap: 2px;
    flex-shrink: 0;
  }
  .action-btn {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }
  .action-btn.edit {
    background: #eff6ff;
    color: #3b82f6;
  }
  .action-btn.edit:hover {
    background: #dbeafe;
    color: #2563eb;
  }
  .action-btn.remove {
    background: #fee2e2;
    color: #ef4444;
  }
  .action-btn.remove:hover {
    background: #fecaca;
    color: #dc2626;
  }
  .action-btn:active {
    transform: scale(0.95);
  }
  .primary-btn {
    width: 100%;
    padding: 16px 20px;
    background: #10b981;
    color: #111827;
    font-size: 16px;
    font-weight: 800;
    border: none;
    border-radius: 14px;
    cursor: pointer;
    transition:
      transform 0.1s,
      background 0.2s;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .primary-btn:active {
    transform: scale(0.98);
  }
  .primary-btn:hover {
    background: #059669;
  }
  .primary-btn:disabled {
    background: #374151;
    color: #9ca3af;
    cursor: not-allowed;
    box-shadow: none;
  }
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
  }
  .spinner {
    width: 30px;
    height: 30px;
    border: 3px solid #e5e7eb;
    border-top-color: #10b981;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin-bottom: 12px;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* --- Rejection Styles --- */
  .rejection-box {
    background-color: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 20px;
    text-align: left;
  }
  .rejection-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }
  .rejection-icon {
    font-size: 18px;
  }
  .rejection-title {
    color: #b91c1c;
    font-weight: 700;
    font-size: 14px;
    text-transform: uppercase;
  }
  .rejection-reason {
    color: #7f1d1d;
    font-size: 13px;
    line-height: 1.5;
    margin: 0 0 12px 0;
    font-weight: 500;
  }
  .rejection-action {
    color: #b91c1c;
    font-size: 12px;
    font-weight: 600;
    background: rgba(255, 255, 255, 0.5);
    padding: 6px 10px;
    border-radius: 6px;
    display: inline-block;
  }
  .refresh-btn {
    position: absolute;
    right: 20px; /* วางชิดขวา */
    top: 50%;
    transform: translateY(-50%);

    width: 40px;
    height: 40px;
    border-radius: 50%;

    /* Glassmorphism */
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(4px);
    border: 1px solid rgba(255, 255, 255, 0.2);

    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;

    color: rgba(255, 255, 255, 0.9);
    cursor: pointer;
    z-index: 52;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .refresh-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.4);
    color: #fff;
    transform: translateY(-50%) scale(1.1);
    box-shadow: 0 0 15px rgba(255, 255, 255, 0.1);
  }

  .refresh-btn:active {
    transform: translateY(-50%) scale(0.95);
  }

  /* State: Loading */
  .refresh-btn.spinning {
    cursor: wait;
    pointer-events: none;
    background: rgba(255, 255, 255, 0.1);
    color: #10b981; /* สีเขียวตอนโหลด */
    transform: translateY(-50%) scale(1);
  }

  .refresh-btn.spinning svg {
    animation: spin 1s linear infinite;
  }
  @keyframes pulse {
    0% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.1);
      opacity: 0.7;
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }
  .status-text.proof_submitted {
    color: #8b5cf6; /* สีม่วง (Purple/Violet) เพื่อให้ต่างจากสีส้ม Upload */
  }

  /* สีสำหรับ Completed (เผื่อยังไม่มี) */
  .status-text.completed {
    color: #10b981; /* สีเขียว */
  }
</style>
