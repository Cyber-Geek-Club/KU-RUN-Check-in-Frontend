// Verify Proof Store - State management for proof verification
import { writable, derived, get } from "svelte/store";
import { api, API_BASE_URL, getAuthHeaders } from "$lib/api/axiosConfig";
import type { ProofSubmission, VerifyProofData, AppEvent } from "$lib/types/organizer";
import axios from "axios";

// ==========================================
// 🗄️ INITIAL STATE
// ==========================================

const initialVerifyProofData: VerifyProofData = {
  selectedEvent: null,
  submissions: [],
  loading: false,
  error: "",
  searchQuery: "",
  filterStatus: "",
  autoRefresh: false,
  refreshInterval: null,
};

// ==========================================
// 📦 STORES
// ==========================================

export const verifyProofData = writable<VerifyProofData>(initialVerifyProofData);
export const verifyProofEventsPage = writable<number>(1);
export const verifyProofSubmissionsPage = writable<number>(1);
export const verifyProofPerPage = writable<number>(10);
export const verifyProofSearchQuery = writable<string>("");
export const verifyProofStatusFilter = writable<string>("");

// Auto-refresh interval handle
let autoRefreshInterval: ReturnType<typeof setInterval> | null = null;

// ==========================================
// 📊 DERIVED STORES
// ==========================================

export const filteredVerifyProofSubmissions = derived(
  [verifyProofData, verifyProofSearchQuery, verifyProofStatusFilter],
  ([$verifyProofData, $searchQuery, $statusFilter]) => {
    let filtered = [...$verifyProofData.submissions];

    // Search filter
    if ($searchQuery?.trim()) {
      const query = $searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (sub) =>
          sub.userName.toLowerCase().includes(query) ||
          sub.userEmail.toLowerCase().includes(query) ||
          sub.nisitId?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if ($statusFilter && $statusFilter !== "all") {
      filtered = filtered.filter((sub) => sub.status === $statusFilter);
    }

    return filtered;
  }
);

export const paginatedSubmissions = derived(
  [filteredVerifyProofSubmissions, verifyProofSubmissionsPage, verifyProofPerPage],
  ([$filtered, $page, $perPage]) => {
    return $filtered.slice(($page - 1) * $perPage, $page * $perPage);
  }
);

export const pendingCount = derived(verifyProofData, ($data) => {
  return $data.submissions.filter((s) => s.status === "pending" || s.status === "proof_submitted").length;
});

export const approvedCount = derived(verifyProofData, ($data) => {
  return $data.submissions.filter((s) => s.status === "approved" || s.status === "completed").length;
});

export const rejectedCount = derived(verifyProofData, ($data) => {
  return $data.submissions.filter((s) => s.status === "rejected").length;
});

// ==========================================
// 📝 ACTIONS
// ==========================================

export function selectEventForVerifyProof(event: AppEvent) {
  verifyProofData.update((data) => ({
    ...data,
    selectedEvent: event,
    loading: true,
    error: "",
    submissions: [],
  }));
  
  verifyProofSearchQuery.set("");
  verifyProofStatusFilter.set("");
  verifyProofSubmissionsPage.set(1);

  fetchPendingSubmissions(event.id);
}

export function backToVerifyProofEventsList() {
  stopAutoRefresh();
  verifyProofData.set(initialVerifyProofData);
  verifyProofEventsPage.set(1);
  verifyProofSubmissionsPage.set(1);
  verifyProofSearchQuery.set("");
  verifyProofStatusFilter.set("");
}

export async function fetchPendingSubmissions(eventId: number) {
  verifyProofData.update((data) => ({
    ...data,
    loading: true,
    error: "",
  }));

  try {
    const token = localStorage.getItem("access_token");
    if (!token) throw new Error("No access token found");

    const axiosHeaders = getAuthHeaders();
    const currentData = get(verifyProofData);

    // Fetch all participations for this event
    const participationsUrl = `${API_BASE_URL}/api/events/${eventId}/participants`;
    const response = await axios.get(participationsUrl, { headers: axiosHeaders });

    let participants: any[] = [];
    if (Array.isArray(response.data)) {
      participants = response.data;
    } else if (response.data?.participants) {
      participants = response.data.participants;
    } else if (response.data?.data) {
      participants = response.data.data;
    }

    // Fetch detailed participations for each user to get proof images
    const submissions: ProofSubmission[] = [];

    for (const p of participants) {
      // Only include those with proof submitted or pending verification
      if (p.status === "proof_submitted" || p.status === "pending" || p.proof_image_url) {
        try {
          // Fetch user's participation details
          const userParticipationsRes = await axios.get(
            `${API_BASE_URL}/api/participations/user/${p.user_id}`,
            { headers: axiosHeaders }
          );

          const userParticipations = Array.isArray(userParticipationsRes.data)
            ? userParticipationsRes.data
            : userParticipationsRes.data?.participations || [];

          const matchingParticipation = userParticipations.find(
            (part: any) => part.event_id === eventId || part.event_id === Number(eventId)
          );

          if (matchingParticipation) {
            let proofImageUrl = matchingParticipation.proof_image_url || p.proof_image_url || null;
            
            // Convert relative URL to full URL
            if (proofImageUrl && proofImageUrl.includes("/uploads/") && !proofImageUrl.includes("/api/uploads/")) {
              proofImageUrl = proofImageUrl.replace("/uploads/", "/api/uploads/");
            }
            if (proofImageUrl && !proofImageUrl.startsWith("http")) {
              proofImageUrl = `${API_BASE_URL}${proofImageUrl}`;
            }

            submissions.push({
              id: matchingParticipation.id || p.id,
              participationId: matchingParticipation.id,
              userId: p.user_id,
              userName: `${p.first_name || ""} ${p.last_name || ""}`.trim() || `User ${p.user_id}`,
              userEmail: p.email || "",
              userAvatar: (p.first_name?.[0] || "U").toUpperCase(),
              nisitId: p.nisit_id || p.student_id || "",
              eventId: eventId,
              eventTitle: currentData.selectedEvent?.title || "",
              proofImage: proofImageUrl,
              stravaLink: matchingParticipation.strava_link || p.strava_link || null,
              distance: matchingParticipation.actual_distance_km || p.actual_distance_km || 0,
              status: matchingParticipation.status || p.status || "pending",
              submittedAt: matchingParticipation.proof_submitted_at || p.created_at || new Date().toISOString(),
              verifiedAt: matchingParticipation.verified_at,
              verifiedBy: matchingParticipation.verified_by,
              rejectionReason: matchingParticipation.rejection_reason,
            });
          }
        } catch (err: any) {
          console.warn(`Could not fetch participation for user ${p.user_id}:`, err.message);
        }
      }
    }

    // Sort by submitted date (newest first)
    submissions.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

    verifyProofData.update((data) => ({
      ...data,
      submissions,
      loading: false,
    }));
  } catch (error: any) {
    console.error("Error fetching pending submissions:", error);
    verifyProofData.update((data) => ({
      ...data,
      error: `Failed to load submissions: ${error.message}`,
      submissions: [],
      loading: false,
    }));
  }
}

export async function approveSubmission(submission: ProofSubmission): Promise<{ success: boolean; message: string }> {
  try {
    const axiosHeaders = getAuthHeaders();
    
    // Update participation status to completed/approved
    await axios.put(
      `${API_BASE_URL}/api/participations/${submission.participationId}/verify`,
      {
        status: "completed",
        verified: true,
      },
      { headers: axiosHeaders }
    );

    // Update local state
    verifyProofData.update((data) => ({
      ...data,
      submissions: data.submissions.map((s) =>
        s.id === submission.id ? { ...s, status: "completed", verifiedAt: new Date().toISOString() } : s
      ),
    }));

    return { success: true, message: "Submission approved successfully" };
  } catch (error: any) {
    console.error("Error approving submission:", error);
    return { success: false, message: error.response?.data?.detail || error.message };
  }
}

export async function rejectSubmission(
  submission: ProofSubmission,
  reason: string
): Promise<{ success: boolean; message: string }> {
  try {
    const axiosHeaders = getAuthHeaders();

    // Update participation status to rejected
    await axios.put(
      `${API_BASE_URL}/api/participations/${submission.participationId}/verify`,
      {
        status: "rejected",
        verified: false,
        rejection_reason: reason,
      },
      { headers: axiosHeaders }
    );

    // Update local state
    verifyProofData.update((data) => ({
      ...data,
      submissions: data.submissions.map((s) =>
        s.id === submission.id
          ? { ...s, status: "rejected", rejectionReason: reason, verifiedAt: new Date().toISOString() }
          : s
      ),
    }));

    return { success: true, message: "Submission rejected" };
  } catch (error: any) {
    console.error("Error rejecting submission:", error);
    return { success: false, message: error.response?.data?.detail || error.message };
  }
}

export function toggleVerifyProofAutoRefresh() {
  const currentData = get(verifyProofData);
  
  if (currentData.autoRefresh) {
    stopAutoRefresh();
  } else {
    startAutoRefresh();
  }
}

function startAutoRefresh() {
  const currentData = get(verifyProofData);
  
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
  }

  verifyProofData.update((data) => ({
    ...data,
    autoRefresh: true,
  }));

  // Refresh every 30 seconds
  autoRefreshInterval = setInterval(() => {
    const data = get(verifyProofData);
    if (data.selectedEvent) {
      fetchPendingSubmissions(data.selectedEvent.id);
    }
  }, 30000);
}

function stopAutoRefresh() {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
    autoRefreshInterval = null;
  }

  verifyProofData.update((data) => ({
    ...data,
    autoRefresh: false,
  }));
}

export function refreshVerifyProofSubmissions() {
  const currentData = get(verifyProofData);
  if (currentData.selectedEvent) {
    fetchPendingSubmissions(currentData.selectedEvent.id);
  }
}

export function nextVerifyProofSubmissionsPage() {
  verifyProofSubmissionsPage.update((n) => n + 1);
}

export function prevVerifyProofSubmissionsPage() {
  verifyProofSubmissionsPage.update((n) => Math.max(n - 1, 1));
}

export function nextVerifyProofEventsPage() {
  verifyProofEventsPage.update((n) => n + 1);
}

export function prevVerifyProofEventsPage() {
  verifyProofEventsPage.update((n) => Math.max(n - 1, 1));
}

export default {
  verifyProofData,
  verifyProofEventsPage,
  verifyProofSubmissionsPage,
  verifyProofPerPage,
  verifyProofSearchQuery,
  verifyProofStatusFilter,
  filteredVerifyProofSubmissions,
  paginatedSubmissions,
  pendingCount,
  approvedCount,
  rejectedCount,
  selectEventForVerifyProof,
  backToVerifyProofEventsList,
  fetchPendingSubmissions,
  approveSubmission,
  rejectSubmission,
  toggleVerifyProofAutoRefresh,
  refreshVerifyProofSubmissions,
  nextVerifyProofSubmissionsPage,
  prevVerifyProofSubmissionsPage,
  nextVerifyProofEventsPage,
  prevVerifyProofEventsPage,
};
