/**
 * Image Utilities - Centralized image handling for the application
 * Supports upload, display, and URL resolution for event banners, proofs, and rewards
 */

// Get base URL from environment
export const API_BASE_URL = (typeof import.meta !== 'undefined' 
  ? import.meta.env?.VITE_API_BASE_URL 
  : '') || '';

/**
 * Resolve image path to full URL
 * Handles relative paths from backend and ensures proper URL format
 * 
 * @param path - Image path (e.g., "/uploads/events/abc123.jpg" or full URL)
 * @returns Full URL to the image (with /api prefix for uploads)
 */
export function resolveImageUrl(path: string | null | undefined): string {
  if (!path) return '';
  
  // Already a full URL
  if (path.startsWith('http://') || path.startsWith('https://')) {
    // Check if it's our API URL but missing /api prefix for uploads
    if (path.includes('/uploads/') && !path.includes('/api/uploads/')) {
      return path.replace('/uploads/', '/api/uploads/');
    }
    return path;
  }
  
  // Data URL (base64)
  if (path.startsWith('data:')) {
    return path;
  }
  
  // Clean the base URL (remove trailing slash)
  const baseUrl = API_BASE_URL.replace(/\/$/, '');
  
  // Ensure path starts with /
  let cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  // Add /api prefix for uploads path (backend serves images at /api/uploads/...)
  if (cleanPath.startsWith('/uploads/')) {
    cleanPath = `/api${cleanPath}`;
  }
  
  return `${baseUrl}${cleanPath}`;
}

/**
 * Image categories supported by the API
 */
export type ImageCategory = 'events' | 'proofs' | 'rewards';

/**
 * Upload response from the API
 */
export interface UploadResponse {
  success: boolean;
  url: string;
  image_hash: string;
  image_id: number;
  message: string;
  error?: string;
}

/**
 * Upload an image to the server
 * 
 * @param file - File to upload
 * @param category - Image category (events, proofs, rewards)
 * @param token - Authorization token
 * @returns Upload response with URL and metadata
 */
export async function uploadImage(
  file: File,
  category: ImageCategory = 'events',
  token?: string
): Promise<UploadResponse> {
  const authToken = token || localStorage.getItem('access_token');
  
  if (!authToken) {
    throw new Error('No authorization token available');
  }
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('subfolder', category);
  
  const response = await fetch(`${API_BASE_URL}/api/images/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`
    },
    body: formData
  });
  
  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error || result.detail || 'Upload failed');
  }
  
  return result;
}

/**
 * Delete an image by ID
 * 
 * @param imageId - Image ID to delete
 * @param token - Authorization token
 */
export async function deleteImage(imageId: number, token?: string): Promise<void> {
  const authToken = token || localStorage.getItem('access_token');
  
  if (!authToken) {
    throw new Error('No authorization token available');
  }
  
  const response = await fetch(`${API_BASE_URL}/api/images/${imageId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  });
  
  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.error || result.detail || 'Delete failed');
  }
}

/**
 * Get image info by ID
 * 
 * @param imageId - Image ID
 * @param token - Authorization token
 */
export async function getImageInfo(imageId: number, token?: string): Promise<any> {
  const authToken = token || localStorage.getItem('access_token');
  
  if (!authToken) {
    throw new Error('No authorization token available');
  }
  
  const response = await fetch(`${API_BASE_URL}/api/images/${imageId}`, {
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  });
  
  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.error || result.detail || 'Failed to get image info');
  }
  
  return response.json();
}

/**
 * List images with optional filtering
 * 
 * @param options - Filter options
 * @param token - Authorization token
 */
export async function listImages(
  options: {
    category?: ImageCategory;
    skip?: number;
    limit?: number;
  } = {},
  token?: string
): Promise<{ total: number; images: any[] }> {
  const authToken = token || localStorage.getItem('access_token');
  
  if (!authToken) {
    throw new Error('No authorization token available');
  }
  
  const params = new URLSearchParams();
  if (options.category) params.append('category', options.category);
  if (options.skip !== undefined) params.append('skip', String(options.skip));
  if (options.limit !== undefined) params.append('limit', String(options.limit));
  
  const response = await fetch(
    `${API_BASE_URL}/api/images/list?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    }
  );
  
  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.error || result.detail || 'Failed to list images');
  }
  
  return response.json();
}

/**
 * Validate file before upload
 * 
 * @param file - File to validate
 * @returns Validation result
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const maxSizeBytes = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.heic'];
  
  // Check file size
  if (file.size > maxSizeBytes) {
    return { 
      valid: false, 
      error: `File size exceeds 5MB limit (${(file.size / 1024 / 1024).toFixed(2)}MB)` 
    };
  }
  
  // Check file type
  if (!allowedTypes.includes(file.type.toLowerCase())) {
    const ext = file.name.toLowerCase().split('.').pop();
    if (!ext || !allowedExtensions.includes(`.${ext}`)) {
      return { 
        valid: false, 
        error: `Invalid file type. Allowed: ${allowedExtensions.join(', ')}` 
      };
    }
  }
  
  return { valid: true };
}

/**
 * Create a preview URL from a File object
 * Remember to revoke the URL when done using URL.revokeObjectURL()
 * 
 * @param file - File to create preview for
 * @returns Object URL for preview
 */
export function createPreviewUrl(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Default placeholder gradient for failed images
 */
export const PLACEHOLDER_GRADIENT = 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #1e293b 100%)';

/**
 * Get placeholder image URL
 */
export function getPlaceholderImage(width = 400, height = 300): string {
  return `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"%3E%3Crect fill="%231e293b" width="${width}" height="${height}"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23475569" font-size="48"%3E📷%3C/text%3E%3C/svg%3E`;
}
