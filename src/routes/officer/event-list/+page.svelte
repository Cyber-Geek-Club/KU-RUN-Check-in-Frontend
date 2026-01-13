<script lang="ts">
  import { fade, scale } from "svelte/transition";
  import { beforeNavigate, goto } from "$app/navigation";
  import { quintOut } from "svelte/easing";
  import Swal from "sweetalert2";
  import { enhance } from "$app/forms";
  import { auth } from "$lib/utils/auth";
  import { onMount, onDestroy } from "svelte";
  import { lazyLoadBg } from "$lib/utils/lazyLoad";

  const base = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

  let isLoading = true;
  let isMenuOpen = false;
  let pollInterval: ReturnType<typeof setInterval> | null = null;
  let isRefreshing = false;

  interface EventItem {
    id: number;
    title: string;
    description: string;
    location: string;
    distance_km: number;
    banner_image_url: string;
    is_active: boolean;
    is_published: boolean;
    created_by: number;
    image: string;
    maxParticipants: number;
    participants: number;
    date: string;
    rawDate: Date;
    time: string;
    isReadMore: boolean;
    isJoined: boolean;
    participationId: number | null;
    participationStatus: string | null;
  }

  let events: EventItem[] = [];

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
    handleLogout();
  }

  async function loadData() {
    isLoading = true;
    isRefreshing = true;
    try {
      const token = localStorage.getItem("access_token");
      const userInfoStr = localStorage.getItem("user_info");

      if (!token || !userInfoStr) {
        handleSessionExpired();
        return;
      }

      const userInfo = JSON.parse(userInfoStr);
      const userId = userInfo.id;

      const [eventsRes, myParticipationsRes] = await Promise.all([
        fetch(`${base}/api/events/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch(`${base}/api/participations/user/${userId}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      // ✅ Check 401 Unauthorized (Token หมดอายุ)
      if (eventsRes.status === 401 || myParticipationsRes.status === 401) {
        await handleSessionExpired();
        return;
      }

      if (!eventsRes.ok)
        throw new Error(`Events API Error: ${eventsRes.status}`);

      const eventsData = await eventsRes.json();

      const myParticipationMap = new Map<
        number,
        { id: number; status: string }
      >();

      if (myParticipationsRes.ok) {
        const myData = await myParticipationsRes.json();
        myData.forEach((item: any) => {
          const status = item.status ? item.status.toUpperCase() : "";
          if (status !== "CANCELLED" && status !== "CANCEL") {
            // เก็บทั้ง ID และ Status
            myParticipationMap.set(Number(item.event_id), {
              id: Number(item.id),
              status: status,
            });
          }
        });
      }

      const now = new Date();
      const activeEventsData = eventsData.filter((e: any) => {
        const eventTime = e.event_end_date
          ? new Date(e.event_end_date)
          : new Date(e.event_date);
          
        // เงื่อนไข: 1.เวลายังไม่จบ 2.สถานะต้อง Published เท่านั้น
        return eventTime >= now && e.is_published === true;
      });

      const enrichedEvents = await Promise.all(
        activeEventsData.map(async (e: any) => {
          const realTimeCount = await fetchEventStats(e.id, token, base);
          const finalCount =
            realTimeCount !== null ? realTimeCount : e.participant_count || 0;

          const myPartData = myParticipationMap.get(e.id);
          const amIJoined = !!myPartData;
          const myStatus = myPartData ? myPartData.status : null;

          const displayTime =
            e.time || e.event_time
              ? e.time || e.event_time
              : formatTimeRange(e.event_date, e.event_end_date);

          return {
            id: e.id,
            title: e.title,
            description: e.description,
            location: e.location,
            distance_km: e.distance_km,
            max_participants: e.max_participants,
            banner_image_url: e.banner_image_url,
            is_active: e.is_active,
            is_published: e.is_published,
            created_by: e.created_by,
            image: e.banner_image_url,
            participants: finalCount,
            maxParticipants: e.max_participants,
            rawDate: e.event_date ? new Date(e.event_date) : new Date(),
            date: e.event_date
              ? new Date(e.event_date).toLocaleDateString("th-TH", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  timeZone: "Asia/Bangkok",
                })
              : "N/A",
            time: displayTime,
            isReadMore: false,
            isJoined: amIJoined,
            participationId: myPartData ? myPartData.id : null,
            participationStatus: myStatus, // ✅ Set status
          };
        }),
      );

      // ✅ Filter: กรองกิจกรรมที่ COMPLETED ออกไป ไม่ให้แสดง
      events = enrichedEvents.filter(
        (e) => e.participationStatus !== "COMPLETED",
      );

      // เริ่ม Polling ถ้ามีข้อมูล (เรียกฟังก์ชัน startPolling ของเดิม)
      if (events.length > 0) startPolling(30000);
    } catch (err) {
      console.error("Error loading data:", err);
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "ไม่สามารถโหลดข้อมูลได้",
      });
    } finally {
      isLoading = false;
      isRefreshing = false;
    }
  }

  async function fetchEventStats(
    eventId: number,
    token: string,
    baseUrl: string,
  ): Promise<number | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(`${baseUrl}/api/events/${eventId}/stats`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const statsData = await res.json();
        if (typeof statsData.total_participants === "number") {
          return statsData.total_participants;
        }
        if (
          statsData.status_counts &&
          typeof statsData.status_counts === "object"
        ) {
          const statusCounts = statsData.status_counts;
          const total = Object.keys(statusCounts).reduce((sum, key) => {
            if (
              key.toUpperCase() !== "CANCELLED" &&
              key.toUpperCase() !== "CANCEL"
            ) {
              return sum + (Number(statusCounts[key]) || 0);
            }
            return sum;
          }, 0);
          return total;
        }
        const statusObj = statsData.status || statsData;
        if (statusObj && typeof statusObj === "object") {
          const total = Object.keys(statusObj).reduce((sum, key) => {
            const upperKey = key.toUpperCase();
            if (upperKey !== "CANCELLED" && upperKey !== "CANCEL") {
              return sum + (Number(statusObj[key]) || 0);
            }
            return sum;
          }, 0);
          return total;
        }

        console.warn(
          `Unexpected API response structure for event ${eventId}:`,
          statsData,
        );
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.warn(`Failed to fetch stats for event ${eventId}`, err);
      }
    }
    return null;
  }

  async function batchUpdateEvents(): Promise<void> {
    const token = localStorage.getItem("access_token") || "";

    if (!token || events.length === 0) return;

    const batchSize = 5;

    for (let i = 0; i < events.length; i += batchSize) {
      const batch = events.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (event, batchIndex) => {
          const newCount = await fetchEventStats(event.id, token, base);
          if (newCount !== null) {
            const actualIndex = i + batchIndex;
            if (events[actualIndex]) {
              events[actualIndex].participants = newCount;
            }
          }
        }),
      );
    }

    events = [...events];
  }

  function startPolling(intervalMs: number = 30000) {
    if (pollInterval) return;

    pollInterval = setInterval(async () => {
      try {
        await batchUpdateEvents();
        console.log("✅ Events updated via polling");
      } catch (err) {
        console.error("❌ Polling error:", err);
      }
    }, intervalMs);
  }

  function stopPolling() {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  }

  onMount(async () => {
    loadData();
  });

  onDestroy(() => {
    stopPolling();
  });

  function toggleMenu() {
    isMenuOpen = !isMenuOpen;
  }
  function handleOverlayKeydown(event: KeyboardEvent) {
    if (event.key === "Enter" || event.key === " ") toggleMenu();
  }
  beforeNavigate(({ type, cancel }) => {
    if (type === "popstate") cancel();
  });

  function handleLogout() {
    isMenuOpen = false;
    auth.logout();
    goto("/auth/login", { replaceState: true });
  }

  function toggleReadMore(index: number) {
    events[index].isReadMore = !events[index].isReadMore;
    events = [...events];
  }

  // clearClientData removed - auth.logout() now handles all cleanup

  async function handleRegister(eventItem: EventItem) {
    if (eventItem.isJoined) {
      await goto("/officer/myevents-upcoming");
      return;
    }

    // [FIX] Check if event is active and published
    if (!eventItem.is_active) {
      Swal.fire("Unavailable", "This event is not currently active", "warning");
      return;
    }

    if (!eventItem.is_published) {
      Swal.fire("Unavailable", "This event is not yet published", "warning");
      return;
    }

    const result = await Swal.fire({
      title: "Confirm Registration",
      html: `Are you sure you want to register for <br><b style="color: #10B981;">"${eventItem.title}"</b>?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#10B981",
      cancelButtonColor: "#6B7280",
      confirmButtonText: "Yes, Register",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        const base = (import.meta.env.VITE_API_BASE_URL ?? "").replace(
          /\/$/,
          "",
        );
        const token = localStorage.getItem("access_token");
        if (!token) {
          Swal.fire("Error", "กรุณาเข้าสู่ระบบก่อนลงทะเบียน", "error");
          return;
        }

        const res = await fetch(`${base}/api/participations/join`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ event_id: eventItem.id }),
        });

        const responseData = await res.json();

        if (res.ok) {
          // [FIX] Properly update all registration state
          eventItem.isJoined = true;
          if (responseData.id) {
            eventItem.participationId = responseData.id;
            eventItem.participationStatus = 'JOINED';
          }

          // ดึงยอดใหม่ทันทีหลังสมัคร
          const newCount = await fetchEventStats(eventItem.id, token, base);
          if (newCount !== null) {
            eventItem.participants = newCount;
          } else {
            eventItem.participants += 1;
          }
          events = [...events]; // Trigger reactivity

          await Swal.fire({
            title: "Success!",
            text: "ลงทะเบียนเรียบร้อยแล้ว",
            icon: "success",
            timer: 2000,
            showConfirmButton: false,
          });
          
          // [FIX] Reload data to ensure consistency
          await loadData();
        } else {
          console.error("Register Failed:", responseData);
          const errorMsg =
            responseData.detail ||
            responseData.message ||
            "เกิดข้อผิดพลาดในการลงทะเบียน";
          if (errorMsg.includes("joined") || res.status === 409) {
            eventItem.isJoined = true;
            events = [...events];
            await Swal.fire(
              "Already Registered",
              "คุณได้ลงทะเบียนกิจกรรมนี้ไปแล้ว",
              "warning",
            );
            // [FIX] Redirect to my events if already registered
            await goto("/officer/myevents-upcoming");
          } else if (errorMsg.includes("full")) {
            Swal.fire("Event Full", "กิจกรรมนี้ผู้เข้าร่วมเต็มแล้ว", "error");
          } else {
            Swal.fire("Registration Failed", errorMsg, "error");
          }
        }
      } catch (err) {
        console.error("Network Error:", err);
        Swal.fire("Error", "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", "error");
      }
    }
  }

  async function handleCancel(eventItem: EventItem) {
    if (!eventItem.participationId) {
      Swal.fire(
        "Error",
        "ไม่พบข้อมูลการลงทะเบียน (Participation ID Missing)",
        "error",
      );
      return;
    }

    const result = await Swal.fire({
      title: "Cancel Registration",
      text: "กรุณาระบุเหตุผลในการยกเลิก (จำเป็น)",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6B7280",
      confirmButtonText: "Confirm Cancel",
      input: "text",
      inputPlaceholder: "เช่น ติดภารกิจ, ป่วย, ธุระด่วน...",
      inputValidator: (value) => {
        if (!value) return "กรุณาระบุเหตุผลด้วยครับ!";
        if (value.length > 500) return "เหตุผลต้องไม่เกิน 500 ตัวอักษร";
      },
    });

    if (result.isConfirmed && result.value) {
      const reason = result.value;

      try {
        const base = (import.meta.env.VITE_API_BASE_URL ?? "").replace(
          /\/$/,
          "",
        );
        const token = localStorage.getItem("access_token") || "";

        const res = await fetch(
          `${base}/api/participations/${eventItem.participationId}/cancel`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ cancellation_reason: reason }),
          },
        );

        if (res.ok) {
          eventItem.isJoined = false;
          eventItem.participationId = null;

          // ดึงยอดใหม่ทันทีหลังยกเลิก
          const newCount = await fetchEventStats(eventItem.id, token, base);
          if (newCount !== null) {
            eventItem.participants = newCount;
          } else {
            eventItem.participants = Math.max(0, eventItem.participants - 1);
          }
          events = [...events]; // Trigger reactivity

          Swal.fire("Cancelled", "ยกเลิกการเข้าร่วมเรียบร้อยแล้ว", "success");
        } else {
          const errData = await res.json();
          const errorMsg =
            errData.detail || errData.message || "ยกเลิกไม่สำเร็จ";
          Swal.fire("Failed", errorMsg, "error");
        }
      } catch (err) {
        console.error(err);
        Swal.fire("Error", "เกิดข้อผิดพลาดในการเชื่อมต่อ", "error");
      }
    }
  }
</script>

<div class="app-screen">
  <div class="glass-header">
    <div class="header-content">
      <h1 class="page-title">EVENT LIST</h1>

      <button 
        class="refresh-btn" 
        on:click={loadData} 
        disabled={isRefreshing}
        class:spinning={isRefreshing}
        aria-label="Refresh data"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M23 4v6h-6"></path>
            <path d="M1 20v-6h6"></path>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
        </svg>
      </button>

      <button
        class="menu-burger"
        class:active={isMenuOpen}
        on:click|stopPropagation={toggleMenu}
        aria-label="Toggle menu"
      >
        <span class="line line-1"></span>
        <span class="line line-2"></span>
      </button>
    </div>
  </div>

  {#if isMenuOpen}
    <div
      class="menu-overlay"
      on:click={toggleMenu}
      role="button"
      tabindex="0"
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
      <a href="/student/monthly-reward" class="menu-item"
        ><span class="icon">{"\u{1F3C6}"}</span> Monthly Reward</a
      >
      <a href="/student/myevents-upcoming" class="menu-item"
        ><span class="icon">{"\u{1F4C5}"}</span> My Events</a
      >
      <a href="/student/setting-account" class="menu-item"
        ><span class="icon">{"\u{2699}\u{FE0F}"}</span> Settings</a
      >
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
        <button type="button" class="menu-item logout" on:click={handleLogout}
          ><span class="icon">{"\u{1F6AA}"}</span> Logout</button
        >
      </form>
    </div>
  {/if}

  <div class="scroll-container">
    <div class="content-wrapper">
      {#if isLoading}
        <div style="text-align: center; color: white; padding-top: 20px;">
          Loading events...
        </div>
      {:else}
        {#each events as event, i}
          <div class="event-card">
            <div
              class="card-image"
              use:lazyLoadBg={event.image}
            >
              <div class="participant-badge">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                <span>{event.participants}/{event.maxParticipants}</span>
              </div>
            </div>

            <div class="card-body">
              <h3 class="event-title">{event.title}</h3>

              {#if event.description && event.description !== "string"}
                <p class="event-desc">{event.description}</p>
              {:else}
                <p
                  class="event-desc"
                  style="color: #9ca3af; font-style: italic;"
                ></p>
              {/if}
              {#if event.isReadMore}
                <div class="event-details" transition:fade>
                  <div class="detail-row">
                    <span class="detail-icon">📅</span>
                    {event.date}
                  </div>
                  <div class="detail-row">
                    <span class="detail-icon">⏰</span>
                    {event.time}
                  </div>
                  <div class="detail-row">
                    <span class="detail-icon">📍</span>
                    {event.location}
                  </div>
                </div>
              {/if}

              <div class="card-footer">
                <button
                  class="read-more-btn"
                  on:click={() => toggleReadMore(i)}
                >
                  {event.isReadMore ? "Read less" : "Read more"}
                </button>

                {#if event.isJoined}
                  <div style="display: flex; gap: 8px;">
                    <button
                      class="cancel-btn"
                      on:click={() => handleCancel(event)}
                    >
                      CANCEL
                    </button>

                    <button
                      class="running-btn"
                      on:click={() => goto("/officer/myevents-upcoming")}
                    >
                      RUNNING
                    </button>
                  </div>
                {:else}
                  <button
                    class="register-btn"
                    on:click={() => handleRegister(event)}
                  >
                    REGISTRATION
                  </button>
                {/if}
              </div>
            </div>
          </div>
          {:else}
          <div class="empty-state">
            <div class="empty-icon">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
                <path d="M8 14h.01"></path>
                <path d="M12 14h.01"></path>
                <path d="M16 14h.01"></path>
                <path d="M8 18h.01"></path>
                <path d="M12 18h.01"></path>
                <path d="M16 18h.01"></path>
              </svg>
            </div>
            <h3>No Events Found</h3>
            <p>Looks like there are no active events right now.<br>Please come back later!</p>
            <button class="refresh-pill" on:click={loadData}>
              Check Again
            </button>
          </div>
        {/each}
      {/if}
      <div style="height: 40px;"></div>
    </div>
  </div>
</div>

<style>
  @import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap");

  :global(body) {
    margin: 0;
    padding: 0;
    background-color: #111827;
    font-family: "Inter", sans-serif;
    overflow: hidden;
  }

  :global(button),
  :global(input),
  :global(select),
  :global(textarea) {
    font-family: "Inter", sans-serif !important;
  }

  :global(.swal2-popup),
  :global(.swal2-title),
  :global(.swal2-html-container),
  :global(.swal2-confirm),
  :global(.swal2-cancel),
  :global(.swal2-content) {
    font-family: "Inter", sans-serif !important;
  }

  :global(.swal2-container) {
    backdrop-filter: blur(8px) !important;
    -webkit-backdrop-filter: blur(8px) !important;
    background: rgba(0, 0, 0, 0.4) !important;
  }

  :global(.swal2-popup) {
    border-radius: 20px !important;
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
  }

  .header-content {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 20px;
    box-sizing: border-box;
  }

  .page-title {
    color: white;
    font-size: 28px;
    font-weight: 700;
    margin: 0;
    letter-spacing: 1px;
    text-transform: uppercase;
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
    position: relative;
    z-index: 2;
    width: auto;
    margin: 4px 8px;
    border-radius: 8px;
    transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }

  .menu-item:hover {
    background-color: #f3f4f6;
    color: #10b981;
    transform: translateX(4px);
  }

  .menu-item:active {
    transform: scale(0.98) translateX(4px);
  }

  .menu-item.logout {
    color: #ef4444;
  }

  .menu-item.logout:hover {
    background-color: #fef2f2;
    color: #b40808;
  }

  .icon {
    margin-right: 12px;
    font-size: 18px;
    transition: transform 0.2s ease;
  }

  .menu-item:hover .icon {
    transform: scale(1.1);
  }

  .menu-divider {
    height: 1px;
    background: #e5e7eb;
    margin: 6px 12px;
  }

  .scroll-container {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
    padding-top: 100px;
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
  .event-card {
    background: white;
    border-radius: 16px;
    overflow: hidden;
    margin-bottom: 24px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
  }
  .card-image {
    height: 180px;
    background-size: cover;
    background-position: center;
    background-color: #f3f4f6;
    position: relative;
    transition: opacity 0.3s ease;
  }
  .card-image:not(.lazy-loaded) {
    opacity: 0.6;
  }
  .card-image.lazy-loaded {
    opacity: 1;
  }
  .participant-badge {
    position: absolute;
    top: 12px;
    right: 12px;
    background: rgba(255, 255, 255, 0.9);
    padding: 4px 8px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    color: #374151;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .card-body {
    padding: 16px;
    text-align: left;
  }
  .event-title {
    margin: 0 0 12px 0;
    font-size: 18px;
    font-weight: 700;
    color: #111827;
    text-transform: uppercase;
    letter-spacing: -0.025em; /* บีบตัวอักษรนิดนึงให้ดู Modern */
    line-height: 1.3;
  }
  .event-desc {
    font-size: 14px;
    color: #4b5563; /* ใช้สีเทาโทนเย็น (Cool Gray) ดูแพงกว่าสีดำสนิท */
    line-height: 1.6; /* เพิ่มช่องว่างระหว่างบรรทัดให้อ่านสบายตา */
    margin: 0 0 20px 0; /* ดัน Footer/Read more ให้ห่างออกไป */
    font-weight: 400;

    display: -webkit-box;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: all 0.3s ease;
  }
  .event-details {
    background: #f9fafb;
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 16px;
  }
  .detail-row {
    font-size: 13px;
    color: #4b5563;
    margin-bottom: 6px;
    display: flex;
    align-items: center;
  }
  .detail-row:last-child {
    margin-bottom: 0;
  }

  .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: auto;
  }
  .read-more-btn {
    background: none;
    border: none;
    color: #10b981;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    padding: 0;
  }
  .read-more-btn:hover {
    text-decoration: underline;
  }
  .register-btn {
    background-color: #10b981;
    color: #111827;
    border: none;
    padding: 8px 20px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    text-transform: uppercase;
  }
  .register-btn:hover {
    background-color: #059669;
  }
  .running-btn {
    background-color: #f59e0b; /* สีเหลือง Amber */
    color: white;
    border: none;
    padding: 8px 20px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    text-transform: uppercase;
    transition: background-color 0.2s;
  }
  .running-btn:hover {
    background-color: #d97706; /* สีเหลืองเข้ม */
  }
  .cancel-btn {
    background-color: #ef4444; /* สีแดง */
    color: white;
    border: none;
    padding: 8px 16px; /* ลด padding ลงนิดนึงให้ดูสมดุล */
    border-radius: 6px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    text-transform: uppercase;
    transition: background-color 0.2s;
  }
  .cancel-btn:hover {
    background-color: #dc2626; /* แดงเข้มเมื่อ Hover */
  }
  .loading-state {
    text-align: center;
    color: rgba(255, 255, 255, 0.6);
    padding-top: 60px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }
  .spinner {
    width: 30px;
    height: 30px;
    border: 3px solid rgba(255, 255, 255, 0.1);
    border-top-color: #10b981;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  /* ✅ Empty State Design (Minimal & Cool) */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    text-align: center;
    animation: fadeIn 0.5s ease-out;
  }

  .empty-icon {
    color: rgba(255, 255, 255, 0.1); /* สีจางๆ ดูเท่ๆ */
    margin-bottom: 20px;
    transform: rotate(-5deg); /* เอียงนิดนึงให้ดูมีลูกเล่น */
    transition: transform 0.3s ease;
  }
  
  .empty-state:hover .empty-icon {
    transform: rotate(0deg) scale(1.1);
    color: rgba(16, 185, 129, 0.4); /* Hover แล้วเปลี่ยนสี */
  }

  .empty-state h3 {
    color: #e5e7eb;
    font-size: 20px;
    font-weight: 700;
    margin: 0 0 8px 0;
    letter-spacing: 0.5px;
  }

  .empty-state p {
    color: #9ca3af;
    font-size: 14px;
    line-height: 1.5;
    margin: 0 0 24px 0;
  }
  .refresh-btn {
    position: absolute;
    right: 70px;
    top: 50%;
    transform: translateY(-50%);
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(4px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    color: rgba(255, 255, 255, 0.8);
    cursor: pointer;
    z-index: 52;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .refresh-btn:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.3);
    color: #fff;
    transform: translateY(-50%) scale(1.1);
    box-shadow: 0 0 15px rgba(255, 255, 255, 0.1);
  }
  .refresh-btn:active {
    transform: translateY(-50%) scale(0.9);
  }
  .refresh-btn.spinning {
    cursor: wait;
    pointer-events: none;
    background: rgba(255, 255, 255, 0.1);
    color: #10b981;
    opacity: 1;
    transform: translateY(-50%) scale(1);
  }
  .refresh-btn.spinning svg {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .refresh-text, .btn-content {
    display: none;
  }
  .refresh-pill {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #10b981;
    padding: 8px 20px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .refresh-pill:hover {
    background: rgba(16, 185, 129, 0.1);
    border-color: rgba(16, 185, 129, 0.3);
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style>
