// Logs Store - Centralized state management for Activity Logs
import { writable, derived, get } from "svelte/store";
import { api, API_BASE_URL, getAuthHeaders } from "$lib/api/axiosConfig";
import type { Log, LogsData, LogsStatistics, EventStats, AppEvent } from "$lib/types/organizer";
import axios from "axios";

// ==========================================
// 🎯 ACTION & STATUS TYPES CONFIG
// ==========================================

export const actionTypes = [
  {
    value: "registration",
    label: "Joined",
    labelTh: "ลงทะเบียน",
    icon: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z",
    color: "#3b82f6",
  },
  {
    value: "check_in",
    label: "Checked In",
    labelTh: "เช็คอิน",
    icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    color: "#06b6d4",
  },
  {
    value: "reward_unlocked",
    label: "Completed",
    labelTh: "สำเร็จ",
    icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    color: "#10b981",
  },
  {
    value: "registration_cancelled",
    label: "Cancelled",
    labelTh: "ยกเลิก",
    icon: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z",
    color: "#64748b",
  },
  {
    value: "no_show",
    label: "Rejected",
    labelTh: "ถูกปฏิเสธ",
    icon: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z",
    color: "#ef4444",
  },
];

export const statusTypes = [
  { value: "All", label: "All Status", labelTh: "ทั้งหมด", color: "#64748b" },
  { value: "success", label: "Success", labelTh: "สำเร็จ", color: "#10b981" },
  { value: "failed", label: "Failed", labelTh: "ล้มเหลว", color: "#ef4444" },
  { value: "pending", label: "Pending", labelTh: "รอดำเนินการ", color: "#f59e0b" },
  { value: "warning", label: "Warning", labelTh: "คำเตือน", color: "#f97316" },
];

// ==========================================
// 🗄️ INITIAL STATE
// ==========================================

const initialLogsData: LogsData = {
  selectedEvent: null,
  logs: [],
  loading: false,
  error: "",
  searchQuery: "",
  selectedAction: "",
  selectedStatus: "",
  dateFrom: "",
  dateTo: "",
  currentPage: 1,
  itemsPerPage: 10,
  totalItems: 0,
  totalPages: 0,
  actionDropdownOpen: false,
  statusDropdownOpen: false,
  dateFromDropdownOpen: false,
  dateToDropdownOpen: false,
  showDetailModal: false,
  selectedLog: null,
  statistics: {
    totalLogs: 0,
    uniqueUsers: 0,
    successRate: 0,
    topAction: "-",
    totalRegistrations: 0,
    totalCheckIns: 0,
    totalRewards: 0,
    totalCancelled: 0,
  },
  eventStats: {
    total: 0,
    by_status: {},
    by_role: { officer: 0, student: 0 },
  },
};

// ==========================================
// 📦 STORES
// ==========================================

export const logsData = writable<LogsData>(initialLogsData);
export const filteredLogs = writable<Log[]>([]);
export const logsListPage = writable<number>(1);
export const logsListPerPage = writable<number>(10);
export const logsNisitYearFilter = writable<string>("");
export const logsNisitIdFilter = writable<string>("");

// ==========================================
// 📊 DERIVED STORES
// ==========================================

export const isAnyLogsFilterActive = derived(
  [logsData, logsNisitYearFilter, logsNisitIdFilter],
  ([$logsData, $logsNisitYearFilter, $logsNisitIdFilter]) => {
    return !!(
      $logsData.searchQuery?.trim() ||
      $logsData.selectedAction?.trim() ||
      $logsData.selectedStatus?.trim() ||
      $logsData.dateFrom ||
      $logsData.dateTo ||
      $logsNisitYearFilter?.trim() ||
      $logsNisitIdFilter?.trim()
    );
  }
);

export const logsToDisplay = derived(
  [isAnyLogsFilterActive, filteredLogs, logsData],
  ([$isAnyLogsFilterActive, $filteredLogs, $logsData]) => {
    return $isAnyLogsFilterActive ? $filteredLogs : $logsData.logs;
  }
);

export const paginatedLogs = derived(
  [logsToDisplay, logsListPage, logsListPerPage],
  ([$logsToDisplay, $logsListPage, $logsListPerPage]) => {
    return $logsToDisplay.slice(
      ($logsListPage - 1) * $logsListPerPage,
      $logsListPage * $logsListPerPage
    );
  }
);

// ==========================================
// 🛠️ HELPER FUNCTIONS
// ==========================================

export function getActionConfig(action: string) {
  return actionTypes.find((a) => a.value === action) || actionTypes[0];
}

export function getStatusConfig(status: string) {
  return statusTypes.find((s) => s.value === status) || statusTypes[0];
}

export function getActionLabel(actionValue: string, language: string = "en"): string {
  const action = actionTypes.find((a) => a.value === actionValue);
  if (!action) return actionValue;
  return language === "th" ? (action.labelTh || action.label) : action.label;
}

export function getLogStatusLabel(statusValue: string, language: string = "en"): string {
  const status = statusTypes.find((s) => s.value === statusValue);
  if (!status) return statusValue;
  return language === "th" ? (status.labelTh || status.label) : status.label;
}

// ==========================================
// 📝 ACTIONS
// ==========================================

export async function selectEventForLogs(event: AppEvent) {
  logsData.update((data) => ({
    ...data,
    selectedEvent: event,
    loading: true,
    error: "",
    searchQuery: "",
    selectedAction: "",
    selectedStatus: "",
    dateFrom: "",
    dateTo: "",
  }));

  try {
    await fetchLogs();
    const currentData = get(logsData);
    filteredLogs.set([...currentData.logs]);
  } catch (err: any) {
    logsData.update((data) => ({
      ...data,
      error: err.message,
    }));
  } finally {
    logsData.update((data) => ({
      ...data,
      loading: false,
    }));
  }
}

export function backToEventsList() {
  logsData.set(initialLogsData);
  filteredLogs.set([]);
  logsListPage.set(1);
  logsNisitYearFilter.set("");
  logsNisitIdFilter.set("");
}

export async function fetchLogs(isBackground = false) {
  const currentData = get(logsData);
  
  if (!isBackground) {
    logsData.update((data) => ({
      ...data,
      loading: true,
      error: "",
    }));
  }

  const eventId = currentData.selectedEvent?.id;
  if (!eventId) {
    if (!isBackground) {
      logsData.update((data) => ({
        ...data,
        loading: false,
      }));
    }
    return;
  }

  try {
    const token = localStorage.getItem("access_token");
    if (!token) throw new Error("No access token found");

    const axiosHeaders = getAuthHeaders();

    // Fetch participants
    const participantsUrl = `${API_BASE_URL}/api/events/${eventId}/participants`;
    const participantsResponse = await axios.get(participantsUrl, { headers: axiosHeaders });

    let participants: any[] = [];
    if (Array.isArray(participantsResponse.data)) {
      participants = participantsResponse.data;
    } else if (participantsResponse.data?.participants) {
      participants = participantsResponse.data.participants;
    } else if (participantsResponse.data?.data) {
      participants = participantsResponse.data.data;
    }

    // Fetch users for nisit_id
    let usersMap: Map<number, any> = new Map();
    try {
      const usersResponse = await axios.get(`${API_BASE_URL}/api/users/`, { headers: axiosHeaders });
      let usersData: any[] = [];
      if (Array.isArray(usersResponse.data)) {
        usersData = usersResponse.data;
      } else if (usersResponse.data?.users) {
        usersData = usersResponse.data.users;
      }
      usersData.forEach((user: any) => {
        usersMap.set(user.id, user);
      });
    } catch {
      console.warn("Could not fetch users");
    }

    // Fetch participations for proof images
    let userParticipationsMap: Map<number, any> = new Map();
    for (const p of participants) {
      try {
        const userParticipationsRes = await axios.get(
          `${API_BASE_URL}/api/participations/user/${p.user_id}`,
          { headers: axiosHeaders }
        );
        let userParticipations: any[] = Array.isArray(userParticipationsRes.data)
          ? userParticipationsRes.data
          : userParticipationsRes.data?.participations || [];

        const matchingParticipation = userParticipations.find(
          (part: any) => part.event_id === eventId || part.event_id === Number(eventId)
        );
        if (matchingParticipation) {
          userParticipationsMap.set(p.user_id, matchingParticipation);
        }
      } catch {
        // Ignore errors for individual users
      }
    }

    // Map participants to logs
    const eventTitleStr = currentData.selectedEvent?.title || "";
    const logs: Log[] = participants.map((p: any, idx: number) => {
      const userParticipation = userParticipationsMap.get(p.user_id);
      const participationId = userParticipation?.id || p.participation_id || p.id;
      
      let rawProofUrl = userParticipation?.proof_image_url || p.proof_image_url || null;
      if (rawProofUrl && rawProofUrl.includes("/uploads/") && !rawProofUrl.includes("/api/uploads/")) {
        rawProofUrl = rawProofUrl.replace("/uploads/", "/api/uploads/");
      }
      const proofImageUrl = rawProofUrl
        ? rawProofUrl.startsWith("http") ? rawProofUrl : `${API_BASE_URL}${rawProofUrl}`
        : null;

      const userDetails = usersMap.get(p.user_id);
      const nisitId = p.nisit_id || p.student_id || userDetails?.nisit_id || userDetails?.student_id || "";
      const stravaLink = userParticipation?.strava_link || p.strava_link || null;
      const actualDistance = userParticipation?.actual_distance_km || p.actual_distance_km || 0;

      return {
        id: String(participationId || p.user_id || `log_${idx}`),
        eventId: String(eventId),
        eventTitle: eventTitleStr,
        userId: String(p.user_id || ""),
        userName: `${p.first_name || ""} ${p.last_name || ""}`.trim() || `User ${p.user_id}`,
        userEmail: p.email || "",
        userAvatar: (p.first_name?.[0] || "U").toUpperCase(),
        userNisitId: nisitId,
        participationId: participationId,
        action:
          p.status === "completed" || p.status === "proof_submitted"
            ? "reward_unlocked"
            : p.status === "checked_in"
              ? "check_in"
              : "registration",
        timestamp: p.joined_at || p.created_at || new Date().toISOString(),
        status: "success",
        proofImage: proofImageUrl,
        metadata: {
          role: p.role || "student",
          participationStatus: p.status || "joined",
          joinedAt: p.joined_at,
          checkedInAt: p.checked_in_at || userParticipation?.checked_in_at,
          completedAt: p.completed_at || userParticipation?.completed_at,
          cancelledAt: p.cancelled_at || userParticipation?.cancelled_at,
          distance_covered: actualDistance,
          actual_distance_km: actualDistance,
          checkin_count: p.checkin_count || 0,
          proof_image_url: proofImageUrl,
          proof_submitted_at: userParticipation?.proof_submitted_at || p.proof_submitted_at,
          strava_link: stravaLink,
        },
      };
    });

    // Calculate statistics
    const statistics = calculateLogsStatistics(logs);

    logsData.update((data) => ({
      ...data,
      logs,
      statistics,
      eventStats: {
        total: logs.length,
        by_status: calculateByStatus(logs),
        by_role: calculateByRole(logs),
      },
    }));

    filteredLogs.set([...logs]);
  } catch (error: any) {
    console.error("Error fetching logs:", error);
    logsData.update((data) => ({
      ...data,
      error: `Failed to load participants: ${error.message}`,
      logs: [],
    }));
    filteredLogs.set([]);
  } finally {
    logsData.update((data) => ({
      ...data,
      loading: false,
    }));
  }
}

function calculateLogsStatistics(logs: Log[]): LogsStatistics {
  const totalLogs = logs.length;
  const uniqueUsers = new Set(logs.map((l) => l.userId)).size;
  const successRate =
    logs.length > 0
      ? (logs.filter((l) => l.status === "success").length / logs.length) * 100
      : 0;

  const totalRegistrations = logs.filter((l) => l.action === "registration").length;
  const totalCheckIns = logs.filter((l) => l.action === "check_in").length;
  const totalRewards = logs.filter((l) => l.action === "reward_unlocked").length;
  const totalCancelled = logs.filter((l) => l.action === "registration_cancelled").length;

  const actionCounts = logs.reduce((acc, log) => {
    acc[log.action] = (acc[log.action] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topAction =
    Object.keys(actionCounts).length > 0
      ? Object.entries(actionCounts).sort((a, b) => b[1] - a[1])[0][0]
      : "none";

  return {
    totalLogs,
    uniqueUsers,
    successRate,
    topAction,
    totalRegistrations,
    totalCheckIns,
    totalRewards,
    totalCancelled,
  };
}

function calculateByStatus(logs: Log[]): Record<string, number> {
  const byStatus: Record<string, number> = {};
  logs.forEach((log) => {
    const status = log.metadata?.participationStatus || "unknown";
    byStatus[status] = (byStatus[status] || 0) + 1;
  });
  return byStatus;
}

function calculateByRole(logs: Log[]): { officer: number; student: number } {
  return {
    officer: logs.filter((l) => l.metadata?.role === "officer").length,
    student: logs.filter((l) => l.metadata?.role === "student").length,
  };
}

export function applyLogsFilters() {
  const currentData = get(logsData);
  const nisitYearFilter = get(logsNisitYearFilter);
  const nisitIdFilter = get(logsNisitIdFilter);
  
  let filtered: Log[] = [...currentData.logs];

  // Search query filter
  if (currentData.searchQuery?.trim()) {
    const query = currentData.searchQuery.toLowerCase().trim();
    filtered = filtered.filter(
      (log) =>
        log.userName.toLowerCase().includes(query) ||
        log.userEmail.toLowerCase().includes(query) ||
        (log.userNisitId && log.userNisitId.includes(query))
    );
  }

  // Nisit year filter
  if (nisitYearFilter?.trim()) {
    filtered = filtered.filter(
      (log) => log.userNisitId && log.userNisitId.startsWith(nisitYearFilter)
    );
  }

  // Nisit ID filter
  if (nisitIdFilter?.trim()) {
    filtered = filtered.filter(
      (log) => log.userNisitId && log.userNisitId.slice(-6).includes(nisitIdFilter)
    );
  }

  // Action filter
  if (currentData.selectedAction && currentData.selectedAction !== "" && currentData.selectedAction !== "All") {
    const actionMap: Record<string, string> = {
      officer: "officer",
      student: "student",
      registration: "registration",
      check_in: "check_in",
      reward_unlocked: "reward_unlocked",
      no_show: "no_show",
      registration_cancelled: "registration_cancelled",
    };
    const targetAction = actionMap[currentData.selectedAction];

    if (targetAction === "officer") {
      filtered = filtered.filter((log) => log.metadata?.role === "officer");
    } else if (targetAction === "student") {
      filtered = filtered.filter((log) => log.metadata?.role === "student");
    } else if (targetAction) {
      filtered = filtered.filter((log) => log.action === targetAction);
    }
  }

  // Date range filters
  if (currentData.dateFrom) {
    filtered = filtered.filter((log) => {
      const logDate = new Date(log.timestamp);
      const fromDate = new Date(currentData.dateFrom);
      return logDate >= fromDate;
    });
  }

  if (currentData.dateTo) {
    filtered = filtered.filter((log) => {
      const logDate = new Date(log.timestamp);
      const toDate = new Date(currentData.dateTo);
      toDate.setHours(23, 59, 59, 999);
      return logDate <= toDate;
    });
  }

  filteredLogs.set(filtered);
  logsData.update((data) => ({
    ...data,
    totalItems: filtered.length,
    totalPages: Math.ceil(filtered.length / data.itemsPerPage),
    currentPage: 1,
  }));
  logsListPage.set(1);
}

export function resetLogsFilters() {
  logsData.update((data) => ({
    ...data,
    searchQuery: "",
    selectedAction: "",
    selectedStatus: "",
    dateFrom: "",
    dateTo: "",
    actionDropdownOpen: false,
    statusDropdownOpen: false,
    dateFromDropdownOpen: false,
    dateToDropdownOpen: false,
    currentPage: 1,
  }));
  logsNisitYearFilter.set("");
  logsNisitIdFilter.set("");
  
  const currentData = get(logsData);
  filteredLogs.set([...currentData.logs]);
  logsData.update((data) => ({
    ...data,
    totalItems: data.logs.length,
    totalPages: Math.ceil(data.logs.length / data.itemsPerPage),
  }));
}

export function openLogDetailModal(log: Log) {
  logsData.update((data) => ({
    ...data,
    selectedLog: log,
    showDetailModal: true,
  }));
}

export function closeLogDetailModal() {
  logsData.update((data) => ({
    ...data,
    showDetailModal: false,
    selectedLog: null,
  }));
}

export default {
  logsData,
  filteredLogs,
  logsListPage,
  logsListPerPage,
  logsNisitYearFilter,
  logsNisitIdFilter,
  isAnyLogsFilterActive,
  logsToDisplay,
  paginatedLogs,
  actionTypes,
  statusTypes,
  getActionConfig,
  getStatusConfig,
  getActionLabel,
  getLogStatusLabel,
  selectEventForLogs,
  backToEventsList,
  fetchLogs,
  applyLogsFilters,
  resetLogsFilters,
  openLogDetailModal,
  closeLogDetailModal,
};
