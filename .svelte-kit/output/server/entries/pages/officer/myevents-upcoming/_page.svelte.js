import { a0 as ensure_array_like, Y as attr_class, $ as attr_style } from "../../../../chunks/index2.js";
import { o as onDestroy } from "../../../../chunks/index-server.js";
import "@sveltejs/kit/internal";
import "../../../../chunks/exports.js";
import "../../../../chunks/utils.js";
import { a as attr, e as escape_html } from "../../../../chunks/attributes.js";
import "@sveltejs/kit/internal/server";
import "../../../../chunks/state.svelte.js";
import "../../../../chunks/auth.js";
import "sweetalert2";
import { A as API_BASE_URL, r as resolveImageUrl } from "../../../../chunks/imageUtils.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let filteredHistory;
    const BASE_URL = API_BASE_URL;
    let currentView = "my-event";
    let timeLeftStr = "--:--:--";
    let pollInterval = null;
    let pollDelay = 5e3;
    let isPollingActive = false;
    let searchQuery = "";
    let lang = "th";
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
        btn_verify_link: "✅ ยืนยันลิงก์",
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
        participants: "ผู้เข้าร่วม",
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
        alert_session_expired: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่"
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
        btn_verify_link: "✅ Verify Link",
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
        participants: "Participants",
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
        alert_upload_failed: "Upload failed",
        alert_submit_success: "Submitted successfully.",
        alert_session_expired: "Session expired. Please login again."
      }
    };
    let rawParticipations = [];
    let eventsMap = {};
    let holidaysMap = {};
    let upcomingEvents = [];
    let historyEvents = [];
    const menuItems = [
      {
        id: "event-list",
        label: "Event list",
        path: "/officer/event-list",
        svg: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9 2 2 4-4"
      },
      {
        id: "my-event",
        label: "My event",
        path: "/officer/myevents-upcoming",
        svg: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
      },
      {
        id: "account-setting",
        label: "Account setting",
        path: "/officer/setting-account",
        svg: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      }
    ];
    function getDebugDate() {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const debugDate = params.get("debug_date");
        if (debugDate) {
          const testDate = new Date(debugDate);
          if (!isNaN(testDate.getTime())) {
            console.log(`🔧 [DEBUG MODE] Using simulated date: ${debugDate}`);
            return testDate;
          }
        }
      }
      return /* @__PURE__ */ new Date();
    }
    function processData() {
      const upcoming = [];
      const history = [];
      const now = getDebugDate();
      const completionCounts = {};
      rawParticipations.forEach((p) => {
        if (p.status && p.status.toUpperCase() === "COMPLETED") {
          completionCounts[p.event_id] = (completionCounts[p.event_id] || 0) + 1;
        }
      });
      const latestParticipations = {};
      rawParticipations.forEach((p) => {
        if (!latestParticipations[p.event_id] || p.id > latestParticipations[p.event_id].id) {
          latestParticipations[p.event_id] = p;
        }
      });
      Object.values(eventsMap).forEach((ev) => {
        const p = latestParticipations[ev.id];
        if (!p) return;
        let uiStatus = mapApiStatusToUi(p.status);
        let participationId = p.id;
        let proofImg = p.proof_image_url;
        let rejectReason = p.rejection_reason;
        let joinCode = p.join_code;
        let compCode = p.completion_code;
        let actualDist = p.actual_distance_km;
        let compRank = p.completion_rank;
        const recordDateStr = p.created_at || p.date || p.start_date;
        if (recordDateStr) {
          const recordDate = new Date(recordDateStr);
          const today = getDebugDate();
          recordDate.setHours(0, 0, 0, 0);
          today.setHours(0, 0, 0, 0);
          if (recordDate.getTime() !== today.getTime() && uiStatus !== "COMPLETED") {
            console.log(`[AUTO CANCEL] Event ${ev.id}: Registered on different day (${recordDateStr}). Auto-canceling.`);
            uiStatus = "CANCELED";
          }
        }
        if (uiStatus === "CHECKED_IN" && typeof localStorage !== "undefined") {
          const draftKey = `proof_draft_${p.id}`;
          const draftJson = localStorage.getItem(draftKey);
          if (draftJson) {
            try {
              const draft = JSON.parse(draftJson);
              if (draft.step && draft.step >= 2) uiStatus = "proof_submitted";
            } catch (e) {
            }
          }
        }
        const count = completionCounts[ev.id] || 0;
        const startIso = ev.event_date || ev.startDate || ev.event_start_date;
        const endIso = ev.event_end_date || ev.endDate;
        const extractTimeRaw = (isoStr) => {
          if (!isoStr) return "";
          const date = new Date(isoStr);
          const bangkokHours = date.getHours();
          const bangkokMinutes = date.getMinutes();
          const hours = String(bangkokHours).padStart(2, "0");
          const minutes = String(bangkokMinutes).padStart(2, "0");
          return `${hours}:${minutes}`;
        };
        const startTimeStr = extractTimeRaw(startIso);
        const endTimeStr = extractTimeRaw(endIso);
        const parseDateOnly = (isoStr) => {
          if (!isoStr) return null;
          if (isoStr.includes("Z") || isoStr.includes("+")) {
            const d2 = new Date(isoStr);
            return new Date(d2.getFullYear(), d2.getMonth(), d2.getDate());
          }
          const part = isoStr.includes("T") ? isoStr.split("T")[0] : isoStr;
          const [y, m, d] = part.split("-").map(Number);
          return new Date(y, m - 1, d);
        };
        const projectStartDate = parseDateOnly(startIso);
        const projectEndDate = parseDateOnly(endIso);
        if (projectStartDate) projectStartDate.setHours(0, 0, 0, 0);
        if (projectEndDate) projectEndDate.setHours(23, 59, 59, 999);
        const nextWorkingDate = getNextWorkingDay(now, ev.id);
        nextWorkingDate.setHours(0, 0, 0, 0);
        const isNextDayAfterEnd = projectEndDate ? nextWorkingDate.getTime() > projectEndDate.getTime() : false;
        const isProjectEnded = projectEndDate && now > projectEndDate;
        const isProjectNotStarted = projectStartDate && now < projectStartDate;
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
        let isLocked = false;
        let lockMessage = t[lang].btn_locked;
        if (isProjectEnded) {
          isLocked = true;
          lockMessage = "จบกิจกรรม";
        } else if (isProjectNotStarted && uiStatus !== "JOINED") {
          isLocked = true;
          const openDate = getDisplayDate(startIso, void 0, lang);
          lockMessage = `เปิด ${openDate}`;
        } else if (uiStatus === "COMPLETED") {
          isLocked = true;
          if (isNextDayAfterEnd) {
            if (isTimeOver) {
              lockMessage = "จบกิจกรรม";
            } else {
              lockMessage = "เช็คเอาท์เรียบร้อย";
            }
          } else {
            if (isTodayTimeRemaining) {
              lockMessage = "เช็คเอาท์เรียบร้อย";
            } else {
              const nextDateStr = nextWorkingDate.toLocaleDateString("th-TH", { day: "2-digit", month: "2-digit", year: "numeric" });
              lockMessage = `เปิด ${nextDateStr}`;
            }
          }
        } else if (uiStatus === "CHECKED_OUT") {
          isLocked = false;
        } else if (isBeforeTime) {
          isLocked = true;
          lockMessage = "ยังไม่ถึงเวลา";
        } else if (isTimeOver) {
          isLocked = true;
          lockMessage = "หมดเวลากิจกรรม";
        }
        const shouldGoToHistory = isProjectEnded || uiStatus === "CANCELED" || isNextDayAfterEnd && isTimeOver;
        if (shouldGoToHistory) {
          if (count === 0) {
            uiStatus = "CANCELED";
          } else if (count >= 1) {
            if (uiStatus !== "CANCELED") {
              uiStatus = "COMPLETED";
            }
          }
        }
        const totalValidDays = calculateTotalValidDays(startIso || "", endIso || "", ev?.id || 0);
        const item = {
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
          isLocked,
          lockMessage,
          completion_rank: compRank,
          total_days: totalValidDays
        };
        if (shouldGoToHistory) history.push(item);
        else upcoming.push(item);
      });
      upcomingEvents = upcoming;
      historyEvents = history;
    }
    function formatTime(start, end, currentLang) {
      if (!start) return "";
      const extractTime = (val) => {
        if (!val) return "";
        if (val.includes("T")) {
          const d = new Date(val);
          return d.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
            timeZone: "UTC"
          });
        }
        const parts = val.split(":");
        if (parts.length >= 2) return `${parts[0]}:${parts[1]}`;
        return val;
      };
      const timeStart = extractTime(start);
      const timeEnd = extractTime(end);
      if (!timeStart || timeStart === "Invalid Date") return "";
      {
        return timeEnd ? `${timeStart} - ${timeEnd} น.` : `${timeStart} น.`;
      }
    }
    function mapApiStatusToUi(apiStatus) {
      if (!apiStatus) return "JOINED";
      const s = apiStatus.toLowerCase();
      if (s === "joined") return "JOINED";
      if (s === "checked_in") return "CHECKED_IN";
      if (s === "rejected") return "REJECTED";
      if (s === "proof_submitted" || s === "submitted" || s === "pending" || s.includes("wait") || s === "pending_proof") {
        return "proof_submitted";
      }
      if (s === "checked_out" || s === "pass" || s === "verified") {
        return "CHECKED_OUT";
      }
      if (s === "completed" || s === "finished") return "COMPLETED";
      if (s === "canceled" || s === "cancelled") return "CANCELED";
      return "JOINED";
    }
    function getLocalToken() {
      if (typeof localStorage === "undefined") return "";
      let token = localStorage.getItem("token") || localStorage.getItem("access_token") || "";
      if (!token) {
        const userStr = localStorage.getItem("user") || localStorage.getItem("user_info");
        if (userStr) {
          try {
            const userObj = JSON.parse(userStr);
            token = userObj.token || userObj.accessToken || userObj.access_token || "";
          } catch (e) {
          }
        }
      }
      return token;
    }
    function getToken() {
      return getLocalToken();
    }
    function getUserIdFromToken() {
      const token = getLocalToken();
      if (!token) return null;
      try {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(window.atob(base64).split("").map(function(c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(""));
        const payload = JSON.parse(jsonPayload);
        return payload.id || payload.user_id || payload.sub || payload.userId;
      } catch (e) {
        console.error("Token parsing error", e);
        return null;
      }
    }
    function calculateTotalValidDays(startStr, endStr, eventId) {
      if (!startStr || !endStr) return 0;
      const parseToLocalDate = (s) => {
        if (s.includes("Z") || s.includes("+")) {
          const d2 = new Date(s);
          return new Date(d2.getFullYear(), d2.getMonth(), d2.getDate());
        }
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
    function getDisplayDate(start, end, l = "th") {
      if (!start) return "-";
      const locale = l === "th" ? "th-TH" : "en-GB";
      const opts = { day: "numeric", month: "short", year: "numeric" };
      const parseToLocalDate = (s) => {
        if (!s) return null;
        if (s.includes("Z") || s.includes("+")) {
          const d2 = new Date(s);
          return new Date(d2.getFullYear(), d2.getMonth(), d2.getDate());
        }
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
    function checkIsHoliday(date, eventId) {
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
    function getNextWorkingDay(startDate, eventId) {
      let nextDate = new Date(startDate);
      do {
        nextDate.setDate(nextDate.getDate() + 1);
      } while (checkIsHoliday(nextDate, eventId));
      return nextDate;
    }
    function startPolling() {
      if (pollInterval) return;
      isPollingActive = true;
      console.log("🔄 Starting auto-refresh polling (every 5s)");
      pollInterval = setInterval(
        async () => {
          if (!isPollingActive) return;
          try {
            await silentRefresh();
          } catch (err) {
            console.error("Polling error:", err);
          }
        },
        pollDelay
      );
    }
    function stopPolling() {
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
      isPollingActive = false;
      console.log("⏹️ Stopped auto-refresh polling");
    }
    async function silentRefresh() {
      const token = getToken();
      const userId = getUserIdFromToken();
      if (!token || !userId) return;
      try {
        const resPart = await fetch(`${BASE_URL}/api/participations/user/${userId}`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });
        if (!resPart.ok) return;
        const newParticipations = await resPart.json();
        let hasChanges = false;
        for (const newP of newParticipations) {
          const oldP = rawParticipations.find((p) => p.id === newP.id);
          if (!oldP || oldP.status !== newP.status) {
            hasChanges = true;
            console.log(`📢 Status changed: ${oldP?.status || "NEW"} → ${newP.status}`);
            break;
          }
        }
        if (newParticipations.length !== rawParticipations.length) {
          hasChanges = true;
        }
        if (hasChanges) {
          console.log("✅ Detected changes, updating UI...");
          rawParticipations = newParticipations;
          processData();
        }
      } catch (err) {
      }
    }
    function handleVisibilityChange() {
      if (document.hidden) {
        stopPolling();
      } else {
        startPolling();
      }
    }
    onDestroy(() => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("offline", stopPolling);
      window.removeEventListener("online", startPolling);
    });
    upcomingEvents.filter((event) => event.title.toLowerCase().includes(searchQuery.toLowerCase()) || event.description.toLowerCase().includes(searchQuery.toLowerCase()));
    filteredHistory = historyEvents.filter((event) => event.title.toLowerCase().includes(searchQuery.toLowerCase()) && event.status !== "CANCELED");
    $$renderer2.push(`<div class="app-container svelte-61olve"><header class="header-bar svelte-61olve"><div class="header-inner svelte-61olve"><div class="left-group svelte-61olve"><div class="brand svelte-61olve"><span class="brand-name svelte-61olve">OFFICER</span></div> <nav class="nav-menu desktop-only svelte-61olve"><!--[-->`);
    const each_array = ensure_array_like(
      // --- CASE: CHECKOUT (จบงานวันนี้) ---
      // [แก้ไข] ตัด Logic วนลูป Auto-Join ออกทั้งหมด เหลือแค่นี้ครับ
      // "สำเร็จ"
      // "ผ่านแล้ว"
      // เปลี่ยนสถานะในหน้าเว็บเป็น COMPLETED (จบแล้วสำหรับวันนี้)
      // รีโหลดข้อมูลใหม่เพื่อให้เห็นสถานะล่าสุดจาก Server
      // ปิด Modal
      // --- CASE: อื่นๆ (เช่น JOINED -> CHECKED_IN) ---
      // (Logic เดิมส่วนนี้เก็บไว้เหมือนเดิม ไม่ต้องแก้)
      // ดึงสถานะล่าสุด
      // ✅ Clear ALL storage and cookies
      // ✅ Clear ALL storage and cookies
      // --- DASHBOARD STATE ---
      // --- HELPER FUNCTIONS ---
      // Parse date ให้ถูกต้องโดยพิจารณา timezone
      // ถ้าเป็น ISO format ที่มี Z (UTC) ให้แปลงเป็น local time ก่อน
      // ถ้าเป็น format ไม่มี timezone (YYYY-MM-DDTHH:mm:ss หรือ YYYY-MM-DD)
      // Parse date ให้ถูกต้องโดยพิจารณา timezone
      // ถ้าเป็น ISO format ที่มี Z (UTC) ให้แปลงเป็น local time ก่อน
      // ถ้าเป็น format ไม่มี timezone (YYYY-MM-DDTHH:mm:ss หรือ YYYY-MM-DD)
      // --- CANCEL FUNCTIONS ---
      // เช็คกรณีเลือก "อื่นๆ" แต่ไม่พิมพ์อะไรมา
      // Update local state
      // Reload data
      // [NEW VALIDATION] ถ้าไม่มี join_code หมายถึงไม่ได้สมัครสำหรับวันนี้
      // 1. ดึงสถานะล่าสุดจาก Backend
      // 2. แปลงข้อมูลจาก Backend เป็น UI
      // [ตรวจสอบเฉพาะวันนี้] ถ้าข้อมูลเป็นของวันเก่า ให้ถือว่าไม่มีข้อมูล
      // ถ้าไม่ใช่วันนี้ -> ให้ทิ้งข้อมูลนี้ไปเลย (Force Null)
      // ถ้ายังมี statusData (แปลว่าเป็นของวันนี้) ก็ Map ตามปกติ
      // ถ้าไม่มีข้อมูล (หรือถูกกรองทิ้งเมื่อกี้) ให้รีเซ็ตสถานะเพื่อให้พร้อมสมัครใหม่
      // [REMOVED] ลบระบบสมัครอัตโนมัติ (joinDailyEvent)
      // ผู้ใช้จะต้องสมัครเฉพาะวันที่ต้องการเท่านั้น จากหน้า event-list
      // ถ้า updatedEvent.status เป็น JOINED และไม่มี join_code แสดงว่ายังไม่ได้สมัครสำหรับวันนี้
      // แค่ข้อมูลเก่าจากวันก่อนหน้านี้ (ซึ่งถูก auto-cancel แล้วในส่วน processData)
      // --------------------------------------------------------
      // ... (Code การเปิด Modal ส่วนที่เหลือเหมือนเดิม) ...
      // แสดง Loading ระหว่างย่อรูป
      // เรียกใช้ฟังก์ชันย่อรูป
      // เก็บไฟล์ที่ย่อแล้วเตรียมส่ง
      // แสดง Preview จากไฟล์ที่ย่อแล้ว
      // ปิด Loading เมื่อเสร็จ
      /**
       * Validate and check Strava link
       * Supports multiple Strava URL formats:
       * - https://www.strava.com/activities/12345
       * - https://strava.app.link/xxxxx
       * - https://strava.com/activities/12345
       */
      /**
       * Extract activity ID from Strava URL
       */
      // Match /activities/12345
      // For short links, we need to resolve them server-side
      // Need server to resolve
      // Validate Strava URL format
      // Use Backend API endpoint for Strava parsing
      // ✅ Mark as verified
      // API returned but distance is 0
      // ✅ Mark as verified
      // API didn't return distance - ask user to input manually
      // API endpoint doesn't exist or bad request - allow manual input
      // If API fails, allow manual input
      // ✅ Mark as verified
      // ✅ บังคับให้กดปุ่มตรวจสอบก่อน
      // 1. Validate Participation ID
      // 2. Validate Strava Link (Required)
      // 3. Validate Image
      // 3. Upload Image (If new file selected) - Using centralized uploadImage
      // 4. Prepare Payload
      // เริ่มต้นด้วยการเดาว่าเป็น POST (หรือ PUT ถ้า REJECTED)
      // [FIX: AUTO RETRY] ถ้าส่ง POST แล้วเจอ Error 400 (Invalid participation) 
      // แสดงว่า Backend ต้องการให้ส่งแบบ PUT (Resubmit) -> ให้ลองส่งใหม่ทันที
      // --- AUTO-REFRESH POLLING FUNCTIONS ---
      // Already polling
      // Silent refresh without showing loading state
      // Check if any status changed
      // Also check if participation count changed
      // Silently ignore errors in background refresh
      // Visibility change handler for pausing/resuming polling
      // Start realtime polling
      // Pause/resume when tab visibility changes
      // Pause when offline, resume when online
      // [เพิ่มใหม่] ฟังก์ชันย่อรูปภาพ (Client-side Compression)
      // คำนวณ Ratio
      // แปลงกลับเป็น File (JPEG)
      menuItems
    );
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let item = each_array[$$index];
      $$renderer2.push(`<button${attr_class("menu-btn svelte-61olve", void 0, { "active": currentView === item.id })}><svg class="nav-icon svelte-61olve" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"${attr("d", item.svg)} class="svelte-61olve"></path></svg> <span class="btn-label svelte-61olve">${escape_html(item.label)}</span></button>`);
    }
    $$renderer2.push(`<!--]--></nav></div> <div class="search-bar-container desktop-only svelte-61olve"><div class="search-input-wrapper svelte-61olve"><svg class="search-icon active-search-icon svelte-61olve" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" class="svelte-61olve"></path></svg> <input type="text"${attr("placeholder", t[lang].search_placeholder)} class="search-input svelte-61olve"${attr("value", searchQuery)}/></div></div> <div class="user-zone svelte-61olve"><div class="timer-pill svelte-61olve">${escape_html(timeLeftStr)}</div> <div class="lang-switch desktop-only svelte-61olve"><button${attr_class("svelte-61olve", void 0, { "active": lang === "th" })}>TH</button> <span class="sep svelte-61olve">|</span> <button${attr_class("svelte-61olve", void 0, { "active": lang === "en" })}>EN</button></div> <button class="logout-btn desktop-only svelte-61olve" aria-label="Logout"><svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" class="svelte-61olve"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" class="svelte-61olve"></path></svg></button> <button class="mobile-toggle mobile-only svelte-61olve" aria-label="Toggle menu"><svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" class="svelte-61olve"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 9h16M4 15h16" class="svelte-61olve"></path></svg></button></div></div></header> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <div class="scroll-container svelte-61olve"><div class="content-wrapper svelte-61olve"><div id="upcoming-section" class="section-header-wrapper header-row svelte-61olve"><div class="header-left svelte-61olve"><h1 class="section-title svelte-61olve">${escape_html(t[lang].upcoming_header)}</h1> <div class="title-underline svelte-61olve"></div></div> <button class="jump-btn svelte-61olve">${escape_html(t[lang].history_header)} <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" class="svelte-61olve"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" class="svelte-61olve"></path></svg></button></div> `);
    {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div style="text-align: center; color: #94a3b8; padding: 40px;" class="svelte-61olve">Loading...</div>`);
    }
    $$renderer2.push(`<!--]--> <div id="history-section" class="section-header-wrapper header-row svelte-61olve" style="margin-top: 60px;"><div class="header-left svelte-61olve"><h1 class="section-title svelte-61olve">${escape_html(t[lang].history_header)}</h1> <div class="title-underline svelte-61olve"></div></div> <button class="jump-btn svelte-61olve">${escape_html(t[lang].upcoming_header)} <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="transform: rotate(180deg);" class="svelte-61olve"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" class="svelte-61olve"></path></svg></button></div> <div class="events-grid svelte-61olve"><!--[-->`);
    const each_array_4 = ensure_array_like(filteredHistory);
    for (let i = 0, $$length = each_array_4.length; i < $$length; i++) {
      let event = each_array_4[i];
      $$renderer2.push(`<div class="event-card svelte-61olve"><div class="card-image svelte-61olve"></div> <div class="card-content svelte-61olve"><div class="card-header-row svelte-61olve"><h3 class="card-title svelte-61olve">${escape_html(event.title)}</h3> <div class="badges-col svelte-61olve">`);
      if (event.isJoined) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div style="display:flex; flex-direction:column; align-items:flex-end; gap:4px;" class="svelte-61olve"><span class="status-badge ended-normal svelte-61olve">${escape_html(t[lang].status_ended)}</span> `);
        if (event.completion_rank && event.completion_rank > 0) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<span class="status-badge svelte-61olve" style="background:#fbbf24; color:#78350f; border:1px solid #f59e0b; font-size:0.7rem;">🏆 ${escape_html(t[lang].rank_label)} ${escape_html(event.completion_rank)}</span>`);
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--> <span class="status-badge svelte-61olve" style="background:#10b981; color:white; border:none; font-size:0.7rem;">🏃 ${escape_html(event.completed_count)} / ${escape_html(event.total_days)} ${escape_html(t[lang].dash_unit_days)}</span></div>`);
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`<span class="status-badge ended-canceled svelte-61olve">CANCELED</span>`);
      }
      $$renderer2.push(`<!--]--></div></div> <p${attr_class("card-desc svelte-61olve", void 0, { "expanded": event.isExpanded })}>${escape_html(event.description)}</p> `);
      if (event.isExpanded) {
        $$renderer2.push("<!--[-->");
        const hConfig = holidaysMap[event.id];
        const hasHoliday = hConfig && (hConfig.excludeWeekends || hConfig.holidays && hConfig.holidays.length > 0);
        $$renderer2.push(`<div class="info-grid svelte-61olve"><div class="info-pill svelte-61olve"><svg class="pill-icon svelte-61olve" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" class="svelte-61olve"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" class="svelte-61olve"></path></svg> <span class="svelte-61olve">${escape_html(event.location)}</span></div> <div class="info-pill svelte-61olve"><svg class="pill-icon svelte-61olve" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" class="svelte-61olve"></path></svg> <span class="svelte-61olve">${escape_html(getDisplayDate(event.raw_start_date, event.raw_end_date, lang))}</span></div> <div class="info-pill svelte-61olve"><svg class="pill-icon svelte-61olve" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" class="svelte-61olve"></path></svg> <span class="svelte-61olve">${escape_html(formatTime(event.raw_start_time || "", event.raw_end_time || ""))}</span></div> <div class="info-pill highlight-pill svelte-61olve"><svg class="pill-icon svelte-61olve" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" class="svelte-61olve"></path></svg> <span class="svelte-61olve">${escape_html(event.distance_km)} KM</span></div> <div class="holiday-info-box svelte-61olve"${attr_style(!hasHoliday ? "background: rgba(16, 185, 129, 0.1); border-color: #10b981;" : "")}><div class="holiday-title svelte-61olve"${attr_style(!hasHoliday ? "color: #10b981;" : "")}>${escape_html(t[lang].dash_holiday_title)}</div> <ul class="holiday-list svelte-61olve"${attr_style(!hasHoliday ? "color: #34d399;" : "")}>`);
        if (hasHoliday) {
          $$renderer2.push("<!--[-->");
          if (hConfig.excludeWeekends) {
            $$renderer2.push("<!--[-->");
            $$renderer2.push(`<li class="svelte-61olve">• ${escape_html(t[lang].dash_holiday_weekend)}</li>`);
          } else {
            $$renderer2.push("<!--[!-->");
          }
          $$renderer2.push(`<!--]--> `);
          if (hConfig.holidays) {
            $$renderer2.push("<!--[-->");
            $$renderer2.push(`<!--[-->`);
            const each_array_5 = ensure_array_like(hConfig.holidays);
            for (let $$index_4 = 0, $$length2 = each_array_5.length; $$index_4 < $$length2; $$index_4++) {
              let hDate = each_array_5[$$index_4];
              $$renderer2.push(`<li class="svelte-61olve">• ${escape_html(getDisplayDate(hDate, void 0, lang))}</li>`);
            }
            $$renderer2.push(`<!--]-->`);
          } else {
            $$renderer2.push("<!--[!-->");
          }
          $$renderer2.push(`<!--]-->`);
        } else {
          $$renderer2.push("<!--[!-->");
          $$renderer2.push(`<li class="svelte-61olve">${escape_html(t[lang].dash_no_holiday)}</li>`);
        }
        $$renderer2.push(`<!--]--></ul></div></div>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> <div class="card-footer-actions svelte-61olve"><button class="dashboard-text-btn svelte-61olve"><svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" class="svelte-61olve"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" class="svelte-61olve"></path></svg> <span class="svelte-61olve">${escape_html("ผลสรุป")}</span></button> `);
      if (event.isJoined) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<button class="status-btn completed-btn svelte-61olve" style="cursor: default; box-shadow: none;">COMPLETED</button>`);
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`<button class="status-btn canceled-btn svelte-61olve" style="cursor: default; box-shadow: none;">CANCELED</button>`);
      }
      $$renderer2.push(`<!--]--></div></div></div>`);
    }
    $$renderer2.push(`<!--]--></div> <footer class="app-footer svelte-61olve"><div class="footer-separator svelte-61olve"></div> <div class="footer-content svelte-61olve"><p class="copyright svelte-61olve">© 2025 Cyber Geek. All rights reserved.</p> <p class="credits svelte-61olve">Designed &amp; Developed by <span class="highlight svelte-61olve">Cyber Geek Development</span></p> <p class="contact svelte-61olve">Contact: <a href="mailto:cybergeek.dev@proton.me" class="svelte-61olve">cybergeek.dev@proton.me</a></p></div></footer></div></div> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]-->`);
  });
}
export {
  _page as default
};
