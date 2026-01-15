import { goto } from '$app/navigation';
import type { UserRole } from './routes';
import { ROUTES } from './routes';

/**
 * Navigate to event list for the current role
 */
export function navigateToEventList(role: UserRole) {
  if (role === 'student') {
    return goto(ROUTES.student.eventList);
  } else if (role === 'officer') {
    return goto(ROUTES.officer.eventList);
  } else {
    return goto(ROUTES.organizer.eventList);
  }
}

/**
 * Navigate to my events for the current role
 */
export function navigateToMyEvents(role: UserRole) {
  if (role === 'student') {
    return goto(ROUTES.student.myEvents);
  } else if (role === 'officer') {
    return goto(ROUTES.officer.myEvents);
  } else {
    return goto(ROUTES.organizer.myEvents);
  }
}

/**
 * Navigate to settings for the current role
 */
export function navigateToSettings(role: UserRole) {
  if (role === 'student') {
    return goto(ROUTES.student.settings);
  } else if (role === 'officer') {
    return goto(ROUTES.officer.settings);
  } else {
    return goto(ROUTES.organizer.settings);
  }
}

/**
 * Navigate to home for the current role
 */
export function navigateToHome(role: UserRole) {
  if (role === 'student') {
    return goto(ROUTES.student.eventList);
  } else if (role === 'officer') {
    return goto(ROUTES.officer.eventList);
  } else {
    return goto(ROUTES.organizer.eventList);
  }
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
      return goto(ROUTES.organizer.eventLog || ROUTES.organizer.home);
    default:
      return goto('/');
  }
}
