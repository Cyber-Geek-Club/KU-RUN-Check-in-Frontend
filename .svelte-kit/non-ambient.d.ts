
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
		RouteId(): "/" | "/createevent-officer-2" | "/createevent-officer" | "/eventlist" | "/eventverify-officer" | "/login" | "/monthly-reward-officer" | "/monthly-reward-user" | "/myevents-upcoming" | "/notFound" | "/register" | "/reset-password-2" | "/reset-password-3" | "/reset-password-4" | "/reset-password" | "/setting-account-officer" | "/setting-account-student" | "/upload-proof-officer";
		RouteParams(): {
			
		};
		LayoutParams(): {
			"/": Record<string, never>;
			"/createevent-officer-2": Record<string, never>;
			"/createevent-officer": Record<string, never>;
			"/eventlist": Record<string, never>;
			"/eventverify-officer": Record<string, never>;
			"/login": Record<string, never>;
			"/monthly-reward-officer": Record<string, never>;
			"/monthly-reward-user": Record<string, never>;
			"/myevents-upcoming": Record<string, never>;
			"/notFound": Record<string, never>;
			"/register": Record<string, never>;
			"/reset-password-2": Record<string, never>;
			"/reset-password-3": Record<string, never>;
			"/reset-password-4": Record<string, never>;
			"/reset-password": Record<string, never>;
			"/setting-account-officer": Record<string, never>;
			"/setting-account-student": Record<string, never>;
			"/upload-proof-officer": Record<string, never>
		};
		Pathname(): "/" | "/createevent-officer-2" | "/createevent-officer-2/" | "/createevent-officer" | "/createevent-officer/" | "/eventlist" | "/eventlist/" | "/eventverify-officer" | "/eventverify-officer/" | "/login" | "/login/" | "/monthly-reward-officer" | "/monthly-reward-officer/" | "/monthly-reward-user" | "/monthly-reward-user/" | "/myevents-upcoming" | "/myevents-upcoming/" | "/notFound" | "/notFound/" | "/register" | "/register/" | "/reset-password-2" | "/reset-password-2/" | "/reset-password-3" | "/reset-password-3/" | "/reset-password-4" | "/reset-password-4/" | "/reset-password" | "/reset-password/" | "/setting-account-officer" | "/setting-account-officer/" | "/setting-account-student" | "/setting-account-student/" | "/upload-proof-officer" | "/upload-proof-officer/";
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): "/logo-ku.png" | string & {};
	}
}