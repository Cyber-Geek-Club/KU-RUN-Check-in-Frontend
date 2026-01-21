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
	() => import('./nodes/22'),
	() => import('./nodes/23'),
	() => import('./nodes/24'),
	() => import('./nodes/25'),
	() => import('./nodes/26'),
	() => import('./nodes/27'),
	() => import('./nodes/28'),
	() => import('./nodes/29'),
	() => import('./nodes/30'),
	() => import('./nodes/31')
];

export const server_loads = [];

export const dictionary = {
		"/": [4],
		"/auth/forgot-password": [5],
		"/auth/login": [6],
		"/auth/register": [7],
		"/auth/reset-password": [8],
		"/auth/verify-email": [9],
		"/officer/event-list": [10],
		"/officer/monthly-reward": [11],
		"/officer/myevents-upcoming": [12],
		"/officer/setting-account": [13],
		"/organizer/create-event": [14,[2,3]],
		"/organizer/create-event/capacity": [15,[2,3]],
		"/organizer/create-event/general": [16,[2,3]],
		"/organizer/create-event/rewards": [17,[2,3]],
		"/organizer/create-event/summary": [18,[2,3]],
		"/organizer/events": [19,[2]],
		"/organizer/events/[id]": [20,[2]],
		"/organizer/logs": [21,[2]],
		"/organizer/rewards": [22,[2]],
		"/organizer/settings": [23,[2]],
		"/organizer/unlock": [24,[2]],
		"/organizer/verify-code": [25,[2]],
		"/organizer/verify-proof": [26,[2]],
		"/student": [27],
		"/student/event-list": [28],
		"/student/monthly-reward": [29],
		"/student/myevents-upcoming": [30],
		"/student/setting-account": [31]
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