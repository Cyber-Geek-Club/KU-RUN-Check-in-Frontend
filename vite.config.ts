import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		proxy: {
			// เมื่อไหร่ก็ตามที่ Frontend ยิงไปที่ /api
			'/api': {
				target: 'http://158.108.102.14:8001', // ให้ส่งต่อไปที่ IP นี้แทน
				changeOrigin: true,
				secure: false,
			}
		}
	}
});