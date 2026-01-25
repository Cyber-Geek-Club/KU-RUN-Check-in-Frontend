export function createUTCISOFromBangkok(dateStr: string, timeStr: string): string {
  try {
    const [yearStr, monthStr, dayStr] = dateStr.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);
    const timeParts = timeStr.trim().split(':');
    const hour = parseInt(timeParts[0].trim(), 10);
    const minute = parseInt(timeParts[1].trim(), 10);
    
    const bangkokTimestamp = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
    const bangkokOffsetMs = 7 * 60 * 60 * 1000;
    const utcTimestamp = bangkokTimestamp - bangkokOffsetMs;
    
    return new Date(utcTimestamp).toISOString();
  } catch (err: any) {
    console.error("❌ Error in createUTCISOFromBangkok:", err.message);
    throw err;
  }
}

export function parseAPIDate(dateStr: string) {
  const d = new Date(dateStr);
  return {
    day: d.getDate().toString(),
    month: (d.getMonth() + 1).toString(),
    year: d.getFullYear().toString(),
  };
}

export function formatFullDate(dateInput: any, language: string = 'th'): string {
  if (!dateInput || dateInput === '-' || dateInput === '') return '-';

  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return '-';

    const locale = language === 'en' ? 'en-GB' : 'th-TH';

    return date.toLocaleString(locale, {
      timeZone: 'Asia/Bangkok',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  } catch (error) {
    return '-';
  }
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatDate(date: Date | string | null | undefined, format: 'short' | 'long' = 'short'): string {
  if (date === null || date === undefined || date === '' || date === '-') return '-';

  try {
    const d: Date = typeof date === 'string' ? new Date(date) : date as Date;
    if (!(d instanceof Date) || isNaN(d.getTime())) return '-';

    if (format === 'short') {
      return d.toLocaleDateString('th-TH', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }

    return d.toLocaleDateString('th-TH', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  } catch (err) {
    return '-';
  }
}