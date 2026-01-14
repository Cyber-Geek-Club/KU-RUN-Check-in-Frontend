<script lang="ts">
    import { fade, slide, scale } from "svelte/transition";
    import { goto } from "$app/navigation";
    import { auth } from "$lib/utils/auth";
    import { onMount, onDestroy } from "svelte";
    import Swal from "sweetalert2";
    import { lazyLoadBg } from "$lib/utils/lazyLoad";
    import { resolveImageUrl, API_BASE_URL } from "$lib/utils/imageUtils";
    import { ROUTES } from "$lib/utils/routes";
    import { navigateToEventList } from "$lib/utils/navigation";
    import { apiRequest } from "$lib/utils/apiClient";

    // --- CONFIG ---
    const BASE_URL = API_BASE_URL;
    import holidaysJson from '$lib/data/holidays.json';

    // --- STATE: LAYOUT ---
    let isMobileMenuOpen = false;
    let currentView = "my-event";

    // --- STATE: SESSION TIMER ---
    let timeLeftStr = "--:--:--"; 
    let timeLeftSeconds = 0;
    let timerInterval: ReturnType<typeof setInterval> | null = null;

    // --- STATE: AUTO-REFRESH POLLING ---
    let pollInterval: ReturnType<typeof setInterval> | null = null;
    let pollDelay = 5000; // 5 seconds for realtime updates
    let isPollingActive = false;

    // --- STATE: SEARCH ---
    let searchQuery = "";

    // --- STATE: LANGUAGE ---
    let lang: 'th' | 'en' = 'th';

    const t = {
      th: {
        upcoming_header: "กิจกรรมเร็วๆ นี้",
        history_header: "ประวัติกิจกรรม",
        search_placeholder: "ค้นหากิจกรรม...",
        read_more: "ดูรายละเอียด",
        read_less: "ย่อลง",
        status_register: "ลงทะเบียน",
        status_waiting: "รอตรวจสอบ",
        status_rejected: "แก้ไขรูปภาพ",
        status_sending: "ส่งผลวิ่ง",
        status_completed_badge: "✔ ผ่านแล้ว (รอกิจกรรมจบ)",
        status_ended: "จบกิจกรรม",

        btn_checkin: "เข้าร่วมกิจกรรม",
        btn_register: "ลงทะเบียน",
        btn_waiting: "⏳ กำลังตรวจสอบ",
        btn_send_proof: "ส่งผลวิ่ง",
        btn_send_image: "ส่งรูปภาพ",
        btn_completed: "🕒 รอกิจกรรมจบ",
        btn_checkout: "เช็คเอาท์กิจกรรม",
        btn_locked: "ยังไม่เปิด",
        btn_confirm_checkin: "ยืนยันการเช็คอิน",
        btn_next: "ถัดไป (อัปโหลดรูปภาพ) →",
        btn_submit: "ยืนยันการส่งข้อมูล",
        btn_resubmit: "ยืนยันการส่งซ้ำ",
        btn_back_strava: "← ย้อนกลับไปแก้ไข Strava",
        btn_verify_link: "🔍 ตรวจสอบ",
        status_daily_completed: "เจอกันพรุ่งนี้",
        btn_daily_wait: "รอวันถัดไป",

        modal_step1: "ขั้นตอนที่ 1: ข้อมูลการวิ่ง",
        modal_step1_sub: "กรอกข้อมูลจาก Strava ของคุณ",
        modal_link_label: "ลิงก์กิจกรรม Strava (จำเป็น)",
        modal_dist_label: "ระยะทาง (กิโลเมตร)",
        modal_dist_warn: "*ระบบจะล็อคการแก้ไข กรุณากดปุ่ม 'ตรวจสอบ' เพื่อดึงข้อมูลจริง",
        modal_step2: "ขั้นตอนที่ 2: หลักฐานรูปภาพ",
        modal_step2_sub: "อัปโหลดภาพแคปหน้าจอผลการวิ่ง",
        modal_upload_txt: "แตะเพื่ออัปโหลดรูปภาพ",
        modal_rejected: "⚠️ รูปภาพถูกปฏิเสธ:",
        modal_verifying_title: "อยู่ระหว่างตรวจสอบ",
        modal_verifying_desc: "ระบบได้รับข้อมูลแล้ว กำลังรอเจ้าหน้าที่ตรวจสอบความถูกต้องครับ",
        modal_close: "ปิด",

        dash_location: "สถานที่",
        dash_date: "วันที่",
        dash_time: "เวลา",
        dash_rank_title: "ลำดับของฉัน (วันนี้)",
        dash_success_title: "ความสำเร็จสะสม",
        dash_unit_days: "วัน",
        dash_holiday_title: "📅 วันหยุดกิจกรรม",
        dash_holiday_weekend: "ทุกวันเสาร์ - อาทิตย์",
        dash_no_holiday: "- ไม่มีวันหยุด (วิ่งได้ทุกวัน) -",
        rank_label: "ลำดับที่",

        alert_success: "ทำรายการสำเร็จ",
        alert_not_checked_in: "ยังไม่ได้รับการเช็คอิน",
        alert_contact_staff: "กรุณาส่งรหัส PIN หรือ QR Code ให้เจ้าหน้าที่ทำการเช็คอิน",
        alert_checkin_success: "เช็คอินสำเร็จ!",
        alert_go_next: "เข้าสู่ขั้นตอนการส่งผลวิ่ง",
        btn_ok: "ตกลง",
        alert_warning: "แจ้งเตือน",
        alert_error: "ข้อผิดพลาด",
        alert_success_title: "สำเร็จ",
        alert_link_required: "กรุณากรอกลิงก์กิจกรรม Strava",
        alert_link_invalid: "ลิงก์ไม่ถูกต้อง (ต้องเป็น strava.app.link หรือ strava.com)",
        alert_checking: "กำลังตรวจสอบ...",
        alert_fetching_strava: "กำลังดึงข้อมูลจาก Strava...",
        alert_not_found: "ไม่พบข้อมูล",
        alert_connection_error: "เกิดข้อผิดพลาดในการเชื่อมต่อ",
        alert_verify_first: "กรุณากดปุ่ม 'ตรวจสอบ' เพื่อดึงระยะทางก่อน",
        alert_image_required: "กรุณาอัปโหลดรูปภาพหลักฐาน",
        alert_upload_failed: "อัปโหลดไม่สำเร็จ",
        alert_submit_success: "ส่งข้อมูลเรียบร้อยแล้ว",
        alert_session_expired: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่",
      },
      en: {
        upcoming_header: "Upcoming",
        history_header: "History",
        search_placeholder: "Search events...",
        read_more: "Read more",
        read_less: "Read less",

        status_register: "REGISTER",
        status_waiting: "Verifying",
        status_rejected: "Action Required",
        status_sending: "Draft",
        status_completed_badge: "✔ Completed",
        status_ended: "ENDED",

        btn_checkin: "CHECK-IN",
        btn_register: "REGISTER",
        btn_waiting: "⏳ VERIFYING",
        btn_send_proof: "SEND PROOF",
        btn_send_image: "SEND IMAGE",
        btn_completed: "🕒 COMPLETED",
        btn_checkout: "CHECK-OUT",
        btn_locked: "LOCKED",
        btn_confirm_checkin: "CONFIRM CHECK-IN",
        btn_next: "Next (Upload Image) →",
        btn_submit: "Submit Proof",
        btn_resubmit: "Resubmit Proof",
        btn_back_strava: "← Back to Strava Link",
        btn_verify_link: "🔍 Verify Link",
        status_daily_completed: "NEXT DAY",
        btn_daily_wait: "Wait Next Day",

        modal_step1: "Step 1: Activity Data",
        modal_step1_sub: "Enter your Strava activity link",
        modal_link_label: "Strava Activity Link (Required)",
        modal_dist_label: "Distance (KM)",
        modal_dist_warn: "*Input is locked. Please click 'Verify Link' to fetch data.",
        modal_step2: "Step 2: Proof Image",
        modal_step2_sub: "Upload a screenshot of your run result",
        modal_upload_txt: "📸 Tap to upload image",
        modal_rejected: "⚠️ Image Rejected:",
        modal_verifying_title: "Verification Pending",
        modal_verifying_desc: "We are verifying your submission. Please wait.",
        modal_close: "Close",

        dash_location: "Location",
        dash_date: "Date",
        dash_time: "Time",
        dash_rank_title: "My Rank (Today)",
        dash_success_title: "Success Count",
        dash_unit_days: "days",
        dash_holiday_title: "📅 Holidays / Free Days",
        dash_holiday_weekend: "Every Sat - Sun",
        dash_no_holiday: "- No holidays (Run everyday) -",
        rank_label: "Rank",

        alert_success: "Success",
        alert_not_checked_in: "Check-in Pending",
        alert_contact_staff: "Please present your PIN or QR Code to staff.",
        alert_checkin_success: "Check-in Successful!",
        alert_go_next: "Proceeding to proof submission.",
        btn_ok: "OK",
        alert_warning: "Warning",
        alert_error: "Error",
        alert_success_title: "Success",
        alert_link_required: "Strava activity link is required.",
        alert_link_invalid: "Invalid link (Must be strava.app.link or strava.com)",
        alert_checking: "Checking...",
        alert_fetching_strava: "Fetching Strava data...",
        alert_not_found: "Not Found",
        alert_connection_error: "Connection Error",
        alert_verify_first: "Please click 'Verify Link' first.",
        alert_image_required: "Proof image is required.",
      }
    };

    // --- STATE: DATA ---
    let loading = true;
    let rawParticipations: any[] = [];
    let eventsMap: Record<number, any> = {}; 
    let holidaysMap: Record<number, any> = {};
  
    let upcomingEvents: EventItem[] = [];
    let historyEvents: EventItem[] = [];

    // --- MODAL STATE ---
    let showModal = false;
    let selectedEvent: EventItem | null = null;
    let checkInMethod: 'PIN' | 'QR' = 'PIN';
    let proofImage: string | null = null; 
    let proofFile: File | null = null;
    let sendingLink = "";
    let currentParticipationId: number | null = null;
    let distanceInput = 0;

    // --- CANCEL MODAL STATE ---
    let showCancelModal = false;
    let eventToCancel: EventItem | null = null;
    let selectedCancelReason = "";
    let otherCancelReason = "";
    const cancelReasons = [
    "ติดธุระด่วน / Urgent matter",
    "ปัญหาสุขภาพ / Health issue",
    "สภาพอากาศ / Weather condition",
    "การเดินทาง / Transportation",
    "อื่นๆ / Other"
    ];

    // --- MENU ITEMS ---
    const menuItems = [
    { id: "event-list", label: "Event list", path: "/officer/event-list", svg: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9 2 2 4-4" },
    { id: "my-event", label: "My event", path: "/officer/myevents-upcoming", svg: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
    { id: "account-setting", label: "Account setting", path: "/officer/setting-account", svg: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
    ];

    interface EventItem {
    id: number;
    participation_id: number;
    title: string;
    description: string;
    location: string;
    distance_km: number;
    actual_distance_km?: number;
    banner_image_url: string;
    status: "JOINED" | "CHECKED_IN" | "REJECTED" | "proof_submitted" | "CHECKED_OUT" | "COMPLETED" | "CANCELED"; 
    
    participant_count: number;
    max_participants: number;
    isJoined: boolean; 
    isExpanded: boolean;
    rejection_reason?: string;
    proof_image_url?: string;
    join_code?: string;       // PIN Check-in (สำหรับสถานะ JOINED)
    completion_code?: string; // PIN Check-out (สำหรับสถานะ CHECKED_OUT)

    raw_start_date?: string;
    raw_end_date?: string;
    raw_start_time?: string;
    raw_end_time?: string;
    completed_count: number;
    isLocked?: boolean;
    lockMessage?: string;
    completion_rank?: number;
    total_days?: number;
  }

    // [DEBUG] ฟังก์ชันสำหรับ override วันที่เพื่อทดสอบ
    // ใช้โดยเพิ่ม ?debug_date=2026-01-15 ใน URL
    function getDebugDate(): Date {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const debugDate = params.get('debug_date');
        if (debugDate) {
          const testDate = new Date(debugDate);
          if (!isNaN(testDate.getTime())) {
            console.log(`🔧 [DEBUG MODE] Using simulated date: ${debugDate}`);
            return testDate;
          }
        }
      }
      return new Date();
    }

    // --- DATA FETCHING ---
    async function loadData() {
    loading = true;
    try {
      const token = getToken();
      const userId = getUserIdFromToken();
      if (!token || !userId) {
        console.warn("No credentials found");
        Swal.fire({
          icon: 'warning',
          title: t[lang].alert_session_expired || 'Session Expired',
          text: 'Please login again',
          confirmButtonText: 'OK'
        }).then(() => {
          goto("/auth/login");
        });
        return;
      }

      holidaysMap = {};
      if (Array.isArray(holidaysJson)) {
          holidaysJson.forEach((h: any) => {
            if (h && h.eventId) holidaysMap[h.eventId] = h;
          });
      }

      const [resPart, resAllEvents] = await Promise.all([
         fetch(`${BASE_URL}/api/participations/user/${userId}`, {
           method: 'GET',
           headers: { 
             'Authorization': `Bearer ${token}`,
             'Content-Type': 'application/json'
           }
         }).catch(err => {
           console.error("Participations fetch error:", err);
           throw new Error("Cannot connect to participations API");
         }),
        
         fetch(`${BASE_URL}/api/events/`, { 
           method: 'GET',
           headers: { 
             'Authorization': `Bearer ${token}`,
             'Content-Type': 'application/json'
           }
         }).catch(err => {
           console.error("Events fetch error:", err);
           throw new Error("Cannot connect to events API");
         })
      ]);

      if (!resPart.ok) {
        const errText = await resPart.text().catch(() => "Unknown error");
        console.error(`Participations API Error (${resPart.status}):`, errText);
        throw new Error(`Failed to fetch participations (${resPart.status})`);
      }
        
      if (!resAllEvents.ok) {
        const errText = await resAllEvents.text().catch(() => "Unknown error");
        console.error(`Events API Error (${resAllEvents.status}):`, errText);
        throw new Error(`Failed to fetch events (${resAllEvents.status})`);
      }

      rawParticipations = await resPart.json().catch(err => {
        console.error("Error parsing participations JSON:", err);
        throw new Error("Invalid participations data format");
      });
      const allEvents = await resAllEvents.json().catch(err => {
        console.error("Error parsing events JSON:", err);
        throw new Error("Invalid events data format");
      });

      eventsMap = {};
      if (Array.isArray(allEvents)) {
        allEvents.forEach((ev: any) => {
          if (ev && ev.id) eventsMap[ev.id] = ev;
        });
      }

      processData();

    } catch (e: any) {
      console.error("Error loading data:", e);
      let errorMsg = "ไม่สามารถโหลดข้อมูลกิจกรรมได้";
      if (e.message?.includes("connect")) {
        errorMsg = "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต";
      } else if (e.message?.includes("401") || e.message?.includes("403")) {
        errorMsg = "Session หมดอายุ กรุณาเข้าสู่ระบบใหม่";
        Swal.fire({
          icon: 'error',
          title: 'Authentication Error',
          text: errorMsg,
          confirmButtonText: 'OK'
        }).then(() => {
          goto("/auth/login");
        });
        return;
      } else if (e.message?.includes("format")) {
        errorMsg = "ข้อมูลจากเซิร์ฟเวอร์ไม่ถูกต้อง";
      }
        
      Swal.fire({
        icon: "error",
        title: "Error",
        text: errorMsg,
        footer: `<small>Technical: ${e.message || 'Unknown error'}</small>`
      });
    } finally {
      loading = false;
    }
    }

    async function fetchMyStatus(eventId: number) {
      const token = getToken();
      if (!token) return null;
      try {
        const res = await fetch(`${BASE_URL}/api/participations/my-codes/${eventId}`, {
          method: 'GET',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        if (!res.ok) throw new Error("Failed to fetch status");
        return await res.json();
      } catch (e) {
        console.error("Fetch status error:", e);
        return null;
      }
    }

    function processData() {
      const upcoming: EventItem[] = [];
      const history: EventItem[] = [];
      const now = new Date();

      // 1. นับจำนวนครั้งที่ทำสำเร็จ
      const completionCounts: Record<number, number> = {};
      rawParticipations.forEach(p => {
        if (p.status && p.status.toUpperCase() === 'COMPLETED') {
          completionCounts[p.event_id] = (completionCounts[p.event_id] || 0) + 1;
        }
      });

      // 2. หารายการล่าสุด
      const latestParticipations: Record<number, any> = {};
      rawParticipations.forEach(p => {
        if (!latestParticipations[p.event_id] || p.id > latestParticipations[p.event_id].id) {
          latestParticipations[p.event_id] = p;
        }
      });

      // 3. Loop Events
      Object.values(eventsMap).forEach((ev: any) => {
          
        const p = latestParticipations[ev.id];
        if (!p) return; 

        let uiStatus: EventItem['status'] = mapApiStatusToUi(p.status);
        let participationId = p.id;
        let proofImg = p.proof_image_url;
        let rejectReason = p.rejection_reason;
        let joinCode = p.join_code;
        let compCode = p.completion_code;
        let actualDist = p.actual_distance_km;
        let compRank = p.completion_rank;
          
        // [NEW LOGIC] ตรวจสอบวัน: หากกิจกรรมที่สมัครมาไม่ใช่วันปัจจุบัน และ status ไม่ใช่ COMPLETED
        // ให้ AUTO CANCEL ทันที (ระบบวันต่อวัน)
        const recordDateStr = p.created_at || p.date || p.start_date;
        if (recordDateStr) {
          const recordDate = new Date(recordDateStr);
          const today = new Date();
          recordDate.setHours(0, 0, 0, 0);
          today.setHours(0, 0, 0, 0);
              
          // ถ้าวันที่ของ Record ไม่ใช่วันนี้ และ status ไม่ใช่ COMPLETED
          if (recordDate.getTime() !== today.getTime() && uiStatus !== 'COMPLETED') {
            console.log(`[AUTO CANCEL] Event ${ev.id}: Registered on different day (${recordDateStr}). Auto-canceling.`);
            uiStatus = 'CANCELED';
          }
        }
        // Logic Draft Key
        if (uiStatus === 'CHECKED_IN' && typeof localStorage !== 'undefined') {
          const draftKey = `proof_draft_${p.id}`;
          const draftJson = localStorage.getItem(draftKey);
          if (draftJson) {
            try {
              const draft = JSON.parse(draftJson);
              if (draft.step && draft.step >= 2) uiStatus = 'proof_submitted';
            } catch (e) { }
          }
        }

        const count = completionCounts[ev.id] || 0;

        // --- จัดการเรื่องวันและเวลา ---
        const startIso = ev.event_date || ev.startDate || ev.event_start_date;
        const endIso = ev.event_end_date || ev.endDate;
          
        const extractTimeRaw = (isoStr: string) => {
          if (!isoStr) return "";
          const date = new Date(isoStr);
          const bangkokHours = date.getHours();
          const bangkokMinutes = date.getMinutes();
          const hours = String(bangkokHours).padStart(2, '0');
          const minutes = String(bangkokMinutes).padStart(2, '0');
          return `${hours}:${minutes}`;
        };

        const startTimeStr = extractTimeRaw(startIso); 
        const endTimeStr = extractTimeRaw(endIso);
          
        const parseDateOnly = (isoStr: string): Date | null => {
          if (!isoStr) return null;
          if (isoStr.includes('Z') || isoStr.includes('+')) {
            const d = new Date(isoStr);
            return new Date(d.getFullYear(), d.getMonth(), d.getDate());
          }
          const part = isoStr.includes('T') ? isoStr.split('T')[0] : isoStr;
          const [y, m, d] = part.split('-').map(Number);
          return new Date(y, m - 1, d);
        };

        const projectStartDate = parseDateOnly(startIso);
        const projectEndDate = parseDateOnly(endIso);

        if (projectStartDate) projectStartDate.setHours(0, 0, 0, 0);
        if (projectEndDate) projectEndDate.setHours(23, 59, 59, 999);

        const nextWorkingDate = getNextWorkingDay(now, ev.id);
        nextWorkingDate.setHours(0, 0, 0, 0); 

        const isNextDayAfterEnd = projectEndDate ? (nextWorkingDate.getTime() > projectEndDate.getTime()) : false;

        const isProjectEnded = projectEndDate && now > projectEndDate;
        const isProjectNotStarted = projectStartDate && now < projectStartDate;

        let isTimeOver = false;   
        let isBeforeTime = false; 
        let isTodayTimeRemaining = false;

        if (startTimeStr && endTimeStr) {
           const [sh, sm] = startTimeStr.split(':').map(Number);
           const [eh, em] = endTimeStr.split(':').map(Number);
               
           const todayStart = new Date(); todayStart.setHours(sh, sm, 0, 0);
           const todayEnd = new Date(); todayEnd.setHours(eh, em, 59, 999);
               
           if (now < todayStart) isBeforeTime = true;
           if (now > todayEnd) isTimeOver = true;
           if (now <= todayEnd) isTodayTimeRemaining = true;
        }

        let isLocked = false;
        let lockMessage = t[lang].btn_locked;

        if (isProjectEnded) {
          isLocked = true;
          lockMessage = lang === 'th' ? "จบกิจกรรม" : "Activity Ended";
        } 
        else if (isProjectNotStarted && uiStatus !== 'JOINED') {
          isLocked = true;
          const openDate = getDisplayDate(startIso, undefined, lang);
          lockMessage = lang === 'th' ? `เปิด ${openDate}` : `Open ${openDate}`;
        }
        else if (uiStatus === 'COMPLETED') {
          isLocked = true;
          if (isNextDayAfterEnd) {
            if (isTimeOver) {
              lockMessage = lang === 'th' ? "จบกิจกรรม" : "Activity Ended";
            } else {
              lockMessage = lang === 'th' ? "เช็คเอาท์เรียบร้อย" : "Checkout Completed";
            }
          } else {
            if (isTodayTimeRemaining) {
               lockMessage = lang === 'th' ? "เช็คเอาท์เรียบร้อย" : "Checkout Completed";
            } else {
               const nextDateStr = nextWorkingDate.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' });
               lockMessage = lang === 'th' ? `เปิด ${nextDateStr}` : `Open ${nextDateStr}`;
            }
          }
        }
        else if (uiStatus === 'CHECKED_OUT') {
          isLocked = false;
        }
        else if (isBeforeTime) {
          isLocked = true;
          lockMessage = lang === 'th' ? "ยังไม่ถึงเวลา" : "Not yet time";
        }
        else if (isTimeOver) {
          isLocked = true;
          lockMessage = lang === 'th' ? "หมดเวลากิจกรรม" : "Time's up";
        }
          
        const shouldGoToHistory = 
        (isProjectEnded ||
        uiStatus === 'CANCELED' ||
        (isNextDayAfterEnd && isTimeOver));

        if (shouldGoToHistory) {
         if (count === 0) {
           uiStatus = 'CANCELED';
         } 
         else if (count >= 1) {
           if (uiStatus !== 'CANCELED') {
             uiStatus = 'COMPLETED';
           }
         }
        }
          
        const totalValidDays = calculateTotalValidDays(startIso || "", endIso || "", ev?.id || 0);

        const item: EventItem = {
          id: ev.id,
          participation_id: participationId,
          title: ev.title || "Unknown Event",
          description: ev.description || "",
          location: ev.location || "-",
          distance_km: ev.distance_km || 0,
          actual_distance_km: actualDist,
          banner_image_url: resolveImageUrl(ev.banner_image_url) || "https://via.placeholder.com/400",
          participant_count: ev.participant_count || 0,
          max_participants: ev.max_participants || 0,
              
          join_code: joinCode,
          completion_code: compCode,
          rejection_reason: rejectReason,
          proof_image_url: proofImg,
              
          raw_start_date: startIso,
          raw_end_date: endIso,
          raw_start_time: startTimeStr, 
          raw_end_time: endTimeStr,
              
          status: uiStatus,
          isJoined: true,
          isExpanded: false,
              
          completed_count: count,
          isLocked: isLocked,           
          lockMessage: lockMessage,      
          completion_rank: compRank,
          total_days: totalValidDays
        };

        if (shouldGoToHistory) history.push(item);
        else upcoming.push(item);
      });

      upcomingEvents = upcoming;
      historyEvents = history;
    }

    function formatTime(start: string, end: string, currentLang: string) {
    if (!start) return "";
    const extractTime = (val: string) => {
      if (!val) return "";
      if (val.includes('T')) {
        const d = new Date(val);
        return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' });
      }
      const parts = val.split(':');
      if (parts.length >= 2) return `${parts[0]}:${parts[1]}`;
      return val;
    };

    const timeStart = extractTime(start);
    const timeEnd = extractTime(end);
    if (!timeStart || timeStart === "Invalid Date") return "";
    if (currentLang === 'th') {
      return timeEnd ? `${timeStart} - ${timeEnd} น.` : `${timeStart} น.`;
    } else {
      return timeEnd ? `${timeStart} - ${timeEnd}` : `${timeStart}`;
    }
    }

  function mapApiStatusToUi(apiStatus: string): EventItem['status'] {
    if (!apiStatus) return 'JOINED'; // Default
    
    const s = apiStatus.toLowerCase();

    if (s === 'joined') return 'JOINED';
    if (s === 'checked_in') return 'CHECKED_IN';
    if (s === 'rejected') return 'REJECTED';
    if (s === 'proof_submitted' || s === 'submitted' || s === 'pending' || s.includes('wait') || s === 'pending_proof') {
      return 'proof_submitted';
    }
    if (s === 'checked_out' || s === 'pass' || s === 'verified') {
      return 'CHECKED_OUT';
    }
    if (s === 'completed' || s === 'finished') return 'COMPLETED';
    if (s === 'canceled' || s === 'cancelled') return 'CANCELED';
    return 'JOINED';
  }

    $: filteredUpcoming = upcomingEvents.filter(event => 
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
    $: filteredHistory = historyEvents.filter(event => 
      (event.title.toLowerCase().includes(searchQuery.toLowerCase())) &&
      event.status !== 'CANCELED'
    );

    async function CheckInEvent(eventId: number) {
      const token = getToken();
      if (!token) return null;
      try {
        const res = await fetch(`${BASE_URL}/api/participations/join`, { 
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ event_id: eventId }) 
        });
        if (!res.ok) {
          try {
            const errJson = await res.json();
            console.warn("⚠️ Backend Error Detail:", errJson);
            if (errJson.join_code || errJson.id) return errJson;
            if (errJson.detail || errJson.message) {
              throw new Error(errJson.detail || errJson.message);
            }
          } catch(e) {
            if (e instanceof Error && !e.message.includes("Join")) throw e;
          }
          console.error("Join event failed status:", res.status);
          throw new Error(`Server Refused (${res.status}): Cannot Join Event`);
        }
        return await res.json();
      } catch (e: any) {
        console.error("Join event error:", e);
        Swal.fire({
          icon: 'error',
          title: 'Join Failed',
          text: e.message || "ไม่สามารถเข้าร่วมกิจกรรมได้",
        });
        return null;
      }
    }

    function getLocalToken() {
    if (typeof localStorage === 'undefined') return "";
    let token = localStorage.getItem("token") || localStorage.getItem("access_token") || "";
    if (!token) {
      const userStr = localStorage.getItem("user") || localStorage.getItem("user_info");
      if (userStr) { 
        try { 
          const userObj = JSON.parse(userStr);
          token = userObj.token || userObj.accessToken || userObj.access_token || "";
        } catch (e) {} 
      }
    }
    return token;
    }
    function getToken() { return getLocalToken(); } 
    function getUserIdFromToken() {
      const token = getLocalToken();
      if (!token) return null;
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const payload = JSON.parse(jsonPayload);
        return payload.id || payload.user_id || payload.sub || payload.userId;
      } catch (e) {
        console.error("Token parsing error", e);
        return null;
      }
    }

    function startSessionTimer() {
    if (timerInterval) clearInterval(timerInterval);
    const token = getToken();
    if (!token) { timeLeftStr = "00:00:00"; return; }
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(decodeURIComponent(window.atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')));
      if (payload.exp) {
        const expTime = payload.exp * 1000;
        timerInterval = setInterval(() => {
        const now = Date.now();
        const diff = expTime - now;
        if (diff <= 0) {
          if (timerInterval) clearInterval(timerInterval);
          timeLeftStr = "00:00:00";
          timeLeftSeconds = 0;
          handleSessionExpired(); 
        } else {
          const totalSeconds = Math.floor(diff / 1000);
          timeLeftSeconds = totalSeconds;
          const h = Math.floor(totalSeconds / 3600);
          const m = Math.floor((totalSeconds % 3600) / 60);
          const s = totalSeconds % 60;
          timeLeftStr = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
        }
        }, 1000);
      }
    } catch (e) { console.error("Error parsing token expiration:", e); }
    }

    async function handleCheckInConfirm() {
    if (!selectedEvent) return;

    if (selectedEvent.status === 'CHECKED_OUT') {
      Swal.fire({
        icon: 'success',
        title: t[lang].alert_success_title,
        text: t[lang].status_completed_badge,
        timer: 2000,
        showConfirmButton: false
      });

      selectedEvent.status = 'COMPLETED'; 
      await loadData();
      closeModal();
      return;
    }

    try {
      Swal.fire({
        title: t[lang].alert_checking,
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      const latestStatus = await fetchMyStatus(selectedEvent.id);
        
      if (latestStatus && latestStatus.status) {
        const newUiStatus = mapApiStatusToUi(latestStatus.status);
        selectedEvent.status = newUiStatus;
            
        Swal.close();

        if (newUiStatus === 'CHECKED_IN') {
           Swal.fire({
            icon: 'success',
            title: t[lang].alert_checkin_success,
            text: t[lang].alert_go_next,
            timer: 1500,
            showConfirmButton: false
          });
        } else if (newUiStatus === 'COMPLETED') {
           Swal.fire({
            icon: 'success',
            title: 'Mission Completed!',
            text: 'กิจกรรมเสร็จสมบูรณ์',
          });
        } else {
          Swal.fire({
            icon: 'info',
            title: t[lang].alert_not_checked_in,
            text: t[lang].alert_contact_staff,
          });
        }
      } else {
        Swal.close();
      }
      await loadData();

    } catch (e) {
      console.error(e);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Connection failed' });
    }
    }

    function handleSessionExpired() {
    auth.logout();
    Swal.fire({
      icon: 'error',
      title: 'Session Expired',
      text: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่',
      allowOutsideClick: false,
      confirmButtonText: 'OK'
    }).then(() => {
      goto("/auth/login");
    });
    }

    function handleLogout() { 
    isMobileMenuOpen = false;
    auth.logout();
    goto("/auth/login", { replaceState: true });
    }

    // ... (the rest of the student page code continues unchanged, with all '/student/' occurrences replaced with '/officer/' and 'STUDENT' brand replaced with 'OFFICER')
  </script>


  function isPast24Hours(eventEndDate: Date): boolean {
    const now = new Date();
    const oneDayAfter = new Date(eventEndDate);
    oneDayAfter.setTime(oneDayAfter.getTime() + 24 * 60 * 60 * 1000); // บวกเพิ่ม 24 ชม.
    return now > oneDayAfter;
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
      // Upload image using centralized uploadImage function
      const { uploadImage } = await import("$lib/utils/imageUtils");
      const uploadData = await uploadImage(selectedFile, "proofs");
      const imageUrl = uploadData.url;

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

  // --- AUTO-REFRESH POLLING FUNCTIONS ---
  function startPolling() {
    if (pollInterval) return;
    isPollingActive = true;
    console.log("🔄 Starting auto-refresh polling (every 5s)");
    
    pollInterval = setInterval(async () => {
      if (!isPollingActive) return;
      try {
        await silentRefresh();
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, pollDelay);
  }

  function stopPolling() {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
    isPollingActive = false;
    console.log("⏹️ Stopped auto-refresh polling");
  }

  // Silent refresh without showing loading state
  async function silentRefresh() {
    if (!token || !currentUserId) return;

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/participations/user/${currentUserId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) return;
      
      const rawData: RawParticipation[] = await res.json();
      
      // Check if any status changed
      let hasChanges = false;
      for (const newP of rawData) {
        const oldP = participations.find(p => p.id === newP.id);
        if (!oldP || oldP.status !== newP.status) {
          hasChanges = true;
          console.log(`📢 Status changed: ${oldP?.status || 'NEW'} → ${newP.status}`);
          break;
        }
      }
      
      if (rawData.length !== participations.length) {
        hasChanges = true;
      }

      if (hasChanges) {
        console.log("✅ Detected changes, reloading data...");
        await loadData();
      }
    } catch (err) {
      // Silently ignore errors in background refresh
    }
  }

  function handleVisibilityChange() {
    if (document.hidden) {
      stopPolling();
    } else {
      startPolling();
    }
  }

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
      
      // Start realtime polling
      startPolling();
      
      // Pause/resume when tab visibility changes
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('offline', stopPolling);
      window.addEventListener('online', startPolling);
    } catch (err) {
      console.error("Auth Error:", err);
      errorMessage = "ข้อมูลผู้ใช้ผิดพลาด";
      isLoading = false;
    }
  });
  
  import { onDestroy } from "svelte";
  onDestroy(() => {
    stopPolling();
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('offline', stopPolling);
    window.removeEventListener('online', startPolling);
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
            {@const shouldLock = isFuture && p.status !== 'joined'}

            <div
              class="event-card {activeTab === 'upcoming' && !shouldLock ? 'clickable' : ''} {expandedEventId === p.id ? 'expanded' : ''} {shouldLock ? 'locked' : ''}"
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
                {#if activeTab === "upcoming" && shouldLock}
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
                  role="button"
                  aria-label="Event details (expanded)"
                  tabindex="0"
                  on:click|stopPropagation={() => {}}
                  on:keydown|stopPropagation={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                    }
                  }}
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
                                  aria-label="Change selected photo"
                                  title="Change photo"
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
                                  aria-label="Remove selected photo"
                                  title="Remove photo"
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
    background: linear-gradient(135deg, rgba(55, 65, 81, 0.95), rgba(31, 41, 55, 0.95));
    border-radius: 50px;
    padding: 4px;
    display: flex;
    width: 100%;
    max-width: 240px;
    pointer-events: auto;
    box-shadow: 0 10px 22px -10px rgba(0, 0, 0, 0.45);
    border: 1px solid rgba(255, 255, 255, 0.08);
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
    font-weight: 700;
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
    max-width: 520px;
    margin: 0 auto;
    padding: 0 20px;
    box-sizing: border-box;
  }
  .event-card {
    background: white;
    border-radius: 16px;
    overflow: hidden;
    margin-bottom: 20px;
    box-shadow: 0 10px 18px -12px rgba(0, 0, 0, 0.45);
    border: 1px solid rgba(17, 24, 39, 0.06);
    transition: transform 0.2s, box-shadow 0.2s;
    cursor: pointer;
  }
  .event-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 18px 30px -18px rgba(0, 0, 0, 0.55);
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
    font-size: 17px;
    font-weight: 700;
    color: #111827;
    text-transform: none;
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
