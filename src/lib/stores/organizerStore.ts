// ==========================================
// 🏪 ORGANIZER SHARED STORE
// ==========================================
import { writable, derived, type Writable } from 'svelte/store';

// ==========================================
// 🌐 INTERNATIONALIZATION (i18n)
// ==========================================
export type Language = 'th' | 'en';

function createLanguageStore() {
  // Load saved language preference - default to 'th' if not set
  let initialLang: Language = 'th';
  if (typeof localStorage !== 'undefined') {
    const savedLang = localStorage.getItem('app_language');
    if (savedLang === 'th' || savedLang === 'en') {
      initialLang = savedLang;
    } else {
      localStorage.setItem('app_language', 'th');
    }
  }

  const { subscribe, set, update } = writable<Language>(initialLang);

  return {
    subscribe,
    toggle: () => {
      update(lang => {
        const newLang = lang === 'th' ? 'en' : 'th';
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('app_language', newLang);
        }
        return newLang;
      });
    },
    set: (lang: Language) => {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('app_language', lang);
      }
      set(lang);
    }
  };
}

export const currentLang = createLanguageStore();

// ==========================================
// 📝 TRANSLATIONS
// ==========================================
export const translations = {
  th: {
    // Modal - Approve/Reject Submission
    approveSubmission: "ยืนยันการตรวจสอบหลักฐาน",
    approveSubmissionDesc: "คุณแน่ใจหรือไม่ว่าต้องการยืนยันหลักฐานนี้?",
    approve: "อนุมัติ",
    cancel: "ยกเลิก",
    statusChangesTo: "สถานะเปลี่ยนเป็น",
    completed: "เสร็จสิ้น",
    distance: "ระยะทาง",
    systemAutoAssigns: "ระบบจะจัดสรรรางวัลให้อัตโนมัติ",
    yesApprove: "ใช่, อนุมัติ",
    rejectSubmission: "ปฏิเสธหลักฐาน",
    rejectSubmissionDesc: "กรุณาเลือกเหตุผลในการปฏิเสธ:",
    unclearImage: "รูปภาพไม่ชัดเจน",
    unclearImageDesc: "รูปภาพเบลอ มืด หรืออ่านข้อมูลไม่ได้",
    incorrectData: "ข้อมูลไม่ถูกต้อง",
    incorrectDataDesc: "ระยะทางหรือเวลาไม่ตรงตามเงื่อนไข",
    duplicate: "ซ้ำซ้อน",
    duplicateDesc: "หลักฐานนี้ถูกส่งมาแล้ว",
    otherReason: "เหตุผลอื่น",
    otherReasonDesc: "โปรดระบุเหตุผลเพิ่มเติม",
    confirmReject: "ยืนยันการปฏิเสธ",
    
    // Navigation & Header
    organizer: "ผู้จัดงาน",
    events: "กิจกรรม",
    createEvent: "สร้างกิจกรรม",
    verifyProof: "ตรวจสอบหลักฐาน",
    activityLogs: "ประวัติกิจกรรม",
    rewards: "รางวัล",
    settings: "ตั้งค่า",
    settingsDesc: "อัปเดตข้อมูลโปรไฟล์ของคุณ",
    profileInfo: "ข้อมูลโปรไฟล์",
    saving: "กำลังบันทึก...",
    logout: "ออกจากระบบ",
    navigation: "เมนู",

    // Event Log
    eventLog: "บันทึกกิจกรรม",
    eventLogDesc: "ดูบันทึกการเข้าร่วมและประวัติ",
    noParticipantsYet: "ยังไม่มีผู้เข้าร่วม",
    noOneJoined: "ยังไม่มีใครเข้าร่วมกิจกรรมนี้",
    errorLoadingData: "เกิดข้อผิดพลาดในการโหลดข้อมูล",

    // Verify Code
    verifyCodeDesc: "ตรวจสอบผู้เข้าร่วมด้วยรหัส PIN",
    verifyParticipant: "ตรวจสอบผู้เข้าร่วม",
    enterPinCheckIn: "กรอกรหัส PIN 5 หลักเพื่อเช็คอิน",
    enterPinCheckOut: "กรอกรหัส PIN 5 หลักเพื่อเช็คเอาท์",
    enterFullCode: "กรุณากรอกรหัส 5 หลักให้ครบ",
    participant: "ผู้เข้าร่วม",
    checkInSuccess: "เช็คอินสำเร็จ!",
    hasBeenCheckedIn: "ได้เช็คอินแล้ว",
    hasBeenCheckedOut: "ได้เช็คเอาท์แล้ว",
    invalidCodeOrFailed: "รหัสไม่ถูกต้องหรือดำเนินการไม่สำเร็จ",
    verifying: "กำลังตรวจสอบ...",

    // Unlock User
    unlockUser: "ปลดล็อคผู้ใช้",
    unlockUserDesc: "คืนสิทธิ์การเข้าถึงบัญชีที่ถูกล็อค",
    organizerInfoMissing: "ไม่พบข้อมูลผู้จัด กรุณาเข้าสู่ระบบใหม่",
    enterValidEmail: "กรุณากรอกอีเมลที่ถูกต้อง",
    userNotFound: "ไม่พบผู้ใช้ที่มีอีเมลนี้",
    confirmUnlockFor: "ยืนยันปลดล็อคสำหรับ",
    yesUnlock: "ใช่ ปลดล็อค",
    unlocked: "ปลดล็อคแล้ว!",
    userUnlockedSuccess: "บัญชีผู้ใช้ถูกปลดล็อคสำเร็จ",
    somethingWentWrong: "เกิดข้อผิดพลาด",
    systemError: "เกิดข้อผิดพลาดของระบบ",

    // Monthly Reward
    monthlyReward: "รางวัลประจำเดือน",
    monthlyRewardDesc: "ติดตามและจัดการรางวัลผู้เข้าร่วม",

    // Verify Proof
    verifyProofDesc: "ตรวจสอบและยืนยันหลักฐานจากผู้เข้าร่วม",
    loadEventsFailed: "โหลดกิจกรรมไม่สำเร็จ",

    // Event List
    eventList: "รายการกิจกรรม",
    searchEvents: "ค้นหากิจกรรม...",
    allMonths: "ทุกเดือน",
    allYears: "ทุกปี",
    noEventsFound: "ไม่พบกิจกรรม",
    participants: "ผู้เข้าร่วม",
    slots: "ที่นั่ง",
    active: "เปิดใช้งาน",
    inactive: "ปิดใช้งาน",
    published: "เผยแพร่แล้ว",
    draft: "ฉบับร่าง",
    closed: "ปิดแล้ว",
    edit: "แก้ไข",
    delete: "ลบ",
    view: "ดู",
    noDescription: "ไม่มีรายละเอียด",
    holidaysOff: "วันหยุด",
    noResults: "ไม่พบผลลัพธ์",
    viewDetails: "ดูรายละเอียด",

    // Create/Edit Event
    createNewEvent: "สร้างกิจกรรมใหม่",
    editEvent: "แก้ไขกิจกรรม",
    eventName: "ชื่อกิจกรรม",
    description: "รายละเอียด",
    location: "สถานที่",
    startDate: "วันที่เริ่ม",
    endDate: "วันที่สิ้นสุด",
    startTime: "เวลาเริ่ม",
    endTime: "เวลาสิ้นสุด",
    capacity: "จำนวนที่นั่ง",
    day: "วัน",
    month: "เดือน",
    year: "ปี",
    holidays: "วันหยุด",
    excludeWeekends: "ไม่รวมวันเสาร์-อาทิตย์",
    specificDates: "เลือกวันที่เฉพาะ",
    noHolidays: "ไม่มีวันหยุด",
    save: "บันทึก",
    update: "อัพเดท",
    create: "สร้าง",
    uploadImage: "อัพโหลดรูปภาพ",
    removeImage: "ลบรูปภาพ",
    isPublic: "เผยแพร่",
    isActive: "เปิดใช้งาน",
    required: "จำเป็น",
    publish: "เผยแพร่",

    // Event Type
    eventTypeTitle: "ประเภทกิจกรรม",
    singleDay: "วันเดียว",
    multiDay: "หลายวัน",
    singleDayDesc: "กิจกรรมจัดขึ้นในวันเดียว เช็คอินได้ 1 ครั้ง",
    multiDayDesc: "กิจกรรมหลายวัน สามารถเช็คอินได้หลายครั้ง",
    maxCheckinsPerUser: "จำนวนเช็คอินสูงสุดต่อคน",
    allowDailyCheckin: "อนุญาตเช็คอินรายวัน",
    checkinTimes: "ครั้ง",

    // Rewards
    rewardTiers: "ระดับรางวัล",
    addTier: "เพิ่มระดับ",
    tierName: "ชื่อระดับ",
    quota: "โควต้า",
    requirement: "เงื่อนไข",
    rounds: "รอบ",

    // Verify Proof
    proofSubmissions: "หลักฐานที่ส่งมา",
    reject: "ปฏิเสธ",
    pending: "รอตรวจสอบ",
    approved: "อนุมัติแล้ว",
    rejected: "ปฏิเสธแล้ว",
    verifyCode: "ตรวจรหัส",
    unlock: "ปลดล็อค",
    enterCode: "กรอกรหัส",
    scanQR: "สแกน QR",
    verifyBtn: "ตรวจสอบ",
    clearBtn: "ล้าง",
    autoCheckIn: "เช็คอินอัตโนมัติ",
    cameraAccess: "เข้าถึงกล้อง",
    startCamera: "เปิดกล้อง",
    stopCamera: "ปิดกล้อง",
    scanning: "กำลังสแกน...",

    // Logs
    logs: "ประวัติ",
    action: "การกระทำ",
    status: "สถานะ",
    timestamp: "เวลา",
    user: "ผู้ใช้",
    viewLogs: "ดูประวัติ",
    activityHistory: "ประวัติกิจกรรม",
    noLogs: "ไม่มีประวัติ",
    exportLogs: "ส่งออกประวัติ",
    filterByAction: "กรองตามการกระทำ",
    filterByStatus: "กรองตามสถานะ",
    actionJoined: "ลงทะเบียน",
    actionCheckedIn: "เช็คอิน",
    actionCompleted: "สำเร็จ",
    actionCancelled: "ยกเลิก",
    actionRejected: "ถูกปฏิเสธ",
    joinCode: "รหัสเข้าร่วม",
    joinedAt: "ลงทะเบียนเมื่อ",
    checkedInAt: "เช็คอินเมื่อ",
    completedAt: "สำเร็จเมื่อ",
    cancelledAt: "ยกเลิกเมื่อ",
    proofSubmittedAt: "ส่งหลักฐานเมื่อ",
    lastUpdated: "อัปเดตล่าสุด",
    viewProofImage: "ดูหลักฐาน",
    cancellationReason: "เหตุผลการยกเลิก",

    // Verify Code Page
    participantCheckIn: "เช็คอินผู้เข้าร่วม",
    participantCheckOut: "เช็คเอาท์ผู้เข้าร่วม",
    verifyParticipantCode: "ตรวจสอบรหัสผู้เข้าร่วมเพื่อเช็คอิน",
    verifyParticipantCodeOut: "ตรวจสอบรหัสผู้เข้าร่วมเพื่อเช็คเอาท์หลังจบกิจกรรม",
    pinCode: "รหัส PIN",
    checkIn: "เช็คอิน",
    checkOut: "เช็คเอาท์",
    enterDigitCode: "กรอกรหัส 5 หลัก",
    autoCheckInEnabled: "เปิดเช็คอินอัตโนมัติ",
    autoCheckOutEnabled: "เปิดเช็คเอาท์อัตโนมัติ",
    pressCheckIn: "กด เช็คอิน เพื่อยืนยัน",
    pressCheckOut: "กด เช็คเอาท์ เพื่อยืนยัน",
    checkOutSuccess: "เช็คเอาท์สำเร็จ",
    autoProcess: "อัตโนมัติ",

    // Unlock Page
    unlockAccount: "ปลดล็อคบัญชี",
    enterEmailToRestore: "กรอกอีเมลของผู้ใช้เพื่อกู้คืนการเข้าถึง",
    userEmailAddress: "อีเมลผู้ใช้",
    enterEmailPlaceholder: "กรอกอีเมล",

    // Verify Proof Page
    verifyProofTitle: "ตรวจสอบหลักฐาน",
    apply: "ใช้งาน",
    reset: "รีเซ็ต",
    inProgress: "กำลังดำเนินการ",
    notStarted: "ยังไม่เริ่ม",
    progress: "ความคืบหน้า",

    // Reward Page
    globalRank: "อันดับรวม",
    tierRank: "อันดับใน Tier",
    progressTo: "ความคืบหน้าไป",
    times: "ครั้ง",
    nextTier: "ถัดไป",
    more: "อีก",
    showing: "แสดง",
    of: "จาก",
    users: "ผู้ใช้",
    allTiers: "ทุก Tier",
    sortBy: "เรียงตาม",
    globalBestFirst: "อันดับรวมดีที่สุด",
    globalLowestFirst: "อันดับรวมต่ำที่สุด",
    tierBestFirst: "อันดับ Tier ดีที่สุด",
    tierLowestFirst: "อันดับ Tier ต่ำที่สุด",
    bestFirst: "ดีที่สุด → ต่ำที่สุด",
    lowestFirst: "ต่ำที่สุด → ดีที่สุด",
    sendMessage: "ส่งข้อความ",

    // Common
    loading: "กำลังโหลด...",
    error: "เกิดข้อผิดพลาด",
    success: "สำเร็จ",
    confirm: "ยืนยัน",
    close: "ปิด",
    search: "ค้นหา",
    filter: "กรอง",
    export: "ส่งออก",
    refresh: "รีเฟรช",
    back: "กลับ",
    next: "ถัดไป",
    previous: "ก่อนหน้า",
    total: "ทั้งหมด",
    select: "เลือก",
    all: "ทั้งหมด",
    backToEvents: "กลับไปหน้ากิจกรรม",
    selectEvent: "เลือกกิจกรรม",
    searchByName: "ค้นหาด้วยชื่อ อีเมล หรือรหัสนิสิต...",
    batch: "รุ่น",
    stdId: "รหัส",
    fromDate: "จากวันที่",
    toDate: "ถึงวันที่",
    dateTime: "วันที่และเวลา",
    basicInfo: "ข้อมูลพื้นฐาน",
    schedule: "กำหนดการ",
    eventSettings: "ตั้งค่ากิจกรรม",

    // Messages
    eventCreated: "สร้างกิจกรรมสำเร็จ!",
    eventUpdated: "อัพเดทกิจกรรมสำเร็จ!",
    eventDeleted: "ลบกิจกรรมสำเร็จ!",
    fillAllFields: "กรุณากรอกข้อมูลให้ครบถ้วน",
    invalidDateRange: "ช่วงวันที่ไม่ถูกต้อง",
    confirmDelete: "ยืนยันการลบ?",
    cannotUndo: "การกระทำนี้ไม่สามารถย้อนกลับได้",
    deleteEventTitle: "ลบกิจกรรม?",
    deleteEventText: "คุณแน่ใจหรือไม่ว่าต้องการลบกิจกรรมนี้?",
    yesDelete: "ใช่, ลบเลย",
    deleted: "ลบแล้ว!",
    eventDeletedSuccess: "กิจกรรมถูกลบเรียบร้อยแล้ว",

    // Profile/Settings
    profile: "โปรไฟล์",
    accountSettings: "ตั้งค่าบัญชี",
    manageProfile: "จัดการข้อมูลโปรไฟล์และการตั้งค่า",
    personalInfo: "ข้อมูลส่วนตัว",
    academicInfo: "ข้อมูลการศึกษา",
    departmentInfo: "ข้อมูลแผนก",
    title: "คำนำหน้า",
    firstName: "ชื่อ",
    lastName: "นามสกุล",
    email: "อีเมล",
    emailAddress: "ที่อยู่อีเมล",
    studentId: "รหัสนิสิต",
    faculty: "คณะ",
    major: "สาขา",
    department: "แผนก",
    saveChanges: "บันทึกการเปลี่ยนแปลง",
    selectTitle: "เลือกคำนำหน้า",
    selectFaculty: "เลือกคณะ",
    selectMajor: "เลือกสาขา",
    selectDepartment: "เลือกแผนก",
    enterFirstName: "กรอกชื่อ",
    enterLastName: "กรอกนามสกุล",
    enterEmail: "กรอกอีเมล",
    settingsUpdated: "อัปเดตการตั้งค่าสำเร็จ!",

    // Language
    language: "ภาษา",
    thai: "ไทย",
    english: "English",
    switchToEnglish: "เปลี่ยนเป็น English",
    switchToThai: "Switch to ภาษาไทย",

    // Security
    security: "ความปลอดภัย",
    password: "รหัสผ่าน",
    changePassword: "เปลี่ยนรหัสผ่าน",

    // Create Event Form
    dateAndTime: "วันที่และเวลา",
    startDateLabel: "วันเริ่มต้น",
    endDateLabel: "วันสิ้นสุด",
    startTimeLabel: "เวลาเริ่ม",
    endTimeLabel: "เวลาสิ้นสุด",
    capacityLabel: "จำนวนที่รับ",
    distanceLabel: "ระยะทาง",
    dayPlaceholder: "วัน",
    monthPlaceholder: "เดือน",
    yearPlaceholder: "ปี",
    selectTime: "เลือกเวลา",
    invalidDateRangeMsg: "วันเริ่มต้นต้องไม่อยู่หลังวันสิ้นสุด",
    dateRangeValid: "ช่วงวันที่ถูกต้อง",
    holidaysAndExclusions: "วันหยุดและข้อยกเว้น",
    noHolidaysOption: "ไม่มีวันหยุด",
    excludeWeekendsOption: "ยกเว้นวันเสาร์-อาทิตย์",
    specificDatesOption: "เลือกวันที่เฉพาะ",
    selectHolidayOption: "กรุณาเลือกตัวเลือกวันหยุด",
    holidaysSelected: "วันหยุดที่เลือก",
    clickToSelect: "คลิกวันที่เพื่อเลือก/ยกเลิก",
    rewardsDistribution: "การแจกรางวัล",
    allocated: "จัดสรรแล้ว",
    remainingSlots: "คงเหลือ",
    exceededBy: "เกินไป",
    tierLabel: "ระดับ",
    quotaLabel: "โควต้า",
    requirementLabel: "เงื่อนไข (รอบ)",
    rewardNameLabel: "ชื่อรางวัล",
    addTierBtn: "+ เพิ่มระดับ",
    removeTier: "ลบระดับ",
    enterQuota: "กรอกจำนวน",
    enterRounds: "กรอกจำนวนรอบ",
    enterRewardName: "กรอกชื่อรางวัล",
    unlockRewards: "กรอก จำนวนที่รับ ก่อนเพื่อปลดล็อครางวัล",
    rankRange: "อันดับ",
    eventStatusTitle: "สถานะกิจกรรม",
    publicVisibility: "เปิดเผยต่อสาธารณะ",
    activeOpen: "เปิดใช้งาน",
    statusLive: "พร้อมรับผู้เข้าร่วม",
    statusLiveDesc: "กิจกรรมเปิดให้ลงทะเบียนและแสดงต่อสาธารณะ",
    statusDraftLabel: "ฉบับร่าง",
    statusDraftDesc: "กิจกรรมยังไม่เปิดให้ลงทะเบียน",
    proofInfo: "ข้อมูลหลักฐาน",
    submittedAt: "ส่งเมื่อ",
    stravaLink: "ลิงก์ Strava",
    actualDistance: "ระยะทางจริง",
    noStravaLink: "ไม่มีลิงก์",
    pendingSubmissions: "รอตรวจสอบ",
    totalActions: "การกระทำทั้งหมด",
    todayActions: "วันนี้",
    recentActivity: "กิจกรรมล่าสุด",
    viewRewards: "ดูรางวัล",
    rewardManagement: "จัดการรางวัล",
    noRewards: "ไม่มีรางวัล",
    rewardStatus: "สถานะรางวัล",
    claimed: "รับแล้ว",
    unclaimed: "ยังไม่รับ",
    totalRewards: "รางวัลทั้งหมด",
    sendNotification: "ส่งการแจ้งเตือน",
    notificationSent: "ส่งการแจ้งเตือนสำเร็จ",
  },
  en: {
    // Modal - Approve/Reject Submission
    approveSubmission: "Approve Submission",
    approveSubmissionDesc: "Are you sure you want to verify this proof?",
    approve: "Approve",
    cancel: "Cancel",
    statusChangesTo: "Status changes to",
    completed: "COMPLETED",
    distance: "Distance",
    systemAutoAssigns: "System auto-assigns rewards",
    yesApprove: "Yes, Approve",
    rejectSubmission: "Reject Submission",
    rejectSubmissionDesc: "Please select a reason for rejection:",
    unclearImage: "Unclear Image",
    unclearImageDesc: "Photo is blurry, dark, or data is unreadable.",
    incorrectData: "Incorrect Data",
    incorrectDataDesc: "Distance or time does not match requirements.",
    duplicate: "Duplicate",
    duplicateDesc: "This proof has already been submitted.",
    otherReason: "Other Reason",
    otherReasonDesc: "Specify a custom reason below.",
    confirmReject: "Confirm Reject",

    // Navigation & Header
    organizer: "ORGANIZER",
    events: "Events",
    createEvent: "Create Event",
    verifyProof: "Verify Proof",
    activityLogs: "Activity Logs",
    rewards: "Rewards",
    settings: "Settings",
    settingsDesc: "Update your profile information",
    profileInfo: "Profile Information",
    saving: "SAVING...",
    logout: "Logout",
    navigation: "NAVIGATION",

    // Event Log
    eventLog: "EVENT LOG",
    eventLogDesc: "View participation logs and history",
    noParticipantsYet: "No Participants Yet",
    noOneJoined: "No one has joined this event yet",
    errorLoadingData: "Error Loading Data",

    // Verify Code
    verifyCodeDesc: "Verify participants with PIN code",
    verifyParticipant: "Verify Participant",
    enterPinCheckIn: "Enter the participant's 5-digit PIN code to check-in.",
    enterPinCheckOut: "Enter the participant's 5-digit PIN code to check-out.",
    enterFullCode: "Please enter the full 5-digit code.",
    participant: "Participant",
    checkInSuccess: "Check-in Successful!",
    hasBeenCheckedIn: "has been checked in.",
    hasBeenCheckedOut: "has been checked out.",
    invalidCodeOrFailed: "Invalid code or operation failed",
    verifying: "Verifying...",

    // Unlock User
    unlockUser: "UNLOCK USER",
    unlockUserDesc: "Restore access to locked accounts",
    organizerInfoMissing: "Organizer info missing. Please login again.",
    enterValidEmail: "Please enter a valid email address.",
    userNotFound: "User with this email not found.",
    confirmUnlockFor: "Confirm unlock for",
    yesUnlock: "Yes, Unlock",
    unlocked: "Unlocked!",
    userUnlockedSuccess: "User account has been successfully unlocked.",
    somethingWentWrong: "Something went wrong.",
    systemError: "System error occurred.",

    // Monthly Reward
    monthlyReward: "MONTHLY REWARD",
    monthlyRewardDesc: "Track and manage participant rewards",

    // Verify Proof
    verifyProofDesc: "Review and verify participant submissions",
    loadEventsFailed: "Failed to load events",

    // Event List
    eventList: "Event List",
    searchEvents: "Search events...",
    allMonths: "All Months",
    allYears: "All Years",
    noEventsFound: "No events found",
    participants: "Participants",
    slots: "Slots",
    active: "Active",
    inactive: "Inactive",
    published: "Published",
    draft: "Draft",
    closed: "Closed",
    edit: "Edit",
    delete: "Delete",
    view: "View",
    noDescription: "No description",
    holidaysOff: "Days off",
    noResults: "No results found",
    viewDetails: "View Details",

    // Create/Edit Event
    createNewEvent: "Create New Event",
    editEvent: "Edit Event",
    eventName: "Event Name",
    description: "Description",
    location: "Location",
    startDate: "Start Date",
    endDate: "End Date",
    startTime: "Start Time",
    endTime: "End Time",
    capacity: "Capacity",
    day: "Day",
    month: "Month",
    year: "Year",
    holidays: "Holidays",
    excludeWeekends: "Exclude Weekends",
    specificDates: "Specific Dates",
    noHolidays: "No Holidays",
    save: "Save",
    update: "Update",
    create: "Create",
    uploadImage: "Upload Image",
    removeImage: "Remove Image",
    isPublic: "Published",
    isActive: "Active",
    required: "Required",
    publish: "Publish",

    // Event Type
    eventTypeTitle: "Event Type",
    singleDay: "Single Day",
    multiDay: "Multi Day",
    singleDayDesc: "One-day event with single check-in",
    multiDayDesc: "Multi-day event with multiple check-ins allowed",
    maxCheckinsPerUser: "Max Check-ins Per User",
    allowDailyCheckin: "Allow Daily Check-in",
    checkinTimes: "times",

    // Rewards
    rewardTiers: "Reward Tiers",
    addTier: "Add Tier",
    tierName: "Tier Name",
    quota: "Quota",
    requirement: "Requirement",
    rounds: "rounds",

    // Verify Proof
    proofSubmissions: "Proof Submissions",
    reject: "Reject",
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    verifyCode: "Verify Code",
    unlock: "Unlock",
    enterCode: "Enter Code",
    scanQR: "Scan QR",
    verifyBtn: "Verify",
    clearBtn: "Clear",
    autoCheckIn: "Auto Check-in",
    cameraAccess: "Camera Access",
    startCamera: "Start Camera",
    stopCamera: "Stop Camera",
    scanning: "Scanning...",

    // Logs
    logs: "Logs",
    action: "Action",
    status: "Status",
    timestamp: "Timestamp",
    user: "User",
    viewLogs: "View Logs",
    activityHistory: "Activity History",
    noLogs: "No logs",
    exportLogs: "Export Logs",
    filterByAction: "Filter by Action",
    filterByStatus: "Filter by Status",
    actionJoined: "Joined",
    actionCheckedIn: "Checked In",
    actionCompleted: "Completed",
    actionCancelled: "Cancelled",
    actionRejected: "Rejected",
    joinCode: "Join Code",
    joinedAt: "Joined",
    checkedInAt: "Checked In",
    completedAt: "Completed",
    cancelledAt: "Cancelled",
    proofSubmittedAt: "Proof Submitted",
    lastUpdated: "Last updated",
    viewProofImage: "View Proof Image",
    cancellationReason: "Cancellation Reason",

    // Verify Code Page
    participantCheckIn: "Participant Check-in",
    participantCheckOut: "Participant Check-out",
    verifyParticipantCode: "Verify participant's code to complete check-in",
    verifyParticipantCodeOut: "Verify participant's code to complete check-out after event",
    pinCode: "PIN Code",
    checkIn: "CHECK IN",
    checkOut: "CHECK OUT",
    enterDigitCode: "Enter 5-digit code",
    autoCheckInEnabled: "Auto check-in enabled",
    autoCheckOutEnabled: "Auto check-out enabled",
    pressCheckIn: "Press CHECK IN to verify",
    pressCheckOut: "Press CHECK OUT to verify",
    checkOutSuccess: "Check-out Successful",
    autoProcess: "Auto",

    // Unlock Page
    unlockAccount: "Unlock Account",
    enterEmailToRestore: "Enter the user's email address to restore their access",
    userEmailAddress: "User Email Address",
    enterEmailPlaceholder: "Enter email address",

    // Verify Proof Page
    verifyProofTitle: "Verify Proof",
    apply: "Apply",
    reset: "Reset",
    inProgress: "In Progress",
    notStarted: "Not Started",
    progress: "Progress",

    // Reward Page
    globalRank: "Global Rank",
    tierRank: "Tier Rank",
    progressTo: "Progress to",
    times: "times",
    nextTier: "Next",
    more: "more",
    showing: "Showing",
    of: "of",
    users: "users",
    allTiers: "All Tiers",
    sortBy: "Sort by",
    globalBestFirst: "Global Best First",
    globalLowestFirst: "Global Lowest First",
    tierBestFirst: "Tier Best First",
    tierLowestFirst: "Tier Lowest First",
    bestFirst: "Best → Lowest",
    lowestFirst: "Lowest → Best",
    sendMessage: "Send Message",

    // Common
    loading: "Loading...",
    error: "Error",
    success: "Success",
    confirm: "Confirm",
    close: "Close",
    search: "Search",
    filter: "Filter",
    export: "Export",
    refresh: "Refresh",
    back: "Back",
    next: "Next",
    previous: "Previous",
    total: "Total",
    select: "Select",
    all: "All",
    backToEvents: "Back to Events",
    selectEvent: "Select Event",
    searchByName: "Search by name, email, or Nisit ID...",
    batch: "Batch",
    stdId: "Std ID",
    fromDate: "From Date",
    toDate: "To Date",
    dateTime: "Date & Time",
    basicInfo: "Basic Information",
    schedule: "Schedule",
    eventSettings: "Event Settings",

    // Messages
    eventCreated: "Event created successfully!",
    eventUpdated: "Event updated successfully!",
    eventDeleted: "Event deleted successfully!",
    fillAllFields: "Please fill in all required fields",
    invalidDateRange: "Invalid date range",
    confirmDelete: "Confirm delete?",
    cannotUndo: "This action cannot be undone",
    deleteEventTitle: "Delete Event?",
    deleteEventText: "Are you sure you want to delete this event?",
    yesDelete: "Yes, Delete",
    deleted: "Deleted!",
    eventDeletedSuccess: "Event has been deleted successfully",

    // Profile/Settings
    profile: "Profile",
    accountSettings: "Account Settings",
    manageProfile: "Manage your profile information and preferences",
    personalInfo: "Personal Information",
    academicInfo: "Academic Information",
    departmentInfo: "Department Information",
    title: "Title",
    firstName: "First Name",
    lastName: "Last Name",
    email: "Email",
    emailAddress: "Email Address",
    studentId: "Student ID",
    faculty: "Faculty",
    major: "Major",
    department: "Department",
    saveChanges: "Save Changes",
    selectTitle: "Select Title",
    selectFaculty: "Select Faculty",
    selectMajor: "Select Major",
    selectDepartment: "Select Department",
    enterFirstName: "Enter first name",
    enterLastName: "Enter last name",
    enterEmail: "Enter email",
    settingsUpdated: "Settings updated successfully!",

    // Language
    language: "Language",
    thai: "ไทย",
    english: "English",
    switchToEnglish: "Switch to English",
    switchToThai: "เปลี่ยนเป็นภาษาไทย",

    // Security
    security: "Security",
    password: "Password",
    changePassword: "Change Password",

    // Create Event Form
    dateAndTime: "Date & Time",
    startDateLabel: "Start Date",
    endDateLabel: "End Date",
    startTimeLabel: "Start Time",
    endTimeLabel: "End Time",
    capacityLabel: "Capacity",
    distanceLabel: "Distance (km)",
    dayPlaceholder: "Day",
    monthPlaceholder: "Month",
    yearPlaceholder: "Year",
    selectTime: "Select time",
    invalidDateRangeMsg: "Start date must not be later than end date",
    dateRangeValid: "Date range is valid",
    holidaysAndExclusions: "Holidays & Exclusions",
    noHolidaysOption: "No Holidays",
    excludeWeekendsOption: "Exclude Weekends",
    specificDatesOption: "Specific Dates",
    selectHolidayOption: "Please select a holiday option",
    holidaysSelected: "Holidays Selected",
    clickToSelect: "Click dates to select/deselect",
    rewardsDistribution: "Rewards Distribution",
    allocated: "Allocated",
    remainingSlots: "remaining",
    exceededBy: "Exceeded by",
    tierLabel: "Tier",
    quotaLabel: "Quota",
    requirementLabel: "Requirement (rounds)",
    rewardNameLabel: "Reward Name",
    addTierBtn: "+ Add Tier",
    removeTier: "Remove Tier",
    enterQuota: "Enter quota",
    enterRounds: "Enter rounds",
    enterRewardName: "Enter reward name",
    unlockRewards: "Enter Capacity first to unlock rewards",
    rankRange: "Rank",
    eventStatusTitle: "Event Status",
    publicVisibility: "Public Visibility",
    activeOpen: "Active (Open)",
    statusLive: "Ready for Participants",
    statusLiveDesc: "Event is open for registration and visible to public",
    statusDraftLabel: "Draft",
    statusDraftDesc: "Event is not yet open for registration",
    proofInfo: "Proof Information",
    submittedAt: "Submitted at",
    stravaLink: "Strava Link",
    actualDistance: "Actual Distance",
    noStravaLink: "No link",
    pendingSubmissions: "Pending",
    totalActions: "Total Actions",
    todayActions: "Today",
    recentActivity: "Recent Activity",
    viewRewards: "View Rewards",
    rewardManagement: "Reward Management",
    noRewards: "No rewards",
    rewardStatus: "Reward Status",
    claimed: "Claimed",
    unclaimed: "Unclaimed",
    totalRewards: "Total Rewards",
    sendNotification: "Send Notification",
    notificationSent: "Notification sent successfully",
  }
};

// Derived store for current translations
export const lang = derived(currentLang, ($currentLang) => translations[$currentLang]);

// ==========================================
// 📦 TYPE INTERFACES
// ==========================================
export interface RewardTier {
  tier: number;
  name: string;
  quota: number;
  requirement: number;
}

export interface AppEvent {
  id: number;
  title: string;
  description: string;
  location: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  capacity: number;
  distance: number;
  holidays: string[];
  rewards: RewardTier[];
  is_public: boolean;
  is_active: boolean;
  image_url: string | null;
  event_type: 'single' | 'multi';
  max_checkins_per_user: number;
  created_at: string;
  updated_at: string;
  // Computed fields
  year?: string;
  month?: string;
  participant_count?: number;
  rewardConfigId?: number;
  finalized_at?: string;
}

export interface Log {
  id: number;
  event_id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  nisit_id?: string;
  action: 'joined' | 'checked_in' | 'completed' | 'cancelled' | 'rejected';
  join_code?: string;
  joined_at?: string;
  checked_in_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  proof_submitted_at?: string;
  cancellation_reason?: string;
  proof_image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface ProofSubmission {
  id: number;
  odySd: string;
  runnerName: string;
  email: string;
  runnerImage: string | null;
  submitTime: string;
  proofImage: string | null;
  rank?: number;
  stravaLink?: string | null;
  actualDistance?: number | null;
}

export interface RewardUser {
  id: string;
  odySd: string;
  nisitId?: string;
  visitId?: string;
  name: string;
  email: string;
  avatar: string;
  globalRank: number;
  tierRank: number;
  tier: string;
  tierColor: string;
  completedCount: number;
  requiredCount: number;
  nextTierCount: number;
  completedAt: string;
  rewardedAt?: string;
  joinCode: string;
  status: 'completed' | 'in_progress' | 'no_tier';
  userId?: number;
  rewardId?: number;
  rewardTier?: number;
  rewardDescription?: string;
}

// ==========================================
// 🗄️ SHARED STATE STORES
// ==========================================

// Events store
export const eventsStore = writable<AppEvent[]>([]);
export const eventsLoading = writable(false);
export const eventsError = writable('');

// Current user info
export const currentUserId = writable<string>('');
export const authToken = writable<string>('');
export const userRole = writable<string>('');

// Mobile menu state
export const isMobileMenuOpen = writable(false);

// Token time left
export const tokenTimeLeft = writable(0);

// ==========================================
// 🔧 UTILITY FUNCTIONS
// ==========================================

// Convert Bangkok time to UTC ISO string
export function createUTCISOFromBangkok(dateStr: string, timeStr: string): string {
  try {
    const [yearStr, monthStr, dayStr] = dateStr.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);
    const timeParts = timeStr.trim().split(':');
    const hour = parseInt(timeParts[0].trim(), 10);
    const minute = parseInt(timeParts[1].trim(), 10);
    
    const bangkokTimestamp = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
    const bangkokOffsetMs = 7 * 60 * 60 * 1000;
    const utcTimestamp = bangkokTimestamp - bangkokOffsetMs;
    
    return new Date(utcTimestamp).toISOString();
  } catch (err: any) {
    console.error("❌ Error in createUTCISOFromBangkok:", err.message);
    throw err;
  }
}

// Format time from seconds
export function formatTime(seconds: number): string {
  if (seconds <= 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Decode JWT token
export function decodeJWT(token: string): { exp?: number; iat?: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Failed to decode JWT:', e);
    return null;
  }
}

// Get token time left
export function getTokenTimeLeft(): number {
  if (typeof localStorage === 'undefined') return 0;
  const token = localStorage.getItem('access_token');
  if (!token) return 0;
  
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) return 0;
  
  const now = Math.floor(Date.now() / 1000);
  const remaining = decoded.exp - now;
  return Math.max(0, remaining);
}

// Translate event status
export function translateStatus(status: string, currentLang: Language): string {
  const t = translations[currentLang];
  switch (status) {
    case 'Active': return t.active;
    case 'Draft': return t.draft;
    case 'Closed': return t.closed;
    default: return status;
  }
}

// Process image URL
export function processImageUrl(url: string | null, apiBaseUrl: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  if (url.startsWith('/')) {
    return `${apiBaseUrl}${url}`;
  }
  return `${apiBaseUrl}/${url}`;
}

// Debounce function
export function debounce<T extends (...args: any[]) => any>(fn: T, delay: number) {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

// Month names
export const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Month names in Thai
export const monthNamesTh = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];
