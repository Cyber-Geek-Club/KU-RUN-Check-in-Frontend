export const endpoints = {
  // Events
  events: {
    list: '/api/events/',
    create: '/api/events/',
    get: (id: number | string) => `/api/events/${id}`,
    update: (id: number | string) => `/api/events/${id}`,
    delete: (id: number | string) => `/api/events/${id}`,
  },
  
  // Participants & Participations (แก้ไขให้ตรงกับ API จริง)
  participations: {
    // 1. [POST] ลงทะเบียนล่วงหน้า (Pre-register)
    preRegister: (eventId: number | string) => `/api/participations/pre-register/${eventId}`,

    // 2. [POST] เช็คอินรายวัน (Organizer สแกน)
    checkInDaily: '/api/participations/check-in-daily',
    // 2b. [POST] เช็คอินแบบ Single-day (บางระบบแยก endpoint)
    checkIn: '/api/participations/check-in',

    // 3. Proofs (ดึงรายการหลักฐาน) - *ใช้ตัวเดิมที่แก้ไปแล้ว*
    listByEvent: (eventId: number | string) => `/api/participations/event/${eventId}/proofs`,
    
    // สำหรับกดอนุมัติ/ปฏิเสธหลักฐาน (Organizer)
    verify: '/api/participations/verify',

    // 4. [POST] ขอ Checkout Code (Participant กดขอ)
    getCheckoutCode: (participationId: number | string) => `/api/participations/${participationId}/checkout-code`,

    // 5. [POST] Checkout (Organizer สแกนเพื่อจบงาน)
    checkout: (participationId: number | string) => `/api/participations/${participationId}/checkout-code`,
    // 6. [POST] Checkout by code/QR (Organizer scans code)
    checkoutByCode: '/api/participations/check-out',
  },
  
  // Proof Submissions
  proofs: {
    list: '/api/proofs',
    approve: (proofId: number | string) => `/api/proofs/${proofId}/approve`,
    reject: (proofId: number | string) => `/api/proofs/${proofId}/reject`,
  },
  
  // ✅ Logs
  logs: {
    list: '/api/logs',
    // ดึงรายการ participant history / snapshots ของกิจกรรม
    getByEvent: (eventId: number | string) => `/api/events/${eventId}/participants/history`,
    // ดึง Logs เฉพาะบุคคล
    getByUser: (eventId: number | string, userId: number | string) => `/api/events/${eventId}/participants/${userId}/logs`,
    websocket: 'ws://localhost:3000/api/logs/stream',
  },
  
  // ✅ Rewards (เพิ่มส่วนที่ขาดหายไป)
  rewards: {
    leaderboard: (eventId: number | string) => `/api/reward-leaderboards/events/${eventId}/users`,
    config: (eventId: number | string) => `/api/reward-leaderboards/configs/event/${eventId}`,
    entries: (configId: number | string) => `/api/reward-leaderboards/configs/${configId}/entries`,
    finalize: (configId: number | string) => `/api/reward-leaderboards/configs/${configId}/finalize`,
    sendMessage: '/api/rewards/send-message',
    
    // [เพิ่มใหม่] สำหรับคำนวณอันดับก่อน Finalize (Preview)
    preview: (configId: number | string) => `/api/reward-leaderboards/configs/${configId}/calculate-ranks`,
    
    // [เพิ่มใหม่] สำหรับสร้าง Reward และ Config (ใช้ตอน Create Event)
    createConfig: '/api/reward-leaderboards/configs',
    createReward: '/api/rewards',
    
    // [เพิ่มใหม่] สำหรับดู Reward ของ User รายคน
    getByUser: (userId: number | string) => `/api/rewards/user/${userId}`,
  },
  
  // Auth
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
  },
  
  // Users
  users: {
    unlock: '/api/users/unlock',
    profile: '/api/users/profile', // legacy/self
    updateProfile: '/api/users/profile', // legacy/self
    changePassword: '/api/users/change-password',
    getById: (userId: number | string) => `/api/users/${userId}`,
    updateById: (userId: number | string) => `/api/users/${userId}`,
  }
};