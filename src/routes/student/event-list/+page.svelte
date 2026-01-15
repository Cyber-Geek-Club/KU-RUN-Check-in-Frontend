<script lang="ts">
  import { fade, slide, scale, fly } from "svelte/transition";
  import { goto } from "$app/navigation";
  import { auth } from "$lib/utils/auth";
  import { onMount, onDestroy } from "svelte";
  import Swal from "sweetalert2";
  import { lazyLoadBg } from "$lib/utils/lazyLoad";
  import { resolveImageUrl, API_BASE_URL } from "$lib/utils/imageUtils";
  import { ROUTES } from "$lib/utils/routes";
  import { navigateToMyEvents } from "$lib/utils/navigation";


  
  // =========================================
  // 1. CONFIGURATION & INTERFACES
  // =========================================
  const BASE_URL = API_BASE_URL;

  interface EventItem {
    id: number;
    title: string;
    description: string;
    location: string;
    distance_km: number;
    banner_image_url: string;
    participant_count: number;
    max_participants: number;
    is_full: boolean;
    is_active: boolean;
    is_published: boolean;
    startDate: string;
    endDate: string;
    end_time: string;  // [NEW] เวลาสิ้นสุด
    isJoined: boolean;
    isJoinedToday: boolean;  // [NEW] ตรวจสอบว่าสมัครของวันนี้หรือไม่
    participationId: number | null;
    participationStatus: string | null;
    participationDate: string | null;  // [NEW] วันที่สมัคร
    isExpanded: boolean;
    isUpcoming: boolean;  // [NEW] เช็คว่าเป็นวันในอนาคตหรือไม่
    canRegisterToday: boolean;  // [NEW] เช็คว่าสามารถสมัครได้วันนี้หรือไม่
    completionCount: number;  // [NEW] จำนวน COMPLETED ของกิจกรรมนี้
    hasCancelledRecord: boolean;  // [NEW] มี record ที่ CANCELLED หรือไม่
    // [NEW] Single Day / Multi Day fields
    event_type: 'single_day' | 'multi_day';
    allow_daily_checkin: boolean;
    max_checkins_per_user: number | null;
    checkin_count: number;  // จำนวนครั้งที่ check-in แล้ว
  }

  // Interface สำหรับการแจ้งเตือนรางวัล
  interface RewardNotification {
      id: number;
      title: string;
      message: string;
      date: string;
      isRead: boolean;
      type: 'reward' | 'system';
  }

  // =========================================
  // 2. STATE VARIABLES
  // =========================================
  
  // Layout State
  let isMobileMenuOpen = $state(false);
  let currentView = $state("event-list");
  let isLoading = $state(true);

  // Language State
  let lang: 'th' | 'en' = $state('th');

  // Search & Data State
  let searchQuery = $state("");
  let events: EventItem[] = $state([]);

  // Session & Timer State
  let timeLeftStr = $state("--:--:--");
  let timeLeftSeconds = $state(0);
  let timerInterval: ReturnType<typeof setInterval> | null = null;
  // Adaptive polling via setTimeout loop (better control vs setInterval)
  let pollTimeout: ReturnType<typeof setTimeout> | null = null;
  let currentPollDelay = 15000; // 15s base polling for status refresh
  let isUpdatingStatus = false;
  let eventsController: AbortController | null = null;
  let statusController: AbortController | null = null;
  let sessionExpiredAlertShown = false;



  // Modal State
  let showUploadModal = $state(false);
  let showCancelModal = $state(false);
  let selectedEvent: EventItem | null = $state(null);
  let eventToCancel: EventItem | null = $state(null);
  
  // Upload State
  let proofImage: string | null = $state(null);
  let proofFile: File | null = null;

  // Cancel Reason State
  let selectedCancelReason = $state("");
  let otherCancelReason = $state("");
  const cancelReasons = [
    "ติดธุระด่วน / Urgent matter",
    "ปัญหาสุขภาพ / Health issue",
    "สภาพอากาศ / Weather condition",
    "การเดินทาง / Transportation",
    "อื่นๆ / Other"
  ];

  const menuItems = [
    { id: "event-list", label: "Event list", path: ROUTES.student.eventList, svg: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" },
    { id: "my-event", label: "My event", path: ROUTES.student.myEvents, svg: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
    { id: "account-setting", label: "Account setting", path: ROUTES.student.settings, svg: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
  ];

  // =========================================
  // 3. TRANSLATION & LANGUAGE LOGIC
  // =========================================
  const t = {
    th: {
      search_placeholder: "ค้นหา...",
      status_active: "เปิดรับสมัคร",
      status_non_active: "ไม่รับสมัคร",
      status_not_open: "ยังไม่เปิด",
      status_full: "เต็ม",
      status_joined: "เข้าร่วมแล้ว",
      status_resubmit: "ส่งใหม่",
      status_pending: "รอตรวจสอบ",
      status_completed: "สำเร็จ",
      status_cancelled: "ยกเลิกแล้ว",
      status_ended: "จบแล้ว",

      btn_register: "ลงทะเบียน",
      btn_cancel: "ยกเลิก",
      btn_joined: "เข้าร่วมแล้ว",
      btn_read_more: "ดูรายละเอียด",
      btn_read_less: "ย่อลง",
      btn_send_proof: "ส่งหลักฐาน",
      btn_resubmit: "ส่งหลักฐานใหม่",

      upload_title: "อัปโหลดหลักฐาน",
      upload_desc: "กรุณาอัปโหลดสลิปหรือผลการวิ่ง",
      upload_btn: "ยืนยันการส่ง",
      upload_rejected: "⚠️ หลักฐานถูกตีกลับ กรุณาส่งใหม่",

      cancel_title: "ยกเลิกกิจกรรม",
      cancel_desc: "โปรดระบุเหตุผลที่คุณต้องการยกเลิก",
      cancel_confirm: "ยืนยันการยกเลิก",
      reason_placeholder: "ระบุเหตุผลอื่นๆ...",

      alert_success: "สำเร็จ",
      alert_cancel_success: "ยกเลิกเรียบร้อยแล้ว",

      // Inbox translations
      inbox_title: "รางวัลและการแจ้งเตือน",
      inbox_empty: "ไม่มีรายการแจ้งเตือน",
      mark_all_read: "อ่านทั้งหมด",

      // Event Type translations
      event_type_single: "วันเดียว",
      event_type_multi: "หลายวัน",
      event_type_challenge: "ท้าทาย",
      daily_checkin: "เช็คอินรายวัน",
      checkin_progress: "ความคืบหน้า",
      days_remaining: "วันที่เหลือ",
      day_unit: "วัน",
      participants: "ผู้เข้าร่วม"
    },
    en: {
      search_placeholder: "Search...",
      status_active: "ACTIVE",
      status_non_active: "NOT OPEN",
      status_not_open: "NOT OPEN",
      status_full: "FULL",
      status_joined: "JOINED",
      status_resubmit: "RESUBMIT",
      status_pending: "PENDING",
      status_completed: "COMPLETED",
      status_cancelled: "CANCELLED",
      status_ended: "ENDED",

      btn_register: "REGISTRATION",
      btn_cancel: "CANCEL",
      btn_joined: "JOINED",
      btn_read_more: "Read more",
      btn_read_less: "Read less",
      btn_send_proof: "SEND PROOF",
      btn_resubmit: "RESUBMIT PROOF",

      upload_title: "Upload Proof",
      upload_desc: "Please upload your slip or result.",
      upload_btn: "SUBMIT PROOF",
      upload_rejected: "⚠️ Proof rejected. Please resubmit.",

      cancel_title: "Cancel Participation",
      cancel_desc: "Please specify your reason for cancellation.",
      cancel_confirm: "CONFIRM CANCEL",
      reason_placeholder: "Specify other reason...",

      alert_success: "Success",
      alert_cancel_success: "Cancelled successfully",

      // Inbox translations
      inbox_title: "Rewards & Notifications",
      inbox_empty: "No notifications",
      mark_all_read: "Mark all read",

      // Event Type translations
      event_type_single: "Single Day",
      event_type_multi: "Multi Day",
      event_type_challenge: "Challenge",
      daily_checkin: "Daily Check-in",
      checkin_progress: "Progress",
      days_remaining: "Days Left",
      day_unit: "days",
      participants: "Participants"
    }
  };

  function setLang(l: 'th' | 'en') {
    lang = l;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('app_lang', l);
    }
  }

  // =========================================
  // 4. LIFECYCLE HOOKS
  // =========================================
  let onVisibility: (() => void) | null = null;
  let onOffline: (() => void) | null = null;
  let onOnline: (() => void) | null = null;

  onMount(async () => {
    if (typeof localStorage !== 'undefined') {
      const savedLang = localStorage.getItem('app_lang') as 'th' | 'en';
      if (savedLang) lang = savedLang;
    }
    startSessionTimer();
    await fetchEvents();
    startPolling();

    // Pause/resume polling on tab visibility
    onVisibility = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        startPolling();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    // Pause polling when offline, resume when online
    onOffline = () => stopPolling();
    onOnline = () => startPolling();
    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);
  });

  onDestroy(() => {
    if (timerInterval) clearInterval(timerInterval);
    stopPolling();
    if (onVisibility) document.removeEventListener('visibilitychange', onVisibility);
    if (onOffline) window.removeEventListener('offline', onOffline);
    if (onOnline) window.removeEventListener('online', onOnline);
  });

  function startPolling() {
    if (pollTimeout) return;
    const loop = async () => {
      pollTimeout = null; // clear handle before running
      await updateUserStatus();
      pollTimeout = setTimeout(loop, currentPollDelay);
    };
    pollTimeout = setTimeout(loop, currentPollDelay);
  }

  function stopPolling() {
    if (pollTimeout) {
      clearTimeout(pollTimeout);
      pollTimeout = null;
    }
  }

  // =========================================
  // 5. DATA FETCHING & PROCESSING
  // =========================================
  async function fetchEvents() {
    try {
      // Abort previous events request if still in-flight
      if (eventsController) {
        eventsController.abort();
      }
      eventsController = new AbortController();

      const token = getToken();
      const response = await fetch(`${BASE_URL}/api/events/`, {
        method: "GET",
        headers: { "Content-Type": "application/json", ...(token ? { "Authorization": `Bearer ${token}` } : {}) },
        signal: eventsController.signal
      });
      if (response.status === 401) { handleSessionExpired(); return; }
      if (!response.ok) throw new Error(`Server Error: ${response.status}`);
      
      const apiData = await response.json();
      
      // --- [แก้ไขจุดที่ 1] รับข้อมูลดิบมาเลย ไม่ต้องกรองวันที่ทิ้ง ---
      // เปลี่ยนจาก validDateEvents เป็น apiData ตรงๆ
      const now = new Date();
      const newEvents = apiData
        .filter((item: any) => {
          // [FIX] Filter: ไม่แสดงกิจกรรมที่เลยเวลาสิ้นสุดแล้ว (รวมเวลาด้วย)
          if (item.event_end_date && item.end_time) {
            // สร้าง datetime โดยใช้ event_end_date + end_time
            const endDateTime = new Date(`${item.event_end_date}T${item.end_time}`);
            if (now > endDateTime) return false;
          } else if (item.event_end_date) {
            // Fallback: ถ้าไม่มี end_time ให้เช็คแค่วันจบเท่านั้น
            const endDate = new Date(item.event_end_date);
            endDate.setHours(23, 59, 59, 999);
            if (now > endDate) return false;
          }
          return true;
        })
        .map((item: any) => {
          const existing = events.find(e => e.id === item.id);
          return {
            id: item.id,
            title: item.title,
            description: item.description,
            location: item.location,
            distance_km: item.distance_km,
            banner_image_url: resolveImageUrl(item.banner_image_url) || "", // แก้ให้รองรับรูปว่าง + รองรับ path แบบ relative
            participant_count: item.participant_count,
            max_participants: item.max_participants,
            is_active: item.is_active !== undefined ? item.is_active : true,
            is_published: item.is_published !== undefined ? item.is_published : true,
            is_full: item.is_full || (item.participant_count >= item.max_participants),
            startDate: item.event_date,
            endDate: item.event_end_date,
            end_time: item.end_time || "",
            isJoined: existing ? existing.isJoined : false,
            isJoinedToday: existing ? existing.isJoinedToday : false,
            participationId: existing ? existing.participationId : null,
            participationStatus: existing ? existing.participationStatus : null,
            participationDate: existing ? existing.participationDate : null,
            isExpanded: existing ? existing.isExpanded : false,
            isUpcoming: existing ? existing.isUpcoming : false,
            canRegisterToday: existing ? existing.canRegisterToday : false,

            // [NEW] Single Day / Multi Day fields
            event_type: (item.event_type === 'multi_day' ? 'multi_day' : 'single_day'),
            allow_daily_checkin: Boolean(item.allow_daily_checkin),
            max_checkins_per_user:
              typeof item.max_checkins_per_user === 'number'
                ? item.max_checkins_per_user
                : item.max_checkins_per_user
                  ? Number(item.max_checkins_per_user)
                  : null,
            checkin_count: existing ? existing.checkin_count : 0,
            completionCount: existing ? existing.completionCount : 0,
          };
        });

      events = newEvents;
      await updateUserStatus();
      fetchUniqueParticipantCounts(); // ดึงจำนวนผู้เข้าร่วมที่ไม่ซ้ำ
    } catch (error: any) {
      console.error("Error loading events:", error);
    } finally {
      isLoading = false;
    }
  }

  // ===== Fetch unique participant counts for all events =====
  async function fetchUniqueParticipantCounts() {
    const token = getToken();
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    // Fetch unique counts in parallel (batch of 5)
    const BATCH_SIZE = 5;
    const eventsCopy = [...events];
    
    for (let i = 0; i < eventsCopy.length; i += BATCH_SIZE) {
      const batch = eventsCopy.slice(i, i + BATCH_SIZE);
      
      const results = await Promise.allSettled(
        batch.map(async (event) => {
          try {
            const res = await fetch(
              `${BASE_URL}/api/events/${event.id}/participants`,
              { headers }
            );

            if (!res.ok) {
              return { eventId: event.id, uniqueCount: event.participant_count || 0 };
            }

            const data = await res.json();
            let participants: any[] = [];
            if (Array.isArray(data)) {
              participants = data;
            } else if (data?.participants) {
              participants = data.participants;
            } else if (data?.data) {
              participants = data.data;
            }

            // Deduplicate by user_id
            const uniqueUserIds = new Set<number>();
            participants.forEach((p: any) => {
              const userId = p.user_id || p.id;
              if (userId) uniqueUserIds.add(userId);
            });

            return { eventId: event.id, uniqueCount: uniqueUserIds.size };
          } catch (err) {
            return { eventId: event.id, uniqueCount: event.participant_count || 0 };
          }
        })
      );

      // Update events with results
      results.forEach((result) => {
        if (result.status === "fulfilled") {
          const { eventId, uniqueCount } = result.value;
          const eventIndex = events.findIndex((e) => e.id === eventId);
          if (eventIndex !== -1) {
            events[eventIndex].participant_count = uniqueCount;
          }
        }
      });
    }

    // Force reactivity update
    events = [...events];
  }

  async function updateUserStatus() {
    try {
      if (isUpdatingStatus) return; // prevent concurrent runs
      isUpdatingStatus = true;

      // Abort previous status request if still in-flight
      if (statusController) {
        statusController.abort();
      }
      statusController = new AbortController();

      const token = getToken();
      const userInfoStr = localStorage.getItem("user_info") || localStorage.getItem("user");
      if (!token || !userInfoStr) return;

      let userId;
      try {
        const userInfo = JSON.parse(userInfoStr);
        userId = userInfo.id || userInfo.user_id;
      } catch (e) { return; }

      // 1. ดึงข้อมูลประวัติ (History) พร้อม cache-busting
      const cacheBuster = Date.now();
      const res = await fetch(`${BASE_URL}/api/participations/user/${userId}?_=${cacheBuster}`, {
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache"
        },
        signal: statusController.signal
      });

      if (res.ok) {
        let myData = await res.json();
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        // ตัดการดึงข้อมูลทั้งหมดของทุกคน (ป้องกัน 404 และลดภาระ)

        // Map ข้อมูลลง UI ตามปกติ
        events = events.map(e => {
          const myRecords = myData.filter((item: any) => Number(item.event_id) === e.id);

          const myCompletedCheckins = myRecords.reduce((count: number, record: any) => {
            const s = record?.status ? String(record.status).toUpperCase() : "";
            if (s === 'CANCELLED' || s === 'CANCEL') return count;
            return s === 'COMPLETED' ? count + 1 : count;
          }, 0);
          
          // ใช้จำนวนจากข้อมูลกิจกรรมที่มีอยู่ในหน้า (ไม่ดึงรวมทั้งหมด)
          const actualParticipantCount = e.participant_count;
          
          // [NEW LOGIC] หา participation record ใดๆ ที่ไม่ใช่ CANCELLED
          // สำหรับ rule "สมัครได้ครั้งเดียว"
          let anyActiveRecord = null;
          let hasCancelledRecord = false;
          
          for (const record of myRecords) {
            const s = record.status ? record.status.toUpperCase() : "";
            
            // เช็คว่ามี CANCELLED record หรือไม่
            if (s === 'CANCELLED' || s === 'CANCEL') {
              hasCancelledRecord = true;
              console.log(`[Event ${e.id}] Skipping CANCELLED record:`, record.id);
              continue;
            }
            
            // เก็บ active record (ล่าสุด ไม่ใช่ CANCELLED)
            if (!anyActiveRecord || record.id > anyActiveRecord.id) {
              anyActiveRecord = record;
            }
          }

          // [SIMPLIFIED] ถ้ามี record ที่ไม่ใช่ CANCELLED → ถือว่าสมัครแล้ว (ไม่ว่าจะวันไหน)
          const finalRecord = anyActiveRecord;
          const isJoined = !!finalRecord;
          
          // [FIX] สำหรับ multi-day events - เช็คว่า join ไปวันนี้แล้วหรือยัง
          let isJoinedToday = false;
          if (e.event_type === 'multi_day' && myRecords.length > 0) {
            const serverNow = new Date();
            serverNow.setHours(0, 0, 0, 0);
            const todayStr = serverNow.toISOString().split('T')[0];
            
            console.log(`[Event ${e.id}] Checking isJoinedToday - Today (server): ${todayStr}`);
            
            // เช็คว่ามี record ที่ถูกสร้างในวันนี้หรือไม่
            isJoinedToday = myRecords.some((record: any) => {
              const s = record.status ? record.status.toUpperCase() : "";
              if (s === 'CANCELLED' || s === 'CANCEL') return false;
              
              const recordDate = record.created_at || record.date;
              if (recordDate) {
                const recordDateOnly = new Date(recordDate).toISOString().split('T')[0];
                console.log(`  - Record ${record.id}: date=${recordDateOnly}, status=${s}, match=${recordDateOnly === todayStr}`);
                return recordDateOnly === todayStr;
              }
              return false;
            });
          }
          
          if (finalRecord) {
            console.log(`[Event ${e.id}] Active record found:`, finalRecord.id, finalRecord.status, `isJoinedToday: ${isJoinedToday}`);
            if (finalRecord.created_at) {
              console.log(`  - Record date: ${new Date(finalRecord.created_at).toISOString()}`);
            }
          } else {
            console.log(`[Event ${e.id}] No active record - can register`);
          }

          return {
            ...e,
            isJoined,
            isJoinedToday,
            participationId: finalRecord ? Number(finalRecord.id) : null,
            participationStatus: finalRecord ? finalRecord.status.toUpperCase() : null,
            participationDate: finalRecord ? (finalRecord.created_at || finalRecord.date) : null,
            isUpcoming: e.startDate ? new Date(e.startDate) > now : false,
            canRegisterToday: e.is_active && e.is_published && !isJoined && !e.is_full,
            participant_count: actualParticipantCount,
            completionCount: e.completionCount,  // คงค่าเดิมไว้
            checkin_count: myCompletedCheckins,
            hasCancelledRecord: !isJoined && hasCancelledRecord,  // มี CANCELLED และยังไม่ได้สมัครใหม่
          };
        });
      }

      // Reset polling delay to base on success
      currentPollDelay = 15000;

    } catch (err: any) { 
      // Increase delay on errors to reduce server pressure (exponential-ish backoff)
      currentPollDelay = Math.min(currentPollDelay * 2, 60000); // cap at 60s
      console.error("updateUserStatus error:", err);
    } finally {
      isUpdatingStatus = false;
    }
  }

  function canRegisterTodayCheck(event: EventItem): boolean {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    
    const startDate = new Date(event.startDate);
    startDate.setHours(0, 0, 0, 0);
    
    // วันนี้ต้องเป็นวันที่สามารถสมัครได้ (อยู่ในช่วง start-end)
    const endDate = event.endDate ? new Date(event.endDate) : startDate;
    endDate.setHours(23, 59, 59, 999);
    
    const isTodayInRange = today >= startDate && today <= endDate;
    
    // เช็คว่า event active และ published และไม่เต็ม
    if (!isTodayInRange || !event.is_active || !event.is_published || event.is_full) {
      return false;
    }
    
    // แยก logic ตาม event_type
    if (event.event_type === 'multi_day') {
      // Multi-day: เช็คจากจำนวน checkins แทนการเช็ควันที่
      if (event.max_checkins_per_user && event.max_checkins_per_user > 0) {
        // ถ้ามี max กำหนด เช็คจากจำนวนครั้งที่เช็คอินไปแล้ว
        const canJoinMore = (event.checkin_count || 0) < event.max_checkins_per_user;
        console.log(`[Event ${event.id}] Multi-day check: ${event.checkin_count}/${event.max_checkins_per_user} -> canJoin: ${canJoinMore}`);
        return canJoinMore && !event.isJoinedToday; // และต้องไม่ได้ join วันนี้ไปแล้ว
      }
      // Fallback: เช็ควันที่
      return !event.isJoinedToday;
    } else {
      // Single-day: ลงทะเบียนได้ครั้งเดียวเท่านั้น
      return !event.isJoined;
    }
  }
  
  // [NEW HELPER] เช็คว่ากิจกรรมนี้ยังไม่เปิดให้สมัคร (วันนี้ยังไม่ถึงวันเริ่ม)
  function isUpcomingTomorrow(event: EventItem): boolean {
    // ถ้ากิจกรรม is_active = true → ถือว่าเปิดรับสมัครแล้ว (ไม่ต้องเช็ควันที่)
    if (event.is_active && event.is_published) {
      return false;
    }
    
    // Fallback: เช็ควันที่
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    
    if (!event.startDate) return false;
    
    const startDate = new Date(event.startDate);
    startDate.setHours(0, 0, 0, 0);
    
    // ถ้ากิจกรรมมี endDate และวันนี้อยู่ในช่วง startDate - endDate ก็ถือว่าเปิดแล้ว
    if (event.endDate) {
      const endDate = new Date(event.endDate);
      endDate.setHours(23, 59, 59, 999);
      
      // ถ้าวันนี้อยู่ในช่วง → ไม่ใช่ upcoming
      if (today >= startDate && now <= endDate) {
        return false;
      }
    }
    
    // วันนี้ยังไม่ถึงวันเริ่ม
    return startDate > today;
  }

  // =========================================
  // 6. USER ACTIONS (Register, Cancel, Upload)
  // =========================================

  // --- Register Action ---
  let isRegistering = $state(false);
  async function handleRegister(eventItem: EventItem) {
    // ป้องกันการกดซ้ำ
    if (isRegistering) return;

    // [RULE] จำกัดสมัครได้ครั้งเดียวต่อกิจกรรม
    if (eventItem.isJoined) {
      Swal.fire({
        icon: 'info',
        title: lang === 'th' ? 'สมัครได้ครั้งเดียว' : 'One-time Registration',
        text: lang === 'th'
          ? 'คุณได้สมัครกิจกรรมนี้ไปแล้ว ไม่สามารถสมัครซ้ำได้'
          : 'You have already registered for this event and cannot register again.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#3b82f6'
      }).then(() => {
        navigateToMyEvents('student');
      });
      return;
    }

    // [NEW] ตรวจสอบว่าเป็นวันถัดไปหรือไม่
    if (isUpcomingTomorrow(eventItem)) {
      Swal.fire({
        icon: 'info',
        title: lang === 'th' ? 'รอเปิด' : 'Coming Soon',
        text: lang === 'th' 
          ? `สามารถสมัครได้เมื่อถึง ${getDisplayDate(eventItem.startDate, '', lang)}`
          : `Registration opens on ${getDisplayDate(eventItem.startDate, '', lang)}`,
        confirmButtonText: 'OK'
      });
      return;
    }

    // [NEW] ตรวจสอบว่าเป็นเวลากิจกรรมหรือไม่ (เลยเวลาแล้ว)
    const now = new Date();
    if (eventItem.endDate) {
      const endDate = new Date(eventItem.endDate);
      endDate.setHours(23, 59, 59, 999);
      
      if (now > endDate) {
        Swal.fire({
          icon: 'warning',
          title: lang === 'th' ? 'หมดเวลา' : 'Registration Closed',
          text: lang === 'th' ? 'กิจกรรมนี้หมดเวลาแล้ว' : 'This event has ended',
          confirmButtonText: 'OK'
        });
        return;
      }
    }

    // เช็คสถานะ Active เบื้องต้น
    if (!eventItem.is_active) {
      Swal.fire("Unavailable", t[lang].status_not_open, "warning");
      return;
    }

    // ตั้งสถานะกำลังสมัครทันทีเพื่อกันการเปิดหลายครั้ง
    isRegistering = true;

    // [NEW] ตรวจสอบประเภท Event และใช้ API ที่เหมาะสม
    const isMultiDay = eventItem.event_type === 'multi_day';
    
    // แสดง Modal ยืนยัน
    const result = await Swal.fire({
      title: isMultiDay 
        ? (lang === 'th' ? 'ยืนยันการลงทะเบียน?' : 'Confirm Registration?')
        : (lang === 'th' ? 'ยืนยันการสมัครวันนี้?' : 'Confirm Daily Registration?'),
      text: isMultiDay
        ? (lang === 'th' 
            ? `ต้องการลงทะเบียนกิจกรรม "${eventItem.title}" ใช่หรือไม่?\n(ระบบจะสร้างรหัสให้อัตโนมัติทุกวัน)`
            : `Register for "${eventItem.title}"?\n(System will auto-generate daily codes)`)
        : (lang === 'th' 
            ? `ต้องการเข้าร่วม "${eventItem.title}" วันนี้ใช่หรือไม่\n(ต้องทำให้จบในวันนี้)`
            : `Join "${eventItem.title}" today?\n(Must complete today)`),
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: t[lang].btn_register,
      cancelButtonText: t[lang].btn_cancel,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#d33'
    });

    if (result.isConfirmed) {
      try {
        const token = getToken();
        if (!token) {
          handleSessionExpired();
          isRegistering = false;
          return;
        }

        // [NEW] เลือก API ตามประเภท Event
        if (isMultiDay) {
          // Multi-day: ใช้ Pre-register API
          await performPreRegister(eventItem, token);
        } else {
          // Single-day: ใช้ Join API เดิม
          await performJoin(`${BASE_URL}/api/participations/join`, eventItem, token);
        }

      } catch (err: any) { 
        console.error("Register Error:", err);
        Swal.fire("Error", "Connection Error", "error");
      } finally {
        isRegistering = false;
      }
    } else {
      // ยกเลิก
      isRegistering = false;
    }
  }

  // [NEW] ฟังก์ชันสำหรับ Pre-register (Multi-day events)
  async function performPreRegister(eventItem: EventItem, token: string) {
    const preRegRes = await fetch(`${BASE_URL}/api/participations/pre-register/${eventItem.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    });

    if (preRegRes.status === 401) {
      handleSessionExpired();
      return;
    }

    if (preRegRes.ok) {
      const data = await preRegRes.json();
      console.log('[PRE-REGISTER SUCCESS]', data);

      eventItem.isJoined = true;
      eventItem.isJoinedToday = true;
      eventItem.participationStatus = 'JOINED';
      events = [...events];

      Swal.fire({
        icon: 'success',
        title: lang === 'th' ? 'ลงทะเบียนสำเร็จ!' : 'Registration Successful!',
        html: `
          <p>${lang === 'th' ? 'รหัสวันนี้' : 'Today\'s Code'}: <strong style="font-size:1.5em;color:#10b981">${data.first_code}</strong></p>
          <p style="color:#666;font-size:0.9em">${lang === 'th' ? 'ระบบจะสร้างรหัสใหม่ให้อัตโนมัติทุกวัน' : 'New codes will be generated daily'}</p>
          <p style="color:#666;font-size:0.85em">${lang === 'th' ? 'กิจกรรมจบวันที่' : 'Event ends'}: ${data.event_end_date}</p>
        `,
        confirmButtonText: 'OK',
        confirmButtonColor: '#10b981'
      });

      await updateUserStatus();
    } else {
      const contentType = preRegRes.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const errorData = await preRegRes.json();
        Swal.fire({
          icon: 'error',
          title: lang === 'th' ? 'เกิดข้อผิดพลาด' : 'Error',
          text: errorData.detail || "Error",
          confirmButtonText: 'OK'
        });
      } else {
        Swal.fire("Error", "Server Error", "error");
      }
    }
  }

  // แยก Logic การยิง API ออกมาเป็นฟังก์ชันย่อย เพื่อลดโค้ดซ้ำ (Single-day)
  async function performJoin(endpoint: string, eventItem: EventItem, token: string) {
      const joinRes = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ event_id: eventItem.id }),
      });

      if (joinRes.status === 401) {
          handleSessionExpired();
          return;
      }

      if (joinRes.ok) {
          // ✅ สำเร็จ - Backend reactivates cancelled records automatically
          const responseData = await joinRes.json();
          const wasReactivated = responseData.id && eventItem.participationId === responseData.id;
          
          console.log('[JOIN SUCCESS]', {
              participationId: responseData.id,
              wasReactivated,
              joinCode: responseData.join_code
          });
          
          eventItem.isJoined = true;
          eventItem.isJoinedToday = true;
          eventItem.participationId = responseData.id || null;
          eventItem.participationStatus = 'JOINED';
          events = [...events];
          
          Swal.fire({
              icon: 'success',
              title: wasReactivated 
                  ? (lang === 'th' ? 'สมัครใหม่สำเร็จ!' : 'Re-registered!')
                  : t[lang].alert_success,
              text: `${lang === 'th' ? 'รหัสเข้าร่วม' : 'Join Code'}: ${responseData.join_code}`,
              timer: 2000,
              showConfirmButton: true
          });
          await updateUserStatus();  // Refresh full state from server
      } else {
          // ❌ Error handling
          const contentType = joinRes.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
              const errorData = await joinRes.json();
              const errorMsg = errorData.detail || "Error";
              
              // Handle specific error cases
              if (errorMsg.includes('คุณได้สมัครกิจกรรมนี้แล้ว')) {
                  // Already joined - refresh to show correct state
                  await updateUserStatus();
                  Swal.fire({
                      icon: 'info',
                      title: lang === 'th' ? 'แจ้งเตือน' : 'Notice',
                      text: errorMsg,
                      confirmButtonText: 'OK'
                  });
              } else {
                  Swal.fire({
                      icon: 'error',
                      title: lang === 'th' ? 'เกิดข้อผิดพลาด' : 'Error',
                      text: errorMsg,
                      confirmButtonText: 'OK'
                  });
              }
          } else {
              const errorText = await joinRes.text();
              console.warn("Non-JSON API Response:", errorText);
              Swal.fire("Failed", "Server Error", "error");
          }
      }
  }

  interface DailyLimitCheck {
  can_register: boolean;
  reason: string;
  today_registration: any | null;
  total_checkins: number;
}

  // [NEW] Cancel participation when completionCount = 0
  async function handleDirectCancel(event: EventItem) {
    // ไม่อนุญาตยกเลิกหากมีการเช็คอิน/ทำสำเร็จแล้วของผู้ใช้เอง
    if (event.checkin_count > 0) {
      Swal.fire({ 
        icon: 'info', 
        title: lang === 'th' ? 'ไม่สามารถยกเลิก' : 'Cannot Cancel', 
        text: lang === 'th' ? 'ยกเลิกได้เฉพาะกิจกรรมที่ยังไม่มีการเช็คอิน/ทำสำเร็จ' : 'Can cancel only when you have 0 check-ins/completions',
        confirmButtonColor: '#3b82f6' 
      });
      return;
    }

    const result = await Swal.fire({
      title: lang === 'th' ? 'ยกเลิกกิจกรรม?' : 'Cancel Event?',
      text: lang === 'th' 
        ? `ต้องการยกเลิก "${event.title}" ใช่หรือไม่`
        : `Cancel "${event.title}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: t[lang].btn_cancel,
      cancelButtonText: 'No',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280'
    });

    if (result.isConfirmed) {
      try {
        const token = getToken();
        if (!token) { handleSessionExpired(); return; }
        if (!event.participationId) return;

        const res = await fetch(`${BASE_URL}/api/participations/${event.participationId}/cancel`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ cancellation_reason: "User cancelled (no completions)" })
        });
        
        if (res.ok) {
          event.isJoined = false;
          event.isJoinedToday = false;
          event.participationId = null;
          event.participationStatus = null;
          event.participant_count = Math.max(0, event.participant_count - 1);
          events = [...events];
          
          Swal.fire({ 
            icon: 'success', 
            title: t[lang].alert_cancel_success, 
            timer: 1500, 
            showConfirmButton: false 
          });
          await updateUserStatus();
        } else {
          const err = await res.json();
          Swal.fire("Failed", err.detail || "Error", "error");
        }
      } catch (err) { 
        Swal.fire("Error", "Connection Error", "error"); 
      }
    }
  }

  // --- Cancel Action ---
  function openCancelModal(event: EventItem) {
    eventToCancel = event;
    selectedCancelReason = "";
    otherCancelReason = "";
    showCancelModal = true;
  }

  function closeCancelModal() {
    showCancelModal = false;
    eventToCancel = null;
  }

  async function confirmCancellation() {
    if (!eventToCancel) return;

    let finalReason = selectedCancelReason;
    
    // เช็คกรณีเลือก "อื่นๆ" แต่ไม่พิมพ์อะไรมา
    if (selectedCancelReason.includes("Other") || selectedCancelReason.includes("อื่นๆ")) {
      if (!otherCancelReason.trim()) {
        Swal.fire({ 
          icon: 'warning', 
          // แก้ข้อความให้เหมือนกัน
          title: lang === 'th' ? 'ยังไม่ได้ระบุสาเหตุการยกเลิกกิจกรรม' : 'Reason not specified', 
          text: lang === 'th' ? 'กรุณาระบุรายละเอียดเพิ่มเติม' : 'Please provide more details',
          confirmButtonColor: '#f59e0b' 
        });
        return;
      }
      finalReason = otherCancelReason;
    }

    try {
      const token = getToken();
      if (!token) { handleSessionExpired(); return; }
      if (!eventToCancel.participationId) { 
        await updateUserStatus();
        if (!eventToCancel.participationId) return; 
      }

      const res = await fetch(`${BASE_URL}/api/participations/${eventToCancel.participationId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ cancellation_reason: finalReason })
      });
      if (res.ok) {
        eventToCancel.isJoined = false;
        eventToCancel.participationId = null;
        eventToCancel.participationStatus = null;
        eventToCancel.participant_count = Math.max(0, eventToCancel.participant_count - 1);
        events = [...events];
        Swal.fire({ icon: 'success', title: t[lang].alert_cancel_success, timer: 1500, showConfirmButton: false });
        closeCancelModal();
      } else {
        const err = await res.json();
        Swal.fire("Failed", err.detail || "Error", "error");
      }
    } catch (err) { Swal.fire("Error", "Connection Error", "error"); }
  }

  // --- Upload Action ---
  function openUploadModal(event: EventItem) {
    selectedEvent = event;
    proofImage = null;
    proofFile = null;
    showUploadModal = true;
  }

  function closeUploadModal() {
    showUploadModal = false;
    selectedEvent = null;
  }

  function handleImageSelect(e: Event) {
    const target = e.target as HTMLInputElement;
    if (target.files && target.files[0]) {
      proofFile = target.files[0];
      const reader = new FileReader();
      reader.onload = (evt) => { proofImage = evt.target?.result as string; };
      reader.readAsDataURL(target.files[0]);
    }
  }

  async function submitProof() {
    if (!selectedEvent || !proofFile) return;
    try {
      // API Upload implementation placeholder
      Swal.fire({ icon: 'success', title: t[lang].alert_success, timer: 2000, showConfirmButton: false });
      selectedEvent.participationStatus = 'proof_submitted';
      events = [...events];
      closeUploadModal();
    } catch (error) {
      Swal.fire("Error", "Failed", "error");
    }
  }

  // =========================================
  // 7. HELPER FUNCTIONS & FORMATTERS
  // =========================================
  function startSessionTimer() {
    if (timerInterval) clearInterval(timerInterval);
    const token = getToken();
    if (!token) { timeLeftStr = "00:00:00"; return; }
    try {
      const payloadBase64 = token.split('.')[1];
      const payload = JSON.parse(atob(payloadBase64));
      const expTime = payload.exp * 1000;
      updateTimerDisplay(expTime);
      timerInterval = setInterval(() => { updateTimerDisplay(expTime); }, 1000);
    } catch (e) { }
  }

  function updateTimerDisplay(expTime: number) {
    const now = Date.now();
    const diff = expTime - now;
    if (diff <= 0) {
      if (timerInterval) clearInterval(timerInterval);
      timeLeftStr = "00:00:00";
      handleSessionExpired();
    } else {
      const totalSeconds = Math.floor(diff / 1000);
      const h = Math.floor(totalSeconds / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      const s = totalSeconds % 60;
      timeLeftStr = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
  }

  function getToken() {
    if (typeof localStorage === 'undefined') return "";
    // [FIX] Use consistent access_token key only
    const token = localStorage.getItem("access_token") || "";
    if (!token) {
      console.warn("No access token found in localStorage");
    }
    return token;
  }

  async function handleSessionExpired() {
    if (sessionExpiredAlertShown) return;
    sessionExpiredAlertShown = true;
    
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
    
    auth.logout();
    if (timerInterval) clearInterval(timerInterval);
    if (pollTimeout) { clearTimeout(pollTimeout); pollTimeout = null; }
    await Swal.fire({ icon: 'error', title: 'Session Expired', text: 'Expired', timer: 3000, showConfirmButton: false, allowOutsideClick: false });
    window.location.href = "/auth/login";
  }

  function formatDate(startStr: string, endStr: string, currentLang: string) {
    if (!startStr) return "-";
    const locale = currentLang === 'th' ? 'th-TH' : 'en-GB';
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' , timeZone: 'Asia/Bangkok'};

    const startDate = new Date(startStr);
    const startText = startDate.toLocaleDateString(locale, options);

    if (!endStr) return startText;
    
    const endDate = new Date(endStr);
    const endText = endDate.toLocaleDateString(locale, options);

    // [FIX] เทียบจากข้อความที่จะโชว์ตรงๆ เลย
    // ถ้าข้อความเหมือนกัน (เช่น "11 มกราคม 2569" เหมือนกัน) ให้ส่งกลับแค่อันเดียว
    if (startText === endText) {
        return startText;
    }

    return `${startText} - ${endText}`;
  }

  function formatTime(start: string, end: string, currentLang: string) {
    if (!start) return "-";
    
    // [FIX] แปลง UTC time จาก server เป็น Bangkok time (+7 hours)
    const s = new Date(start);
    const e = end ? new Date(end) : null;
    
    // ใช้ toLocaleTimeString กับ timezone Bangkok
    const options: Intl.DateTimeFormatOptions = { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false,
      timeZone: 'Asia/Bangkok'
    };
    
    const timeStart = s.toLocaleTimeString('en-GB', options);
    const timeEnd = e ? e.toLocaleTimeString('en-GB', options) : "";

    if (currentLang === 'th') {
      return e ? `${timeStart} - ${timeEnd} น.` : `${timeStart} น.`;
    } else {
      return e ? `${timeStart} - ${timeEnd}` : `${timeStart}`;
    }
  }

  // [NEW] Helper function เพื่อแสดงวันที่ในกรณีต่างๆ
  function getDisplayDate(startStr: string, endStr: string = '', lang: string = 'th'): string {
    if (!startStr) return "-";
    const locale = lang === 'th' ? 'th-TH' : 'en-GB';
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Bangkok' };
    
    const startDate = new Date(startStr);
    const startText = startDate.toLocaleDateString(locale, options);
    
    if (!endStr) return startText;
    
    const endDate = new Date(endStr);
    const endText = endDate.toLocaleDateString(locale, options);
    
    if (startText === endText) {
      return startText;
    }
    
    return `${startText} - ${endText}`;
  }

  function parseSafeDate(dateStr: string | null | undefined): Date | null {
    if (!dateStr) return null;
    
    const d = new Date(dateStr);
    
    // ถ้าแปลงแล้วเป็น Invalid Date (เช่น format แปลกๆ) ให้ return null
    if (isNaN(d.getTime())) return null;

    // แก้ปี พ.ศ. (25xx) ให้เป็น ค.ศ. (20xx)
    if (d.getFullYear() > 2400) {
      d.setFullYear(d.getFullYear() - 543);
    }
    
    return d;
  }

  function toggleDetails(index: number) {
    const targetId = filteredEvents[index].id;
    const realIndex = events.findIndex(e => e.id === targetId);
    if (realIndex !== -1) {
      events[realIndex].isExpanded = !events[realIndex].isExpanded;
      events = [...events];
    }
  }

  function selectView(id: string, path: string) {
    currentView = id;
    isMobileMenuOpen = false;
    goto(path);
  }

  function handleLogout() {
    isMobileMenuOpen = false;
    
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
    
    auth.logout();
    window.location.href = "/auth/login";
  }

  // Debounce search to reduce frequent recomputation
  let debouncedQuery = $state("");
  let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  
  $effect(() => {
    if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      debouncedQuery = searchQuery.toLowerCase().trim();
    }, 250);
  });

  let filteredEvents = $derived(events.filter(event => {
    // [NEW] เงื่อนไขเวลา: ต้องยังไม่เลยช่วงเวลา (Not Expired)
    // ดึงไปแล้วในฟังก์ชัน fetchEvents เลย ดังนั้นควรจะไม่มีเหตุการณ์ที่เลยวันแล้ว
    // แต่เราเช็คตรงนี้เพิ่มเติมเพื่อความปลอดภัย
    if (event.endDate) {
        const now = new Date();
        const end = new Date(event.endDate);
        end.setHours(23, 59, 59, 999);
        // ถ้าเวลาปัจจุบัน เลยเวลาจบกิจกรรมไปแล้ว -> ไม่แสดง
        if (now > end) return false;
    }

    // [RULE] จำกัดสมัครได้ครั้งเดียวต่อกิจกรรม: ถ้าเคยสมัครแล้วและไม่ใช่การสมัครของวันนี้ → ไม่แสดง
    if (event.isJoined && !event.isJoinedToday) {
      return false;
    }

    // --- Search Query Logic (คงเดิม) ---
    const query = debouncedQuery;
    if (!query) return true;
    
    return (
      event.title.toLowerCase().includes(query) ||
      event.location.toLowerCase().includes(query) ||
      event.description.toLowerCase().includes(query)
    );
  }));
</script>

<div class="app-container">
  
  <header class="header-bar">
    <div class="header-inner">
      <div class="left-group">
        <div class="brand"><span class="brand-name">STUDENT</span></div>
        <nav class="nav-menu desktop-only">
          {#each menuItems as item}
            <button class="menu-btn" class:active={currentView === item.id} onclick={() => selectView(item.id, item.path)}>
              <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d={item.svg}></path></svg>
              <span class="btn-label">{item.label}</span>
            </button>
          {/each}
        </nav>
      </div>

      <div class="search-bar-container desktop-only">
        <div class="search-input-wrapper">
          <svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          <input type="text" placeholder={t[lang].search_placeholder} class="search-input" bind:value={searchQuery} />
        </div>
      </div>

      <div class="user-zone">
        <div class="timer-pill">
          {timeLeftStr}
        </div>

        <div class="lang-switch desktop-only">
          <button class:active={lang === 'th'} onclick={() => setLang('th')}>TH</button>
          <span class="sep">|</span>
          <button class:active={lang === 'en'} onclick={() => setLang('en')}>EN</button>
        </div>

        <button class="logout-btn desktop-only" aria-label="Logout" onclick={handleLogout}><svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg></button>
        <button class="mobile-toggle mobile-only" aria-label="Toggle menu" onclick={() => (isMobileMenuOpen = !isMobileMenuOpen)}><svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 9h16M4 15h16"></path></svg></button>
      </div>
    </div>
  </header>

  {#if isMobileMenuOpen}
    <div class="mobile-overlay" role="button" tabindex="0" aria-label="Close menu" onclick={() => (isMobileMenuOpen = false)} onkeydown={(e) => { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') { isMobileMenuOpen = false; } }} transition:fade={{ duration: 200 }}></div>
    <div class="mobile-drawer" transition:slide={{ axis: 'x', duration: 300 }}>
      <div class="drawer-header"><span class="brand-name" style="font-size: 1.4rem;">MENU</span><button class="close-btn" onclick={() => (isMobileMenuOpen = false)}>&times;</button></div>
      <div class="drawer-search"><input type="text" placeholder="Search..." class="drawer-search-input" bind:value={searchQuery} /></div>
      <div class="drawer-content">
        {#each menuItems as item}
          <button class="drawer-item" class:active={currentView === item.id} onclick={() => selectView(item.id, item.path)}>
            <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="margin-right: 10px;">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={item.svg}></path>
            </svg>
            {item.label}
          </button>
        {/each}

        <div class="drawer-lang-item">
          <div class="lang-label-group">
            <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="margin-right: 10px;">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"></path>
            </svg>
            <span>Language</span>
          </div>
          <div class="lang-toggle-pill">
            <button class:active={lang === 'th'} onclick={() => setLang('th')}>TH</button>
            <button class:active={lang === 'en'} onclick={() => setLang('en')}>EN</button>
          </div>
        </div>
      </div>
      <button class="drawer-item logout-special" onclick={handleLogout}>Logout</button>
    </div>
  {/if}

  <div class="scroll-container">
    <div class="content-wrapper">

      <div class="page-header">
        <h2 class="section-title">Event List</h2>
        <div class="title-underline"></div>
      </div>

      {#if isLoading}
        <div class="loading-container">
          <div class="spinner"></div>
          <p>Loading...</p>
        </div>
      {:else}
        {#if filteredEvents.length === 0}
          <div class="no-events">
            <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="opacity: 0.5; margin-bottom: 10px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            <p>No events found</p>
          </div>
        {:else}
          <div class="events-grid">
            {#each filteredEvents as event, i}
              <div class="event-card">
                <div class="card-image" use:lazyLoadBg={event.banner_image_url}></div>
                <div class="card-content">

                  <div class="card-header-row">
                    <h3 class="card-title">{event.title}</h3>
                    <div class="badges-col">
                      {#if !event.is_published}
                        <span class="status-badge no-active">
                             {#if lang === 'th'}
                                ไม่รับสมัคร <span style="font-size: 0.8em; opacity: 0.8;"></span>
                             {:else}
                                NOT OPEN <span style="font-size: 0.8em; opacity: 0.8;"></span>
                             {/if}
                        </span>
                      {:else if !event.is_active}
                        <span class="status-badge no-active">{t[lang].status_not_open}</span>
                      {:else if event.participationStatus === 'CHECKED_IN'}
                        <span class="status-badge pending">{t[lang].status_pending}</span>
                      {:else}
                        <span class="status-badge">{t[lang].status_active}</span>
                      {/if}

                      <div class="type-badges">
                        <span class="type-badge" class:multi={event.event_type === 'multi_day'}>
                          {event.event_type === 'multi_day' ? t[lang].event_type_multi : t[lang].event_type_single}
                        </span>
                        {#if event.event_type === 'multi_day' && event.allow_daily_checkin}
                          <span class="type-badge daily">{t[lang].daily_checkin}</span>
                        {/if}
                      </div>
                      <div class="count-badge">
                        <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="margin-right:4px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                        {event.participant_count}/{event.max_participants} {t[lang].participants}
                      </div>
                    </div>
                  </div>

                  <p class="card-desc" class:expanded={event.isExpanded}>{event.description}</p>

                  {#if event.isExpanded}
                    <div transition:slide|local={{ duration: 300 }}>
                      <div class="info-pills">
                        <div class="info-pill">
                          <svg class="pill-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                          <span>{event.location}</span>
                        </div>
                        <div class="info-pill">
                          <svg class="pill-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                          <span>{formatDate(event.startDate, event.endDate, lang)}</span>
                        </div>
                        <div class="info-pill">
                          <svg class="pill-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                          <span>{formatTime(event.startDate, event.endDate, lang)}</span>
                        </div>
                        <div class="info-pill highlight-pill">
                          <svg class="pill-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                          <span>{event.distance_km} KM</span>
                        </div>

                        {#if event.event_type === 'multi_day' && event.allow_daily_checkin}
                          <div class="info-pill progress-pill">
                            <svg class="pill-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <span>
                              {t[lang].checkin_progress}: {event.checkin_count}/{event.max_checkins_per_user ?? '-'} {t[lang].day_unit}
                            </span>
                          </div>
                        {/if}
                      </div>
                      <div class="card-separator"></div>
                    </div>
                  {/if}

                  <div class="card-footer-actions">
                    <button class="view-btn" onclick={() => toggleDetails(i)}>
                      {event.isExpanded ? t[lang].btn_read_less : t[lang].btn_read_more}
                    </button>

                    <div class="footer-actions">
                      {#if event.isJoined}
                        <button class="register-btn running" onclick={() => navigateToMyEvents('student')}>
                          {lang === 'th' ? '✅ สมัครแล้ว' : '✅ Registered'}
                        </button>

                      {:else if !event.is_published}
                        <button class="register-btn unpublished" disabled>
                          {#if lang === 'th'}
                            ไม่รับสมัคร <span style="font-size: 0.8em; opacity: 0.9;"></span>
                          {:else}
                            NOT APPLY <span style="font-size: 0.8em; opacity: 0.9;"></span>
                          {/if}
                        </button>

                      {:else if !event.is_active}
                        <button class="register-btn no-active" disabled>{t[lang].status_not_open}</button>

                      {:else if event.is_full}
                        <button class="register-btn full" disabled>{t[lang].status_full}</button>

                      {:else if isUpcomingTomorrow(event)}
                        <button class="register-btn coming-soon" disabled>
                          {lang === 'th' ? '⏳ รอเปิด' : '⏳ Coming Soon'}
                        </button>

                      {:else}
                        <button class="register-btn" disabled={isRegistering} onclick={() => handleRegister(event)}>
                          {#if event.hasCancelledRecord}
                            {lang === 'th' ? '🔄 สมัครใหม่อีกครั้ง' : '🔄 Register Again'}
                          {:else}
                            {lang === 'th' ? '📝 สมัคร' : '📝 Register'}
                          {/if}
                        </button>
                      {/if}

                      {#if event.isJoined && event.checkin_count === 0}
                        <button class="cancel-direct-btn" onclick={() => openCancelModal(event)}>
                          {lang === 'th' ? '❌ ยกเลิก' : '❌ Cancel'}
                        </button>
                      {/if}
                    </div>
                  </div>

                </div>
              </div>
            {/each}
          </div>
        {/if}
      {/if}

      <footer class="app-footer">
        <div class="footer-separator"></div>
        <div class="footer-content">
          <p class="copyright">&copy; 2025 Cyber Geek. All rights reserved.</p>
          <p class="credits">Designed & Developed by <span class="highlight">Cyber Geek Development</span></p>
          <p class="contact">Contact: <a href="mailto:cybergeek.dev@proton.me">cybergeek.dev@proton.me</a></p>
        </div>
      </footer>
    </div>
  </div>
  {#if showUploadModal}
    <div class="modal-overlay" transition:fade={{ duration: 200 }}>
      <div class="modal-box" transition:scale={{ duration: 250, start: 0.9 }}>
        <button class="modal-close" onclick={closeUploadModal}>&times;</button>
        <div class="modal-body">
          <h3 class="modal-title">{t[lang].upload_title}</h3>
          {#if selectedEvent?.participationStatus === 'REJECTED'}
            <p class="error-text">{t[lang].upload_rejected}</p>
          {:else}
            <p class="modal-subtitle">{t[lang].upload_desc}</p>
          {/if}
          <div class="upload-area">
            {#if !proofImage}
              <label class="upload-label">
                <input type="file" accept="image/*" onchange={handleImageSelect} hidden />
                <div class="upload-placeholder"><span>Click to Upload Image</span></div>
              </label>
            {:else}
              <div class="image-preview">
                <img src={proofImage} alt="Proof" />
                <button class="remove-img-btn" onclick={() => { proofImage = null; proofFile = null; }}>&times;</button>
              </div>
            {/if}
          </div>
          <button class="action-submit-btn purple-theme" disabled={!proofImage} onclick={submitProof}>
            {t[lang].upload_btn}
          </button>
        </div>
      </div>
    </div>
  {/if}

  {#if showCancelModal}
    <div class="modal-overlay" transition:fade={{ duration: 200 }}>
      <div class="modal-box" transition:scale={{ duration: 250, start: 0.9 }}>
        <button class="modal-close" onclick={closeCancelModal}>&times;</button>
        <div class="modal-body">
          <h3 class="modal-title" style="color: #ef4444;">{t[lang].cancel_title}</h3>
          <p class="modal-subtitle">{t[lang].cancel_desc}</p>
          <div class="cancel-options">
            {#each cancelReasons as reason}
              <label class="radio-item">
                <input type="radio" bind:group={selectedCancelReason} value={reason} />
                <span class="radio-label">{reason}</span>
              </label>
            {/each}
          </div>
          {#if selectedCancelReason.includes("อื่นๆ") || selectedCancelReason.includes("Other")}
            <div class="reason-input" transition:slide>
              <textarea placeholder={t[lang].reason_placeholder} bind:value={otherCancelReason} rows="3"></textarea>
            </div>
          {/if}
          <div class="action-row">
            <button 
              class="action-submit-btn cancel-confirm-btn" 
              onclick={confirmCancellation}
              disabled={
                !selectedCancelReason || 
                ((selectedCancelReason.includes("Other") || selectedCancelReason.includes("อื่นๆ")) && !otherCancelReason.trim())
              }
            >
              {t[lang].cancel_confirm}
            </button>
          </div>
        </div>
      </div>
    </div>
  {/if}

</div>

<style>
  @import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap");
  /* =========================================
     1. GLOBAL SETTINGS & VARIABLES
     ========================================= */
  :root {
    --bg-body: #0f172a;
    --bg-nav: #1e293b;
    --bg-card: #1e293b;
    --primary: #10b981;
    --text-main: #f8fafc;
    --text-muted: #94a3b8;
    --nav-height: 72px;
  }

  :global(body) { margin: 0; padding: 0; background-color: var(--bg-body); font-family: "Inter", sans-serif; overflow-y: auto; z-index: 10000 !important; }

  .app-container { min-height: 100vh; background-color: var(--bg-body); color: var(--text-main); display: flex; flex-direction: column; }
  .scroll-container { margin-top: calc(var(--nav-height) + 40px); padding-bottom: 40px; overflow: visible; }
  .content-wrapper { max-width: 1400px; margin: 0 auto; padding: 0 24px; }

  /* =========================================
     2. HEADER & NAVIGATION
     ========================================= */
  .header-bar { width: 100%; height: var(--nav-height); background-color: var(--bg-nav); position: fixed; top: 0; left: 0; z-index: 1000; border-bottom: 1px solid rgba(255, 255, 255, 0.05); box-shadow: 0 4px 20px rgba(0,0,0,0.2); }
  .header-inner { width: 100%; height: 100%; display: flex; align-items: center; justify-content: space-between; padding: 0 16px; box-sizing: border-box; }
  
  .left-group { display: flex; align-items: center; gap: 40px; flex: 1; overflow: hidden; }
  .brand-name { font-size: 2rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; background: linear-gradient(135deg, #6ee7b7 0%, #10b981 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; cursor: default; white-space: nowrap; margin-right: 10px; text-shadow: 0 0 10px rgba(16, 185, 129, 0.4), 0 0 20px rgba(16, 185, 129, 0.2); }

  .nav-menu { display: flex; gap: 8px; white-space: nowrap; }
  .menu-btn { background: transparent; border: none; padding: 10px 14px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 8px; font-family: 'Inter', sans-serif; font-size: 0.9rem; font-weight: 600; color: var(--text-muted); transition: all 0.2s ease; }
  .nav-icon { width: 18px; height: 18px; opacity: 0.7; transition: 0.2s; }
  .menu-btn:hover { color: var(--text-main); background-color: rgba(255, 255, 255, 0.03); } 
  .menu-btn:hover .nav-icon { opacity: 1; }
  .menu-btn.active { background-color: #0f172a; color: #10b981; box-shadow: 0 0 0 1px rgba(16, 185, 129, 0.1); } 
  .menu-btn.active .nav-icon { opacity: 1; stroke: #10b981; }

  .user-zone { display: flex; align-items: center; gap: 16px; margin-left: auto; flex-shrink: 0; }
  
  .timer-pill { background-color: #0f172a; color: #10b981; font-weight: 700; font-size: 0.95rem; padding: 6px 12px; border-radius: 6px; border: 1px solid rgba(16, 185, 129, 0.2); letter-spacing: 1px; white-space: nowrap; display: flex; align-items: center; gap: 8px; }

  .logout-btn { background: transparent; border: none; color: var(--text-muted); cursor: pointer; padding: 8px; transition: 0.2s; display: flex; align-items: center; }
  .logout-btn:hover { color: #ef4444; transform: translateX(2px); }

  .search-bar-container { flex: 1; display: flex; justify-content: center; max-width: 250px; margin: 0 20px; }
  .search-input-wrapper { position: relative; width: 100%; display: flex; align-items: center; }
  .search-input { width: 100%; background: #0f172a; border: 1px solid rgba(255,255,255,0.1); color: var(--text-main); padding: 8px 16px 8px 36px; border-radius: 8px; font-size: 0.85rem; outline: none; transition: all 0.2s; }
  .search-input:focus { border-color: var(--primary); box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2); }
  .search-icon { position: absolute; left: 10px; width: 16px; height: 16px; color: var(--text-muted); }

  /* --- Mobile Drawer --- */
  .mobile-toggle { display: none; background: transparent; border: none; color: white; padding: 6px; border-radius: 6px; cursor: pointer; }
  @media (min-width: 1025px) { .left-group { gap: 15px; } }
  @media (max-width: 1024px) { 
    .desktop-only { display: none !important; } 
    .mobile-toggle { display: block !important; } 
    .header-inner { padding: 0 12px; } 
    .left-group { gap: 10px; } 
    .brand-name { font-size: 1.5rem; } 
    .search-bar-container { display: none; } 
  }

  .mobile-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.7); z-index: 2000; backdrop-filter: blur(2px); }
  .mobile-drawer { position: fixed; top: 0; right: 0; bottom: 0; width: 70vw; max-width: 280px; background: var(--bg-nav); z-index: 2001; padding: 20px; display: flex; flex-direction: column; box-shadow: -5px 0 20px rgba(0, 0, 0, 0.5); }
  .drawer-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); }
  .close-btn { background: none; border: none; color: white; font-size: 1.5rem; cursor: pointer; }
  
  .drawer-search { margin-bottom: 15px; }
  .drawer-search-input { width: 100%; background: #0f172a; border: 1px solid rgba(255,255,255,0.1); color: var(--text-main); padding: 10px; border-radius: 8px; font-size: 0.9rem; outline: none; box-sizing: border-box; }
  
  .drawer-content { flex: 1; display: flex; flex-direction: column; gap: 10px; }
  .drawer-item { background: transparent; border: none; color: var(--text-muted); text-align: left; padding: 12px 16px; font-size: 1rem; font-weight: 600; display: flex; align-items: center; gap: 12px; border-radius: 8px; cursor: pointer; transition: all 0.2s ease; }
  .drawer-item.active { background-color: #0f172a; color: #10b981; border: 1px solid rgba(255, 255, 255, 0.05); } 
  .drawer-item.active .nav-icon { opacity: 1; stroke: #10b981; }
  .logout-special { color: #ef4444; margin-top: auto; border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 20px; }

  /* --- Desktop Language Switcher --- */
  .lang-switch { display: flex; align-items: center; background: rgba(255, 255, 255, 0.05); padding: 4px 10px; border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.1); margin-right: 12px; }
  .lang-switch button { background: none; border: none; color: #64748b; font-size: 0.8rem; font-weight: 700; cursor: pointer; padding: 4px; transition: 0.2s; }
  .lang-switch button.active { color: #10b981; text-shadow: 0 0 10px rgba(16, 185, 129, 0.3); }
  .lang-switch .sep { color: #334155; font-size: 0.8rem; margin: 0 4px; }

  /* =========================================
     3. EVENT CARDS & LAYOUT
     ========================================= */
  .page-header { margin-bottom: 30px; }
  .section-title { font-size: 2rem; font-weight: 700; color: var(--text-main); margin: 0 0 8px 0; }
  .title-underline { width: 40px; height: 4px; background-color: var(--primary); border-radius: 2px; }

  .events-grid { display: grid; gap: 24px; grid-template-columns: 1fr; align-items: flex-start; }
  @media (min-width: 768px) { .events-grid { grid-template-columns: repeat(3, 1fr); } }
  @media (min-width: 1200px) { .events-grid { grid-template-columns: repeat(4, 1fr); } }

  .event-card { background: linear-gradient(145deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95)); border-radius: 18px; overflow: hidden; display: flex; flex-direction: column; border: 1px solid rgba(16, 185, 129, 0.1); box-shadow: 0 12px 24px -4px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.03); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
  .event-card:hover { transform: translateY(-6px); box-shadow: 0 24px 36px -6px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(16, 185, 129, 0.2); border-color: rgba(16, 185, 129, 0.25); }
  
  .card-image { height: 180px; background-size: cover; background-position: center; border-bottom: 1px solid rgba(255, 255, 255, 0.05); background-color: #1e293b; transition: opacity 0.3s ease; position: relative; }
  .card-image::before { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, transparent 50%, rgba(59, 130, 246, 0.08) 100%); opacity: 0; transition: opacity 0.3s; }
  .card-image:not(.lazy-loaded)::before { opacity: 1; }
  .card-image:not(.lazy-loaded)::after { content: '📷'; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 2.5rem; opacity: 0.25; }
  .card-image:not(.lazy-loaded) { opacity: 0.6; }
  .card-content { padding: 20px; flex: 1; display: flex; flex-direction: column; }
  
  .card-header-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; gap: 10px; }
  .card-title { font-size: 1.35rem; font-weight: 800; background: linear-gradient(135deg, #ffffff, #e0e7ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin: 0; line-height: 1.4; flex: 1; word-break: break-word; letter-spacing: 0.02em; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }
  
  .badges-col { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; flex-shrink: 0; }
  .status-badge { font-size: 0.7rem; font-weight: 700; background: linear-gradient(135deg, rgba(251, 146, 60, 0.2), rgba(251, 146, 60, 0.3)); color: #fb923c; border: 2px solid #fb923c; padding: 5px 12px; border-radius: 16px; letter-spacing: 0.5px; box-shadow: 0 2px 8px rgba(251, 146, 60, 0.25); }
  .status-badge.no-active { background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.3)); color: #ef4444; border-color: #ef4444; box-shadow: 0 2px 8px rgba(239, 68, 68, 0.25); }
  .status-badge.pending { background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(245, 158, 11, 0.3)); color: #f59e0b; border-color: #f59e0b; box-shadow: 0 2px 8px rgba(245, 158, 11, 0.25); }

  .type-badges { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
  .type-badge { font-size: 0.7rem; font-weight: 700; background: linear-gradient(135deg, rgba(56, 189, 248, 0.15), rgba(56, 189, 248, 0.25)); color: #38bdf8; border: 2px solid rgba(56, 189, 248, 0.5); padding: 4px 10px; border-radius: 14px; letter-spacing: 0.4px; box-shadow: 0 2px 6px rgba(56, 189, 248, 0.2); }
  .type-badge.multi { background: linear-gradient(135deg, rgba(167, 139, 250, 0.15), rgba(167, 139, 250, 0.25)); color: #a78bfa; border-color: rgba(167, 139, 250, 0.5); box-shadow: 0 2px 6px rgba(167, 139, 250, 0.2); }
  .type-badge.daily { background: linear-gradient(135deg, rgba(52, 211, 153, 0.15), rgba(52, 211, 153, 0.25)); color: #34d399; border-color: rgba(52, 211, 153, 0.5); box-shadow: 0 2px 6px rgba(52, 211, 153, 0.2); }

  .info-pill.progress-pill { background: linear-gradient(135deg, rgba(52, 211, 153, 0.15), rgba(16, 185, 129, 0.2)); border: 2px solid rgba(16, 185, 129, 0.4); color: #10b981; font-weight: 600; box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2); }
  
  .count-badge { background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; font-size: 0.8rem; font-weight: 700; padding: 6px 14px; border-radius: 16px; display: flex; align-items: center; box-shadow: 0 4px 10px rgba(59, 130, 246, 0.35); border: 1px solid rgba(255, 255, 255, 0.2); }
  
  .card-desc { font-size: 0.9rem; color: #94a3b8; margin: 0 0 24px 0; line-height: 1.65; display: -webkit-box; -webkit-line-clamp: 3; line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; word-break: break-word; }
  .card-desc.expanded { display: block; -webkit-line-clamp: unset; line-clamp: unset; overflow: visible; height: auto; }
  
  .info-pills { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
  .info-pill { background: linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.8)); border: 1.5px solid rgba(148, 163, 184, 0.2); border-radius: 10px; padding: 10px 14px; display: flex; align-items: flex-start; gap: 8px; font-size: 0.8rem; color: #cbd5e1; line-height: 1.4; word-break: break-word; font-weight: 500; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15); transition: all 0.2s ease; }
  .info-pill:hover { border-color: rgba(148, 163, 184, 0.35); transform: translateY(-1px); box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2); }
  .highlight-pill { background: linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(245, 158, 11, 0.25)); border: 2px solid rgba(251, 191, 36, 0.5); color: #fbbf24; font-weight: 700; box-shadow: 0 3px 10px rgba(251, 191, 36, 0.25); }
  .highlight-pill:hover { border-color: rgba(251, 191, 36, 0.7); box-shadow: 0 4px 14px rgba(251, 191, 36, 0.35); }
  .pill-icon { width: 16px; height: 16px; flex-shrink: 0; opacity: 0.85; margin-top: 2px; }
  
  .card-separator { height: 1px; background-color: rgba(255, 255, 255, 0.1); width: 100%; margin-bottom: 16px; }
  .card-footer-actions { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; margin-top: auto; gap: 12px; }
  .footer-actions { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }

  /* =========================================
     4. BUTTONS
     ========================================= */
  .view-btn { background: linear-gradient(135deg, rgba(148, 163, 184, 0.1), rgba(148, 163, 184, 0.05)); border: 2px solid rgba(148, 163, 184, 0.4); color: #cbd5e1; padding: 10px 18px; border-radius: 10px; font-size: 0.85rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); white-space: nowrap; flex-shrink: 0; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15); }
  .view-btn:hover { background: linear-gradient(135deg, rgba(148, 163, 184, 0.2), rgba(148, 163, 184, 0.15)); color: white; border-color: rgba(203, 213, 225, 0.6); transform: translateY(-2px); box-shadow: 0 4px 10px rgba(148, 163, 184, 0.25); }
  
  .register-btn { background: linear-gradient(135deg, #10b981 0%, #059669 100%); border: 2px solid rgba(255, 255, 255, 0.2); color: white; padding: 14px 28px; border-radius: 12px; font-size: 1rem; font-weight: 700; cursor: pointer; text-transform: uppercase; box-shadow: 0 8px 20px -4px rgba(16, 185, 129, 0.5), 0 4px 8px rgba(0, 0, 0, 0.2); transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); flex-shrink: 0; min-width: 150px; letter-spacing: 0.5px; position: relative; overflow: hidden; }
  .register-btn::before { content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent); transition: left 0.5s; }
  .register-btn:hover::before { left: 100%; }
  .register-btn:hover { filter: brightness(1.2); transform: translateY(-3px); box-shadow: 0 12px 28px -4px rgba(16, 185, 129, 0.65), 0 6px 12px rgba(0, 0, 0, 0.3); border-color: rgba(255, 255, 255, 0.3); }

  .register-btn:disabled { cursor: not-allowed; opacity: 0.75; box-shadow: none; transform: none; filter: none; }
  .register-btn:disabled::before { display: none; }

  .register-btn.running { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); box-shadow: 0 8px 20px -4px rgba(59, 130, 246, 0.45), 0 4px 8px rgba(0, 0, 0, 0.18); min-width: 150px; }
  .register-btn.running:hover { filter: brightness(1.15); box-shadow: 0 12px 28px -4px rgba(59, 130, 246, 0.6), 0 6px 12px rgba(0, 0, 0, 0.25); }

  .register-btn.no-active,
  .register-btn.full,
  .register-btn.coming-soon { box-shadow: none; cursor: not-allowed; }
  .register-btn.no-active { background: #334155; border-color: rgba(148, 163, 184, 0.25); color: #e2e8f0; }
  .register-btn.full { background: #64748b; border-color: rgba(255, 255, 255, 0.15); color: #0b1220; }
  
  
  .register-btn.coming-soon { background: #94a3b8; box-shadow: none; cursor: not-allowed; opacity: 0.8; }

  .register-btn.unpublished { background: #ef4444 !important; color: #ffffff !important; opacity: 1; cursor: not-allowed; box-shadow: none; border: none; }

  .cancel-direct-btn { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); border: 2px solid rgba(255, 255, 255, 0.2); color: white; padding: 14px 22px; border-radius: 12px; font-size: 0.95rem; font-weight: 800; cursor: pointer; box-shadow: 0 8px 20px -4px rgba(239, 68, 68, 0.45), 0 4px 8px rgba(0, 0, 0, 0.2); transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); position: relative; overflow: hidden; }
  .cancel-direct-btn::before { content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.25), transparent); transition: left 0.5s; }
  .cancel-direct-btn:hover::before { left: 100%; }
  .cancel-direct-btn:hover { filter: brightness(1.1); transform: translateY(-3px); box-shadow: 0 12px 28px -4px rgba(239, 68, 68, 0.6), 0 6px 12px rgba(0, 0, 0, 0.3); border-color: rgba(255, 255, 255, 0.3); }

  @media (max-width: 520px) {
    .card-footer-actions { flex-direction: column; align-items: stretch; }
    .view-btn { width: 100%; justify-content: center; }
    .footer-actions { width: 100%; flex-direction: column; }
    .footer-actions > button { width: 100%; }
    .register-btn, .cancel-direct-btn { width: 100%; min-width: 0; }
  }


  .loading-container { text-align: center; color: var(--text-muted); margin-top: 50px; }
  .no-events { text-align: center; color: var(--text-muted); margin-top: 50px; } 
  .spinner { width: 40px; height: 40px; border: 4px solid rgba(255,255,255,0.1); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 15px auto; }
  @keyframes spin { to { transform: rotate(360deg); } }
  
  .app-footer { margin-top: 40px; text-align: center; padding-bottom: 20px; }
  .footer-separator { height: 1px; background: rgba(255,255,255,0.1); width: 100px; margin: 0 auto 20px auto; }
  .footer-content p { font-size: 0.8rem; color: #64748b; margin: 4px 0; }
  .highlight { color: var(--primary); }
  .contact a { color: #64748b; text-decoration: none; }

  /* =========================================
     5. MODALS
     ========================================= */
  .modal-overlay { position: fixed; inset: 0; z-index: 3000; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; padding: 20px; }
  .modal-box { width: 100%; max-width: 500px; background: #1e293b; border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; position: relative; display: flex; flex-direction: column; box-shadow: 0 20px 40px rgba(0,0,0,0.5); overflow: hidden; }
  .modal-close { position: absolute; top: 15px; right: 20px; background: none; border: none; color: #94a3b8; font-size: 2rem; line-height: 1; cursor: pointer; z-index: 10; }
  .modal-body { padding: 30px; text-align: center; }
  .modal-title { font-size: 1.5rem; color: white; margin: 10px 0 5px; }
  .modal-subtitle { color: #94a3b8; font-size: 0.9rem; margin-bottom: 25px; }
  
  .upload-area { margin-bottom: 25px; }
  .upload-label { cursor: pointer; display: block; }
  .upload-placeholder { border: 2px dashed rgba(255,255,255,0.2); border-radius: 12px; padding: 40px 20px; color: #64748b; display: flex; flex-direction: column; align-items: center; gap: 10px; transition: 0.2s; background: rgba(0,0,0,0.2); }
  .upload-placeholder:hover { border-color: #d8b4fe; color: #d8b4fe; background: rgba(216, 180, 254, 0.05); }
  .image-preview { position: relative; display: inline-block; }
  .image-preview img { max-width: 100%; max-height: 250px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.2); }
  .remove-img-btn { position: absolute; top: -10px; right: -10px; background: #ef4444; color: white; border: none; width: 30px; height: 30px; border-radius: 50%; font-size: 1.2rem; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.3); }
  
  .action-submit-btn { width: 100%; padding: 14px; background: var(--primary); color: #064e3b; border: none; border-radius: 10px; font-weight: 800; font-size: 1rem; cursor: pointer; transition: 0.2s; }
  .action-submit-btn:hover { filter: brightness(1.1); transform: translateY(-2px); }
  .action-submit-btn.purple-theme { background: #d8b4fe; color: #4c1d95; }
  .action-submit-btn:disabled { background: #334155; color: #64748b; cursor: not-allowed; transform: none; }
  .error-text { color: #ef4444; font-weight: 700; margin-bottom: 20px; background: rgba(239, 68, 68, 0.1); padding: 10px; border-radius: 8px; border: 1px solid rgba(239, 68, 68, 0.3); }

  /* Cancel Modal Specific */
  .cancel-options { text-align: left; margin-bottom: 20px; display: flex; flex-direction: column; gap: 12px; }
  .radio-item { display: flex; align-items: center; gap: 10px; cursor: pointer; padding: 8px; border-radius: 8px; transition: background 0.2s; }
  .radio-item:hover { background: rgba(255,255,255,0.05); }
  .radio-label { color: #cbd5e1; font-size: 0.95rem; }
  input[type="radio"] { accent-color: #ef4444; width: 18px; height: 18px; }
  .reason-input textarea { width: 100%; background: #0f172a; border: 1px solid rgba(255,255,255,0.1); color: white; padding: 12px; border-radius: 8px; font-size: 0.95rem; outline: none; box-sizing: border-box; resize: none; margin-bottom: 20px; }
  .reason-input textarea:focus { border-color: #ef4444; }
  .cancel-confirm-btn { background: #ef4444; color: white; }

  /* Mobile Language Switcher */
  .drawer-lang-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; margin-top: 10px; border-top: 1px solid rgba(255, 255, 255, 0.05); padding-top: 20px; }
  .lang-label-group { display: flex; align-items: center; color: #94a3b8; font-weight: 600; font-size: 1rem; gap: 12px; }
  .lang-toggle-pill { display: flex; background: rgba(0, 0, 0, 0.3); padding: 4px; border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.1); }
  .lang-toggle-pill button { background: transparent; border: none; color: #64748b; font-size: 0.8rem; font-weight: 700; padding: 6px 12px; border-radius: 16px; cursor: pointer; transition: all 0.3s ease; }
  .lang-toggle-pill button.active { background: #10b981; color: white; box-shadow: 0 2px 5px rgba(0,0,0,0.3); }
</style>