// src/lib/utils/apiClient.ts
import { browser } from '$app/environment';
import { auth } from '$lib/utils/auth';
import { goto } from '$app/navigation';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

interface ApiRequestOptions extends RequestInit {
    skipAuth?: boolean;
    skipRefresh?: boolean;
}

/**
 * Enhanced fetch with automatic token refresh
 */
export async function apiRequest(
    endpoint: string,
    options: ApiRequestOptions = {}
): Promise<Response> {
    const { skipAuth, skipRefresh, ...fetchOptions } = options;

    // Prepare headers
    const headers = new Headers(fetchOptions.headers || {});

    // Add auth token if not skipped
    if (!skipAuth && browser) {
        const token = localStorage.getItem('access_token');
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }
    }

    // Add Content-Type if not present
    if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    fetchOptions.headers = headers;

    // Make the request
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
    let response: Response;
    
    try {
        response = await fetch(url, fetchOptions);
    } catch (error) {
        // Network error or fetch failed - don't force logout, let caller handle
        console.error('❌ API Request failed:', error);
        throw error;
    }

    // Check for error status codes
    if (!response.ok) {
        const status = response.status;
        
        // If 401, try token refresh first
        if (status === 401 && !skipRefresh && browser) {
            const refreshToken = localStorage.getItem('refresh_token');

            if (refreshToken) {
                console.log('Got 401, attempting token refresh...');

                // Try to refresh the token
                const refreshSuccess = await auth.refreshAccessToken();

                if (refreshSuccess) {
                    // Retry the original request with new token
                    const newToken = localStorage.getItem('access_token');
                    if (newToken) {
                        headers.set('Authorization', `Bearer ${newToken}`);
                        fetchOptions.headers = headers;
                        try {
                            response = await fetch(url, fetchOptions);
                            // If still error after refresh, force logout
                            if (!response.ok) {
                                console.error(`❌ Error ${response.status} after token refresh`);
                                auth.forceLogoutAndRedirect();
                            }
                            return response;
                        } catch (retryError) {
                            console.error('❌ Retry request failed:', retryError);
                            auth.forceLogoutAndRedirect();
                            throw retryError;
                        }
                    }
                } else {
                    // Refresh failed, force logout
                    console.error('❌ Token refresh failed');
                    auth.forceLogoutAndRedirect();
                    throw new Error('Session expired. Please login again.');
                }
            } else {
                // No refresh token, force logout
                console.error('❌ No refresh token available');
                auth.forceLogoutAndRedirect();
                throw new Error('Session expired. Please login again.');
            }
        } else if (status === 403) {
            // 403 Forbidden - force logout (no permission)
            console.error(`❌ API Error 403: Forbidden`);
            auth.forceLogoutAndRedirect();
            throw new Error('Access denied. Please login again.');
        } else if (status >= 400) {
            // Other error status (400, 404, 500, etc.) - don't force logout
            // Let the caller handle these errors appropriately
            console.warn(`⚠️ API Error ${status}: ${response.statusText}`);
            // Just return the error response without forcing logout
        }
    }

    return response;
}

// Convenience methods
export const api = {
    get: (endpoint: string, options?: ApiRequestOptions) =>
        apiRequest(endpoint, { ...options, method: 'GET' }),

    post: (endpoint: string, data?: any, options?: ApiRequestOptions) =>
        apiRequest(endpoint, {
            ...options,
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined
        }),

    put: (endpoint: string, data?: any, options?: ApiRequestOptions) =>
        apiRequest(endpoint, {
            ...options,
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined
        }),

    delete: (endpoint: string, options?: ApiRequestOptions) =>
        apiRequest(endpoint, { ...options, method: 'DELETE' }),

    patch: (endpoint: string, data?: any, options?: ApiRequestOptions) =>
        apiRequest(endpoint, {
            ...options,
            method: 'PATCH',
            body: data ? JSON.stringify(data) : undefined
        })
};

// ===== Participant Snapshots API =====

export interface SnapshotEntry {
    id?: number;
    entry_id: string;
    snapshot_id?: number;
    participation_id?: number | null;
    user_id: number;
    user_name: string;
    user_email: string | null;
    action: 'joined' | 'checked_in' | 'cancelled' | 'rejected' | 'pending' | 'completed';
    status?: 'joined' | 'checked_in' | 'cancelled' | 'rejected' | 'pending' | 'completed';
    created_at?: string;
    joined_at?: string | null;
    checked_in_at?: string | null;
    completed_at?: string | null;
    metadata?: Record<string, any> | null;
}

export interface Snapshot {
    id: number;
    snapshot_id: string;
    snapshot_time: string;
    entry_count: number;
    event_id?: number;
    description?: string | null;
}

export interface SnapshotsResponse {
    snapshots: Snapshot[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
}

export interface SnapshotEntriesResponse {
    entries: SnapshotEntry[];
    total?: number;
    total_entries: number;
    page: number;
    page_size: number;
    total_pages: number;
    snapshot_id: string;
    snapshot_time: string;
}

export interface SnapshotCreateResponse {
    id: number;
    snapshot_id: string;
    event_id: number;
    snapshot_time: string;
    entry_count: number;
    created_by: number | null;
    description: string | null;
}

/**
 * Get list of participant snapshots for an event
 */
export async function getParticipantSnapshots(
    eventId: number,
    page: number = 1,
    pageSize: number = 20
): Promise<SnapshotsResponse> {
    const response = await api.get(
        `/api/events/${eventId}/participants/history?page=${page}&page_size=${pageSize}`
    );
    
    if (!response.ok) {
        throw new Error(`Failed to fetch snapshots: ${response.statusText}`);
    }
    
    return await response.json();
}

/**
 * Get entries for a specific snapshot
 */
export async function getSnapshotEntries(
    eventId: number,
    snapshotId: string,
    page: number = 1,
    pageSize: number = 50
): Promise<SnapshotEntriesResponse> {
    const response = await api.get(
        `/api/events/${eventId}/participants/history/${snapshotId}/entries?page=${page}&page_size=${pageSize}`
    );
    
    if (!response.ok) {
        throw new Error(`Failed to fetch snapshot entries: ${response.statusText}`);
    }
    
    return await response.json();
}

/**
 * Create a new snapshot (on-demand)
 */
export async function createParticipantSnapshot(
    eventId: number,
    description?: string
): Promise<SnapshotCreateResponse> {
    const url = description
        ? `/api/events/${eventId}/participants/snapshots?description=${encodeURIComponent(description)}`
        : `/api/events/${eventId}/participants/snapshots`;
    
    const response = await api.post(url);
    
    if (!response.ok) {
        throw new Error(`Failed to create snapshot: ${response.statusText}`);
    }
    
    return await response.json();
}

/**
 * Delete a snapshot
 */
export async function deleteParticipantSnapshot(
    eventId: number,
    snapshotId: string
): Promise<void> {
    const response = await api.delete(
        `/api/events/${eventId}/participants/history/${snapshotId}`
    );
    
    if (!response.ok) {
        throw new Error(`Failed to delete snapshot: ${response.statusText}`);
    }
}

// Export for use in +page.ts load functions
export { apiRequest as fetch };