
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
		RouteId(): "/" | "/auth" | "/auth/forgot-password" | "/auth/login" | "/auth/register" | "/auth/reset-password" | "/auth/verify-email" | "/officer" | "/officer/event-list" | "/officer/monthly-reward" | "/officer/myevents-upcoming" | "/officer/setting-account" | "/organizer" | "/organizer/_lib" | "/organizer/_lib/api" | "/organizer/_lib/components" | "/organizer/_lib/i18n" | "/organizer/_lib/stores" | "/organizer/_lib/utils" | "/organizer/create-event" | "/organizer/create-event/_components" | "/organizer/create-event/capacity" | "/organizer/create-event/general" | "/organizer/create-event/rewards" | "/organizer/create-event/summary" | "/organizer/events" | "/organizer/events/_components" | "/organizer/events/[id]" | "/organizer/logs" | "/organizer/rewards" | "/organizer/rewards/_components" | "/organizer/settings" | "/organizer/unlock" | "/organizer/verify-code" | "/organizer/verify-proof" | "/student" | "/student/event-list" | "/student/monthly-reward" | "/student/myevents-upcoming" | "/student/setting-account";
		RouteParams(): {
			"/organizer/events/[id]": { id: string }
		};
		LayoutParams(): {
			"/": { id?: string };
			"/auth": Record<string, never>;
			"/auth/forgot-password": Record<string, never>;
			"/auth/login": Record<string, never>;
			"/auth/register": Record<string, never>;
			"/auth/reset-password": Record<string, never>;
			"/auth/verify-email": Record<string, never>;
			"/officer": Record<string, never>;
			"/officer/event-list": Record<string, never>;
			"/officer/monthly-reward": Record<string, never>;
			"/officer/myevents-upcoming": Record<string, never>;
			"/officer/setting-account": Record<string, never>;
			"/organizer": { id?: string };
			"/organizer/_lib": Record<string, never>;
			"/organizer/_lib/api": Record<string, never>;
			"/organizer/_lib/components": Record<string, never>;
			"/organizer/_lib/i18n": Record<string, never>;
			"/organizer/_lib/stores": Record<string, never>;
			"/organizer/_lib/utils": Record<string, never>;
			"/organizer/create-event": Record<string, never>;
			"/organizer/create-event/_components": Record<string, never>;
			"/organizer/create-event/capacity": Record<string, never>;
			"/organizer/create-event/general": Record<string, never>;
			"/organizer/create-event/rewards": Record<string, never>;
			"/organizer/create-event/summary": Record<string, never>;
			"/organizer/events": { id?: string };
			"/organizer/events/_components": Record<string, never>;
			"/organizer/events/[id]": { id: string };
			"/organizer/logs": Record<string, never>;
			"/organizer/rewards": Record<string, never>;
			"/organizer/rewards/_components": Record<string, never>;
			"/organizer/settings": Record<string, never>;
			"/organizer/unlock": Record<string, never>;
			"/organizer/verify-code": Record<string, never>;
			"/organizer/verify-proof": Record<string, never>;
			"/student": Record<string, never>;
			"/student/event-list": Record<string, never>;
			"/student/monthly-reward": Record<string, never>;
			"/student/myevents-upcoming": Record<string, never>;
			"/student/setting-account": Record<string, never>
		};
		Pathname(): "/" | "/auth" | "/auth/" | "/auth/forgot-password" | "/auth/forgot-password/" | "/auth/login" | "/auth/login/" | "/auth/register" | "/auth/register/" | "/auth/reset-password" | "/auth/reset-password/" | "/auth/verify-email" | "/auth/verify-email/" | "/officer" | "/officer/" | "/officer/event-list" | "/officer/event-list/" | "/officer/monthly-reward" | "/officer/monthly-reward/" | "/officer/myevents-upcoming" | "/officer/myevents-upcoming/" | "/officer/setting-account" | "/officer/setting-account/" | "/organizer" | "/organizer/" | "/organizer/_lib" | "/organizer/_lib/" | "/organizer/_lib/api" | "/organizer/_lib/api/" | "/organizer/_lib/components" | "/organizer/_lib/components/" | "/organizer/_lib/i18n" | "/organizer/_lib/i18n/" | "/organizer/_lib/stores" | "/organizer/_lib/stores/" | "/organizer/_lib/utils" | "/organizer/_lib/utils/" | "/organizer/create-event" | "/organizer/create-event/" | "/organizer/create-event/_components" | "/organizer/create-event/_components/" | "/organizer/create-event/capacity" | "/organizer/create-event/capacity/" | "/organizer/create-event/general" | "/organizer/create-event/general/" | "/organizer/create-event/rewards" | "/organizer/create-event/rewards/" | "/organizer/create-event/summary" | "/organizer/create-event/summary/" | "/organizer/events" | "/organizer/events/" | "/organizer/events/_components" | "/organizer/events/_components/" | `/organizer/events/${string}` & {} | `/organizer/events/${string}/` & {} | "/organizer/logs" | "/organizer/logs/" | "/organizer/rewards" | "/organizer/rewards/" | "/organizer/rewards/_components" | "/organizer/rewards/_components/" | "/organizer/settings" | "/organizer/settings/" | "/organizer/unlock" | "/organizer/unlock/" | "/organizer/verify-code" | "/organizer/verify-code/" | "/organizer/verify-proof" | "/organizer/verify-proof/" | "/student" | "/student/" | "/student/event-list" | "/student/event-list/" | "/student/monthly-reward" | "/student/monthly-reward/" | "/student/myevents-upcoming" | "/student/myevents-upcoming/" | "/student/setting-account" | "/student/setting-account/";
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): "/logo-ku.png" | string & {};
	}
}