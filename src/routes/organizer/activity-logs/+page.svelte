<script lang="ts">
  import { onMount } from "svelte";

  // Import real API client and endpoints
  import { api, API_BASE_URL } from "../_lib/api/client";
  import { endpoints } from "../_lib/api/endpoints";
  import Swal from "sweetalert2";

  import {
    getParticipantSnapshots,
    getSnapshotEntries,
    getUserStatistics,
  } from "$lib/utils/apiClient";

  // ==================== TYPES ====================
  type Event = {
    id: string;
    name: string;
    description: string;
    location: string;
    startDate: string;
    endDate: string;
    startTime?: string;
    endTime?: string;
    totalSlots?: number;
    usedSlots?: number;
    distanceKm?: number;
    image?: string;
    status: string;
    [key: string]: any;
  };

  type Snapshot = {
    id: number;
    snapshot_id: string;
    snapshot_time: string;
    entry_count: number;
    description?: string | null;
  };

  type LogEntry = {
    id: string;
    eventId: string;
    userId: string;
    userName: string;
    userEmail: string;
    userNisitId: string;
    userRole: string;
    action: string;
    timestamp: string;
    participationDate: string;
    details?: any;
    metadata?: any;
    proofImage?: string;
    distanceKm?: number;
    status?: string;
    [key: string]: any;
  };

  type ParticipantDetail = {
    userId: string;
    userName: string;
    userEmail: string;
    userNisitId: string;
    userRole: string;
    participations: LogEntry[];
    totalDays: number;
    completedDays: number;
    totalDistance: number;
    totalDistanceAccumulated?: number;
    firstParticipation: string;
    lastParticipation: string;
  };

  type Language = "th" | "en";

  // ==================== CONFIGURATION ====================
  const actionConfigs: Record<
    string,
    { label: string; color: string; icon: string }
  > = {
    registration: {
      label: "Joined",
      color: "#3b82f6",
      icon: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z",
    },
    check_in: {
      label: "Checked In",
      color: "#06b6d4",
      icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    },
    proof_submitted: {
      label: "Proof Sent",
      color: "#f59e0b",
      icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
    },
    proof_approved: {
      label: "Approved",
      color: "#10b981",
      icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    },
    proof_rejected: {
      label: "Rejected",
      color: "#ef4444",
      icon: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z",
    },
    reward_unlocked: {
      label: "Completed",
      color: "#8b5cf6",
      icon: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z",
    },
    no_show: {
      label: "No Show",
      color: "#64748b",
      icon: "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636",
    },
    registration_cancelled: {
      label: "Cancelled",
      color: "#94a3b8",
      icon: "M6 18L18 6M6 6l12 12",
    },
  };

  // ==================== STATE ====================
  let view: "events" | "logs" = "events";
  let events: Event[] = [];

  let snapshots: Snapshot[] = [];
  let currentSnapshotId: string = "";

  let logs: LogEntry[] = [];
  let selectedEvent: Event | null = null;

  let showDetailModal = false;
  let selectedParticipant: ParticipantDetail | null = null;

  let statistics = {
    totalLogs: 0,
    totalRegistrations: 0,
    totalCheckIns: 0,
    totalCompleted: 0,
    totalCancelled: 0,
    uniqueUsers: 0,
  };

  // Filters
  let searchQuery = "";
  let batchFilter = "";
  let selectedAction = "";
  let selectedRole = "";
  let eventDates: string[] = [];
  let selectedDay: string = "all";

  // UI Dropdowns
  let actionDropdownOpen = false;
  let roleDropdownOpen = false;
  let snapshotDropdownOpen = false;
  let showExportMenu = false;

  // Pagination
  let currentPage = 1;
  const itemsPerPage = 15;
  let showPageDropdown = false;

  // Events pagination (for events view)
  let eventsPage = 1;
  const eventsPerPage = 9;
  let showEventsPageDropdown = false;

  // Loading states
  let loading = false;
  let isExporting = false;
  let isRefeshing = false;
  let autoRefreshEnabled = false;

  // Language
  let currentLang: Language = "th";

  const translations = {
    th: {
      activityLogs: "บันทึกกิจกรรม",
      selectEvent: "เลือกกิจกรรม",
      backToEvents: "กลับไปเลือกกิจกรรม",
      loading: "กำลังโหลด...",
      syncing: "กำลังอัปเดต...",
      noEvents: "ไม่มีกิจกรรม",
      noData: "ไม่มีข้อมูล",
      viewLogs: "ดูบันทึก",
      export: "ส่งออก",
      exportCSV: "ส่งออก CSV",
      exportJSON: "ส่งออก JSON",
      name: "ชื่อ",
      email: "อีเมล",
      nisitId: "รหัสนิสิต",
      role: "บทบาท",
      action: "การกระทำ",
      timestamp: "เวลา",
      details: "รายละเอียด",
      search: "ค้นหา...",
      allActions: "ทุกการกระทำ",
      allRoles: "ทุกบทบาท",
      reset: "รีเซ็ต",
      apply: "ใช้งาน",
      showingResults: "แสดง",
      of: "จาก",
      results: "รายการ",
      totalLogs: "รายการทั้งหมด",
      registrations: "ลงทะเบียน",
      checkIns: "เช็คอิน",
      completed: "เสร็จสิ้น",
      cancelled: "ยกเลิก",
      uniqueUsers: "ผู้เข้าร่วม",
      participant: "ผู้เข้าร่วม",
      officer: "เจ้าหน้าที่",
      batch: "รุ่น",
      autoRefresh: "รีเฟรชอัตโนมัติ",
      newLogs: "รายการใหม่",
      refresh: "รีเฟรช",
      viewDetails: "ดูรายละเอียด",
      participantDetails: "รายละเอียดผู้เข้าร่วม",
      participationHistory: "ประวัติการเข้าร่วม",
      totalDays: "จำนวนวันที่เข้าร่วม",
      completedDays: "วันที่เสร็จสมบูรณ์",
      totalDistance: "ระยะทางรวม",
      firstJoin: "เข้าร่วมครั้งแรก",
      lastActive: "ครั้งล่าสุด",
      date: "วันที่",
      distance: "ระยะทาง",
      proofImage: "รูปหลักฐาน",
      close: "ปิด",
      refreshData: "อัปเดตข้อมูลล่าสุด",
      selectSnapshot: "เลือกช่วงเวลา (Snapshot)",
      autoCreated: "อัปเดตอัตโนมัติ",
      deleteSnapshot: "ลบ",
      confirmDelete: "ยืนยันการลบ?",
      deleteSuccess: "ลบเรียบร้อยแล้ว",
      noImage: "ไม่มีรูป",
    },
    en: {
      activityLogs: "Activity Logs",
      selectEvent: "Select Event",
      backToEvents: "Back to Events",
      loading: "Loading...",
      syncing: "Syncing...",
      noEvents: "No events",
      noData: "No data",
      viewLogs: "View Logs",
      export: "Export",
      exportCSV: "Export CSV",
      exportJSON: "Export JSON",
      name: "Name",
      email: "Email",
      nisitId: "Student ID",
      role: "Role",
      action: "Action",
      timestamp: "Time",
      details: "Details",
      search: "Search...",
      allActions: "All Actions",
      allRoles: "All Roles",
      reset: "Reset",
      apply: "Apply",
      showingResults: "Showing",
      of: "of",
      results: "results",
      totalLogs: "Total Logs",
      registrations: "Registrations",
      checkIns: "Check-ins",
      completed: "Completed",
      cancelled: "Cancelled",
      uniqueUsers: "Unique Users",
      participant: "Participant",
      officer: "Officer",
      batch: "Batch",
      autoRefresh: "Auto Refresh",
      newLogs: "New Logs",
      refresh: "Refresh",
      viewDetails: "View Details",
      participantDetails: "Participant Details",
      participationHistory: "Participation History",
      totalDays: "Total Days",
      completedDays: "Completed Days",
      totalDistance: "Total Distance",
      firstJoin: "First Join",
      lastActive: "Last Active",
      date: "Date",
      distance: "Distance",
      proofImage: "Proof Image",
      close: "Close",
      refreshData: "Update Latest Data",
      selectSnapshot: "Select Snapshot",
      autoCreated: "Auto Refreshed",
      deleteSnapshot: "Delete",
      confirmDelete: "Are you sure?",
      deleteSuccess: "Deleted successfully",
      noImage: "No image",
    },
  };

  $: lang = translations[currentLang];

  function getApiImageUrl(path: string): string {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    const p = path.startsWith("/") ? path : `/${path}`;
    if (p.startsWith("/api/")) return `${API_BASE_URL.replace(/\/$/, "")}${p}`;
    if (p.startsWith("/uploads/") || p.startsWith("/upload/"))
      return `${API_BASE_URL.replace(/\/$/, "")}/api${p.startsWith("/uploads/") ? p : p.replace("/upload/", "/uploads/")}`;
    const clean = p.replace(/^\//, "");
    return `${API_BASE_URL.replace(/\/$/, "")}/api/uploads/${clean}`;
  }

  // ==================== HELPER FUNCTIONS ====================
  function getActionConfig(action: string) {
    return (
      actionConfigs[action] || {
        label: action,
        color: "#64748b",
        icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
      }
    );
  }
  function getActionLabel(action: string): string {
    return getActionConfig(action).label;
  }
  function getActionColor(action: string): string {
    return getActionConfig(action).color;
  }

  // ✅ Helper to extract the REAL timestamp from snapshot entry based on action
  function getEntryTimestamp(e: any): string {
    const act = (e.action || e.status || "").toLowerCase();
    let ts = null;

    // Check specific timestamp fields first
    if (act.includes("regist") || act.includes("join")) {
      ts = e.joined_at || e.created_at;
    } else if (act.includes("check_in")) {
      ts = e.checked_in_at || e.created_at;
    } else if (act.includes("complet") || act.includes("reward")) {
      ts = e.completed_at || e.created_at;
    } else {
      // Fallback for other statuses
      ts = e.created_at;
    }

    return ts || new Date().toISOString();
  }

  function getEventStatusColor(status: string) {
    if (!status) return "#64748b";
    const s = String(status).toLowerCase();
    if (s === "active" || s === "open" || s === "ongoing") return "#10b981";
    if (s === "closed" || s === "cancelled" || s === "ended") return "#ef4444";
    if (s === "draft" || s === "planned") return "#f59e0b";
    if (s === "full" || s === "soldout") return "#ef4444";
    if (s === "paused" || s === "archived") return "#64748b";
    return "#06b6d4";
  }

  function getEventStatusLabel(status: string) {
    if (!status) return currentLang === "th" ? "ปิดใช้งาน" : "Closed";
    const s = String(status).toLowerCase();
    if (s === "active" || s === "open" || s === "ongoing")
      return currentLang === "th" ? "เปิดใช้งาน" : "Active";
    if (s === "closed" || s === "cancelled" || s === "ended")
      return currentLang === "th" ? "ปิดใช้งาน" : "Closed";
    if (s === "draft" || s === "planned")
      return currentLang === "th" ? "ร่าง" : "Draft";
    return status;
  }

  // Normalize backend action/status values to canonical action keys
  function normalizeAction(action: string) {
    if (!action) return "registration";
    const a = String(action).toLowerCase();
    if (
      a === "checked_in" ||
      a === "checked-in" ||
      a === "checkin" ||
      a === "check_in"
    )
      return "check_in";
    if (a === "reward_unlocked" || a === "completed" || a === "complete")
      return "reward_unlocked";
    if (a === "registration_cancelled" || a === "cancelled" || a === "canceled")
      return "registration_cancelled";
    if (a === "no_show" || a === "noshow") return "no_show";
    if (a === "registration" || a === "joined" || a === "register")
      return "registration";
    return a;
  }

  function formatDateRange(event: Event | null): string {
    if (!event) return "";
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);
    const locale = currentLang === "th" ? "th-TH" : "en-GB";
    const options: Intl.DateTimeFormatOptions = {
      day: "2-digit",
      month: "short",
      year: "numeric",
    };
    if (start.toDateString() === end.toDateString()) {
      return start.toLocaleDateString(locale, options);
    }
    return `${start.toLocaleDateString(locale, options)} - ${end.toLocaleDateString(locale, options)}`;
  }

  function formatTimestamp(timestamp: string): string {
    if (!timestamp) return lang.noData;
    const date = new Date(timestamp);
    const locale = currentLang === "th" ? "th-TH" : "en-GB";
    return date.toLocaleDateString(locale, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatDate(dateStr: string): string {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    const locale = currentLang === "th" ? "th-TH" : "en-GB";
    return date.toLocaleDateString(locale, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function calculateStatistics() {
    const uniqueUserIds = new Set(logs.map((l) => l.userId));
    statistics = {
      totalLogs: logs.length,
      totalRegistrations: logs.filter((l) => l.action === "registration")
        .length,
      totalCheckIns: logs.filter((l) => l.action === "check_in").length,
      totalCompleted: logs.filter((l) => l.action === "reward_unlocked").length,
      totalCancelled: logs.filter((l) => l.action === "registration_cancelled")
        .length,
      uniqueUsers: uniqueUserIds.size,
    };
    // statistics updated
  }

  function getSnapshotDisplay(snap: Snapshot | undefined) {
    if (!snap) return lang.selectSnapshot;
    const dateStr = new Date(snap.snapshot_time).toLocaleString("th-TH");
    return `${dateStr} - ${snap.description || lang.autoCreated}`;
  }

  // ==================== CORE FUNCTIONS ====================
  const userCache: Map<number, any> = new Map();

  async function fetchUser(userId: number) {
    if (!userId) return null;
    if (userCache.has(userId)) return userCache.get(userId);
    try {
      const res = await api.get(`/api/users/${userId}`);
      if (res && res.data) userCache.set(userId, res.data);
      return res.data;
    } catch (err) {
      // keep error logging minimal
      console.error("fetchUser error", userId);
      return null;
    }
  }

  async function getLogsForUser(
    eventId: number | string,
    userId: number | string,
  ) {
    try {
      const res = await api.get(endpoints.logs.getByEvent(eventId));
      const data = res.data || {};
      const snapshotsList = Array.isArray(data.snapshots)
        ? data.snapshots
        : data.snapshots || [];
      const matched: LogEntry[] = [];

      for (const snap of snapshotsList) {
        const snapId = snap.snapshot_id || snap.snapshotId || snap.id;
        if (!snapId) continue;
        let page = 1;
        const pageSize = 100;
        let totalPages = 1;
        do {
          try {
            const entriesRes = await api.get(
              `/api/events/${eventId}/participants/history/${snapId}/entries`,
              { params: { page, page_size: pageSize } },
            );
            const body = entriesRes.data || {};
            const entries = Array.isArray(body.entries)
              ? body.entries
              : body.entries || [];

            for (const e of entries) {
              if (
                String(e.user_id) === String(userId) ||
                String(e.userId) === String(userId)
              ) {
                // ✅ Use helper to get correct timestamp
                const realTime = getEntryTimestamp(e);

                matched.push({
                  id: e.entry_id || String(e.id),
                  eventId: String(eventId),
                  userId: String(e.user_id),
                  userName: e.user_name || "Unknown",
                  userEmail: e.user_email || "",
                  userNisitId: (e.metadata && e.metadata.nisit_id) || "",
                  userRole: (e.metadata && e.metadata.role) || "participant",
                  action: normalizeAction(
                    e.action || e.status || "registration",
                  ),
                  timestamp: realTime, // ✅ Use real timestamp
                  participationDate: realTime.split("T")[0],
                  details: null,
                  metadata: e.metadata || {},
                  proofImage: (e.metadata && e.metadata.proof_image) || null,
                  distanceKm: (e.metadata && e.metadata.distance_km) || null,
                  status: e.status,
                });
              }
            }
            totalPages = body.total_pages || 1;
            page++;
          } catch (e) {
            console.warn("Failed to fetch entries for snapshot", snapId, e);
            break;
          }
        } while (page <= totalPages);
      }
      // matched entries computed
      return matched;
    } catch (err) {
      console.error("getLogsForUser error", eventId, userId);
      return [];
    }
  }

  async function loadEvents() {
    loading = true;
    try {
      const response = await api.get(endpoints.events.list);
      if (response.data && Array.isArray(response.data)) {
        events = response.data.map((e: any) => ({
          id: e.id,
          name: e.title || e.name,
          description: e.description,
          location: e.location,
          startDate: e.event_date || e.start_date || e.startDate,
          endDate: e.event_end_date || e.end_date || e.endDate,
          startTime: e.start_time || e.startTime,
          endTime: e.end_time || e.endTime,
          image: getApiImageUrl(
            e.banner_image_url || e.cover_image_url || e.image,
          ),
          status: e.is_active ? "Active" : "Closed",
          totalSlots: e.max_participants || e.totalSlots,
          usedSlots: e.usedSlots,
          distanceKm: e.distanceKm,
        }));
      } else {
        events = [];
      }
    } catch (error) {
      console.warn("Failed to load events:", error);
      events = [];
    } finally {
      loading = false;
    }
  }

  async function loadSnapshots(eventId: string) {
    try {
      const res = await getParticipantSnapshots(Number(eventId), 1, 50);
      snapshots = res?.snapshots || [];
      // snapshots loaded
    } catch (error) {
      console.error("Failed to load snapshots");
      snapshots = [];
    }
  }

  async function loadSnapshotEntries(eventId: string, snapshotId: string) {
    loading = true;
    try {
      let allEntries: any[] = [];
      let page = 1;
      let totalPages = 1;
      const pageSize = 100; // Safe limit

      do {
        try {
          const res = await getSnapshotEntries(
            Number(eventId),
            snapshotId,
            page,
            pageSize,
          );
          if (res && res.entries) {
            allEntries = [...allEntries, ...res.entries];
            totalPages = res.total_pages || 1;
            page++;
          } else {
            break;
          }
        } catch (err) {
          break;
        }
      } while (page <= totalPages);

      // entries fetched
      logs = allEntries.map((e: any) => {
        // ✅ Use helper here too for main table consistency
        const realTime = getEntryTimestamp(e);

        return {
          id: e.entry_id || String(e.id),
          eventId: eventId,
          userId: String(e.user_id),
          userName: e.user_name || "Unknown",
          userEmail: e.user_email || "",
          userNisitId: (e.metadata && e.metadata.nisit_id) || "",
          userRole: (e.metadata && e.metadata.role) || "participant",
          action: normalizeAction(e.action || e.status || "registration"),
          timestamp: realTime, // ✅ Use real timestamp
          participationDate: realTime.split("T")[0],
          details: null,
          metadata: e.metadata || {},
          proofImage: (e.metadata && e.metadata.proof_image) || null,
          distanceKm: (e.metadata && e.metadata.distance_km) || null,
          status: e.status,
        };
      });

      // logs mapped
      // If some rows are missing nisit id, fetch user profiles (cached) and fill
      const missing = Array.from(
        new Set(
          logs
            .filter((l) => (!l.userNisitId || l.userNisitId === "") && l.userId)
            .map((l) => Number(l.userId)),
        ),
      );
      for (const uid of missing) {
        try {
          const prof = await fetchUser(uid);
          if (prof && (prof.nisit_id || prof.nisitId || prof.nisit)) {
            const nisit = prof.nisit_id || prof.nisitId || prof.nisit;
            logs = logs.map((l) =>
              l.userId === String(uid) &&
              (!l.userNisitId || l.userNisitId === "")
                ? { ...l, userNisitId: nisit }
                : l,
            );
          }
        } catch (e) {}
      }

      // 🎨 ADD MOCK DATA FOR TESTING (250 entries)
      const mockLogs: LogEntry[] = [];
      const actions = [
        "registration",
        "check_in",
        "proof_submitted",
        "proof_approved",
        "proof_rejected",
        "reward_unlocked",
      ];
      for (let i = 1; i <= 250; i++) {
        const action = actions[i % actions.length];
        mockLogs.push({
          id: `mock-${i}`,
          eventId: eventId,
          userId: String(1000 + i),
          userName: `Mock User ${i}`,
          userEmail: `user${i}@example.com`,
          userNisitId: `67${String(100000 + i).slice(-6)}`,
          userRole: i % 5 === 0 ? "officer" : "participant",
          action: action,
          timestamp: new Date(Date.now() - i * 3600000).toISOString(),
          participationDate: new Date(Date.now() - i * 3600000)
            .toISOString()
            .split("T")[0],
          details: null,
          metadata: {},
          proofImage: action.includes("proof")
            ? `https://placehold.co/400x300/1e293b/10b981?text=Proof+${i}`
            : undefined,
          distanceKm: action === "reward_unlocked" ? 5 + (i % 10) : undefined,
          status: action,
        });
      }
      logs = [...logs, ...mockLogs];
      // 🎨 END MOCK DATA

      calculateStatistics();
    } catch (error) {
      console.error("Failed to load entries:", error);
      logs = [];
    } finally {
      loading = false;
    }
  }

  // ==================== COMPUTED ====================
  $: filteredLogs = logs.filter((log) => {
    if (selectedDay && selectedDay !== "all") {
      const logDate = (
        log.participationDate ||
        log.timestamp.split("T")[0] ||
        ""
      ).split("T")[0];
      if (logDate !== selectedDay) return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (
        !log.userName.toLowerCase().includes(q) &&
        !log.userEmail.toLowerCase().includes(q) &&
        !log.userNisitId.toLowerCase().includes(q)
      )
        return false;
    }
    if (
      batchFilter &&
      batchFilter.length === 2 &&
      !log.userNisitId.startsWith(batchFilter)
    )
      return false;
    if (selectedAction && log.action !== selectedAction) return false;
    if (selectedRole && log.userRole !== selectedRole) return false;
    return true;
  });

  $: paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );
  $: totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

  // Events pagination computed
  $: paginatedEvents = events.slice(
    (eventsPage - 1) * eventsPerPage,
    eventsPage * eventsPerPage,
  );
  $: totalEventsPages = Math.max(1, Math.ceil(events.length / eventsPerPage));

  // ==================== ACTIONS ====================
  async function selectEventForLogs(event: Event) {
    selectedEvent = event;
    eventDates = [];
    try {
      const start = new Date(event.startDate);
      const end = new Date(event.endDate);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        eventDates.push(new Date(d).toISOString().split("T")[0]);
      }
    } catch (e) {
      eventDates = [];
    }
    selectedDay = "all";

    await loadSnapshots(event.id); // Load snapshots

    if (snapshots.length === 0) {
      await performAutoRefresh(event.id, true);
    }

    // If still empty (no real data), force mock data load for testing
    if (snapshots.length === 0) {
      currentSnapshotId = "mock-test-id";
      // Add fake snapshot to list so UI dropdown works
      snapshots = [
        {
          id: 0,
          snapshot_id: currentSnapshotId,
          snapshot_time: new Date().toISOString(),
          entry_count: 250,
          description: "Test Data",
        },
      ];
      await loadSnapshotEntries(event.id, currentSnapshotId);
    } else {
      currentSnapshotId = snapshots[0].snapshot_id;
      await loadSnapshotEntries(event.id, currentSnapshotId);
    }
    view = "logs";
  }

  async function performAutoRefresh(eventId: string, isInitial = false) {
    if (typeof window !== "undefined" && (window as any).corsBlocked) {
      console.warn("Skipping auto-refresh due to previous network/CORS error");
      return;
    }
    isRefeshing = true;
    if (isInitial) loading = true;
    try {
      const description = isInitial ? "Initial Auto Load" : lang.autoCreated;
      await api.post(
        `/api/events/${eventId}/participants/snapshots`,
        {},
        { params: { description } },
      );
      await loadSnapshots(eventId);
      if (snapshots.length > 0) {
        currentSnapshotId = snapshots[0].snapshot_id;
        await loadSnapshotEntries(eventId, currentSnapshotId);
      }
      if (!isInitial) {
        Swal.fire({
          icon: "success",
          title: "Updated",
          timer: 1000,
          showConfirmButton: false,
          background: "#1e293b",
          color: "#fff",
        });
      }
    } catch (err: any) {
      if (!err || !err.response) {
        console.error("Network/CORS error during snapshot POST", err);
        if (typeof window !== "undefined") (window as any).corsBlocked = true;
        await Swal.fire({
          icon: "error",
          title: "Network or CORS Error",
          html: "Could not reach backend. Check server CORS settings or API host. Subsequent automatic snapshots will be skipped.",
          background: "#1e293b",
          color: "#fff",
        });
      } else {
        console.error(
          "Snapshot POST failed",
          err.response.status,
          err.response.data,
        );
        const status = err.response.status;
        const msg =
          err.response.data && err.response.data.detail
            ? JSON.stringify(err.response.data.detail)
            : err.response.statusText || "Server error";
        await Swal.fire({
          icon: "error",
          title: `Error ${status}`,
          text: msg,
          background: "#1e293b",
          color: "#fff",
        });
      }
    } finally {
      isRefeshing = false;
      loading = false;
    }
  }

  function handleManualRefresh() {
    if (selectedEvent) performAutoRefresh(selectedEvent.id);
  }

  function selectSnapshot(snap: Snapshot) {
    currentSnapshotId = snap.snapshot_id;
    snapshotDropdownOpen = false;
    if (selectedEvent) loadSnapshotEntries(selectedEvent.id, currentSnapshotId);
  }

  async function deleteSnapshot(snap: Snapshot) {
    if (!selectedEvent) return;
    const result = await Swal.fire({
      title: lang.confirmDelete,
      text: `Delete snapshot from ${new Date(snap.snapshot_time).toLocaleString("th-TH")}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      background: "#1e293b",
      color: "#fff",
    });

    if (result.isConfirmed) {
      try {
        loading = true;
        const baseUrl = API_BASE_URL.replace(/\/$/, "");
        await api.delete(
          `${baseUrl}/api/events/${selectedEvent.id}/participants/history/${snap.snapshot_id}`,
        );
        await loadSnapshots(selectedEvent.id);
        if (currentSnapshotId === snap.snapshot_id) {
          if (snapshots.length > 0) {
            currentSnapshotId = snapshots[0].snapshot_id;
            await loadSnapshotEntries(selectedEvent.id, currentSnapshotId);
          } else {
            logs = [];
            currentSnapshotId = "";
            calculateStatistics();
          }
        }
        Swal.fire({
          icon: "success",
          title: lang.deleteSuccess,
          timer: 1000,
          showConfirmButton: false,
          background: "#1e293b",
          color: "#fff",
        });
      } catch (error) {
        Swal.fire({ icon: "error", title: "Error", text: "Failed to delete" });
      } finally {
        loading = false;
      }
    }
  }

  // ==================== FILTERS & UTILS ====================
  function applyFilters() {
    currentPage = 1;
  }
  function resetFilters() {
    searchQuery = "";
    selectedAction = "";
    selectedRole = "";
  }
  function closeAllDropdowns() {
    actionDropdownOpen = false;
    roleDropdownOpen = false;
    snapshotDropdownOpen = false;
    showExportMenu = false;
    showPageDropdown = false;
    showEventsPageDropdown = false;
  }
  function backToEvents() {
    view = "events";
    selectedEvent = null;
    logs = [];
    snapshots = [];
    currentSnapshotId = "";
    resetFilters();
  }
  function toggleExportMenu() {
    showExportMenu = !showExportMenu;
  }

  async function exportLogs(format: "csv" | "json") {
    isExporting = true;
    showExportMenu = false;
    try {
      if (format === "csv") {
        const csv = convertToCSV(filteredLogs);
        downloadFile(
          csv,
          `snapshot-${currentSnapshotId}-${Date.now()}.csv`,
          "text/csv",
        );
      } else {
        const json = JSON.stringify(filteredLogs, null, 2);
        downloadFile(
          json,
          `snapshot-${currentSnapshotId}-${Date.now()}.json`,
          "application/json",
        );
      }
      Swal.fire({
        icon: "success",
        title: lang.export,
        timer: 1500,
        background: "#1e293b",
        color: "#fff",
      });
    } catch (e) {
      console.error(e);
    } finally {
      isExporting = false;
    }
  }

  function convertToCSV(data: LogEntry[]): string {
    const headers = [
      "ID",
      "Name",
      "Email",
      "Nisit ID",
      "Role",
      "Action",
      "Date",
      "Timestamp",
      "Status",
    ];
    const rows = data.map((log) => [
      log.id,
      log.userName,
      log.userEmail,
      log.userNisitId,
      log.userRole,
      log.action,
      log.participationDate,
      log.timestamp,
      log.status,
    ]);
    return [
      headers.join(","),
      ...rows.map((row) => row.map((c) => `"${c}"`).join(",")),
    ].join("\n");
  }

  function downloadFile(content: string, filename: string, type: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  function nextPage() {
    if (currentPage < totalPages) currentPage++;
  }
  function prevPage() {
    if (currentPage > 1) currentPage--;
  }
  function jumpToPage(p: number) {
    currentPage = p;
  }

  // Events pagination handlers
  function prevEventsPage() {
    if (eventsPage > 1) eventsPage--;
  }
  function nextEventsPage() {
    if (eventsPage < totalEventsPages) eventsPage++;
  }
  function jumpToEventsPage(p: number) {
    eventsPage = p;
    showEventsPageDropdown = false;
  }

  // Modal (Existing logic)
  async function openParticipantDetail(log: LogEntry) {
    if (!selectedEvent) return;
    loading = true;
    try {
      // opening participant detail
      let userLogs: any[] = [];
      try {
        userLogs = await getLogsForUser(selectedEvent.id, log.userId);
        // user logs fetched
      } catch (e) {
        console.warn("getLogsForUser failed", e);
        userLogs = [];
      }

      const logsToUse = userLogs.length > 0 ? userLogs : [log];
      const participationsByDate = new Map();
      logsToUse.forEach((l: any) => {
        const d = l.participationDate || l.timestamp.split("T")[0];
        if (!participationsByDate.has(d)) participationsByDate.set(d, []);
        participationsByDate.get(d).push(l);
      });
      const sorted = logsToUse.sort(
        (a: any, b: any) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );

      let completedDays = 0;
      for (const [, dayArr] of participationsByDate.entries()) {
        if (dayArr.some((x: any) => x.action === "reward_unlocked"))
          completedDays++;
      }
      const totalDistance = sorted.reduce(
        (sum: number, it: any) => sum + (Number(it.distanceKm) || 0),
        0,
      );

      selectedParticipant = {
        userId: log.userId,
        userName: log.userName,
        userEmail: log.userEmail,
        userNisitId: log.userNisitId,
        userRole: log.userRole,
        participations: sorted,
        totalDays: participationsByDate.size,
        completedDays,
        totalDistance,
        firstParticipation: sorted[sorted.length - 1]?.timestamp,
        lastParticipation: sorted[0]?.timestamp,
      };

      try {
        const stats = await getUserStatistics(Number(log.userId));
        // statistics fetched
        (selectedParticipant as any).statistics = stats;
        if (
          stats &&
          stats.total_distance_km !== undefined &&
          stats.total_distance_km !== null
        ) {
          (selectedParticipant as any).totalDistanceAccumulated = Number(
            stats.total_distance_km,
          );
        } else {
          // Fallback: call the statistics API directly (axios)
          try {
            const resp = await api.get(
              `/api/participations/user/${log.userId}/statistics`,
            );
            if (
              resp &&
              resp.data &&
              resp.data.total_distance_km !== undefined &&
              resp.data.total_distance_km !== null
            ) {
              (selectedParticipant as any).totalDistanceAccumulated = Number(
                resp.data.total_distance_km,
              );
            }
          } catch (e) {
            // ignore
          }
        }
      } catch (e) {}

      try {
        const userProfile = await fetchUser(Number(log.userId));
        // user profile fetched
        if (userProfile) {
          selectedParticipant.userNisitId =
            userProfile.nisit_id ||
            userProfile.nisitId ||
            userProfile.nisit ||
            selectedParticipant.userNisitId;
          selectedParticipant.userName =
            `${userProfile.first_name || ""} ${userProfile.last_name || ""}`.trim() ||
            selectedParticipant.userName;
          selectedParticipant.userEmail =
            userProfile.email || selectedParticipant.userEmail;
        }
      } catch (e) {}

      showDetailModal = true;
    } catch (e) {
      console.error(e);
      showDetailModal = false;
    } finally {
      loading = false;
    }
  }

  function closeDetailModal() {
    showDetailModal = false;
    selectedParticipant = null;
  }

  function overlayKeydown(e: KeyboardEvent) {
    if (e.key === "Enter" || e.key === " " || e.key === "Escape") {
      closeDetailModal();
    }
  }

  function getParticipationsByDate(
    participations: LogEntry[],
  ): Map<string, LogEntry[]> {
    const grouped = new Map<string, LogEntry[]>();
    participations.forEach((log) => {
      const date = log.participationDate || log.timestamp.split("T")[0];
      if (!grouped.has(date)) grouped.set(date, []);
      grouped.get(date)!.push(log);
    });
    return new Map(
      [...grouped.entries()].sort((a, b) => b[0].localeCompare(a[0])),
    );
  }

  function getDayStatus(dayLogs: LogEntry[]) {
    if (dayLogs.some((log) => log.action === "registration_cancelled"))
      return { status: lang.deleteSuccess || lang.cancelled, color: "#64748b" };
    if (dayLogs.some((log) => log.action === "reward_unlocked"))
      return { status: lang.completed, color: "#10b981" };
    if (
      dayLogs.some(
        (log) => log.action === "check_in" || log.action === "checked_in",
      )
    )
      return { status: lang.checkIns, color: "#06b6d4" };
    if (dayLogs.some((log) => log.action === "no_show"))
      return { status: "No Show", color: "#ef4444" };
    return { status: lang.registrations, color: "#3b82f6" };
  }

  onMount(() => {
    loadEvents();
  });

  // ==================== PROOFS VIEWING ====================
  async function viewProofForLog(log: LogEntry) {
    if (!selectedEvent) return;
    loading = true;
    try {
      if (log.proofImage) {
        const url = getApiImageUrl(log.proofImage as string);
        await Swal.fire({
          title: lang.proofImage,
          imageUrl: url,
          imageAlt: "Proof image",
          showCloseButton: true,
          background: "#1e293b",
          color: "#fff",
        });
        return;
      }

      const res = await api.get(
        `/api/participations/event/${selectedEvent.id}/proofs`,
      );
      const proofs = Array.isArray(res.data)
        ? res.data
        : res.data && res.data.proofs
          ? res.data.proofs
          : [];

      if (!proofs || proofs.length === 0) {
        await Swal.fire({
          icon: "info",
          title: "No proofs",
          text: "No proof images found for this event",
          background: "#1e293b",
          color: "#fff",
        });
        return;
      }

      const match = proofs.find(
        (p: any) =>
          String(p.user_id) === String(log.userId) ||
          String(p.participation_id) === String(log.id) ||
          String(p.participation_id) === String(log.participation_id),
      );

      if (match && (match.proof_image_url || match.image || match.url)) {
        const img = getApiImageUrl(
          match.proof_image_url || match.image || match.url,
        );
        await Swal.fire({
          title: lang.proofImage,
          imageUrl: img,
          imageAlt: "Proof image",
          showCloseButton: true,
          background: "#1e293b",
          color: "#fff",
        });
        return;
      }

      const html = proofs
        .map((p: any) => {
          const imgUrl = getApiImageUrl(
            p.proof_image_url || p.image || p.url || "",
          );
          const uid = p.user_id ?? p.participation_id ?? "";
          const status = p.status || "";
          return `<div style="display:inline-block;margin:8px;text-align:center"><img src="${imgUrl}" style="max-width:200px;max-height:150px;display:block;border-radius:6px"/><div style="color:#ddd;margin-top:6px;font-size:12px">user:${uid} ${status}</div></div>`;
        })
        .join("");

      await Swal.fire({
        title: "Proofs",
        html: `<div style="display:flex;flex-wrap:wrap;justify-content:center">${html}</div>`,
        width: 900,
        showCloseButton: true,
        background: "#1e293b",
        color: "#fff",
      });
    } catch (err) {
      console.error("Error loading proofs", err);
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load proofs",
        background: "#1e293b",
        color: "#fff",
      });
    } finally {
      loading = false;
    }
  }
</script>

<svelte:window on:click={closeAllDropdowns} />

<div class="logs-management-container">
  {#if view === "events"}
    <div class="events-view">
      <div class="page-header">
        <!-- header text removed per request -->
      </div>
      {#if events.length === 0}
        <div class="empty-state"><p>{lang.noEvents}</p></div>
      {:else}
        <div class="events-grid">
          {#each paginatedEvents as event}
            <div class="event-card">
              <div class="event-image-wrapper">
                {#if event.image}
                  <img src={event.image} alt={event.name} class="event-image" />
                {:else}
                  <div class="no-image-placeholder" aria-hidden="true">
                    <div class="no-image-frame">
                      <div class="no-image-text">No Image</div>
                    </div>
                  </div>
                {/if}

                {#if event.pendingCount}
                  <div class="pending-badge-overlay">
                    {event.pendingCount}
                    {lang.newLogs || "Pending"}
                  </div>
                {/if}

                <div
                  class="event-status-badge"
                  style="background:{getEventStatusColor(
                    event.status,
                  )}; color: #fff;"
                  class:active={event.status === "Active"}
                  class:closed={event.status === "Closed"}
                  class:draft={event.status === "Draft"}
                >
                  <span class="status-text"
                    >{getEventStatusLabel(event.status)}</span
                  >
                </div>
              </div>

              <div class="event-card-body">
                <h3 class="event-title">{event.name}</h3>
                {#if event.description}
                  <div class="event-description">{event.description}</div>
                {/if}

                <div class="event-meta">
                  <div class="meta-item">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      ><path d="M21 10c0 6-9 12-9 12S3 16 3 10a9 9 0 1118 0z"
                      ></path><circle cx="12" cy="10" r="2"></circle></svg
                    >
                    <span>{event.location || "-"}</span>
                  </div>
                  <div class="meta-item">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      ><rect x="3" y="4" width="18" height="18" rx="2"
                      ></rect><path d="M16 2v4M8 2v4M3 10h18"></path></svg
                    >
                    <span>{formatDateRange(event)}</span>
                  </div>
                </div>

                <button
                  class="btn-view-logs"
                  on:click={() => selectEventForLogs(event)}
                  >{lang.viewLogs}</button
                >
              </div>
            </div>
          {/each}
        </div>

        {#if totalEventsPages > 1}
          <div class="pagination-wrapper" style="margin-top:1.5rem;">
            <div class="pagination-controls">
              <button
                class="page-btn"
                aria-label="Previous page"
                on:click={prevEventsPage}
                disabled={eventsPage === 1}
                ><svg
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  ><path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 19l-7-7 7-7"
                  ></path></svg
                ></button
              >
              <div class="page-select-wrapper">
                <button
                  class="page-indicator-box"
                  on:click|stopPropagation={() =>
                    (showEventsPageDropdown = !showEventsPageDropdown)}
                >
                  <span class="current-page">{eventsPage}</span><span
                    class="sep">/</span
                  ><span class="total-page">{totalEventsPages}</span>
                  <svg
                    class="dropdown-arrow"
                    class:flipped={showEventsPageDropdown}
                    width="12"
                    height="12"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    ><path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="3"
                      d="M19 9l-7 7-7-7"
                    ></path></svg
                  >
                </button>
                {#if showEventsPageDropdown}
                  <div
                    class="click-outside"
                    role="button"
                    tabindex="0"
                    aria-hidden="true"
                    on:click|stopPropagation={() =>
                      (showEventsPageDropdown = false)}
                    on:keydown|stopPropagation={(e) => {
                      if (
                        e.key === "Enter" ||
                        e.key === " " ||
                        e.key === "Escape"
                      )
                        showEventsPageDropdown = false;
                    }}
                  ></div>
                  <div class="page-dropdown-list">
                    {#each Array(totalEventsPages) as _, i}
                      <button
                        class="page-option"
                        class:active={eventsPage === i + 1}
                        on:click|stopPropagation={() => {
                          jumpToEventsPage(i + 1);
                        }}>{"Page " + (i + 1)}</button
                      >
                    {/each}
                  </div>
                {/if}
              </div>
              <button
                class="page-btn"
                aria-label="Next page"
                on:click={nextEventsPage}
                disabled={eventsPage === totalEventsPages}
                ><svg
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  ><path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5l7 7-7 7"
                  ></path></svg
                ></button
              >
            </div>
            <div class="showing-text">
              {lang.showingResults}
              {(eventsPage - 1) * eventsPerPage + 1} - {Math.min(
                eventsPage * eventsPerPage,
                events.length,
              )}
              {lang.of}
              {events.length}
              {lang.results}
            </div>
          </div>
        {/if}
      {/if}
    </div>
  {:else}
    <div class="logs-view">
      <div class="logs-header">
        <button class="btn-back" on:click={backToEvents}>
          <svg
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            ><path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            ></path></svg
          >
          {lang.backToEvents}
        </button>
        <div class="header-info">
          <h1>{selectedEvent?.name}</h1>
          <div class="event-meta-small">
            <span class="meta-location"
              ><svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                ><path d="M21 10c0 6-9 12-9 12S3 16 3 10a9 9 0 1118 0z"
                ></path><circle cx="12" cy="10" r="2"></circle></svg
              >{selectedEvent?.location || "-"}</span
            >
            <span class="meta-date"
              ><svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                ><rect x="3" y="4" width="18" height="18" rx="2"></rect><path
                  d="M16 2v4M8 2v4M3 10h18"
                ></path></svg
              >{formatDateRange(selectedEvent)}</span
            >
            <span
              class="status-badge-inline"
              style="background: {getEventStatusColor(
                selectedEvent?.status || '',
              )}20; color: {getEventStatusColor(
                selectedEvent?.status || '',
              )}; border-color: {getEventStatusColor(
                selectedEvent?.status || '',
              )}40;"
            >
              {getEventStatusLabel(selectedEvent?.status || "")}
            </span>
          </div>
        </div>
        <div class="header-actions">
          <button
            class="btn-create-snapshot"
            on:click={handleManualRefresh}
            disabled={isRefeshing || loading}
          >
            <svg
              class:animate-spin={isRefeshing}
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              stroke-width="2"
              ><path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              ></path></svg
            >
            {isRefeshing ? lang.syncing : lang.refreshData}
          </button>
          <button
            class="btn-export"
            on:click|stopPropagation={toggleExportMenu}
          >
            <svg
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              stroke-width="2"
              ><path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              ></path></svg
            >
            {lang.export}
          </button>
          {#if showExportMenu}
            <div class="export-menu">
              <button class="export-option" on:click={() => exportLogs("csv")}
                >{lang.exportCSV}</button
              >
              <button class="export-option" on:click={() => exportLogs("json")}
                >{lang.exportJSON}</button
              >
            </div>
          {/if}
        </div>
      </div>

      <div class="stats-dashboard">
        <div class="stat-card">
          <div
            class="stat-icon"
            style="background: {getActionColor('registration')}20;"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke={getActionColor("registration")}
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              ><path d={getActionConfig("registration").icon}></path></svg
            >
          </div>
          <div class="stat-info">
            <div class="stat-value">{statistics.totalRegistrations}</div>
            <div class="stat-label">{lang.registrations}</div>
          </div>
        </div>

        <div class="stat-card">
          <div
            class="stat-icon"
            style="background: {getActionColor('check_in')}20;"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke={getActionColor("check_in")}
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              ><path d={getActionConfig("check_in").icon}></path></svg
            >
          </div>
          <div class="stat-info">
            <div class="stat-value">{statistics.totalCheckIns}</div>
            <div class="stat-label">{lang.checkIns}</div>
          </div>
        </div>

        <div class="stat-card">
          <div
            class="stat-icon"
            style="background: {getActionColor('reward_unlocked')}20;"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke={getActionColor("reward_unlocked")}
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              ><path d={getActionConfig("reward_unlocked").icon}></path></svg
            >
          </div>
          <div class="stat-info">
            <div class="stat-value">{statistics.totalCompleted}</div>
            <div class="stat-label">{lang.completed}</div>
          </div>
        </div>

        <div class="stat-card">
          <div
            class="stat-icon"
            style="background: {getActionColor('registration_cancelled')}20;"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke={getActionColor("registration_cancelled")}
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              ><path d={getActionConfig("registration_cancelled").icon}
              ></path></svg
            >
          </div>
          <div class="stat-info">
            <div class="stat-value">{statistics.totalCancelled}</div>
            <div class="stat-label">{lang.cancelled}</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background: rgba(59,130,246,0.12);">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#3b82f6"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              ><path
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              ></path></svg
            >
          </div>
          <div class="stat-info">
            <div class="stat-value">{statistics.uniqueUsers}</div>
            <div class="stat-label">{lang.uniqueUsers}</div>
          </div>
        </div>
      </div>

      <div class="filter-section">
        <div class="filter-dropdown" class:dropdown-open={snapshotDropdownOpen}>
          <button
            class="filter-trigger snapshot-trigger"
            on:click|stopPropagation={() => {
              const wasOpen = snapshotDropdownOpen;
              closeAllDropdowns();
              snapshotDropdownOpen = !wasOpen;
            }}
          >
            <div class="flex flex-col items-start truncate">
              <span class="text-xs text-gray-400 font-semibold uppercase"
                >{lang.selectSnapshot}</span
              >
              <span class="text-white text-sm truncate max-w-[200px]">
                {snapshots.find((s) => s.snapshot_id === currentSnapshotId)
                  ? getSnapshotDisplay(
                      snapshots.find(
                        (s) => s.snapshot_id === currentSnapshotId,
                      ),
                    )
                  : "Select Snapshot"}
              </span>
            </div>
            <svg
              class="chevron"
              class:rotated={snapshotDropdownOpen}
              width="12"
              height="12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              stroke-width="2"
              ><path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M19 9l-7 7-7-7"
              ></path></svg
            >
          </button>
          {#if snapshotDropdownOpen}
            <div class="filter-menu snapshot-menu">
              {#each snapshots as snap}
                <div
                  class="snapshot-item"
                  class:selected={currentSnapshotId === snap.snapshot_id}
                >
                  <button
                    class="snapshot-content"
                    on:click={() => selectSnapshot(snap)}
                  >
                    <span class="snap-date"
                      >{new Date(snap.snapshot_time).toLocaleString(
                        "th-TH",
                      )}</span
                    >
                    <span class="snap-desc"
                      >{snap.description || lang.autoCreated}</span
                    >
                    <span class="snap-count badge badge-sm"
                      >{snap.entry_count} entries</span
                    >
                  </button>
                  <button
                    class="snapshot-delete"
                    aria-label={lang.deleteSnapshot}
                    on:click|stopPropagation={() => deleteSnapshot(snap)}
                  >
                    <svg
                      width="14"
                      height="14"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      ><path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      ></path></svg
                    >
                  </button>
                </div>
              {/each}
              {#if snapshots.length === 0}
                <div class="p-3 text-gray-500 text-sm text-center">
                  No snapshots
                </div>
              {/if}
            </div>
          {/if}
        </div>

        <div class="search-box">
          <svg
            class="search-icon"
            width="18"
            height="18"
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
            placeholder={lang.search}
            bind:value={searchQuery}
            class="search-input"
          />
        </div>

        <div class="filter-dropdown" class:dropdown-open={actionDropdownOpen}>
          <button
            class="filter-trigger"
            on:click|stopPropagation={() => {
              closeAllDropdowns();
              actionDropdownOpen = !actionDropdownOpen;
            }}
          >
            <span
              >{selectedAction
                ? getActionLabel(selectedAction)
                : lang.allActions}</span
            >
            <svg
              class="chevron"
              class:rotated={actionDropdownOpen}
              width="12"
              height="12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              stroke-width="2"
              ><path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M19 9l-7 7-7-7"
              ></path></svg
            >
          </button>
          {#if actionDropdownOpen}
            <div class="filter-menu">
              <button
                class="filter-option"
                class:selected={!selectedAction}
                on:click={() => {
                  selectedAction = "";
                }}>{lang.allActions}</button
              >
              {#each Object.keys(actionConfigs) as action}
                <button
                  class="filter-option"
                  class:selected={selectedAction === action}
                  on:click={() => {
                    selectedAction = action;
                  }}>{getActionLabel(action)}</button
                >
              {/each}
            </div>
          {/if}
        </div>

        <div class="filter-dropdown" class:dropdown-open={roleDropdownOpen}>
          <button
            class="filter-trigger"
            on:click|stopPropagation={() => {
              closeAllDropdowns();
              roleDropdownOpen = !roleDropdownOpen;
            }}
          >
            <span
              >{selectedRole
                ? selectedRole === "officer"
                  ? lang.officer
                  : lang.participant
                : lang.allRoles}</span
            >
            <svg
              class="chevron"
              class:rotated={roleDropdownOpen}
              width="12"
              height="12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              stroke-width="2"
              ><path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M19 9l-7 7-7-7"
              ></path></svg
            >
          </button>
          {#if roleDropdownOpen}
            <div class="filter-menu">
              <button
                class="filter-option"
                class:selected={!selectedRole}
                on:click={() => {
                  selectedRole = "";
                }}>{lang.allRoles}</button
              >
              <button
                class="filter-option"
                class:selected={selectedRole === "participant"}
                on:click={() => {
                  selectedRole = "participant";
                }}>{lang.participant}</button
              >
              <button
                class="filter-option"
                class:selected={selectedRole === "officer"}
                on:click={() => {
                  selectedRole = "officer";
                }}>{lang.officer}</button
              >
            </div>
          {/if}
        </div>

        <button class="btn-reset-filter" on:click={resetFilters}
          >{lang.reset}</button
        >
      </div>

      <!-- Scrollable logs container -->
      <div class="logs-content">
        {#if false}
          <div
            class="pagination-wrapper top-pagination"
            style="margin-bottom:1rem;"
          >
            <div class="pagination-controls">
              <button
                class="page-btn"
                aria-label="Previous page"
                on:click={prevPage}
                disabled={currentPage === 1}
                ><svg
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  ><path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 19l-7-7 7-7"
                  ></path></svg
                ></button
              >
              <div class="page-select-wrapper">
                <button
                  class="page-indicator-box"
                  on:click|stopPropagation={() =>
                    (showPageDropdown = !showPageDropdown)}
                >
                  <span class="current-page">{currentPage}</span><span
                    class="sep">/</span
                  ><span class="total-page">{totalPages}</span>
                  <svg
                    class="dropdown-arrow"
                    class:flipped={showPageDropdown}
                    width="12"
                    height="12"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    ><path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="3"
                      d="M19 9l-7 7-7-7"
                    ></path></svg
                  >
                </button>
                {#if showPageDropdown}
                  <div
                    class="click-outside"
                    role="button"
                    tabindex="0"
                    aria-hidden="true"
                    on:click|stopPropagation={() => (showPageDropdown = false)}
                    on:keydown|stopPropagation={(e) => {
                      if (
                        e.key === "Enter" ||
                        e.key === " " ||
                        e.key === "Escape"
                      )
                        showPageDropdown = false;
                    }}
                  ></div>
                  <div class="page-dropdown-list">
                    {#each Array(totalPages) as _, i}
                      <button
                        class="page-option"
                        class:active={currentPage === i + 1}
                        on:click|stopPropagation={() => {
                          jumpToPage(i + 1);
                        }}>{"Page " + (i + 1)}</button
                      >
                    {/each}
                  </div>
                {/if}
              </div>
              <button
                class="page-btn"
                aria-label="Next page"
                on:click={nextPage}
                disabled={currentPage === totalPages}
                ><svg
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  ><path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5l7 7-7 7"
                  ></path></svg
                ></button
              >
            </div>
            <div class="showing-text">
              {lang.showingResults}
              {(currentPage - 1) * itemsPerPage + 1} - {Math.min(
                currentPage * itemsPerPage,
                filteredLogs.length,
              )}
              {lang.of}
              {filteredLogs.length}
              {lang.results}
            </div>
          </div>
        {/if}

        <div class="table-wrapper">
          {#if filteredLogs.length === 0}
            <div class="empty-state">
              {#if loading}
                <p>{lang.loading}</p>
              {:else}
                <svg
                  width="48"
                  height="48"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  ><path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.5"
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path></svg
                >
                <p>{lang.noData}</p>
              {/if}
            </div>
          {:else}
            <table class="logs-table">
              <thead>
                <tr>
                  <th>#</th><th>{lang.name}</th><th>{lang.email}</th><th
                    >{lang.nisitId}</th
                  ><th>{lang.role}</th><th>{lang.action}</th><th>{lang.date}</th
                  ><th>{lang.timestamp}</th><th></th>
                </tr>
              </thead>
              <tbody>
                {#each paginatedLogs as log, i}
                  <tr>
                    <td
                      ><div class="index-badge">
                        {i + 1 + (currentPage - 1) * itemsPerPage}
                      </div></td
                    >
                    <td class="name-cell">{log.userName}</td>
                    <td class="email-cell">{log.userEmail}</td>
                    <td class="nisit-cell">{log.userNisitId}</td>
                    <td
                      ><span
                        class="role-badge"
                        class:officer={log.userRole === "officer"}
                        >{log.userRole === "officer"
                          ? lang.officer
                          : lang.participant}</span
                      ></td
                    >
                    <td
                      ><span
                        class="action-badge"
                        style="background: {getActionColor(
                          log.action,
                        )}20; border-color: {getActionColor(
                          log.action,
                        )}40; color: {getActionColor(log.action)};"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          style="flex-shrink:0;margin-right:6px;"
                        >
                          <path d={getActionConfig(log.action).icon}></path>
                        </svg>
                        {getActionLabel(log.action)}
                      </span></td
                    >
                    <td class="date-cell"
                      >{formatDate(
                        log.participationDate || log.timestamp.split("T")[0],
                      )}</td
                    >
                    <td class="time-cell">{formatTimestamp(log.timestamp)}</td>
                    <td
                      ><button
                        class="btn-detail"
                        aria-label={lang.viewDetails}
                        on:click={() => openParticipantDetail(log)}
                        ><svg
                          width="16"
                          height="16"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          stroke-width="2"
                          ><path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          ></path><path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          ></path></svg
                        ></button
                      ></td
                    >
                  </tr>
                {/each}
              </tbody>
            </table>
          {/if}
        </div>

        {#if totalPages > 1}
          <div class="pagination-wrapper">
            <div class="pagination-controls">
              <button
                class="page-btn"
                aria-label="Previous page"
                on:click={prevPage}
                disabled={currentPage === 1}
                ><svg
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  ><path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 19l-7-7 7-7"
                  ></path></svg
                ></button
              >
              <div class="page-select-wrapper">
                <button
                  class="page-indicator-box"
                  on:click|stopPropagation={() =>
                    (showPageDropdown = !showPageDropdown)}
                >
                  <span class="current-page">{currentPage}</span><span
                    class="sep">/</span
                  ><span class="total-page">{totalPages}</span>
                  <svg
                    class="dropdown-arrow"
                    class:flipped={showPageDropdown}
                    width="12"
                    height="12"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    ><path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="3"
                      d="M19 9l-7 7-7-7"
                    ></path></svg
                  >
                </button>
                {#if showPageDropdown}
                  <div
                    class="click-outside"
                    role="button"
                    tabindex="0"
                    aria-hidden="true"
                    on:click|stopPropagation={() => (showPageDropdown = false)}
                    on:keydown|stopPropagation={(e) => {
                      if (
                        e.key === "Enter" ||
                        e.key === " " ||
                        e.key === "Escape"
                      )
                        showPageDropdown = false;
                    }}
                  ></div>
                  <div class="page-dropdown-list">
                    {#each Array(totalPages) as _, i}<button
                        class="page-option"
                        class:active={currentPage === i + 1}
                        on:click|stopPropagation={() => {
                          jumpToPage(i + 1);
                          showPageDropdown = false;
                        }}>Page {i + 1}</button
                      >{/each}
                  </div>
                {/if}
              </div>
              <button
                class="page-btn"
                aria-label="Next page"
                on:click={nextPage}
                disabled={currentPage === totalPages}
                ><svg
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  ><path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5l7 7-7 7"
                  ></path></svg
                ></button
              >
            </div>
            <div class="showing-text">
              {lang.showingResults}
              {(currentPage - 1) * itemsPerPage + 1} - {Math.min(
                currentPage * itemsPerPage,
                filteredLogs.length,
              )}
              {lang.of}
              {filteredLogs.length}
              {lang.results}
            </div>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

{#if showDetailModal && selectedParticipant}
  <div
    class="modal-overlay"
    role="button"
    tabindex="0"
    on:click={closeDetailModal}
    on:keydown={overlayKeydown}
  >
    <div
      class="detail-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-modal-title"
      tabindex="0"
      on:click|stopPropagation
      on:keydown|stopPropagation
    >
      <div class="detail-modal-header">
        <h2 id="detail-modal-title">
          <svg
            width="24"
            height="24"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            stroke-width="2"
            ><path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            ></path></svg
          >{lang.participantDetails}
        </h2>
        <button
          class="modal-close-btn"
          aria-label={lang.close}
          on:click={closeDetailModal}
          ><svg
            width="24"
            height="24"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            ><path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            ></path></svg
          ></button
        >
      </div>
      <div class="detail-modal-body">
        <div class="user-info-section">
          <div class="user-avatar">
            <svg
              width="48"
              height="48"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              ><path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              ></path></svg
            >
          </div>
          <div class="user-details">
            <h3>{selectedParticipant.userName}</h3>
            <p class="user-email">{selectedParticipant.userEmail}</p>
            <p class="user-nisit">{selectedParticipant.userNisitId}</p>
            <span
              class="user-role-badge"
              class:officer={selectedParticipant.userRole === "officer"}
              >{selectedParticipant.userRole === "officer"
                ? lang.officer
                : lang.participant}</span
            >
          </div>
        </div>
        <div class="summary-stats">
          <div class="summary-stat">
            <div
              class="summary-stat-icon"
              style="background: rgba(59, 130, 246, 0.1);"
            >
              <svg
                width="20"
                height="20"
                fill="none"
                stroke="#3b82f6"
                viewBox="0 0 24 24"
                stroke-width="2"
                ><path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                ></path></svg
              >
            </div>
            <div class="summary-stat-info">
              <div class="summary-stat-value">
                {selectedParticipant.totalDays}
              </div>
              <div class="summary-stat-label">{lang.totalDays}</div>
            </div>
          </div>
          <div class="summary-stat">
            <div
              class="summary-stat-icon"
              style="background: rgba(16, 185, 129, 0.1);"
            >
              <svg
                width="20"
                height="20"
                fill="none"
                stroke="#10b981"
                viewBox="0 0 24 24"
                stroke-width="2"
                ><path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path></svg
              >
            </div>
            <div class="summary-stat-info">
              <div class="summary-stat-value">
                {selectedParticipant.completedDays}
              </div>
              <div class="summary-stat-label">{lang.completedDays}</div>
            </div>
          </div>
          <div class="summary-stat">
            <div
              class="summary-stat-icon"
              style="background: rgba(245, 158, 11, 0.1);"
            >
              <svg
                width="20"
                height="20"
                fill="none"
                stroke="#f59e0b"
                viewBox="0 0 24 24"
                stroke-width="2"
                ><path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                ></path></svg
              >
            </div>
            <div class="summary-stat-info">
              <div class="summary-stat-value">
                {Number(
                  (selectedParticipant.totalDistanceAccumulated ??
                    selectedParticipant.totalDistance) ||
                    0,
                ).toFixed(2)} km
              </div>
              <div class="summary-stat-label">{lang.totalDistance}</div>
            </div>
          </div>
        </div>
        <div class="participation-history-section">
          <h3 class="section-title">
            <svg
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              stroke-width="2"
              ><path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path></svg
            >{lang.participationHistory}
          </h3>
          <div class="history-timeline">
            {#each [...getParticipationsByDate(selectedParticipant.participations).entries()] as [date, dayLogs]}
              {@const dayStatus = getDayStatus(dayLogs)}
              <div class="day-group">
                <div class="day-header">
                  <div class="day-date">
                    <svg
                      width="16"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      stroke-width="2"
                      ><path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      ></path></svg
                    >{formatDate(date)}
                  </div>
                  <span
                    class="day-status-badge"
                    style="background: {dayStatus.color}20; color: {dayStatus.color}; border-color: {dayStatus.color}40;"
                  >
                    {#if dayStatus.color === "#10b981"}
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        style="flex-shrink:0"
                        ><path d="M20 6L9 17l-5-5"></path></svg
                      >
                    {:else}
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        style="flex-shrink:0"
                        ><circle cx="12" cy="12" r="3"></circle></svg
                      >
                    {/if}
                    <span style="margin-left:6px">{dayStatus.status}</span>
                  </span>
                </div>
                <div class="day-logs">
                  {#each dayLogs as log}
                    {@const actionColor = getActionColor(log.action)}
                    <div class="log-item">
                      <div class="log-time">
                        <svg
                          width="14"
                          height="14"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          stroke-width="2"
                          ><path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          ></path></svg
                        >{new Date(log.timestamp).toLocaleTimeString(
                          currentLang === "th" ? "th-TH" : "en-GB",
                          { hour: "2-digit", minute: "2-digit" },
                        )}
                      </div>
                      <span
                        class="log-action-badge"
                        style="background: {actionColor}20; color: {actionColor}; border-color: {actionColor}40;"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          style="flex-shrink:0;margin-right:6px;"
                        >
                          <path d={getActionConfig(log.action).icon}></path>
                        </svg>
                        {getActionLabel(log.action)}
                      </span>
                      {#if log.distanceKm}<span class="log-distance"
                          ><svg
                            width="14"
                            height="14"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            stroke-width="2"
                            ><path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                            ></path></svg
                          >{log.distanceKm} km</span
                        >{/if}
                      {#if log.proofImage}<button
                          class="btn-view-proof"
                          on:click={() => viewProofForLog(log)}
                          ><svg
                            width="14"
                            height="14"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            stroke-width="2"
                            ><path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            ></path></svg
                          >{lang.proofImage}</button
                        >{/if}
                    </div>
                  {/each}
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  /* Base Styles */
  .logs-management-container {
    min-height: 100vh;
    color: white;
  }
  .events-view,
  .logs-view {
    max-width: 1400px;
    margin: 0 auto;
    padding: 2rem;
  }

  /* Events Grid (match verify-proof styling) */
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
    min-width: 0;
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

  .no-image-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #64748b;
  }

  .no-image-frame {
    width: 72%;
    height: 56%;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0;
    border: none;
    background: transparent;
    box-shadow: none;
  }

  .no-image-text {
    font-size: 2.4rem;
    color: rgba(203, 213, 225, 0.28);
    font-weight: 700;
    line-height: 1;
  }

  .event-card:hover .event-image {
    transform: scale(1.05);
  }

  .event-card-body {
    padding: 1.5rem;
    min-width: 0;
  }

  .event-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: #f8fafc;
    margin-bottom: 0.5rem;
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
    margin-bottom: 1rem;
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

  .btn-view-logs {
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

  .btn-view-logs:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4);
  }

  /* Page Header */
  .page-header {
    text-align: center;
    margin-bottom: 3rem;
  }
  /* .page-header styles removed (unused) */
  .empty-state {
    padding: 4rem;
    text-align: center;
    color: #64748b;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  /* Logs Header */
  .logs-header {
    background: rgba(30, 41, 59, 0.6);
    backdrop-filter: blur(10px);
    padding: 1.5rem;
    border-radius: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border: 1px solid rgba(255, 255, 255, 0.08);
    margin-bottom: 2rem;
    flex-wrap: wrap;
    gap: 1.5rem;

    /* ✅ เพิ่ม 2 บรรทัดนี้ */
    position: relative;
    z-index: 30;
  }
  .header-info {
    flex: 1;
    min-width: 250px;
  }
  .header-info h1 {
    font-size: 1.75rem;
    font-weight: 700;
    margin: 0 0 0.5rem 0;
    color: #f8fafc;
  }
  .event-meta-small {
    font-size: 0.9rem;
    color: #94a3b8;
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .event-meta-small .meta-location,
  .event-meta-small .meta-date {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    color: #94a3b8;
  }
  .event-meta-small .meta-location svg,
  .event-meta-small .meta-date svg {
    color: #10b981;
    flex-shrink: 0;
  }
  .status-badge-inline {
    padding: 0.375rem 0.75rem;
    border-radius: 12px;
    font-size: 0.9rem;
    font-weight: 700;
    border: 1px solid rgba(255, 255, 255, 0.06);
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }
  /* .status-badge-inline.active removed (unused in this file) */
  .header-actions {
    display: flex;
    gap: 0.75rem;
    position: relative;
    overflow: visible;
  }

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

  .btn-create-snapshot {
    background: linear-gradient(135deg, #f59e0b, #d97706);
    color: white;
    padding: 0.75rem 1.25rem;
    border-radius: 12px;
    border: none;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.9rem;
    transition: all 0.2s;
  }
  .btn-create-snapshot:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(245, 158, 11, 0.4);
  }
  .btn-create-snapshot:disabled {
    opacity: 0.7;
    cursor: wait;
  }

  .btn-export {
    background: rgba(59, 130, 246, 0.2);
    color: #3b82f6;
    padding: 0.75rem 1.25rem;
    border-radius: 12px;
    border: 1px solid rgba(59, 130, 246, 0.3);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.9rem;
    transition: all 0.2s;
  }
  .btn-export:hover {
    background: rgba(59, 130, 246, 0.3);
    border-color: #3b82f6;
  }

  .export-menu {
    position: absolute;
    top: calc(100% + 0.5rem);
    right: 0;
    background: #1e293b;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 0.5rem;
    min-width: 200px;
    z-index: 99999;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    animation: slideDown 0.2s ease;
  }
  .export-option {
    width: 100%;
    padding: 0.75rem 1rem;
    text-align: left;
    background: transparent;
    border: none;
    color: #f8fafc;
    cursor: pointer;
    border-radius: 8px;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    transition: all 0.2s;
  }
  .export-option:hover {
    background: rgba(16, 185, 129, 0.1);
    color: #10b981;
  }

  /* Stats */
  .stats-dashboard {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }
  .stat-card {
    background: rgba(30, 41, 59, 0.6);
    backdrop-filter: blur(10px);
    padding: 1.5rem;
    border-radius: 16px;
    display: flex;
    align-items: center;
    gap: 1rem;
    border: 1px solid rgba(255, 255, 255, 0.08);
    transition: all 0.3s;
  }
  .stat-card:hover {
    transform: translateY(-2px);
    border-color: rgba(16, 185, 129, 0.3);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
  }
  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    justify-content: center;
    align-items: center;
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
    color: #94a3b8;
    font-weight: 500;
    line-height: 1;
  }

  /* Filters */
  .filter-section {
    background: rgba(30, 41, 59, 0.6);
    backdrop-filter: blur(10px);
    padding: 1.5rem;
    border-radius: 20px;
    display: flex;
    gap: 1rem;
    align-items: center;
    flex-wrap: wrap;
    border: 1px solid rgba(255, 255, 255, 0.08);
    margin-bottom: 2rem;
    overflow: visible;

    /* ✅ เพิ่ม 2 บรรทัดนี้ */
    position: relative;
    z-index: 20;
  }

  .search-box {
    flex: 1;
    position: relative;
    min-width: 250px;
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
    padding: 0.75rem 1rem 0.75rem 2.75rem;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    color: #f8fafc;
    font-size: 0.9rem;
  }
  .search-input:focus {
    outline: none;
    border-color: #10b981;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
  }

  /* Dropdown Generic */
  .filter-dropdown {
    position: relative;
  }
  .filter-trigger {
    padding: 0.75rem 1rem;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    color: #f8fafc;
    display: flex;
    justify-content: space-between;
    align-items: center;
    min-width: 180px;
    cursor: pointer;
    gap: 0.5rem;
    transition: all 0.2s;
    font-size: 0.9rem;
  }
  .filter-trigger:hover {
    border-color: rgba(16, 185, 129, 0.4);
  }

  .filter-menu {
    position: absolute;
    top: calc(100% + 0.5rem);
    left: 0;
    background: #1e293b;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 0.5rem;
    min-width: 220px;
    max-height: 300px;
    overflow-y: auto;
    z-index: 2147483647;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    animation: slideDown 0.2s ease;
  }
  .filter-option {
    width: 100%;
    padding: 0.75rem 1rem;
    text-align: left;
    color: #f8fafc;
    background: transparent;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.2s;
    border-radius: 8px;
    font-size: 0.9rem;
  }
  .filter-option:hover {
    background: rgba(16, 185, 129, 0.1);
  }
  .filter-option.selected {
    background: rgba(16, 185, 129, 0.2);
    color: #10b981;
  }

  /* 🔥 Custom Snapshot Dropdown Styles */
  .snapshot-trigger {
    min-width: 280px;
    flex: 2;
  }
  .snapshot-menu {
    min-width: 350px;
    padding: 0;
    z-index: 2147483647;
  }

  .snapshot-item {
    display: flex;
    align-items: stretch;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    transition: background 0.2s;
  }
  .snapshot-item:last-child {
    border-bottom: none;
  }
  .snapshot-item:hover {
    background: rgba(255, 255, 255, 0.05);
  }
  .snapshot-item.selected {
    background: rgba(16, 185, 129, 0.1);
    border-left: 3px solid #10b981;
  }

  .snapshot-content {
    flex: 1;
    padding: 0.75rem 1rem;
    text-align: left;
    background: none;
    border: none;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .snap-date {
    color: #f8fafc;
    font-weight: 600;
    font-size: 0.9rem;
  }
  .snap-desc {
    color: #94a3b8;
    font-size: 0.8rem;
  }
  .snap-count {
    align-self: flex-start;
    margin-top: 4px;
    font-size: 0.7rem;
    padding: 2px 6px;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.1);
    color: #cbd5e1;
  }

  .snapshot-delete {
    padding: 0 1rem;
    color: #64748b;
    background: none;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .snapshot-delete:hover {
    color: #ef4444;
    background: rgba(239, 68, 68, 0.1);
  }

  .btn-reset-filter {
    background: rgba(100, 116, 139, 0.2);
    padding: 0.75rem 1.25rem;
    border-radius: 12px;
    color: #94a3b8;
    cursor: pointer;
    border: 1px solid rgba(100, 116, 139, 0.3);
    display: flex;
    gap: 0.5rem;
    align-items: center;
    font-weight: 600;
    font-size: 0.9rem;
    transition: all 0.2s;
  }
  .btn-reset-filter:hover {
    background: rgba(100, 116, 139, 0.3);
    border-color: #64748b;
  }

  /* Table */
  .table-wrapper {
    background: rgba(30, 41, 59, 0.6);
    backdrop-filter: blur(10px);
    border-radius: 20px;
    overflow-x: auto;
    border: 1px solid rgba(255, 255, 255, 0.08);
    margin-bottom: 2rem;
  }
  .logs-table {
    width: 100%;
    border-collapse: collapse;
  }
  .logs-table th {
    padding: 1rem;
    text-align: left;
    color: #94a3b8;
    font-weight: 600;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(15, 23, 42, 0.8);
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .logs-table td {
    padding: 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    color: #f8fafc;
    font-size: 0.9rem;
  }
  .logs-table tbody tr {
    transition: all 0.2s;
  }
  .logs-table tbody tr:hover {
    background: rgba(16, 185, 129, 0.05);
  }

  .index-badge {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.8rem;
    color: white;
  }
  .role-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.8rem;
    background: rgba(168, 85, 247, 0.2);
    color: #a855f7;
    border: 1px solid rgba(168, 85, 247, 0.3);
    display: inline-flex;
    font-weight: 600;
  }
  .role-badge.officer {
    background: rgba(59, 130, 246, 0.2);
    color: #3b82f6;
    border-color: rgba(59, 130, 246, 0.3);
  }
  .action-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.8rem;
    border: 1px solid;
    display: inline-flex;
    font-weight: 600;
  }
  .action-badge svg,
  .log-action-badge svg {
    width: 14px;
    height: 14px;
    margin-right: 6px;
    vertical-align: middle;
  }
  .btn-detail {
    background: rgba(59, 130, 246, 0.1);
    border: 1px solid rgba(59, 130, 246, 0.2);
    color: #3b82f6;
    padding: 0.5rem;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }
  .btn-detail:hover {
    background: rgba(59, 130, 246, 0.2);
    border-color: #3b82f6;
    transform: scale(1.05);
  }

  .name-cell {
    font-weight: 600;
    color: #f8fafc;
  }
  .email-cell {
    color: #94a3b8;
    font-size: 0.85rem;
  }
  .nisit-cell {
    font-family: "Courier New", monospace;
    color: #10b981;
    font-weight: 600;
  }
  .date-cell,
  .time-cell {
    color: #94a3b8;
    font-size: 0.85rem;
  }

  /* Pagination */
  .pagination-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }
  .pagination-controls {
    display: flex;
    gap: 1rem;
    align-items: center;
  }
  .page-btn {
    width: 40px;
    height: 40px;
    background: rgba(30, 41, 59, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    display: flex;
    justify-content: center;
    align-items: center;
    color: #f8fafc;
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
    z-index: 2147483647;
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

  .action-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.375rem 0.75rem;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: 600;
    white-space: nowrap;
    border: 1px solid transparent;
    gap: 0.375rem;
  }
  .page-indicator-box .sep {
    color: #64748b;
  }
  .page-dropdown-list {
    position: absolute;
    top: 100%;
    left: 0;
    transform: none;
    background: #1e293b;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 0; /* remove inner padding so options fill exactly */
    max-height: 240px;
    overflow-y: auto;
    margin-top: 0.5rem;
    min-width: 100%;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    z-index: 200000; /* ensure dropdowns appear above other content */
    animation: slideDown 0.12s ease;
  }
  .page-option {
    display: block;
    box-sizing: border-box;
    width: 100%;
    padding: 0.625rem 1rem;
    background: transparent;
    border: none;
    color: #f8fafc;
    cursor: pointer;
    text-align: left;
    font-size: 0.95rem;
    border-radius: 0; /* corners handled on first/last child */
    transition:
      background 0.12s,
      color 0.12s;
  }
  .page-option:hover {
    background: rgba(16, 185, 129, 0.06);
  }
  .page-option.active {
    background: rgba(16, 185, 129, 0.12);
    color: #10b981;
    font-weight: 700;
    box-shadow: inset 0 0 0 1px rgba(16, 185, 129, 0.18);
  }
  .page-option:first-child {
    border-top-left-radius: 12px;
    border-top-right-radius: 12px;
  }
  .page-option:last-child {
    border-bottom-left-radius: 12px;
    border-bottom-right-radius: 12px;
  }
  .showing-text {
    font-size: 0.9rem;
    color: #94a3b8;
  }

  /* Misc */
  .chevron {
    transition: transform 0.2s;
  }
  .chevron.rotated {
    transform: rotate(180deg);
  }
  .click-outside {
    position: fixed;
    inset: 0;
    z-index: 199999;
  }

  /* Modal */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(8px);
    z-index: 9999;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 1rem;
    animation: fadeIn 0.2s;
  }
  .detail-modal {
    background: #1e293b;
    width: 100%;
    max-width: 900px;
    max-height: 90vh;
    border-radius: 24px;
    display: flex;
    flex-direction: column;
    border: 1px solid rgba(255, 255, 255, 0.1);
    animation: slideUp 0.3s;
    overflow: hidden;
  }
  .detail-modal-header {
    padding: 1.5rem 2rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(15, 23, 42, 0.8);
  }
  .detail-modal-header h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
    color: #f8fafc;
    display: flex;
    gap: 0.75rem;
    align-items: center;
  }
  .modal-close-btn {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.2);
    color: #ef4444;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    transition: all 0.2s;
  }
  .modal-close-btn:hover {
    background: rgba(239, 68, 68, 0.2);
    border-color: #ef4444;
    transform: rotate(90deg);
  }
  .detail-modal-body {
    padding: 2rem;
    overflow-y: auto;
    flex: 1;
  }

  .user-info-section {
    display: flex;
    gap: 1.5rem;
    background: rgba(30, 41, 59, 0.6);
    padding: 1.5rem;
    border-radius: 16px;
    margin-bottom: 1.5rem;
    border: 1px solid rgba(255, 255, 255, 0.08);
    align-items: center;
  }
  .user-avatar {
    width: 80px;
    height: 80px;
    background: linear-gradient(135deg, #10b981, #059669);
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-shrink: 0;
    color: white;
  }
  .user-details {
    flex: 1;
  }
  .user-details h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.5rem;
    font-weight: 700;
    color: #f8fafc;
  }
  .user-email {
    font-size: 0.9rem;
    color: #94a3b8;
    margin: 0 0 0.25rem 0;
  }
  .user-nisit {
    font-family: "Courier New", monospace;
    color: #10b981;
    font-weight: 600;
    margin: 0 0 0.75rem 0;
    font-size: 1rem;
  }
  .user-role-badge {
    display: inline-flex;
    padding: 0.375rem 0.75rem;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: 600;
    background: rgba(168, 85, 247, 0.2);
    border: 1px solid rgba(168, 85, 247, 0.3);
    color: #a855f7;
  }
  .user-role-badge.officer {
    background: rgba(59, 130, 246, 0.2);
    border-color: rgba(59, 130, 246, 0.3);
    color: #3b82f6;
  }

  .summary-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    margin-bottom: 2rem;
  }
  .summary-stat {
    background: rgba(30, 41, 59, 0.6);
    padding: 1.25rem;
    border-radius: 16px;
    display: flex;
    gap: 1rem;
    border: 1px solid rgba(255, 255, 255, 0.08);
    align-items: center;
  }
  .summary-stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-shrink: 0;
  }
  .summary-stat-info {
    flex: 1;
  }
  .summary-stat-value {
    font-size: 1.75rem;
    font-weight: 700;
    color: #f8fafc;
    line-height: 1;
    margin-bottom: 0.25rem;
  }
  .summary-stat-label {
    font-size: 0.8rem;
    color: #94a3b8;
  }

  .participation-history-section {
    background: rgba(30, 41, 59, 0.6);
    padding: 1.5rem;
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.08);
  }
  .section-title {
    font-size: 1.125rem;
    font-weight: 700;
    color: #f8fafc;
    margin: 0 0 1.5rem 0;
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }
  .history-timeline {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .day-group {
    background: rgba(15, 23, 42, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 1rem;
  }
  .day-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    padding-bottom: 0.75rem;
    margin-bottom: 1rem;
  }
  .day-date {
    font-size: 0.95rem;
    font-weight: 600;
    color: #f8fafc;
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }
  .day-status-badge {
    padding: 0.375rem 0.75rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
    border: 1px solid;
  }

  .day-logs {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }
  .log-item {
    background: rgba(30, 41, 59, 0.4);
    padding: 0.75rem;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }
  .log-time {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.85rem;
    color: #94a3b8;
    font-weight: 600;
  }
  .log-action-badge {
    padding: 0.375rem 0.75rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
    border: 1px solid;
  }
  .log-distance {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.85rem;
    color: #10b981;
    font-weight: 600;
  }
  .btn-view-proof {
    margin-left: auto;
    padding: 0.375rem 0.75rem;
    background: rgba(59, 130, 246, 0.1);
    border: 1px solid rgba(59, 130, 246, 0.2);
    border-radius: 8px;
    color: #3b82f6;
    font-size: 0.8rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.375rem;
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn-view-proof:hover {
    background: rgba(59, 130, 246, 0.2);
    border-color: #3b82f6;
  }
  /* .day-summary removed (unused) */

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
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
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 768px) {
    .detail-modal {
      max-width: 100%;
      max-height: 95vh;
      border-radius: 16px;
    }
    .summary-stats {
      grid-template-columns: 1fr;
    }
    .user-info-section {
      flex-direction: column;
      text-align: center;
    }
    .log-item {
      flex-direction: column;
      align-items: flex-start;
    }
    .btn-view-proof {
      margin-left: 0;
      width: 100%;
    }
    .events-view,
    .logs-view {
      padding: 1rem;
    }
    /* .page-header h1 removed (unused) */
    .events-grid {
      grid-template-columns: 1fr;
    }
    .logs-header {
      flex-direction: column;
      align-items: stretch;
    }
    .header-actions {
      width: 100%;
      flex-wrap: wrap;
    }
    .stats-dashboard {
      grid-template-columns: repeat(2, 1fr);
    }
    .filter-section {
      flex-direction: column;
      align-items: stretch;
    }
    .search-box,
    .filter-dropdown,
    .btn-reset-filter {
      width: 100%;
    }
    .table-wrapper {
      overflow-x: auto;
    }
    .logs-table {
      min-width: 900px;
    }
  }
  @media (max-width: 640px) {
    .stats-dashboard {
      grid-template-columns: 1fr;
    }
    .header-info h1 {
      font-size: 1.5rem;
    }
  }
  @media (max-width: 1024px) {
    .stats-dashboard {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  /* ==================== SCROLLABLE LOGS CONTENT ==================== */
  .logs-content {
    max-height: 65vh;
    overflow-y: auto;
    /* background: rgba(30, 41, 59, 0.4); Removed background */
    border-radius: 16px;
    padding: 1rem;
  }

  .logs-content::-webkit-scrollbar {
    width: 8px;
  }

  .logs-content::-webkit-scrollbar-track {
    background: rgba(15, 23, 42, 0.4);
    border-radius: 10px;
  }

  .logs-content::-webkit-scrollbar-thumb {
    background: rgba(100, 116, 139, 0.6);
    border-radius: 10px;
  }

  .logs-content::-webkit-scrollbar-thumb:hover {
    background: rgba(148, 163, 184, 0.8);
  }

  .logs-table thead {
    position: sticky;
    top: 0;
    z-index: 10;
    background: #1e293b;
  }

  .logs-table thead th {
    background: #1e293b;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
</style>
