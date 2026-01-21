export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function validateRequired(value: any): boolean {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  return value !== null && value !== undefined;
}

export function validateNumber(value: any, min?: number, max?: number): boolean {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) return false;
  if (min !== undefined && num < min) return false;
  if (max !== undefined && num > max) return false;
  
  return true;
}

export function validateDate(dateStr: string): boolean {
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

export function validateDateRange(startDate: string, endDate: string): boolean {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return false;
  
  return start <= end;
}

export function validateTime(timeStr: string): boolean {
  const re = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return re.test(timeStr);
}

export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export interface ValidationErrors {
  [key: string]: string;
}

export function buildValidationErrors(
  fields: { [key: string]: any },
  rules: { [key: string]: (value: any) => string | null }
): Map<string, string> {
  const errors = new Map<string, string>();
  
  for (const [field, value] of Object.entries(fields)) {
    const rule = rules[field];
    if (rule) {
      const error = rule(value);
      if (error) {
        errors.set(field, error);
      }
    }
  }
  
  return errors;
}