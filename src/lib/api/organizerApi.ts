// ==========================================
// 🔧 ORGANIZER API CLIENT
// ==========================================
import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { goto } from '$app/navigation';
import type { AppEvent, Log, ProofSubmission, RewardUser } from '$lib/stores/organizerStore';

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

// ==========================================
// 🔧 AXIOS INSTANCE CONFIGURATION
// ==========================================
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Request interceptor - เพิ่ม token อัตโนมัติ
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig & { __retryCount?: number }) => {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    (config as any).__retryCount = (config as any).__retryCount || 0;
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - จัดการ error, 401, และ retry
api.interceptors.response.use(
  (response: any) => response,
  async (error: AxiosError) => {
    const config = error.config as any;

    // Handle 401 - Token expired
    if (error.response?.status === 401) {
      console.error('Token expired or invalid, redirecting to login');
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('access_token');
      }
      goto('/auth/login');
      return Promise.reject(error);
    }

    // Handle 502, 503, 504 - Gateway errors with retry
    const retryableStatuses = [502, 503, 504];
    const isRetryable = error.response?.status && retryableStatuses.includes(error.response.status);
    const isNetworkError = !error.response && error.code === 'ECONNABORTED';

    if ((isRetryable || isNetworkError) && config && config.__retryCount < MAX_RETRIES) {
      config.__retryCount += 1;
      console.warn(`🔄 Retry attempt ${config.__retryCount}/${MAX_RETRIES} for ${config.url}`);
      await delay(RETRY_DELAY * config.__retryCount);
      return api(config);
    }

    return Promise.reject(error);
  }
);

// ==========================================
// 📦 API FUNCTIONS
// ==========================================

// Fetch all events
export async function fetchEvents(): Promise<AppEvent[]> {
  try {
    const response = await api.get('/api/events');
    const data = response.data;
    const eventsList = Array.isArray(data) ? data : (data.events || data.data || []);
    
    return eventsList.map((event: any) => {
      const startDate = new Date(event.start_date || event.startDate);
      return {
        ...event,
        id: event.id,
        title: event.title || event.name || 'Untitled Event',
        description: event.description || '',
        location: event.location || '',
        start_date: event.start_date || event.startDate,
        end_date: event.end_date || event.endDate,
        start_time: event.start_time || event.startTime || '00:00',
        end_time: event.end_time || event.endTime || '23:59',
        capacity: event.capacity || event.max_participants || 0,
        distance: event.distance || 0,
        holidays: event.holidays || [],
        rewards: event.rewards || [],
        is_public: event.is_public ?? event.isPublic ?? true,
        is_active: event.is_active ?? event.isActive ?? true,
        image_url: event.image_url || event.imageUrl || null,
        event_type: event.event_type || event.eventType || 'single',
        max_checkins_per_user: event.max_checkins_per_user || 1,
        year: startDate.getFullYear().toString(),
        month: (startDate.getMonth() + 1).toString().padStart(2, '0'),
        participant_count: event.participant_count || event.participantCount || 0,
        rewardConfigId: event.reward_config_id || event.rewardConfigId,
        finalized_at: event.finalized_at,
        created_at: event.created_at || event.createdAt,
        updated_at: event.updated_at || event.updatedAt,
      };
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
}

// Create event
export async function createEvent(eventData: FormData | object): Promise<AppEvent> {
  try {
    const response = await api.post('/api/events', eventData, {
      headers: eventData instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return response.data;
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
}

// Update event
export async function updateEvent(eventId: number, eventData: FormData | object): Promise<AppEvent> {
  try {
    const response = await api.put(`/api/events/${eventId}`, eventData, {
      headers: eventData instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return response.data;
  } catch (error) {
    console.error('Error updating event:', error);
    throw error;
  }
}

// Delete event
export async function deleteEvent(eventId: number): Promise<void> {
  try {
    await api.delete(`/api/events/${eventId}`);
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
}

// Fetch event logs/participations
export async function fetchEventLogs(eventId: number): Promise<Log[]> {
  try {
    const response = await api.get(`/api/events/${eventId}/participants`);
    const data = response.data;
    return Array.isArray(data) ? data : (data.participants || data.data || []);
  } catch (error) {
    console.error('Error fetching logs:', error);
    throw error;
  }
}

// Fetch pending proof submissions
export async function fetchPendingSubmissions(eventId: number): Promise<ProofSubmission[]> {
  try {
    const response = await api.get(`/api/participations/event/${eventId}`, {
      params: { status: 'pending_proof' }
    });
    const data = response.data;
    const submissions = Array.isArray(data) ? data : (data.data || []);
    
    return submissions.map((sub: any, index: number) => ({
      id: sub.id,
      odySd: sub.nisit_id || sub.user_id?.toString() || '',
      runnerName: sub.user_name || `User ${sub.user_id}`,
      email: sub.user_email || '',
      runnerImage: sub.user_avatar || null,
      submitTime: sub.proof_submitted_at || sub.updated_at || new Date().toISOString(),
      proofImage: sub.proof_image_url || null,
      rank: index + 1,
      stravaLink: sub.strava_link || null,
      actualDistance: sub.actual_distance || null,
    }));
  } catch (error) {
    console.error('Error fetching submissions:', error);
    throw error;
  }
}

// Approve proof submission
export async function approveSubmission(participationId: number): Promise<void> {
  try {
    await api.post(`/api/participations/${participationId}/verify`);
  } catch (error) {
    console.error('Error approving submission:', error);
    throw error;
  }
}

// Reject proof submission
export async function rejectSubmission(participationId: number, reason: string): Promise<void> {
  try {
    await api.post(`/api/participations/${participationId}/reject`, { reason });
  } catch (error) {
    console.error('Error rejecting submission:', error);
    throw error;
  }
}

// Check-in participant by code
export async function checkInByCode(code: string, eventId?: number): Promise<any> {
  try {
    const payload: any = { join_code: code };
    if (eventId) payload.event_id = eventId;
    
    const response = await api.post(`/api/participations/checkin`, payload);
    return response.data;
  } catch (error) {
    console.error('Error checking in:', error);
    throw error;
  }
}

// Check-out participant by code
export async function checkOutByCode(code: string, eventId?: number): Promise<any> {
  try {
    const payload: any = { join_code: code };
    if (eventId) payload.event_id = eventId;
    
    const response = await api.post(`/api/participations/checkout`, payload);
    return response.data;
  } catch (error) {
    console.error('Error checking out:', error);
    throw error;
  }
}

// Unlock user account
export async function unlockUser(userId: string, organizerId: number): Promise<void> {
  try {
    await api.post(`/api/users/${userId}/unlock`, {}, {
      params: { organizer_id: organizerId }
    });
  } catch (error) {
    console.error('Error unlocking user:', error);
    throw error;
  }
}

// Find user by email
export async function findUserByEmail(email: string): Promise<any | null> {
  try {
    const response = await api.get('/api/users/');
    const data = response.data;
    let usersList: any[] = [];
    if (Array.isArray(data)) {
      usersList = data;
    } else if (data.data && Array.isArray(data.data)) {
      usersList = data.data;
    } else if (data.users && Array.isArray(data.users)) {
      usersList = data.users;
    }
    return usersList.find((u: any) => 
      u.email && u.email.toLowerCase() === email.toLowerCase()
    ) || null;
  } catch (error) {
    console.error('Error finding user:', error);
    return null;
  }
}

// Fetch leaderboard entries
export async function fetchLeaderboard(eventId: number): Promise<{
  entries: RewardUser[];
  configId: number | null;
  finalized: boolean;
}> {
  try {
    // Get config ID first
    const configRes = await api.get(`/api/reward-leaderboards/configs/event/${eventId}`);
    const configId = configRes.data.id;
    
    if (!configId) {
      return { entries: [], configId: null, finalized: false };
    }

    // Get entries
    const entriesRes = await api.get(`/api/reward-leaderboards/configs/${configId}/entries`, {
      params: { qualified_only: true }
    });

    const entries = entriesRes.data.map((entry: any, index: number) => ({
      id: `entry_${entry.id}`,
      name: entry.user_name || entry.user_full_name || `User ${entry.user_id}`,
      email: entry.user_email || '',
      globalRank: entry.rank || index + 1,
      tierRank: entry.rank || index + 1,
      tier: entry.reward_name || 'No Tier',
      completedCount: entry.total_completions || 0,
      completedAt: entry.qualified_at || '',
      rewardTier: entry.reward_tier,
      status: entry.qualified_at ? 'completed' : 'in_progress',
    }));

    return {
      entries,
      configId,
      finalized: !!configRes.data.finalized_at,
    };
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return { entries: [], configId: null, finalized: false };
  }
}

// Calculate ranks
export async function calculateRanks(configId: number): Promise<void> {
  try {
    await api.post(`/api/reward-leaderboards/configs/${configId}/calculate-ranks`, {
      config_id: configId
    });
  } catch (error) {
    console.error('Error calculating ranks:', error);
    throw error;
  }
}

// Finalize rewards
export async function finalizeRewards(configId: number): Promise<void> {
  try {
    await api.post(`/api/reward-leaderboards/configs/${configId}/finalize`, {
      config_id: configId,
      confirm: true
    });
  } catch (error) {
    console.error('Error finalizing rewards:', error);
    throw error;
  }
}

// Fetch user profile
export async function fetchUserProfile(userId: string): Promise<any> {
  try {
    const response = await api.get(`/api/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
}

// Update user profile
export async function updateUserProfile(userId: string, data: object): Promise<any> {
  try {
    const response = await api.put(`/api/users/${userId}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
}

// Process image URL helper
export function processImageUrl(url: string | null): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  if (url.startsWith('/')) {
    return `${API_BASE_URL}${url}`;
  }
  return `${API_BASE_URL}/${url}`;
}
