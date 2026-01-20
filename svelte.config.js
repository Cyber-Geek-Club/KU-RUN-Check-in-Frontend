// svelte.config.js
import adapter from '@sveltejs/adapter-node'; // <--- ต้องใช้ตัวนี้
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter() // จะสร้างโฟลเดอร์ build ให้
	}
};

export default config;