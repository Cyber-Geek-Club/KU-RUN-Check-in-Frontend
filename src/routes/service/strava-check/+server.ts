// ไฟล์: src/routes/api/strava-check/+server.ts
import { json } from '@sveltejs/kit';

export async function POST({ request }) {
    console.log("📥 API strava-check ถูกเรียกใช้งาน");

    try {
        // 1. ลองอ่าน JSON จาก Frontend
        let body;
        try {
            body = await request.json();
        } catch (e) {
            console.error("❌ อ่าน Body ไม่ได้:", e);
            return json({ success: false, message: 'Invalid JSON Body' }, { status: 400 });
        }

        const url = body.url;
        if (!url) {
            return json({ success: false, message: 'ไม่พบ URL ส่งมา' }, { status: 400 });
        }

        console.log(`🚀 กำลังดึงข้อมูลจาก: ${url}`);

        // 2. ตั้ง Headers หลอกว่าเป็น Browser (สำคัญมากสำหรับ Strava)
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        };

        // 3. ยิง Request
        const res = await fetch(url, {
            method: 'GET',
            headers: headers,
            redirect: 'follow' // ให้ตาม Redirect อัตโนมัติ
        });

        console.log(`📡 Strava Status: ${res.status}`);

        if (!res.ok) {
            // ถ้า Strava ตอบกลับมาไม่ใช่ 200 (เช่น 404, 403)
            return json({ success: false, message: `เข้าถึง Strava ไม่ได้ (Status: ${res.status})` }, { status: 400 });
        }

        const html = await res.text();
        
        // Debug: ถ้า html สั้นผิดปกติ แสดงว่าโดนบล็อก
        if (html.length < 500) {
            console.warn("⚠️ HTML สั้นผิดปกติ อาจโดน Captcha หรือ Block");
        }

        const data = {
            distance: 0,
            moving_time: 0,
            date: ''
        };

        // --- Logic หาระยะทาง ---
        // ใช้ Regex แบบปลอดภัย (?. เพื่อกัน Crash)
        const distMatch = html.match(/"distance"\s*:\s*([\d\.]+)/);
        if (distMatch && distMatch[1]) {
            data.distance = parseFloat(distMatch[1]);
        }

        // --- Logic หาเวลา ---
        const timeKeys = ['moving_time', 'elapsed_time', 'time_seconds'];
        for (const key of timeKeys) {
            const regex = new RegExp(`"${key}"\\s*:\\s*(\\d+)`);
            const match = html.match(regex);
            if (match && match[1]) {
                const val = parseInt(match[1]);
                if (val > 0) {
                    data.moving_time = val;
                    break;
                }
            }
        }

        // Fallback หาเวลาจาก Text ถ้าหาใน JSON ไม่เจอ
        if (data.moving_time === 0) {
            const allText = html.replace(/<[^>]*>/g, ' '); 
            
            const hmMatch = allText.match(/(\d+)h\s+(\d+)m/);
            if (hmMatch) {
                data.moving_time = (parseInt(hmMatch[1]) * 3600) + (parseInt(hmMatch[2]) * 60);
            } else {
                const msMatch = allText.match(/(\d+)m\s+(\d+)s/);
                if (msMatch) {
                    data.moving_time = (parseInt(msMatch[1]) * 60) + parseInt(msMatch[2]);
                }
            }
        }

        // --- Logic หาวันที่ ---
        const dateRegex = html.match(/"(start_date_local|startDateLocal|startDate)"\s*:\s*"([^"]+)"/);
        if (dateRegex && dateRegex[2]) {
            data.date = dateRegex[2];
        }

        // แปลงหน่วย
        const distanceKm = data.distance > 0 ? data.distance / 1000 : 0;
        
        console.log(`✅ ผลลัพธ์: Dist=${distanceKm}, Time=${data.moving_time}`);

        if (distanceKm > 0) {
            return json({
                success: true,
                data: {
                    distance_km: parseFloat(distanceKm.toFixed(2)),
                    moving_time_seconds: data.moving_time,
                    date: data.date,
                    original_url: url
                }
            });
        } else {
            // ไม่เจอข้อมูล แต่ไม่ Error 500
            return json({ success: false, message: 'ไม่พบตัวเลขระยะทางในลิงก์นี้ (อาจเป็น Private Activity)' }, { status: 200 });
        }

    } catch (error: any) {
        // 🛡️ ดักจับ Error ทุกอย่างที่ทำให้ Server Crash แล้วส่ง JSON กลับไปแทน
        console.error("🔥 SERVER CRASHED:", error);
        return json({ 
            success: false, 
            message: `Server Internal Error: ${error.message}` 
        }, { status: 500 });
    }
}