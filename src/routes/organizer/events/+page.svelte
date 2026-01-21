<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import Swal from 'sweetalert2';
  import axios from 'axios';
  
  // ✅ 1. ตั้งค่า Base URL ให้ถูกต้อง
  const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://158.108.102.14:8001").replace(/\/$/, "");
  const IMAGE_PLACEHOLDER = 'https://placehold.co/400x200/94a3b8/ffffff?text=Loading...';
  const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' },
  });
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  // ---------- Performance helpers ----------
  const CACHE_TTL = 60 * 1000; // 60s
  const rewardConfigCache: Map<string, { value: boolean; ts: number }> = new Map();
  const holidaysCache: Map<string, { value: any[]; ts: number }> = new Map();
  const pendingCache: Map<string, { value: number; ts: number }> = new Map();

  // Single controller to allow cancelling background fetches when component unmounts
  const pageController = new AbortController();

  // scheduleBackground removed: rely on direct async calls and AbortController for cancellation.

  onDestroy(() => {
    try { pageController.abort(); } catch (e) { /* ignore */ }
  });

  type Language = "th" | "en";
  let currentLang: Language = "th";
  if (typeof localStorage !== "undefined") {
    const savedLang = localStorage.getItem("app_language");
    if (savedLang === "th" || savedLang === "en") currentLang = savedLang;
  }
  
  const translations = {
    th: {
      participants: "ผู้เข้าร่วม", viewDetails: "ดูรายละเอียด", edit: "แก้ไข", delete: "ลบ",
      active: "เปิดใช้งาน", draft: "ฉบับร่าง", closed: "ปิดแล้ว",
      singleDay: "กิจกรรมวันเดียว", multiDay: "กิจกรรมหลายวัน",
      noResults: "ไม่พบผลลัพธ์", showing: "แสดง", of: "จาก", pending: "รอตรวจสอบ",
      confirmDelete: "ยืนยันการลบ?", deleteEventText: "คุณต้องการลบกิจกรรมนี้หรือไม่?",
      deleted: "ลบสำเร็จ", eventDeletedSuccess: "ลบกิจกรรมเรียบร้อย", error: "เกิดข้อผิดพลาด",
      cannotDeleteEvent: "ไม่สามารถลบกิจกรรมได้", cancel: "ยกเลิก", back: "กลับ",
      eventDetails: "รายละเอียดกิจกรรม", basicInfo: "ข้อมูลพื้นฐาน", title: "ชื่อกิจกรรม",
      description: "คำอธิบาย", location: "สถานที่", eventType: "ประเภทกิจกรรม",
      dateTime: "วันที่และเวลา", startDate: "วันที่เริ่ม", endDate: "วันที่สิ้นสุด",
      startTime: "เวลาเริ่ม", endTime: "เวลาสิ้นสุด", status: "สถานะ",
      totalSlots: "จำนวนที่รับ", joined: "เข้าร่วมแล้ว", available: "ที่ว่าง",
      distance: "ระยะทาง", km: "กิโลเมตร", rewardManagement: "จัดการรางวัล",
      rewards: "รางวัล", noRewards: "ไม่มีรางวัล", calculateRanks: "คำนวณอันดับ",
      finalizeRewards: "ยืนยันรางวัล", leaderboard: "กระดานคะแนน", rank: "อันดับ", tier: "ระดับ", close: "ปิด",
      hasRewards: "มีของรางวัลแจก",
      holidayInfo: "วันหยุด", 
      rewardInfo: "รางวัล",
      stoppedSatSun: "หยุดเสาร์-อาทิตย์",
    },
    en: {
      participants: "Participants", viewDetails: "View Details", edit: "Edit", delete: "Delete",
      active: "Active", draft: "Draft", closed: "Closed",
      singleDay: "Single Day Event", multiDay: "Multi-Day Event",
      noResults: "No results", showing: "Showing", of: "of", pending: "Pending",
      confirmDelete: "Confirm Delete?", deleteEventText: "Do you want to delete this event?",
      deleted: "Deleted!", eventDeletedSuccess: "Event deleted successfully", error: "Error",
      cannotDeleteEvent: "Failed to delete event", cancel: "Cancel", back: "Back",
      eventDetails: "Event Details", basicInfo: "Basic Information", title: "Event Title",
      description: "Description", location: "Location", eventType: "Event Type",
      dateTime: "Date & Time", startDate: "Start Date", endDate: "End Date",
      startTime: "Start Time", endTime: "End Time", status: "Status",
      totalSlots: "Total Slots", joined: "Joined", available: "Available",
      distance: "Distance", km: "kilometers", rewardManagement: "Reward Management",
      rewards: "Rewards", noRewards: "No Rewards", calculateRanks: "Calculate Ranks",
      finalizeRewards: "Finalize Rewards", leaderboard: "Leaderboard", rank: "Rank", tier: "Tier", close: "Close",
      hasRewards: "Has Rewards",
      holidayInfo: "Holiday",
      rewardInfo: "Reward",
      stoppedSatSun: "Stopped Sat-Sun",
    },
  };
  
  $: lang = translations[currentLang];

  interface RewardUser {
    id: string; name: string; rank?: number; tier?: string; distance?: number; time?: string;
  }

  interface Holiday {
    id: number;
    holiday_date: string;
    holiday_name: string;
    description?: string | null;
    is_past?: boolean;
  }

  interface Event {
    id: string; title: string; description: string; location: string; image: string | null;
    status: 'Active' | 'Closed' | 'Draft';
    startDate: string; endDate: string; startTime: string; endTime: string;
    totalSlots: number; usedSlots: number; pendingCount?: number;
    distanceKm?: number;
    rewards?: RewardUser[];
    holidays?: Holiday[];
    hasRewardProgram?: boolean;
  }
  
  let events: Event[] = [];
  let eventsLoading = true;
  let currentPage = 1;
  let itemsPerPage = 9;
  let showPageDropdown = false;
  let selectedEvent: Event | null = null;
  let showDetailModal = false;
  let detailLoading = false;
  
  $: paginatedEvents = events.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  $: totalPages = Math.ceil(events.length / itemsPerPage);
  
  onMount(() => {
    // Fetch events shortly after mount. Avoid using requestIdleCallback
    // to prevent browser Intervention console messages.
    // First check whether the reward-leaderboards API exists to avoid many 404s
    setTimeout(async () => {
      await checkRewardApiAvailability();
      fetchEvents();
    }, 200);
  });

  function resolveImageUrl(img: string | null) {
    if (!img) return null;
    if (img.startsWith('http') || img.startsWith('data:')) return img;
    const cleanPath = img.startsWith('/') ? img.slice(1) : img;
    const cleanBase = API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`;
    if (cleanPath.startsWith('api/')) {
        return `${cleanBase}${cleanPath}`;
    }
    return `${cleanBase}api/${cleanPath}`;
  }

  function handleImgError(e: any) {
    const img = (e && e.currentTarget) ? (e.currentTarget as HTMLImageElement) : null;
    if (img) img.src = 'https://placehold.co/400x200/1e293b/64748b?text=Image+Error';
  }

  function overlayKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
      closeDetailModal();
    }
  }

  function extractTime(iso: string) {
    if (!iso) return "";
    try {
      const date = new Date(iso);
      if (isNaN(date.getTime())) return "";
      return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch { return "";
    }
  }

  function mapToEvent(e: any): Event {
    return {
      id: e.id,
      title: e.title,
      description: e.description,
      location: e.location,
      image: resolveImageUrl(e.banner_image_url || e.image || e.banner || e.image_url || null),
      status: (e.is_published && e.is_active) ? 'Active' : (!e.is_published && !e.is_active) ? 'Draft' : 'Closed',
      startDate: e.event_date || e.start_date || e.startDate || new Date().toISOString(),
      endDate: e.event_end_date || e.end_date || e.endDate || new Date().toISOString(),
      startTime: e.start_time ? e.start_time.slice(0, 5) : extractTime(e.event_date || e.start_date),
      endTime: e.end_time ? e.end_time.slice(0, 5) : extractTime(e.event_end_date || e.end_date),
      totalSlots: e.max_participants || e.totalSlots || 0,
      usedSlots: e.participant_count || e.participants || 0,
      pendingCount: 0,
      distanceKm: e.distance_km || e.distanceKm,
      rewards: e.rewards || [],
      holidays: e.holidays || [],
      hasRewardProgram: false
    };
  }

  function getEventHolidayDisplay(event: Event): string {
    if (!event.holidays || event.holidays.length === 0) return "";

    const hasSatSun = event.holidays.some(h => {
        const name = (h.holiday_name || "").toLowerCase();
        return name.includes('เสาร์') || name.includes('อาทิตย์') || name.includes('sat') || name.includes('sun');
    });

    if (hasSatSun) return lang.stoppedSatSun; 

    const today = new Date();
    today.setHours(0,0,0,0);
    
    const upcoming = event.holidays
        .filter(h => new Date(h.holiday_date) >= today)
        .sort((a, b) => new Date(a.holiday_date).getTime() - new Date(b.holiday_date).getTime());

    if (upcoming.length > 0) {
        return upcoming[0].holiday_name;
    } else if (event.holidays.length > 0) {
        return event.holidays[event.holidays.length - 1].holiday_name;
    }

    return "";
  }

  // ✅ ฟังก์ชันดึง Config รางวัล (ปรับปรุง Reactivity)
  async function fetchRewardConfigsForEvents() {
    // If the leaderboard API is not available, skip checks to avoid noisy 404s
    if (!rewardApiAvailable) return;
    const token = localStorage.getItem("access_token");
    const headers = token ? { "Authorization": `Bearer ${token}` } : {};
    const BATCH_SIZE = 5;
    const eventsCopy = [...events];
    const updateMap: Record<string, { hasReward?: boolean }> = {};

    for (let i = 0; i < eventsCopy.length; i += BATCH_SIZE) {
      const batch = eventsCopy.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map(async (event) => {
          // check cache first
          const cached = rewardConfigCache.get(String(event.id));
          if (cached && (Date.now() - cached.ts) < CACHE_TTL) {
            return { eventId: event.id, hasReward: cached.value };
          }
          try {
            const res = await api.get(`/api/reward-leaderboards/configs/event/${event.id}`, { headers, signal: pageController.signal });
            const has = res.status === 200 && res.data && res.data.is_active === true;
            rewardConfigCache.set(String(event.id), { value: has, ts: Date.now() });
            return { eventId: event.id, hasReward: has };
          } catch (err) {
            // store negative result to avoid repeated failing calls
            rewardConfigCache.set(String(event.id), { value: false, ts: Date.now() });
            return { eventId: event.id, hasReward: false };
          }
        })
      );

      results.forEach((r) => {
        if (r.status === 'fulfilled') updateMap[r.value.eventId] = { hasReward: r.value.hasReward };
      });
    }

    if (Object.keys(updateMap).length > 0) {
      events = events.map(ev => ({ ...ev, hasRewardProgram: updateMap[ev.id]?.hasReward ?? ev.hasRewardProgram }));
    }
  }

  // Feature-detect whether reward-leaderboards endpoints exist on this server.
  // If not present, set `rewardApiAvailable = false` so we avoid per-event 404s.
  let rewardApiAvailable = true;
  async function checkRewardApiAvailability() {
    try {
      const token = localStorage.getItem("access_token");
      const headers = token ? { "Authorization": `Bearer ${token}` } : {};
      // Try a lightweight list request; if it 404s the service isn't enabled
      const res = await api.get('/api/reward-leaderboards/configs', { headers });
      rewardApiAvailable = res && res.status >= 200 && res.status < 300;
    } catch (err: any) {
      // any error -> mark unavailable to avoid repeated calls
      rewardApiAvailable = false;
    }
  }

  async function fetchHolidaysForEvents() {
    const token = localStorage.getItem("access_token");
    const headers = token ? { "Authorization": `Bearer ${token}` } : {};
    const BATCH_SIZE = 5; 
    const eventsCopy = [...events];
    const holidaysMap: Record<string, any[]> = {};

    for (let i = 0; i < eventsCopy.length; i += BATCH_SIZE) {
      const batch = eventsCopy.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map(async (event) => {
          // cache check
          const cached = holidaysCache.get(String(event.id));
          if (cached && (Date.now() - cached.ts) < CACHE_TTL) {
            return { eventId: event.id, holidays: cached.value };
          }
          try {
            const res = await api.get(`/api/events/${event.id}/holidays`, { headers, signal: pageController.signal });
            const hs = res.status === 200 && res.data.holidays ? res.data.holidays : [];
            holidaysCache.set(String(event.id), { value: hs, ts: Date.now() });
            return { eventId: event.id, holidays: hs };
          } catch (err) {
            holidaysCache.set(String(event.id), { value: [], ts: Date.now() });
            return { eventId: event.id, holidays: [] };
          }
        })
      );

      results.forEach((r) => {
        if (r.status === 'fulfilled') holidaysMap[r.value.eventId] = r.value.holidays;
      });
    }

    if (Object.keys(holidaysMap).length > 0) {
      events = events.map(ev => ({ ...ev, holidays: holidaysMap[ev.id] ?? ev.holidays }));
    }
  }

  async function fetchPendingCountsForEvents() {
    const token = localStorage.getItem("access_token");
    const headers = token ? { "Authorization": `Bearer ${token}` } : {};
    const BATCH_SIZE = 5;
    const eventsCopy = [...events];
    const pendingMap: Record<string, number> = {};
    for (let i = 0; i < eventsCopy.length; i += BATCH_SIZE) {
      const batch = eventsCopy.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map(async (event) => {
          try {
            const res = await api.get(`/api/participations/event/${event.id}/report`, { headers, signal: pageController.signal });
            if (res.status === 200) {
              const data = res.data.data || res.data;
              const pending = Array.isArray(data) ? data.filter((s: any) => s.status === "proof_submitted").length : 0;
              return { eventId: event.id, pendingCount: pending };
            }
            return { eventId: event.id, pendingCount: 0 };
          } catch (err) { return { eventId: event.id, pendingCount: 0 }; }
        })
      );
      results.forEach((r) => {
        if (r.status === 'fulfilled') pendingMap[r.value.eventId] = r.value.pendingCount;
      });
    }

    if (Object.keys(pendingMap).length > 0) {
      events = events.map(ev => ({ ...ev, pendingCount: pendingMap[ev.id] ?? ev.pendingCount }));
    }
  }
  
  async function fetchEvents() {
    eventsLoading = true;
    try {
      const response = await api.get('/api/events');
      const rawEvents = response.data.events || response.data || [];
      events = rawEvents.map((e: any) => mapToEvent(e));
      
      // ✅ เรียกดึงข้อมูลเพิ่มเติม (run in background)
      fetchPendingCountsForEvents();
      fetchHolidaysForEvents();
      fetchRewardConfigsForEvents();
    } catch (error) { console.error('Error fetching events:', error);
    } 
    finally { eventsLoading = false;
    }
  }
  
  function translateStatus(status: string): string { const map: any = { Active: lang.active, Closed: lang.closed, Draft: lang.draft };
    return map[status] || status; }
  function formatDateRange(event: Event): string {
    if (!event.startDate) return "-";
    try {
        const start = new Date(event.startDate);
        const end = new Date(event.endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return "-";
        const locale = currentLang === 'th' ? 'th-TH' : 'en-GB';
        const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
        const startStr = start.toLocaleDateString(locale, options);
        const endStr = end.toLocaleDateString(locale, options);
        return startStr === endStr ? startStr : `${startStr} - ${endStr}`;
    } catch { return "-";
    }
  }
  function formatDate(dateStr: string): string {
    if (!dateStr) return "-";
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return "-";
        const locale = currentLang === 'th' ? 'th-TH' : 'en-GB';
        return date.toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' });
    } catch { return "-"; }
  }
  function getEventType(event: Event): 'single' | 'multi' { if (!event.startDate) return 'single';
    const start = new Date(event.startDate).toDateString(); const end = new Date(event.endDate).toDateString(); return start === end ? 'single' : 'multi';
  }
  function getEventTypeLabel(event: Event): string { return getEventType(event) === 'single' ? lang.singleDay : lang.multiDay;
  }
  function getParticipantPercentage(event: Event): number { if (!event.totalSlots) return 0; return Math.min((event.usedSlots / event.totalSlots) * 100, 100);
  }
  function getPendingPercentage(event: Event): number { if (!event.pendingCount || !event.totalSlots) return 0; return Math.min((event.pendingCount / event.totalSlots) * 100, 100);
  }

  // native `loading="lazy"` is used on images; no JS lazy-loader required.
  
  async function handleViewDetails(event: Event) {
    selectedEvent = event; 
    showDetailModal = true;
    detailLoading = true;
    
    try {
      const response = await api.get(`/api/events/${event.id}`, { signal: pageController.signal });
      let details = mapToEvent(response.data);
      const rewards = response.data.rewards || [];
      const holidays = response.data.holidays || [];
      
      // ✅ Inherit hasRewardProgram from the list view first
      const hasRewardProgram = event.hasRewardProgram || false;

      selectedEvent = { 
        ...details, 
        rewards: rewards,
        holidays: holidays,
        hasRewardProgram: hasRewardProgram
      };
      
      if (!selectedEvent.holidays || selectedEvent.holidays.length === 0) {
        const holRes = await api.get(`/api/events/${event.id}/holidays`, { signal: pageController.signal }).catch(() => null);
        if (holRes && holRes.data && holRes.data.holidays) {
          selectedEvent.holidays = holRes.data.holidays;
        }
      }

      // ✅ Double check rewards config for detail view
      const rewardConfigRes = await api.get(`/api/reward-leaderboards/configs/event/${event.id}`, { signal: pageController.signal }).catch(() => null);
      if (rewardConfigRes && rewardConfigRes.status === 200 && rewardConfigRes.data && rewardConfigRes.data.is_active) {
          selectedEvent.hasRewardProgram = true;
          // ✅ บังคับ Refresh Modal ด้วยการ Re-assign
          selectedEvent = { ...selectedEvent };
      }

    } catch (error) { 
      console.error('Error loading details:', error);
    } finally { 
      detailLoading = false;
    }
  }
  
  function closeDetailModal() { showDetailModal = false; selectedEvent = null;
  }
  
  function handleEdit(eventId: string) { 
    goto(`/organizer/create-event?id=${eventId}`);
  }
  
  async function handleDelete(eventId: string) {
    const result = await Swal.fire({
      title: lang.confirmDelete, text: lang.deleteEventText, icon: 'warning', showCancelButton: true,
      background: '#1e293b', color: '#fff', confirmButtonColor: '#ef4444', cancelButtonColor: '#64748b',
      confirmButtonText: lang.delete, cancelButtonText: lang.cancel
    });
    if (result.isConfirmed) {
      try {
        await api.delete(`/api/events/${eventId}`);
        await fetchEvents();
        if (selectedEvent?.id === eventId) closeDetailModal();
        Swal.fire({ title: lang.deleted, text: lang.eventDeletedSuccess, icon: 'success', background: '#1e293b', color: '#fff', confirmButtonColor: '#10b981', timer: 1500, showConfirmButton: false });
      } catch (error) { Swal.fire({ title: lang.error, text: lang.cannotDeleteEvent, icon: 'error', background: '#1e293b', color: '#fff', confirmButtonColor: '#10b981' });
      }
    }
  }
  function prevPage() { if (currentPage > 1) currentPage--;
  }
  function nextPage() { if (currentPage < totalPages) currentPage++; }
  function jumpToPage(page: number) { currentPage = page;
    showPageDropdown = false; }
</script>

<svelte:window on:click={() => (showPageDropdown = false)} />

<div class="events-page">
  <div class="grid-section">
    {#if eventsLoading}
      <div class="grid">
        {#each [1, 2, 3, 4, 5, 6] as _}
          <div class="glass-card skeleton-card">
            <div class="card-img-wrapper skeleton-img"></div>
            <div class="card-body"><div class="skeleton-line skeleton-title"></div><div class="skeleton-line skeleton-desc"></div></div>
          </div>
        {/each}
      </div>
    {:else if paginatedEvents.length === 0}
      <div class="empty-state">
        <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <p>{lang.noResults}</p>
      </div>
    {:else}
      <div class="grid">
        {#each paginatedEvents as event (event.id)}
          <div class="glass-card">
            <div class="card-img-wrapper">
              <img
                class="card-img"
                src={event.image || IMAGE_PLACEHOLDER}
                alt={event.title}
                decoding="async"
                loading="lazy"
                on:error={handleImgError}
              />
              <div class="status-badge-overlay">
                <span class="status-badge" class:status-active={event.status === 'Active'} class:status-closed={event.status === 'Closed'} class:status-draft={event.status === 'Draft'}>{translateStatus(event.status)}</span>
              </div>
            </div>
            <div class="card-body">
              <div class="card-header"><h3 title={event.title}>{event.title}</h3></div>
              <div class="card-content-area">
                {#if event.description}<p class="event-description-short">{event.description.substring(0, 80)}{event.description.length > 80 ?
                 '...' : ''}</p>{/if}
                <div class="event-simple-meta">
                  <div class="meta-row event-type"><svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg><span class="type-badge" class:single-day={getEventType(event) === 'single'} class:multi-day={getEventType(event) === 'multi'}>{getEventTypeLabel(event)}</span></div>
                  <div class="meta-row"><svg width="14" height="14" fill="none" stroke="currentColor" 
                  viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg><span>{event.location}</span></div>
                  <div class="meta-row"><svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg><span>{formatDateRange(event)}</span></div>
                  {#if event.startTime && event.endTime}<div class="meta-row"><svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><span>{event.startTime} - {event.endTime}</span></div>{/if}
                  
                  {#if getEventHolidayDisplay(event)}
                    <div class="meta-row holiday-row">
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{lang.holidayInfo}: <strong class="highlight-text">{getEventHolidayDisplay(event)}</strong></span>
                    </div>
                  {/if}

                  {#if event.hasRewardProgram}
                    <div class="meta-row reward-row">
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{lang.rewardInfo}: {lang.hasRewards}</span>
                    </div>
                  {/if}
              </div>
              </div>
              {#if event.totalSlots && event.totalSlots > 0}
                <div class="card-bottom-section">
                  <div class="participant-info">
                  <div class="participant-row"><svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg><span class="participant-label">{lang.participants}:</span><span class="participant-value">{event.usedSlots || 0} / {event.totalSlots}</span></div>
                    <div class="progress-bar"><div class="progress-fill" style="width: {getParticipantPercentage(event)}%;"></div></div>
                  </div>
                  {#if event.pendingCount && event.pendingCount > 0}
                    <div class="participant-info pending">
                      <div class="participant-row"><svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><span class="participant-label">{lang.pending}:</span><span class="participant-value">{event.pendingCount}</span></div>
                      <div class="progress-bar"><div class="progress-fill pending" style="width: {getPendingPercentage(event)}%;"></div></div>
                    </div>
                  {/if}
                </div>
              {/if}
              <div class="card-actions-wrapper">
                <div class="action-buttons-full">
                  <button class="action-btn btn-view" on:click={() => handleViewDetails(event)}><svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>{lang.viewDetails}</button>
                  <button class="action-btn btn-edit" on:click|stopPropagation={() => handleEdit(event.id)}><svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>{lang.edit}</button>
                  <button class="action-btn btn-delete" on:click|stopPropagation={() => handleDelete(event.id)}><svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>{lang.delete}</button>
                </div>
              </div>
            </div>
          </div>
        {/each}
      </div>
 
      {#if totalPages > 1}
        <div class="pagination-wrapper">
          <div class="pagination-controls">
            <button class="page-btn" aria-label="Previous page" on:click={prevPage} disabled={currentPage === 1}><svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg></button>
            <div class="page-select-wrapper">
              <button class="page-indicator-box" on:click|stopPropagation={() => (showPageDropdown = !showPageDropdown)}><span class="current-page">{currentPage}</span><span class="sep">/</span><span class="total-page">{totalPages}</span><svg class="dropdown-arrow" class:flipped={showPageDropdown} width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7"></path></svg></button>
              {#if showPageDropdown}<div class="page-dropdown-list">{#each Array(totalPages) as _, i}<button class="page-option" class:active={currentPage === i + 1} on:click={() => jumpToPage(i + 1)}>Page {i + 1}</button>{/each}</div>{/if}
            </div>
            <button class="page-btn" aria-label="Next page" on:click={nextPage} disabled={currentPage === totalPages}><svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg></button>
          </div>
          <div class="page-info">{lang.showing} {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, events.length)} {lang.of} {events.length}</div>
        </div>
      {/if}
    {/if}
  </div>
</div>

{#if showDetailModal && selectedEvent}
      <div class="modal-overlay" role="button" tabindex="0" on:click={closeDetailModal} on:keydown={overlayKeydown}>
    <div class="modal-container detail-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" tabindex="0" on:click|stopPropagation on:keydown|stopPropagation>
      <div class="modal-header"><h2 id="modal-title">{lang.eventDetails}</h2><button class="close-modal-btn" aria-label="Close details" on:click={closeDetailModal}><svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button></div>
      <div class="modal-body">
        {#if detailLoading}
          <div class="loading-state"><svg class="spinner" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10" stroke-width="2" opacity="0.25" /><path d="M12 2a10 10 0 0 1 10 10" stroke-width="2" stroke-linecap="round" /></svg></div>
        {:else}
          {#if selectedEvent.image}
            <div class="detail-image"><img src={selectedEvent.image} alt={selectedEvent.title} on:error={handleImgError} /><div class="image-overlay"><span class="status-badge" class:status-active={selectedEvent.status === 'Active'} class:status-closed={selectedEvent.status === 'Closed'} class:status-draft={selectedEvent.status === 'Draft'}>{translateStatus(selectedEvent.status)}</span></div></div>
          {/if}
        
          <div class="info-section">
            <div class="section-header"><svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><h3>{lang.basicInfo}</h3></div>
            <div class="info-grid"><div class="info-item"><div class="info-label">{lang.title}</div><p>{selectedEvent.title}</p></div><div class="info-item full-width"><div class="info-label">{lang.description}</div><p>{selectedEvent.description || '-'}</p></div><div class="info-item"><div class="info-label">{lang.location}</div><p>{selectedEvent.location}</p></div><div class="info-item"><div class="info-label">{lang.eventType}</div><p>{getEventTypeLabel(selectedEvent)}</p></div>{#if selectedEvent.distanceKm}<div class="info-item"><div class="info-label">{lang.distance}</div><p>{selectedEvent.distanceKm} {lang.km}</p></div>{/if}</div>
          </div>
          <div class="info-section">
            <div class="section-header"><svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg><h3>{lang.dateTime}</h3></div>
            <div class="info-grid"><div class="info-item"><div class="info-label">{lang.startDate}</div><p>{formatDate(selectedEvent.startDate)}</p></div><div class="info-item"><div class="info-label">{lang.endDate}</div><p>{formatDate(selectedEvent.endDate)}</p></div><div class="info-item"><div class="info-label">{lang.startTime}</div><p>{selectedEvent.startTime}</p></div><div class="info-item"><div class="info-label">{lang.endTime}</div><p>{selectedEvent.endTime}</p></div></div>
          </div>
          
          {#if getEventHolidayDisplay(selectedEvent)}
            <div class="info-section">
              <div class="section-header"><svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg><h3>{lang.holidayInfo}</h3></div>
              <div class="info-grid">
                <div class="info-item full-width"><p class="highlight-text large">{getEventHolidayDisplay(selectedEvent)}</p></div>
              </div>
            </div>
          {/if}

          {#if selectedEvent.hasRewardProgram}
            <div class="info-section">
              <div class="section-header"><svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><h3>{lang.rewards}</h3></div>
              {#if selectedEvent.rewards && selectedEvent.rewards.length > 0}
                <div class="rewards-grid">
                  {#each selectedEvent.rewards.slice(0, 10) as user}
                    <div class="reward-card">
                      <div class="reward-rank">#{user.rank || '?'}</div>
                      <div class="reward-info"><p class="reward-name">{user.name}</p>{#if user.tier}<span class="reward-tier tier-{user.tier.toLowerCase()}">{user.tier}</span>{/if}</div>
                    </div>
                  {/each}
                </div>
              {:else}
                 <div class="info-grid"><div class="info-item full-width"><p>{lang.hasRewards}</p></div></div>
              {/if}
            </div>
          {/if}

          <div class="info-section">
            <div class="section-header"><svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg><h3>{lang.participants}</h3></div>
            <div class="stats-cards">
              <div class="stat-card"><div class="stat-icon" style="background: rgba(16, 185, 129, 0.1);"><svg width="24" height="24" fill="none" stroke="#10b981" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div><div class="stat-info"><p class="stat-label">{lang.joined}</p><p class="stat-value">{selectedEvent.usedSlots || 0}</p></div></div>
              <div class="stat-card"><div class="stat-icon" style="background: rgba(59, 130, 246, 0.1);"><svg width="24" height="24" fill="none" stroke="#3b82f6" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg></div><div class="stat-info"><p class="stat-label">{lang.totalSlots}</p><p class="stat-value">{selectedEvent.totalSlots}</p></div></div>
              <div class="stat-card"><div class="stat-icon" style="background: rgba(100, 116, 139, 0.1);"><svg width="24" height="24" fill="none" stroke="#64748b" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"></path></svg></div><div class="stat-info"><p class="stat-label">{lang.available}</p><p class="stat-value">{Math.max(0, selectedEvent.totalSlots - (selectedEvent.usedSlots || 0))}</p></div></div>
            </div>
            <div class="progress-section"><div class="progress-info"><span>{lang.joined}: {selectedEvent.usedSlots || 0} / {selectedEvent.totalSlots}</span><span>{Math.round(getParticipantPercentage(selectedEvent))}%</span></div><div class="progress-bar large"><div class="progress-fill" style="width: {getParticipantPercentage(selectedEvent)}%;"></div></div></div>
          </div>
        {/if}
      </div>
      <div class="modal-footer"><button class="modal-btn btn-secondary" on:click={closeDetailModal}>{lang.close}</button><button class="modal-btn btn-primary" on:click={() => { if (selectedEvent) { closeDetailModal(); handleEdit(selectedEvent.id); } }}><svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>{lang.edit}</button></div>
    </div>
  </div>
{/if}

<style>
/* ... (CSS คงเดิม) ... */
  .events-page { padding: 2rem; max-width: 1400px; margin: 0 auto; min-height: 100vh; height: auto !important; overflow: visible !important; }
  .grid-section { margin-top: 1rem; }
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
  @media (max-width: 1200px) { .grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 768px) { .grid { grid-template-columns: 1fr; } .events-page { padding: 1rem; } }
  .glass-card { background: rgba(30, 41, 55, 0.6); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 20px; overflow: hidden; transition: all 0.3s ease; display: flex; flex-direction: column; height: 100%; }
  .glass-card:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3); border-color: rgba(16, 185, 129, 0.3); }
  .card-img-wrapper { width: 100%; height: 200px; overflow: hidden; position: relative; background: #1e293b; }
  .card-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease; }
  .glass-card:hover .card-img { transform: scale(1.05); }
  .status-badge-overlay { position: absolute; top: 0.75rem; right: 0.75rem; z-index: 10; }
  .status-badge { padding: 0.3rem 0.8rem; border-radius: 20px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; backdrop-filter: blur(10px); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3); }
  .status-active { background: rgba(16, 185, 129, 0.95); color: white; border: 1px solid #10b981; }
  .status-closed { background: rgba(239, 68, 68, 0.95); color: white; border: 1px solid #ef4444; }
  .status-draft { background: rgba(148, 163, 184, 0.95); color: white; border: 1px solid #94a3b8; }
  .card-body { padding: 1.25rem; display: flex; flex-direction: column; flex: 1; }
  .card-content-area { flex: 1; display: flex; flex-direction: column; padding-bottom: 1.5rem; gap: 0.5rem; }
  .card-header h3 { font-size: 1.1rem; font-weight: 700; color: #f8fafc; margin: 0 0 0.75rem 0; line-height: 1.3; }
  .event-description-short { color: #94a3b8; font-size: 0.875rem; line-height: 1.5; margin: 0 0 1rem 0; }
  .event-simple-meta { display: flex; flex-direction: column; gap: 0.5rem; }
  .meta-row { display: flex; align-items: center; gap: 0.5rem; color: #cbd5e1; font-size: 0.85rem; }
  .meta-row svg { color: #10b981; flex-shrink: 0; }
  .meta-row.reward-row { color: #fbbf24; font-weight: 600; }
  .meta-row.reward-row svg { color: #fbbf24; }
  /* ✅ CSS สำหรับแถววันหยุด */
  .meta-row.holiday-row { color: #10b981; }
  .meta-row.holiday-row svg { color: #10b981; }
  .highlight-text { color: #f8fafc; font-weight: 700; margin-left: 0.25rem; }
  .highlight-text.large { font-size: 1.25rem; }

  .type-badge { padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; }
  .type-badge.single-day { background: rgba(59, 130, 246, 0.15); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.3); }
  .type-badge.multi-day { background: rgba(168, 85, 247, 0.15); color: #a855f7; border: 1px solid rgba(168, 85, 247, 0.3); }
  .card-bottom-section { margin-top: auto; padding-top: 1rem; border-top: 1px solid rgba(255, 255, 255, 0.08); display: flex; flex-direction: column; gap: 0.75rem; }
  .participant-info { background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.15); border-radius: 10px; padding: 0.75rem; }
  .participant-info.pending { background: rgba(245, 158, 11, 0.05); border-color: rgba(245, 158, 11, 0.15); }
  .participant-row { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; font-size: 0.85rem; }
  .participant-row svg { color: #10b981; flex-shrink: 0; }
  .participant-info.pending .participant-row svg { color: #f59e0b; }
  .participant-label { color: #94a3b8; }
  .participant-value { color: #f8fafc; font-weight: 600; margin-left: auto; }
  .progress-bar { width: 100%; height: 6px; background: rgba(255, 255, 255, 0.05); border-radius: 10px; overflow: hidden; }
  .progress-fill { height: 100%; background: linear-gradient(90deg, #10b981, #059669); transition: width 0.3s ease; border-radius: 10px; }
  .progress-fill.pending { background: linear-gradient(90deg, #f59e0b, #d97706); }
  .card-actions-wrapper { margin-top: 1rem; }
  .action-buttons-full { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 0.5rem; }
  .action-btn { padding: 0.625rem 1rem; border-radius: 10px; font-size: 0.875rem; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 0.5rem; border: none; cursor: pointer; transition: all 0.2s; }
  .btn-view { background: linear-gradient(135deg, #10b981, #059669); color: white; }
  .btn-view:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); }
  .btn-edit { background: rgba(59, 130, 246, 0.1); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.3); }
  .btn-edit:hover { background: #3b82f6; color: white; }
  .btn-delete { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); }
  .btn-delete:hover { background: #ef4444; color: white; }
  .skeleton-card { pointer-events: none; }
  .skeleton-img { background: linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%); background-size: 200% 100%; animation: loading 1.5s ease-in-out infinite; }
  .skeleton-line { height: 12px; background: linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%); background-size: 200% 100%; animation: loading 1.5s ease-in-out infinite; border-radius: 6px; margin-bottom: 0.5rem; }
  .skeleton-title { height: 16px; width: 70%; }
  .skeleton-desc { width: 100%; }
  @keyframes loading { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
  .empty-state { text-align: center; padding: 4rem 2rem; color: #64748b; }
  .empty-state svg { margin: 0 auto 1rem; opacity: 0.5; }
  .pagination-wrapper { margin-top: 2rem; display: flex; flex-direction: column; align-items: center; gap: 1rem; }
  .pagination-controls { display: flex; align-items: center; gap: 1rem; }
  .page-btn { background: rgba(30, 41, 55, 0.6); border: 1px solid rgba(255, 255, 255, 0.1); color: #f8fafc; width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
  .page-btn:hover:not(:disabled) { background: #10b981; border-color: #10b981; }
  .page-btn:disabled { opacity: 0.3; cursor: not-allowed; }
  .page-select-wrapper { position: relative; }
  .page-indicator-box { background: rgba(30, 41, 55, 0.6); border: 1px solid rgba(255, 255, 255, 0.1); padding: 0.5rem 1rem; border-radius: 10px; display: flex; align-items: center; gap: 0.5rem; color: #f8fafc; font-weight: 600; cursor: pointer; }
  .dropdown-arrow { transition: transform 0.2s; }
  .dropdown-arrow.flipped { transform: rotate(180deg); }
  .page-dropdown-list { position: absolute; top: calc(100% + 8px); left: 0; right: 0; background: rgba(30, 41, 55, 0.98); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 10px; max-height: 200px; overflow-y: auto; z-index: 100; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5); }
  .page-option { width: 100%; background: transparent; border: none; color: #cbd5e1; padding: 0.625rem 1rem; text-align: left; cursor: pointer; transition: all 0.2s; }
  .page-option:hover { background: rgba(16, 185, 129, 0.1); color: #10b981; }
  .page-option.active { background: rgba(16, 185, 129, 0.2); color: #10b981; font-weight: 600; }
  .page-info { text-align: center; color: #94a3b8; font-size: 0.875rem; }
  
  /* Modal CSS */
  .modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.8); backdrop-filter: blur(8px); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 1rem; animation: fadeIn 0.2s ease; }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  .modal-container { background: #1e293b; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 20px; width: 100%; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5); animation: slideUp 0.3s ease; }
  .modal-container.detail-modal { max-width: 900px; }
  @keyframes slideUp { from { transform: translateY(50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  .modal-header { padding: 1.5rem; border-bottom: 1px solid rgba(255, 255, 255, 0.1); display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
  .modal-header h2 { font-size: 1.5rem; font-weight: 700; color: #f8fafc; margin: 0; flex: 1; }
  .close-modal-btn { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); color: #ef4444; width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; flex-shrink: 0; }
  .close-modal-btn:hover { background: #ef4444; color: white; }
  .modal-body { padding: 1.5rem; overflow-y: auto; flex: 1; scrollbar-width: none; -ms-overflow-style: none; }
  .modal-body::-webkit-scrollbar { display: none; }
  .loading-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem 2rem; color: #64748b; }
  .spinner { animation: spin 1s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .detail-image { width: 100%; height: 300px; border-radius: 12px; overflow: hidden; margin-bottom: 1.5rem; position: relative; }
  .detail-image img { width: 100%; height: 100%; object-fit: cover; }
  .image-overlay { position: absolute; top: 1rem; right: 1rem; }
  .info-section { background: rgba(15, 23, 42, 0.4); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 12px; padding: 1.25rem; margin-bottom: 1.5rem; }
  .section-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; padding-bottom: 0.75rem; border-bottom: 1px solid rgba(255, 255, 255, 0.08); }
  .section-header svg { color: #10b981; flex-shrink: 0; }
  .section-header h3 { font-size: 1.1rem; font-weight: 700; color: #f8fafc; margin: 0; }
  .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
  .info-item { display: flex; flex-direction: column; gap: 0.25rem; }
  .info-item.full-width { grid-column: 1 / -1; }
  .info-label { font-size: 0.75rem; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
  .info-item p { font-size: 0.95rem; color: #f8fafc; margin: 0; line-height: 1.6; }
  .stats-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1rem; }
  .stat-card { display: flex; align-items: center; gap: 0.75rem; padding: 1rem; background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 10px; }
  .stat-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .stat-info { flex: 1; }
  .stat-label { font-size: 0.75rem; color: #94a3b8; margin: 0 0 0.25rem 0; }
  .stat-value { font-size: 1.35rem; font-weight: 700; color: #f8fafc; margin: 0; }
  .progress-section { padding: 1rem; background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.15); border-radius: 10px; }
  .progress-info { display: flex; justify-content: space-between; margin-bottom: 0.75rem; font-size: 0.875rem; color: #cbd5e1; font-weight: 600; }
  .progress-bar.large { height: 10px; }
  .rewards-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
  .reward-card { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 10px; }
  .reward-rank { width: 36px; height: 36px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 700; color: white; font-size: 0.875rem; flex-shrink: 0; }
  .reward-info { flex: 1; display: flex; flex-direction: column; gap: 0.25rem; }
  .reward-name { font-size: 0.875rem; color: #f8fafc; font-weight: 600; margin: 0; }
  .reward-tier { font-size: 0.75rem; font-weight: 600; padding: 0.125rem 0.5rem; border-radius: 6px; display: inline-block; width: fit-content; }
  .tier-gold { background: rgba(251, 191, 36, 0.2); color: #fbbf24; }
  .tier-silver { background: rgba(192, 192, 192, 0.2); color: #c0c0c0; }
  .tier-bronze { background: rgba(205, 127, 50, 0.2); color: #cd7f32; }
  .tier-green { background: rgba(16, 185, 129, 0.2); color: #10b981; }
  .modal-footer { padding: 1.5rem; border-top: 1px solid rgba(255, 255, 255, 0.1); display: flex; gap: 0.75rem; justify-content: flex-end; flex-shrink: 0; }
  .modal-btn { padding: 0.75rem 1.5rem; border-radius: 10px; font-size: 0.875rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; border: none; cursor: pointer; transition: all 0.2s; }
  .btn-secondary { background: rgba(148, 163, 184, 0.1); color: #94a3b8; border: 1px solid rgba(148, 163, 184, 0.3); }
  .btn-secondary:hover { background: #475569; color: white; }
  .btn-primary { background: linear-gradient(135deg, #10b981, #059669); color: white; }
  .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); }
  @media (max-width: 768px) {
    .action-buttons-full { grid-template-columns: 1fr; }
    .info-grid { grid-template-columns: 1fr; }
    .stats-cards { grid-template-columns: 1fr; }
    .rewards-grid { grid-template-columns: 1fr; }
    .modal-footer { flex-direction: column; }
    .modal-btn { width: 100%; justify-content: center; }
  }

  /* Truncate long event titles in the card view to a single line with ellipsis */
  .card-header h3 {
    margin: 0 0 0.75rem 0;
    font-size: 1.1rem;
    font-weight: 700;
    line-height: 1.2;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>