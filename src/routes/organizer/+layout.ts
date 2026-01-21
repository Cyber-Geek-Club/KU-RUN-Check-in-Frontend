// src/routes/organizer/+layout.ts
import { redirect } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ url }) => {
  // 🔒 AUTHENTICATION CHECK
  if (typeof window !== 'undefined') {
    const currentPath = window.location.pathname || url.pathname;

    if (currentPath.startsWith('/auth')) {
      return { timestamp: new Date().toISOString() };
    }

    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');

    // No tokens = not authenticated
    if (!accessToken || !refreshToken) {
      // Removed noisy console message to avoid spamming logs in any environment
      throw redirect(303, '/auth/login');
    }
    
    try {
      const tokenParts = accessToken.split('.');
      if (tokenParts.length !== 3) {
        console.error('❌ Invalid token format');
        localStorage.clear();
        sessionStorage.clear();
        throw redirect(303, '/auth/login');
      }
      
      // ✅ เหลือไว้แค่นี้พอ (ลบส่วนเช็ค payload.exp < now ทิ้งไป)
      // การทำแบบนี้จะยอมให้หน้าเว็บโหลดขึ้นมาได้แม้ Token หมดอายุ
      // จากนั้น client.ts จะตรวจเจอ 401 และทำการ Refresh Token ให้อัตโนมัติเองครับ
      
    } catch (error: any) {
      // ✅ ตรวจสอบว่าเป็น Redirect Error หรือไม่
      if (error?.status === 303 || error?.location) {
        throw error;
      }

      console.error('❌ Token validation error:', error);
      localStorage.clear();
      sessionStorage.clear();
      if (!currentPath.startsWith('/auth')) throw redirect(303, '/auth/login');
    }
  }
  
  return {
    timestamp: new Date().toISOString(),
  };
};

export const ssr = false;
export const prerender = false;