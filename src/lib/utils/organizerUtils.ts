// ==========================================
// 🛠️ UTILITY FUNCTIONS
// ==========================================

/**
 * Convert Bangkok local time to UTC ISO string for backend
 * @param dateStr - Date string in YYYY-MM-DD format
 * @param timeStr - Time string in HH:MM format
 * @returns ISO string in UTC
 */
export function createUTCISOFromBangkok(dateStr: string, timeStr: string): string {
  try {
    const [yearStr, monthStr, dayStr] = dateStr.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);
    const timeParts = timeStr.trim().split(":");
    const hour = parseInt(timeParts[0].trim(), 10);
    const minute = parseInt(timeParts[1].trim(), 10);

    // Create Date object using UTC and subtract 7 hours to convert Bangkok to UTC
    const bangkokTimestamp = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
    const bangkokOffsetMs = 7 * 60 * 60 * 1000;
    const utcTimestamp = bangkokTimestamp - bangkokOffsetMs;

    return new Date(utcTimestamp).toISOString();
  } catch (err: any) {
    console.error("❌ Error in createUTCISOFromBangkok:", err.message);
    throw err;
  }
}

/**
 * Format date for display
 * @param dateString - ISO date string or date value
 * @param language - Language code ('th' | 'en')
 * @returns Formatted date string
 */
export function formatDate(dateString: string | Date, language: string = "en"): string {
  if (!dateString) return "-";
  
  try {
    const date = typeof dateString === "string" ? new Date(dateString) : dateString;
    if (isNaN(date.getTime())) return "-";
    
    const locale = language === "en" ? "en-GB" : "th-TH";
    return date.toLocaleDateString(locale, {
      timeZone: "Asia/Bangkok",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch (error) {
    return "-";
  }
}

/**
 * Format date range for display
 * @param startDate - Start date string
 * @param endDate - End date string
 * @param language - Language code
 * @returns Formatted date range string
 */
export function formatDateRange(startDate: string, endDate: string, language: string = "en"): string {
  const start = formatDate(startDate, language);
  const end = formatDate(endDate, language);
  
  if (start === end) return start;
  return `${start} - ${end}`;
}

/**
 * Format timestamp for display (includes time)
 * @param timestamp - ISO timestamp string
 * @param language - Language code
 * @returns Formatted timestamp string
 */
export function formatTimestamp(timestamp: string, language: string = "en"): string {
  if (!timestamp || timestamp === "-" || timestamp === "") return "-";

  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return "-";

    const locale = language === "en" ? "en-GB" : "th-TH";
    return date.toLocaleString(locale, {
      timeZone: "Asia/Bangkok",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  } catch (error) {
    return "-";
  }
}

/**
 * Format time only
 * @param timestamp - ISO timestamp or time string
 * @returns Formatted time string (HH:MM)
 */
export function formatTime(timestamp: string): string {
  if (!timestamp) return "-";
  
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      // Try parsing as time string (HH:MM)
      if (timestamp.includes(":")) return timestamp;
      return "-";
    }
    
    return date.toLocaleTimeString("en-GB", {
      timeZone: "Asia/Bangkok",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return "-";
  }
}

/**
 * Process image URL - add base URL if relative path
 * @param url - Image URL or path
 * @param baseUrl - API base URL
 * @returns Full image URL
 */
export function processImageUrl(url: string | null | undefined, baseUrl: string): string | null {
  if (!url) return null;
  
  // Already a full URL
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  
  // Convert /uploads/ to /api/uploads/ for backend static files
  if (url.includes("/uploads/") && !url.includes("/api/uploads/")) {
    url = url.replace("/uploads/", "/api/uploads/");
  }
  
  return `${baseUrl}${url}`;
}

/**
 * Debounce function for search inputs
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * Throttle function for scroll handlers
 * @param func - Function to throttle
 * @param limit - Minimum time between calls
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Get month index from month name
 * @param monthName - Month name (English)
 * @returns Month index (0-11)
 */
export function getMonthIndex(monthName: string): number {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const index = months.findIndex(m => m.toLowerCase() === monthName.toLowerCase());
  return index >= 0 ? index : 0;
}

/**
 * Get month name from index
 * @param index - Month index (0-11)
 * @returns Month name
 */
export function getMonthName(index: number): string {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return months[index] || "January";
}

/**
 * Validate email format
 * @param email - Email string to validate
 * @returns True if valid email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Decode JWT token (basic decode without verification)
 * @param token - JWT token string
 * @returns Decoded payload or null
 */
export function decodeJWT(token: string): { exp?: number; iat?: number } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch {
    return null;
  }
}

/**
 * Get time left until token expiration
 * @param token - JWT token string (optional, reads from localStorage)
 * @returns Seconds until expiration, or -1 if invalid/expired
 */
export function getTokenTimeLeft(token?: string): number {
  const accessToken = token || localStorage.getItem("access_token");
  if (!accessToken) return -1;

  const decoded = decodeJWT(accessToken);
  if (!decoded || !decoded.exp) return -1;

  const now = Math.floor(Date.now() / 1000);
  const remaining = decoded.exp - now;
  
  return remaining > 0 ? remaining : -1;
}

/**
 * Filter cache for memoization
 */
const filterCache = new Map<string, { result: any; timestamp: number }>();
const CACHE_TTL = 3000; // 3 seconds

/**
 * Get cached result or compute new value
 * @param cacheKey - Unique key for caching
 * @param computeFn - Function to compute value if not cached
 * @returns Cached or computed value
 */
export function getCachedOrCompute<T>(cacheKey: string, computeFn: () => T): T {
  const cached = filterCache.get(cacheKey);
  const now = Date.now();

  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.result as T;
  }

  const result = computeFn();
  filterCache.set(cacheKey, { result, timestamp: now });

  // Cleanup old entries (keep max 30)
  if (filterCache.size > 30) {
    const iterator = filterCache.keys();
    const oldest = iterator.next().value;
    if (oldest) filterCache.delete(oldest);
  }

  return result;
}

/**
 * Generate array of days (1-31)
 */
export function generateDays(): string[] {
  return Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0"));
}

/**
 * Generate array of months
 */
export function generateMonths(): string[] {
  return [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
}

/**
 * Generate array of years (current year ± range)
 * @param range - Number of years before and after current year
 */
export function generateYears(range: number = 5): string[] {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: range * 2 + 1 }, (_, i) => 
    String(currentYear - range + i)
  );
}

/**
 * Generate array of hours (00-23)
 */
export function generateHours(): string[] {
  return Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
}

/**
 * Generate array of minutes (00-59, step by 5)
 */
export function generateMinutes(): string[] {
  return Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));
}

/**
 * Check if a date is a weekend
 * @param date - Date to check
 * @returns True if Saturday or Sunday
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/**
 * Get all dates between two dates
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Array of date strings (YYYY-MM-DD)
 */
export function getDatesBetween(startDate: Date, endDate: Date): string[] {
  const dates: string[] = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    dates.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
}

/**
 * Get weekend dates between two dates
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Array of weekend date strings (YYYY-MM-DD)
 */
export function getWeekendDatesBetween(startDate: Date, endDate: Date): string[] {
  return getDatesBetween(startDate, endDate).filter(dateStr => {
    const date = new Date(dateStr);
    return isWeekend(date);
  });
}

/**
 * Sleep/delay utility
 * @param ms - Milliseconds to sleep
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Safe JSON parse
 * @param str - String to parse
 * @param fallback - Fallback value if parsing fails
 */
export function safeJSONParse<T>(str: string, fallback: T): T {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

/**
 * Truncate text with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
}

/**
 * Generate random string
 * @param length - Length of string
 */
export function generateRandomString(length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
