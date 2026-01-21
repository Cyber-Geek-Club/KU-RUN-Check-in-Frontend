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

    // --- STATE: LAYOUT ---

    // --- UI SYNC HELPER ---
    // Update a single event in upcoming/history lists immutably to ensure Svelte reactivity
    function updateEventInLists(eventId: number, patch: Partial<EventItem>) {
        const uIdx = upcomingEvents.findIndex((e) => e.id === eventId);
        if (uIdx > -1) {
            upcomingEvents[uIdx] = { ...upcomingEvents[uIdx], ...patch };
            upcomingEvents = [...upcomingEvents];
            return;
        }
        const hIdx = historyEvents.findIndex((e) => e.id === eventId);
        if (hIdx > -1) {
            historyEvents[hIdx] = { ...historyEvents[hIdx], ...patch };
            historyEvents = [...historyEvents];
        }
    }
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
    // Pause-resume helper for UX while user scrolls
    let userScrollTimer: ReturnType<typeof setTimeout> | null = null;

    // --- STATE: SEARCH ---
    let searchQuery = "";

    // --- STATE: LANGUAGE ---
    let lang: "th" | "en" = "th";

    const t = {
        th: {
            upcoming_header: "กิจกรรมเร็วๆ นี้",
            history_header: "ประวัติกิจกรรม",
            search_placeholder: "ค้นหากิจกรรม...", // [แก้ไข 1] ปรับคำให้ชัดเจน
            read_more: "ดูรายละเอียด",
            read_less: "ย่อลง",

            // สถานะ (Badges)
            status_register: "ลงทะเบียน",
            status_waiting: "รอตรวจสอบ",
            status_rejected: "แก้ไขรูปภาพ",
            status_sending: "ส่งผลวิ่ง",
            status_completed_badge: "✔ ผ่านแล้ว (รอกิจกรรมจบ)",
            status_ended: "จบกิจกรรม",

            // ปุ่ม (Buttons)
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
            btn_verify_link: "ยืนยันลิงก์",
            status_daily_completed: "เจอกันพรุ่งนี้",
            btn_daily_wait: "รอวันถัดไป",

            // Modal
            modal_step1: "ขั้นตอนที่ 1: ข้อมูลการวิ่ง",
            modal_step1_sub: "กรอกข้อมูลจาก Strava ของคุณ",
            modal_link_label: "ลิงก์กิจกรรม Strava *",
            modal_dist_label: "ระยะทาง (กิโลเมตร)",
            modal_dist_warn:
                "*ระบบจะล็อคการแก้ไข กรุณากดปุ่ม 'ตรวจสอบ' เพื่อดึงข้อมูลจริง",
            modal_step2: "ขั้นตอนที่ 2: หลักฐานรูปภาพ *",
            modal_step2_sub: "อัปโหลดภาพแคปหน้าจอผลการวิ่ง (บังคับ)",
            modal_upload_txt: "แตะเพื่ออัปโหลดรูปภาพ (จำเป็น)",
            modal_rejected: "⚠️ รูปภาพถูกปฏิเสธ:",
            modal_verifying_title: "อยู่ระหว่างตรวจสอบ",
            modal_verifying_desc:
                "ระบบได้รับข้อมูลแล้ว กำลังรอเจ้าหน้าที่ตรวจสอบความถูกต้องครับ",
            modal_close: "ปิด",

            // [แก้ไข 2] เพิ่มคำแปล Dashboard
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
            participants: "ผู้เข้าร่วม",

            // More
            alert_success: "ทำรายการสำเร็จ",
            alert_not_checked_in: "ยังไม่ได้รับการเช็คอิน",
            alert_contact_staff:
                "กรุณาส่งรหัส PIN หรือ QR Code ให้เจ้าหน้าที่ทำการเช็คอิน",
            alert_checkin_success: "เช็คอินสำเร็จ!",
            alert_go_next: "เข้าสู่ขั้นตอนการส่งผลวิ่ง",
            btn_ok: "ตกลง",
            alert_warning: "แจ้งเตือน",
            alert_error: "ข้อผิดพลาด",
            alert_success_title: "สำเร็จ",
            alert_link_required: "กรุณากรอกลิงก์กิจกรรม Strava",
            alert_link_invalid:
                "ลิงก์ไม่ถูกต้อง (ต้องเป็น strava.app.link หรือ strava.com)",
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
            search_placeholder: "Search events...", // [แก้ไข 1]
            read_more: "Read more",
            read_less: "Read less",

            // Badges
            status_register: "REGISTER",
            status_waiting: "Verifying",
            status_rejected: "Action Required",
            status_sending: "Draft",
            status_completed_badge: "✔ Completed",
            status_ended: "ENDED",

            // Buttons
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
            btn_verify_link: "✅ Verify Link",
            status_daily_completed: "NEXT DAY",
            btn_daily_wait: "Wait Next Day",

            // Modal
            modal_step1: "Step 1: Activity Data",
            modal_step1_sub: "Enter your Strava activity link",
            modal_link_label: "Strava Activity Link *",
            modal_dist_label: "Distance (KM)",
            modal_dist_warn:
                "*Input is locked. Please click 'Verify Link' to fetch data.",
            modal_step2: "Step 2: Proof Image *",
            modal_step2_sub:
                "Upload a screenshot of your run result (Required)",
            modal_upload_txt: "📸 Tap to upload image (Required)",
            modal_rejected: "⚠️ Image Rejected:",
            modal_verifying_title: "Verification Pending",
            modal_verifying_desc:
                "We are verifying your submission. Please wait.",
            modal_close: "Close",

            // [แก้ไข 2] เพิ่มคำแปล Dashboar
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
            participants: "Participants",

            // More
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
            alert_link_invalid:
                "Invalid link (Must be strava.app.link or strava.com)",
            alert_checking: "Checking...",
            alert_fetching_strava: "Fetching Strava data...",
            alert_not_found: "Not Found",
            alert_connection_error: "Connection Error",
            alert_verify_first: "Please click 'Verify Link' first.",
            alert_image_required: "Proof image is required.",
            alert_upload_failed: "Upload failed",
            alert_submit_success: "Submitted successfully.",
            alert_session_expired: "Session expired. Please login again.",
        },
    };

    function setLang(l: "th" | "en") {
        lang = l;
        if (typeof localStorage !== "undefined") {
            localStorage.setItem("app_lang", l);
        }
    }

    // --- STATE: DATA ---
    let loading = true;
    let rawParticipations: any[] = [];
    let eventsMap: Record<number, any> = {};
    let holidaysMap: Record<number, any> = {};
    let holidaysCalendar: Record<number, string[]> = {};

    let upcomingEvents: EventItem[] = [];
    let historyEvents: EventItem[] = [];

    // --- MODAL STATE ---
    let showModal = false;
    let selectedEvent: EventItem | null = null;
    let checkInMethod: "PIN" | "QR" = "PIN";
    let proofImage: string | null = null;
    let proofFile: File | null = null;
    let sendingLink = "";
    let currentParticipationId: number | null = null;
    let distanceInput = 0;
    let stravaVerified = false; // Track if user clicked verify button
    let lastVerifiedLink = ""; // Track last verified Strava link

    // ✅ Reset verification when link changes (only if link actually changed)
    $: {
        const trimmed = sendingLink?.trim() || "";
        // Only reset if link has meaningfully changed from verified version
        if (
            stravaVerified &&
            lastVerifiedLink &&
            trimmed !== lastVerifiedLink
        ) {
            stravaVerified = false;
            distanceInput = 0;
        }
    }

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
        "อื่นๆ / Other",
    ];

    // --- MENU ITEMS ---
    const menuItems = [
        {
            id: "event-list",
            label: "Event list",
            path: ROUTES.student.eventList,
            svg: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01",
        },
        {
            id: "my-event",
            label: "My event",
            path: ROUTES.student.myEvents,
            svg: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
        },
        {
            id: "account-setting",
            label: "Account setting",
            path: ROUTES.student.settings,
            svg: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
        },
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
        status:
            | "JOINED"
            | "CHECKED_IN"
            | "REJECTED"
            | "proof_submitted"
            | "CHECKED_OUT"
            | "COMPLETED"
            | "CANCELED";

        participant_count: number;
        max_participants: number;
        isJoined: boolean;
        isExpanded: boolean;
        rejection_reason?: string;
        proof_image_url?: string;
        join_code?: string; // PIN Check-in (สำหรับสถานะ JOINED)
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
        rejoin_count?: number; // จำนวนครั้งที่ rejoin แล้ว (0-5)
    }

    // Helper to normalize join/completion code fields coming from API
    function normalizeCode(src: any): {
        join_code: string;
        completion_code?: string;
    } {
        const join =
            src?.join_code || src?.joinCode || src?.code || src?.pin || "";
        const comp =
            src?.completion_code ||
            src?.completionCode ||
            src?.checkout_code ||
            src?.completion ||
            undefined;
        return {
            join_code: join ? String(join) : "",
            completion_code: comp ? String(comp) : undefined,
        };
    }

    // [DEBUG] ฟังก์ชันสำหรับ override วันที่เพื่อทดสอบ
    // ใช้โดยเพิ่ม ?debug_date=2026-01-15 ใน URL
    function getDebugDate(): Date {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const debugDate = params.get("debug_date");
            if (debugDate) {
                const testDate = new Date(debugDate);
                if (!isNaN(testDate.getTime())) {
                    console.log(
                        `🔧 [DEBUG MODE] Using simulated date: ${debugDate}`,
                    );
                    return testDate;
                }
            }
        }
        return new Date();
    }

    function splitCode(code: any, len = 5): string[] {
        try {
            const s = code === null || code === undefined ? "" : String(code);
            const chars = s.split("");
            const out: string[] = [];
            for (let i = 0; i < len; i++) out.push(chars[i] || "-");
            return out;
        } catch (e) {
            return new Array(len).fill("-");
        }
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
                    icon: "warning",
                    title: t[lang].alert_session_expired || "Session Expired",
                    text: "Please login again",
                    confirmButtonText: "OK",
                }).then(() => {
                    goto("/auth/login");
                });
                return;
            }

            // ✅ Holidays map is now built from event data itself (not from static file)
            holidaysMap = {};
            holidaysCalendar = {};

            const [resPart, resAllEvents] = await Promise.all([
                fetch(`${BASE_URL}/api/participations/user/${userId}`, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }).catch((err) => {
                    console.error("Participations fetch error:", err);
                    throw new Error("Cannot connect to participations API");
                }),

                fetch(`${BASE_URL}/api/events/`, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }).catch((err) => {
                    console.error("Events fetch error:", err);
                    throw new Error("Cannot connect to events API");
                }),
            ]);

            if (!resPart.ok) {
                const errText = await resPart
                    .text()
                    .catch(() => "Unknown error");
                console.error(
                    `Participations API Error (${resPart.status}):`,
                    errText,
                );
                throw new Error(
                    `Failed to fetch participations (${resPart.status})`,
                );
            }

            if (!resAllEvents.ok) {
                const errText = await resAllEvents
                    .text()
                    .catch(() => "Unknown error");
                console.error(
                    `Events API Error (${resAllEvents.status}):`,
                    errText,
                );
                throw new Error(
                    `Failed to fetch events (${resAllEvents.status})`,
                );
            }

            rawParticipations = await resPart.json().catch((err) => {
                console.error("Error parsing participations JSON:", err);
                throw new Error("Invalid participations data format");
            });
            const allEvents = await resAllEvents.json().catch((err) => {
                console.error("Error parsing events JSON:", err);
                throw new Error("Invalid events data format");
            });

            eventsMap = {};
            if (Array.isArray(allEvents)) {
                await Promise.all(
                    allEvents.map(async (ev: any) => {
                        if (ev && ev.id) {
                            eventsMap[ev.id] = ev;
                            // Fetch holidays for each event
                            try {
                                const token = getToken();
                                const res = await fetch(
                                    `${BASE_URL}/api/events/${ev.id}/holidays`,
                                    {
                                        method: "GET",
                                        headers: {
                                            Authorization: `Bearer ${token}`,
                                            "Content-Type": "application/json",
                                        },
                                    },
                                );
                                if (res.ok) {
                                    const data = await res.json();
                                    holidaysCalendar[ev.id] = Array.isArray(
                                        data,
                                    )
                                        ? data
                                        : [];
                                } else {
                                    holidaysCalendar[ev.id] = [];
                                }
                            } catch (e) {
                                holidaysCalendar[ev.id] = [];
                            }
                        }
                    }),
                );
            }

            // Fetch unique participant counts
            await fetchUniqueParticipantCounts();

            processData();
        } catch (e: any) {
            console.error("Error loading data:", e);
            let errorMsg = "ไม่สามารถโหลดข้อมูลกิจกรรมได้";
            if (e.message?.includes("connect")) {
                errorMsg =
                    "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต";
            } else if (
                e.message?.includes("401") ||
                e.message?.includes("403")
            ) {
                errorMsg = "Session หมดอายุ กรุณาเข้าสู่ระบบใหม่";
                Swal.fire({
                    icon: "error",
                    title: "Authentication Error",
                    text: errorMsg,
                    confirmButtonText: "OK",
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
                footer: `<small>Technical: ${e.message || "Unknown error"}</small>`,
            });
        } finally {
            loading = false;
        }
    }

    // ===== Fetch unique participant counts for all events =====
    async function fetchUniqueParticipantCounts() {
        const token = getToken();
        const headers: HeadersInit = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const eventIds = Object.keys(eventsMap).map(Number);
        const BATCH_SIZE = 5;

        for (let i = 0; i < eventIds.length; i += BATCH_SIZE) {
            const batch = eventIds.slice(i, i + BATCH_SIZE);

            const results = await Promise.allSettled(
                batch.map(async (eventId) => {
                    try {
                        // Removed participants API call for student role
                        return {
                            eventId,
                            uniqueCount:
                                eventsMap[eventId]?.participant_count || 0,
                        };
                    } catch (err) {
                        return {
                            eventId,
                            uniqueCount:
                                eventsMap[eventId]?.participant_count || 0,
                        };
                    }
                }),
            );

            // Update eventsMap with results
            results.forEach((result) => {
                if (result.status === "fulfilled") {
                    const { eventId, uniqueCount } = result.value;
                    if (eventsMap[eventId]) {
                        eventsMap[eventId].participant_count = uniqueCount;
                    }
                }
            });
        }
    }

    async function fetchMyStatus(eventId: number) {
        const token = getToken();
        if (!token) return null;
        try {
            const res = await fetch(
                `${BASE_URL}/api/participations/my-codes/${eventId}`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                },
            );
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
        const now = getDebugDate();

        // 1. นับจำนวนครั้งที่ทำสำเร็จ
        const completionCounts: Record<number, number> = {};
        rawParticipations.forEach((p) => {
            if (p.status && p.status.toUpperCase() === "COMPLETED") {
                completionCounts[p.event_id] =
                    (completionCounts[p.event_id] || 0) + 1;
            }
        });

        // 2. หารายการล่าสุด
        const latestParticipations: Record<number, any> = {};
        rawParticipations.forEach((p) => {
            if (
                !latestParticipations[p.event_id] ||
                p.id > latestParticipations[p.event_id].id
            ) {
                latestParticipations[p.event_id] = p;
            }
        });

        // 3. Loop Events
        Object.values(eventsMap).forEach((ev: any) => {
            const p = latestParticipations[ev.id];
            if (!p) return;

            let uiStatus: EventItem["status"] = mapApiStatusToUi(p.status);
            let participationId = p.id;
            let proofImg = p.proof_image_url;
            let rejectReason = p.rejection_reason;
            const codes = normalizeCode(p);
            let joinCode = codes.join_code;
            let compCode = codes.completion_code;
            let actualDist = p.actual_distance_km;
            let compRank = p.completion_rank;

            // [NEW LOGIC] ตรวจสอบวัน: หากกิจกรรมที่สมัครมาไม่ใช่วันปัจจุบัน และ status ไม่ใช่ COMPLETED
            // ให้ AUTO CANCEL ทันที (ระบบวันต่อวัน)
            const recordDateStr = p.created_at || p.date || p.start_date;
            if (recordDateStr) {
                const recordDate = new Date(recordDateStr);
                const today = getDebugDate();
                recordDate.setHours(0, 0, 0, 0);
                today.setHours(0, 0, 0, 0);

                // ถ้าวันที่ของ Record ไม่ใช่วันนี้ และ status ไม่ใช่ COMPLETED
                if (
                    recordDate.getTime() !== today.getTime() &&
                    uiStatus !== "COMPLETED"
                ) {
                    console.log(
                        `[AUTO CANCEL] Event ${ev.id}: Registered on different day (${recordDateStr}). Auto-canceling.`,
                    );
                    uiStatus = "CANCELED";
                }
            }
            // Logic Draft Key
            if (
                uiStatus === "CHECKED_IN" &&
                typeof localStorage !== "undefined"
            ) {
                const draftKey = `proof_draft_${p.id}`;
                const draftJson = localStorage.getItem(draftKey);
                if (draftJson) {
                    try {
                        const draft = JSON.parse(draftJson);
                        if (draft.step && draft.step >= 2)
                            uiStatus = "proof_submitted";
                    } catch (e) {}
                }
            }

            const count = completionCounts[ev.id] || 0;

            // --- จัดการเรื่องวันและเวลา ---
            const startIso =
                ev.event_date || ev.startDate || ev.event_start_date;
            const endIso = ev.event_end_date || ev.endDate;

            const extractTimeRaw = (isoStr: string) => {
                if (!isoStr) return "";
                // [FIX] แปลง UTC เป็น Bangkok time ก่อนดึงเวลา
                const date = new Date(isoStr);
                const bangkokHours = date.getHours(); // getHours() จะใช้ local timezone อัตโนมัติ
                const bangkokMinutes = date.getMinutes();
                const hours = String(bangkokHours).padStart(2, "0");
                const minutes = String(bangkokMinutes).padStart(2, "0");
                return `${hours}:${minutes}`;
            };

            const startTimeStr = ev.start_time || extractTimeRaw(startIso);
            const endTimeStr = ev.end_time || extractTimeRaw(endIso);

            // Parse date ให้ถูกต้องโดยพิจารณา timezone
            const parseDateOnly = (isoStr: string): Date | null => {
                if (!isoStr) return null;
                // ถ้าเป็น ISO format ที่มี Z (UTC) ให้แปลงเป็น local time ก่อน
                if (isoStr.includes("Z") || isoStr.includes("+")) {
                    const d = new Date(isoStr);
                    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
                }
                // ถ้าเป็น format ไม่มี timezone (YYYY-MM-DDTHH:mm:ss หรือ YYYY-MM-DD)
                const part = isoStr.includes("T")
                    ? isoStr.split("T")[0]
                    : isoStr;
                const [y, m, d] = part.split("-").map(Number);
                return new Date(y, m - 1, d);
            };
            

            const projectStartDate = parseDateOnly(startIso);
            const projectEndDate = parseDateOnly(endIso);

            if (projectStartDate) projectStartDate.setHours(0, 0, 0, 0);
            if (projectEndDate) projectEndDate.setHours(23, 59, 59, 999);

            // หาวันทำการถัดไป
            const nextWorkingDate = getNextWorkingDay(now, ev.id);
            nextWorkingDate.setHours(0, 0, 0, 0);

            // เช็คว่า "วันถัดไป" เกิน "วันจบโครงการ" หรือไม่? (ถ้าเกิน = นี่คือวันสุดท้าย)
            const isNextDayAfterEnd = projectEndDate
                ? nextWorkingDate.getTime() > projectEndDate.getTime()
                : false;

            const isProjectEnded = projectEndDate && now > projectEndDate;
            const isProjectNotStarted =
                projectStartDate && now < projectStartDate;

            let isTimeOver = false;
            let isBeforeTime = false;
            let isTodayTimeRemaining = false;

            if (startTimeStr && endTimeStr) {
                const [sh, sm] = startTimeStr.split(":").map(Number);
                const [eh, em] = endTimeStr.split(":").map(Number);

                const todayStart = getDebugDate();
                todayStart.setHours(sh, sm, 0, 0);
                const todayEnd = getDebugDate();
                todayEnd.setHours(eh, em, 59, 999);

                if (now < todayStart) isBeforeTime = true;
                if (now > todayEnd) isTimeOver = true;
                if (now <= todayEnd) isTodayTimeRemaining = true;
            }

            // If the event's end date/time already passed (final day) or we are past the end date, mark as COMPLETED
            if (projectEndDate) {
                const isFinalDayTimeOver = isNextDayAfterEnd && isTimeOver;
                if (now > projectEndDate || isFinalDayTimeOver) {
                    uiStatus = "COMPLETED";
                }
            }

            // --- Logic Lock & Message ---
            let isLocked = false;
            let lockMessage = t[lang].btn_locked;

            if (isProjectEnded) {
                isLocked = true;
                lockMessage = lang === "th" ? "จบกิจกรรม" : "Activity Ended";
            } else if (isProjectNotStarted && uiStatus !== "JOINED") {
                // [FIX] ถ้ากิจกรรมยังไม่เริ่ม แต่ user สมัครไว้แล้ว (JOINED) ก็ไม่ต้องล็อค
                isLocked = true;
                const openDate = getDisplayDate(startIso, undefined, lang);
                lockMessage =
                    lang === "th" ? `เปิด ${openDate}` : `Open ${openDate}`;
            } else if (uiStatus === "COMPLETED") {
                isLocked = true;
                if (isNextDayAfterEnd) {
                    // [แก้ไข 1] ถ้าเป็นวันสุดท้าย และหมดเวลาแล้ว -> จบกิจกรรม
                    if (isTimeOver) {
                        lockMessage =
                            lang === "th" ? "จบกิจกรรม" : "Activity Ended";
                    } else {
                        // ถ้าวันสุดท้ายแต่ยังไม่หมดเวลา -> เช็คเอาท์เรียบร้อย (ยังโชว์ใน Upcoming)
                        lockMessage =
                            lang === "th"
                                ? "เช็คเอาท์เรียบร้อย"
                                : "Checkout Completed";
                    }
                } else {
                    // ถ้ายังไม่ใช่วันสุดท้าย
                    if (isTodayTimeRemaining) {
                        lockMessage =
                            lang === "th"
                                ? "เช็คเอาท์เรียบร้อย"
                                : "Checkout Completed";
                    } else {
                        const nextDateStr = nextWorkingDate.toLocaleDateString(
                            "th-TH",
                            {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                            },
                        );
                        lockMessage =
                            lang === "th"
                                ? `เปิด ${nextDateStr}`
                                : `Open ${nextDateStr}`;
                    }
                }
            } else if (uiStatus === "CHECKED_OUT") {
                if (isTimeOver) {
                    isLocked = true;
                    lockMessage =
                        lang === "th" ? "หมดเวลากิจกรรม" : "Time's up";
                } else {
                    isLocked = false;
                }
            } else if (isBeforeTime) {
                isLocked = true;
                lockMessage = lang === "th" ? "ยังไม่ถึงเวลา" : "Not yet time";
            } else if (isTimeOver) {
                isLocked = true;
                lockMessage = lang === "th" ? "หมดเวลากิจกรรม" : "Time's up";
            }

            // --- History Logic (แก้ไข 2) ---
            const shouldGoToHistory =
                isProjectEnded ||
                uiStatus === "CANCELED" ||
                (isNextDayAfterEnd && isTimeOver);
            // (isNextDayAfterEnd && isTimeOver)) &&
            // uiStatus !== 'CHECKOUT';

            if (shouldGoToHistory) {
                if (count === 0) {
                    uiStatus = "CANCELED";
                } else if (count >= 1) {
                    if (uiStatus !== "CANCELED") {
                        uiStatus = "COMPLETED";
                    }
                }
            }

            const totalValidDays = calculateTotalValidDays(
                startIso || "",
                endIso || "",
                ev?.id || 0,
            );

            const item: EventItem = {
                id: ev.id,
                participation_id: participationId,
                title: ev.title || "Unknown Event",
                description: ev.description || "",
                location: ev.location || "-",
                distance_km: ev.distance_km || 0,
                actual_distance_km: actualDist,
                banner_image_url:
                    resolveImageUrl(ev.banner_image_url) ||
                    "https://via.placeholder.com/400",
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
                total_days: totalValidDays,
                rejoin_count: p.rejoin_count ?? 0,
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
            if (val.includes("T")) {
                const d = new Date(val);
                return d.toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                    timeZone: "UTC",
                });
            }
            const parts = val.split(":");
            if (parts.length >= 2) return `${parts[0]}:${parts[1]}`;
            return val;
        };

        const timeStart = extractTime(start);
        const timeEnd = extractTime(end);
        if (!timeStart || timeStart === "Invalid Date") return "";
        if (currentLang === "th") {
            return timeEnd ? `${timeStart} - ${timeEnd} น.` : `${timeStart} น.`;
        } else {
            return timeEnd ? `${timeStart} - ${timeEnd}` : `${timeStart}`;
        }
    }

    function mapApiStatusToUi(apiStatus: string): EventItem["status"] {
        if (!apiStatus) return "JOINED"; // Default

        const s = apiStatus.toLowerCase();

        // 1. JOINED : เริ่มต้น (โชว์ PIN QRCODE)
        if (s === "joined") return "JOINED";

        // 2. CHECKED_IN : เช็คอินแล้ว (โชว์ฟอร์มส่งผล Strava และ รูปภาพ)
        if (s === "checked_in") return "CHECKED_IN";

        // 3. REJECTED : โดนปฏิเสธหลักฐาน (โชว์ฟอร์มส่งใหม่)
        if (s === "rejected") return "REJECTED";

        // 4. proof_submitted : ส่งหลักฐานแล้ว รอตรวจสอบ (โชว์นาฬิกาทราย)
        if (
            s === "proof_submitted" ||
            s === "submitted" ||
            s === "pending" ||
            s.includes("wait") ||
            s === "pending_proof"
        ) {
            return "proof_submitted";
        }

        // 5. CHECKED_OUT : ผ่านการตรวจสอบ (โชว์ PIN QRCODE Check-out)
        if (s === "checked_out" || s === "pass" || s === "verified") {
            return "CHECKED_OUT";
        }

        // 6. COMPLETED : สถานะจบกิจกรรม (ทุกคนต้องอยู่ในกระบวนการนี้)
        if (s === "completed" || s === "finished") return "COMPLETED";

        // 7. CANCELED : กิจกรรมที่ user ยกเลิก
        if (s === "canceled" || s === "cancelled") return "CANCELED";

        // Fallback
        return "JOINED";
    }

    // --- UPCOMING PAGINATION ---
    $: filteredUpcoming = upcomingEvents.filter(
        (event) =>
            event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            event.description.toLowerCase().includes(searchQuery.toLowerCase()),
    );
    let upcomingCurrentPage = 1;
    const upcomingItemsPerPage = 8;
    $: upcomingTotalPages = Math.ceil(
        filteredUpcoming.length / upcomingItemsPerPage,
    );
    $: paginatedUpcoming = filteredUpcoming.slice(
        (upcomingCurrentPage - 1) * upcomingItemsPerPage,
        upcomingCurrentPage * upcomingItemsPerPage,
    );
    function changeUpcomingPage(page: number) {
        if (page >= 1 && page <= upcomingTotalPages) {
            upcomingCurrentPage = page;
            // Optionally scroll to top of upcoming section (use scroll-container as host)
            const container = document.querySelector(
                ".scroll-container",
            ) as HTMLElement | null;
            const el = document.getElementById("upcoming-section");
            if (container && el)
                container.scrollTo({ top: el.offsetTop, behavior: "smooth" });
            else el?.scrollIntoView({ behavior: "smooth" });
        }
    }

    // --- HISTORY PAGINATION ---
    let historyCurrentPage = 1;
    const historyItemsPerPage = 8;
    $: filteredHistory = historyEvents.filter(
        (event) =>
            event.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
            event.status !== "CANCELED",
    );
    $: historyTotalPages = Math.ceil(
        filteredHistory.length / historyItemsPerPage,
    );
    $: paginatedHistory = filteredHistory.slice(
        (historyCurrentPage - 1) * historyItemsPerPage,
        historyCurrentPage * historyItemsPerPage,
    );
    function changeHistoryPage(page: number) {
        if (page >= 1 && page <= historyTotalPages) {
            historyCurrentPage = page;
            const container = document.querySelector(
                ".scroll-container",
            ) as HTMLElement | null;
            const el = document.getElementById("history-section");
            if (container && el)
                container.scrollTo({ top: el.offsetTop, behavior: "smooth" });
            else el?.scrollIntoView({ behavior: "smooth" });
        }
    }

    async function CheckInEvent(eventId: number) {
        const token = getToken();
        if (!token) return null;
        // ดึง event_type จาก eventsMap
        const event = eventsMap[eventId];
        const eventType = event?.event_type || "single_day";
        let url = "";
        let body = {};
        if (eventType === "multi_day") {
            url = `${BASE_URL}/api/participations/pre-register/${eventId}`;
            body = {};
        } else {
            url = `${BASE_URL}/api/participations/join`;
            body = { event_id: eventId };
        }
        try {
            const res = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: Object.keys(body).length
                    ? JSON.stringify(body)
                    : undefined,
            });
            if (!res.ok) {
                try {
                    const errJson = await res.json();
                    console.warn("⚠️ Backend Error Detail:", errJson);
                    if (errJson.join_code || errJson.id) return errJson;
                    if (errJson.detail || errJson.message) {
                        throw new Error(errJson.detail || errJson.message);
                    }
                } catch (e) {
                    if (e instanceof Error && !e.message.includes("Join"))
                        throw e;
                }
                console.error("Join event failed status:", res.status);
                throw new Error(
                    `Server Refused (${res.status}): Cannot Join Event`,
                );
            }
            return await res.json();
        } catch (e: any) {
            console.error("Join event error:", e);
            Swal.fire({
                icon: "error",
                title: "Join Failed",
                text: e.message || "ไม่สามารถเข้าร่วมกิจกรรมได้",
            });
            return null;
        }
    }

    function getLocalToken() {
        try {
            if (
                typeof window === "undefined" ||
                typeof localStorage === "undefined"
            )
                return "";
            let token =
                localStorage.getItem("token") ||
                localStorage.getItem("access_token") ||
                "";
            if (!token) {
                const userStr =
                    localStorage.getItem("user") ||
                    localStorage.getItem("user_info");
                if (userStr) {
                    try {
                        const userObj = JSON.parse(userStr);
                        token =
                            userObj.token ||
                            userObj.accessToken ||
                            userObj.access_token ||
                            "";
                    } catch (e) {
                        console.warn(
                            "Failed to parse stored user object for token",
                            e,
                        );
                    }
                }
            }
            return token || "";
        } catch (e) {
            console.warn("getLocalToken error (likely SSR):", e);
            return "";
        }
    }
    function getToken() {
        return getLocalToken();
    }
    function getUserIdFromToken() {
        if (typeof window === "undefined") return null;
        const token = getLocalToken();
        if (!token) return null;
        try {
            const parts = token.split(".");
            if (!parts || parts.length < 2) return null;
            const base64Url = parts[1];
            const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
            const atob =
                window.atob ||
                ((str: string) =>
                    Buffer.from(str, "base64").toString("binary"));
            const raw = atob(base64);
            const jsonPayload = decodeURIComponent(
                Array.prototype.map
                    .call(raw, function (c: string) {
                        return (
                            "%" +
                            ("00" + c.charCodeAt(0).toString(16)).slice(-2)
                        );
                    })
                    .join(""),
            );
            const payload = JSON.parse(jsonPayload);
            const id =
                payload.id || payload.user_id || payload.sub || payload.userId;
            return typeof id === "string" ? parseInt(id) || null : id || null;
        } catch (e) {
            console.error("Token parsing error", e);
            return null;
        }
    }

    function startSessionTimer() {
        try {
            if (typeof window === "undefined") return;
            if (timerInterval) clearInterval(timerInterval);
            const token = getToken();
            if (!token) {
                timeLeftStr = "00:00:00";
                timeLeftSeconds = 0;
                return;
            }
            const parts = token.split(".");
            if (!parts || parts.length < 2) {
                timeLeftStr = "00:00:00";
                return;
            }
            const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
            const atob =
                window.atob ||
                ((str: string) =>
                    Buffer.from(str, "base64").toString("binary"));
            const raw = atob(base64);
            const payload = JSON.parse(
                decodeURIComponent(
                    Array.prototype.map
                        .call(
                            raw,
                            (c: string) =>
                                "%" +
                                ("00" + c.charCodeAt(0).toString(16)).slice(-2),
                        )
                        .join(""),
                ),
            );
            if (payload && payload.exp) {
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
        } catch (e) {
            console.error("Error parsing token expiration:", e);
            timeLeftStr = "00:00:00";
            timeLeftSeconds = 0;
        }
    }

    async function handleCheckInConfirm() {
        if (!selectedEvent) return;

        // --- CASE: CHECKOUT (จบงานวันนี้) ---
        if (selectedEvent.status === "CHECKED_OUT") {
            // [แก้ไข] ตัด Logic วนลูป Auto-Join ออกทั้งหมด เหลือแค่นี้ครับ
            Swal.fire({
                icon: "success",
                title: t[lang].alert_success_title, // "สำเร็จ"
                text: t[lang].status_completed_badge, // "ผ่านแล้ว"
                timer: 2000,
                showConfirmButton: false,
            });

            // รีโหลดข้อมูลใหม่เพื่อให้เห็นสถานะล่าสุดจาก Server
            await loadData();
            // ปิด Modal
            closeModal();
            return;
        }

        // --- CASE: อื่นๆ (เช่น JOINED -> CHECKED_IN) ---
        // (Logic เดิมส่วนนี้เก็บไว้เหมือนเดิม ไม่ต้องแก้)
        try {
            Swal.fire({
                title: t[lang].alert_checking,
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading(),
            });

            // ดึงสถานะล่าสุด
            const latestStatus = await fetchMyStatus(selectedEvent.id);

            if (latestStatus && latestStatus.status) {
                const newUiStatus = mapApiStatusToUi(latestStatus.status);
                selectedEvent.status = newUiStatus;

                Swal.close();

                if (newUiStatus === "CHECKED_IN") {
                    Swal.fire({
                        icon: "success",
                        title: t[lang].alert_checkin_success,
                        text: t[lang].alert_go_next,
                        timer: 1500,
                        showConfirmButton: false,
                    });
                } else if (newUiStatus === "COMPLETED") {
                    Swal.fire({
                        icon: "success",
                        title: "Mission Completed!",
                        text: "กิจกรรมเสร็จสมบูรณ์",
                    });
                } else {
                    Swal.fire({
                        icon: "info",
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
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "Connection failed",
            });
        }
    }

    function handleSessionExpired() {
        // ✅ Clear ALL storage and cookies
        if (typeof localStorage !== "undefined") {
            localStorage.clear();
        }
        if (typeof sessionStorage !== "undefined") {
            sessionStorage.clear();
        }
        if (typeof document !== "undefined") {
            document.cookie.split(";").forEach((c) => {
                document.cookie = c
                    .replace(/^ +/, "")
                    .replace(
                        /=.*/,
                        "=;expires=" + new Date().toUTCString() + ";path=/",
                    );
            });
        }

        auth.logout();
        Swal.fire({
            icon: "error",
            title: "Session Expired",
            text: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่",
            allowOutsideClick: false,
            confirmButtonText: "OK",
        }).then(() => {
            if (typeof window !== "undefined") {
                window.location.href = "/auth/login";
            }
        });
    }

    function handleLogout() {
        isMobileMenuOpen = false;

        // ✅ Clear ALL storage and cookies
        if (typeof localStorage !== "undefined") {
            localStorage.clear();
        }
        if (typeof sessionStorage !== "undefined") {
            sessionStorage.clear();
        }
        if (typeof document !== "undefined") {
            document.cookie.split(";").forEach((c) => {
                document.cookie = c
                    .replace(/^ +/, "")
                    .replace(
                        /=.*/,
                        "=;expires=" + new Date().toUTCString() + ";path=/",
                    );
            });
        }

        auth.logout();
        if (typeof window !== "undefined") {
            window.location.href = "/auth/login";
        }
    }

    // --- RE-JOIN LOGIC ---
    function getCancelCountKey(eventId: number) {
        const userId = getUserIdFromToken() || "guest";
        const today = new Date().toISOString().split("T")[0];
        return `cancel_count_${userId}_${eventId}_${today}`;
    }

    function getCancelCount(eventId: number): number {
        if (typeof localStorage === "undefined") return 0;
        const key = getCancelCountKey(eventId);
        return parseInt(localStorage.getItem(key) || "0", 10);
    }

    function incrementCancelCount(eventId: number) {
        if (typeof localStorage === "undefined") return;
        const key = getCancelCountKey(eventId);
        const current = getCancelCount(eventId);
        localStorage.setItem(key, (current + 1).toString());
    }

    // --- REJOIN HELPER FUNCTIONS ---
    const MAX_REJOIN_COUNT = 5;

    function canRejoin(event: EventItem): boolean {
        return (
            event.status === "CANCELED" &&
            (event.rejoin_count ?? 0) < MAX_REJOIN_COUNT &&
            !event.isLocked // ถ้ากิจกรรมเลยเวลา (isLocked) จะไม่ให้ rejoin
        );
    }

    function getRemainingRejoins(event: EventItem): number {
        return MAX_REJOIN_COUNT - (event.rejoin_count ?? 0);
    }

    async function handleReJoin(event: EventItem) {
        const token = getToken();
        if (!token) {
            Swal.fire(
                t[lang].alert_error,
                t[lang].alert_session_expired,
                "error",
            );
            return;
        }

        // Must have participation_id for cancelled events
        if (!event.participation_id) {
            Swal.fire({
                icon: "error",
                title: lang === "th" ? "เกิดข้อผิดพลาด" : "Error",
                text:
                    lang === "th"
                        ? "ไม่พบข้อมูลการเข้าร่วม กรุณารีเฟรชหน้าจอ"
                        : "Participation data not found. Please refresh.",
            });
            return;
        }

        // Check if user can rejoin
        if (!canRejoin(event)) {
            Swal.fire({
                icon: "warning",
                title:
                    lang === "th"
                        ? "ไม่สามารถกลับเข้าร่วมได้"
                        : "Cannot Rejoin",
                text:
                    lang === "th"
                        ? "ใช้สิทธิ์กลับเข้าร่วมครบ 5 ครั้งแล้ว"
                        : "You have used all 5 rejoin attempts",
            });
            return;
        }

        // Show confirmation dialog
        const remaining = getRemainingRejoins(event);
        const confirmResult = await Swal.fire({
            icon: "question",
            title: lang === "th" ? "ยืนยันการกลับเข้าร่วม" : "Confirm Rejoin",
            html:
                lang === "th"
                    ? `คุณต้องการกลับเข้าร่วมกิจกรรมนี้ใช่หรือไม่?<br><br><span style="color: #f59e0b; font-weight: 600;">เหลือสิทธิ์ ${remaining} ครั้ง</span>`
                    : `Do you want to rejoin this event?<br><br><span style="color: #f59e0b; font-weight: 600;">${remaining} attempts remaining</span>`,
            showCancelButton: true,
            confirmButtonText: lang === "th" ? "ยืนยัน" : "Confirm",
            cancelButtonText: lang === "th" ? "ยกเลิก" : "Cancel",
            confirmButtonColor: "#8b5cf6",
            cancelButtonColor: "#6b7280",
        });

        if (!confirmResult.isConfirmed) {
            return;
        }

        Swal.fire({
            title: lang === "th" ? "กำลังดำเนินการ..." : "Processing...",
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
        });

        try {
            // Use rejoin endpoint to reset cancelled participation
            const res = await fetch(
                `${BASE_URL}/api/participations/${event.participation_id}/rejoin`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            Swal.close();

            if (res.ok) {
                const data = await res.json();
                const newJoinCode = data.join_code || "";

                // Close modal first
                closeModal();

                // Show success with new join code
                await Swal.fire({
                    icon: "success",
                    title:
                        lang === "th"
                            ? "กลับเข้าร่วมกิจกรรมสำเร็จ!"
                            : "Rejoin Successful!",
                    html: newJoinCode
                        ? lang === "th"
                            ? `<p style="margin-bottom: 10px;">รหัสใหม่ของคุณ:</p><p style="font-size: 2rem; font-weight: bold; color: #10b981; letter-spacing: 8px;">${newJoinCode}</p>`
                            : `<p style="margin-bottom: 10px;">Your new code:</p><p style="font-size: 2rem; font-weight: bold; color: #10b981; letter-spacing: 8px;">${newJoinCode}</p>`
                        : undefined,
                    confirmButtonText: lang === "th" ? "ตกลง" : "OK",
                    confirmButtonColor: "#10b981",
                });

                await loadData();
            } else {
                const errData = await res.json().catch(() => ({}));
                // Use Thai error message from backend directly
                const errMsg =
                    errData.detail ||
                    errData.message ||
                    (lang === "th"
                        ? "ไม่สามารถกลับเข้าร่วมได้"
                        : "Cannot rejoin event");

                Swal.fire({
                    icon: "error",
                    title: lang === "th" ? "เกิดข้อผิดพลาด" : "Error",
                    text: errMsg,
                });
            }
        } catch (e: any) {
            Swal.close();
            console.error("Rejoin error:", e);
            Swal.fire({
                icon: "error",
                title: lang === "th" ? "เกิดข้อผิดพลาด" : "Error",
                text:
                    e.message ||
                    (lang === "th"
                        ? "การเชื่อมต่อล้มเหลว"
                        : "Connection failed"),
            });
        }
    }

    // --- DASHBOARD STATE ---
    let showDashboardModal = false;
    let dashboardEvent: EventItem | null = null;
    function openDashboard(event: EventItem) {
        dashboardEvent = event;
        showDashboardModal = true;
    }

    function closeDashboard() {
        showDashboardModal = false;
        setTimeout(() => {
            dashboardEvent = null;
        }, 300);
    }

    // --- HELPER FUNCTIONS ---
    function calculateTotalValidDays(
        startStr: string,
        endStr: string,
        eventId: number,
    ): number {
        if (!startStr || !endStr) return 0;

        // Parse date ให้ถูกต้องโดยพิจารณา timezone
        const parseToLocalDate = (s: string): Date => {
            // ถ้าเป็น ISO format ที่มี Z (UTC) ให้แปลงเป็น local time ก่อน
            if (s.includes("Z") || s.includes("+")) {
                const d = new Date(s);
                return new Date(d.getFullYear(), d.getMonth(), d.getDate());
            }
            // ถ้าเป็น format ไม่มี timezone (YYYY-MM-DDTHH:mm:ss หรือ YYYY-MM-DD)
            const datePart = s.includes("T") ? s.split("T")[0] : s;
            const [y, m, d] = datePart.split("-").map(Number);
            return new Date(y, m - 1, d);
        };

        const start = parseToLocalDate(startStr);
        const end = parseToLocalDate(endStr);

        if (end < start) return 0;

        let count = 0;
        let curr = new Date(start);
        while (curr <= end) {
            if (!checkIsHoliday(curr, eventId)) {
                count++;
            }
            curr.setDate(curr.getDate() + 1);
        }
        return count;
    }

    function getDraftKey(participationId: number) {
        return `proof_draft_${participationId}`;
    }
    function saveDraft(step: number) {
        if (!selectedEvent) return;
        const data = { step: step, link: sendingLink, dist: distanceInput };
        localStorage.setItem(
            getDraftKey(selectedEvent.participation_id),
            JSON.stringify(data),
        );
    }
    function clearDraft(participationId: number) {
        localStorage.removeItem(getDraftKey(participationId));
    }
    function selectView(id: string, path: string) {
        currentView = id;
        isMobileMenuOpen = false;
        goto(path);
    }

    function toggleDetails(listType: "upcoming" | "history", index: number) {
        if (listType === "upcoming") {
            const item = filteredUpcoming[index];
            item.isExpanded = !item.isExpanded;
            upcomingEvents = [...upcomingEvents];
        } else {
            const item = filteredHistory[index];
            item.isExpanded = !item.isExpanded;
            historyEvents = [...historyEvents];
        }
    }

    function scrollToHistory() {
        const container = document.querySelector(
            ".scroll-container",
        ) as HTMLElement | null;
        const el = document.getElementById("history-section");
        if (container && el)
            container.scrollTo({ top: el.offsetTop, behavior: "smooth" });
        else el?.scrollIntoView({ behavior: "smooth" });
    }
    function scrollToUpcoming() {
        const container = document.querySelector(
            ".scroll-container",
        ) as HTMLElement | null;
        const el = document.getElementById("upcoming-section");
        if (container && el)
            container.scrollTo({ top: el.offsetTop, behavior: "smooth" });
        else el?.scrollIntoView({ behavior: "smooth" });
    }

    function getStepFromStatus(status: string) {
        switch (status) {
            case "JOINED":
                return 1;
            case "CHECKED_IN":
                return 2;
            case "proof_submitted":
            case "REJECTED":
                return 3;
            case "CHECKED_OUT":
                return 4;
            default:
                return 0;
        }
    }

    function getDisplayDate(start?: string, end?: string, l: string = "th") {
        if (!start) return "-";
        const locale = l === "th" ? "th-TH" : "en-GB";
        const opts: Intl.DateTimeFormatOptions = {
            day: "numeric",
            month: "short",
            year: "numeric",
        };

        // Parse date ให้ถูกต้องโดยพิจารณา timezone
        const parseToLocalDate = (s: string): Date | null => {
            if (!s) return null;
            // ถ้าเป็น ISO format ที่มี Z (UTC) ให้แปลงเป็น local time ก่อน
            if (s.includes("Z") || s.includes("+")) {
                const d = new Date(s);
                return new Date(d.getFullYear(), d.getMonth(), d.getDate());
            }
            // ถ้าเป็น format ไม่มี timezone (YYYY-MM-DDTHH:mm:ss หรือ YYYY-MM-DD)
            const datePart = s.includes("T") ? s.split("T")[0] : s;
            const [y, m, d] = datePart.split("-").map(Number);
            return new Date(y, m - 1, d);
        };

        const sDate = parseToLocalDate(start);
        if (!sDate) return "-";
        const sText = sDate.toLocaleDateString(locale, opts);

        if (end) {
            const eDate = parseToLocalDate(end);
            if (eDate && sDate.getTime() !== eDate.getTime()) {
                const eText = eDate.toLocaleDateString(locale, opts);
                return `${sText} - ${eText}`;
            }
        }
        return sText;
    }

    function checkIsHoliday(date: Date, eventId: number): boolean {
        const config = holidaysMap[eventId];
        if (!config) return false;

        if (config.excludeWeekends) {
            const day = date.getDay();
            if (day === 0 || day === 6) return true;
        }

        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        const dateStr = `${y}-${m}-${d}`;
        if (config.holidays && config.holidays.includes(dateStr)) {
            return true;
        }

        return false;
    }

    function isSameDate(d1: Date, d2: Date) {
        return (
            d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate()
        );
    }

    function getNextWorkingDay(startDate: Date, eventId: number): Date {
        let nextDate = new Date(startDate);
        do {
            nextDate.setDate(nextDate.getDate() + 1);
        } while (checkIsHoliday(nextDate, eventId));
        return nextDate;
    }

    // --- CANCEL FUNCTIONS ---
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
        if (
            selectedCancelReason.includes("Other") ||
            selectedCancelReason.includes("อื่นๆ")
        ) {
            if (!otherCancelReason.trim()) {
                Swal.fire({
                    icon: "warning",
                    title:
                        lang === "th"
                            ? "ยังไม่ได้ระบุสาเหตุการยกเลิกกิจกรรม"
                            : "Reason not specified",
                    text:
                        lang === "th"
                            ? "กรุณาระบุรายละเอียดเพิ่มเติม"
                            : "Please provide more details",
                    confirmButtonColor: "#f59e0b",
                });
                return;
            }
            finalReason = otherCancelReason;
        }

        try {
            const token = getToken();
            if (!token) {
                Swal.fire(
                    t[lang].alert_error,
                    t[lang].alert_session_expired,
                    "error",
                );
                return;
            }

            const participationId = eventToCancel.participation_id;
            if (!participationId) {
                Swal.fire(
                    t[lang].alert_error,
                    "Invalid participation",
                    "error",
                );
                return;
            }

            const res = await fetch(
                `${BASE_URL}/api/participations/${participationId}/cancel`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ cancellation_reason: finalReason }),
                },
            );

            if (res.ok) {
                // Update local state
                incrementCancelCount(eventToCancel.id); // Add this line

                upcomingEvents = upcomingEvents.filter(
                    (e) => e.participation_id !== participationId,
                );

                Swal.fire({
                    icon: "success",
                    title:
                        lang === "th"
                            ? "ยกเลิกเรียบร้อยแล้ว"
                            : "Cancelled successfully",
                    timer: 1500,
                    showConfirmButton: false,
                });
                closeCancelModal();

                // Reload data
                await loadData();
            } else {
                const err = await res.json();
                Swal.fire(t[lang].alert_error, err.detail || "Error", "error");
            }
        } catch (err) {
            Swal.fire(
                t[lang].alert_error,
                t[lang].alert_connection_error,
                "error",
            );
        }
    }

    async function openActionModal(event: EventItem) {
        const token = getToken();
        if (!token) {
            Swal.fire(
                t[lang].alert_error,
                t[lang].alert_session_expired,
                "error",
            );
            return;
        }

        Swal.showLoading();
        // 1. ดึงสถานะล่าสุดจาก Backend
        const resData = await fetchMyStatus(event.id);
        Swal.close();

        let updatedEvent = { ...event };
        let statusData = null;

        // 2. แปลงข้อมูลจาก Backend เป็น UI
        if (resData && resData.codes && resData.codes.length > 0) {
            statusData = resData.codes[0];
        } else if (resData && normalizeCode(resData).join_code) {
            statusData = resData;
        }

        // [ตรวจสอบเฉพาะวันนี้] ถ้าข้อมูลเป็นของวันเก่า ให้ถือว่าไม่มีข้อมูล
        // [ตรวจสอบเฉพาะวันนี้] ถ้าข้อมูลเป็นของวันเก่า ให้ถือว่าไม่มีข้อมูล
        // [FIX] ลบการเช็ควันที่เนื่องจาก Timezone ของ Server อาจไม่ตรงกับ Client
        // ทำให้ Code ที่ถูกต้องถูกลบไป (statusData = null)
        /*
    if (statusData) {
        const recordDateStr = statusData.created_at || statusData.date || statusData.start_date;
        if (recordDateStr) {
            const rDate = new Date(recordDateStr);
            const today = getDebugDate();
            rDate.setHours(0,0,0,0);
            today.setHours(0,0,0,0);

            // ถ้าไม่ใช่วันนี้ -> ให้ทิ้งข้อมูลนี้ไปเลย (Force Null)
            if (rDate.getTime() !== today.getTime()) {
                console.log("Status data is from different day, clearing it");
                statusData = null; 
            }
        }
    }
    */

        // ถ้ายังมี statusData (แปลว่าเป็นของวันนี้) ก็ Map ตามปกติ
        if (statusData) {
            updatedEvent.participation_id =
                statusData.id || updatedEvent.participation_id;
            updatedEvent.status = mapApiStatusToUi(statusData.status);
            const normalized = normalizeCode(statusData);
            updatedEvent.join_code = normalized.join_code || "";
            updatedEvent.completion_code = normalized.completion_code;
            updatedEvent.rejection_reason =
                statusData.rejection_reason ||
                statusData.reject_reason ||
                statusData.rejectionReason;
            updatedEvent.isJoined = true;
        } else {
            // ถ้าไม่มีข้อมูล (หรือถูกกรองทิ้งเมื่อกี้) ให้รีเซ็ตสถานะเพื่อให้พร้อมสมัครใหม่
            updatedEvent.status = "JOINED";
            updatedEvent.join_code = "";
            updatedEvent.isJoined = false;
        }

        // If no server status and no client join_code -> prompt to register
        if (!statusData && !event.join_code) {
            Swal.fire({
                icon: "info",
                title: "ยังไม่ได้สมัครวันนี้",
                text: 'กรุณาสมัครกิจกรรมนี้จากหน้า "ค้นหากิจกรรม" ก่อน',
                confirmButtonText: "ไปสมัคร",
            }).then((result) => {
                if (result.isConfirmed) navigateToEventList("student");
            });
            return;
        }

        // [REMOVED] ลบระบบสมัครอัตโนมัติ (joinDailyEvent)
        // ผู้ใช้จะต้องสมัครเฉพาะวันที่ต้องการเท่านั้น จากหน้า event-list
        // ถ้า updatedEvent.status เป็น JOINED และไม่มี join_code แสดงว่ายังไม่ได้สมัครสำหรับวันนี้
        // แค่ข้อมูลเก่าจากวันก่อนหน้านี้ (ซึ่งถูก auto-cancel แล้วในส่วน processData)
        // --------------------------------------------------------

        if (updatedEvent.status === "COMPLETED") {
            Swal.fire("Completed", "คุณทำรายการเสร็จสิ้นแล้ว", "success");
            return;
        }

        // --- Show checkout_code for CHECKED_OUT (single_day & multi_day) ---
        if (updatedEvent.status === "CHECKED_OUT") {
            try {
                const checkoutRes = await fetch(
                    `${BASE_URL}/api/participations/${updatedEvent.participation_id}/checkout-code`,
                    {
                        method: "GET",
                        headers: { Authorization: `Bearer ${token}` },
                    },
                );
                if (checkoutRes.ok) {
                    const data = await checkoutRes.json();
                    updatedEvent.completion_code = data.checkout_code;
                    // Swal.fire({
                    //     icon: 'success',
                    //     title: 'Checkout Code',
                    //     html: `<div style=\"font-size:2em;font-weight:bold;\">${data.checkout_code}</div><div style=\"margin-top:8px;\">${data.message || ''}</div>`,
                    //     confirmButtonText: 'OK',
                    //     confirmButtonColor: '#10b981'
                    // });
                } else {
                    updatedEvent.completion_code = undefined;
                }
            } catch (e) {
                updatedEvent.completion_code = undefined;
            }
        }

        selectedEvent = updatedEvent;
        currentParticipationId = updatedEvent.participation_id;
        checkInMethod = "PIN";
        // ✅ Resolve proof image URL to full API URL
        proofImage = updatedEvent.proof_image_url
            ? resolveImageUrl(updatedEvent.proof_image_url)
            : null;

        if (
            updatedEvent.status === "CHECKED_IN" ||
            updatedEvent.status === "proof_submitted" ||
            updatedEvent.status === "REJECTED"
        ) {
            const draftJson = localStorage.getItem(
                getDraftKey(updatedEvent.participation_id),
            );
            if (draftJson) {
                try {
                    const draft = JSON.parse(draftJson);
                    sendingLink = draft.link || "";
                    distanceInput = draft.dist || 0;
                } catch (e) {}
            }
        }

        showModal = true;
    }

    function closeModal() {
        showModal = false;
        setTimeout(() => {
            selectedEvent = null;
        }, 300);
    }

    // Prevent background scrolling when modal is open
    $: if (typeof window !== "undefined") {
        try {
            document.body.style.overflow = showModal ? "hidden" : "";
        } catch (e) {
            /* ignore */
        }
    }

    async function handleImageUpload(e: Event) {
        const target = e.target as HTMLInputElement;
        if (target.files && target.files[0]) {
            const originalFile = target.files[0];

            // แสดง Loading ระหว่างย่อรูป
            Swal.fire({
                title: "Processing Image...",
                text: "กำลังปรับขนาดรูปภาพ",
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading(),
            });

            try {
                // เรียกใช้ฟังก์ชันย่อรูป
                const compressedFile = await compressImage(originalFile);
                proofFile = compressedFile; // เก็บไฟล์ที่ย่อแล้วเตรียมส่ง

                // แสดง Preview จากไฟล์ที่ย่อแล้ว
                const reader = new FileReader();
                reader.onload = (e) => {
                    proofImage = e.target?.result as string;
                    Swal.close(); // ปิด Loading เมื่อเสร็จ
                };
                reader.readAsDataURL(compressedFile);
            } catch (error) {
                console.error("Compression error:", error);
                Swal.fire("Error", "ไม่สามารถประมวลผลรูปภาพได้", "error");
            }
        }
    }

    /**
     * Validate and check Strava link
     * Supports multiple Strava URL formats:
     * - https://www.strava.com/activities/12345
     * - https://strava.app.link/xxxxx
     * - https://strava.com/activities/12345
     */
    function isValidStravaLink(url: string): boolean {
        if (!url || url.trim() === "") return false;

        const stravaPatterns = [
            /^https?:\/\/(www\.)?strava\.com\/activities\/\d+/i,
            /^https?:\/\/strava\.app\.link\//i,
            /^https?:\/\/(www\.)?strava\.com\/athletes\/\d+\/activities\//i,
        ];

        return stravaPatterns.some((pattern) => pattern.test(url.trim()));
    }

    /**
     * Extract activity ID from Strava URL
     */
    function extractStravaActivityId(url: string): string | null {
        // Match /activities/12345
        const activityMatch = url.match(/\/activities\/(\d+)/);
        if (activityMatch) return activityMatch[1];

        // For short links, we need to resolve them server-side
        if (url.includes("strava.app.link")) {
            return null; // Need server to resolve
        }

        return null;
    }

    async function checkStravaLink() {
        if (!sendingLink || sendingLink.trim() === "") {
            Swal.fire(
                t[lang].alert_warning,
                t[lang].alert_link_required,
                "warning",
            );
            return;
        }

        const trimmedLink = sendingLink.trim();

        // Validate Strava URL format
        if (!isValidStravaLink(trimmedLink)) {
            Swal.fire({
                icon: "error",
                title: t[lang].alert_error,
                html: `${t[lang].alert_link_invalid}<br><br>
              <small style="color:#666;">รูปแบบที่รองรับ:<br>
              • https://www.strava.com/activities/12345<br>
              • https://strava.app.link/xxxxx</small>`,
            });
            return;
        }

        Swal.fire({
            title: t[lang].alert_checking,
            text: t[lang].alert_fetching_strava,
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
        });

        try {
            // Use Backend API endpoint for Strava parsing
            const res = await apiRequest("/api/strava/parse", {
                method: "POST",
                body: JSON.stringify({ url: trimmedLink }),
            });

            Swal.close();

            if (res.ok) {
                const result = await res.json();

                if (result.success && result.distance_km) {
                    distanceInput = Number(result.distance_km) || 0;
                    stravaVerified = true; // Mark as verified
                    lastVerifiedLink = trimmedLink; // Save verified link
                    Swal.fire({
                        icon: "success",
                        title:
                            lang === "th"
                                ? "ดึงข้อมูลสำเร็จ!"
                                : "Data Retrieved!",
                        html: `<div style="text-align:left;">
                        <p><b>${lang === "th" ? "ระยะทาง" : "Distance"}:</b> ${distanceInput.toFixed(2)} km</p>
                        ${result.moving_time ? `<p><b>${lang === "th" ? "เวลา" : "Time"}:</b> ${result.moving_time}</p>` : ""}
                        ${result.activity_name ? `<p><b>${lang === "th" ? "กิจกรรม" : "Activity"}:</b> ${result.activity_name}</p>` : ""}
                      </div>`,
                        timer: 3000,
                        showConfirmButton: true,
                        confirmButtonText: "OK",
                    });
                } else if (result.distance_km === 0 || result.distance_km) {
                    // API returned but distance is 0
                    distanceInput = Number(result.distance_km) || 0;
                    stravaVerified = true; // Mark as verified
                    lastVerifiedLink = trimmedLink; // Save verified link
                    Swal.fire({
                        icon: "info",
                        title: lang === "th" ? "พบข้อมูล" : "Data Found",
                        text: `${lang === "th" ? "ระยะทาง" : "Distance"}: ${distanceInput} km`,
                        timer: 2000,
                        showConfirmButton: false,
                    });
                } else {
                    // API didn't return distance - ask user to input manually
                    await promptManualDistance();
                }
            } else if (res.status === 404 || res.status === 400) {
                // API endpoint doesn't exist or bad request - allow manual input
                await promptManualDistance();
            } else {
                throw new Error(`Server error: ${res.status}`);
            }
        } catch (error: any) {
            console.error("Strava check error:", error);
            Swal.close();

            // If API fails, allow manual input
            await promptManualDistance();
        }
    }

    async function promptManualDistance() {
        const result = await Swal.fire({
            icon: "info",
            title: lang === "th" ? "กรอกระยะทาง" : "Enter Distance",
            html: `<p style="margin-bottom:10px;">${
                lang === "th"
                    ? "ไม่สามารถดึงข้อมูลจาก Strava อัตโนมัติได้<br>กรุณากรอกระยะทางด้วยตนเอง"
                    : "Could not fetch Strava data automatically.<br>Please enter distance manually."
            }</p>`,
            input: "number",
            inputLabel: lang === "th" ? "ระยะทาง (กิโลเมตร)" : "Distance (km)",
            inputPlaceholder: "0.00",
            inputAttributes: {
                min: "0",
                step: "0.01",
            },
            showCancelButton: true,
            confirmButtonText: lang === "th" ? "ยืนยัน" : "Confirm",
            cancelButtonText: lang === "th" ? "ยกเลิก" : "Cancel",
            inputValidator: (value) => {
                if (!value || Number(value) <= 0) {
                    return lang === "th"
                        ? "กรุณากรอกระยะทางที่มากกว่า 0"
                        : "Please enter distance greater than 0";
                }
                return null;
            },
        });

        if (result.isConfirmed && result.value) {
            distanceInput = Number(result.value);
            stravaVerified = true; // Mark as verified
            lastVerifiedLink = sendingLink?.trim() || ""; // Save verified link
            Swal.fire({
                icon: "success",
                title: "OK",
                text: `${lang === "th" ? "ระยะทาง" : "Distance"}: ${distanceInput} km`,
                timer: 1500,
                showConfirmButton: false,
            });
        }
    }

    function goToStep3_Proof() {
        // ✅ บังคับ: ต้องมี Strava Link
        if (!sendingLink || sendingLink.trim() === "") {
            Swal.fire(
                t[lang].alert_warning,
                t[lang].alert_link_required,
                "warning",
            );
            return;
        }

        // ✅ บังคับ: ต้องกดปุ่มตรวจสอบ Strava Link
        if (!stravaVerified) {
            Swal.fire(
                t[lang].alert_warning,
                lang === "th"
                    ? 'กรุณากดปุ่ม "🔍 ตรวจสอบลิงก์" เพื่อยืนยันว่า Link Strava ถูกต้อง'
                    : 'Please click "🔍 Verify Link" to confirm your Strava link is valid',
                "warning",
            );
            return;
        }

        // ✅ บังคับ: ต้องมี Link ที่ valid
        if (!isValidStravaLink(sendingLink.trim())) {
            Swal.fire(t[lang].alert_error, t[lang].alert_link_invalid, "error");
            return;
        }

        // ✅ ต้องมีระยะทางมากกว่า 0
        if (distanceInput <= 0) {
            Swal.fire(
                t[lang].alert_warning,
                t[lang].alert_verify_first,
                "warning",
            );
            return;
        }

        // ✅ บังคับ: ต้องมีรูปภาพหลักฐาน
        if (!proofFile && !selectedEvent?.proof_image_url) {
            Swal.fire(
                t[lang].alert_warning,
                lang === "th"
                    ? "กรุณาอัปโหลดรูปภาพหลักฐาน (บังคับ)"
                    : "Please upload proof image (Required)",
                "warning",
            );
            return;
        }

        if (selectedEvent) {
            updateEventInLists(selectedEvent.id, { status: "proof_submitted" });
            saveDraft(3);
        }
    }
    async function submitProofAction() {
        if (!selectedEvent) return;
        const token = getToken();
        if (!token) {
            Swal.fire(
                t[lang].alert_error,
                t[lang].alert_session_expired,
                "error",
            );
            return;
        }

        // 1. Validate Participation ID
        if (!selectedEvent.participation_id) {
            Swal.fire(
                "Error",
                "ไม่พบรหัสการเข้าร่วม (Participation ID) - กรุณารีเฟรชหน้าจอ",
                "error",
            );
            return;
        }

        // 2. ✅ บังคับ: ต้องมี Strava Link
        if (!sendingLink || sendingLink.trim() === "") {
            Swal.fire(
                t[lang].alert_warning,
                t[lang].alert_link_required,
                "warning",
            );
            return;
        }

        // 3. ✅ บังคับ: ต้องเป็น Strava Link ที่ถูกต้อง
        if (!isValidStravaLink(sendingLink.trim())) {
            Swal.fire(t[lang].alert_error, t[lang].alert_link_invalid, "error");
            return;
        }

        // 4. ✅ บังคับ: ต้องกดปุ่มตรวจสอบ Strava แล้ว
        if (!stravaVerified) {
            Swal.fire(
                t[lang].alert_warning,
                lang === "th"
                    ? 'กรุณากดปุ่ม "🔍 ตรวจสอบลิงก์" เพื่อยืนยัน Strava Link ก่อนส่งหลักฐาน'
                    : 'Please click "🔍 Verify Link" to confirm your Strava link before submitting',
                "warning",
            );
            return;
        }

        // 5. ✅ บังคับ: ต้องมีรูปภาพหลักฐาน
        if (!proofFile && !selectedEvent.proof_image_url) {
            Swal.fire(
                t[lang].alert_warning,
                lang === "th"
                    ? "กรุณาอัปโหลดรูปภาพหลักฐาน (บังคับ)"
                    : "Please upload proof image (Required)",
                "warning",
            );
            return;
        }

        try {
            // Ensure we have the latest participation context (fresh participation_id) before submitting
            try {
                const statusRes = await fetchMyStatus(selectedEvent.id);
                if (statusRes) {
                    let statusData = null;
                    if (statusRes.codes && statusRes.codes.length > 0)
                        statusData = statusRes.codes[0];
                    else if (normalizeCode(statusRes).join_code)
                        statusData = statusRes;
                    if (
                        statusData &&
                        statusData.id &&
                        statusData.id !== selectedEvent.participation_id
                    ) {
                        const oldId = selectedEvent.participation_id;
                        selectedEvent.participation_id = statusData.id;
                        currentParticipationId = statusData.id;
                        // migrate draft if present
                        try {
                            if (typeof localStorage !== "undefined" && oldId) {
                                const oldKey = getDraftKey(oldId);
                                const newKey = getDraftKey(statusData.id);
                                const oldDraft = localStorage.getItem(oldKey);
                                if (oldDraft) {
                                    localStorage.setItem(newKey, oldDraft);
                                    localStorage.removeItem(oldKey);
                                }
                            }
                        } catch (e) {}
                    }
                }
            } catch (e) {
                console.warn(
                    "Failed to refresh participation status before submit",
                    e,
                );
            }

            Swal.showLoading();
            let finalImageUrl = selectedEvent.proof_image_url || "";

            // 4. Upload Image (If new file selected) - Using centralized uploadImage
            if (proofFile) {
                const { uploadImage } = await import("$lib/utils/imageUtils");
                const upData = await uploadImage(proofFile, "proofs");
                finalImageUrl = upData.url;
            }

            // 5. Prepare Payload
            const payload = {
                proof_image_url: finalImageUrl,
                strava_link: sendingLink,
                actual_distance_km: Number(distanceInput),
            };

            // เริ่มต้นด้วยการเดาว่าเป็น POST (หรือ PUT ถ้า REJECTED)
            let isResubmit = selectedEvent.status === "REJECTED";
            let endpoint = isResubmit
                ? `${BASE_URL}/api/participations/${selectedEvent.participation_id}/resubmit-proof`
                : `${BASE_URL}/api/participations/${selectedEvent.participation_id}/submit-proof`;
            let method = isResubmit ? "PUT" : "POST";

            let res = await fetch(endpoint, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            // [FIX: AUTO RETRY] ถ้าส่ง POST แล้วเจอ Error 400 (Invalid participation)
            // แสดงว่า Backend ต้องการให้ส่งแบบ PUT (Resubmit) -> ให้ลองส่งใหม่ทันที
            if (!res.ok && res.status === 400 && method === "POST") {
                console.warn(
                    "⚠️ POST failed (400). Switching to RESUBMIT (PUT)...",
                );

                endpoint = `${BASE_URL}/api/participations/${selectedEvent.participation_id}/resubmit-proof`;
                method = "PUT";

                res = await fetch(endpoint, {
                    method: method,
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(payload),
                });
            }

            if (res.ok) {
                Swal.fire(
                    t[lang].alert_success_title,
                    t[lang].alert_submit_success,
                    "success",
                );
                if (currentParticipationId) clearDraft(currentParticipationId);

                if (selectedEvent) {
                    // Optimistic local update for immediate UX
                    updateEventInLists(selectedEvent.id, {
                        status: "proof_submitted",
                        proof_image_url: finalImageUrl || undefined,
                    });
                }
                closeModal();
                // Reconcile authoritative state from server
                await loadData();
            } else {
                const errData = await res.json().catch(() => ({}));
                console.error("❌ Submit Error Detail:", errData);
                throw new Error(
                    errData.message ||
                        errData.detail ||
                        `Submit Failed (${res.status})`,
                );
            }
        } catch (err: any) {
            console.error(err);
            Swal.fire(t[lang].alert_error, err.message, "error");
        }
    }

    function handleBackToStrava() {
        if (selectedEvent) {
            if (selectedEvent.rejection_reason) {
                updateEventInLists(selectedEvent.id, { status: "REJECTED" });
            } else {
                updateEventInLists(selectedEvent.id, { status: "CHECKED_IN" });
            }
            saveDraft(2);
        }
    }

    // --- AUTO-REFRESH POLLING FUNCTIONS ---
    function startPolling() {
        if (pollInterval) return; // Already polling
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
        const token = getToken();
        const userId = getUserIdFromToken();
        if (!token || !userId) return;

        try {
            const resPart = await fetch(
                `${BASE_URL}/api/participations/user/${userId}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                },
            );

            if (!resPart.ok) return;

            const newParticipations = await resPart.json();

            // More robust change detection by event_id (handles new rounds / new participation ids)
            const newByEvent: Record<number, any> = {};
            newParticipations.forEach((p: any) => {
                if (p && p.event_id) newByEvent[p.event_id] = p;
            });
            const oldByEvent: Record<number, any> = {};
            rawParticipations.forEach((p: any) => {
                if (p && p.event_id) oldByEvent[p.event_id] = p;
            });

            let hasChanges = false;
            for (const k of Object.keys(newByEvent)) {
                const eid = Number(k);
                const np = newByEvent[eid];
                const op = oldByEvent[eid];
                if (!op || op.status !== np.status || op.id !== np.id) {
                    hasChanges = true;
                    break;
                }
            }
            if (
                !hasChanges &&
                Object.keys(newByEvent).length !==
                    Object.keys(oldByEvent).length
            )
                hasChanges = true;

            if (hasChanges) {
                console.log("✅ Detected changes, updating UI...");
                rawParticipations = newParticipations;
                processData();
            }
        } catch (err) {
            // Silently ignore errors in background refresh
        }
    }

    // Visibility change handler for pausing/resuming polling
    function handleVisibilityChange() {
        if (document.hidden) {
            stopPolling();
        } else {
            startPolling();
        }
    }

    onMount(async () => {
        const savedLang = localStorage.getItem("app_lang");
        if (savedLang === "th" || savedLang === "en") {
            lang = savedLang;
        }
        startSessionTimer();
        await loadData();

        // Start realtime polling
        startPolling();

        // Pause/resume when tab visibility changes
        document.addEventListener("visibilitychange", handleVisibilityChange);

        // Pause when offline, resume when online
        window.addEventListener("offline", stopPolling);
        window.addEventListener("online", startPolling);

        // Pause polling while user is actively scrolling to avoid cancelling momentum
        const sc = document.querySelector(
            ".scroll-container",
        ) as HTMLElement | null;

        // Debounce helper to restart polling only after scrolling has stopped
        function createDebounced(fn: () => void, delay: number) {
            let timer: ReturnType<typeof setTimeout> | null = null;
            return () => {
                if (timer) {
                    clearTimeout(timer);
                }
                timer = setTimeout(fn, delay);
            };
        }

        const debouncedStartPolling = createDebounced(() => {
            // Only restart if polling is not already active
            if (!pollInterval) {
                startPolling();
            }
        }, 700);

        // Single scroll handler (debounced restart)
        function onUserScroll() {
            if (pollInterval) {
                stopPolling();
            }
            debouncedStartPolling();
        }

        // attach listener and store for cleanup via closure
        if (sc) sc.addEventListener("scroll", onUserScroll);
        (onMount as any).__sc = sc;
        (onMount as any).__onUserScroll = onUserScroll;
    });

    onDestroy(() => {
        if (timerInterval) clearInterval(timerInterval);
        stopPolling();
        document.removeEventListener(
            "visibilitychange",
            handleVisibilityChange,
        );
        window.removeEventListener("offline", stopPolling);
        window.removeEventListener("online", startPolling);
        // remove scroll listener and clear timer
        try {
            const sc = (onMount as any).__sc as HTMLElement | null;
            const onUserScroll = (onMount as any)
                .__onUserScroll as EventListener;
            if (sc && onUserScroll)
                sc.removeEventListener("scroll", onUserScroll as EventListener);
        } catch (e) {}
        if (userScrollTimer) clearTimeout(userScrollTimer);
    });

    // [เพิ่มใหม่] ฟังก์ชันย่อรูปภาพ (Client-side Compression)
    async function compressImage(
        file: File,
        maxWidth = 1200,
        quality = 0.7,
    ): Promise<File> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement("canvas");
                    let width = img.width;
                    let height = img.height;

                    // คำนวณ Ratio
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext("2d");
                    ctx?.drawImage(img, 0, 0, width, height);

                    // แปลงกลับเป็น File (JPEG)
                    canvas.toBlob(
                        (blob) => {
                            if (blob) {
                                const newFile = new File(
                                    [blob],
                                    file.name.replace(/\.[^/.]+$/, ".jpg"),
                                    {
                                        type: "image/jpeg",
                                        lastModified: Date.now(),
                                    },
                                );
                                resolve(newFile);
                            } else {
                                reject(new Error("Image compression failed"));
                            }
                        },
                        "image/jpeg",
                        quality,
                    );
                };
            };
            reader.onerror = (error) => reject(error);
        });
    }
</script>

<div class="app-container">
    <header class="header-bar">
        <div class="header-inner">
            <div class="left-group">
                <div class="brand"><span class="brand-name">STUDENT</span></div>
                <nav class="nav-menu desktop-only">
                    {#each menuItems as item}
                        <button
                            class="menu-btn"
                            class:active={currentView === item.id}
                            on:click={() => selectView(item.id, item.path)}
                        >
                            <svg
                                class="nav-icon"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                ><path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="1.5"
                                    d={item.svg}
                                ></path></svg
                            >
                            <span class="btn-label">{item.label}</span>
                        </button>
                    {/each}
                </nav>
            </div>

            <div class="search-bar-container desktop-only">
                <div class="search-input-wrapper">
                    <svg
                        class="search-icon active-search-icon"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        ><path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        ></path></svg
                    >
                    <input
                        type="text"
                        placeholder={t[lang].search_placeholder}
                        class="search-input"
                        bind:value={searchQuery}
                    />
                </div>
            </div>

            <div class="user-zone">
                <div class="timer-pill">
                    {timeLeftStr}
                </div>

                <div class="lang-switch desktop-only">
                    <button
                        class:active={lang === "th"}
                        on:click={() => setLang("th")}>TH</button
                    >
                    <span class="sep">|</span>
                    <button
                        class:active={lang === "en"}
                        on:click={() => setLang("en")}>EN</button
                    >
                </div>

                <button
                    class="logout-btn desktop-only"
                    aria-label="Logout"
                    on:click={handleLogout}
                    ><svg
                        width="20"
                        height="20"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        ><path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        ></path></svg
                    ></button
                >
                <button
                    class="mobile-toggle mobile-only"
                    aria-label="Toggle menu"
                    on:click={() => (isMobileMenuOpen = !isMobileMenuOpen)}
                    ><svg
                        width="24"
                        height="24"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        ><path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2.5"
                            d="M4 9h16M4 15h16"
                        ></path></svg
                    ></button
                >
            </div>
        </div>
    </header>

    {#if isMobileMenuOpen}
        <div
            class="mobile-overlay"
            role="button"
            tabindex="0"
            aria-label="Close menu"
            on:click={() => (isMobileMenuOpen = false)}
            on:keydown={(e) => {
                if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
                    isMobileMenuOpen = false;
                }
            }}
            transition:fade={{ duration: 200 }}
        ></div>
        <div
            class="mobile-drawer"
            transition:slide={{ axis: "x", duration: 300 }}
        >
            <div class="drawer-header">
                <span class="brand-name" style="font-size: 1.4rem;">MENU</span
                ><button
                    class="close-btn"
                    on:click={() => (isMobileMenuOpen = false)}>&times;</button
                >
            </div>
            <div class="drawer-search">
                <input
                    type="text"
                    placeholder={t[lang].search_placeholder}
                    class="drawer-search-input"
                    bind:value={searchQuery}
                />
            </div>

            <div class="drawer-content">
                {#each menuItems as item}
                    <button
                        class="drawer-item"
                        class:active={currentView === item.id}
                        on:click={() => selectView(item.id, item.path)}
                    >
                        <svg
                            class="nav-icon"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            style="margin-right: 10px;"
                            ><path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d={item.svg}
                            ></path></svg
                        >
                        {item.label}
                    </button>
                {/each}

                <div class="drawer-lang-item">
                    <div class="lang-label-group">
                        <svg
                            class="nav-icon"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            style="margin-right: 10px;"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                            ></path>
                        </svg>
                        Language
                    </div>
                    <div class="lang-toggle-pill">
                        <button
                            class:active={lang === "th"}
                            on:click={() => setLang("th")}>TH</button
                        >
                        <button
                            class:active={lang === "en"}
                            on:click={() => setLang("en")}>EN</button
                        >
                    </div>
                </div>
            </div>

            <button class="drawer-item logout-special" on:click={handleLogout}
                >Logout</button
            >
        </div>
    {/if}

    <div class="scroll-container">
        <div class="content-wrapper">
            <div
                id="upcoming-section"
                class="section-header-wrapper header-row"
            >
                <div class="header-left">
                    <h1 class="section-title">{t[lang].upcoming_header}</h1>
                    <div class="title-underline"></div>
                </div>
                <button class="jump-btn" on:click={scrollToHistory}>
                    {t[lang].history_header}
                    <svg
                        width="16"
                        height="16"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        ><path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M19 9l-7 7-7-7"
                        ></path></svg
                    >
                </button>
            </div>

            {#if loading}
                <div style="text-align: center; color: #94a3b8; padding: 40px;">
                    Loading...
                </div>
            {:else if filteredUpcoming.length === 0}
                <div
                    style="text-align: center; color: #94a3b8; padding: 40px; border: 1px dashed rgba(255,255,255,0.1); border-radius: 12px;"
                >
                    No Active Events
                </div>
            {:else}
                <div class="events-grid">
                    {#each paginatedUpcoming as event, i}
                        <div
                            class="event-card"
                            class:locked-card={event.isLocked}
                        >
                            <div
                                class="card-image"
                                use:lazyLoadBg={event.banner_image_url}
                            >
                                {#if event.isLocked}
                                    <div class="lock-overlay">
                                        <div class="lock-overlay-content">
                                            <div class="lock-icon-circle">
                                                <svg
                                                    width="22"
                                                    height="22"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                    ><path
                                                        stroke-linecap="round"
                                                        stroke-linejoin="round"
                                                        stroke-width="2"
                                                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                                    ></path></svg
                                                >
                                            </div>
                                            <div class="lock-text">
                                                {event.lockMessage ||
                                                    t[lang].btn_locked}
                                            </div>
                                        </div>
                                    </div>
                                {/if}
                            </div>
                            <div class="card-content">
                                <div class="card-header-row">
                                    <h3 class="card-title">{event.title}</h3>
                                    <div class="badges-col">
                                        {#if event.status === "proof_submitted"}
                                            <span class="status-badge running"
                                                >{t[lang].status_waiting}</span
                                            >
                                        {:else if event.status === "REJECTED"}
                                            <span
                                                class="status-badge resubmit-badge"
                                                >{t[lang].status_rejected}</span
                                            >
                                        {:else if event.status === "CHECKED_IN"}
                                            <span
                                                class="status-badge proof-badge"
                                                >{t[lang].status_sending}</span
                                            >
                                        {:else if event.status === "COMPLETED"}
                                            <div
                                                style="display:flex; flex-direction:column; align-items:flex-end; gap:4px;"
                                            >
                                                <span
                                                    class="status-badge completed-btn"
                                                    style="font-size:0.7rem;"
                                                    >{t[lang]
                                                        .status_completed_badge}</span
                                                >
                                                {#if event.completion_rank && event.completion_rank > 0}
                                                    <span
                                                        class="status-badge"
                                                        style="background:#fbbf24; color:#78350f; border:1px solid #f59e0b; font-size: 0.7rem;"
                                                    >
                                                        🏆 {t[lang].rank_label}
                                                        {event.completion_rank}
                                                    </span>
                                                {/if}
                                            </div>
                                        {:else if event.status === "JOINED"}
                                            <span class="status-badge running"
                                                >{t[lang].status_register}</span
                                            >
                                        {:else}
                                            <span class="status-badge running"
                                                >{event.status}</span
                                            >
                                        {/if}
                                        <div
                                            class="count-badge"
                                            style="margin-top: 4px; background-color: #10b981;"
                                        >
                                            🏃 {event.completed_count}
                                            {lang === "th" ? "ครั้ง" : "times"}
                                        </div>
                                    </div>
                                </div>

                                <p
                                    class="card-desc"
                                    class:expanded={event.isExpanded}
                                >
                                    {event.description}
                                </p>

                                {#if event.isExpanded}
                                    <div
                                        class="info-grid"
                                        transition:slide|local={{
                                            duration: 300,
                                        }}
                                    >
                                        <div class="info-pill">
                                            <svg
                                                class="pill-icon"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                                ><path
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    stroke-width="2"
                                                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                                ></path><path
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    stroke-width="2"
                                                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                                ></path></svg
                                            >
                                            <span>{event.location}</span>
                                        </div>

                                        <div class="info-pill">
                                            <svg
                                                class="pill-icon"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                                ><path
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    stroke-width="2"
                                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                ></path></svg
                                            >
                                            <span
                                                >{getDisplayDate(
                                                    event.raw_start_date,
                                                    event.raw_end_date,
                                                    lang,
                                                )}</span
                                            >
                                        </div>

                                        <div class="info-pill">
                                            <svg
                                                class="pill-icon"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                                ><path
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    stroke-width="2"
                                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                                ></path></svg
                                            >
                                            <span
                                                >{formatTime(
                                                    event.raw_start_time || "",
                                                    event.raw_end_time || "",
                                                    lang,
                                                )}</span
                                            >
                                        </div>

                                        <div class="info-pill highlight-pill">
                                            <svg
                                                class="pill-icon"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                                ><path
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    stroke-width="2"
                                                    d="M13 10V3L4 14h7v7l9-11h-7z"
                                                ></path></svg
                                            >
                                            <span>{event.distance_km} KM</span>
                                        </div>
                                    </div>
                                {/if}

                                <div class="card-footer-actions">
                                    <button
                                        class="dashboard-text-btn"
                                        on:click={() => openDashboard(event)}
                                    >
                                        <svg
                                            width="18"
                                            height="18"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                stroke-width="2"
                                                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                            ></path>
                                        </svg>
                                        <span
                                            >{lang === "th"
                                                ? "ดูสถิติ"
                                                : "Stats"}</span
                                        >
                                    </button>

                                    <div class="footer-actions">
                                        {#if event.isLocked}
                                            <button
                                                class="status-btn"
                                                style="background: #334155; cursor: not-allowed; display: flex; align-items: center; gap: 6px; width: auto;"
                                                disabled
                                            >
                                                <svg
                                                    width="16"
                                                    height="16"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                    ><path
                                                        stroke-linecap="round"
                                                        stroke-linejoin="round"
                                                        stroke-width="2"
                                                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                                    ></path></svg
                                                >
                                                {event.lockMessage ||
                                                    t[lang].btn_locked}
                                            </button>
                                        {:else if !event.join_code && event.status !== "COMPLETED" && event.status !== "CANCELED"}
                                            <!-- [NEW] ไม่ได้สมัครสำหรับวันนี้ -->
                                            <button
                                                class="status-btn"
                                                style="background: #8b5cf6; cursor: not-allowed; opacity: 0.7;"
                                                disabled
                                            >
                                                {lang === "th"
                                                    ? "📝 สมัครจากหน้าค้นหา"
                                                    : "📝 Register from Events"}
                                            </button>
                                        {:else if event.status === "COMPLETED"}
                                            <button
                                                class="status-btn"
                                                style="background: #64748b; cursor: default; opacity: 0.9; width: auto; font-size: 0.9rem; display: flex; align-items: center; gap: 6px;"
                                            >
                                                <svg
                                                    width="16"
                                                    height="16"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                    ><path
                                                        stroke-linecap="round"
                                                        stroke-linejoin="round"
                                                        stroke-width="2"
                                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                                    ></path></svg
                                                >
                                                {t[lang].btn_daily_wait}
                                            </button>
                                        {:else if event.status === "proof_submitted"}
                                            <button
                                                class="status-btn waiting-btn"
                                                style="cursor: default;"
                                            >
                                                {t[lang].btn_waiting}
                                            </button>
                                        {:else if event.status === "CHECKED_IN"}
                                            <button
                                                class="status-btn sending-btn"
                                                on:click={() =>
                                                    openActionModal(event)}
                                            >
                                                {t[lang].btn_send_proof}
                                            </button>
                                        {:else if event.status === "REJECTED"}
                                            <button
                                                class="status-btn proof-btn"
                                                on:click={() =>
                                                    openActionModal(event)}
                                            >
                                                {t[lang].btn_send_image}
                                            </button>
                                        {:else if event.status === "CHECKED_OUT"}
                                            <button
                                                class="status-btn checkout-btn"
                                                on:click={() =>
                                                    openActionModal(event)}
                                                >{t[lang].btn_checkout}</button
                                            >
                                        {:else if event.status === "JOINED"}
                                            <button
                                                class="status-btn register-btn"
                                                on:click={() =>
                                                    openActionModal(event)}
                                            >
                                                {t[lang].btn_checkin}
                                            </button>
                                            <button
                                                class="cancel-btn"
                                                on:click={() =>
                                                    openCancelModal(event)}
                                            >
                                                {lang === "th"
                                                    ? "❌ ยกเลิก"
                                                    : "❌ Cancel"}
                                            </button>
                                        {/if}
                                    </div>
                                </div>
                            </div>
                        </div>
                    {/each}
                </div>

                {#if upcomingTotalPages > 1}
                    <div class="pagination-bar">
                        <button
                            class="pagination-arrow"
                            on:click={() =>
                                changeUpcomingPage(upcomingCurrentPage - 1)}
                            disabled={upcomingCurrentPage === 1}
                            style="opacity: {upcomingCurrentPage === 1
                                ? 0.4
                                : 1};"
                        >
                            &#60;
                        </button>
                        {#each Array(upcomingTotalPages) as _, idx}
                            <button
                                class="pagination-page"
                                class:active={upcomingCurrentPage === idx + 1}
                                on:click={() => changeUpcomingPage(idx + 1)}
                                >{idx + 1}</button
                            >
                        {/each}
                        <button
                            class="pagination-arrow"
                            on:click={() =>
                                changeUpcomingPage(upcomingCurrentPage + 1)}
                            disabled={upcomingCurrentPage ===
                                upcomingTotalPages}
                            style="opacity: {upcomingCurrentPage ===
                            upcomingTotalPages
                                ? 0.4
                                : 1};"
                        >
                            &#62;
                        </button>
                    </div>
                {/if}
            {/if}

            <div
                id="history-section"
                class="section-header-wrapper header-row"
                style="margin-top: 60px;"
            >
                <div class="header-left">
                    <h1 class="section-title">{t[lang].history_header}</h1>
                    <div class="title-underline"></div>
                </div>
                <button class="jump-btn" on:click={scrollToUpcoming}>
                    {t[lang].upcoming_header}
                    <svg
                        width="16"
                        height="16"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        style="transform: rotate(180deg);"
                        ><path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M19 9l-7 7-7-7"
                        ></path></svg
                    >
                </button>
            </div>

            <div class="events-grid">
                {#each paginatedHistory as event, i}
                    <div class="event-card">
                        <div
                            class="card-image"
                            use:lazyLoadBg={event.banner_image_url}
                        ></div>
                        <div class="card-content">
                            <div class="card-header-row">
                                <h3 class="card-title">{event.title}</h3>
                                <div class="badges-col">
                                    {#if event.isJoined}
                                        <div
                                            style="display:flex; flex-direction:column; align-items:flex-end; gap:4px;"
                                        >
                                            <span
                                                class="status-badge ended-normal"
                                                >{t[lang].status_ended}</span
                                            >

                                            {#if event.completion_rank && event.completion_rank > 0}
                                                <span
                                                    class="status-badge"
                                                    style="background:#fbbf24; color:#78350f; border:1px solid #f59e0b; font-size:0.7rem;"
                                                >
                                                    🏆 {t[lang].rank_label}
                                                    {event.completion_rank}
                                                </span>
                                            {/if}

                                            {#if historyTotalPages > 1}
                                                <div class="pagination-bar">
                                                    <button
                                                        class="pagination-arrow"
                                                        on:click={() =>
                                                            changeHistoryPage(
                                                                historyCurrentPage -
                                                                    1,
                                                            )}
                                                        disabled={historyCurrentPage ===
                                                            1}
                                                        style="opacity: {historyCurrentPage ===
                                                        1
                                                            ? 0.4
                                                            : 1};"
                                                    >
                                                        &#60;
                                                    </button>
                                                    {#each Array(historyTotalPages) as _, idx}
                                                        <button
                                                            class="pagination-page"
                                                            class:active={historyCurrentPage ===
                                                                idx + 1}
                                                            on:click={() =>
                                                                changeHistoryPage(
                                                                    idx + 1,
                                                                )}
                                                            >{idx + 1}</button
                                                        >
                                                    {/each}
                                                    <button
                                                        class="pagination-arrow"
                                                        on:click={() =>
                                                            changeHistoryPage(
                                                                historyCurrentPage +
                                                                    1,
                                                            )}
                                                        disabled={historyCurrentPage ===
                                                            historyTotalPages}
                                                        style="opacity: {historyCurrentPage ===
                                                        historyTotalPages
                                                            ? 0.4
                                                            : 1};"
                                                    >
                                                        &#62;
                                                    </button>
                                                </div>
                                            {/if}

                                            <span
                                                class="status-badge"
                                                style="background:#10b981; color:white; border:none; font-size:0.7rem;"
                                            >
                                                🏃 {event.completed_count} / {event.total_days}
                                                {t[lang].dash_unit_days}
                                            </span>
                                        </div>
                                    {:else}
                                        <span
                                            class="status-badge ended-canceled"
                                            >CANCELED</span
                                        >
                                    {/if}
                                </div>
                            </div>

                            <p
                                class="card-desc"
                                class:expanded={event.isExpanded}
                            >
                                {event.description}
                            </p>
                            {#if event.isExpanded}
                                {@const hConfig = holidaysMap[event.id]}
                                {@const hasHoliday =
                                    hConfig &&
                                    (hConfig.excludeWeekends ||
                                        (hConfig.holidays &&
                                            hConfig.holidays.length > 0))}

                                <div class="info-grid" transition:slide|local>
                                    <div class="info-pill">
                                        <svg
                                            class="pill-icon"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                            ><path
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                stroke-width="2"
                                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                            ></path><path
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                stroke-width="2"
                                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                            ></path></svg
                                        >
                                        <span>{event.location}</span>
                                    </div>

                                    <div class="info-pill">
                                        <svg
                                            class="pill-icon"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                            ><path
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                stroke-width="2"
                                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                            ></path></svg
                                        >
                                        <span
                                            >{getDisplayDate(
                                                event.raw_start_date,
                                                event.raw_end_date,
                                                lang,
                                            )}</span
                                        >
                                    </div>

                                    <div class="info-pill">
                                        <svg
                                            class="pill-icon"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                            ><path
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                stroke-width="2"
                                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                            ></path></svg
                                        >
                                        <span
                                            >{formatTime(
                                                event.raw_start_time || "",
                                                event.raw_end_time || "",
                                                lang,
                                            )}</span
                                        >
                                    </div>

                                    <div class="info-pill highlight-pill">
                                        <svg
                                            class="pill-icon"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                            ><path
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                stroke-width="2"
                                                d="M13 10V3L4 14h7v7l9-11h-7z"
                                            ></path></svg
                                        >
                                        <span>{event.distance_km} KM</span>
                                    </div>
                                </div>
                            {/if}

                            <div class="card-footer-actions">
                                <button
                                    class="dashboard-text-btn"
                                    on:click={() => openDashboard(event)}
                                >
                                    <svg
                                        width="18"
                                        height="18"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                        ></path>
                                    </svg>
                                    <span
                                        >{lang === "th"
                                            ? "ผลสรุป"
                                            : "Summary"}</span
                                    >
                                </button>

                                {#if event.isJoined}
                                    <button
                                        class="status-btn completed-btn"
                                        style="cursor: default; box-shadow: none;"
                                        >COMPLETED</button
                                    >
                                {:else}
                                    <button
                                        class="status-btn canceled-btn"
                                        style="cursor: default; box-shadow: none;"
                                        >CANCELED</button
                                    >
                                {/if}
                            </div>
                        </div>
                    </div>
                {/each}
            </div>

            <footer class="app-footer">
                <div class="footer-separator"></div>
                <div class="footer-content">
                    <p class="copyright">
                        &copy; 2025 Cyber Geek. All rights reserved.
                    </p>
                    <p class="credits">
                        Designed & Developed by <span class="highlight"
                            >Cyber Geek Development</span
                        >
                    </p>
                    <p class="contact">
                        Contact: <a href="mailto:cybergeek.dev@proton.me"
                            >cybergeek.dev@proton.me</a
                        >
                    </p>
                </div>
            </footer>
        </div>
    </div>
    {#if showModal && selectedEvent}
        <div class="modal-overlay" transition:fade={{ duration: 200 }}>
            <div
                class="modal-box"
                transition:scale={{ duration: 250, start: 0.9 }}
            >
                <button class="modal-close" on:click={closeModal}
                    >&times;</button
                >

                {#if selectedEvent}
                    {@const stepMap = {
                        JOINED: 1,
                        CHECKED_IN: 2,
                        REJECTED: 2,
                        proof_submitted: 3,
                        CHECKED_OUT: 4,
                        COMPLETED: 5,
                        CANCELED: 0,
                    }}
                    {@const currentStep = stepMap[selectedEvent.status] || 0}

                    {#if currentStep > 0 && currentStep < 5}
                        <div class="stepper">
                            {#each [1, 2, 3, 4] as step}
                                <div class="step-wrapper">
                                    <div
                                        class="step-circle"
                                        class:active={step === currentStep}
                                        class:completed={step < currentStep}
                                    >
                                        {step < currentStep ? "✓" : step}
                                    </div>
                                    {#if step < 4}
                                        <div
                                            class="step-line"
                                            class:line-active={step <
                                                currentStep}
                                        ></div>
                                    {/if}
                                </div>
                            {/each}
                        </div>
                    {/if}

                    <div class="modal-body">
                        {#if selectedEvent.status === "JOINED" || selectedEvent.status === "CHECKED_OUT"}
                            {@const isCheckout =
                                selectedEvent.status === "CHECKED_OUT"}
                            {@const currentCode = selectedEvent.join_code}
                            <h3 class="modal-title">
                                {isCheckout
                                    ? lang === "th"
                                        ? "Check Out (จบกิจกรรม)"
                                        : "Final Check Out"
                                    : lang === "th"
                                      ? "Check In (เริ่มกิจกรรม)"
                                      : "Start Check In"}
                            </h3>

                            <div class="toggle-switch">
                                <button
                                    class="toggle-btn"
                                    class:active={checkInMethod === "PIN"}
                                    on:click={() => (checkInMethod = "PIN")}
                                    >PIN CODE</button
                                >
                                <button
                                    class="toggle-btn"
                                    class:active={checkInMethod === "QR"}
                                    on:click={() => (checkInMethod = "QR")}
                                    >QR SCAN</button
                                >
                            </div>

                            <div class="checkin-display">
                                {#if checkInMethod === "PIN"}
                                    <div class="pin-box">
                                        {#each splitCode(currentCode, 5) as char}
                                            <span>{char}</span>
                                        {/each}
                                    </div>
                                {:else}
                                    <div class="qr-box">
                                        <img
                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(currentCode || "WAITING")}`}
                                            alt="QR"
                                        />
                                    </div>
                                {/if}
                            </div>

                            <div
                                class="alert-box-info"
                                style="margin-top: 20px; padding: 15px; background: rgba(16, 185, 129, 0.1); border: 1px dashed #10b981; border-radius: 8px; text-align: center;"
                            >
                                <p
                                    style="color: #10b981; margin: 0; font-weight: 600;"
                                >
                                    {lang === "th"
                                        ? "กรุณาแสดงรหัสนี้ให้เจ้าหน้าที่สแกน"
                                        : "Please present this code to staff."}
                                </p>
                            </div>
                        {:else if selectedEvent.status === "CHECKED_IN" || selectedEvent.status === "REJECTED"}
                            <h3 class="modal-title">
                                {lang === "th"
                                    ? "ส่งผลการวิ่ง"
                                    : "Submit Result"}
                            </h3>

                            {#if selectedEvent.status === "REJECTED"}
                                <div
                                    class="rejected-alert"
                                    style="background: #fee2e2; color: #b91c1c; padding: 12px; border-radius: 8px; margin-bottom: 15px; border: 1px solid #fca5a5;"
                                >
                                    <strong>
                                        ⚠️ {lang === "th"
                                            ? "หลักฐานถูกปฏิเสธ"
                                            : "Submission Rejected"}
                                        <br />
                                        <span
                                            style="font-weight: normal; font-size: 0.9em;"
                                        >
                                            {lang === "th"
                                                ? "(หากไม่ลงรูปจะส่งรูปเดิม)"
                                                : "(Original image will be sent if no new upload)"}
                                        </span>
                                    </strong><br />
                                    <span style="font-size: 0.9rem;">
                                        {selectedEvent.rejection_reason ||
                                            (lang === "th"
                                                ? "กรุณาตรวจสอบรูปภาพและลิงก์อีกครั้ง"
                                                : "Please check your proof again.")}
                                    </span>
                                </div>
                            {/if}

                            <div class="input-group">
                                <label for="link">
                                    Strava Activity Link <span
                                        style="color: #ef4444; font-weight: bold;"
                                        >*</span
                                    >
                                </label>
                                <div
                                    style="display: flex; gap: 8px; align-items: center;"
                                >
                                    <input
                                        type="text"
                                        id="link"
                                        bind:value={sendingLink}
                                        placeholder="https://strava.app.link/... หรือ strava.com/activities/..."
                                        style="flex: 1;"
                                        required
                                    />
                                    <button
                                        type="button"
                                        class="verify-strava-btn"
                                        on:click={checkStravaLink}
                                    >
                                        🔍 {t[lang].btn_verify_link}
                                    </button>
                                </div>
                                {#if distanceInput > 0}
                                    <div
                                        class="distance-result"
                                        style="margin-top: 8px; padding: 8px 12px; background: rgba(16, 185, 129, 0.1); border-radius: 6px; display: flex; align-items: center; gap: 8px;"
                                    >
                                        <span
                                            style="color: #10b981; font-size: 1.2rem;"
                                            >✓</span
                                        >
                                        <span
                                            style="color: #10b981; font-weight: 600;"
                                            >{lang === "th"
                                                ? "ระยะทาง"
                                                : "Distance"}: {distanceInput.toFixed(
                                                2,
                                            )} km</span
                                        >
                                    </div>
                                {:else}
                                    <small
                                        style="color: #94a3b8; margin-top: 4px; display: block;"
                                    >
                                        {lang === "th"
                                            ? "* กดปุ่มตรวจสอบเพื่อดึงระยะทาง หรือกรอกเอง"
                                            : "* Click verify to fetch distance, or enter manually"}
                                    </small>
                                {/if}
                            </div>

                            <div class="upload-area" style="margin-top: 15px;">
                                <p
                                    style="display: block; margin-bottom: 5px; font-weight: 600;"
                                >
                                    {lang === "th"
                                        ? "รูปภาพหลักฐาน"
                                        : "Proof Image"}
                                    <span
                                        style="color: #ef4444; font-weight: bold;"
                                        >*</span
                                    >
                                </p>
                                {#if !proofImage}
                                    <label
                                        class="upload-label"
                                        style="border: 2px dashed #ccc; padding: 20px; text-align: center; display: block; cursor: pointer; border-radius: 8px;"
                                    >
                                        <input
                                            id="proofImageInput"
                                            type="file"
                                            accept="image/*"
                                            on:change={handleImageUpload}
                                            hidden
                                        />
                                        <div class="upload-placeholder">
                                            <span>
                                                {t[lang].modal_upload_txt}</span
                                            >
                                        </div>
                                    </label>
                                {:else}
                                    <div
                                        class="image-preview"
                                        style="position: relative; text-align: center;"
                                    >
                                        <img
                                            src={proofImage?.startsWith("data:")
                                                ? proofImage
                                                : resolveImageUrl(proofImage)}
                                            alt="Preview"
                                            style="max-height: 200px; border-radius: 8px; margin: 0 auto;"
                                        />
                                        <button
                                            class="remove-img-btn"
                                            style="position: absolute; top: -10px; right: -10px; background: red; color: white; border-radius: 50%; width: 24px; height: 24px; border: none; cursor: pointer;"
                                            on:click={() => {
                                                proofImage = null;
                                                proofFile = null;
                                            }}>&times;</button
                                        >
                                    </div>
                                {/if}
                            </div>

                            <button
                                class="action-submit-btn purple-theme"
                                style="width: 100%; margin-top: 20px; padding: 12px; background: #8b5cf6; color: white; border-radius: 8px; font-weight: bold;"
                                on:click={submitProofAction}
                            >
                                {selectedEvent.status === "REJECTED"
                                    ? lang === "th"
                                        ? "ส่งแก้ไข"
                                        : "Resubmit"
                                    : lang === "th"
                                      ? "ยืนยันการส่ง"
                                      : "Submit"}
                            </button>
                        {:else if selectedEvent.status === "proof_submitted"}
                            <div
                                class="waiting-view"
                                style="text-align: center; padding: 40px 0;"
                            >
                                <div
                                    class="hourglass-icon"
                                    style="font-size: 4rem; margin-bottom: 20px;"
                                >
                                    ⏳
                                </div>
                                <h2
                                    style="font-size: 1.5rem; font-weight: bold; margin-bottom: 10px;"
                                >
                                    {t[lang].modal_verifying_title}
                                </h2>
                                <p style="color: #64748b;">
                                    {t[lang].modal_verifying_desc}
                                </p>
                            </div>
                        {:else if selectedEvent.status === "COMPLETED"}
                            <div
                                class="completed-view"
                                style="text-align: center; padding: 20px;"
                            >
                                <div
                                    style="font-size: 4rem; margin-bottom: 20px;"
                                >
                                    🎉
                                </div>
                                <h2
                                    style="color: #10b981; font-size: 1.5rem; font-weight: bold; margin-bottom: 10px;"
                                >
                                    {lang === "th"
                                        ? "กิจกรรมเสร็จสมบูรณ์"
                                        : "Mission Completed!"}
                                </h2>
                                <div
                                    class="stat-box"
                                    style="justify-content: center; margin-top: 20px; background: #f0fdf4; padding: 20px; border-radius: 12px;"
                                >
                                    <div>
                                        <div class="stat-label">
                                            Total Distance
                                        </div>
                                        <div
                                            class="stat-value"
                                            style="font-size: 2rem; font-weight: bold; color: #15803d;"
                                        >
                                            {selectedEvent.actual_distance_km ||
                                                selectedEvent.distance_km ||
                                                0} km
                                        </div>
                                    </div>
                                </div>
                            </div>
                        {:else if selectedEvent.status === "CANCELED"}
                            {@const remainingRejoins =
                                getRemainingRejoins(selectedEvent)}
                            {@const canUserRejoin = canRejoin(selectedEvent)}
                            <div
                                class="cancelled-view"
                                style="text-align: center; padding: 40px 0; color: #94a3b8;"
                            >
                                <div
                                    style="font-size: 4rem; margin-bottom: 10px;"
                                >
                                    🚫
                                </div>
                                <h3 style="margin-bottom: 20px;">
                                    {lang === "th"
                                        ? "กิจกรรมถูกยกเลิก"
                                        : "Event Cancelled"}
                                </h3>

                                {#if canUserRejoin}
                                    <p
                                        style="color: #f59e0b; margin-bottom: 15px; font-weight: 500;"
                                    >
                                        {lang === "th"
                                            ? `เหลือสิทธิ์กลับเข้าร่วม ${remainingRejoins} ครั้ง`
                                            : `${remainingRejoins} rejoin attempts remaining`}
                                    </p>
                                    <button
                                        class="rejoin-btn"
                                        style="background: linear-gradient(135deg, #8b5cf6, #3b82f6); color: white; border: none; padding: 12px 28px; border-radius: 30px; cursor: pointer; font-size: 1rem; font-weight: 600; display: inline-flex; align-items: center; gap: 8px; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);"
                                        on:click={() =>
                                            handleReJoin(selectedEvent!)}
                                    >
                                        🔄 {lang === "th"
                                            ? "กลับเข้าร่วมอีกครั้ง"
                                            : "Rejoin Event"}
                                    </button>
                                {:else if selectedEvent.isLocked}
                                    <p
                                        style="color: #6b7280; font-weight: 500;"
                                    >
                                        {selectedEvent.lockMessage ||
                                            (lang === "th"
                                                ? "กิจกรรมนี้สิ้นสุดแล้ว"
                                                : "This event has ended")}
                                    </p>
                                {:else}
                                    <p
                                        style="color: #ef4444; font-weight: 500;"
                                    >
                                        {lang === "th"
                                            ? "ใช้สิทธิ์กลับเข้าร่วมครบ 5 ครั้งแล้ว"
                                            : "You have used all 5 rejoin attempts"}
                                    </p>
                                {/if}
                            </div>
                        {/if}
                    </div>
                {/if}
            </div>
        </div>
    {/if}

    {#if showDashboardModal && dashboardEvent}
        {@const showRank =
            dashboardEvent.completion_rank &&
            dashboardEvent.completion_rank > 0}

        {@const hConfig = holidaysMap[dashboardEvent.id]}
        {@const hasHoliday =
            hConfig &&
            (hConfig.excludeWeekends ||
                (hConfig.holidays && hConfig.holidays.length > 0))}

        <div
            class="modal-overlay"
            transition:fade={{ duration: 200 }}
            style="z-index: 3100;"
        >
            <div
                class="modal-box dashboard-box"
                transition:scale={{ duration: 250, start: 0.95 }}
            >
                <button class="modal-close" on:click={closeDashboard}
                    >&times;</button
                >

                <div class="dashboard-header">
                    <h2 class="dash-title">{dashboardEvent.title}</h2>
                    <span
                        class="status-badge"
                        style="font-size: 0.8rem; align-self: flex-start;"
                    >
                        {dashboardEvent.status === "COMPLETED"
                            ? "COMPLETED"
                            : dashboardEvent.status}
                    </span>
                </div>

                <div class="dashboard-content">
                    <div class="dash-section">
                        <p class="dash-desc">{dashboardEvent.description}</p>
                    </div>

                    <div class="dash-grid">
                        <div class="dash-item">
                            <span class="dash-label"
                                >📍 {t[lang].dash_location}</span
                            >
                            <span class="dash-value"
                                >{dashboardEvent.location}</span
                            >
                        </div>
                        <div class="dash-item">
                            <span class="dash-label"
                                >📅 {t[lang].dash_date}</span
                            >
                            <span class="dash-value"
                                >{getDisplayDate(
                                    dashboardEvent.raw_start_date,
                                    dashboardEvent.raw_end_date,
                                    lang,
                                )}</span
                            >
                        </div>
                        <div class="dash-item">
                            <span class="dash-label"
                                >⏰ {t[lang].dash_time}</span
                            >
                            <span class="dash-value"
                                >{formatTime(
                                    dashboardEvent.raw_start_time || "",
                                    dashboardEvent.raw_end_time || "",
                                    lang,
                                )}</span
                            >
                        </div>
                    </div>

                    <div class="stats-container">
                        <div class="stat-box blue-stat">
                            <div class="stat-icon">🏃</div>
                            <div class="stat-info">
                                <span class="stat-label"
                                    >{t[lang].dash_success_title}</span
                                >
                                <span class="stat-value">
                                    {dashboardEvent.completed_count ?? 0}
                                    {lang === "th" ? "ครั้ง" : "times"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    {/if}
</div>

<!-- CANCEL MODAL -->
{#if showCancelModal && eventToCancel}
    <div class="modal-overlay" transition:fade={{ duration: 200 }}>
        <div
            class="modal-content cancel-modal"
            transition:scale={{ duration: 250, start: 0.9 }}
        >
            <button class="modal-close-btn" on:click={closeCancelModal}
                >&times;</button
            >
            <div class="modal-body">
                <h3 class="modal-title" style="color: #ef4444;">
                    {lang === "th"
                        ? "ยกเลิกการเข้าร่วมกิจกรรม"
                        : "Cancel Participation"}
                </h3>
                <p class="modal-subtitle">
                    {lang === "th"
                        ? "โปรดระบุเหตุผลที่คุณต้องการยกเลิก"
                        : "Please specify your reason for cancellation"}
                </p>
                <div class="cancel-options">
                    {#each cancelReasons as reason}
                        <label class="radio-item">
                            <input
                                type="radio"
                                bind:group={selectedCancelReason}
                                value={reason}
                            />
                            <span class="radio-label">{reason}</span>
                        </label>
                    {/each}
                </div>
                {#if selectedCancelReason.includes("อื่นๆ") || selectedCancelReason.includes("Other")}
                    <div class="reason-input" transition:slide>
                        <textarea
                            placeholder={lang === "th"
                                ? "ระบุเหตุผลอื่นๆ..."
                                : "Specify other reason..."}
                            bind:value={otherCancelReason}
                            rows="3"
                        ></textarea>
                    </div>
                {/if}
                <div class="action-row">
                    <button
                        class="cancel-confirm-btn"
                        on:click={confirmCancellation}
                        disabled={!selectedCancelReason ||
                            ((selectedCancelReason.includes("Other") ||
                                selectedCancelReason.includes("อื่นๆ")) &&
                                !otherCancelReason.trim())}
                    >
                        {lang === "th"
                            ? "ยืนยันการยกเลิก"
                            : "Confirm Cancellation"}
                    </button>
                </div>
            </div>
        </div>
    </div>
{/if}

<style>
    @import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap");
    :root {
        --bg-body: #0f172a;
        --bg-nav: #1e293b;
        --bg-card: #1e293b;
        --primary: #10b981;
        --text-main: #f8fafc;
        --text-muted: #94a3b8;
        --nav-height: 72px;
    }
    :global(.swal2-container) {
        z-index: 10000 !important;
    }
    :global(.swal2-toast) {
        z-index: 10001 !important;
    }
    :global(body) {
        margin: 0;
        padding: 0;
        background-color: var(--bg-body);
        font-family: "Inter", sans-serif;
    }

    .app-container {
        height: 100vh;
        background-color: var(--bg-body);
        color: var(--text-main);
        display: flex;
        flex-direction: column;
    }
    .scroll-container {
        flex: 1 1 auto;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        overscroll-behavior: contain;
        padding-bottom: 20px;
    }
    .content-wrapper {
        max-width: 1400px;
        margin: 0 auto;
        padding: 0 24px;
    }

    /* HEADER & NAVBAR */
    .header-bar {
        width: 100%;
        height: var(--nav-height);
        background-color: var(--bg-nav);
        position: fixed;
        top: 0;
        left: 0;
        z-index: 1000;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    }
    .header-inner {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 16px;
        box-sizing: border-box;
    }
    .left-group {
        display: flex;
        align-items: center;
        gap: 40px;
        flex: 1;
        overflow: hidden;
    }
    .brand-name {
        font-size: 2rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        background: linear-gradient(135deg, #6ee7b7 0%, #10b981 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        cursor: default;
        white-space: nowrap;
        margin-right: 10px;
        text-shadow:
            0 0 10px rgba(16, 185, 129, 0.4),
            0 0 20px rgba(16, 185, 129, 0.2);
    }

    .nav-menu {
        display: flex;
        gap: 8px;
        white-space: nowrap;
    }
    .menu-btn {
        background: transparent;
        border: none;
        padding: 10px 14px;
        border-radius: 8px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        font-family: "Inter", sans-serif;
        font-size: 0.9rem;
        font-weight: 600;
        color: var(--text-muted);
        transition: all 0.2s ease;
    }
    .nav-icon {
        width: 18px;
        height: 18px;
        opacity: 0.7;
        transition: 0.2s;
    }
    .menu-btn:hover {
        color: var(--text-main);
        background-color: rgba(255, 255, 255, 0.03);
    }
    .menu-btn:hover .nav-icon {
        opacity: 1;
    }
    .menu-btn.active {
        background-color: #0f172a;
        color: #10b981;
        box-shadow: 0 0 0 1px rgba(16, 185, 129, 0.1);
    }
    .menu-btn.active .nav-icon {
        opacity: 1;
        stroke: #10b981;
    }

    .user-zone {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-left: auto;
        flex-shrink: 0;
    }
    .timer-pill {
        background-color: #0f172a;
        color: #10b981;
        font-weight: 700;
        font-size: 0.95rem;
        padding: 8px 14px;
        border-radius: 6px;
        border: 1px solid rgba(16, 185, 129, 0.2);
        letter-spacing: 1px;
        white-space: nowrap;
    }
    .logout-btn {
        background: transparent;
        border: none;
        color: var(--text-muted);
        cursor: pointer;
        padding: 8px;
        transition: 0.2s;
        display: flex;
        align-items: center;
    }
    .logout-btn:hover {
        color: #ef4444;
        transform: translateX(2px);
    }

    .search-bar-container {
        flex: 1;
        display: flex;
        justify-content: center;
        max-width: 250px;
        margin: 0 20px;
    }
    .search-input-wrapper {
        position: relative;
        width: 100%;
        display: flex;
        align-items: center;
    }

    /* [แก้ไข 1] ปรับ Style ช่องค้นหา PC */
    .search-input {
        width: 100%;
        background: #0f172a;
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: var(--text-main);
        padding: 8px 16px 8px 36px;
        border-radius: 8px;
        font-size: 0.85rem;
        outline: none;
        transition: all 0.2s;
    }
    .search-input:focus {
        border-color: var(--primary);
        box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
    }
    .search-icon {
        position: absolute;
        left: 10px;
        width: 16px;
        height: 16px;
        color: #10b981;
    }
    .active-search-icon {
        color: var(--primary);
        opacity: 0.8;
    }

    .mobile-toggle {
        display: none;
        background: transparent;
        border: none;
        color: white;
        padding: 6px;
        border-radius: 6px;
        cursor: pointer;
    }
    @media (min-width: 1025px) {
        .left-group {
            gap: 15px;
        }
    }
    @media (max-width: 1024px) {
        .desktop-only {
            display: none !important;
        }
        .mobile-toggle {
            display: block !important;
        }
        .header-inner {
            padding: 0 12px;
        }
        .left-group {
            gap: 10px;
        }
        .brand-name {
            font-size: 1.5rem;
        }
        .search-bar-container {
            display: none;
        }
    }

    .mobile-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.7);
        z-index: 2000;
        backdrop-filter: blur(2px);
    }
    .mobile-drawer {
        position: fixed;
        top: 0;
        right: 0;
        bottom: 0;
        width: 70vw;
        max-width: 280px;
        background: var(--bg-nav);
        z-index: 2001;
        padding: 20px;
        display: flex;
        flex-direction: column;
        box-shadow: -5px 0 20px rgba(0, 0, 0, 0.5);
    }
    .drawer-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 10px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    .close-btn {
        background: none;
        border: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
    }

    .drawer-search {
        margin-bottom: 15px;
    }
    .drawer-search-input {
        width: 100%;
        background: #0f172a;
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: var(--text-main);
        padding: 10px;
        border-radius: 8px;
        font-size: 0.9rem;
        outline: none;
        box-sizing: border-box;
    }

    .drawer-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 10px;
    }
    .drawer-item {
        background: transparent;
        border: none;
        color: var(--text-muted);
        text-align: left;
        padding: 12px 16px;
        font-size: 1rem;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 12px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
    }
    .drawer-item.active {
        background-color: #0f172a;
        color: #10b981;
        border: 1px solid rgba(255, 255, 255, 0.05);
    }
    .drawer-item.active .nav-icon {
        opacity: 1;
        stroke: #10b981;
    }
    .logout-special {
        color: #ef4444;
        margin-top: auto;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        padding-top: 20px;
    }

    /* LANG SWITCHER STYLES */
    .lang-switch {
        display: flex;
        align-items: center;
        background: rgba(255, 255, 255, 0.05);
        padding: 4px 10px;
        border-radius: 20px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        margin-right: 12px;
    }
    .lang-switch button {
        background: none;
        border: none;
        color: #64748b;
        font-size: 0.8rem;
        font-weight: 700;
        cursor: pointer;
        padding: 4px;
        transition: 0.2s;
    }
    .lang-switch button.active {
        color: #10b981;
        text-shadow: 0 0 10px rgba(16, 185, 129, 0.3);
    }
    .lang-switch .sep {
        color: #334155;
        font-size: 0.8rem;
        margin: 0 4px;
    }

    .drawer-lang-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        margin-top: 10px;
        border-top: 1px solid rgba(255, 255, 255, 0.05);
        padding-top: 20px;
    }
    .lang-label-group {
        display: flex;
        align-items: center;
        color: #94a3b8;
        font-weight: 600;
        font-size: 1rem;
        gap: 12px;
    }
    .lang-toggle-pill {
        display: flex;
        background: #0f172a;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 20px;
        padding: 2px;
    }
    .lang-toggle-pill button {
        background: transparent;
        border: none;
        color: #64748b;
        padding: 6px 14px;
        font-size: 0.85rem;
        font-weight: 700;
        border-radius: 18px;
        cursor: pointer;
        transition: 0.2s;
    }
    .lang-toggle-pill button.active {
        background: #10b981;
        color: white;
    }

    /* SECTION HEADERS */
    .section-header-wrapper {
        margin-bottom: 24px;
    }
    .header-row {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
    }
    .section-title {
        font-size: 2.2rem;
        font-weight: 800;
        color: white;
        margin: 0 0 10px 0;
        letter-spacing: 0.5px;
    }
    .title-underline {
        width: 60px;
        height: 5px;
        background-color: #10b981;
        border-radius: 4px;
    }

    .jump-btn {
        background: transparent;
        border: 1px solid var(--text-muted);
        color: var(--text-muted);
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        transition: 0.2s;
    }
    .jump-btn:hover {
        border-color: var(--primary);
        color: var(--primary);
        background: rgba(16, 185, 129, 0.1);
    }

    /* GRID & CARDS */
    .events-grid {
        display: grid;
        gap: 24px;
        grid-template-columns: 1fr;
        align-items: start;
    }
    @media (min-width: 768px) {
        .events-grid {
            grid-template-columns: repeat(2, 1fr);
        }
    }
    @media (min-width: 1024px) {
        .events-grid {
            grid-template-columns: repeat(3, 1fr);
        }
    }
    @media (min-width: 1280px) {
        .events-grid {
            grid-template-columns: repeat(4, 1fr);
        }
    }

    .event-card {
        background: linear-gradient(
            145deg,
            rgba(30, 41, 59, 0.95),
            rgba(15, 23, 42, 0.95)
        );
        border-radius: 18px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        border: 1px solid rgba(16, 185, 129, 0.12);
        box-shadow:
            0 12px 24px -6px rgba(0, 0, 0, 0.45),
            0 0 0 1px rgba(255, 255, 255, 0.03);
        transition: all 0.28s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .event-card:hover {
        transform: translateY(-6px);
        border-color: rgba(16, 185, 129, 0.25);
        box-shadow:
            0 22px 40px -10px rgba(0, 0, 0, 0.55),
            0 0 0 1px rgba(16, 185, 129, 0.18);
    }
    .card-image {
        height: 180px;
        background-size: cover;
        background-position: center;
        width: 100%;
        position: relative;
        background-color: #1e293b;
        transition: opacity 0.3s ease;
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }
    .card-image::before {
        content: "";
        position: absolute;
        inset: 0;
        background: linear-gradient(
            135deg,
            rgba(16, 185, 129, 0.08) 0%,
            transparent 50%,
            rgba(59, 130, 246, 0.08) 100%
        );
        opacity: 0;
        transition: opacity 0.3s;
        z-index: 0;
    }
    .card-image:not(.lazy-loaded)::before {
        opacity: 1;
    }
    .card-image:not(.lazy-loaded)::after {
        content: "📷";
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 2.5rem;
        opacity: 0.25;
        z-index: 1;
    }
    .card-image:not(.lazy-loaded) {
        opacity: 0.6;
    }
    .card-content {
        padding: 20px;
        flex: 1;
        display: flex;
        flex-direction: column;
    }
    .card-header-row {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 12px;
        gap: 10px;
    }
    .card-title {
        font-size: 1.25rem;
        font-weight: 800;
        background: linear-gradient(135deg, #ffffff, #e0e7ff);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        margin: 0;
        line-height: 1.35;
        flex: 1;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        min-height: 2.8em;
        line-clamp: 2;
        letter-spacing: 0.02em;
    }
    .badges-col {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 6px;
        flex-shrink: 0;
    }

    .status-badge {
        font-size: 0.7rem;
        font-weight: 800;
        padding: 5px 12px;
        border-radius: 16px;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.14);
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.18);
    }
    .status-badge.running {
        color: #f59e0b;
        border-color: rgba(245, 158, 11, 0.6);
        background: rgba(245, 158, 11, 0.12);
    }
    .status-badge.ended-normal {
        color: #94a3b8;
        border: 1px solid #94a3b8;
    }
    .status-badge.ended-canceled {
        color: #9f1239;
        border: 1px solid #881337;
        background-color: rgba(136, 19, 55, 0.1);
    }
    .status-badge.resubmit-badge {
        color: #ef4444;
        border: 1px solid rgba(239, 68, 68, 0.7);
        background: rgba(239, 68, 68, 0.12);
    }
    .status-badge.proof-badge {
        color: #d8b4fe;
        border: 1px solid rgba(216, 180, 254, 0.7);
        background: rgba(168, 85, 247, 0.12);
    }

    .count-badge {
        background: linear-gradient(135deg, #3b82f6, #2563eb);
        color: white;
        font-size: 0.78rem;
        font-weight: 800;
        padding: 6px 12px;
        border-radius: 16px;
        display: flex;
        align-items: center;
        white-space: nowrap;
        border: 1px solid rgba(255, 255, 255, 0.18);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.28);
    }
    .card-desc {
        font-size: 0.9rem;
        color: #94a3b8;
        margin: 0 0 20px 0;
        line-height: 1.6;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        min-height: 3.2em;
        line-clamp: 2;
    }
    .card-desc.expanded {
        -webkit-line-clamp: unset;
        overflow: visible;
        min-height: auto;
        line-clamp: unset;
    }

    .info-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin-bottom: 24px;
    }
    .info-pill {
        background: linear-gradient(
            135deg,
            rgba(30, 41, 59, 0.65),
            rgba(15, 23, 42, 0.8)
        );
        border: 1px solid rgba(148, 163, 184, 0.18);
        border-radius: 10px;
        padding: 12px;
        display: flex;
        align-items: flex-start;
        gap: 10px;
        font-size: 0.8rem;
        color: #cbd5e1;
        min-height: 20px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
    }
    .highlight-pill {
        color: #fbbf24;
        border-color: rgba(251, 191, 36, 0.3);
    }
    .highlight-pill .pill-icon {
        stroke: #fbbf24;
    }
    .pill-icon {
        width: 18px;
        height: 18px;
        opacity: 0.8;
        flex-shrink: 0;
    }

    .card-footer-actions {
        display: grid;
        grid-template-columns: 1fr auto;
        align-items: center;
        gap: 12px;
        margin-top: auto;
        padding-top: 12px;
    }
    .footer-actions {
        display: flex;
        gap: 10px;
        align-items: center;
        justify-content: flex-end;
        flex-wrap: wrap;
    }

    .status-btn {
        color: white;
        border: none;
        padding: 12px 18px;
        border-radius: 12px;
        font-size: 0.92rem;
        font-weight: 800;
        text-transform: uppercase;
        cursor: pointer;
        box-shadow: 0 10px 22px -8px rgba(0, 0, 0, 0.45);
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        min-height: 44px;
        letter-spacing: 0.4px;
        position: relative;
        overflow: hidden;
    }
    .status-btn:hover {
        filter: brightness(1.12);
        transform: translateY(-2px);
    }
    .status-btn:disabled {
        cursor: not-allowed;
        opacity: 0.8;
        transform: none;
        filter: none;
        box-shadow: none;
    }

    .register-btn {
        background: #86efac;
        color: #064e3b;
    }
    .sending-btn {
        background: #3b82f6;
    }
    .proof-btn {
        background: #d8b4fe;
        color: #4c1d95;
    }
    .checkout-btn {
        background: #22c55e;
    }
    .completed-btn {
        background: #10b981;
    }
    .canceled-btn {
        background: #ef4444;
    }
    .waiting-btn {
        background: #facc15;
        color: #854d0e;
    }

    .locked-card .card-image {
        filter: grayscale(100%);
        opacity: 0.85;
    }
    .locked-card .card-content {
        opacity: 0.7;
    }
    .lock-overlay {
        width: 100%;
        height: 100%;
        background: radial-gradient(
            circle at 30% 10%,
            rgba(16, 185, 129, 0.18),
            rgba(15, 23, 42, 0.75) 55%,
            rgba(15, 23, 42, 0.85)
        );
        backdrop-filter: blur(6px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 14px;
        box-sizing: border-box;
    }
    .lock-overlay-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        text-align: center;
        color: rgba(255, 255, 255, 0.92);
    }
    .lock-icon-circle {
        width: 46px;
        height: 46px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.14);
        border: 1px solid rgba(255, 255, 255, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.25);
    }
    .lock-text {
        font-weight: 800;
        font-size: 0.95rem;
        letter-spacing: 0.3px;
    }

    @media (max-width: 560px) {
        .card-footer-actions {
            grid-template-columns: 1fr;
        }
        .dashboard-text-btn {
            width: 100%;
            justify-content: center;
            margin-right: 0;
        }
        .footer-actions {
            width: 100%;
        }
        .footer-actions > button {
            flex: 1 1 0;
            min-width: 0;
        }
        .status-btn,
        .cancel-btn {
            width: 100%;
        }
    }

    /* FOOTER */
    .app-footer {
        margin-top: 60px;
        text-align: center;
        padding-bottom: 40px;
    }
    .footer-separator {
        height: 1px;
        background: rgba(255, 255, 255, 0.1);
        width: 100px;
        margin: 0 auto 20px auto;
    }
    .footer-content p {
        font-size: 0.8rem;
        color: #64748b;
        margin: 4px 0;
    }
    .highlight {
        color: #10b981;
    }
    .contact a {
        color: #64748b;
        text-decoration: none;
    }

    /* MODAL */
    .modal-overlay {
        position: fixed;
        inset: 0;
        z-index: 3000;
        background: rgba(15, 23, 42, 0.6);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
    }
    .modal-box {
        width: 100%;
        max-width: 500px;
        background: #1e293b;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 20px;
        position: relative;
        display: flex;
        flex-direction: column;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
        overflow: hidden;
    }
    .modal-close {
        position: absolute;
        top: 15px;
        right: 20px;
        background: none;
        border: none;
        color: #94a3b8;
        font-size: 2rem;
        line-height: 1;
        cursor: pointer;
        z-index: 10;
    }
    .modal-body {
        padding: 20px 30px 40px;
        text-align: center;
    }
    .modal-title {
        font-size: 1.5rem;
        color: white;
        margin: 10px 0 5px;
    }

    .stepper {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: #0f172a;
        padding: 20px 30px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }
    .step-wrapper {
        display: flex;
        align-items: center;
        flex: 1;
        position: relative;
    }
    .step-circle {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: #334155;
        color: #94a3b8;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        z-index: 2;
        transition: all 0.3s;
    }
    .step-circle.active {
        background: var(--primary);
        color: #0f172a;
        box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
    }
    .step-circle.completed {
        background: #064e3b;
        color: #10b981;
        border: 1px solid #10b981;
    }
    .step-line {
        height: 3px;
        background: #334155;
        flex: 1;
        margin: 0 5px;
        border-radius: 2px;
    }
    .line-active {
        background: var(--primary);
    }

    .toggle-switch {
        display: flex;
        background: #0f172a;
        padding: 4px;
        border-radius: 12px;
        margin: 0 auto 20px;
        max-width: 250px;
    }
    .toggle-btn {
        flex: 1;
        border: none;
        background: transparent;
        color: #64748b;
        padding: 8px;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: 0.2s;
    }
    .toggle-btn.active {
        background: #1e293b;
        color: var(--primary);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
    .checkin-display {
        min-height: 180px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }
    .pin-box {
        display: flex;
        gap: 10px;
        margin-bottom: 10px;
    }
    .pin-box span {
        width: 45px;
        height: 60px;
        background: #0f172a;
        border: 2px solid var(--primary);
        color: var(--primary);
        font-size: 2rem;
        font-weight: 800;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
    }
    .qr-box img {
        width: 300px;
        height: 300px;
        border-radius: 12px;
        border: 4px solid white;
    }
    .input-group {
        text-align: left;
        margin-bottom: 20px;
    }
    .input-group label {
        display: block;
        color: #cbd5e1;
        font-size: 0.9rem;
        margin-bottom: 8px;
    }
    .input-group input {
        width: 100%;
        background: #0f172a;
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: white;
        padding: 12px;
        border-radius: 8px;
        font-size: 1rem;
        outline: none;
        box-sizing: border-box;
    }
    .input-group input:focus {
        border-color: #3b82f6;
    }

    .upload-area {
        margin-bottom: 25px;
    }
    .upload-label {
        cursor: pointer;
        display: block;
    }
    .upload-placeholder {
        border: 2px dashed rgba(255, 255, 255, 0.2);
        border-radius: 12px;
        padding: 40px 20px;
        color: #64748b;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        transition: 0.2s;
        background: rgba(0, 0, 0, 0.2);
    }
    .upload-placeholder:hover {
        border-color: #d8b4fe;
        color: #d8b4fe;
        background: rgba(216, 180, 254, 0.05);
    }
    .image-preview {
        position: relative;
        display: inline-block;
    }
    .image-preview img {
        max-width: 100%;
        max-height: 250px;
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.2);
    }
    .remove-img-btn {
        position: absolute;
        top: -10px;
        right: -10px;
        background: #ef4444;
        color: white;
        border: none;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        font-size: 1.2rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
    }

    .action-submit-btn {
        width: 100%;
        padding: 14px;
        background: var(--primary);
        color: #064e3b;
        border: none;
        border-radius: 10px;
        font-weight: 800;
        font-size: 1rem;
        cursor: pointer;
        transition: 0.2s;
    }
    .action-submit-btn:hover {
        filter: brightness(1.1);
        transform: translateY(-2px);
    }
    .action-submit-btn.purple-theme {
        background: #d8b4fe;
        color: #4c1d95;
    }
    .action-submit-btn:disabled {
        background: #334155;
        color: #64748b;
        cursor: not-allowed;
        transform: none;
    }

    .waiting-view {
        background: #fef08a;
        color: #854d0e;
        padding: 40px;
        text-align: center;
        height: 100%;
    }
    .waiting-view h2 {
        color: #854d0e;
        font-size: 2rem;
        margin: 10px 0;
    }
    .waiting-view p {
        color: #a16207;
        margin-bottom: 20px;
    }
    .hourglass-icon {
        font-size: 4rem;
        margin-bottom: 20px;
        animation: pulse 2s infinite;
    }
    @keyframes pulse {
        0% {
            transform: scale(1);
        }
        50% {
            transform: scale(1.1);
        }
        100% {
            transform: scale(1);
        }
    }

    .rejected-alert {
        background-color: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.3);
        color: #ef4444;
        font-weight: 700;
        padding: 12px;
        border-radius: 8px;
        margin-bottom: 20px;
        text-align: center;
    }

    .holiday-info-box {
        grid-column: 1 / -1;
        background: rgba(239, 68, 68, 0.1);
        border: 1px dashed #ef4444;
        padding: 12px;
        border-radius: 8px;
        margin-top: 10px;
    }
    .holiday-title {
        color: #f87171;
        font-weight: 700;
        font-size: 0.9rem;
        margin-bottom: 6px;
    }
    .holiday-list {
        margin: 0;
        padding-left: 20px;
        color: #fca5a5;
        font-size: 0.85rem;
    }
    .holiday-list li {
        margin-bottom: 2px;
    }
    /* Dashboard Button in Card */
    /* ลบอันเก่า .dashboard-icon-btn ทิ้ง หรือแก้เป็นอันนี้แทน */

    .dashboard-text-btn {
        background: transparent;
        border: 1px solid rgba(255, 255, 255, 0.2); /* ขอบบางสีเทา */
        color: #94a3b8; /* ตัวหนังสือสีเทาอ่อน */
        padding: 8px 16px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        transition: all 0.2s;
        font-size: 0.85rem;
        font-weight: 600;
        height: 42px;
        margin-right: auto;
    }

    .dashboard-text-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        color: white;
        border-color: rgba(255, 255, 255, 0.6);
    }

    @media (max-width: 640px) {
        .dashboard-text-btn {
            /* 1. เปลี่ยนพื้นหลังเป็นสีทึบ (สีน้ำเงินเข้ม Slate Blue) ให้เด้งออกมา */
            background-color: #334155;
            border: 1px solid #475569; /* ขอบสีที่เข้ากัน */

            /* 2. ตัวหนังสือสีขาวจั๊วะ เพื่อความชัดสูงสุด */
            color: #ffffff;

            /* 3. เพิ่มความหนาตัวอักษรสำหรับผู้สูงอายุ */
            font-weight: 700;
            font-size: 0.9rem; /* เพิ่มขนาดนิดนึง */

            /* 4. จัดให้ดูเต็มตาขึ้น */
            justify-content: center;
            padding-left: 12px;
            padding-right: 12px;

            /* (ทางเลือก) ถ้าอยากให้ปุ่มยาวเต็มพื้นที่ แข่งกับปุ่มเขียว ให้เปิดบรรทัดนี้ */
            /* flex: 1; */
        }

        /* ปรับไอคอนให้ขาวจั๊วะด้วย */
        .dashboard-text-btn svg {
            stroke-width: 2.5; /* ไอคอนหนาขึ้นอีกนิด */
        }
    }

    /* ถ้าจอเล็กมากๆ (เช่น มือถือรุ่นเก่า) ค่อยซ่อน Text */
    @media (max-width: 360px) {
        .dashboard-text-btn span {
            display: none;
        }
        .dashboard-text-btn {
            padding: 8px;
            width: 42px;
        }
    }

    /* Dashboard Modal Styles */
    .dashboard-box {
        max-width: 600px;
        background: #1e293b;
        max-height: 90vh;
        overflow-y: auto;
    }
    .dashboard-header {
        padding: 25px 30px 15px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        display: flex;
        flex-direction: column;
        gap: 10px;
    }
    .dash-title {
        font-size: 1.8rem;
        font-weight: 800;
        color: white;
        margin: 0;
        line-height: 1.2;
    }
    .dashboard-content {
        padding: 25px 30px;
        display: flex;
        flex-direction: column;
        gap: 20px;
    }
    .dash-desc {
        color: #cbd5e1;
        line-height: 1.6;
        font-size: 1rem;
        margin: 0;
    }

    .dash-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 15px;
        padding: 15px;
        background: #0f172a;
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.05);
    }
    .dash-item {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }
    .dash-label {
        font-size: 0.8rem;
        color: #64748b;
        font-weight: 600;
    }
    .dash-value {
        font-size: 0.95rem;
        color: #f8fafc;
        font-weight: 500;
    }

    .stats-container {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 15px;
    }
    .stat-box {
        border-radius: 12px;
        padding: 15px;
        display: flex;
        align-items: center;
        gap: 12px;
        border: 1px solid transparent;
    }
    .blue-stat {
        background: rgba(59, 130, 246, 0.1);
        border-color: rgba(59, 130, 246, 0.3);
    }
    .stat-icon {
        font-size: 1.8rem;
    }
    .stat-info {
        display: flex;
        flex-direction: column;
    }
    .stat-label {
        font-size: 0.75rem;
        text-transform: uppercase;
        opacity: 0.8;
        font-weight: 700;
    }
    .blue-stat .stat-label {
        color: #60a5fa;
    }

    .stat-value {
        font-size: 1.2rem;
        font-weight: 800;
        color: white;
    }

    .holiday-section {
        background: rgba(239, 68, 68, 0.1);
        border: 1px dashed #ef4444;
        border-radius: 12px;
        padding: 15px;
    }
    .holiday-header {
        color: #f87171;
        font-weight: 700;
        margin-bottom: 8px;
    }
    .holiday-list-dash {
        margin: 0;
        padding-left: 20px;
        color: #fca5a5;
        font-size: 0.9rem;
    }
    .holiday-list-dash li {
        margin-bottom: 4px;
    }

    /* CANCEL BUTTON & MODAL */
    .cancel-btn {
        background: transparent;
        border: 1px solid #ef4444;
        color: #ef4444;
        padding: 8px 16px;
        border-radius: 8px;
        font-size: 0.85rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        margin-top: 8px;
    }
    .cancel-btn:hover {
        background: rgba(239, 68, 68, 0.1);
        transform: translateY(-1px);
    }

    /* Strava verify button */
    .verify-strava-btn {
        background: linear-gradient(135deg, #fc4c02 0%, #e34402 100%);
        color: white;
        border: none;
        padding: 10px 16px;
        border-radius: 8px;
        font-weight: 600;
        font-size: 0.9rem;
        cursor: pointer;
        transition: all 0.2s ease;
        white-space: nowrap;
    }
    .verify-strava-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(252, 76, 2, 0.4);
    }
    .verify-strava-btn:active {
        transform: translateY(0);
    }

    .cancel-modal {
        max-width: 450px;
    }
    .cancel-options {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin: 20px 0;
    }
    .radio-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 16px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
    }
    .radio-item:hover {
        background: rgba(255, 255, 255, 0.05);
        border-color: rgba(255, 255, 255, 0.2);
    }
    .radio-item input[type="radio"] {
        width: 18px;
        height: 18px;
        accent-color: #ef4444;
    }
    .radio-label {
        color: var(--text-main);
        font-size: 0.95rem;
    }
    .reason-input {
        margin-top: 12px;
    }
    .reason-input textarea {
        width: 100%;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        padding: 12px;
        color: var(--text-main);
        font-size: 0.95rem;
        resize: none;
        box-sizing: border-box;
    }
    .reason-input textarea:focus {
        outline: none;
        border-color: #ef4444;
    }
    .action-row {
        margin-top: 20px;
        display: flex;
        justify-content: center;
    }
    .cancel-confirm-btn {
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        color: white;
        border: none;
        padding: 12px 32px;
        border-radius: 10px;
        font-size: 1rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s ease;
    }
    .cancel-confirm-btn:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
    }
    .cancel-confirm-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .pagination-bar {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 6px;
        margin: 24px 0 0 0;
    }
    .pagination-arrow {
        background: #e5e7eb;
        border: none;
        border-radius: 4px;
        padding: 4px 10px;
        font-size: 1.1em;
        cursor: pointer;
        color: #334155;
        transition: background 0.2s;
    }
    .pagination-arrow[disabled] {
        cursor: not-allowed;
    }
    .pagination-page {
        background: #f1f5f9;
        border: none;
        border-radius: 4px;
        padding: 4px 10px;
        font-size: 1em;
        cursor: pointer;
        color: #334155;
        transition:
            background 0.2s,
            color 0.2s;
    }
    .pagination-page.active,
    .pagination-page:focus {
        background: #10b981;
        color: #fff;
        font-weight: bold;
    }
</style>
