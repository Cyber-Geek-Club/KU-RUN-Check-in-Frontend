export function safeSetItem(
  storage: 'localStorage' | 'sessionStorage',
  key: string,
  value: any
): boolean {
  try {
    if (typeof window === 'undefined') return false;
    
    const storageObj = storage === 'localStorage' ? localStorage : sessionStorage;
    const serialized = JSON.stringify(value);
    
    if (serialized.length > 1024 * 1024) {
      console.warn(`⚠️ Large storage item: ${key} (${(serialized.length / 1024).toFixed(2)} KB)`);
    }
    
    storageObj.setItem(key, serialized);
    return true;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.error('❌ Storage quota exceeded! Clearing old data...');
      if (typeof window !== 'undefined') {
        sessionStorage.clear();
      }
      return false;
    }
    console.error(`❌ Failed to save to ${storage}:`, error);
    return false;
  }
}

export function safeGetItem<T>(
  storage: 'localStorage' | 'sessionStorage',
  key: string,
  defaultValue: T
): T {
  try {
    if (typeof window === 'undefined') return defaultValue;
    
    const storageObj = storage === 'localStorage' ? localStorage : sessionStorage;
    const item = storageObj.getItem(key);
    
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`❌ Failed to read from ${storage}:`, error);
    return defaultValue;
  }
}

export function safeRemoveItem(
  storage: 'localStorage' | 'sessionStorage',
  key: string
): boolean {
  try {
    if (typeof window === 'undefined') return false;
    
    const storageObj = storage === 'localStorage' ? localStorage : sessionStorage;
    storageObj.removeItem(key);
    return true;
  } catch (error) {
    console.error(`❌ Failed to remove from ${storage}:`, error);
    return false;
  }
}