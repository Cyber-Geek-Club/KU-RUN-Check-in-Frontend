import { W as head, a0 as ensure_array_like, Y as attr_class, a1 as bind_props } from "../../../../chunks/index2.js";
import { o as onDestroy } from "../../../../chunks/index-server.js";
import "sweetalert2";
import "jsqr";
import "@sveltejs/kit/internal";
import "../../../../chunks/exports.js";
import "../../../../chunks/utils.js";
import { e as escape_html, a as attr } from "../../../../chunks/attributes.js";
import "@sveltejs/kit/internal/server";
import "../../../../chunks/state.svelte.js";
import axios from "axios";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let lang, leaderboardStatus, filteredEvents, filteredEventsForReward, filteredRewardUsers, menuItems, startDateObj, endDateObj, isDateRangeValid, availableDates, isAnyLogsFilterActive, logsToDisplay, paginatedLogsForList, filteredEventsForLogs;
    const API_BASE_URL = "http://158.108.102.14:8001".replace(/\/$/, "");
    const api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 3e4,
      headers: { "Content-Type": "application/json" }
    });
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 1e3;
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    api.interceptors.request.use(
      (config) => {
        const token2 = localStorage.getItem("access_token");
        if (token2) {
          config.headers.Authorization = `Bearer ${token2}`;
        }
        config.__retryCount = config.__retryCount || 0;
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
    api.interceptors.response.use((response) => response, async (error) => {
      const config = error.config;
      if (error.response?.status) {
        const status = error.response.status;
        if (status === 401 || status === 403) {
          console.error(`❌ API Error ${status} - Force logout and redirect`);
          if (typeof localStorage !== "undefined") {
            localStorage.clear();
          }
          if (typeof sessionStorage !== "undefined") {
            sessionStorage.clear();
          }
          if (typeof document !== "undefined") {
            document.cookie.split(";").forEach((c) => {
              document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + (/* @__PURE__ */ new Date()).toUTCString() + ";path=/");
            });
          }
          if (typeof window !== "undefined") {
            window.location.href = "/auth/login";
          }
          return Promise.reject(error);
        }
        console.warn(`⚠️ API Error ${status}: ${error.response?.statusText || "Unknown"}`);
        return Promise.reject(error);
      }
      const isNetworkError = !error.response && error.code === "ECONNABORTED";
      if (isNetworkError && config && config.__retryCount < MAX_RETRIES) {
        config.__retryCount += 1;
        console.warn(`🔄 Retry attempt ${config.__retryCount}/${MAX_RETRIES} for ${config.url} (network error)`);
        await delay(RETRY_DELAY * config.__retryCount);
        return api(config);
      }
      console.error("❌ Network error:", error.message || "Unknown network error");
      return Promise.reject(error);
    });
    function filterEventsOptimized(events2, query, month, year) {
      if (!events2 || events2.length === 0) return [];
      const lowerQuery = query.toLowerCase().trim();
      return events2.filter((event) => {
        if (!lowerQuery) return true;
        return event.title.toLowerCase().includes(lowerQuery) || event.location.toLowerCase().includes(lowerQuery);
      });
    }
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", () => {
      });
    }
    let currentLang = "th";
    if (typeof localStorage !== "undefined") {
      const savedLang = localStorage.getItem("app_language");
      if (savedLang === "th" || savedLang === "en") {
        currentLang = savedLang;
      } else {
        localStorage.setItem("app_language", "th");
      }
    }
    const translations = {
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
        logout: "ออกจากระบบ",
        navigation: "เมนู",
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
        // distance: "ระยะทาง", // duplicate, remove
        day: "วัน",
        month: "เดือน",
        year: "ปี",
        holidays: "วันหยุด",
        excludeWeekends: "ไม่รวมวันเสาร์-อาทิตย์",
        specificDates: "เลือกวันที่เฉพาะ",
        noHolidays: "ไม่มีวันหยุด",
        save: "บันทึก",
        // cancel: "ยกเลิก", // duplicate, remove
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
        // approve: "อนุมัติ", // duplicate, remove
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
        // Logs - Action Labels
        actionJoined: "ลงทะเบียน",
        actionCheckedIn: "เช็คอิน",
        actionCompleted: "สำเร็จ",
        actionCancelled: "ยกเลิก",
        actionRejected: "ถูกปฏิเสธ",
        // Logs - Field Labels
        joinCode: "รหัสเข้าร่วม",
        joinedAt: "ลงทะเบียนเมื่อ",
        checkedInAt: "เช็คอินเมื่อ",
        completedAt: "สำเร็จเมื่อ",
        cancelledAt: "ยกเลิกเมื่อ",
        proofSubmittedAt: "ส่งหลักฐานเมื่อ",
        lastUpdated: "อัปเดตล่าสุด",
        viewProofImage: "ดูหลักฐาน",
        cancellationReason: "เหตุผลการยกเลิก",
        // Rewards
        viewRewards: "ดูรางวัล",
        rewardManagement: "จัดการรางวัล",
        noRewards: "ไม่มีรางวัล",
        rewardStatus: "สถานะรางวัล",
        claimed: "รับแล้ว",
        unclaimed: "ยังไม่รับ",
        totalRewards: "รางวัลทั้งหมด",
        sendNotification: "ส่งการแจ้งเตือน",
        notificationSent: "ส่งการแจ้งเตือนสำเร็จ",
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
        // completed: "เสร็จสิ้น", // duplicate, remove
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
        // Create Event Form - Date & Time
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
        // Create Event Form - Holidays
        holidaysAndExclusions: "วันหยุดและข้อยกเว้น",
        noHolidaysOption: "ไม่มีวันหยุด",
        excludeWeekendsOption: "ยกเว้นวันเสาร์-อาทิตย์",
        specificDatesOption: "เลือกวันที่เฉพาะ",
        selectHolidayOption: "กรุณาเลือกตัวเลือกวันหยุด",
        holidaysSelected: "วันหยุดที่เลือก",
        clickToSelect: "คลิกวันที่เพื่อเลือก/ยกเลิก",
        // Create Event Form - Rewards
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
        // Create Event Form - Event Status
        eventStatusTitle: "สถานะกิจกรรม",
        publicVisibility: "เปิดเผยต่อสาธารณะ",
        activeOpen: "เปิดใช้งาน",
        statusLive: "พร้อมรับผู้เข้าร่วม",
        statusLiveDesc: "กิจกรรมเปิดให้ลงทะเบียนและแสดงต่อสาธารณะ",
        statusDraftLabel: "ฉบับร่าง",
        statusDraftDesc: "กิจกรรมยังไม่เปิดให้ลงทะเบียน",
        // Verify Proof
        proofInfo: "ข้อมูลหลักฐาน",
        submittedAt: "ส่งเมื่อ",
        stravaLink: "ลิงก์ Strava",
        actualDistance: "ระยะทางจริง",
        noStravaLink: "ไม่มีลิงก์",
        pendingSubmissions: "รอตรวจสอบ",
        // Logs
        totalActions: "การกระทำทั้งหมด",
        todayActions: "วันนี้",
        recentActivity: "กิจกรรมล่าสุด"
      },
      en: {
        // Modal - Approve/Reject Submission
        approveSubmission: "Approve Submission",
        approveSubmissionDesc: "Are you sure you want to verify this proof?",
        approve: "Approve",
        cancel: "Cancel",
        statusChangesTo: "Status changes to",
        completed: "COMPLETED",
        // distance: "Distance", // duplicate, remove
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
        logout: "Logout",
        navigation: "NAVIGATION",
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
        endDate: "วันสิ้นสุด",
        startTime: "เวลาเริ่มต้น",
        endTime: "เวลาสิ้นสุด",
        capacity: "จำนวนที่รับ",
        distance: "ระยะทาง (กม.)",
        day: "Day",
        month: "Month",
        year: "Year",
        holidays: "Holidays",
        excludeWeekends: "Exclude Weekends",
        specificDates: "Specific Dates",
        noHolidays: "No Holidays",
        save: "Save",
        // cancel: "Cancel", // duplicate, remove
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
        // approve: "Approve", // duplicate, remove
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
        // Logs - Action Labels
        actionJoined: "Joined",
        actionCheckedIn: "Checked In",
        actionCompleted: "Completed",
        actionCancelled: "Cancelled",
        actionRejected: "Rejected",
        // Logs - Field Labels
        joinCode: "Join Code",
        joinedAt: "Joined",
        checkedInAt: "Checked In",
        completedAt: "Completed",
        cancelledAt: "Cancelled",
        proofSubmittedAt: "Proof Submitted",
        lastUpdated: "Last updated",
        viewProofImage: "View Proof Image",
        cancellationReason: "Cancellation Reason",
        // Rewards
        viewRewards: "View Rewards",
        rewardManagement: "Reward Management",
        noRewards: "No rewards",
        rewardStatus: "Reward Status",
        claimed: "Claimed",
        unclaimed: "Unclaimed",
        totalRewards: "Total Rewards",
        sendNotification: "Send Notification",
        notificationSent: "Notification sent successfully",
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
        // completed: "Completed", // duplicate, remove
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
        // Create Event Form - Date & Time
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
        // Create Event Form - Holidays
        holidaysAndExclusions: "Holidays & Exclusions",
        noHolidaysOption: "No Holidays",
        excludeWeekendsOption: "Exclude Weekends",
        specificDatesOption: "Specific Dates",
        selectHolidayOption: "Please select a holiday option",
        holidaysSelected: "Holidays Selected",
        clickToSelect: "Click dates to select/deselect",
        // Create Event Form - Rewards
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
        // Create Event Form - Event Status
        eventStatusTitle: "Event Status",
        publicVisibility: "Public Visibility",
        activeOpen: "Active (Open)",
        statusLive: "Ready for Participants",
        statusLiveDesc: "Event is open for registration and visible to public",
        statusDraftLabel: "Draft",
        statusDraftDesc: "Event is not yet open for registration",
        // Verify Proof
        proofInfo: "Proof Information",
        submittedAt: "Submitted at",
        stravaLink: "Strava Link",
        actualDistance: "Actual Distance",
        noStravaLink: "No link",
        pendingSubmissions: "Pending",
        // Logs
        totalActions: "Total Actions",
        todayActions: "Today",
        recentActivity: "Recent Activity"
      }
    };
    function getLeaderboardStatus() {
      {
        return {
          status: "no_event",
          message: "📋 กรุณาเลือก Event",
          messageEn: "Please select an event",
          color: "#6b7280",
          icon: "info",
          canCalculate: false,
          canFinalize: false
        };
      }
    }
    function debounce(fn, delay2) {
      let timeoutId;
      return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay2);
      };
    }
    let debouncedRewardSearch = "";
    const debouncedUpdateRewardSearch = debounce(
      (q) => {
        debouncedRewardSearch = q;
      },
      250
    );
    let debouncedSearchQuery = "";
    const debouncedUpdateSearch = debounce(
      (q) => {
        debouncedSearchQuery = q;
      },
      250
    );
    let apiBaseUrl = $$props["apiBaseUrl"];
    let token = $$props["token"];
    let organizerId = $$props["organizerId"];
    let verifyProofData = {
      submissions: []
    };
    let verifyProofEventsPage = 1;
    let verifyProofEventsPerPage = 8;
    let verifyProofSearchQuery = "";
    let verifyProofBatchFilter = "";
    let verifyProofStdIdFilter = "";
    let filteredVerifyProofSubmissions = [];
    let verifyProofSubmissionsPage = 1;
    let rewardData = {
      users: [],
      searchQuery: "",
      selectedTier: "All",
      leaderboardFinalized: false
    };
    let timeLeft = 0;
    let debouncedVerifyProofSearch = "";
    const debouncedUpdateVerifyProofSearch = debounce(
      (q) => {
        debouncedVerifyProofSearch = q;
      },
      250
    );
    function getFilteredVerifyProofSubmissions() {
      const subs = verifyProofData.submissions;
      if (!subs || subs.length === 0) return [];
      const query = debouncedVerifyProofSearch.toLowerCase().trim();
      const batchFilter = verifyProofBatchFilter.trim();
      const stdIdFilter = verifyProofStdIdFilter.trim();
      return subs.filter((sub) => {
        if (query) {
          const matchName = sub.runnerName.toLowerCase().includes(query);
          const matchEmail = sub.email?.toLowerCase().includes(query);
          const matchId = sub.odySd?.includes(query);
          if (!matchName && !matchEmail && !matchId) return false;
        }
        if (batchFilter && !sub.odySd?.startsWith(batchFilter)) return false;
        if (stdIdFilter) {
          const stdPart = sub.odySd?.substring(2) || "";
          if (!stdPart.includes(stdIdFilter)) return false;
        }
        return true;
      });
    }
    let lastVerifyProofKey = "";
    let cachedFilteredVerifyProofSubmissions = [];
    let perfHistory = [];
    const MAX_PERF_POINTS = 30;
    let cachedFilteredEventsForReward = [];
    function getFilteredRewardUsersOptimized() {
      const users = rewardData.users;
      if (!users || users.length === 0) return [];
      const query = debouncedRewardSearch.toLowerCase().trim();
      const filtered = users.filter((user) => {
        const safeNisitId = user.nisitId || "";
        if (query) {
          const matchBasic = user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query) || safeNisitId.includes(query);
          const matchYearPrefix = query.length === 2 && /^\d{2}$/.test(query) && safeNisitId.startsWith(query);
          const matchPersonalId = query.length >= 4 && /^\d+$/.test(query) && safeNisitId.slice(-6).includes(query);
          if (!matchBasic && !matchYearPrefix && !matchPersonalId) return false;
        }
        return true;
      });
      return filtered;
    }
    let lastRewardUsersKey = "";
    let cachedFilteredRewardUsers = [];
    let rewardEventsPage = 1;
    const rewardEventsPerPage = 8;
    let rewardUsersPage = 1;
    const rewardUsersPerPage = 8;
    let rewardSortBy = "all";
    let rewardTierFilter = "all";
    let nisitYearFilter = "";
    let nisitIdFilter = "";
    let currentView = "list";
    let logsNisitYearFilter = "";
    let logsNisitIdFilter = "";
    let events = [];
    let timerInterval;
    let searchQueryEventList = "";
    let selectedYearEventList = "All";
    let selectedMonthEventList = "All";
    let currentPage = 1;
    const itemsPerPage = 8;
    let lastFilteredEventsKey = "";
    let cachedFilteredEvents = [];
    let eventsVersion = 0;
    function formatTime(seconds) {
      const hrs = Math.floor(seconds / 3600);
      const mins = Math.floor(seconds % 3600 / 60);
      const secs = seconds % 60;
      return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    onDestroy(() => {
      clearInterval(timerInterval);
    });
    Array.from({ length: 31 }, (_, i) => i + 1);
    const ce_months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December"
    ];
    const ce_currYear = (/* @__PURE__ */ new Date()).getFullYear();
    const ce_years = Array.from({ length: 5 }, (_, i) => ce_currYear + i);
    const ce_timeList = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 30) {
        ce_timeList.push(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`);
      }
    }
    let logsData = {
      logs: [],
      searchQuery: "",
      selectedAction: "All",
      selectedStatus: "All",
      dateFrom: "",
      dateTo: ""
    };
    let filteredLogs = [];
    let eventsForLogsPage = 1;
    const eventsForLogsPerPage = 8;
    const actionTypes = [
      {
        value: "registration",
        label: "Joined",
        labelTh: "ลงทะเบียน",
        icon: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z",
        color: "#3b82f6"
      },
      {
        value: "check_in",
        label: "Checked In",
        labelTh: "เช็คอิน",
        icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
        color: "#06b6d4"
      },
      {
        value: "reward_unlocked",
        label: "Completed",
        labelTh: "สำเร็จ",
        icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
        color: "#10b981"
      },
      {
        value: "registration_cancelled",
        label: "Cancelled",
        labelTh: "ยกเลิก",
        icon: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z",
        color: "#64748b"
      },
      {
        value: "no_show",
        label: "Rejected",
        labelTh: "ถูกปฏิเสธ",
        icon: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z",
        color: "#ef4444"
      }
    ];
    function getActionConfig(action) {
      return actionTypes.find((a) => a.value === action) || actionTypes[0];
    }
    function formatLogDetails(log) {
      const action = log.action;
      const details = log.details || {};
      switch (action) {
        case "registration":
          return `Code: ${details.registrationCode || "-"} • Slot #${details.slotNumber || "-"} • ${details.rewardTier || "-"}`;
        case "check_in":
          return `${details.checkInMethod || "Manual"} • Location: ${details.location || "-"}`;
        case "reward_unlocked":
          return `${details.rewardName || "Reward"} • Rank #${details.rank || "-"}`;
        case "registration_cancelled":
          return `Reason: ${details.reason || "N/A"}${details.refundAmount ? ` • Refund: ฿${details.refundAmount}` : ""}`;
        case "event_updated":
          return `Updated: ${details.changedFields?.join(", ") || "-"}`;
        case "reward_claimed":
          return `${details.rewardName || "Reward"} • ${details.estimatedDelivery || "-"}`;
        default:
          return details && Object.keys(details).length > 0 ? JSON.stringify(details) : "-";
      }
    }
    const getLogColor = (action) => {
      try {
        if (typeof getActionConfig === "function") return getActionConfig(action).color;
      } catch (e) {
      }
      return "#64748b";
    };
    const getLogLabel = (action) => {
      try {
        if (typeof getActionConfig === "function") return getActionConfig(action).label;
      } catch (e) {
      }
      return action;
    };
    let logsListPage = 1;
    const logsListPerPage = 8;
    let cachedFilteredEventsForLogs = [];
    function disconnectWebSocket() {
      console.log("🔴 Real-time polling stopped");
    }
    function generateTimeline() {
      if (!logsData.logs || logsData.logs.length === 0) {
        return [];
      }
      const sortedLogs = [...logsData.logs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      const timeline = sortedLogs.map((log) => ({
        timestamp: log.timestamp,
        action: log.action,
        userName: log.userName,
        status: log.status,
        details: formatLogDetails(log)
      }));
      console.log("✅ Timeline items generated:", timeline.length);
      return timeline;
    }
    onDestroy(() => {
      disconnectWebSocket();
    });
    lang = translations[currentLang];
    rewardData.leaderboardFinalized = false;
    leaderboardStatus = getLeaderboardStatus();
    leaderboardStatus.canFinalize && rewardData.users && rewardData.users.length > 0;
    leaderboardStatus.canCalculate;
    rewardData.users && rewardData.users.length === 0 && true;
    [...new Set(events.map((e) => e.year))].sort();
    {
      const cacheKey = `vProof_${verifyProofData.submissions.length}_${debouncedVerifyProofSearch}_${verifyProofBatchFilter}_${verifyProofStdIdFilter}`;
      if (cacheKey !== lastVerifyProofKey) {
        lastVerifyProofKey = cacheKey;
        cachedFilteredVerifyProofSubmissions = getFilteredVerifyProofSubmissions();
      }
    }
    filteredVerifyProofSubmissions = cachedFilteredVerifyProofSubmissions;
    filteredVerifyProofSubmissions.length;
    filteredVerifyProofSubmissions.slice((verifyProofSubmissionsPage - 1) * itemsPerPage, verifyProofSubmissionsPage * itemsPerPage);
    {
      const eventsHash = events.map((e) => `${e.id}-${e.status}`).join(",");
      const cacheKey = `events_v${eventsVersion}_${eventsHash}_${debouncedSearchQuery}_${selectedMonthEventList}_${selectedYearEventList}`;
      if (cacheKey !== lastFilteredEventsKey) {
        lastFilteredEventsKey = cacheKey;
        cachedFilteredEvents = filterEventsOptimized(events, debouncedSearchQuery);
      }
    }
    filteredEvents = cachedFilteredEvents;
    filteredEvents.slice((verifyProofEventsPage - 1) * verifyProofEventsPerPage, verifyProofEventsPage * verifyProofEventsPerPage);
    Math.ceil(filteredEvents.length / verifyProofEventsPerPage);
    debouncedUpdateVerifyProofSearch(verifyProofSearchQuery);
    [...filteredVerifyProofSubmissions].sort((a, b) => {
      return new Date(a.submitTime).getTime() - new Date(b.submitTime).getTime();
    });
    filteredEventsForReward = cachedFilteredEventsForReward;
    Math.ceil(filteredEventsForReward.length / rewardEventsPerPage);
    {
      rewardEventsPage = 1;
    }
    filteredEventsForReward.slice((rewardEventsPage - 1) * rewardEventsPerPage, rewardEventsPage * rewardEventsPerPage);
    debouncedUpdateRewardSearch(rewardData.searchQuery);
    {
      const cacheKey = `rUsers_${rewardData.users.length}_${debouncedRewardSearch}_${rewardData.selectedTier}_${rewardSortBy}_${rewardTierFilter}_${nisitYearFilter}_${nisitIdFilter}`;
      if (cacheKey !== lastRewardUsersKey) {
        lastRewardUsersKey = cacheKey;
        cachedFilteredRewardUsers = getFilteredRewardUsersOptimized();
      }
    }
    filteredRewardUsers = cachedFilteredRewardUsers;
    Math.ceil(filteredRewardUsers.length / rewardUsersPerPage);
    filteredRewardUsers.slice((rewardUsersPage - 1) * rewardUsersPerPage, rewardUsersPage * rewardUsersPerPage);
    menuItems = [
      {
        id: "list",
        label: lang.events,
        svg: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
      },
      { id: "create", label: lang.createEvent, svg: "M12 4v16m8-8H4" },
      {
        id: "verify-code",
        label: lang.verifyCode,
        svg: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      },
      {
        id: "verify-proof",
        label: lang.verifyProof,
        svg: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      },
      {
        id: "unlock",
        label: lang.unlock,
        svg: "M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
      },
      {
        id: "log",
        label: lang.logs,
        svg: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      },
      {
        id: "reward",
        label: lang.rewards,
        svg: "M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V6a2 2 0 10-2 2h2zm0 0h4l-4 4-4-4h4z"
      },
      {
        id: "settings",
        label: lang.settings,
        svg: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      }
    ];
    debouncedUpdateSearch(searchQueryEventList);
    Math.ceil(filteredEvents.length / itemsPerPage);
    filteredEvents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    if (perfHistory.length > 1) {
      perfHistory.map((p, i) => {
        const x = i / (MAX_PERF_POINTS - 1) * 120;
        const y = p.latency < 0 ? 30 : Math.min(30, Math.max(2, p.latency / 500 * 28));
        return `${x},${y}`;
      }).join(" ");
    }
    currentLang === "th" ? ce_years.map((y) => y + 543) : ce_years;
    startDateObj = null;
    endDateObj = null;
    isDateRangeValid = startDateObj && endDateObj && startDateObj.getTime() <= endDateObj.getTime();
    startDateObj ? startDateObj.toISOString().split("T")[0] : "";
    endDateObj ? endDateObj.toISOString().split("T")[0] : "";
    availableDates = (() => {
      if (!startDateObj || !endDateObj || !isDateRangeValid) return [];
      const dates = [];
      const current = new Date(startDateObj);
      while (current <= endDateObj) {
        const dayOfWeek = current.getDay();
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        dates.push({
          value: current.toISOString().split("T")[0],
          day: current.getDate(),
          dayName: dayNames[dayOfWeek],
          month: ce_months[current.getMonth()],
          year: current.getFullYear(),
          fullDisplay: `${dayNames[dayOfWeek]}, ${current.getDate()} ${ce_months[current.getMonth()]} ${current.getFullYear()}`
        });
        current.setDate(current.getDate() + 1);
      }
      return dates;
    })();
    (() => {
      const groups = {};
      availableDates.forEach((date) => {
        const key = `${date.month} ${date.year}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(date);
      });
      return groups;
    })();
    isAnyLogsFilterActive = !!(logsData.searchQuery?.trim() || logsData.selectedAction?.trim() || logsData.selectedStatus?.trim() || logsData.dateFrom || logsData.dateTo || logsNisitYearFilter?.trim() || logsNisitIdFilter?.trim());
    logsToDisplay = isAnyLogsFilterActive ? filteredLogs : logsData.logs;
    {
      logsListPage = 1;
    }
    paginatedLogsForList = logsToDisplay.slice((logsListPage - 1) * logsListPerPage, logsListPage * logsListPerPage);
    (() => {
      const map = /* @__PURE__ */ new Map();
      for (const log of paginatedLogsForList) {
        const dateKey = log.fetchedAt ? log.fetchedAt.split("T")[0] : log.timestamp ? log.timestamp.split("T")[0] : "unknown";
        if (!map.has(dateKey)) map.set(dateKey, []);
        map.get(dateKey).push(log);
      }
      const arr = Array.from(map.entries()).map(([date, items]) => ({ date, items }));
      arr.sort((a, b) => a.date < b.date ? 1 : -1);
      return arr;
    })();
    filteredEventsForLogs = cachedFilteredEventsForLogs;
    Math.ceil(filteredEventsForLogs.length / eventsForLogsPerPage);
    filteredEventsForLogs.slice((eventsForLogsPage - 1) * eventsForLogsPerPage, eventsForLogsPage * eventsForLogsPerPage);
    {
      const sourceLogs = typeof logsData !== "undefined" && logsData.logs ? logsData.logs : [];
      if (sourceLogs && Array.isArray(sourceLogs)) {
        sourceLogs.slice(0, 10).map((log, idx) => {
          const dateText = new Date(log.timestamp).toLocaleString(currentLang === "th" ? "th-TH" : "en-GB", { timeZone: "Asia/Bangkok" });
          const color = getLogColor(log.action);
          const label = getLogLabel(log.action);
          return `
          <tr>
            <td class="text-center">${idx + 1}</td>
            <td>${log.userName || "-"}</td>
            <td>${log.userNisitId || "-"}</td>
            <td>
              <span class="action-badge" style="background:${color}20; color:${color}">
                ${label}
              </span>
            </td>
            <td>${dateText}</td>
          </tr>
        `;
        }).join("");
      }
    }
    Math.ceil(logsToDisplay.length / logsListPerPage);
    filteredEventsForLogs.slice((eventsForLogsPage - 1) * eventsForLogsPerPage, eventsForLogsPage * eventsForLogsPerPage);
    generateTimeline();
    head("104isxs", $$renderer2, ($$renderer3) => {
      $$renderer3.push(`<link rel="preconnect" href="https://fonts.googleapis.com" class="svelte-104isxs"/> <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" class="svelte-104isxs"/> <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&amp;display=swap" rel="stylesheet" class="svelte-104isxs"/>`);
    });
    $$renderer2.push(`<div class="app-container svelte-104isxs"><header class="header-bar svelte-104isxs"><div class="header-inner svelte-104isxs"><div class="brand svelte-104isxs"><div class="logo-container svelte-104isxs"></div> <span class="brand-name svelte-104isxs">${escape_html(lang.organizer)}</span></div> <nav class="nav-menu desktop-only svelte-104isxs"><!--[-->`);
    const each_array = ensure_array_like(menuItems);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let item = each_array[$$index];
      $$renderer2.push(`<button${attr_class("menu-btn svelte-104isxs", void 0, { "active": currentView === item.id })}><svg class="line-icon svelte-104isxs" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"${attr("d", item.svg)} class="svelte-104isxs"></path></svg> <span class="btn-label svelte-104isxs">${escape_html(item.label)}</span></button>`);
    }
    $$renderer2.push(`<!--]--> <div class="nav-divider svelte-104isxs"></div> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></nav> <div class="user-zone svelte-104isxs"><button class="lang-toggle-btn svelte-104isxs"${attr("title", currentLang === "th" ? "Switch to English" : "เปลี่ยนเป็นภาษาไทย")} aria-label="Toggle language"><span${attr_class("lang-option svelte-104isxs", void 0, { "active": currentLang === "th" })}>TH</span> <span class="lang-divider svelte-104isxs">/</span> <span${attr_class("lang-option svelte-104isxs", void 0, { "active": currentLang === "en" })}>EN</span></button> <div${attr_class("token-timer svelte-104isxs", void 0, { "warning": timeLeft < 60 })}>${escape_html(formatTime(timeLeft))}</div> <button class="logout-icon-btn desktop-only svelte-104isxs" aria-label="Logout"><svg class="line-icon svelte-104isxs" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" class="svelte-104isxs"></path></svg></button> <div class="mobile-controls mobile-only svelte-104isxs"><button class="mobile-icon-btn svelte-104isxs" aria-label="Open menu"><svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" class="svelte-104isxs"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7" class="svelte-104isxs"></path></svg></button></div></div></div></header> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <main class="page-content svelte-104isxs"><div class="wrapper svelte-104isxs"><div class="static-view-header svelte-104isxs"><div class="title-with-toggle svelte-104isxs"><div class="view-title svelte-104isxs"><h2 class="svelte-104isxs">${escape_html(menuItems.find((m) => m.id === currentView)?.label)}</h2> <div class="divider svelte-104isxs"></div></div></div></div> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="grid-section svelte-104isxs">`);
      {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="grid svelte-104isxs"><!--[-->`);
        const each_array_4 = ensure_array_like([1, 2, 3, 4, 5, 6]);
        for (let $$index_4 = 0, $$length = each_array_4.length; $$index_4 < $$length; $$index_4++) {
          each_array_4[$$index_4];
          $$renderer2.push(`<div class="glass-card skeleton-card svelte-104isxs"><div class="card-img-wrapper skeleton-img svelte-104isxs"></div> <div class="card-body svelte-104isxs"><div class="skeleton-line skeleton-title svelte-104isxs"></div> <div class="skeleton-line skeleton-desc svelte-104isxs"></div> <div class="skeleton-line skeleton-desc short svelte-104isxs"></div> <div class="skeleton-meta svelte-104isxs"><div class="skeleton-badge svelte-104isxs"></div> <div class="skeleton-badge svelte-104isxs"></div></div></div></div>`);
        }
        $$renderer2.push(`<!--]--></div>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]--></div> <div class="pagination-controls svelte-104isxs"></div> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></main> <footer class="app-footer svelte-104isxs"><div class="footer-divider svelte-104isxs"></div> <p class="copyright svelte-104isxs">© 2025 Cyber Geek. All rights reserved.</p> <p class="credits svelte-104isxs">Designed &amp; Developed by <span class="dev-name svelte-104isxs">Cyber Geek Development</span></p> <p class="credits svelte-104isxs" style="margin-top: 5px;">Contact: <a href="/cdn-cgi/l/email-protection#b2d1cbd0d7c0d5d7d7d99cd6d7c4f2c2c0ddc6dddc9cdfd7" class="footer-email svelte-104isxs"><span class="__cf_email__ svelte-104isxs" data-cfemail="dfbca6bdbaadb8babab4f1bbbaa99fafadb0abb0b1f1b2ba">[email protected]</span></a></p></footer></div>`);
    bind_props($$props, { apiBaseUrl, token, organizerId });
  });
}
export {
  _page as default
};
