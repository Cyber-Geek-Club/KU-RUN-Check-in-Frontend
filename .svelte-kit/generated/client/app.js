export { matchers } from './matchers.js';

export const nodes = [
	() => import('./nodes/0'),
	() => import('./nodes/1'),
	() => import('./nodes/2'),
	() => import('./nodes/3'),
	() => import('./nodes/4'),
	() => import('./nodes/5'),
	() => import('./nodes/6'),
	() => import('./nodes/7'),
	() => import('./nodes/8'),
	() => import('./nodes/9'),
	() => import('./nodes/10'),
	() => import('./nodes/11'),
	() => import('./nodes/12'),
	() => import('./nodes/13'),
	() => import('./nodes/14'),
	() => import('./nodes/15'),
	() => import('./nodes/16'),
	() => import('./nodes/17'),
	() => import('./nodes/18'),
	() => import('./nodes/19'),
	() => import('./nodes/20'),
	() => import('./nodes/21'),
	() => import('./nodes/22')
];

export const server_loads = [];

export const dictionary = {
		"/": [3],
		"/auth/forgot-password": [4],
		"/auth/login": [5],
		"/auth/register": [6],
		"/auth/reset-password": [7],
		"/auth/verify-email": [8],
		"/officer/event-list": [9],
		"/officer/monthly-reward copy": [11],
		"/officer/monthly-reward": [10],
		"/officer/myevents-upcoming": [12],
		"/officer/setting-account": [13],
		"/organizer/create-event": [14],
		"/organizer/event-verify": [15],
		"/organizer/monthly-reward": [16],
		"/organizer/setting-account": [17],
		"/organizer/upload-proof": [18],
		"/student/event-list": [19],
		"/student/monthly-reward": [20],
		"/student/myevents-upcoming": [21],
		"/student/setting-account": [22]
	};

export const hooks = {
	handleError: (({ error }) => { console.error(error) }),
	
	reroute: (() => {}),
	transport: {}
};

export const decoders = Object.fromEntries(Object.entries(hooks.transport).map(([k, v]) => [k, v.decode]));
export const encoders = Object.fromEntries(Object.entries(hooks.transport).map(([k, v]) => [k, v.encode]));

export const hash = false;

export const decode = (type, value) => decoders[type](value);

export { default as root } from '../root.js';