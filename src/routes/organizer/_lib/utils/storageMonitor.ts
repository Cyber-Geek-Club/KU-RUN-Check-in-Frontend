import { getStorageSize, getStorageStats } from './storage';

export function logStorageWarnings(): void {
  if (typeof window === 'undefined') return;
  
  const stats = getStorageStats();
  if (!stats) return;
  
  if (stats.localStorage.percentage > 80) {
    console.warn(
      `⚠️ localStorage is ${stats.localStorage.percentage.toFixed(1)}% full (${(stats.localStorage.used / 1024).toFixed(2)} KB used)`
    );
  }
  
  if (stats.sessionStorage.percentage > 80) {
    console.warn(
      `⚠️ sessionStorage is ${stats.sessionStorage.percentage.toFixed(1)}% full (${(stats.sessionStorage.used / 1024).toFixed(2)} KB used)`
    );
  }
}

export function startStorageMonitoring(intervalMs: number = 60000): () => void {
  if (typeof window === 'undefined') return () => {};
  
  const intervalId = setInterval(() => {
    logStorageWarnings();
  }, intervalMs);
  
  return () => clearInterval(intervalId);
}

export function getStorageReport(): string {
  const stats = getStorageStats();
  if (!stats) return 'Storage stats unavailable';
  
  return `
Storage Report:
- localStorage: ${(stats.localStorage.used / 1024).toFixed(2)} KB / ${(stats.localStorage.limit / 1024).toFixed(2)} KB (${stats.localStorage.percentage.toFixed(1)}%)
- sessionStorage: ${(stats.sessionStorage.used / 1024).toFixed(2)} KB / ${(stats.sessionStorage.limit / 1024).toFixed(2)} KB (${stats.sessionStorage.percentage.toFixed(1)}%)
  `.trim();
}