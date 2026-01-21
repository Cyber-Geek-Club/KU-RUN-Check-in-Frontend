<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { api } from '../_lib/api/client';
  import { endpoints } from '../_lib/api/endpoints';
  import Swal from 'sweetalert2';
  

  const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://158.108.102.14:8001").replace(/\/$/, "");

  function capitalizeFirstLetter(string: string) {
    if (!string) return "Pending";
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  }

  function getApiImageUrl(path: string): string {
    if (!path) return "";
    if (path.startsWith("http")) return path; // ถ้ามี http อยู่แล้วใช้ได้เลย

    // ลบ / ตัวหน้าออกถ้ามี
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;

    // If the path already contains api/ (e.g. api/uploads/...), don't add another /api/
    if (cleanPath.startsWith('api/')) {
      return `${API_BASE_URL}/${cleanPath}`;
    }

    // If path already begins with uploads/, use /api/uploads/
    if (cleanPath.startsWith('uploads/')) {
      return `${API_BASE_URL}/api/${cleanPath}`;
    }

    // Otherwise assume it's a relative file path and put it under /api/uploads/
    return `${API_BASE_URL}/api/uploads/${cleanPath}`;
  }
  // --- Language ---
  type Language = "th" | "en";
  let currentLang: Language = "th";
  
  if (typeof localStorage !== "undefined") {
    const saved = localStorage.getItem("app_language");
    if (saved === "th" || saved === "en") currentLang = saved;
  }
  
  const translations = {
    // ... (คงเดิม ไม่ต้องแก้)
    th: {
      proofVerification: "ตรวจสอบหลักฐาน",
      selectEvent: "เลือกกิจกรรม",
      noEventsFound: "ไม่พบกิจกรรม",
      verifySubmissions: "ตรวจสอบการส่ง",
      backToEvents: "กลับไปหน้างาน",
      pending: "รอการตรวจสอบ",
      approved: "อนุมัติแล้ว",
      rejected: "ปฏิเสธแล้ว",
      all: "ทั้งหมด",
      apply: "ใช้งาน",
      reset: "รีเซ็ต",
      approve: "อนุมัติ",
      reject: "ปฏิเสธ",
      noPendingSubmissions: "ไม่มีการส่งที่รอตรวจสอบ",
      loadingSubmissions: "กำลังโหลดข้อมูล...",
      searchPlaceholder: "ค้นหาด้วยชื่อ, อีเมล หรือ รหัสนิสิต...",
      batch: "รุ่น",
      stdId: "รหัสนิสิต",
      from: "จาก",
      to: "ถึง",
      selectDate: "เลือกวันที่",
      totalSubmissions: "ทั้งหมด",
      pendingReview: "รอตรวจสอบ",
      approvedToday: "อนุมัติวันนี้",
      rejectedToday: "ปฏิเสธวันนี้",
      loading: "กำลังโหลด...",
      showingResults: "แสดง",
      of: "จาก",
      results: "รายการ",
      status: "สถานะ",
      submittedAt: "ส่งเมื่อ",
      viewImage: "ดูรูปภาพ",
    },
    en: {
      proofVerification: "Proof Verification",
      selectEvent: "Select Event",
      noEventsFound: "No events found",
      verifySubmissions: "Verify Submissions",
      backToEvents: "Back to Events",
      pending: "Pending",
      approved: "Approved",
      rejected: "Rejected",
      all: "All",
      apply: "Apply",
      reset: "Reset",
      approve: "Approve",
      reject: "Reject",
      noPendingSubmissions: "No pending submissions",
      loadingSubmissions: "Loading submissions...",
      searchPlaceholder: "Search by name, email, or Nisit ID...",
      batch: "Batch",
      stdId: "Std ID",
      from: "From",
      to: "To",
      selectDate: "Select date",
      totalSubmissions: "Total",
      pendingReview: "Pending",
      approvedToday: "Approved Today",
      rejectedToday: "Rejected Today",
      loading: "Loading...",
      showingResults: "Showing",
      of: "of",
      results: "results",
      status: "Status",
      submittedAt: "Submitted At",
      viewImage: "View Image",
    },
  };
  
  $: lang = translations[currentLang];
  
  // --- Interfaces ---
  interface Event {
    id: string;
    title: string;
    description: string;
    location: string;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    status: "Active" | "Closed" | "Draft";
    image: string;
    pendingCount?: number;
  }
  
  interface Submission {
    id: string | number;
    runnerName: string;
    odySd: string;
    email: string;
    proofImage: string;
    status: "Pending" | "Approved" | "Rejected";
    submittedAt: string;
    updatedAt: string;
    stravaLink?: string;
    actualDistance?: number;
    userId?: number | string | null;
  }
  
  interface Statistics {
    total: number;
    pending: number;
    approvedToday: number;
    rejectedToday: number;
  }
  
  // --- State ---
  let view: 'events' | 'submissions' = 'events';
  let events: Event[] = [];
  let selectedEvent: Event | null = null;
  let submissions: Submission[] = [];
  let loading = false;
  // Cache user profiles fetched from /api/users/{id}
  const userCache: Record<string, any> = {};
  
  // Event Selection
  let eventsPage = 1;
  const eventsPerPage = 9;
  let showEventsPageDropdown = false;
  
  // Filters
  let searchQuery = "";
  let batchFilter = "";
  let stdIdFilter = "";
  let statusFilter = "Pending";
  let fromDate = "";
  let toDate = "";
  
  // Filter dropdowns
  let showStatusDropdown = false;
  let showFromDateDropdown = false;
  let showToDateDropdown = false;
  
  // Submissions pagination
  let submissionsPage = 1;
  const submissionsPerPage = 12;
  let showSubmissionsPageDropdown = false;
  
  // Auto-refresh
  let autoRefreshEnabled = false;
  let autoRefreshInterval: any;
  let isConnected = false;
  let newSubmissionsCount = 0;
  
  // Image modal
  let showImageModal = false;
  let modalImageUrl = "";
  
  // Available dates
  let availableDates: { value: string; display: string }[] = [];
  
  // Statistics
  let statistics: Statistics = {
    total: 0,
    pending: 0,
    approvedToday: 0,
    rejectedToday: 0
  };
  
  // --- Computed ---
  $: paginatedEvents = events.slice((eventsPage - 1) * eventsPerPage, eventsPage * eventsPerPage);
  $: totalEventsPages = Math.ceil(events.length / eventsPerPage);
  
  $: filteredSubmissions = submissions.filter(sub => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match = sub.runnerName.toLowerCase().includes(q) ||
                    sub.email.toLowerCase().includes(q) ||
                    sub.odySd.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (batchFilter && batchFilter.length === 2) {
      if (!sub.odySd.startsWith(batchFilter)) return false;
    }
    if (stdIdFilter && stdIdFilter.length > 0) {
      const stdPart = sub.odySd.substring(2, 8);
      if (!stdPart.includes(stdIdFilter)) return false;
    }
    if (statusFilter !== "All" && sub.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
    if (fromDate || toDate) {
      const nd = normalizeToLocalDate(sub.submittedAt);
      const subDate = nd ? formatDateYYYYMMDD(nd) : null;
      if (!subDate) return false;
      if (fromDate && subDate < fromDate) return false;
      if (toDate && subDate > toDate) return false;
    }
    return true;
  });
  
  $: sortedSubmissions = [...filteredSubmissions].sort((a, b) => {
    return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
  });
  
  $: paginatedSubmissions = sortedSubmissions.slice(
    (submissionsPage - 1) * submissionsPerPage,
    submissionsPage * submissionsPerPage
  );
  
  $: totalSubmissionsPages = Math.ceil(sortedSubmissions.length / submissionsPerPage);
  $: totalSubmissions = sortedSubmissions.length;

  // Helper: normalize a date string to a Date at local midnight
  function normalizeToLocalDate(dateStr?: string | null) {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  function formatDateYYYYMMDD(dateObj: Date) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  }

  // Is the selected event a single-day event? (compare date-only values)
  $: isSingleDayEvent = (() => {
    if (!selectedEvent || !selectedEvent.startDate) return false;
    const s = normalizeToLocalDate(selectedEvent.startDate);
    const e = normalizeToLocalDate(selectedEvent.endDate || selectedEvent.startDate);
    if (!s || !e) return false;
    return formatDateYYYYMMDD(s) === formatDateYYYYMMDD(e);
  })();
  
  // --- Functions ---
  
  function formatTimestamp(timestamp: string): string {
    if (!timestamp) return "-";
    const date = new Date(timestamp);
    
    // เช็คว่าวันที่ถูกต้องหรือไม่
    if (isNaN(date.getTime())) return "-";

    // ✅ ใช้ format เดียวกับ Events (Day Month Year + Time)
    return date.toLocaleDateString(currentLang === "th" ? "th-TH" : "en-GB", {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }

  function escapeHtml(input: any): string {
    if (input === null || input === undefined) return '';
    return String(input)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatDateRange(event: Event | undefined | null, lang: Language): string {
    if (!event || !event.startDate) return "";
    const start = new Date(event.startDate);
    const end = new Date(event.endDate || event.startDate);
    const locale = lang === "th" ? "th-TH" : "en-GB";
    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
    
    if (start.toDateString() === end.toDateString()) {
      return start.toLocaleDateString(locale, options);
    }
    return `${start.toLocaleDateString(locale, options)} - ${end.toLocaleDateString(locale, options)}`;
  }
  
  function translateStatus(status: string): string {
    const map: any = {
      Active: currentLang === "th" ? "เปิดใช้งาน" : "Active",
      Closed: currentLang === "th" ? "ปิดแล้ว" : "Closed",
      Draft: currentLang === "th" ? "แบบร่าง" : "Draft",
    };
    return map[status] || status;
  }
  
  function calculateStatistics() {
    statistics.total = submissions.length;
    statistics.pending = submissions.filter(s => s.status === "Pending").length;
    
    const today = new Date().toDateString();
    statistics.approvedToday = submissions.filter(s => {
      const actionDate = s.updatedAt ? new Date(s.updatedAt).toDateString() : new Date(s.submittedAt).toDateString();
      return s.status === "Approved" && actionDate === today;
    }).length;
    statistics.rejectedToday = submissions.filter(s => {
        const actionDate = s.updatedAt ? new Date(s.updatedAt).toDateString() : new Date(s.submittedAt).toDateString();
      return s.status === "Rejected" && actionDate === today;
    }).length;
  }
  
  // --- API Functions ---

 async function loadEvents() {
    loading = true;
    try {
      let userId = "";
      if (typeof localStorage !== 'undefined') {
        const userInfo = localStorage.getItem('user_info');
        if (userInfo) {
          try {
            const user = JSON.parse(userInfo);
            userId = user.id;
          } catch (e) { console.error("Error parsing user_info:", e); }
        }
      }

      if (!userId) {
        console.error("User ID not found in localStorage");
        events = [];
        loading = false;
        return;
      }

      const response = await api.get(endpoints.events.list);
      console.log("Events Data:", response.data); 

      if (response.data && Array.isArray(response.data)) {
        events = response.data.map((e: any) => ({
          id: e.id,
          title: e.title,
          description: e.description,
          location: e.location,
          
          // ✅ แก้ไขตรงนี้: เพิ่ม e.event_date และ e.event_end_date ตาม JSON ที่ให้มา
          startDate: e.event_date || e.start_date || e.startDate || new Date().toISOString(),
          endDate: e.event_end_date || e.end_date || e.endDate || new Date().toISOString(),
          
          startTime: e.start_time || e.startTime || "",
          endTime: e.end_time || e.endTime || "",
          
          status: e.is_active ? "Active" : "Closed", // ปรับ Status ตาม JSON (is_active)
          
          // JSON มี banner_image_url เราก็ดึงมาใช้
          image: getApiImageUrl(e.banner_image_url || e.cover_image_url || e.image || ""),
          
          pendingCount: e.pending_proof_count || e.pending_count || 0,
          organizer: e.created_by || null,
          details: null,
          tags: [],
          participants: [],
          maxParticipants: e.max_participants || null,
          eventType: e.event_type || null,
        }));
      } else {
        events = [];
      }
    } catch (error: any) {
      console.warn('❌ loadEvents Error:', error);
      events = [];
    } finally {
      loading = false;
    }
  }
  
  async function selectEvent(event: Event) {
    // Debugging: ensure selectedEvent has a proper image
    console.log('selectEvent called, event:', event);
    const ensuredImage = event.image && event.image !== ""
      ? event.image
      : getApiImageUrl((event as any).banner_image_url || (event as any).cover_image_url || (event as any).image || "");
    selectedEvent = { ...event, image: ensuredImage };
    console.log('selectedEvent.image ->', selectedEvent.image);
    view = 'submissions';
    statusFilter = "Pending";
    await loadSubmissions(event.id);
  }
  
 async function loadSubmissions(eventId: string) {
    loading = true;
    try {
      // เรียก API
      const response = await api.get(endpoints.participations.listByEvent(eventId));
      console.log("Submissions Data:", response.data);

      // ✅ [แก้ไข 1] รองรับโครงสร้างข้อมูลแบบ { proofs: [...] }
      const rawData = response.data;
      const dataList = Array.isArray(rawData) ? rawData : (rawData.proofs || []);

        if (Array.isArray(dataList)) {
          submissions = dataList.map((item: any) => {
            const userObj = item.user || {};
            
            // ✅ [แก้ไข 2] ดึงวันที่จาก proof_submitted_at (ตาม JSON)
            const rawDate = item.proof_submitted_at || item.created_at || item.createdAt || new Date().toISOString();

            // ✅ [แก้ไข 3] แปลง Status "proof_submitted" -> "Pending" เพื่อให้ Filter ทำงานได้
            let mappedStatus = item.status;
            if (mappedStatus === 'proof_submitted') {
                mappedStatus = 'Pending';
            } else {
                mappedStatus = capitalizeFirstLetter(mappedStatus);
            }

            return {
              // ✅ [แก้ไข 4] Map ชื่อตัวแปรให้ตรงกับ JSON
              id: item.participation_id || item.id, 
              runnerName: userObj.full_name || userObj.display_name || item.runner_name || "Unknown",
              // Try many common keys used by different backends (nisit_id, nisitId, student_id, studentId)
              odySd: userObj.nisit_id || userObj.nisitId || userObj.student_id || userObj.studentId || item.student_id || item.nisit_id || item.odySd || "-",
              email: userObj.email || item.email || "-",
              
              // ✅ [แก้ไข 5] ใช้ proof_image_url
              proofImage: getApiImageUrl(item.proof_image_url || item.proof_url || item.image_url || ""),
              
              status: mappedStatus,
              
              submittedAt: rawDate,
              updatedAt: item.updated_at || rawDate,
              
              // ✅ [แก้ไข 6] ใช้ strava_link และ actual_distance_km
              stravaLink: item.strava_link || item.strava_url || null,
              actualDistance: parseFloat(item.actual_distance_km || item.distance || "0"),
              // keep user id if available so we can fetch UserReward after verify
              userId: userObj.id || item.user_id || item.userId || null,
            };
          });
        // Prefetch user profiles for submissions (when userId present)
        try {
          const userIds = Array.from(new Set(submissions.map(s => s.userId).filter((x): x is string | number => Boolean(x))));
          await Promise.all(userIds.map(async (uid: string | number) => {
            const key = String(uid);
            if (userCache[key] !== undefined) return;
            try {
              const res = await api.get(endpoints.users.getById(uid as string | number));
              userCache[key] = res.data;
            } catch (e) {
              console.warn('Failed to fetch user profile', uid, e);
              userCache[key] = null;
            }
          }));

          // Merge cached nisit_id/email into submissions when missing
          submissions = submissions.map(s => {
            const key = String(s.userId || '');
            const u = userCache[key];
            const nisitFromCache = u ? (u.nisit_id || u.nisitId || null) : null;
            const emailFromCache = u ? (u.email || null) : null;
            return {
              ...s,
              odySd: (s.odySd && s.odySd !== '-') ? s.odySd : (nisitFromCache || '-') ,
              email: (s.email && s.email !== '-') ? s.email : (emailFromCache || '-')
            } as Submission;
          });
        } catch (e) {
          console.warn('User prefetch failed', e);
        }
      } else {
          submissions = [];
      }
      
      // Filter วันที่ — prefer event date range when available
      if (selectedEvent && selectedEvent.startDate) {
        const start = normalizeToLocalDate(selectedEvent.startDate)!;
        const end = normalizeToLocalDate(selectedEvent.endDate || selectedEvent.startDate)!;
        const datesArr: string[] = [];
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          // push local YYYY-MM-DD
          datesArr.push(formatDateYYYYMMDD(new Date(d)));
        }
        availableDates = datesArr.map(d => ({
          value: d,
          display: new Date(d).toLocaleDateString(currentLang === "th" ? "th-TH" : "en-GB", {
            day: '2-digit', month: 'short', year: 'numeric'
          })
        }));

        // If event is single-day, preselect that date
        if (availableDates.length === 1) {
          fromDate = availableDates[0].value;
          toDate = availableDates[0].value;
        }
      } else {
        const dates = [...new Set(submissions.map(s => s.submittedAt.split('T')[0]))];
        availableDates = dates.sort().reverse().map(d => ({
          value: d,
          display: new Date(d).toLocaleDateString(currentLang === "th" ? "th-TH" : "en-GB", {
            day: '2-digit', month: 'short', year: 'numeric'
          })
        }));
      }

      calculateStatistics();
    } catch (error) {
      console.warn('Failed to load submissions:', error);
      submissions = [];
      calculateStatistics();
    } finally {
      loading = false;
    }
  }
  
  async function verifyParticipationAPI(
    pid: string | number,
    approved: boolean,
    reason: string = ""
  ) {
    const payload: any = { participation_id: pid, approved };
    if (!approved) payload.rejection_reason = reason;

    try {
      // ❌ ผิด:
      // const res = await api.post("/api/participations/verify", payload);

      // ✅ ถูกต้อง:
      const res = await api.post(endpoints.participations.verify, payload);
      return res.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || "Verification failed");
    }
  }

  // Fetch UserReward records for a user (used after approval)
  async function fetchUserRewards(userId: number | string | null) {
    if (!userId) return [];
    try {
      const res = await api.get(endpoints.rewards.getByUser(userId));
      return res.data || [];
    } catch (err) {
      console.warn('Failed to fetch user rewards:', err);
      return [];
    }
  }
  
  async function onApproveSubmission(sub: Submission) {
    const stravaInfo = sub.stravaLink
      ? `<div class="info-row"><svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="flex-shrink: 0;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg><span>Strava: <a href="${sub.stravaLink}" target="_blank" style="color: #f97316;">${sub.stravaLink}</a></span></div>`
      : "";
    const distanceInfo = sub.actualDistance
      ? `<div class="info-row"><svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="flex-shrink: 0;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path></svg><span>Distance: <b style="color: #10b981;">${sub.actualDistance} km</b></span></div>`
      : "";

    const htmlContent = `<div class="reject-container"><p class="helper-text">Are you sure you want to verify this proof?</p><div class="approve-card"><div class="ac-avatar"><span class="ac-placeholder">${sub.runnerName.charAt(0).toUpperCase()}</span></div><div class="card-content"><span class="rj-title">${sub.runnerName}</span><span class="rj-desc">Submitted: ${new Date(sub.submittedAt).toLocaleString(currentLang === "th" ? "th-TH" : "en-GB", { timeZone: "Asia/Bangkok" })}</span></div></div><div class="approve-info"><div class="info-row"><svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="flex-shrink: 0;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><span>Status changes to <b>COMPLETED</b></span></div>${stravaInfo}${distanceInfo}<div class="info-row"><svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="flex-shrink: 0;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><span>System auto-assigns rewards</span></div></div></div>`;

    const styleContent = "<style>.reject-container { padding: 10px 0; text-align: left; }.helper-text { color: #94a3b8; font-size: 14px; margin-bottom: 20px; text-align: center; }.approve-card { display: flex; align-items: center; gap: 16px; background: rgba(16, 185, 129, 0.08); border: 2px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 16px; margin-bottom: 20px; }.ac-avatar { width: 56px; height: 56px; border-radius: 50%; overflow: hidden; flex-shrink: 0; background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.3)); display: flex; align-items: center; justify-content: center; border: 2px solid rgba(16, 185, 129, 0.4); }.ac-placeholder { color: #10b981; font-size: 24px; font-weight: 700; text-transform: uppercase; }.card-content { flex: 1; display: flex; flex-direction: column; gap: 6px; }.rj-title { font-size: 16px; font-weight: 600; color: #f8fafc; }.rj-desc { font-size: 13px; color: #94a3b8; }.approve-info { background: rgba(30, 41, 59, 0.6); border: 2px solid rgba(71, 85, 105, 0.3); border-radius: 12px; padding: 16px; }.info-row { display: flex; align-items: center; gap: 10px; padding: 8px 0; color: #cbd5e1; font-size: 14px; }.info-row svg { color: #10b981; }.info-row:not(:last-child) { border-bottom: 1px solid rgba(71, 85, 105, 0.2); }.info-row b { color: #10b981; font-weight: 600; }.swal-clean-popup-reject { background: #1e293b !important; border: 1px solid rgba(71, 85, 105, 0.3) !important; border-radius: 16px !important; padding: 24px !important; }.swal2-html-container { margin: 0 !important; }.swal2-validation-message { background: rgba(239, 68, 68, 0.1) !important; border: 2px solid rgba(239, 68, 68, 0.4) !important; border-radius: 12px !important; color: #fca5a5 !important; font-size: 14px !important; font-weight: 500 !important; padding: 12px 16px !important; margin: 16px 0 0 0 !important; display: none !important; align-items: center !important; gap: 8px !important; }@keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }@keyframes fadeOut { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(-10px); } }.swal2-validation-message.show { display: flex !important; animation: slideDown 0.3s ease !important; }.swal2-validation-message.hide { animation: fadeOut 0.3s ease !important; }.swal2-validation-message::before { content: \"\"; display: inline-block; width: 20px; height: 20px; background: url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23fca5a5'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'/%3E%3C/svg%3E\") no-repeat center; background-size: contain; flex-shrink: 0; }</style>";

    Swal.fire({
      title: '<span style="color: #10b981; font-size: 22px; font-weight: 600;">Approve Submission</span>',
      html: htmlContent + styleContent,
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#475569",
      confirmButtonText: '<span style="font-weight: 600;">Yes, Approve</span>',
      cancelButtonText: "Cancel",
      customClass: {
        popup: "swal-clean-popup-reject",
        confirmButton: "swal-btn-approve",
        cancelButton: "swal-btn-cancel",
      },
      width: "540px",
      preConfirm: async () => {
        try {
          // ✅ เชื่อมต่อ API
          const result = await verifyParticipationAPI(sub.id, true);
          return result;
        } catch (e: any) {
          const errorMessage = e.message || "Verification failed";
          Swal.showValidationMessage(errorMessage);
          return false;
        }
      },
    }).then((res) => {
      if (res.isConfirmed) {
        // ✅ อัปเดต UI ทันที: ลบการ์ดออก และ เพิ่มสถิติอนุมัติ
        // ใช้ filter เพื่อเอา ID ที่ตรงกันออก (Convert to string to be safe)
        submissions = submissions.filter((s) => String(s.id) !== String(sub.id));
        
        // Update stats locally to reflect immediate change
        statistics.total--;
        statistics.pending--;
        statistics.approvedToday++;
        
        Swal.fire({
          title: '<span style="color: #10b981; font-weight: 600;">Verified!</span>',
          html: '<p style="color: #94a3b8; font-size: 14px;">Participation has been approved successfully.</p>',
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
          customClass: { popup: "swal-clean-popup-reject" },
          background: "#1e293b",
          iconColor: "#10b981",
        });
          // After confirmation, try to fetch any UserReward records created for this user
          (async () => {
            try {
              const uid = sub.userId || null;
              if (!uid) return;
              const userRewards = await fetchUserRewards(uid);
              if (Array.isArray(userRewards) && userRewards.length > 0) {
                const cards = userRewards.map((r: any) => {
                  const when = r.rewarded_at || r.created_at || r.awarded_at || '';
                  const whenFmt = when ? formatTimestamp(when) : '-';
                  const title = (r.name || r.reward_name || r.title || '').toString().trim() || 'Unnamed reward';
                  const badge = (r.badge_image_url || r.image_url || '');
                  return `
                    <div style="display:flex;align-items:center;gap:12px;padding:10px;border-radius:8px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.03);">
                      <div style="width:44px;height:44px;border-radius:8px;overflow:hidden;flex-shrink:0;background:#0f172a;display:flex;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,0.04);">
                        ${badge ? `<img src="${badge}" alt="badge" style="width:100%;height:100%;object-fit:cover;" onerror="this.onerror=null;this.src='https://placehold.co/44x44/1e293b/94a3b8?text=?';"/>` : `<span style=\"color:#94a3b8;font-weight:700;\">#</span>`}
                      </div>
                      <div style="flex:1;min-width:0;">
                        <div style="font-weight:700;color:#e6edf3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(title)}</div>
                        <div style="font-size:12px;color:#94a3b8;margin-top:4px;">${whenFmt}</div>
                      </div>
                    </div>
                  `;
                }).join('');

                Swal.fire({
                  title: 'Assigned Rewards',
                  html: `
                    <div style="text-align:left; max-height:320px; overflow:auto; padding:8px 4px; display:flex;flex-direction:column;gap:8px;">
                      ${cards}
                    </div>
                  `,
                  icon: 'info',
                  background: '#0b1220',
                  color: '#fff',
                  width: 520,
                  confirmButtonColor: '#10b981'
                });
              } else {
                Swal.fire({
                  title: 'Assigned Rewards',
                  html: `<div style="text-align:center;padding:18px;color:#94a3b8;">No rewards were assigned.</div>`,
                  icon: 'info',
                  background: '#0b1220',
                  color: '#fff',
                  width: 520,
                  confirmButtonColor: '#10b981'
                });
              }
            } catch (e) {
              console.warn('Error fetching user rewards after approve:', e);
            }
          })();
      }
    });
  }
  
  async function onRejectSubmission(sub: Submission) {
    const htmlContent =
      '<div class="reject-container"><p class="helper-text">Please select a reason for rejection:</p><label class="reject-card"><input type="radio" name="rj_reason" value="Unclear image / Unreadable" checked><div class="card-content"><div class="icon-wrapper unclear"><svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg></div><div class="text-wrapper"><span class="rj-title">Unclear Image</span><span class="rj-desc">Photo is blurry, dark, or data is unreadable.</span></div></div></label><label class="reject-card"><input type="radio" name="rj_reason" value="Incorrect distance or duration"><div class="card-content"><div class="icon-wrapper incorrect"><svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div><div class="text-wrapper"><span class="rj-title">Incorrect Data</span><span class="rj-desc">Distance or time does not match requirements.</span></div></div></label><label class="reject-card"><input type="radio" name="rj_reason" value="Duplicate submission"><div class="card-content"><div class="icon-wrapper duplicate"><svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg></div><div class="text-wrapper"><span class="rj-title">Duplicate</span><span class="rj-desc">This proof has already been submitted.</span></div></div></label><label class="reject-card"><input type="radio" name="rj_reason" value="other"><div class="card-content"><div class="icon-wrapper other"><svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg></div><div class="text-wrapper"><span class="rj-title">Other Reason</span><span class="rj-desc">Specify a custom reason below.</span></div></div></label><div id="other-input-container" class="other-box"><textarea id="other-reason-text" class="custom-textarea" placeholder="Please type the reason here..." rows="4"></textarea></div></div>';

    const styleContent =
      '<style>.reject-container { padding: 10px 0; text-align: left; }.helper-text { color: #94a3b8; font-size: 14px; margin-bottom: 16px; text-align: center; }.reject-card { display: block; background: rgba(30, 41, 59, 0.6); border: 2px solid rgba(71, 85, 105, 0.3); border-radius: 12px; padding: 14px 16px; margin-bottom: 10px; cursor: pointer; transition: all 0.2s ease; position: relative; }.reject-card:hover { background: rgba(30, 41, 59, 0.8); border-color: rgba(239, 68, 68, 0.4); transform: translateX(4px); }.reject-card input[type="radio"] { position: absolute; opacity: 0; width: 0; height: 0; }.reject-card input[type="radio"]:checked ~ .card-content { opacity: 1; }.reject-card input[type="radio"]:checked ~ .card-content .icon-wrapper { background: rgba(239, 68, 68, 0.15); border-color: #ef4444; }.reject-card input[type="radio"]:checked ~ .card-content .rj-title { color: #f87171; }.reject-card:has(input[type="radio"]:checked) { background: rgba(239, 68, 68, 0.08); border-color: #ef4444; }.card-content { display: flex; align-items: center; gap: 14px; opacity: 0.7; transition: opacity 0.2s; }.icon-wrapper { width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 2px solid transparent; transition: all 0.2s; }.icon-wrapper.unclear { background: rgba(251, 191, 36, 0.1); color: #fbbf24; }.icon-wrapper.incorrect { background: rgba(239, 68, 68, 0.1); color: #ef4444; }.icon-wrapper.duplicate { background: rgba(168, 85, 247, 0.1); color: #a855f7; }.icon-wrapper.other { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }.text-wrapper { flex: 1; display: flex; flex-direction: column; gap: 4px; }.rj-title { font-size: 15px; font-weight: 600; color: #f8fafc; transition: color 0.2s; }.rj-desc { font-size: 13px; color: #94a3b8; line-height: 1.4; }.other-box { max-height: 0; overflow: hidden; opacity: 0; transition: all 0.3s ease; margin-top: 0; width: 100%; box-sizing: border-box; }.other-box.visible { max-height: 200px; opacity: 1; margin-top: 12px; }.custom-textarea { width: 100%; box-sizing: border-box; background: rgba(15, 23, 42, 0.8); border: 2px solid rgba(71, 85, 105, 0.4); border-radius: 12px; padding: 12px 14px; color: #f8fafc; font-size: 14px; font-family: inherit; resize: vertical; min-height: 100px; transition: all 0.2s; }.custom-textarea:focus { outline: none; border-color: #ef4444; background: rgba(15, 23, 42, 0.95); }.custom-textarea::placeholder { color: #64748b; }.swal-clean-popup-reject { background: #1e293b !important; border: 1px solid rgba(71, 85, 105, 0.3) !important; border-radius: 16px !important; padding: 24px !important; }.swal2-html-container { margin: 0 !important; }</style>';

    const result = await Swal.fire({
      title: '<span style="color: #f87171; font-size: 22px; font-weight: 600;">Reject Submission</span>',
      html: htmlContent + styleContent,
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#475569",
      confirmButtonText: '<span style="font-weight: 600;">Confirm Reject</span>',
      cancelButtonText: "Cancel",
      customClass: {
        popup: "swal-clean-popup-reject",
        confirmButton: "swal-btn-reject",
        cancelButton: "swal-btn-cancel",
      },
      width: "540px",
      didOpen: () => {
        const radios = document.querySelectorAll('input[name="rj_reason"]');
        const otherContainer = document.getElementById("other-input-container");
        const textArea = document.getElementById("other-reason-text") as HTMLTextAreaElement;

        radios.forEach((radio) => {
          radio.addEventListener("change", (e: any) => {
            if (e.target.value === "other") {
              otherContainer!.classList.add("visible");
              setTimeout(() => textArea?.focus(), 100);
            } else {
              otherContainer!.classList.remove("visible");
              textArea.value = "";
            }
          });
        });
      },
      preConfirm: () => {
        const selected = document.querySelector('input[name="rj_reason"]:checked') as HTMLInputElement;
        if (!selected) return Swal.showValidationMessage("Please select a reason");

        let finalReason = selected.value;
        if (finalReason === "other") {
          const textVal = (document.getElementById("other-reason-text") as HTMLTextAreaElement).value.trim();
          if (!textVal) return Swal.showValidationMessage("Please specify the reason.");
          finalReason = textVal;
        }

        // ✅ เชื่อมต่อ API
        return verifyParticipationAPI(sub.id, false, finalReason).catch(
          (error) => {
            Swal.showValidationMessage(`Error: ${error.message}`);
          }
        );
      },
    });

    if (result.value) {
      // ✅ อัปเดต UI ทันที
      submissions = submissions.filter((s) => String(s.id) !== String(sub.id));
      
      // Update stats locally
      statistics.total--;
      statistics.pending--;
      statistics.rejectedToday++;

      Swal.fire({
        title: '<span style="color: #f87171; font-weight: 600;">Rejected!</span>',
        html: '<p style="color: #94a3b8; font-size: 14px;">The submission has been rejected successfully.</p>',
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
        customClass: { popup: "swal-clean-popup-reject" },
        background: "#1e293b",
        iconColor: "#ef4444",
      });
    }
  }
  
  function backToEventsList() {
    view = 'events';
    selectedEvent = null;
    submissions = [];
    resetFilters();
  }
  
  function resetFilters() {
    searchQuery = "";
    batchFilter = "";
    stdIdFilter = "";
    statusFilter = "All";
    fromDate = "";
    toDate = "";
    submissionsPage = 1;
  }

  function onProofImageClick(imageUrl?: string | null) {
    if (!imageUrl) return;
    modalImageUrl = imageUrl;
    showImageModal = true;
  }
  
  function closeImageModal() {
    showImageModal = false;
    modalImageUrl = "";
  }
  
  function toggleAutoRefresh() {
    autoRefreshEnabled = !autoRefreshEnabled;
    
    if (autoRefreshEnabled) {
      isConnected = true;
      autoRefreshInterval = setInterval(async () => {
        if (selectedEvent) {
          const oldCount = submissions.length;
          await loadSubmissions(selectedEvent.id);
          const newCount = submissions.length;
          if (newCount > oldCount) {
            newSubmissionsCount = newCount - oldCount;
          }
        }
      }, 5000);
    } else {
      isConnected = false;
      if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
      }
    }
  }
  
  async function refreshSubmissions() {
    if (selectedEvent) {
      await loadSubmissions(selectedEvent.id);
      newSubmissionsCount = 0;
    }
  }
  
  function prevEventsPage() {
    if (eventsPage > 1) eventsPage--;
  }
  
  function nextEventsPage() {
    if (eventsPage < totalEventsPages) eventsPage++;
  }
  
  function prevSubmissionsPage() {
    if (submissionsPage > 1) submissionsPage--;
  }
  
  function nextSubmissionsPage() {
    if (submissionsPage < totalSubmissionsPages) submissionsPage++;
  }

  function jumpToSubmissionsPage(page: number) {
    submissionsPage = page;
    showSubmissionsPageDropdown = false;
  }
  
  function closeAllDropdowns() {
    showStatusDropdown = false;
    showFromDateDropdown = false;
    showToDateDropdown = false;
    showEventsPageDropdown = false;
    showSubmissionsPageDropdown = false;
  }
  
  onMount(async () => {
    // Pre-check for access_token before loading events
    if (typeof localStorage !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (!token || token.trim() === '') {
        console.warn('[Auth] No token found, redirecting to login');
        window.location.href = '/auth/login';
        return;
      }
      console.log('[Auth] Token found:', token.substring(0, 20) + '...');
    }
    
    // Try to load events and handle auth errors
    try {
      await loadEvents();
    } catch (error) {
      console.error('[Auth] Failed to load events:', error);
      // If loadEvents fails, it will handle the redirect internally
    }
  });
  
  onDestroy(() => {
    if (autoRefreshInterval) {
      clearInterval(autoRefreshInterval);
    }
  });
</script>

<svelte:window on:click={closeAllDropdowns} />

<div class="proof-verification-container">
  {#if view === 'events'}
    <div class="events-view">
      <div class="page-header">
        <!-- Header texts removed per UX request -->
      </div>
      
      {#if loading}
        <div class="loading-state">
          <div class="spinner"></div>
          <p>{lang.loading}</p>
        </div>
      {:else if paginatedEvents.length === 0}
        <div class="empty-state">
          <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <p>{lang.noEventsFound}</p>
        </div>
      {:else}
        <div class="events-grid">
          {#each paginatedEvents as event (event.id)}
            <div class="event-card">
              <div class="event-image-wrapper">
                <img 
                  src={event.image || "https://placehold.co/400x200/1e293b/64748b?text=No+Image"} 
                  alt={event.title} 
                  class="event-image" 
                  loading="lazy"
                  on:error={(e: globalThis.Event) => { const img = e.currentTarget as HTMLImageElement; img.src = "https://placehold.co/400x200/1e293b/64748b?text=Image+Unavailable"; }}
                />
                {#if event.pendingCount && event.pendingCount > 0}
                  <div class="pending-badge-overlay">{event.pendingCount} Pending</div>
                {/if}
                <div class="event-status-badge" class:active={event.status === "Active"} class:closed={event.status === "Closed"} class:draft={event.status === "Draft"}>
                  {translateStatus(event.status)}
                </div>
              </div>
              
              <div class="event-card-body">
                <h3 class="event-title">{event.title}</h3>
                {#if event.description}
                  <p class="event-description">{event.description.substring(0, 80)}{event.description.length > 80 ? "..." : ""}</p>
                {/if}
                
                <div class="event-meta">
                  <div class="meta-item">
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                    <span>{event.location}</span>
                  </div>
                  
                  <div class="meta-item">
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    <span>{formatDateRange(event, currentLang)}</span>
                  </div>
                  
                  {#if event.startTime && event.endTime}
                    <div class="meta-item">
                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <span>{event.startTime} - {event.endTime}</span>
                    </div>
                  {/if}
                </div>

                <button class="btn-view-submissions" on:click={() => selectEvent(event)}>
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  {lang.verifySubmissions}
                </button>
              </div>
            </div>
          {/each}
        </div>

        {#if totalEventsPages > 1}
          <div class="pagination-wrapper">
            <div class="pagination-controls">
                <button class="page-btn" aria-label="Previous events page" on:click={prevEventsPage} disabled={eventsPage === 1}>
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                </svg>
              </button>
              
              <div class="page-select-wrapper">
                <button class="page-indicator-box" on:click|stopPropagation={() => (showEventsPageDropdown = !showEventsPageDropdown)}>
                  <span class="current-page">{eventsPage}</span>
                  <span class="sep">/</span>
                  <span class="total-page">{totalEventsPages}</span>
                  <svg class="dropdown-arrow" class:flipped={showEventsPageDropdown} width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>
                  {#if showEventsPageDropdown}
                    <div class="page-dropdown-list" role="menu" tabindex="0" on:click|stopPropagation on:keydown={(e: globalThis.KeyboardEvent) => { /* keyboard support for menu container */ }}>
                    {#each Array(totalEventsPages) as _, i}
                      <button class="page-option" class:active={eventsPage === i + 1} on:click={() => { eventsPage = i + 1; showEventsPageDropdown = false; }}>
                        Page {i + 1}
                      </button>
                    {/each}
                  </div>
                {/if}
              </div>
              
              <button class="page-btn" aria-label="Next events page" on:click={nextEventsPage} disabled={eventsPage === totalEventsPages}>
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </button>
            </div>
            <div class="page-info">
              {lang.showingResults} {(eventsPage - 1) * eventsPerPage + 1} - {Math.min(eventsPage * eventsPerPage, events.length)} {lang.of} {events.length}
            </div>
          </div>
        {/if}
      {/if}
    </div>
  {:else}
    <div class="submissions-view">
      <div class="submissions-top">
        <div class="submissions-header">
        <button class="btn-back" on:click={backToEventsList}>
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
          </svg>
          {lang.backToEvents}
        </button>
        
        <!-- Banner image removed from logs view per UX request -->

        <div class="header-info">
          <h1>{selectedEvent?.title}</h1>
          <div class="event-meta-small">
            <span>
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              {selectedEvent?.location}
            </span>
            <span>
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              {formatDateRange(selectedEvent, currentLang)}
            </span>
            {#if selectedEvent?.startTime && selectedEvent?.endTime}
              <span>
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                {selectedEvent.startTime} - {selectedEvent.endTime}
              </span>
            {/if}
            <span class="status-badge-inline" class:active={selectedEvent?.status === "Active"}>
              {translateStatus(selectedEvent?.status || '')}
            </span>
          </div>
        </div>
        
        <div class="header-actions">
          <div class="realtime-controls">
            {#if newSubmissionsCount > 0}
              <button class="btn-new-logs" on:click={refreshSubmissions}>
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                {newSubmissionsCount} New
              </button>
            {/if}
            <button 
              class="btn-auto-refresh" 
              class:active={autoRefreshEnabled} 
              on:click={toggleAutoRefresh}
              title={autoRefreshEnabled ? "Auto-refresh ON" : "Auto-refresh OFF"}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              {#if isConnected}<span class="live-dot"></span>{/if}
            </button>
          </div>
        </div>
        </div>
        
        <div class="stats-dashboard">
        <div class="stat-card" style="border-color: rgba(59, 130, 246, 0.3);">
          <div class="stat-icon" style="background: rgba(59, 130, 246, 0.1);">
            <svg width="24" height="24" fill="none" stroke="#3b82f6" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
          </div>
          <div class="stat-info">
            <div class="stat-value">{statistics.total}</div>
            <div class="stat-label">{lang.totalSubmissions}</div>
          </div>
        </div>
        
        <div class="stat-card" style="border-color: rgba(245, 158, 11, 0.3);">
          <div class="stat-icon" style="background: rgba(245, 158, 11, 0.1);">
            <svg width="24" height="24" fill="none" stroke="#f59e0b" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <div class="stat-info">
            <div class="stat-value">{statistics.pending}</div>
            <div class="stat-label">{lang.pendingReview}</div>
          </div>
        </div>
        
        <div class="stat-card" style="border-color: rgba(16, 185, 129, 0.3);">
          <div class="stat-icon" style="background: rgba(16, 185, 129, 0.1);">
            <svg width="24" height="24" fill="none" stroke="#10b981" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <div class="stat-info">
            <div class="stat-value">{statistics.approvedToday}</div>
            <div class="stat-label">{lang.approvedToday}</div>
          </div>
        </div>
        
        <div class="stat-card" style="border-color: rgba(239, 68, 68, 0.3);">
          <div class="stat-icon" style="background: rgba(239, 68, 68, 0.1);">
            <svg width="24" height="24" fill="none" stroke="#ef4444" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
          <div class="stat-info">
            <div class="stat-value">{statistics.rejectedToday}</div>
            <div class="stat-label">{lang.rejectedToday}</div>
          </div>
        </div>
        </div>

        <div class="filter-section">
        <div class="search-box">
          <svg class="search-icon" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
          <input type="text" placeholder={lang.searchPlaceholder} bind:value={searchQuery} class="search-input" />
        </div>
        
        <div class="nisit-filters">
          <input 
            type="text" 
            placeholder={lang.batch} 
            maxlength="2" 
            bind:value={batchFilter} 
            on:input={(e: globalThis.Event) => { const tgt = e.currentTarget as HTMLInputElement; batchFilter = tgt.value.replace(/\D/g, ""); }}
            class="nisit-input"
          />
          <input 
            type="text" 
            placeholder={lang.stdId} 
            maxlength="6" 
            bind:value={stdIdFilter} 
            on:input={(e: globalThis.Event) => { const tgt = e.currentTarget as HTMLInputElement; stdIdFilter = tgt.value.replace(/\D/g, ""); }}
            class="nisit-input"
          />
        </div>

        <div class="filter-dropdown" class:dropdown-open={showStatusDropdown}>
          <button class="filter-trigger" on:click|stopPropagation={() => {
            const wasOpen = showStatusDropdown;
            closeAllDropdowns();
            showStatusDropdown = !wasOpen;
          }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
            </svg>
            <span>{statusFilter === "All" ? lang.all : statusFilter}</span>
            <svg class="chevron" class:rotated={showStatusDropdown} width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>
          {#if showStatusDropdown}
            <div class="filter-menu">
              <button class="filter-option" class:selected={statusFilter === "All"} on:click|stopPropagation={() => { statusFilter = "All"; showStatusDropdown = false; }}>{lang.all}</button>
              <button class="filter-option" class:selected={statusFilter === "Pending"} on:click|stopPropagation={() => { statusFilter = "Pending"; showStatusDropdown = false; }}>{lang.pending}</button>
              <button class="filter-option" class:selected={statusFilter === "Approved"} on:click|stopPropagation={() => { statusFilter = "Approved"; showStatusDropdown = false; }}>{lang.approved}</button>
              <button class="filter-option" class:selected={statusFilter === "Rejected"} on:click|stopPropagation={() => { statusFilter = "Rejected"; showStatusDropdown = false; }}>{lang.rejected}</button>
            </div>
          {/if}
        </div>

        <div class="date-filters">
          <div class="date-input-group" class:dropdown-open={showFromDateDropdown}>
            <span class="filter-label">{lang.from}:</span>
            <div class="custom-date-dropdown">
              <button class="custom-date-trigger" disabled={isSingleDayEvent} on:click|stopPropagation={() => {
                const wasOpen = showFromDateDropdown;
                closeAllDropdowns();
                showFromDateDropdown = !wasOpen;
              }} title={isSingleDayEvent ? "Single-day event" : ''}>
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                <span>{fromDate ? availableDates.find(d => d.value === fromDate)?.display || fromDate : lang.selectDate}</span>
                <svg class="chevron" class:rotated={showFromDateDropdown} width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>
              {#if showFromDateDropdown}
                <div class="custom-date-menu" role="menu" tabindex="0" on:click|stopPropagation on:keydown={(e: globalThis.KeyboardEvent) => { /* keyboard support for menu container */ }}>
                  {#each availableDates as date}
                    <button class="date-option" class:selected={fromDate === date.value} on:click={() => { fromDate = date.value; showFromDateDropdown = false; }}>
                      {date.display}
                    </button>
                  {/each}
                </div>
              {/if}
            </div>
          </div>

          <div class="date-input-group" class:dropdown-open={showToDateDropdown}>
            <span class="filter-label">{lang.to}:</span>
            <div class="custom-date-dropdown">
              <button class="custom-date-trigger" disabled={isSingleDayEvent} on:click|stopPropagation={() => {
                const wasOpen = showToDateDropdown;
                closeAllDropdowns();
                showToDateDropdown = !wasOpen;
              }} title={isSingleDayEvent ? "Single-day event" : ''}>
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                <span>{toDate ? availableDates.find(d => d.value === toDate)?.display || toDate : lang.selectDate}</span>
                <svg class="chevron" class:rotated={showToDateDropdown} width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>
              {#if showToDateDropdown}
                <div class="custom-date-menu" role="menu" tabindex="0" on:click|stopPropagation on:keydown={(e: globalThis.KeyboardEvent) => { /* keyboard support for menu container */ }}>
                  {#each availableDates as date}
                    <button class="date-option" class:selected={toDate === date.value} on:click={() => { toDate = date.value; showToDateDropdown = false; }}>
                      {date.display}
                    </button>
                  {/each}
                </div>
              {/if}
            </div>
          </div>
        </div>

        <button class="btn-reset-filter" on:click={resetFilters}>
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
          {lang.reset}
        </button>
        </div>
      </div>

      <div class="submissions-content">
        {#if loading}
          <div class="loading-state">
            <div class="spinner"></div>
            <span>{lang.loadingSubmissions}</span>
          </div>
        {:else if sortedSubmissions.length === 0}
          <div class="empty-state">
            <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <p>{lang.noPendingSubmissions}</p>
          </div>
        {:else}
          <div class="submissions-grid">
            {#each paginatedSubmissions as sub (sub.id)}
              <div class="submission-card">
                
                <div class="card-header">
                  <div class="user-info">
                    <h4 class="user-name">{sub.runnerName}</h4>
                    <div class="user-meta">
                      <span class="nisit-id">{sub.odySd}</span>
                      <span class="separator">•</span>
                      <span class="user-email">{sub.email}</span>
                    </div>
                  </div>
                  <span class="status-badge" 
                    class:pending={sub.status === "Pending"} 
                    class:approved={sub.status === "Approved"} 
                    class:rejected={sub.status === "Rejected"}
                  >
                    {sub.status}
                  </span>
                </div>
                
                <div class="proof-image-box" 
                  role="button" 
                  tabindex="0" 
                  on:click={() => onProofImageClick(sub.proofImage)} 
                  on:keydown={(e: globalThis.KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") onProofImageClick(sub.proofImage); }}
                >
                  {#if sub.proofImage}
                  <img src={sub.proofImage} alt="Proof" on:error={(e: globalThis.Event) => { const img = e.currentTarget as HTMLImageElement; img.src = "https://placehold.co/400x200/1e293b/64748b?text=Image+Unavailable"; }} />
                    <div class="image-overlay">
                      <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                        <path d="M21 21l-4.35-4.35"></path>
                        <path d="M11 8v6M8 11h6"></path>
                        <circle cx="11" cy="11" r="8"></circle>
                      </svg>
                      <span>{lang.viewImage}</span>
                    </div>
                  {:else}
                    <div class="no-image-placeholder">No image</div>
                  {/if}
                </div>
                
                {#if sub.status === "Pending"}
                  <div class="card-actions">
                    <button class="btn-reject" on:click={() => onRejectSubmission(sub)}>
                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                      {lang.reject}
                    </button>
                    <button class="btn-approve" on:click={() => onApproveSubmission(sub)}>
                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path>
                      </svg>
                      {lang.approve}
                    </button>
                  </div>
                {/if}

                <div class="submitted-time">
  Submitted: {formatTimestamp(sub.submittedAt)}
</div>

              </div>
            {/each}
          </div>

          {#if totalSubmissionsPages > 1}
            <div class="pagination-wrapper">
              <div class="pagination-row">
                <div class="pagination-controls">
                  <button class="page-btn" aria-label="Previous submissions page" on:click={prevSubmissionsPage} disabled={submissionsPage === 1}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M15 19l-7-7 7-7" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>

                <div class="page-select-wrapper">
                  <button class="page-indicator-box" on:click|stopPropagation={() => (showSubmissionsPageDropdown = !showSubmissionsPageDropdown)}>
                    <span class="current-page">{submissionsPage}</span>
                    <span class="sep">/</span>
                    <span class="total-page">{totalSubmissionsPages}</span>
                    <svg class="dropdown-arrow" class:flipped={showSubmissionsPageDropdown} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M19 9l-7 7-7-7" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </button>

                  {#if showSubmissionsPageDropdown}
                    <div class="page-dropdown-list" role="menu" tabindex="0" on:click|stopPropagation on:keydown={(e: globalThis.KeyboardEvent) => { /* keyboard support for menu container */ }}>
                      {#each Array(totalSubmissionsPages) as _, i}
                        <button class="page-option" class:active={submissionsPage === i + 1} on:click={() => { submissionsPage = i + 1; showSubmissionsPageDropdown = false; }}>
                          Page {i + 1}
                        </button>
                      {/each}
                    </div>
                  {/if}
                </div>

                <button class="page-btn" aria-label="Next submissions page" on:click={nextSubmissionsPage} disabled={submissionsPage === totalSubmissionsPages}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
                </div>
                
                <div class="page-info">
                  {lang.showingResults} {(submissionsPage - 1) * submissionsPerPage + 1} - {Math.min(submissionsPage * submissionsPerPage, totalSubmissions)} {lang.of} {totalSubmissions}
                </div>
              </div>
            </div>
          {/if}
        {/if}
      </div>
    </div>
  {/if}
</div>

{#if showImageModal}
  <div class="image-modal" role="dialog" tabindex="-1" aria-modal="true" aria-label="Image preview" on:click={(e: globalThis.MouseEvent) => { if ((e.target as EventTarget) === (e.currentTarget as EventTarget)) closeImageModal(); }} on:keydown={(e: globalThis.KeyboardEvent) => { if (e.key === 'Escape') closeImageModal(); }}>
    <div class="modal-content" role="document">
      <button class="modal-close" aria-label="Close image preview" on:click={closeImageModal}>×</button>
      <img src={modalImageUrl} alt="Proof Full View" on:error={(e: globalThis.Event) => { const img = e.currentTarget as HTMLImageElement; img.src = "https://placehold.co/800x600/0f172a/94a3b8?text=Image+Unavailable"; }} />
    </div>
  </div>
{/if}

<style>
  /* ==================== CONTAINER ==================== */
  .proof-verification-container {
    width: 100%;
    min-height: 100vh;
    
  }

  /* ==================== EVENTS VIEW ==================== */
  .events-view {
    max-width: 1400px;
    margin: 0 auto;
    padding: 2rem;
  }

  .page-header {
    margin-bottom: 3rem;
    text-align: center;
  }

  /* ==================== SUBMISSIONS HEADER / BANNER ==================== */
  .submissions-header {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    padding: 1rem 2rem;
  }

  /* event-banner removed from markup; rules deleted to avoid unused selector warnings */

  /* page header text removed intentionally (header displayed elsewhere) */

  .events-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 2rem;
  }

  .event-card {
    background: rgba(30, 41, 59, 0.6);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 20px;
    overflow: hidden;
    transition: all 0.3s;
  }

  .event-card:hover {
    transform: translateY(-4px);
    border-color: rgba(16, 185, 129, 0.4);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.3);
  }

  .event-image-wrapper {
    position: relative;
    width: 100%;
    height: 200px;
    overflow: hidden;
  }

  .event-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s;
  }

  .event-card:hover .event-image {
    transform: scale(1.05);
  }

  .pending-badge-overlay {
    position: absolute;
    top: 1rem;
    left: 1rem;
    padding: 0.5rem 1rem;
    background: linear-gradient(135deg, #f59e0b, #d97706);
    border-radius: 20px;
    color: white;
    font-size: 0.875rem;
    font-weight: 700;
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
    z-index: 2;
  }

  .event-status-badge {
    position: absolute;
    top: 1rem;
    right: 1rem;
    padding: 0.5rem 1rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    backdrop-filter: blur(10px);
  }

  .event-status-badge.active {
    background: rgba(16, 185, 129, 0.9);
    color: white;
  }

  .event-status-badge.closed {
    background: rgba(100, 116, 139, 0.9);
    color: white;
  }

  .event-status-badge.draft {
    background: rgba(148, 163, 184, 0.9);
    color: white;
  }

  .event-card-body {
    padding: 1.5rem;
  }

  .event-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: #f8fafc;
    margin-bottom: 0.75rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }

  .event-description {
    color: #cbd5e1;
    font-size: 0.9rem;
    line-height: 1.6;
    margin-bottom: 1rem;
  }

  .event-meta {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #94a3b8;
    font-size: 0.875rem;
  }

  .meta-item svg {
    flex-shrink: 0;
    color: #10b981;
  }

  .btn-view-submissions {
    width: 100%;
    padding: 0.875rem 1.25rem;
    background: linear-gradient(135deg, #10b981, #059669);
    border: none;
    border-radius: 12px;
    color: white;
    font-weight: 600;
    font-size: 0.95rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    cursor: pointer;
    transition: all 0.3s;
  }

  .btn-view-submissions:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4);
  }

  /* ==================== SUBMISSIONS VIEW ==================== */
  .submissions-view {
    max-width: 1600px;
    margin: 0 auto;
    padding: 2rem;
  }

  /* Make the top area sticky and the submissions list scrollable */
  .submissions-top { position: sticky; top: 0; z-index: 40; padding-bottom: 0.75rem; }

  /* Header is one rounded bar; statistics are separate cards below it */
  .submissions-header { background: rgba(30, 41, 59, 0.6); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.06); border-radius: 20px; padding: 1rem 1.25rem; margin-bottom: 1rem; }

  /* Keep stats as separate cards with spacing */
  .stats-dashboard { margin-top: 0; margin-bottom: 1rem; }

  .filter-section { margin-top: 0; }

  .submissions-content {
    overflow-y: auto;
    max-height: calc(100vh - 260px); /* leave space for header, stats and footer/pagination */
    padding-right: 8px; /* room for scrollbar */
    margin-top: 1.25rem; /* add space between filter/search area and proofs */
    padding-top: 0.75rem; /* extra internal spacing so top of cards don't touch sticky header */
  }

  @media (max-width: 768px) {
    .submissions-content { max-height: calc(100vh - 340px); }
  }

  .submissions-header {
    background: rgba(30, 41, 59, 0.6);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 20px;
    padding: 1.5rem;
    margin-bottom: 2rem;
    display: flex;
    align-items: center;
    gap: 1.5rem;
    flex-wrap: wrap;
  }

  /* use soft box-shadow on header instead of a pseudo-element line */
  .submissions-header { box-shadow: 0 8px 20px rgba(0,0,0,0.16); }

  .btn-back {
    background: rgba(100, 116, 139, 0.2);
    border: 1px solid rgba(100, 116, 139, 0.3);
    color: #94a3b8;
    padding: 0.75rem 1.25rem;
    border-radius: 12px;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 600;
    transition: all 0.2s;
    flex-shrink: 0;
  }

  .btn-back:hover {
    background: rgba(100, 116, 139, 0.3);
    border-color: #64748b;
    color: #f8fafc;
    transform: translateX(-2px);
  }

  .header-info {
    flex: 1;
    min-width: 250px;
  }

  .header-info h1 {
    font-size: 1.75rem;
    font-weight: 700;
    color: #f8fafc;
    margin: 0 0 0.5rem 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
    line-height: 1.15;
  }

  .event-meta-small {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    align-items: center;
    font-size: 0.875rem;
    color: #94a3b8;
  }

  .event-meta-small span {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .event-meta-small svg {
    color: #10b981;
  }

  .status-badge-inline {
    padding: 0.35rem 0.9rem;
    background: rgba(148, 163, 184, 0.18);
    border: 1px solid rgba(148, 163, 184, 0.28);
    border-radius: 13px; /* slightly more rounded */
    color: #94a3b8;
    font-size: 0.82rem;
    font-weight: 700;
    text-transform: uppercase;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }

  .status-badge-inline.active {
    background: rgba(16, 185, 129, 0.2);
    border-color: rgba(16, 185, 129, 0.35);
    color: #10b981;
  }

  .header-actions {
    display: flex;
    gap: 0.75rem;
  }

  .realtime-controls {
    display: flex;
    gap: 0.75rem;
  }

  .btn-new-logs {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.25rem;
    background: linear-gradient(135deg, #f59e0b, #d97706);
    border: none;
    border-radius: 12px;
    color: white;
    font-weight: 600;
    cursor: pointer;
    animation: pulse 2s infinite;
  }

  .btn-auto-refresh {
    position: relative;
    width: 40px;
    height: 40px;
    background: rgba(30, 41, 59, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s;
    color: #94a3b8;
  }

  .btn-auto-refresh.active {
    background: rgba(16, 185, 129, 0.2);
    border-color: rgba(16, 185, 129, 0.3);
    color: #10b981;
  }

  .live-dot {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    width: 6px;
    height: 6px;
    background: #10b981;
    border-radius: 50%;
    animation: pulse 1.5s infinite;
  }

  /* ==================== STATISTICS ==================== */
  .stats-dashboard {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .stat-card {
    background: rgba(30, 41, 59, 0.6);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    padding: 1.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    transition: all 0.3s;
  }

  .stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
  }

  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .stat-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .stat-value {
    font-size: 2rem;
    font-weight: 700;
    color: #f8fafc;
    line-height: 1;
  }

  .stat-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #94a3b8;
    line-height: 1;
  }

  /* ==================== FILTERS ==================== */
  .filter-section {
    background: rgba(30, 41, 59, 0.6);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 20px;
    padding: 1.5rem;
    margin-bottom: 2rem;
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    align-items: center;
  }

  .search-box {
    flex: 1;
    min-width: 250px;
    position: relative;
  }

  .search-icon {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: #64748b;
    pointer-events: none;
  }

  .search-input {
    width: 100%;
    padding: 0.875rem 1rem 0.875rem 2.75rem;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    color: #f8fafc;
    font-size: 0.9rem;
  }

  .search-input::placeholder {
    color: #64748b;
  }

  .search-input:focus {
    outline: none;
    border-color: #10b981;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
  }

  .nisit-filters {
    display: flex;
    gap: 0.75rem;
  }

  .nisit-input {
    padding: 0.875rem 1rem;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    color: #f8fafc;
    font-size: 0.9rem;
    width: 100px;
    text-align: center;
  }

  .nisit-input::placeholder {
    color: #64748b;
  }

  .nisit-input:focus {
    outline: none;
    border-color: #10b981;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
  }

  .filter-dropdown {
    position: relative;
  }

  .filter-trigger {
    padding: 0.875rem 1rem;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    color: #f8fafc;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    min-width: 180px;
    transition: all 0.2s;
  }

  .filter-trigger:hover {
    border-color: rgba(16, 185, 129, 0.4);
  }

  .chevron {
    margin-left: auto;
    transition: transform 0.2s;
  }

  .chevron.rotated {
    transform: rotate(180deg);
  }

  .filter-menu {
    position: absolute;
    top: calc(100% + 0.5rem);
    left: 0;
    background: #1e293b;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 0.5rem;
    min-width: 180px;
    max-height: 300px;
    overflow-y: auto;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    z-index: 99999;
    animation: slideDown 0.2s ease;
  }

  .filter-option {
    width: 100%;
    padding: 0.75rem 1rem;
    background: transparent;
    border: none;
    color: #f8fafc;
    text-align: left;
    cursor: pointer;
    border-radius: 8px;
    font-size: 0.9rem;
    transition: all 0.2s;
  }

  .filter-option:hover {
    background: rgba(16, 185, 129, 0.1);
  }

  .filter-option.selected {
    background: rgba(16, 185, 129, 0.2);
    color: #10b981;
  }

  .date-filters {
    display: flex;
    gap: 1rem;
  }

  .date-input-group {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .date-input-group .filter-label {
    color: #94a3b8;
    font-size: 0.9rem;
    font-weight: 500;
    white-space: nowrap;
  }

  .custom-date-dropdown {
    position: relative;
  }

  .custom-date-trigger {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.875rem 1rem;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    color: #f8fafc;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
  }

  .custom-date-trigger:hover {
    border-color: rgba(16, 185, 129, 0.4);
  }

  .custom-date-menu {
    position: absolute;
    top: calc(100% + 0.5rem);
    left: 0;
    min-width: 180px;
    max-height: 250px;
    overflow-y: auto;
    background: #1e293b;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    z-index: 99999;
    padding: 0.5rem;
    animation: slideDown 0.2s ease;
  }

  .date-option {
    width: 100%;
    padding: 0.75rem 1rem;
    background: transparent;
    border: none;
    text-align: left;
    color: #f8fafc;
    cursor: pointer;
    border-radius: 8px;
    font-size: 0.9rem;
    transition: all 0.2s;
  }

  .date-option:hover {
    background: rgba(16, 185, 129, 0.1);
  }

  .date-option.selected {
    background: rgba(16, 185, 129, 0.2);
    color: #10b981;
  }

  .btn-reset-filter {
    padding: 0.875rem 1.25rem;
    background: rgba(100, 116, 139, 0.2);
    border: 1px solid rgba(100, 116, 139, 0.3);
    border-radius: 12px;
    color: #94a3b8;
    font-weight: 600;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-reset-filter:hover {
    background: rgba(100, 116, 139, 0.3);
    border-color: #64748b;
  }

  /* ==================== SUBMISSIONS GRID ==================== */
  .submissions-content {
    min-height: 400px;
  }

  .submissions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  /* Card Style (Glassmorphism) */
  .submission-card {
    position: relative;
    background: rgba(30, 41, 59, 0.6);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 20px;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    transition: all 0.3s ease;
  }

  .submission-card:hover {
    border-color: rgba(16, 185, 129, 0.3);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    transform: translateY(-4px);
  }

  /* Header Layout */
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 10px;
  }

  .user-info {
    flex: 1;
    min-width: 0; /* ป้องกัน text overflow */
  }

  .user-name {
    margin: 0 0 0.25rem 0;
    font-size: 1.125rem;
    font-weight: 700;
    color: #f8fafc;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: left; /* ✅ ชิดซ้าย */
  }

  /* Meta Info: ID + Email */
  .user-meta {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
    color: #94a3b8;
    font-size: 0.875rem;
    line-height: 1.4;
  }

  .nisit-id {
    font-family: 'Courier New', monospace;
    font-weight: 600;
    color: #10b981;
  }

  .separator {
    color: #475569;
  }

  .user-email {
    color: #64748b;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* Status Badge (Top Right) */
  .status-badge {
    flex-shrink: 0;
    display: inline-flex;
    padding: 0.375rem 0.75rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .status-badge.pending {
    background: rgba(245, 158, 11, 0.15);
    border: 1px solid rgba(245, 158, 11, 0.3);
    color: #fbbf24;
  }

  .status-badge.approved {
    background: rgba(16, 185, 129, 0.15);
    border: 1px solid rgba(16, 185, 129, 0.3);
    color: #34d399;
  }

  .status-badge.rejected {
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #f87171;
  }

  /* Image Box */
  .proof-image-box {
    width: 100%;
    height: 200px;
    background: #0f172a;
    border-radius: 12px;
    overflow: hidden;
    position: relative;
    cursor: pointer;
    border: 1px solid rgba(255, 255, 255, 0.05);
  }

  .proof-image-box img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s ease;
  }

  .proof-image-box:hover img {
    transform: scale(1.05);
  }

  .image-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(2px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    opacity: 0;
    transition: all 0.3s ease;
    color: white;
  }

  .proof-image-box:hover .image-overlay {
    opacity: 1;
  }

  .no-image-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #64748b;
    font-size: 0.875rem;
  }

  /* Actions */
  .card-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-top: 4px;
  }

  .btn-approve, .btn-reject {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px;
    border-radius: 10px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
  }

  .btn-approve {
    background: #10b981;
    color: white;
    box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2);
  }
  .btn-approve:hover {
    background: #059669;
    box-shadow: 0 6px 8px -1px rgba(16, 185, 129, 0.3);
    transform: translateY(-1px);
  }

  .btn-reject {
    background: transparent;
    border: 1px solid rgba(239, 68, 68, 0.5);
    color: #f87171;
  }
  .btn-reject:hover {
    background: rgba(239, 68, 68, 0.1);
    border-color: #ef4444;
    color: #ef4444;
  }

  /* Submitted Time (Bottom) */
  .submitted-time {
    color: #64748b;
    font-size: 0.75rem;
    text-align: center;
    margin-top: auto; /* ดันลงล่างสุดถ้า Flex container สูง */
    padding-top: 0.5rem;
  }

  /* ==================== PAGINATION ==================== */
  .pagination-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    margin-top: 2rem; /* เพิ่มระยะห่างระหว่างการ์ดกับปุ่ม */
  }

  .pagination-row {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  @media (max-width: 768px) {
    .pagination-row { flex-direction: column; }
    .page-info { text-align: center; }
  }

  .pagination-controls {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .page-btn {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: rgba(30, 41, 59, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: #f8fafc;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
  }

  .page-btn:hover:not(:disabled) {
    background: rgba(16, 185, 129, 0.2);
    border-color: #10b981;
  }

  .page-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .page-select-wrapper {
    position: relative;
  }

  .page-indicator-box {
    padding: 0.625rem 1rem;
    background: rgba(30, 41, 59, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    font-weight: 600;
    color: #f8fafc;
  }

  .page-indicator-box .sep {
    color: #64748b;
  }

  .dropdown-arrow {
    transition: transform 0.2s;
  }

  .page-info {
    text-align: center;
    color: #94a3b8;
    font-size: 0.875rem;
  }

  .dropdown-arrow.flipped {
    transform: rotate(180deg);
  }

  .page-dropdown-list {
    position: absolute;
    top: calc(100% + 8px);
    left: 0; /* ตรงๆ ลงมาจากปุ่ม */
    transform: none;
    width: 100%; /* ขนาดเท่ากับกล่องตัวเลือก */
    background: #1e293b;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 0; /* remove inner padding so options fill exactly */
    max-height: 300px;
    overflow-y: auto;
    min-width: 0;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    z-index: 99999;
    animation: slideDown 0.2s ease;
  }

  .page-option {
    display: block;
    box-sizing: border-box;
    width: 100%;
    padding: 0.625rem 1rem; /* match indicator padding */
    background: transparent;
    border: none;
    color: #f8fafc;
    text-align: center;
    cursor: pointer;
    border-radius: 0; /* corners handled on first/last child */
    font-size: 0.9rem;
    transition: background 0.15s ease, color 0.15s ease;
  }

  .page-option:hover {
    background: rgba(16, 185, 129, 0.08);
  }

  .page-option.active {
    background: rgba(16, 185, 129, 0.12);
    color: #10b981;
    font-weight: 700;
    box-shadow: inset 0 0 0 1px rgba(16,185,129,0.18);
  }

  .page-option:first-child { border-top-left-radius: 12px; border-top-right-radius: 12px; }
  .page-option:last-child { border-bottom-left-radius: 12px; border-bottom-right-radius: 12px; }

  /* .showing-text removed (unused in this file) */

  /* ==================== IMAGE MODAL ==================== */
  .image-modal {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn 0.3s;
  }

  .modal-content {
    position: relative;
    max-width: 90vw;
    max-height: 90vh;
  }

  .modal-content img {
    max-width: 100%;
    max-height: 90vh;
    border-radius: 12px;
  }

  .modal-close {
    position: absolute;
    top: -3rem;
    right: 0;
    width: 40px;
    height: 40px;
    background: rgba(239, 68, 68, 0.9);
    border: none;
    border-radius: 50%;
    color: white;
    font-size: 1.5rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .modal-close:hover {
    background: #ef4444;
    transform: scale(1.1);
  }

  /* ==================== LOADING & EMPTY STATES ==================== */
  .loading-state,
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    color: #64748b;
  }

  .empty-state svg {
    margin-bottom: 1rem;
  }

  .loading-state p,
  .empty-state p {
    font-size: 1rem;
    margin: 0;
  }

  .spinner {
    width: 48px;
    height: 48px;
    border: 4px solid rgba(16, 185, 129, 0.1);
    border-top-color: #10b981;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  /* ==================== ANIMATIONS ==================== */
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* ==================== RESPONSIVE ==================== */
  @media (max-width: 1024px) {
    .stats-dashboard {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 768px) {
    .events-view,
    .submissions-view {
      padding: 1rem;
    }

    /* responsive header text rule removed (header text not used) */

    .events-grid,
    .submissions-grid {
      grid-template-columns: 1fr;
    }

    .submissions-header {
      flex-direction: column;
      align-items: stretch;
    }

    .header-actions {
      width: 100%;
    }

    .filter-section {
      flex-direction: column;
      align-items: stretch;
    }

    .search-box,
    .nisit-filters,
    .filter-dropdown,
    .date-filters,
    .btn-reset-filter {
      width: 100%;
    }

    .nisit-input {
      flex: 1;
    }

    .date-filters {
      flex-direction: column;
    }

    .stats-dashboard {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 640px) {
    .header-info h1 {
      font-size: 1.5rem;
    }

    .event-meta-small {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }
  }
</style>