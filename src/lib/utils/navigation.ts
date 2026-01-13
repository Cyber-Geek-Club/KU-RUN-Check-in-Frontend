import { goto } from '$app/navigation';
import type { UserRole } from './routes';
import { ROUTES } from './routes';

/**
 * Navigate to event list for the current role
 */
export function navigateToEventList(role: UserRole) {
  return goto(ROUTES[role].eventList);
}

/**
 * Navigate to my events for the current role
 */
export function navigateToMyEvents(role: UserRole) {
  return goto(ROUTES[role].myEvents);
}

/**
 * Navigate to settings for the current role
 */
export function navigateToSettings(role: UserRole) {
  return goto(ROUTES[role].settings);
}

/**
 * Navigate to home for the current role
 */
export function navigateToHome(role: UserRole) {
  const routes = ROUTES[role];
  return goto(routes.eventList || routes.home);
}

/**
 * Navigate to login
 */
export function navigateToLogin() {
  return goto(ROUTES.auth.login);
}

/**
 * Navigate based on role after authentication
 */
export function navigateAfterAuth(role: string) {
  const normalizedRole = role.toLowerCase() as UserRole;
  
  switch (normalizedRole) {
    case 'student':
    case 'officer':
      return goto(ROUTES[normalizedRole].eventList);
    case 'organizer':
      return goto(ROUTES.organizer.eventLog);
    default:
      return goto('/');
  }
}
