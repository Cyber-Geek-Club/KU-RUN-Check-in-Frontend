
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	export interface AppTypes {
		RouteId(): "/" | "/auth" | "/auth/forgot-password" | "/auth/login" | "/auth/register" | "/auth/reset-password" | "/auth/verify-email" | "/officer" | "/officer/event-list" | "/officer/monthly-reward copy" | "/officer/monthly-reward" | "/officer/myevents-upcoming" | "/officer/setting-account" | "/organizer" | "/organizer/create-event" | "/organizer/event-log" | "/organizer/event-verify" | "/organizer/monthly-reward" | "/organizer/setting-account" | "/organizer/unlock-user" | "/organizer/upload-proof" | "/student" | "/student/event-list" | "/student/monthly-reward" | "/student/myevents-upcoming" | "/student/setting-account";
		RouteParams(): {
			
		};
		LayoutParams(): {
			"/": Record<string, never>;
			"/auth": Record<string, never>;
			"/auth/forgot-password": Record<string, never>;
			"/auth/login": Record<string, never>;
			"/auth/register": Record<string, never>;
			"/auth/reset-password": Record<string, never>;
			"/auth/verify-email": Record<string, never>;
			"/officer": Record<string, never>;
			"/officer/event-list": Record<string, never>;
			"/officer/monthly-reward copy": Record<string, never>;
			"/officer/monthly-reward": Record<string, never>;
			"/officer/myevents-upcoming": Record<string, never>;
			"/officer/setting-account": Record<string, never>;
			"/organizer": Record<string, never>;
			"/organizer/create-event": Record<string, never>;
			"/organizer/event-log": Record<string, never>;
			"/organizer/event-verify": Record<string, never>;
			"/organizer/monthly-reward": Record<string, never>;
			"/organizer/setting-account": Record<string, never>;
			"/organizer/unlock-user": Record<string, never>;
			"/organizer/upload-proof": Record<string, never>;
			"/student": Record<string, never>;
			"/student/event-list": Record<string, never>;
			"/student/monthly-reward": Record<string, never>;
			"/student/myevents-upcoming": Record<string, never>;
			"/student/setting-account": Record<string, never>
		};
		Pathname(): "/" | "/auth" | "/auth/" | "/auth/forgot-password" | "/auth/forgot-password/" | "/auth/login" | "/auth/login/" | "/auth/register" | "/auth/register/" | "/auth/reset-password" | "/auth/reset-password/" | "/auth/verify-email" | "/auth/verify-email/" | "/officer" | "/officer/" | "/officer/event-list" | "/officer/event-list/" | "/officer/monthly-reward copy" | "/officer/monthly-reward copy/" | "/officer/monthly-reward" | "/officer/monthly-reward/" | "/officer/myevents-upcoming" | "/officer/myevents-upcoming/" | "/officer/setting-account" | "/officer/setting-account/" | "/organizer" | "/organizer/" | "/organizer/create-event" | "/organizer/create-event/" | "/organizer/event-log" | "/organizer/event-log/" | "/organizer/event-verify" | "/organizer/event-verify/" | "/organizer/monthly-reward" | "/organizer/monthly-reward/" | "/organizer/setting-account" | "/organizer/setting-account/" | "/organizer/unlock-user" | "/organizer/unlock-user/" | "/organizer/upload-proof" | "/organizer/upload-proof/" | "/student" | "/student/" | "/student/event-list" | "/student/event-list/" | "/student/monthly-reward" | "/student/monthly-reward/" | "/student/myevents-upcoming" | "/student/myevents-upcoming/" | "/student/setting-account" | "/student/setting-account/";
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): "/logo-ku.png" | string & {};
	}
}