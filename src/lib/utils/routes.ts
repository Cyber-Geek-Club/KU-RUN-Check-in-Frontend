// Centralized routing configuration for the application
export type UserRole = 'student' | 'officer' | 'organizer';

/**
 * Application routes organized by user role
 */
export const ROUTES = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
    verifyEmail: '/auth/verify-email',
  },
  student: {
    home: '/student',
    eventList: '/student/event-list',
    myEvents: '/student/myevents-upcoming',
    monthlyReward: '/student/monthly-reward',
    settings: '/student/setting-account',
  },
  officer: {
    home: '/officer',
    eventList: '/officer/event-list',
    myEvents: '/officer/myevents-upcoming',
    monthlyReward: '/officer/monthly-reward',
    settings: '/officer/setting-account',
  },
  organizer: {
    home: '/organizer',
    createEvent: '/organizer/create-event',
    eventLog: '/organizer/event-log',
    eventVerify: '/organizer/event-verify',
    monthlyReward: '/organizer/monthly-reward',
    unlockUser: '/organizer/unlock-user',
    uploadProof: '/organizer/upload-proof',
    settings: '/organizer/setting-account',
  },
} as const;

/**
 * Get routes for a specific role
 */
export function getRoutesForRole(role: UserRole) {
  return ROUTES[role];
}

/**
 * Get home path for a specific role
 */
export function getHomePath(role: UserRole): string {
  return ROUTES[role].eventList || ROUTES[role].home;
}

/**
 * Check if a path belongs to a specific role
 */
export function isRolePath(path: string, role: UserRole): boolean {
  return path.startsWith(`/${role}`);
}

/**
 * Extract role from path
 */
export function getRoleFromPath(path: string): UserRole | null {
  if (path.startsWith('/student')) return 'student';
  if (path.startsWith('/officer')) return 'officer';
  if (path.startsWith('/organizer')) return 'organizer';
  return null;
}
