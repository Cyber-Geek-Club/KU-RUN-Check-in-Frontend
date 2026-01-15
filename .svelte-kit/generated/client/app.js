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
	() => import('./nodes/18')
];

export const server_loads = [];

export const dictionary = {
		"/": [2],
		"/auth/forgot-password": [3],
		"/auth/login": [4],
		"/auth/register": [5],
		"/auth/reset-password": [6],
		"/auth/verify-email": [7],
		"/officer/event-list": [8],
		"/officer/monthly-reward": [9],
		"/officer/myevents-upcoming": [10],
		"/officer/setting-account": [11],
		"/organizer": [12],
		"/organizer/create-event": [13],
		"/student": [14],
		"/student/event-list": [15],
		"/student/monthly-reward": [16],
		"/student/myevents-upcoming": [17],
		"/student/setting-account": [18]
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