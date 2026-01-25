export function clearAllStorage(): void {
  if (typeof window !== 'undefined') {
    localStorage.clear();
    sessionStorage.clear();
  }
}

export function clearSessionOnly(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.clear();
  }
}

export function clearAuthOnly(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('token_expiry');
  }
}

export function clearDraftOnly(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('draft_event_form');
    sessionStorage.removeItem('editing_event_id');
  }
}

export function handleLogoutCleanup(): void {
  if (typeof window !== 'undefined') {
    const lang = localStorage.getItem('app_language');
    
    clearAuthOnly();
    clearSessionOnly();
    clearDraftOnly();
    
    // Restore language preference
    if (lang) {
      localStorage.setItem('app_language', lang);
    }
  }
}

export function getStorageSize(storage: Storage): number {
  let total = 0;
  for (let key in storage) {
    if (storage.hasOwnProperty(key)) {
      total += storage[key].length + key.length;
    }
  }
  return total;
}

export function getStorageStats() {
  if (typeof window === 'undefined') return null;
  
  const limit = 5 * 1024 * 1024; // 5MB
  
  return {
    localStorage: {
      used: getStorageSize(localStorage),
      limit,
      percentage: (getStorageSize(localStorage) / limit) * 100
    },
    sessionStorage: {
      used: getStorageSize(sessionStorage),
      limit,
      percentage: (getStorageSize(sessionStorage) / limit) * 100
    }
  };
}