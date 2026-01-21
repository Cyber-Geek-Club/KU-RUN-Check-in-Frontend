<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import axios from 'axios';
  import Swal from 'sweetalert2';
  
  // ✅ Import auth store
  import { auth } from '$lib/utils/auth';
  
  // ✅ Import holidays data
  import holidaysData from '$lib/data/holidays.json';
  
  // ✅ Import HolidaySelector Component
  import HolidaySelector from './_components/HolidaySelector.svelte';

  // Default to the production API host when no env var is set
  const envUrl = import.meta.env.VITE_API_BASE_URL || "http://158.108.102.14:8001";
  const API_BASE_URL = (envUrl || "http://158.108.102.14:8001").replace(/\/$/, "");
  
  const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
  });

  // Feature-detect whether reward-leaderboards endpoints exist on this server.
  // If not present, set `rewardApiAvailable = false` so we avoid 404s when editing events.
  let rewardApiAvailable: boolean | null = null;
  async function checkRewardApiAvailability() {
    try {
      const token = localStorage.getItem("access_token");
      const headers = token ? { "Authorization": `Bearer ${token}` } : {};
      const res = await api.get('/api/reward-leaderboards/configs', { headers });
      rewardApiAvailable = res && res.status >= 200 && res.status < 300;
    } catch (err: any) {
      rewardApiAvailable = false;
    }
  }

  // ✅ 1. Request Interceptor: Attach fresh token
  api.interceptors.request.use((config) => {
    let token = null;
    if (typeof localStorage !== "undefined") {
        token = localStorage.getItem('access_token');
    }
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // ✅ 2. Response Interceptor: Auto-refresh on 401
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      if (error.response && error.response.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          // token refresh attempt

          try {
              const refreshed = await auth.refreshAccessToken();
              
              if (refreshed) {
                  // token refreshed
                  const newToken = localStorage.getItem('access_token');
                  
                  api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
                  originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
                  return api(originalRequest);
              }
            } catch (refreshErr) {
              // refresh failed
            }
      }

      if (error.response && error.response.status === 401) {
        
        Swal.fire({
            title: 'Session Expired',
            text: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Login ใหม่',
            cancelButtonText: 'อยู่ในหน้านี้ต่อ',
            allowOutsideClick: false
        }).then((result) => {
            if (result.isConfirmed) {
              if (typeof localStorage !== "undefined") localStorage.removeItem('access_token');
              goto('/auth/login');
            }
        });
      }
      return Promise.reject(error);
    }
  );

  type Language = "th" | "en";
  let currentLang: Language = "th";
  if (typeof localStorage !== "undefined") {
    const saved = localStorage.getItem("app_language");
    if (saved === "th" || saved === "en") currentLang = saved;
  }

  const translations = {
    th: {
      createNewEvent: "สร้างกิจกรรมใหม่", editEvent: "แก้ไขกิจกรรม", cancel: "ยกเลิก", publish: "เผยแพร่", update: "อัพเดท",
      fillAllFields: "กรุณากรอกข้อมูลให้ครบถ้วน", uploadEventBanner: "อัพโหลดแบนเนอร์กิจกรรม", changeImage: "เปลี่ยนรูปภาพ",
      basicInformation: "ข้อมูลพื้นฐาน", eventName: "ชื่อกิจกรรม", description: "รายละเอียด", location: "สถานที่",
      eventTypeTitle: "ประเภทกิจกรรม", singleDay: "วันเดียว", multiDay: "หลายวัน",
      singleDayDesc: "กิจกรรมจัดขึ้นในวันเดียว เช็คอินได้ 1 ครั้ง", multiDayDesc: "กิจกรรมหลายวัน สามารถเช็คอินได้หลายครั้ง",
      singleDayNote: "📌 วันเดียว: วันสิ้นสุด = วันเริ่มต้น (ปรับอัตโนมัติ)",
      saving: "กำลังบันทึก...",
      maxCheckinsPerUser: "จำนวนเช็คอินสูงสุดต่อคน", checkinTimes: "ครั้ง",
      dateAndTime: "วันที่และเวลา", startDateLabel: "วันที่เริ่ม", endDateLabel: "วันที่สิ้นสุด",
      startTimeLabel: "เวลาเริ่ม", endTimeLabel: "เวลาสิ้นสุด",
      dayPlaceholder: "วัน", monthPlaceholder: "เดือน", yearPlaceholder: "ปี", selectTime: "เลือกเวลา",
      capacityAndSettings: "จำนวนที่นั่งและการตั้งค่า", capacityLabel: "จำนวนที่นั่ง", distanceLabel: "ระยะทาง (กม.)",
      holidaysAndExclusions: "วันหยุดและข้อยกเว้น", noHolidaysOption: "ไม่มีวันหยุด",
      excludeWeekendsOption: "หยุดเสาร์-อาทิตย์", specificDatesOption: "เลือกวันที่เฉพาะ",
      addDate: "เพิ่มวันหยุด", 
      rewardsDistribution: "การจัดการรางวัล (แบบแข่งขัน)",
      addTierBtn: "+ เพิ่มระดับรางวัล",
      tierLabel: "ระดับรางวัล",
      rewardNameLabel: "ชื่อรางวัล",
      totalRewardsLabel: "จำนวนรางวัลทั้งหมด (คน)",
      requirementLabel: "จำนวนรอบที่ต้องวิ่ง",
      rewardHelperText: "💡 ระบบจะจัดอันดับตามความยาก ผู้ที่วิ่งได้มากกว่าจะได้รางวัลที่ดีกว่า (จำกัด {total} คนแรก)",
      tierHelperText: "ผู้เข้าร่วมที่วิ่งครบจำนวนนี้จะได้รับรางวัล (ถ้าอยู่ใน {total} คนแรก)",
      eventStatusTitle: "สถานะกิจกรรม", publicVisibility: "เผยแพร่สาธารณะ", activeOpen: "เปิดใช้งาน",
      error: "เกิดข้อผิดพลาด", success: "สำเร็จ", eventCreated: "สร้างกิจกรรมสำเร็จ!", eventUpdated: "อัพเดทกิจกรรมสำเร็จ!",
      addSpecificDateBtn: "เพิ่มวันหยุด", selectHolidayPlaceholder: "เลือกวันที่หยุดจากช่วงเวลากิจกรรม",
      pleaseSelectRange: "กรุณาระบุวันเริ่มและวันสิ้นสุดกิจกรรมก่อน",
    },
    en: {
      createNewEvent: "Create New Event", editEvent: "Edit Event", cancel: "Cancel", publish: "Publish", update: "Update",
      fillAllFields: "Please fill in all required fields", uploadEventBanner: "Upload Event Banner", changeImage: "Change Image",
      basicInformation: "Basic Information", eventName: "Event Name", description: "Description", location: "Location",
      eventTypeTitle: "Event Type", singleDay: "Single Day", multiDay: "Multi-Day",
      singleDayDesc: "Event held in one day, check-in once", multiDayDesc: "Multi-day event, multiple check-ins allowed",
      singleDayNote: "📌 Single day: End date = Start date (auto-applies)",
      saving: "Saving...",
      maxCheckinsPerUser: "Max Check-ins Per User", checkinTimes: "times",
      dateAndTime: "Date & Time", startDateLabel: "Start Date", endDateLabel: "End Date",
      startTimeLabel: "Start Time", endTimeLabel: "End Time",
      dayPlaceholder: "Day", monthPlaceholder: "Month", yearPlaceholder: "Year", selectTime: "Select time",
      capacityAndSettings: "Capacity & Settings", capacityLabel: "Capacity", distanceLabel: "Distance (km)",
      holidaysAndExclusions: "Holidays & Exclusions", noHolidaysOption: "No Holidays",
      excludeWeekendsOption: "Exclude Weekends", specificDatesOption: "Specific Dates",
      addDate: "Add Date", 
      rewardsDistribution: "Reward Distribution (Competition)",
      addTierBtn: "+ Add Tier",
      tierLabel: "Reward Tier",
      rewardNameLabel: "Reward Name",
      totalRewardsLabel: "Total Reward Slots",
      requirementLabel: "Required Runs",
      rewardHelperText: "💡 System ranks by difficulty. Top performers get better rewards (limited to top {total})",
      tierHelperText: "Participants who complete this many runs will receive this reward (if in top {total})",
      eventStatusTitle: "Event Status", publicVisibility: "Public Visibility", activeOpen: "Active (Open)",
      error: "Error", success: "Success", eventCreated: "Event created successfully!", eventUpdated: "Event updated successfully!",
      addSpecificDateBtn: "Add Holiday", selectHolidayPlaceholder: "Select holiday within event range",
      pleaseSelectRange: "Please select start and end dates first",
    }
  };
  
  $: lang = translations[currentLang];
  
  interface RewardTierConfig {
    reward_name: string;         // ชื่อรางวัล
    required_completions: number | null; // จำนวนรอบที่ต้องวิ่งเพื่อได้รางวัลนี้
    time_period_days?: number | string; // optional compatibility with backend reward objects
  }
  
  let formData = {
    title: "", description: "", location: "",
    sDay: "", sMonth: "", sYear: "", 
    eDay: "", eMonth: "", eYear: "", 
    startTime: "", endTime: "",
    totalSlots: null as number | null, distanceKm: null as number | null,
    // [แก้ไข] รองรับ public และ weekends_public
    holidayType: "none" as "none" | "weekends" | "specific" | "public" | "weekends_public",
    specificDates: [] as string[],
    selectedHoliday: "", 
    totalRewards: null as number | null, 
    rewardTiers: [{ reward_name: "", required_completions: null }] as RewardTierConfig[],
    isPublic: true, isActive: true,
    imagePreview: null as string | null, imageFile: null as File | null,
    eventType: "single_day" as "single_day" | "multi_day",
    maxCheckinsPerUser: 1,
  };
  
  let editingEventId: string | null = null;
  let editingRewardConfigId: string | null = null;
  let validationErrors = new Set<string>();
  let activeDropdown: string | null = null;
  let fileInput: HTMLInputElement;
  let isSubmitting = false;

  const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
  const months = ["01","02","03","04","05","06","07","08","09","10","11","12"];
  const monthNames = {
    th: ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"],
    en: ["January","February","March","April","May","June","July","August","September","October","November","December"]
  };
  const years = Array.from({ length: 10 }, (_, i) => String(new Date().getFullYear() + i));
  const times = Array.from({ length: 96 }, (_, i) => {
    const h = Math.floor(i / 4);
    const m = (i % 4) * 15;
    return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`;
  });

  $: displayMonths = monthNames[currentLang];

  let dateRangeOptions: { value: string, label: string }[] = [];
  $: updateDateRange(formData.sDay, formData.sMonth, formData.sYear, formData.eDay, formData.eMonth, formData.eYear);

  function updateDateRange(sD: string, sM: string, sY: string, eD: string, eM: string, eY: string) {
    if (sD && sM && sY && eD && eM && eY) {
      try {
        const start = new Date(Number(sY), Number(sM) - 1, Number(sD));
        const end = new Date(Number(eY), Number(eM) - 1, Number(eD));
        if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
            dateRangeOptions = [];
            return;
        }
        const list = [];
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const dateVal = `${y}-${m}-${day}`;
            const labelDay = day;
            const labelMonth = monthNames[currentLang][d.getMonth()];
            const labelYear = currentLang === 'th' ? y + 543 : y;
            list.push({ value: dateVal, label: `${labelDay} ${labelMonth} ${labelYear}` });
        }
        dateRangeOptions = list;
      } catch (e) { dateRangeOptions = []; }
    } else { dateRangeOptions = []; }
  }

  function translateMonth(month: string): string {
    const idx = months.indexOf(month);
    return idx >= 0 ? displayMonths[idx] : "";
  }

  onMount(async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    if (id) {
      editingEventId = id;
      await fetchEventDetails(id);
    }
  });

  function resolveImageUrl(img: string | null) {
    if (!img) return null;
    if (img.startsWith('http') || img.startsWith('data:')) return img;
    
    const cleanPath = img.startsWith('/') ? img.slice(1) : img;
    if (!API_BASE_URL) {
        if (cleanPath.startsWith('api/')) return `/${cleanPath}`;
        return `/api/${cleanPath}`;
    }
    const cleanBase = API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`;
    if (cleanPath.startsWith('api/')) return `${cleanBase}${cleanPath}`;
    return `${cleanBase}api/${cleanPath}`; 
  }

  function extractLocalParts(isoString: string) {
    if (!isoString) return { year: "", month: "", day: "", time: "" };
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return { year: "", month: "", day: "", time: "" };
      const year = String(date.getFullYear());
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const h = String(date.getHours()).padStart(2, '0');
      const m = String(date.getMinutes()).padStart(2, '0');
      return { year, month, day, time: `${h}:${m}` };
    } catch { return { year: "", month: "", day: "", time: "" }; }
  }

  async function fetchEventDetails(id: string) {
    try {
      Swal.fire({
        title: 'Loading...',
        allowOutsideClick: false,
        showConfirmButton: false,
        customClass: { popup: 'swal-dark' },
        didOpen: () => Swal.showLoading()
      });
      const res = await api.get(`/api/events/${id}`);
      const data = res.data;

      formData.title = data.title;
      formData.description = data.description;
      formData.location = data.location;
      const startDateRaw = data.start_date || data.event_date;
      const endDateRaw = data.end_date || data.event_end_date;
      if (startDateRaw) {
        const { year, month, day, time } = extractLocalParts(startDateRaw);
        formData.sYear = year; formData.sMonth = month; formData.sDay = day;
        // ✅ Prefer start_time from backend, fallback to extracted time
        formData.startTime = data.start_time?.slice(0, 5) || time;
      }
      if (endDateRaw) {
        const { year, month, day, time } = extractLocalParts(endDateRaw);
        formData.eYear = year; formData.eMonth = month; formData.eDay = day;
        // ✅ Prefer end_time from backend, fallback to extracted time
        formData.endTime = data.end_time?.slice(0, 5) || time;
      }

      formData.totalSlots = data.max_participants;
      formData.distanceKm = data.distance_km;
      formData.eventType = data.event_type || 'single_day';
      formData.maxCheckinsPerUser = data.max_checkins_per_user || 1;
      
      // ✅ Load existing holidays
      try {
        const holidaysRes = await api.get(`/api/events/${id}/holidays`);
        if (holidaysRes.data && holidaysRes.data.holidays && Array.isArray(holidaysRes.data.holidays) && holidaysRes.data.holidays.length > 0) {
          const holidays = holidaysRes.data.holidays;
          
          // Convert to date strings
          const holidayDateStrings = holidays.map((h: any) => {
            const d = new Date(h.holiday_date);
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
          });
          
          // Check if these are weekends (auto-detect)
          if (startDateRaw && endDateRaw) {
            const weekendDates = getWeekendDates(
              new Date(startDateRaw).toISOString().split('T')[0],
              new Date(endDateRaw).toISOString().split('T')[0]
            );
            
            const isWeekendPattern = weekendDates.length > 0 && 
                                     weekendDates.length === holidayDateStrings.length &&
                                     weekendDates.every(wd => holidayDateStrings.includes(wd));
            
            if (isWeekendPattern) {
              formData.holidayType = 'weekends';
            } else {
              formData.holidayType = 'specific';
              formData.specificDates = holidayDateStrings;
            }
          } else {
            formData.holidayType = 'specific';
            formData.specificDates = holidayDateStrings;
          }
        }
      } catch (hErr) {
        console.warn("No holidays found or error loading:", hErr);
      }

      formData.isPublic = data.is_public ?? data.is_published ?? true;
      formData.isActive = data.is_active ?? true;
      // loaded status
      formData.imagePreview = resolveImageUrl(data.banner_image_url || data.image || data.image_url);
      
      // ✅ Load reward config (optional - don't fail if not found)
      try {
        // If we haven't checked availability yet, do so once
        if (rewardApiAvailable === null) await checkRewardApiAvailability();

        if (rewardApiAvailable) {
          try {
            const configRes = await api.get(`/api/reward-leaderboards/configs/event/${id}`);
            const config = configRes.data;
            if (config) {
              editingRewardConfigId = config.id;
              formData.totalRewards = config.max_reward_recipients;
              if (config.reward_tiers && config.reward_tiers.length > 0) {
                formData.rewardTiers = config.reward_tiers.map((t: any) => {
                  const rewardName = t.reward_name || t.reward?.name || t.name || "";
                  return {
                    reward_name: rewardName,
                    required_completions: t.required_completions || 0
                  };
                });
              }
            }
          } catch (err: any) {
            // If the endpoint 404s, mark unavailable to avoid further requests
            if (err.response?.status === 404) {
              console.warn("Reward leaderboard API not present; skipping config fetch.");
              rewardApiAvailable = false;
            } else if (err.response?.status === 500) {
              console.warn("Reward config exists but has errors - will recreate on save");
              editingRewardConfigId = null;
            } else {
              console.error("Error fetching reward config:", err);
            }
          }
        } else {
          // Service unavailable; skip fetching config
          editingRewardConfigId = null;
        }
      } catch (outerErr) {
        // Ensure we don't block the page on availability checks
        console.warn('Skipping reward config due to availability check error', outerErr);
        editingRewardConfigId = null;
      }

      Swal.close();
    } catch (error) {
      console.error("Error:", error);
      Swal.fire('Error', 'ไม่สามารถดึงข้อมูลกิจกรรมได้', 'error');
      goto('/organizer/events');
    }
  }

  function toggleDropdown(name: string) { activeDropdown = activeDropdown === name ? null : name; }
  function selectOption(field: string, value: any) { 
    (formData as any)[field] = String(value);
    
    // ✅ Single day: sync end date with start date
    if (formData.eventType === 'single_day') {
      if (field === 'sDay') formData.eDay = String(value);
      if (field === 'sMonth') formData.eMonth = String(value);
      if (field === 'sYear') formData.eYear = String(value);
    }
    
    // ✅ Multi-day: recalculate max check-ins when dates change
    if (formData.eventType === 'multi_day' && 
        (field.includes('Day') || field.includes('Month') || field.includes('Year'))) {
      setTimeout(() => calculateMaxCheckins(), 50);
    }
    
    formData = formData; 
    activeDropdown = null; 
  }
  function setEventType(type: "single_day" | "multi_day") { 
    formData.eventType = type;
    
    // ✅ Single day: sync end date = start date
    if (type === "single_day") {
      formData.eDay = formData.sDay;
      formData.eMonth = formData.sMonth;
      formData.eYear = formData.sYear;
      formData.maxCheckinsPerUser = 1;
    } else {
      // Multi-day: auto-calculate max check-ins
      calculateMaxCheckins();
    }
  }
  
  // ✅ Auto-calculate max check-ins based on date range and holidays
  function calculateMaxCheckins() {
    if (formData.eventType !== 'multi_day') return;
    
    try {
      const startDateStr = `${formData.sYear}-${String(months.indexOf(formData.sMonth) + 1).padStart(2, '0')}-${String(formData.sDay).padStart(2, '0')}`;
      const endDateStr = `${formData.eYear}-${String(months.indexOf(formData.eMonth) + 1).padStart(2, '0')}-${String(formData.eDay).padStart(2, '0')}`;
      
      const start = new Date(startDateStr);
      const end = new Date(endDateStr);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
        return;
      }
      
      // Count total days
      const totalDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      // Count holidays
      let holidayCount = 0;
      if (formData.holidayType === 'weekends') {
        const weekendDates = getWeekendDates(startDateStr, endDateStr);
        holidayCount = weekendDates.length;
      } else if (formData.holidayType === 'specific') {
        holidayCount = formData.specificDates.length;
      }
      
      // Available check-in days = total - holidays
      const availableDays = Math.max(1, totalDays - holidayCount);
      formData.maxCheckinsPerUser = availableDays;
      
      console.log(`📊 Max check-ins: ${totalDays} days - ${holidayCount} holidays = ${availableDays}`);
    } catch (e) {
      console.warn("Could not auto-calculate:", e);
    }
  }
  function triggerFileInput() { fileInput?.click(); }
  function handleImageUpload(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      formData.imageFile = file;
      const reader = new FileReader();
      reader.onload = (ev) => { formData.imagePreview = ev.target?.result as string; };
      reader.readAsDataURL(file);
    }
  }

  function handlePreviewImgError(e: Event) {
    const img = e.currentTarget as HTMLImageElement | null;
    if (img) img.src = 'https://placehold.co/600x400/1e293b/64748b?text=Image+Not+Found';
  }

  function handleImgCardKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      triggerFileInput();
    }
  }

  function handleTriggerKeydown(e: KeyboardEvent, name: string) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleDropdown(name);
    }
    if (e.key === 'Escape') {
      activeDropdown = null;
    }
  }

  function addSpecificDate() {
    if (formData.selectedHoliday) {
      if (!formData.specificDates.includes(formData.selectedHoliday)) {
        formData.specificDates = [...formData.specificDates, formData.selectedHoliday];
        formData.selectedHoliday = ""; 
        
        // ✅ Recalculate max check-ins
        if (formData.eventType === 'multi_day') {
          setTimeout(() => calculateMaxCheckins(), 50);
        }
      }
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'ยังไม่ได้เลือกวันที่',
        text: 'กรุณาเลือกวันที่จากรายการก่อนกดเพิ่ม',
        customClass: { popup: 'swal-dark' },
        confirmButtonColor: '#10b981'
      });
    }
  }
  function removeSpecificDate(date: string) { 
    formData.specificDates = formData.specificDates.filter(d => d !== date); 
    // ✅ Recalculate max check-ins
    if (formData.eventType === 'multi_day') {
      setTimeout(() => calculateMaxCheckins(), 50);
    }
  }
  function addRewardTier() { formData.rewardTiers = [...formData.rewardTiers, { reward_name: "", required_completions: null }]; }
  function removeRewardTier(index: number) { if (formData.rewardTiers.length > 1) { formData.rewardTiers = formData.rewardTiers.filter((_, i) => i !== index); } }
  
  function validate(): boolean {
    validationErrors.clear();
    if (!formData.title) validationErrors.add("title");
    if (!formData.description) validationErrors.add("description");
    if (!formData.location) validationErrors.add("location");
    if (!formData.sDay || !formData.sMonth || !formData.sYear) validationErrors.add("startDate");
    if (!formData.eDay || !formData.eMonth || !formData.eYear) validationErrors.add("endDate");
    if (!formData.startTime) validationErrors.add("startTime");
    if (!formData.endTime) validationErrors.add("endTime");
    if (!formData.totalSlots) validationErrors.add("totalSlots");
    validationErrors = validationErrors;
    return validationErrors.size === 0;
  }

  function getWeekendDates(startDate: string, endDate: string): string[] {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dates = [];
    const current = new Date(start);
    while (current <= end) {
      const day = current.getDay();
      if (day === 0 || day === 6) { 
        const year = current.getFullYear();
        const month = String(current.getMonth() + 1).padStart(2, '0');
        const d = String(current.getDate()).padStart(2, '0');
        dates.push(`${year}-${month}-${d}`);
      }
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }

  async function submit() {
    if (isSubmitting) return; 
    isSubmitting = true;
    
    // Validate Inputs
    if (!validate()) {
      Swal.fire({
        title: lang.error,
        text: lang.fillAllFields,
        icon: 'error',
        customClass: { popup: 'swal-dark' },
        confirmButtonColor: '#10b981'
      });
      isSubmitting = false;
      return;
    }

    // ✅ Check Auth
    const token = localStorage.getItem('access_token');
    if (!token) {
         Swal.fire({ title: 'Auth Error', text: 'ไม่พบข้อมูลการเข้าสู่ระบบ กรุณา Login ใหม่', icon: 'error' });
         goto('/auth/login');
         return;
    }
    
    try {
      Swal.fire({
        title: lang.saving,
        allowOutsideClick: false,
        showConfirmButton: false,
        customClass: { popup: 'swal-dark' },
        didOpen: () => Swal.showLoading()
      });

      // ---------------------------------------------------------
      // 1. Upload Image
      // ---------------------------------------------------------
      let finalImageUrl = formData.imagePreview;
      if (formData.imageFile) {
        const uploadData = new FormData();
        uploadData.append('file', formData.imageFile);
        uploadData.append('subfolder', 'events');
        try {
            const uploadRes = await api.post('/api/images/upload', uploadData, { headers: { 'Content-Type': 'multipart/form-data' } });
            if (uploadRes.data && uploadRes.data.url) finalImageUrl = uploadRes.data.url;
        } catch (uploadErr) { console.error("Image upload failed", uploadErr); }
      }

      // ---------------------------------------------------------
      // 2. Create/Update Event Data
      // ---------------------------------------------------------
      const startDateStr = `${formData.sYear}-${String(months.indexOf(formData.sMonth) + 1).padStart(2, '0')}-${String(formData.sDay).padStart(2, '0')}`;
      const endDateStr = `${formData.eYear}-${String(months.indexOf(formData.eMonth) + 1).padStart(2, '0')}-${String(formData.eDay).padStart(2, '0')}`;

      // Build ISO datetimes
      const startDateISO = new Date(`${startDateStr}T${formData.startTime}:00`).toISOString();
      const endDateISO = new Date(`${endDateStr}T${formData.endTime}:00`).toISOString();

      const payload = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        event_date: startDateISO,
        event_end_date: endDateISO,
        start_time: formData.startTime,
        end_time: formData.endTime,
        max_participants: Number(formData.totalSlots),
        distance_km: Number(formData.distanceKm || 0),
        event_type: formData.eventType,
        max_checkins_per_user: Number(formData.maxCheckinsPerUser),
        allow_daily_checkin: formData.eventType === "multi_day",
        is_public: formData.isPublic,
        is_active: formData.isActive,
        banner_image_url: finalImageUrl,
        is_published: formData.isPublic
      };
      
      // saving event
      
      let targetId = editingEventId;

      if (editingEventId) {
        await api.put(`/api/events/${editingEventId}`, payload);
      } else {
        const res = await api.post('/api/events/', payload);
        targetId = res.data.id || res.data.event_id; 
      }

      if (!targetId) throw new Error("Event ID not returned from API");

      // ---------------------------------------------------------
      // 3. Handle Holidays (Multi-day only)
      // ---------------------------------------------------------
      if (formData.eventType === 'multi_day' && targetId) {
        let holidayDates: string[] = [];
        let holidayNames: string[] = [];

        if (formData.holidayType === 'weekends') {
          holidayDates = getWeekendDates(startDateStr, endDateStr);
          holidayNames = holidayDates.map(() => "วันหยุดเสาร์-อาทิตย์");
        } 
        else if (formData.holidayType === 'specific') {
          holidayDates = formData.specificDates;
          holidayNames = formData.specificDates.map((date) => {
            const d = new Date(date);
            return d.toLocaleDateString(currentLang === 'th' ? 'th-TH' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
          });
        } 
        else if (formData.holidayType === 'public' || formData.holidayType === 'weekends_public') {
            const publicHols = holidaysData.filter((h: any) => h.date >= startDateStr && h.date <= endDateStr);
            let dates = publicHols.map((h: any) => h.date);
            let names = publicHols.map((h: any) => h.name_th || h.name);

            if (formData.holidayType === 'weekends_public') {
                const weekends = getWeekendDates(startDateStr, endDateStr);
                weekends.forEach(wd => {
                    if (!dates.includes(wd)) {
                        dates.push(wd);
                        names.push("วันหยุดเสาร์-อาทิตย์");
                    }
                });
            }
            holidayDates = dates;
            holidayNames = names;
        }

        // Clear & Add Holidays logic
        if (editingEventId && formData.holidayType !== 'none') {
          try { await api.delete(`/api/events/${targetId}/holidays`); } catch (e) { /* ignore */ }
        }

        if (holidayDates.length > 0) {
          try {
            await api.post(`/api/events/${targetId}/holidays/quick`, {
              holiday_dates: holidayDates,
              holiday_names: holidayNames
            });
          } catch (hErr: any) { 
            console.error("Failed to add holidays:", hErr);
          }
        } else if (editingEventId && formData.holidayType === 'none') {
          try { await api.delete(`/api/events/${targetId}/holidays`); } catch (e) { /* ignore */ }
        }
      }

      // ---------------------------------------------------------
      // 4. Handle Rewards (Fixed Logic: Check -> Update/Create)
      // ---------------------------------------------------------
      if (formData.totalRewards && formData.rewardTiers.length > 0 && formData.rewardTiers[0].reward_name && targetId) {
          
          // Safety Check
          const total = Number(formData.totalRewards) || 300;
          if (total < formData.rewardTiers.length) {
             throw new Error(`จำนวนรางวัลทั้งหมด (${total}) น้อยกว่าจำนวนระดับรางวัล (${formData.rewardTiers.length}) กรุณาเพิ่มจำนวนรางวัล`);
          }

          // 4.1 Create individual Reward Items (✅ Fixed: Check existing ID)
          const sortedTiers = [...formData.rewardTiers].sort((a, b) => {
            return (Number(b.required_completions) || 0) - (Number(a.required_completions) || 0);
          });
          
          const createdTiers = await Promise.all(sortedTiers.map(async (t, idx) => {
              if (!t.reward_name || !t.required_completions || t.required_completions <= 0) return null;
              
              // ✅ ถ้ามี reward_id อยู่แล้ว (จากการโหลดข้อมูลเดิม) ให้ใช้ของเดิม ไม่สร้างใหม่
              if ((t as any).reward_id) {
                  return { ...t, tier_order: idx + 1 };
              }

              try {
                const timePeriodDays = (t.time_period_days && Number(t.time_period_days)) || 30;
                const rewardRes = await api.post('/api/rewards/', {
                  name: t.reward_name,
                  description: `Reward: ${t.reward_name} (${t.required_completions} completions required)`,
                  required_completions: Number(t.required_completions),
                  time_period_days: timePeriodDays,
                  meta: {}
                });
                return { 
                    ...t, 
                    reward_id: rewardRes.data.id,
                    tier_order: idx + 1 
                };
              } catch (e) {
                  console.error("Failed to create reward item:", e);
                  return null;
              }
          }));

          const validTiers = createdTiers.filter(t => t !== null);

          // 4.2 Prepare Leaderboard Config
          if (validTiers.length > 0) {
              const rewardConfigPayload = {
                  event_id: Number(targetId),
                  name: `Leaderboard for ${formData.title}`,
                  description: `Competition-based reward distribution`, 
                  max_reward_recipients: total,
                  required_completions: 1,
                  starts_at: new Date(`${startDateStr}T${formData.startTime}:00`).toISOString(), 
                  ends_at: (() => {
                      if (startDateStr === endDateStr && formData.startTime === formData.endTime) {
                          return new Date(`${endDateStr}T23:59:59`).toISOString();
                      }
                      return new Date(`${endDateStr}T${formData.endTime}:00`).toISOString();
                  })(),
                  
                  reward_tiers: validTiers.map((t, idx) => {
                    const tierObj: any = t as any;
                    const numTiers = validTiers.length;
                    const perTier = Math.floor(total / numTiers);
                    const isLast = idx === numTiers - 1;
                    const quantity = isLast ? (total - (perTier * (numTiers - 1))) : perTier;
                    
                    let rankStart = 1;
                    for (let i = 0; i < idx; i++) {
                        const prevQty = (i === numTiers - 1) ? (total - (perTier * (numTiers - 1))) : perTier;
                        rankStart += Math.max(1, prevQty);
                    }
                    
                    return {
                      tier: Number(tierObj.tier_order ?? (idx + 1)),
                      reward_id: tierObj.reward_id,
                      reward_name: tierObj.reward_name,
                      quantity: quantity,
                      required_completions: Number(tierObj.required_completions || 0),
                      min_rank: rankStart,
                      max_rank: rankStart + quantity - 1
                    };
                  })
              };

              // --- ✅ FIXED: Robust Config Saving Logic ---
              try {
                  // 1. ถาม Server ว่า Event นี้มี Config ID อะไรแน่ๆ
                  let realConfigId = null;
                  try {
                      const checkRes = await api.get(`/api/reward-leaderboards/configs/event/${targetId}`);
                      const configData = Array.isArray(checkRes.data) ? checkRes.data[0] : checkRes.data;
                        if (configData && (configData.id || configData.config_id)) {
                            realConfigId = configData.id || configData.config_id;
                          }
                  } catch (checkErr: any) {
                      if (checkErr.response?.status !== 404) {
                          console.warn("⚠️ Error checking existing config:", checkErr);
                      }
                  }

                  // 2. ถ้ามี -> UPDATE (PUT)
                    if (realConfigId) {
                        try {
                        const updRes = await api.put(`/api/reward-leaderboards/configs/${realConfigId}`, rewardConfigPayload);
                        editingRewardConfigId = realConfigId;
                      } catch (updateErr: any) {
                          // 🔥 SPECIAL FIX: ถ้า Update ไม่ได้เพราะ Finalize ไปแล้ว ให้ลบแล้วสร้างใหม่
                          const errDetail = updateErr.response?.data?.detail;
                          const isFinalizedError = updateErr.response?.status === 400 && 
                                                 (typeof errDetail === 'string' && errDetail.includes('finalized'));
                          
                              if (isFinalizedError) {
                              // cannot update finalized leaderboard - attempt reset
                              
                                  try {
                                  // 2.1 Delete Old Config
                                  await api.delete(`/api/reward-leaderboards/configs/${realConfigId}`);
                                  
                                  // 2.2 Create New Config
                                  const createRes = await api.post('/api/reward-leaderboards/configs', rewardConfigPayload);
                                  editingRewardConfigId = createRes.data?.id || createRes.data?.config_id;
                                  
                                  Swal.fire({
                                    icon: 'info',
                                    title: 'Leaderboard Reset',
                                    text: 'การตั้งค่ารางวัลเดิมถูกรีเซ็ตเนื่องจากมีการเปลี่ยนแปลงข้อมูล',
                                    toast: true, position: 'top-end', timer: 3000, background: '#3b82f6', color: '#fff'
                                  });
                              } catch (deleteErr: any) {
                                  // reset failed
                                  // ถ้าลบไม่ได้ (เช่น ติด FK) ให้โยน Error เดิมออกไปเพื่อให้ catch ใหญ่ข้างล่างทำงาน
                                  throw updateErr; 
                              }
                          } else {
                              throw updateErr;
                          }
                      }
                    } else {
                      // 3. ถ้าไม่มี -> CREATE (POST)
                      try {
                        const createRes = await api.post('/api/reward-leaderboards/configs', rewardConfigPayload);
                        editingRewardConfigId = createRes.data?.id || createRes.data?.config_id;
                      } catch (createErr: any) {
                        console.error('❌ Create config failed:', createErr);
                        console.error('response data:', createErr.response?.data);
                        console.error('response status:', createErr.response?.status);
                        console.error('response headers:', createErr.response?.headers);
                        // rethrow to be handled by outer catch which shows admin SQL
                        throw createErr;
                      }
                    }
                  
              } catch (rewErr: any) {
                  console.error("Failed to save reward config:", rewErr);
                  let msg = rewErr.response?.data?.detail 
                    ? (typeof rewErr.response.data.detail === 'object' ? JSON.stringify(rewErr.response.data.detail) : rewErr.response.data.detail)
                    : rewErr.message;
                  
                  // SQL สำหรับ Admin (เผื่อกรณีแก้ไม่ได้จริงๆ)
                  const adminSQL = `-- Delete leaderboard for event ${targetId}\nDELETE FROM reward_leaderboard_entries WHERE config_id IN (SELECT id FROM reward_leaderboard_configs WHERE event_id = ${targetId});\nDELETE FROM reward_leaderboard_configs WHERE event_id = ${targetId};`;

                  Swal.fire({
                    icon: 'warning',
                    title: 'Reward Config Issue',
                    html: `
                      <div style="text-align:left">
                        <p style="margin:0 0 8px 0">บันทึกกิจกรรมสำเร็จ แต่การตั้งค่ารางวัลมีปัญหา:</p>
                        <div style="background:#0f1724;border:1px solid rgba(255,255,255,0.04);padding:8px;border-radius:6px;margin-bottom:8px;max-height:220px;overflow:auto;font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, 'Roboto Mono', 'Courier New', monospace;font-size:13px;color:#e6edf3;white-space:pre-wrap;">${msg}</div>
                        <p style="margin:6px 0 8px 0;color:#cbd5e1">หากปัญหายังเกิดซ้ำ แสดงว่ามีผู้รับรางวัลไปแล้วไม่สามารถแก้ไขได้<br/>ให้ส่ง SQL นี้ให้ผู้ดูแลระบบ:</p>
                        <div style="background:#0f1724;border:1px solid rgba(255,255,255,0.04);padding:8px;border-radius:6px;max-height:160px;overflow:auto;font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, 'Roboto Mono', 'Courier New', monospace;font-size:13px;color:#e6edf3;white-space:pre-wrap;">${adminSQL}</div>
                        <div style="display:flex;gap:8px;margin-top:10px;justify-content:flex-end;"><button id="swal-copy-sql" class="swal2-confirm swal2-styled" type="button" style="background:#10b981;border:none;color:#fff;padding:6px 10px;border-radius:6px;">Copy SQL</button><button id="swal-close-sql" class="swal2-cancel swal2-styled" type="button" style="background:transparent;border:1px solid rgba(255,255,255,0.06);color:#fff;padding:6px 10px;border-radius:6px;">Close</button></div>
                      </div>
                    `,
                    showConfirmButton: false,
                    showCancelButton: false,
                    width: 700,
                    customClass: { popup: 'swal-dark' },
                    didOpen: () => {
                      const copyBtn = document.getElementById('swal-copy-sql');
                      const closeBtn = document.getElementById('swal-close-sql');
                      if (copyBtn) copyBtn.addEventListener('click', () => { navigator.clipboard.writeText(adminSQL); Swal.fire({ icon: 'success', title: 'Copied', timer: 900, showConfirmButton: false, customClass: { popup: 'swal-dark' } }); });
                      if (closeBtn) closeBtn.addEventListener('click', () => { Swal.close(); });
                    }
                  });
              }
          }
      }
      
      await Swal.fire({
        title: lang.success,
        text: editingEventId ? lang.eventUpdated : lang.eventCreated,
        icon: 'success',
        customClass: { popup: 'swal-dark' },
        confirmButtonColor: '#10b981',
        timer: 1500,
        showConfirmButton: false
      });
      goto('/organizer/events');

    } catch (error: any) {
      console.error('Submit Error:', error);
      const errMsg = error.response?.data?.detail || error.message || 'Unknown error';
      Swal.fire({
        title: lang.error,
        text: `Failed to save: ${errMsg}`,
        icon: 'error',
        customClass: { popup: 'swal-dark' },
        confirmButtonColor: '#10b981'
      });
    } finally {
      isSubmitting = false;
    }
  }
  
  function cancel() { goto('/organizer/events'); }

  // ✅ 3. Helper function to format time input (00:00)
  function handleTimeInput(field: 'startTime' | 'endTime', event: Event) {
    const input = event.target as HTMLInputElement;
    let val = input.value.replace(/[^0-9]/g, ''); // Allow only numbers

    if (val.length > 4) val = val.slice(0, 4);

    if (val.length > 2) {
        val = val.slice(0, 2) + ':' + val.slice(2);
    }

    formData[field] = val;
    input.value = val;
  }
</script>

<div class="ce-wrapper" on:click={() => (activeDropdown = null)} role="button" tabindex="0" on:keydown={(e) => { if (e.key === 'Escape') activeDropdown = null }}>
  <div class="ce-container">
    <div class="ce-header">
      <h2 class="ce-title">{editingEventId ? lang.editEvent : lang.createNewEvent}</h2>
      <div class="ce-header-right">
        {#if validationErrors.size > 0}
          <div class="ce-validation-alert">
            <svg class="ce-alert-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span class="ce-alert-text">{lang.fillAllFields}</span>
          </div>
        {/if}
        <div class="ce-header-actions">
          <button class="ce-btn-cancel" on:click={cancel} disabled={isSubmitting}>{lang.cancel}</button>
          <button class="ce-btn-save" on:click={submit} disabled={isSubmitting} aria-busy={isSubmitting}>
            {#if isSubmitting}
              <svg class="btn-spinner" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="10" stroke-width="2" stroke="currentColor" fill="none" opacity="0.15"/><path d="M22 12a10 10 0 00-10-10" stroke-width="2" stroke="currentColor" stroke-linecap="round" fill="none"/></svg>
              <span class="btn-label">{lang.saving}</span>
            {:else}
              <span class="btn-label">{editingEventId ? lang.update : lang.publish}</span>
            {/if}
          </button>
        </div>
      </div>
    </div>

    <div class="ce-grid-layout">
        <div class="ce-card ce-img-card" class:has-img={formData.imagePreview} on:click|stopPropagation={triggerFileInput} role="button" tabindex="0" on:keydown|stopPropagation={handleImgCardKeydown}>
        <input type="file" accept="image/*" bind:this={fileInput} on:change={handleImageUpload} hidden />
        {#if formData.imagePreview}
            <img src={formData.imagePreview} alt="Preview" class="ce-preview-img" on:error={handlePreviewImgError} />
          <div class="ce-overlay"><span>{lang.changeImage}</span></div>
        {:else}
          <div class="ce-upload-placeholder"><div class="ce-icon-upload"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div><span>{lang.uploadEventBanner}</span></div>
        {/if}
      </div>

      <div class="ce-card ce-form-card">
        <div class="ce-card-head"><svg class="ce-icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg><span>{lang.basicInformation}</span></div>
        <div class="ce-input-group"><label for="title">{lang.eventName} <span class="ce-req">*</span></label><input id="title" type="text" bind:value={formData.title} placeholder="ชื่อกิจกรรม" class="ce-input" class:error={validationErrors.has("title")} /></div>
        <div class="ce-input-group"><label for="description">{lang.description} <span class="ce-req">*</span></label><textarea id="description" bind:value={formData.description} placeholder="รายละเอียด..." class="ce-textarea" class:error={validationErrors.has("description")}></textarea></div>
        <div class="ce-input-group"><label for="location">{lang.location} <span class="ce-req">*</span></label><input id="location" type="text" bind:value={formData.location} placeholder="สถานที่" class="ce-input" class:error={validationErrors.has("location")} /></div>
      </div>

      <div class="ce-card ce-config-card">
         <div class="ce-card-head"><svg class="ce-icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"></path></svg><span>{lang.eventTypeTitle}</span></div>
         <div class="ce-event-type-buttons">
          <button type="button" class="ce-event-type-btn" class:active={formData.eventType === "single_day"} on:click={() => setEventType("single_day")}>
            <div class="ce-event-type-icon"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path><circle cx="12" cy="15" r="2" fill="currentColor"/></svg></div><div class="ce-event-type-content"><span class="ce-event-type-title">{lang.singleDay}</span><span class="ce-event-type-desc">{lang.singleDayDesc}</span></div>{#if formData.eventType === "single_day"}<div class="ce-event-type-check"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg></div>{/if}
          </button>
          <button type="button" class="ce-event-type-btn" class:active={formData.eventType === "multi_day"} on:click={() => setEventType("multi_day")}>
            <div class="ce-event-type-icon"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 13h2m2 0h2m2 0h2M7 16h2m2 0h2m2 0h2" stroke="currentColor" opacity="0.6"/></svg></div><div class="ce-event-type-content"><span class="ce-event-type-title">{lang.multiDay}</span><span class="ce-event-type-desc">{lang.multiDayDesc}</span></div>{#if formData.eventType === "multi_day"}<div class="ce-event-type-check"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg></div>{/if}
          </button>
        </div>
        {#if formData.eventType === "multi_day"}
          <div class="ce-checkin-section"><span class="ce-checkin-label">{lang.maxCheckinsPerUser}</span><div class="ce-checkin-stepper"><button type="button" class="ce-stepper-btn" aria-label="Decrease max check-ins" on:click={() => { if (formData.maxCheckinsPerUser > 1) formData.maxCheckinsPerUser--; }} disabled={formData.maxCheckinsPerUser <= 1}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 12H6"></path></svg></button><div class="ce-stepper-value">{formData.maxCheckinsPerUser}</div><button type="button" class="ce-stepper-btn" aria-label="Increase max check-ins" on:click={() => { if (formData.maxCheckinsPerUser < 365) formData.maxCheckinsPerUser++; }} disabled={formData.maxCheckinsPerUser >= 365}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v12m6-6H6"></path></svg></button><span class="ce-stepper-unit">{lang.checkinTimes}</span></div></div>
        {/if}
      </div>

      <div class="ce-card ce-config-card">
        <div class="ce-card-head"><svg class="ce-icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg><span>{lang.dateAndTime}</span></div>
        <div class="ce-input-group"><label for="sDayInput">{lang.startDateLabel} <span class="ce-req">*</span></label><div class="ce-date-row" class:error={validationErrors.has("startDate")}><div class="ce-dd-wrap flex-1-5"><div class="ce-trigger" role="button" tabindex="0" on:click|stopPropagation={() => toggleDropdown("sDay")} on:keydown|stopPropagation={(e) => handleTriggerKeydown(e, "sDay")}><input id="sDayInput" type="text" value={formData.sDay} placeholder={lang.dayPlaceholder} class="ce-input-dis" readonly /><span class="ce-arrow">▼</span></div>{#if activeDropdown === "sDay"}<div class="ce-options" role="listbox" tabindex="0" on:click|stopPropagation on:keydown|stopPropagation={(e) => { if (e.key === 'Escape') activeDropdown = null }}>{#each days as d}<button class="ce-opt" on:click|stopPropagation={() => selectOption("sDay", d)}>{d}</button>{/each}</div>{/if}</div><div class="ce-dd-wrap flex-2"><div class="ce-trigger" role="button" tabindex="0" on:click|stopPropagation={() => toggleDropdown("sMonth")} on:keydown|stopPropagation={(e) => handleTriggerKeydown(e, "sMonth")}><input id="sMonthInput" type="text" value={translateMonth(formData.sMonth)} placeholder={lang.monthPlaceholder} class="ce-input-dis" readonly /><span class="ce-arrow">▼</span></div>{#if activeDropdown === "sMonth"}<div class="ce-options" role="listbox" tabindex="0" on:click|stopPropagation on:keydown|stopPropagation={(e) => { if (e.key === 'Escape') activeDropdown = null }}>{#each months as m, idx}<button class="ce-opt" on:click|stopPropagation={() => selectOption("sMonth", m)}>{displayMonths[idx]}</button>{/each}</div>{/if}</div><div class="ce-dd-wrap flex-1-5"><div class="ce-trigger" role="button" tabindex="0" on:click|stopPropagation={() => toggleDropdown("sYear")} on:keydown|stopPropagation={(e) => handleTriggerKeydown(e, "sYear")}><input id="sYearInput" type="text" value={formData.sYear} placeholder={lang.yearPlaceholder} class="ce-input-dis" readonly /><span class="ce-arrow">▼</span></div>{#if activeDropdown === "sYear"}<div class="ce-options" role="listbox" tabindex="0" on:click|stopPropagation on:keydown|stopPropagation={(e) => { if (e.key === 'Escape') activeDropdown = null }}>{#each years as y}<button class="ce-opt" on:click|stopPropagation={() => selectOption("sYear", y)}>{y}</button>{/each}</div>{/if}</div></div></div>
        <div class="ce-input-group"><label for="eDayInput">{lang.endDateLabel} <span class="ce-req">*</span></label>
        {#if formData.eventType === "single_day"}
          <div class="ce-input-group">
            <input type="text" value={`${formData.eDay} ${translateMonth(formData.eMonth)} ${formData.eYear}`} class="ce-input-dis" disabled style="background: rgba(15, 23, 42, 0.3); cursor: not-allowed;" />
            <div class="ce-helper-text">{lang.singleDayNote}</div>
          </div>
        {:else}
          <div class="ce-date-row" class:error={validationErrors.has("endDate")}><div class="ce-dd-wrap flex-1-5"><div class="ce-trigger" role="button" tabindex="0" on:click|stopPropagation={() => toggleDropdown("eDay")} on:keydown|stopPropagation={(e) => handleTriggerKeydown(e, "eDay")}><input id="eDayInput" type="text" value={formData.eDay} placeholder={lang.dayPlaceholder} class="ce-input-dis" readonly /><span class="ce-arrow">▼</span></div>{#if activeDropdown === "eDay"}<div class="ce-options" role="listbox" tabindex="0" on:click|stopPropagation on:keydown|stopPropagation={(e) => { if (e.key === 'Escape') activeDropdown = null }}>{#each days as d}<button class="ce-opt" on:click|stopPropagation={() => selectOption("eDay", d)}>{d}</button>{/each}</div>{/if}</div><div class="ce-dd-wrap flex-2"><div class="ce-trigger" role="button" tabindex="0" on:click|stopPropagation={() => toggleDropdown("eMonth")} on:keydown|stopPropagation={(e) => handleTriggerKeydown(e, "eMonth")}><input id="eMonthInput" type="text" value={translateMonth(formData.eMonth)} placeholder={lang.monthPlaceholder} class="ce-input-dis" readonly /><span class="ce-arrow">▼</span></div>{#if activeDropdown === "eMonth"}<div class="ce-options" role="listbox" tabindex="0" on:click|stopPropagation on:keydown|stopPropagation={(e) => { if (e.key === 'Escape') activeDropdown = null }}>{#each months as m, idx}<button class="ce-opt" on:click|stopPropagation={() => selectOption("eMonth", m)}>{displayMonths[idx]}</button>{/each}</div>{/if}</div><div class="ce-dd-wrap flex-1-5"><div class="ce-trigger" role="button" tabindex="0" on:click|stopPropagation={() => toggleDropdown("eYear")} on:keydown|stopPropagation={(e) => handleTriggerKeydown(e, "eYear")}><input id="eYearInput" type="text" value={formData.eYear} placeholder={lang.yearPlaceholder} class="ce-input-dis" readonly /><span class="ce-arrow">▼</span></div>{#if activeDropdown === "eYear"}<div class="ce-options" role="listbox" tabindex="0" on:click|stopPropagation on:keydown|stopPropagation={(e) => { if (e.key === 'Escape') activeDropdown = null }}>{#each years as y}<button class="ce-opt" on:click|stopPropagation={() => selectOption("eYear", y)}>{y}</button>{/each}</div>{/if}</div></div>
        {/if}
        </div>
        
        <div class="ce-dual-row">
          <div class="ce-input-group">
            <label for="startTimeInput">{lang.startTimeLabel} <span class="ce-req">*</span></label>
            <div class="ce-dd-wrap">
              <div class="ce-trigger" role="button" tabindex="0" on:click|stopPropagation={() => toggleDropdown("startTime")} on:keydown|stopPropagation={(e) => handleTriggerKeydown(e, "startTime")}>
                <input id="startTimeInput"
                  type="text" 
                  value={formData.startTime} 
                  placeholder="08:00" 
                  class="ce-input" 
                  class:error={validationErrors.has("startTime")} 
                  on:input={(e) => handleTimeInput("startTime", e)} 
                  on:click|stopPropagation={() => activeDropdown = "startTime"}
                />
                <span class="ce-arrow">▼</span>
              </div>
              {#if activeDropdown === "startTime"}
                <div class="ce-options time-scroll" role="listbox" tabindex="0" on:click|stopPropagation on:keydown|stopPropagation={(e) => { if (e.key === 'Escape') activeDropdown = null }}>
                  {#each times as t}
                    <button class="ce-opt" on:click|stopPropagation={() => selectOption("startTime", t)}>{t}</button>
                  {/each}
                </div>
              {/if}
            </div>
          </div>
          <div class="ce-input-group">
            <label for="endTimeInput">{lang.endTimeLabel} <span class="ce-req">*</span></label>
            <div class="ce-dd-wrap">
              <div class="ce-trigger" role="button" tabindex="0" on:click|stopPropagation={() => toggleDropdown("endTime")} on:keydown|stopPropagation={(e) => handleTriggerKeydown(e, "endTime")}>
                <input id="endTimeInput"
                  type="text" 
                  value={formData.endTime} 
                  placeholder="16:00" 
                  class="ce-input" 
                  class:error={validationErrors.has("endTime")} 
                  on:input={(e) => handleTimeInput("endTime", e)} 
                  on:click|stopPropagation={() => activeDropdown = "endTime"}
                />
                <span class="ce-arrow">▼</span>
              </div>
              {#if activeDropdown === "endTime"}
                <div class="ce-options time-scroll" role="listbox" tabindex="0" on:click|stopPropagation on:keydown|stopPropagation={(e) => { if (e.key === 'Escape') activeDropdown = null }}>
                  {#each times as t}
                    <button class="ce-opt" on:click|stopPropagation={() => selectOption("endTime", t)}>{t}</button>
                  {/each}
                </div>
              {/if}
            </div>
          </div>
        </div>

      </div>

      <div class="ce-card ce-config-card">
        <div class="ce-card-head"><svg class="ce-icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg><span>{lang.capacityAndSettings}</span></div>
        <div class="ce-dual-row"><div class="ce-input-group"><label for="totalSlotsInput">{lang.capacityLabel} <span class="ce-req">*</span></label><input id="totalSlotsInput" type="number" bind:value={formData.totalSlots} placeholder="100" class="ce-input" class:error={validationErrors.has("totalSlots")} min="1" /></div><div class="ce-input-group"><label for="distanceKmInput">{lang.distanceLabel}</label><input id="distanceKmInput" type="number" bind:value={formData.distanceKm} placeholder="5.0" class="ce-input" min="0" step="0.1" /></div></div>
      </div>

      {#if formData.eventType === "multi_day"}
      <div class="ce-card ce-config-card">
        <div class="ce-card-head"><svg class="ce-icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg><span>{lang.holidaysAndExclusions}</span></div>
        
        <HolidaySelector 
            bind:holidayType={formData.holidayType}
            bind:holidays={formData.specificDates}
            startDate={`${formData.sYear}-${String(months.indexOf(formData.sMonth) + 1).padStart(2, '0')}-${String(formData.sDay).padStart(2, '0')}`}
            endDate={`${formData.eYear}-${String(months.indexOf(formData.eMonth) + 1).padStart(2, '0')}-${String(formData.eDay).padStart(2, '0')}`}
            options={dateRangeOptions}
        />
      </div>
      {/if}

      <div class="ce-card ce-config-card">
        <div class="ce-card-head"><svg class="ce-icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"></path></svg><span>{lang.rewardsDistribution}</span></div>
        
        <div class="ce-reward-explanation">
          <svg class="ce-info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <div class="ce-explanation-text">
            <strong>วิธีการแจกรางวัล:</strong> ระบบจะรวมผู้เข้าร่วมทั้งหมดมาเรียงลำดับตามจำนวนรอบที่วิ่งได้ 
            ผู้ที่วิ่งได้มากกว่าจะได้รับรางวัลที่ดีกว่า โดยจำกัดรางวัลตามจำนวนที่กำหนด 
            <em>(ถึงแม้จะผ่านเกณฑ์ แต่ถ้าไม่ติดอันดับก็จะไม่ได้รับรางวัล)</em>
          </div>
        </div>

        <div class="ce-input-group">
          <label for="totalRewardsInput">{lang.totalRewardsLabel}</label>
          <input id="totalRewardsInput" type="number" bind:value={formData.totalRewards} placeholder="300" class="ce-input" min="1" />
          <div class="ce-helper-text">จำนวนคนทั้งหมดที่จะได้รับรางวัล (เช่น 300 คนแรก)</div>
        </div>

        <div class="ce-tier-divider">
          <span>ระดับรางวัล (เรียงจากยากไปง่าย)</span>
        </div>

        {#each formData.rewardTiers as tier, idx}
          <div class="ce-reward-tier">
            <div class="ce-tier-header">
              <span class="ce-tier-label">{lang.tierLabel} {idx + 1}</span>
              {#if formData.rewardTiers.length > 1}
                <button type="button" class="ce-btn-remove-tier" aria-label={`Remove reward tier ${idx + 1}`} on:click={() => removeRewardTier(idx)}>×</button>
              {/if}
            </div>
            <div class="ce-dual-row">
              <div class="ce-input-group">
                <label for={`reward-name-${idx}`}>{lang.rewardNameLabel}</label>
                <input id={`reward-name-${idx}`} type="text" bind:value={tier.reward_name} placeholder="เหรียญทอง, เสื้อยืด" class="ce-input" />
              </div>
              <div class="ce-input-group">
                <label for={`reward-req-${idx}`}>{lang.requirementLabel}</label>
                <input id={`reward-req-${idx}`} type="number" bind:value={tier.required_completions} placeholder="10" class="ce-input" min="1" />
              </div>
            </div>
            <div class="ce-tier-hint">
              💡 ผู้ที่วิ่งครบ <strong>{tier.required_completions || 0} รอบ</strong> และอยู่ใน <strong>{formData.totalRewards || 0} คนแรก</strong> จะได้รับ "{tier.reward_name || 'รางวัล'}"
            </div>
          </div>
        {/each}
        <button type="button" class="ce-btn-add-tier" on:click={addRewardTier}>{lang.addTierBtn}</button>
      </div>

      {#if editingEventId}
      <div class="ce-card ce-config-card">
        <div class="ce-card-head"><svg class="ce-icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg><span>{lang.eventStatusTitle}</span></div>
        <div class="ce-toggle-group">
          <label class="ce-toggle-item"><span>{lang.publicVisibility}</span><label class="ce-toggle-switch"><input type="checkbox" bind:checked={formData.isPublic} /><span class="ce-slider"></span></label></label>
          <label class="ce-toggle-item"><span>{lang.activeOpen}</span><label class="ce-toggle-switch"><input type="checkbox" bind:checked={formData.isActive} /><span class="ce-slider"></span></label></label>
        </div>
      </div>
      {/if}
    </div>
  </div>
</div>

<style>
  :global(:root) { --ce-bg: #0f172a; --ce-card-bg: #1e293b; --ce-border: rgba(255, 255, 255, 0.08); --ce-text: #f8fafc; --ce-text-muted: #94a3b8; --ce-primary: #10b981; --ce-primary-hover: #059669; --ce-danger: #ef4444; --ce-warning: #f59e0b; }
  .ce-wrapper { width: 100%; height: 100%; padding: 2rem 1.5rem;  overflow-y: auto; }
  .ce-container { max-width: 1200px; margin: 0 auto; }
  .ce-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; gap: 1rem; flex-wrap: wrap; }
  .ce-title { font-size: 2rem; font-weight: 700; color: var(--ce-text); margin: 0; }
  .ce-header-right { display: flex; align-items: center; gap: 1rem; }
  .ce-validation-alert { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1rem; background: rgba(239, 68, 68, 0.1); border: 1px solid var(--ce-danger); border-radius: 10px; color: var(--ce-danger); }
  .ce-alert-icon { width: 20px; height: 20px; }
  .ce-alert-text { font-size: 0.875rem; font-weight: 500; }
  .ce-header-actions { display: flex; gap: 0.75rem; }
  .ce-btn-cancel, .ce-btn-save { padding: 0.75rem 1.5rem; border-radius: 12px; font-weight: 600; font-size: 0.95rem; cursor: pointer; transition: all 0.2s; border: none; }
  .ce-btn-cancel { background: transparent; border: 1px solid var(--ce-border); color: var(--ce-text-muted); }
  .ce-btn-cancel:hover { border-color: var(--ce-danger); color: var(--ce-danger); background: rgba(239, 68, 68, 0.1); }
  .ce-btn-save { background: linear-gradient(135deg, var(--ce-primary), var(--ce-primary-hover)); color: white; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3); }
  .ce-btn-save:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4); }
  .ce-btn-save:disabled, .ce-btn-cancel:disabled { opacity: 0.65; cursor: not-allowed; transform: none; box-shadow: none; }
  .ce-btn-save { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; }
  .btn-spinner { width: 16px; height: 16px; color: var(--ce-primary); flex-shrink: 0; animation: ce-spin 1s linear infinite; }
  @keyframes ce-spin { to { transform: rotate(360deg); } }
  .btn-label { display: inline-block; }
  .ce-grid-layout { display: grid; grid-template-columns: 1fr; gap: 1.5rem; }
  .ce-card { background: var(--ce-card-bg); border: 1px solid var(--ce-border); border-radius: 20px; padding: 1.5rem; transition: all 0.3s; }
  .ce-card:hover { border-color: rgba(16, 185, 129, 0.2); box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3); }
  .ce-card-head { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--ce-border); }
  .ce-icon-svg { width: 24px; height: 24px; color: var(--ce-primary); }
  .ce-card-head span { font-size: 1.1rem; font-weight: 600; color: var(--ce-text); }
  .ce-img-card { position: relative; min-height: 300px; display: flex; align-items: center; justify-content: center; cursor: pointer; overflow: hidden; }
  .ce-img-card.has-img { padding: 0; }
  .ce-preview-img { width: 100%; height: 300px; object-fit: cover; }
  .ce-overlay { position: absolute; inset: 0; background: rgba(0, 0, 0, 0.7); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s; }
  .ce-img-card:hover .ce-overlay { opacity: 1; }
  .ce-overlay span { color: white; font-weight: 600; font-size: 1.1rem; }
  .ce-upload-placeholder { display: flex; flex-direction: column; align-items: center; gap: 1rem; color: var(--ce-text-muted); }
  .ce-icon-upload { width: 64px; height: 64px; background: rgba(16, 185, 129, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; }
  .ce-icon-upload svg { width: 32px; height: 32px; color: var(--ce-primary); }
  .ce-input-group { margin-bottom: 1.25rem; }
  .ce-input-group:last-child { margin-bottom: 0; }
  .ce-input-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; color: var(--ce-text); font-size: 0.95rem; }
  .ce-helper-text { margin-top: 0.5rem; font-size: 0.85rem; color: var(--ce-text-muted); font-style: italic; }
  .ce-reward-explanation { padding: 1rem; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; margin-bottom: 1.5rem; display: flex; gap: 0.75rem; align-items: flex-start; }
  .ce-info-icon { width: 24px; height: 24px; color: var(--ce-primary); flex-shrink: 0; margin-top: 0.125rem; }
  .ce-explanation-text { flex: 1; font-size: 0.9rem; color: var(--ce-text); line-height: 1.6; }
  .ce-explanation-text strong { color: var(--ce-primary); }
  .ce-explanation-text em { color: var(--ce-text-muted); font-style: italic; }
  .ce-tier-divider { margin: 1.5rem 0 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid var(--ce-border); }
  .ce-tier-divider span { font-weight: 600; color: var(--ce-text); font-size: 1rem; }
  .ce-tier-hint { margin-top: 0.75rem; padding: 0.75rem; background: rgba(245, 158, 11, 0.1); border-left: 3px solid var(--ce-warning); border-radius: 6px; font-size: 0.85rem; color: var(--ce-text-muted); line-height: 1.5; }
  .ce-tier-hint strong { color: var(--ce-text); }
  .ce-req { color: var(--ce-danger); }
  .ce-input, .ce-textarea, .ce-input-dis { width: 100%; padding: 0.75rem 1rem; background: rgba(15, 23, 42, 0.5); border: 1px solid var(--ce-border); border-radius: 12px; color: var(--ce-text); font-size: 0.95rem; transition: all 0.2s; }
  .ce-input:focus, .ce-textarea:focus { outline: none; border-color: var(--ce-primary); background: rgba(15, 23, 42, 0.7); }
  .ce-input.error, .ce-textarea.error, .ce-date-row.error { border-color: var(--ce-danger); }
  .ce-textarea { min-height: 120px; resize: vertical; }
  .ce-input-dis { cursor: pointer; }
  .ce-dual-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  .ce-event-type-buttons { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
  .ce-event-type-btn { display: flex; align-items: flex-start; gap: 1rem; padding: 1.25rem; background: rgba(15, 23, 42, 0.5); border: 2px solid var(--ce-border); border-radius: 16px; cursor: pointer; transition: all 0.3s; position: relative; }
  .ce-event-type-btn:hover { border-color: rgba(16, 185, 129, 0.3); background: rgba(16, 185, 129, 0.05); }
  .ce-event-type-btn.active { border-color: var(--ce-primary); background: rgba(16, 185, 129, 0.1); }
  .ce-event-type-icon { width: 48px; height: 48px; background: rgba(16, 185, 129, 0.1); border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .ce-event-type-icon svg { width: 24px; height: 24px; color: var(--ce-primary); }
  .ce-event-type-content { flex: 1; display: flex; flex-direction: column; gap: 0.25rem; }
  .ce-event-type-title { font-weight: 600; color: var(--ce-text); font-size: 1rem; }
  .ce-event-type-desc { font-size: 0.85rem; color: var(--ce-text-muted); line-height: 1.4; }
  .ce-event-type-check { position: absolute; top: 1rem; right: 1rem; width: 24px; height: 24px; background: var(--ce-primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; }
  .ce-event-type-check svg { width: 14px; height: 14px; color: white; }
  .ce-checkin-section { display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: rgba(15, 23, 42, 0.5); border-radius: 12px; }
  .ce-checkin-label { font-weight: 500; color: var(--ce-text); }
  .ce-checkin-stepper { display: flex; align-items: center; gap: 1rem; }
  .ce-stepper-btn { width: 36px; height: 36px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
  .ce-stepper-btn:hover:not(:disabled) { background: rgba(16, 185, 129, 0.2); border-color: var(--ce-primary); }
  .ce-stepper-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .ce-stepper-btn svg { width: 20px; height: 20px; color: var(--ce-primary); }
  .ce-stepper-value { min-width: 50px; text-align: center; font-size: 1.25rem; font-weight: 700; color: var(--ce-text); }
  .ce-stepper-unit { color: var(--ce-text-muted); font-size: 0.9rem; }
  .ce-date-row { display: flex; gap: 0.75rem; }
  .ce-dd-wrap { position: relative; flex: 1; }
  .ce-dd-wrap.flex-1-5 { flex: 1.5; }
  .ce-dd-wrap.flex-2 { flex: 2; }
  /* removed unused .ce-dd-wrap.flex-full selector */
  .ce-trigger { position: relative; cursor: pointer; }
  .ce-arrow { position: absolute; right: 1rem; top: 50%; transform: translateY(-50%); color: var(--ce-text-muted); font-size: 0.75rem; pointer-events: none; }
  .ce-options { position: absolute; top: calc(100% + 0.5rem); left: 0; right: 0; max-height: 240px; overflow-y: auto; background: var(--ce-card-bg); border: 1px solid var(--ce-border); border-radius: 12px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5); z-index: 100; padding: 0.5rem; }
  .ce-options.time-scroll { max-height: 300px; }
  .ce-opt { width: 100%; padding: 0.75rem 1rem; background: transparent; border: none; text-align: left; color: var(--ce-text); cursor: pointer; border-radius: 8px; transition: all 0.2s; font-size: 0.95rem; }
  .ce-opt:hover { background: rgba(16, 185, 129, 0.1); color: var(--ce-primary); }
    /* Removed several unused local selectors to silence svelte-check warnings.
      If these are later needed, reintroduce them in the component where used. */
  .ce-reward-tier { padding: 1.25rem; background: rgba(15, 23, 42, 0.5); border: 1px solid var(--ce-border); border-radius: 12px; margin-bottom: 1rem; }
  .ce-tier-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
  .ce-tier-label { font-weight: 600; color: var(--ce-primary); }
  .ce-btn-remove-tier { width: 28px; height: 28px; background: rgba(239, 68, 68, 0.1); border: none; border-radius: 50%; color: var(--ce-danger); font-size: 1.5rem; cursor: pointer; display: flex; align-items: center; justify-content: center; line-height: 1; }
  .ce-btn-add-tier { width: 100%; padding: 1rem; background: rgba(16, 185, 129, 0.1); border: 2px dashed rgba(16, 185, 129, 0.3); border-radius: 12px; color: var(--ce-primary); font-weight: 600; cursor: pointer; transition: all 0.2s; }
  .ce-btn-add-tier:hover { background: rgba(16, 185, 129, 0.2); border-color: var(--ce-primary); }
  .ce-toggle-group { display: flex; flex-direction: column; gap: 1rem; }
  .ce-toggle-item { display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: rgba(15, 23, 42, 0.5); border-radius: 12px; }
  .ce-toggle-item > span { font-weight: 500; color: var(--ce-text); }
  .ce-toggle-switch { position: relative; display: inline-block; width: 52px; height: 28px; }
  .ce-toggle-switch input { opacity: 0; width: 0; height: 0; }
  .ce-slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(255, 255, 255, 0.1); transition: 0.4s; border-radius: 34px; }
  .ce-slider:before { position: absolute; content: ""; height: 20px; width: 20px; left: 4px; bottom: 4px; background-color: white; transition: 0.4s; border-radius: 50%; }
  input:checked + .ce-slider { background-color: var(--ce-primary); }
  input:checked + .ce-slider:before { transform: translateX(24px); }
  @media (max-width: 768px) { .ce-wrapper { padding: 1rem; } .ce-title { font-size: 1.5rem; } .ce-header { flex-direction: column; align-items: flex-start; } .ce-header-right { width: 100%; flex-direction: column; } .ce-header-actions { width: 100%; } .ce-btn-cancel, .ce-btn-save { flex: 1; } .ce-event-type-buttons { grid-template-columns: 1fr; } .ce-dual-row { grid-template-columns: 1fr; } .ce-date-row { flex-direction: column; } }
</style>