/**
 * Reward Leaderboard API Client
 * Handles all leaderboard-related API calls
 */

import { API_BASE_URL } from '$lib/utils/imageUtils';

// ==================== Types ====================

export interface RewardTier {
  tier: number;
  min_rank: number;
  max_rank: number;
  reward_id: number;
  reward_name: string | null;
  quantity: number;
  required_completions: number | null;
}

export interface LeaderboardConfig {
  id: number;
  event_id: number;
  name: string;
  description: string | null;
  required_completions: number;
  max_reward_recipients: number;
  reward_tiers: RewardTier[];
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  finalized_at: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
  total_reward_slots: number;
  total_qualified: number;
  total_rewarded: number;
  is_finalized: boolean;
}

export interface LeaderboardEntry {
  id: number;
  config_id: number;
  user_id: number;
  total_completions: number;
  completed_event_participations: number[];
  rank: number | null;
  qualified_at: string | null;
  reward_id: number | null;
  reward_tier: number | null;
  rewarded_at: string | null;
  created_at: string;
  updated_at: string;
  user_full_name: string | null;
  user_email: string | null;
  user_role: string | null;
  reward_name: string | null;
  reward_description: string | null;
}

export interface MyLeaderboardStatus {
  config_id: number;
  event_id: number;
  event_name: string;
  required_completions: number;
  current_completions: number;
  progress_percentage: number;
  rank: number | null;
  qualified: boolean;
  qualified_at: string | null;
  reward_tier: number | null;
  reward_name: string | null;
  rewarded_at: string | null;
  is_finalized: boolean;
  can_still_qualify: boolean;
}

export interface MyLeaderboardsSummary {
  total_leaderboards: number;
  completed_leaderboards: number;
  rewards_received: number;
  pending_leaderboards: number;
  leaderboards: MyLeaderboardStatus[];
}

export interface UserEventStatus {
  user_id: number;
  user_full_name: string;
  user_email: string;
  event_id: number;
  event_name: string;
  total_participations: number;
  completed_participations: number;
  checked_in_count: number;
  proof_submitted_count: number;
  rejected_count: number;
  cancelled_count: number;
  total_distance_km: number | null;
  first_participation_at: string | null;
  last_participation_at: string | null;
  leaderboard_config_id: number | null;
  leaderboard_rank: number | null;
  leaderboard_qualified: boolean;
  leaderboard_reward_name: string | null;
  tier_progress: Array<{
    tier: number;
    tier_name: string;
    required_completions: number;
    current_completions: number;
    progress_percentage: number;
    qualified: boolean;
  }> | null;
}

export interface EventSummary {
  event_id: number;
  event_name: string;
  total_participants: number;
  by_status: { [status: string]: number };
  by_tier: { [tierName: string]: number } | null;
  completion_rate: number;
}

export interface CalculateRanksResult {
  success: boolean;
  ranked_count: number;
  message: string;
}

export interface FinalizeResult {
  success: boolean;
  message: string;
  finalized_at: string;
  total_rewarded: number;
}

// ==================== Helper Functions ====================

/**
 * Get access token from localStorage
 */
function getAccessToken(): string {
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('No access token found');
  }
  return token;
}

/**
 * Make API request with proper error handling
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAccessToken();
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      detail: `HTTP ${response.status}: ${response.statusText}`
    }));
    throw new Error(error.detail || error.message || 'API request failed');
  }

  return await response.json();
}

// ==================== API Functions ====================

/**
 * Fetch leaderboard config for an event
 * ⚠️ Important: This returns the config object directly, not { data: ... }
 */
export async function fetchLeaderboardConfig(
  eventId: number
): Promise<LeaderboardConfig> {
  return await apiRequest<LeaderboardConfig>(
    `/api/reward-leaderboards/configs/event/${eventId}`
  );
}

/**
 * Fetch leaderboard entries
 * ⚠️ Important: This returns an array directly, not { data: [...] }
 */
export async function fetchLeaderboardEntries(
  configId: number,
  qualifiedOnly: boolean = false,
  skip: number = 0,
  limit: number = 1000
): Promise<LeaderboardEntry[]> {
  const params = new URLSearchParams({
    qualified_only: String(qualifiedOnly),
    skip: String(skip),
    limit: String(limit),
  });

  return await apiRequest<LeaderboardEntry[]>(
    `/api/reward-leaderboards/configs/${configId}/entries?${params}`
  );
}

/**
 * Calculate rankings for a leaderboard
 */
export async function calculateRankings(
  configId: number
): Promise<CalculateRanksResult> {
  return await apiRequest<CalculateRanksResult>(
    `/api/reward-leaderboards/configs/${configId}/calculate-ranks`,
    { method: 'POST' }
  );
}

/**
 * Fetch my leaderboards summary
 */
export async function fetchMyLeaderboards(): Promise<MyLeaderboardsSummary> {
  return await apiRequest<MyLeaderboardsSummary>(
    '/api/reward-leaderboards/my-leaderboards'
  );
}

/**
 * Fetch user status in an event (Staff/Organizer only)
 */
export async function fetchUserEventStatus(
  eventId: number,
  userId: number
): Promise<UserEventStatus> {
  return await apiRequest<UserEventStatus>(
    `/api/reward-leaderboards/events/${eventId}/users/${userId}`
  );
}

/**
 * Fetch event summary (Staff/Organizer only)
 */
export async function fetchEventSummary(
  eventId: number
): Promise<EventSummary> {
  return await apiRequest<EventSummary>(
    `/api/reward-leaderboards/events/${eventId}/summary`
  );
}

/**
 * Finalize a leaderboard (Organizer only)
 */
export async function finalizeLeaderboard(
  configId: number
): Promise<FinalizeResult> {
  return await apiRequest<FinalizeResult>(
    `/api/reward-leaderboards/configs/${configId}/finalize`,
    {
      method: 'POST',
      body: JSON.stringify({ confirm: true }),
    }
  );
}

/**
 * Fetch all leaderboard configs (Organizer only)
 */
export async function fetchAllLeaderboardConfigs(): Promise<LeaderboardConfig[]> {
  const result = await apiRequest<any>('/api/reward-leaderboards/configs');
  
  // ⚠️ Handle both array and { data: [...] } response formats
  if (Array.isArray(result)) {
    return result;
  } else if (result.data && Array.isArray(result.data)) {
    return result.data;
  }
  
  return [];
}

/**
 * Create a new leaderboard config (Organizer only)
 */
export async function createLeaderboardConfig(
  data: Partial<LeaderboardConfig>
): Promise<LeaderboardConfig> {
  return await apiRequest<LeaderboardConfig>(
    '/api/reward-leaderboards/configs',
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
}

/**
 * Update a leaderboard config (Organizer only)
 */
export async function updateLeaderboardConfig(
  configId: number,
  data: Partial<LeaderboardConfig>
): Promise<LeaderboardConfig> {
  return await apiRequest<LeaderboardConfig>(
    `/api/reward-leaderboards/configs/${configId}`,
    {
      method: 'PUT',
      body: JSON.stringify(data),
    }
  );
}

/**
 * Delete a leaderboard config (Organizer only)
 */
export async function deleteLeaderboardConfig(
  configId: number
): Promise<{ success: boolean; message: string }> {
  return await apiRequest(
    `/api/reward-leaderboards/configs/${configId}`,
    { method: 'DELETE' }
  );
}

/**
 * Helper function to safely fetch config with error handling
 */
export async function safelyFetchConfig(
  eventId: number
): Promise<LeaderboardConfig | null> {
  try {
    return await fetchLeaderboardConfig(eventId);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('404') || error.message.includes('not found')) {
        console.log(`Event ${eventId} doesn't have a leaderboard config yet`);
        return null;
      }
    }
    throw error;
  }
}
