// Reward Store - Centralized state management for Reward Management
import { writable, derived, get } from "svelte/store";
import { api, API_BASE_URL, getAuthHeaders } from "$lib/api/axiosConfig";
import type { RewardUser, RewardData, AppEvent } from "$lib/types/organizer";
import axios from "axios";

// ==========================================
// 🎨 TIER COLORS & ICONS
// ==========================================

export const tierConfig = {
  gold: { icon: "🥇", color: "#fbbf24", gradient: "from-yellow-400 to-amber-500" },
  silver: { icon: "🥈", color: "#9ca3af", gradient: "from-gray-300 to-gray-400" },
  bronze: { icon: "🥉", color: "#d97706", gradient: "from-orange-400 to-amber-600" },
  platinum: { icon: "💎", color: "#a855f7", gradient: "from-purple-400 to-violet-500" },
  diamond: { icon: "💠", color: "#06b6d4", gradient: "from-cyan-400 to-blue-500" },
  default: { icon: "🏆", color: "#10b981", gradient: "from-green-400 to-emerald-500" },
};

// ==========================================
// 🗄️ INITIAL STATE
// ==========================================

const initialRewardData: RewardData = {
  selectedEvent: null,
  users: [],
  filteredUsers: [],
  loading: false,
  error: "",
  searchQuery: "",
  filterTier: "",
  filterStatus: "",
  showSendAllModal: false,
  sendAllMessage: "",
  sendingMessages: false,
  messagesSent: 0,
  messagesFailed: 0,
  showMessageModal: false,
  messageUser: null,
  message: "",
  currentPage: 1,
  itemsPerPage: 10,
  totalItems: 0,
  totalPages: 0,
  autoRefresh: false,
  showExportMenu: false,
  availableTiers: [],
};

// Extended state for leaderboard
interface ExtendedRewardData extends RewardData {
  currentConfigId?: number;
  leaderboardFinalized?: boolean;
}

// ==========================================
// 📦 STORES
// ==========================================

export const rewardData = writable<ExtendedRewardData>({
  ...initialRewardData,
  currentConfigId: undefined,
  leaderboardFinalized: false,
});
export const rewardEventsPage = writable<number>(1);
export const rewardUsersPage = writable<number>(1);
export const rewardEventsPerPage = writable<number>(8);
export const rewardUsersPerPage = writable<number>(10);

// ==========================================
// 📊 DERIVED STORES
// ==========================================

export const filteredRewardUsers = derived(rewardData, ($rewardData) => {
  let filtered = [...$rewardData.users];

  // Search filter
  if ($rewardData.searchQuery?.trim()) {
    const query = $rewardData.searchQuery.toLowerCase().trim();
    filtered = filtered.filter(
      (user) =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.nisit_id?.toLowerCase().includes(query)
    );
  }

  // Tier filter
  if ($rewardData.filterTier && $rewardData.filterTier !== "all") {
    filtered = filtered.filter(
      (user) => user.tier?.toLowerCase() === $rewardData.filterTier.toLowerCase()
    );
  }

  // Status filter
  if ($rewardData.filterStatus && $rewardData.filterStatus !== "all") {
    filtered = filtered.filter((user) => user.status === $rewardData.filterStatus);
  }

  return filtered;
});

export const paginatedRewardUsers = derived(
  [filteredRewardUsers, rewardUsersPage, rewardUsersPerPage],
  ([$filteredUsers, $page, $perPage]) => {
    return $filteredUsers.slice(($page - 1) * $perPage, $page * $perPage);
  }
);

export const totalRewardUsersPages = derived(
  [filteredRewardUsers, rewardUsersPerPage],
  ([$filteredUsers, $perPage]) => Math.ceil($filteredUsers.length / $perPage)
);

// ==========================================
// 🛠️ HELPER FUNCTIONS
// ==========================================

export function getTierConfig(tierName: string) {
  const name = tierName?.toLowerCase() || "default";
  if (name.includes("gold")) return tierConfig.gold;
  if (name.includes("silver")) return tierConfig.silver;
  if (name.includes("bronze")) return tierConfig.bronze;
  if (name.includes("platinum")) return tierConfig.platinum;
  if (name.includes("diamond")) return tierConfig.diamond;
  return tierConfig.default;
}

export function getTierDisplayName(tier: any, language: string = "en"): string {
  if (!tier) return "-";
  if (typeof tier === "string") return tier;
  if (tier.name) return tier.name;
  if (tier.reward_name) return tier.reward_name;
  return "-";
}

export function getTierIcon(tierName: string): string {
  const config = getTierConfig(tierName);
  return config.icon;
}

// ==========================================
// 📝 ACTIONS
// ==========================================

export function selectEventForReward(event: AppEvent) {
  rewardData.update((data) => ({
    ...data,
    selectedEvent: event,
    loading: true,
    error: "",
    users: [],
    filteredUsers: [],
    searchQuery: "",
    filterTier: "",
    filterStatus: "",
    currentPage: 1,
  }));

  fetchRewardUsers(event.id);
}

export function backToRewardEventsList() {
  rewardData.set({
    ...initialRewardData,
    currentConfigId: undefined,
    leaderboardFinalized: false,
  });
  rewardEventsPage.set(1);
  rewardUsersPage.set(1);
}

export async function fetchRewardUsers(eventId: number) {
  rewardData.update((data) => ({
    ...data,
    loading: true,
    error: "",
  }));

  try {
    const token = localStorage.getItem("access_token");
    if (!token) throw new Error("No access token found");

    const axiosHeaders = getAuthHeaders();

    // First, get the leaderboard config for this event
    let configId: number | null = null;
    let leaderboardConfig: any = null;

    try {
      const configRes = await axios.get(
        `${API_BASE_URL}/api/reward-leaderboards/configs/event/${eventId}`,
        { headers: axiosHeaders }
      );
      leaderboardConfig = configRes.data;
      configId = configRes.data?.id;
    } catch (err: any) {
      if (err.response?.status !== 404) {
        console.warn("Could not fetch leaderboard config:", err.message);
      }
    }

    if (configId) {
      // Fetch leaderboard entries
      try {
        const entriesRes = await axios.get(
          `${API_BASE_URL}/api/reward-leaderboards/configs/${configId}/entries`,
          { 
            headers: axiosHeaders,
            params: { qualified_only: false }
          }
        );

        const entries = Array.isArray(entriesRes.data) ? entriesRes.data : [];
        
        const users: RewardUser[] = entries.map((entry: any, index: number) => ({
          id: String(entry.user_id),
          name: entry.user_name || `User ${entry.user_id}`,
          email: entry.email || "",
          nisit_id: entry.nisit_id || "",
          faculty: entry.faculty || "",
          phone: entry.phone || "",
          avatar: (entry.user_name?.[0] || "U").toUpperCase(),
          role: entry.role || "student",
          tier: entry.reward_name || "-",
          tierIcon: getTierIcon(entry.reward_name),
          tierColor: getTierConfig(entry.reward_name).color,
          tierRange: entry.tier_range || "",
          rank: entry.rank || index + 1,
          completions: entry.total_completions || 0,
          totalDistance: entry.total_distance_km || 0,
          status: entry.qualified_at ? "completed" : "in_progress",
          joinedAt: entry.joined_at || "",
          completedAt: entry.qualified_at || "",
          rewardId: entry.reward_id || null,
          rewardName: entry.reward_name || "",
          claimed: !!entry.claimed_at,
          claimedAt: entry.claimed_at || null,
        }));

        // Extract available tiers
        const tiersSet = new Set(users.map((u) => u.tier).filter((t) => t && t !== "-"));
        const availableTiers = Array.from(tiersSet).map((name) => ({
          name,
          icon: getTierIcon(name),
          color: getTierConfig(name).color,
        }));

        rewardData.update((data) => ({
          ...data,
          users,
          filteredUsers: users,
          availableTiers,
          currentConfigId: configId!,
          leaderboardFinalized: !!leaderboardConfig?.finalized_at,
          totalItems: users.length,
          totalPages: Math.ceil(users.length / data.itemsPerPage),
          loading: false,
        }));
        return;
      } catch (err: any) {
        console.warn("Could not fetch leaderboard entries:", err.message);
      }
    }

    // Fallback: fetch participants directly
    const participantsRes = await axios.get(
      `${API_BASE_URL}/api/events/${eventId}/participants`,
      { headers: axiosHeaders }
    );

    let participants: any[] = [];
    if (Array.isArray(participantsRes.data)) {
      participants = participantsRes.data;
    } else if (participantsRes.data?.participants) {
      participants = participantsRes.data.participants;
    }

    const users: RewardUser[] = participants.map((p: any, index: number) => ({
      id: String(p.user_id),
      name: `${p.first_name || ""} ${p.last_name || ""}`.trim() || `User ${p.user_id}`,
      email: p.email || "",
      nisit_id: p.nisit_id || "",
      faculty: p.faculty || "",
      phone: p.phone || "",
      avatar: (p.first_name?.[0] || "U").toUpperCase(),
      role: p.role || "student",
      tier: "-",
      tierIcon: "🏆",
      tierColor: "#10b981",
      tierRange: "",
      rank: index + 1,
      completions: p.checkin_count || 0,
      totalDistance: p.total_distance_km || 0,
      status: p.status || "joined",
      joinedAt: p.joined_at || "",
      completedAt: p.completed_at || "",
      rewardId: null,
      rewardName: "",
      claimed: false,
      claimedAt: null,
    }));

    rewardData.update((data) => ({
      ...data,
      users,
      filteredUsers: users,
      availableTiers: [],
      totalItems: users.length,
      totalPages: Math.ceil(users.length / data.itemsPerPage),
      loading: false,
    }));
  } catch (error: any) {
    console.error("Error fetching reward users:", error);
    rewardData.update((data) => ({
      ...data,
      error: `Failed to load reward users: ${error.message}`,
      users: [],
      filteredUsers: [],
      loading: false,
    }));
  }
}

export async function fetchLeaderboard(eventId: number) {
  if (!eventId) return;

  rewardData.update((data) => ({
    ...data,
    loading: true,
  }));

  try {
    const axiosHeaders = getAuthHeaders();

    // Get config
    const configRes = await api.get(`/api/reward-leaderboards/configs/event/${eventId}`);
    const configId = configRes.data?.id;

    if (!configId) {
      rewardData.update((data) => ({
        ...data,
        users: [],
        leaderboardFinalized: false,
        loading: false,
      }));
      return;
    }

    rewardData.update((data) => ({
      ...data,
      currentConfigId: configId,
    }));

    // Get entries
    const entriesRes = await api.get(`/api/reward-leaderboards/configs/${configId}/entries`, {
      params: { qualified_only: true },
    });

    const entries = Array.isArray(entriesRes.data) ? entriesRes.data : [];
    
    const users: RewardUser[] = entries.map((entry: any, index: number) => ({
      id: String(entry.user_id),
      name: entry.user_name || `User ${entry.user_id}`,
      email: entry.email || "",
      nisit_id: entry.nisit_id || "",
      faculty: entry.faculty || "",
      phone: entry.phone || "",
      avatar: (entry.user_name?.[0] || "U").toUpperCase(),
      role: entry.role || "student",
      tier: entry.reward_name || "-",
      tierIcon: getTierIcon(entry.reward_name),
      tierColor: getTierConfig(entry.reward_name).color,
      tierRange: entry.tier_range || "",
      rank: entry.rank || index + 1,
      completions: entry.total_completions || 0,
      totalDistance: entry.total_distance_km || 0,
      status: "completed",
      joinedAt: entry.joined_at || "",
      completedAt: entry.qualified_at || "",
      rewardId: entry.reward_id || null,
      rewardName: entry.reward_name || "",
      claimed: !!entry.claimed_at,
      claimedAt: entry.claimed_at || null,
    }));

    rewardData.update((data) => ({
      ...data,
      users,
      filteredUsers: users,
      loading: false,
    }));
  } catch (error: any) {
    console.error("Error fetching leaderboard:", error);
    rewardData.update((data) => ({
      ...data,
      error: error.message,
      loading: false,
    }));
  }
}

export async function handleCalculateRanks() {
  const currentData = get(rewardData);
  const configId = currentData.currentConfigId;

  if (!configId) {
    console.error("No config ID found");
    return { success: false, message: "No configuration found" };
  }

  try {
    await api.post(`/api/reward-leaderboards/configs/${configId}/calculate-ranks`);
    
    // Refresh data
    if (currentData.selectedEvent) {
      await fetchLeaderboard(currentData.selectedEvent.id);
    }

    return { success: true, message: "Ranks calculated successfully" };
  } catch (error: any) {
    console.error("Error calculating ranks:", error);
    return { success: false, message: error.message };
  }
}

export async function handleFinalizeRewards() {
  const currentData = get(rewardData);
  const configId = currentData.currentConfigId;

  if (!configId) {
    console.error("No config ID found");
    return { success: false, message: "No configuration found" };
  }

  try {
    await api.post(`/api/reward-leaderboards/configs/${configId}/finalize`);
    
    rewardData.update((data) => ({
      ...data,
      leaderboardFinalized: true,
    }));

    // Refresh data
    if (currentData.selectedEvent) {
      await fetchLeaderboard(currentData.selectedEvent.id);
    }

    return { success: true, message: "Rewards finalized successfully" };
  } catch (error: any) {
    console.error("Error finalizing rewards:", error);
    return { success: false, message: error.message };
  }
}

export function applyRewardFilters() {
  // Filters are applied reactively via derived store
  rewardUsersPage.set(1);
}

export function resetRewardFilters() {
  rewardData.update((data) => ({
    ...data,
    searchQuery: "",
    filterTier: "",
    filterStatus: "",
  }));
  rewardUsersPage.set(1);
}

export function toggleRewardExportMenu() {
  rewardData.update((data) => ({
    ...data,
    showExportMenu: !data.showExportMenu,
  }));
}

export function toggleRewardAutoRefresh() {
  rewardData.update((data) => ({
    ...data,
    autoRefresh: !data.autoRefresh,
  }));
}

export function openMessageModal(user: RewardUser) {
  rewardData.update((data) => ({
    ...data,
    showMessageModal: true,
    messageUser: user,
    message: "",
  }));
}

export function closeMessageModal() {
  rewardData.update((data) => ({
    ...data,
    showMessageModal: false,
    messageUser: null,
    message: "",
  }));
}

export function openSendAllModal() {
  rewardData.update((data) => ({
    ...data,
    showSendAllModal: true,
    sendAllMessage: "",
  }));
}

export function closeSendAllModal() {
  rewardData.update((data) => ({
    ...data,
    showSendAllModal: false,
    sendAllMessage: "",
  }));
}

export function nextRewardEventsPage() {
  rewardEventsPage.update((n) => n + 1);
}

export function prevRewardEventsPage() {
  rewardEventsPage.update((n) => Math.max(n - 1, 1));
}

export function jumpToRewardEventsPage(page: number) {
  rewardEventsPage.set(page);
}

export function nextRewardUsersPage() {
  const totalPages = get(totalRewardUsersPages);
  rewardUsersPage.update((n) => Math.min(n + 1, totalPages));
}

export function prevRewardUsersPage() {
  rewardUsersPage.update((n) => Math.max(n - 1, 1));
}

export function jumpToRewardUsersPage(page: number) {
  rewardUsersPage.set(page);
}

export function refreshRewardUsers() {
  const currentData = get(rewardData);
  if (currentData.selectedEvent) {
    fetchRewardUsers(currentData.selectedEvent.id);
  }
}

export default {
  rewardData,
  rewardEventsPage,
  rewardUsersPage,
  filteredRewardUsers,
  paginatedRewardUsers,
  totalRewardUsersPages,
  tierConfig,
  getTierConfig,
  getTierDisplayName,
  getTierIcon,
  selectEventForReward,
  backToRewardEventsList,
  fetchRewardUsers,
  fetchLeaderboard,
  handleCalculateRanks,
  handleFinalizeRewards,
  applyRewardFilters,
  resetRewardFilters,
  toggleRewardExportMenu,
  toggleRewardAutoRefresh,
  openMessageModal,
  closeMessageModal,
  openSendAllModal,
  closeSendAllModal,
  nextRewardEventsPage,
  prevRewardEventsPage,
  jumpToRewardEventsPage,
  nextRewardUsersPage,
  prevRewardUsersPage,
  jumpToRewardUsersPage,
  refreshRewardUsers,
};
