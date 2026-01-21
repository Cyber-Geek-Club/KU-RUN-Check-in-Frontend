import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		headers: {
			// Allow camera, microphone, and geolocation
			'Permissions-Policy': 'camera=*, microphone=*, geolocation=*'
		},
		proxy: {
			// เมื่อไหร่ก็ตามที่ Frontend ยิงไปที่ /api
			'/api': {
				target: 'http://localhost:8001', // ให้ส่งต่อไปที่ localhost แทน
				changeOrigin: true,
				secure: false,
			}
		}
	}
});
