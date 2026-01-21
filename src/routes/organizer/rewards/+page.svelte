<script lang="ts">
  import { onMount, afterUpdate, onDestroy, tick } from 'svelte';
  import axios from 'axios';
  import Swal from 'sweetalert2';
  import { endpoints } from '../_lib/api/endpoints'; //
  import { resolveImageUrl } from '$lib/utils/imageUtils';

  // ===== API Configuration =====
  // ใช้ client instance ที่อาจจะมีการ config interceptors ไว้แล้วในโปรเจคจริง หรือสร้างใหม่ที่นี่
  const API_BASE_URL = (
    (import.meta.env.VITE_API_BASE_URL && import.meta.env.VITE_API_BASE_URL.trim() !== "")
      ? import.meta.env.VITE_API_BASE_URL
      : 'http://158.108.102.14:8001'
  ).replace(/\/$/, "");

  if (!(import.meta.env.VITE_API_BASE_URL && import.meta.env.VITE_API_BASE_URL.trim() !== "")) {
    console.warn('[rewards] VITE_API_BASE_URL not set — falling back to', API_BASE_URL);
  }
  const IMAGE_PLACEHOLDER = 'https://placehold.co/400x200/94a3b8/ffffff?text=Loading...';
  const BADGE_PLACEHOLDER = 'https://placehold.co/64x64/94a3b8/ffffff?text=';
  
  function showApiError(err: any, defaultMsg = 'Server error') {
    console.error(err);
    let detail = defaultMsg;
    try {
      if (err && err.response && err.response.data) {
        const d = err.response.data;
        if (typeof d === 'string') detail = d;
        else if (d.detail) detail = d.detail;
        else if (d.message) detail = d.message;
        else detail = JSON.stringify(d);
      } else if (err && err.message) {
        detail = err.message;
      }
    } catch (e) {
      console.error('showApiError parse failed', e);
    }
    Swal.fire({ icon: 'error', title: lang.error, text: detail });
  }

  const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
  });

  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  // ===== Types (ปรับให้ตรงกับ Backend Pydantic Schemas) =====
  interface Event {
    id: number;
    title: string;
    description: string;
    location: string;
    start_date: string;
    end_date: string;
    image: string;
    status: string;
    is_active?: boolean;
    max_participants?: number;
    distance_km?: number;
  }
  
  // โครงสร้างข้อมูล Entry ที่ได้จาก API /api/reward-leaderboards/configs/{id}/entries
  interface RewardEntry {
    id: number; // Entry ID
    user_id: number;
    user_full_name: string;
    user_email: string;
    user_nisit_id?: string;
    user_role?: string;
    
    total_completions: number;
    rank: number;
    
    // Reward Info
    reward_id: number | null;
    reward_name?: string | null;
    reward_tier: number | null;
    
    // Timestamps
    qualified_at: string | null;
    rewarded_at: string | null;
    
    created_at?: string;
    updated_at?: string;
  }
  
  interface RewardTier {
    tier: number;
    reward_id: number;
    reward_name: string;
    quantity: number;
    required_completions: number;
    min_rank: number;
    max_rank: number;
  }

  interface RewardConfig {
    id: number;
    event_id: number;
    name: string;
    description: string;
    max_reward_recipients: number;
    required_completions: number;
    starts_at: string;
    ends_at: string;
    is_finalized: boolean;
    finalized_at: string | null;
    reward_tiers: RewardTier[];
  }
  
  // Reward definitions (API /rewards)
  interface RewardRead {
    id: number;
    name: string;
    description?: string | null;
    badge_image_url?: string | null;
    required_completions: number;
    time_period_days: number;
    created_at?: string;
    updated_at?: string;
  }

  interface UserRewardRead {
    id: number;
    user_id: number;
    reward_id: number;
    earned_at: string;
    earned_month: number;
    earned_year: number;
  }
  
  interface Statistics {
    totalParticipants: number;
    totalRewarded: number;
    totalQualified: number;
    totalPending: number;
    averageCompletions: number;
    topCompletion: number;
  }
  
  // ===== Language =====
  type Language = "th" | "en";
  let currentLang: Language = "th";
  
  if (typeof localStorage !== "undefined") {
    const saved = localStorage.getItem("app_language");
    if (saved === "th" || saved === "en") currentLang = saved;
  }
  
  const translations = {
    th: {
      rewardManagement: "จัดการรางวัล",
      selectEvent: "เลือกกิจกรรม",
      backToEvents: "กลับไปเลือกกิจกรรม",
      loading: "กำลังโหลด...",
      noEvents: "ไม่มีกิจกรรม",
      noData: "ไม่มีข้อมูล (กรุณากดคำนวณอันดับ)",
      viewRewards: "ดูรางวัล",
      calculateRanks: "คำนวณอันดับ",
      finalizeLeaderboard: "ยืนยันผลรางวัล",
      resetLeaderboard: "รีเซ็ตผลรางวัล",
      export: "ส่งออก",
      exportPNG: "ส่งออกรูปภาพ",
      exportPDF: "ส่งออก PDF",
      exportCSV: "ส่งออก CSV",
      exportJSON: "ส่งออก JSON",
      rank: "อันดับ",
      name: "ชื่อ",
      email: "อีเมล",
      nisitId: "รหัสนิสิต",
      completions: "จำนวนครั้ง",
      status: "สถานะ",
      reward: "รางวัล",
      rewardedAt: "ได้รับรางวัลเมื่อ",
      qualified: "มีสิทธิ์",
      rewarded: "ได้รับรางวัลแล้ว",
      notQualified: "ไม่ผ่านเกณฑ์",
      pending: "รอดำเนินการ",
      finalized: "ยืนยันแล้ว",
      notFinalized: "ยังไม่ยืนยัน",
      enabled: "เปิดใช้งาน",
      disabled: "ปิดใช้งาน",
      totalParticipants: "ผู้เข้าร่วมทั้งหมด",
      totalRewarded: "ได้รับรางวัลแล้ว",
      totalQualified: "มีสิทธิ์รับรางวัล",
      totalPending: "รอดำเนินการ",
      averageCompletions: "เฉลี่ยจำนวนครั้ง",
      topCompletion: "สูงสุด",
      search: "ค้นหา...",
      filterByStatus: "กรองตามสถานะ",
      filterByTier: "กรองตามระดับ",
      allStatus: "ทุกสถานะ",
      allTiers: "ทุกระดับ",
      reset: "รีเซ็ต",
      apply: "ใช้งาน",
      showingResults: "แสดง",
      of: "จาก",
      results: "รายการ",
      confirmCalculate: "คุณต้องการคำนวณอันดับหรือไม่?",
      confirmCalculateText: "ระบบจะดึงข้อมูลการเข้าร่วมและจัดอันดับใหม่ (Preview)",
      confirmFinalize: "ยืนยันการแจกรางวัล?",
      confirmFinalizeText: "เมื่อยืนยันแล้วจะไม่สามารถแก้ไขได้ รางวัลจะถูกแจกให้ผู้ได้รับตามอันดับทันที",
      confirmReset: "รีเซ็ตผลรางวัล?",
      confirmResetText: "การกระทำนี้จะลบผลการคำนวณทั้งหมด คุณแน่ใจหรือไม่?",
      success: "สำเร็จ",
      error: "เกิดข้อผิดพลาด",
      rankCalculated: "คำนวณอันดับเรียบร้อย",
      leaderboardFinalized: "ยืนยันผลรางวัลเรียบร้อย",
      leaderboardReset: "รีเซ็ตผลรางวัลเรียบร้อย",
      calculating: "กำลังคำนวณ...",
      finalizing: "กำลังยืนยัน...",
      resetting: "กำลังรีเซ็ต...",
      step1: "ขั้นตอนที่ 1: คำนวณอันดับ",
      step2: "ขั้นตอนที่ 2: ตรวจสอบผล",
      step3: "ขั้นตอนที่ 3: ยืนยันผลรางวัล",
      step1Desc: "คำนวณอันดับและสิทธิ์รับรางวัลตามจำนวนครั้งที่เข้าร่วม (Simulate)",
      step2Desc: "ตรวจสอบความถูกต้องของผลการคำนวณในตารางด้านล่าง",
      step3Desc: "ยืนยันผลและแจกรางวัลให้ผู้ได้รับ (ไม่สามารถแก้ไขได้)",
      role: "บทบาท",
      participant: "ผู้เข้าร่วม",
      officer: "เจ้าหน้าที่",
      tier: "ระดับ",
      noConfigTitle: "ไม่พบการตั้งค่ารางวัล",
      noConfigDesc: "กิจกรรมนี้ยังไม่ได้ตั้งค่า Leaderboard กรุณาตั้งค่าในหน้าแก้ไขกิจกรรมก่อน",
      requiredCompletions: "จำนวนครั้งที่ต้องการ",
    },
    en: {
      rewardManagement: "Reward Management",
      selectEvent: "Select Event",
      backToEvents: "Back to Events",
      loading: "Loading...",
      noEvents: "No events",
      noData: "No data (Please calculate ranks)",
      viewRewards: "View Rewards",
      calculateRanks: "Calculate Ranks",
      finalizeLeaderboard: "Finalize Leaderboard",
      resetLeaderboard: "Reset Leaderboard",
      export: "Export",
      exportPNG: "Export PNG",
      exportPDF: "Export PDF",
      exportCSV: "Export CSV",
      exportJSON: "Export JSON",
      rank: "Rank",
      name: "Name",
      email: "Email",
      nisitId: "Nisit ID",
      completions: "Completions",
      status: "Status",
      reward: "Reward",
      rewardedAt: "Rewarded At",
      qualified: "Qualified",
      rewarded: "Rewarded",
      notQualified: "Not Qualified",
      pending: "Pending",
      finalized: "Finalized",
      notFinalized: "Not Finalized",
      enabled: "Enabled",
      disabled: "Disabled",
      totalParticipants: "Total Participants",
      totalRewarded: "Rewarded",
      totalQualified: "Qualified",
      totalPending: "Pending",
      averageCompletions: "Average",
      topCompletion: "Top",
      search: "Search...",
      filterByStatus: "Filter by Status",
      filterByTier: "Filter by Tier",
      allStatus: "All Status",
      allTiers: "All Tiers",
      reset: "Reset",
      apply: "Apply",
      showingResults: "Showing",
      of: "of",
      results: "results",
      confirmCalculate: "Calculate ranks?",
      confirmCalculateText: "System will fetch participation data and simulate ranking",
      confirmFinalize: "Finalize leaderboard?",
      confirmFinalizeText: "Once finalized, changes cannot be made. Rewards will be distributed.",
      confirmReset: "Reset leaderboard?",
      confirmResetText: "This will delete all calculations. Are you sure?",
      success: "Success",
      error: "Error",
      rankCalculated: "Ranks calculated successfully",
      leaderboardFinalized: "Leaderboard finalized successfully",
      leaderboardReset: "Leaderboard reset successfully",
      calculating: "Calculating...",
      finalizing: "Finalizing...",
      resetting: "Resetting...",
      step1: "Step 1: Calculate Ranks",
      step2: "Step 2: Review Results",
      step3: "Step 3: Finalize Rewards",
      step1Desc: "Calculate ranks and eligibility based on participation count (Simulate)",
      step2Desc: "Review calculation results for accuracy in the table below",
      step3Desc: "Confirm and distribute rewards (cannot be changed)",
      role: "Role",
      participant: "Participant",
      officer: "Officer",
      tier: "Tier",
      noConfigTitle: "No Reward Configuration",
      noConfigDesc: "This event has no leaderboard configuration. Please configure it in the event settings.",
      requiredCompletions: "Required completions",
    }
  };
  
  $: lang = translations[currentLang];
  
  // ===== State =====
  let view: 'events' | 'leaderboard' = 'events';
  let loading = false;
  let events: Event[] = [];
  let selectedEvent: Event | null = null;
  let rewardConfig: RewardConfig | null = null;
  let rewards: RewardEntry[] = [];
  let filteredRewards: RewardEntry[] = [];
  // list of reward definitions from GET /rewards
  let rewardDefinitions: RewardRead[] = [];
  // Cache for fetched user profiles to avoid repeated requests
  const userCache: Record<number, any> = {};
  const USE_MOCK_REWARDS = !!import.meta.env.DEV;
  let statistics: Statistics = {
    totalParticipants: 0,
    totalRewarded: 0,
    totalQualified: 0,
    totalPending: 0,
    averageCompletions: 0,
    topCompletion: 0
  };

  // ===== Filters =====
  let searchQuery = "";
  let selectedStatus = "";
  let selectedTier = "";
  let statusDropdownOpen = false;
  let tierDropdownOpen = false;
  
  // ===== Pagination =====
  let currentPage = 1;
  const itemsPerPage = 15;
  let showPageDropdown = false;
  // Events pagination (for events view)
  let eventsPage = 1;
  const eventsPerPage = 9;
  let showEventsPageDropdown = false;
  
  // ===== Modals & Actions =====
  let showExportMenu = false;
  let isExporting = false;
  let isCalculating = false;
  let isFinalizing = false;
  let isResetting = false;
  
  // ===== Computed =====
  $: paginatedRewards = filteredRewards.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  $: totalPages = Math.ceil(filteredRewards.length / itemsPerPage);

  // Events pagination computed
  $: paginatedEvents = events.slice((eventsPage - 1) * eventsPerPage, eventsPage * eventsPerPage);
  $: totalEventsPages = Math.max(1, Math.ceil(events.length / eventsPerPage));
  
  // ===== Helper Functions =====
  function getStatusLabel(entry: RewardEntry): string {
    if (entry.rewarded_at) return lang.rewarded;
    if (entry.qualified_at) return lang.qualified;
    return lang.notQualified;
  }
  
  function getStatusColor(entry: RewardEntry): string {
    if (entry.rewarded_at) return "#10b981";
    if (entry.qualified_at) return "#f59e0b";
    return "#64748b";
  }
  
  function getRankBadgeColor(rank: number): string {
    if (rank === 1) return "linear-gradient(135deg, #fbbf24, #f59e0b)";
    if (rank === 2) return "linear-gradient(135deg, #cbd5e1, #94a3b8)";
    if (rank === 3) return "linear-gradient(135deg, #fb923c, #f97316)";
    return "linear-gradient(135deg, #3b82f6, #2563eb)";
  }
  
  function formatTimestamp(timestamp: string | null): string {
    if (!timestamp) return "-";
    const date = new Date(timestamp);
    return date.toLocaleDateString(currentLang === "th" ? "th-TH" : "en-GB", {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }
  
  function formatDateRange(event: Event | null): string {
    if (!event) return "-";
    const start = new Date(event.start_date);
    const end = new Date(event.end_date);
    const locale = currentLang === "th" ? "th-TH" : "en-GB";
    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
    if (start.toDateString() === end.toDateString()) {
      return start.toLocaleDateString(locale, options);
    }
    return `${start.toLocaleDateString(locale, options)} - ${end.toLocaleDateString(locale, options)}`;
  }
  
  function calculateStatistics() {
    // compute into a new object then reassign to trigger Svelte reactivity
    const newStats: Statistics = {
      totalParticipants: rewards.length,
      totalRewarded: rewards.filter(r => r.rewarded_at).length,
      totalQualified: rewards.filter(r => r.qualified_at && !r.rewarded_at).length,
      totalPending: rewards.filter(r => !r.qualified_at).length,
      averageCompletions: 0,
      topCompletion: 0
    };

    const completions = rewards.map(r => r.total_completions);
    newStats.averageCompletions = completions.length > 0
      ? Math.round(completions.reduce((a, b) => a + b, 0) / completions.length * 10) / 10
      : 0;
    newStats.topCompletion = Math.max(...completions, 0);

    // debug: show computed values
    console.debug('[rewards] calculateStatistics', {
      rewardsCount: rewards.length,
      rewarded: newStats.totalRewarded,
      qualified: newStats.totalQualified,
      pending: newStats.totalPending,
      average: newStats.averageCompletions,
      top: newStats.topCompletion
    });

    // reassign to ensure Svelte notices the change
    statistics = newStats;
  }

  // Fetch and cache user profile by ID
  async function ensureUser(userId: number) {
    if (!userId) return null;
    if (userCache[userId]) return userCache[userId];
    try {
      const res = await api.get(endpoints.users.getById(userId));
      userCache[userId] = res.data;
      return userCache[userId];
    } catch (e) {
      console.warn('Could not fetch user', userId, e);
      userCache[userId] = null;
      return null;
    }
  }

  function formatUserName(entry: RewardEntry) {
    const u = userCache[entry.user_id];
    if (u && (u.first_name || u.last_name)) return `${u.first_name || ''} ${u.last_name || ''}`.trim();
    return entry.user_full_name || '-';
  }

  function formatNisitId(entry: RewardEntry) {
    const u = userCache[entry.user_id];
    return (u && (u.nisit_id || u.nisitId)) || entry.user_nisit_id || '-';
  }
  
  // ===== Data Loading =====
  async function loadEvents() {
    loading = true;
    try {
      // ใช้ endpoints.events.list
      const res = await api.get(endpoints.events.list);
      const data = res.data;
      // รองรับโครงสร้าง response แบบต่างๆ
      const rawEvents = Array.isArray(data) ? data : (data.data || []);
      
      events = rawEvents.map((e: any) => ({
        id: e.id,
        title: e.title || e.name,
        description: e.description,
        location: e.location,
        start_date: e.start_date || e.event_date,
        end_date: e.end_date || e.event_end_date,
        image: resolveImageUrl(e.banner_image_url || e.cover_image_url || e.image || ''),
        status: e.is_active ? 'Active' : 'Closed',
        is_active: !!e.is_active,
        max_participants: e.max_participants,
        distance_km: e.distance_km,
      }));
      // After updating events, wait for DOM update then initialize lazy loader
      await tick();
      lazyLoadImages();
    } catch (err) {
      console.error('Failed to load events', err);
      Swal.fire({ icon: 'error', title: lang.error, text: 'Could not load events' });
    } finally {
      loading = false;
    }
  }

  async function selectEventForRewards(event: Event) {
    selectedEvent = event;
    loading = true;
    rewards = [];
    rewardConfig = null;
    
    try {
      // 1. ดึง Config ของ Event นี้
      // ใช้ endpoints.rewards.config(eventId)
      const configRes = await api.get(endpoints.rewards.config(event.id));
      rewardConfig = configRes.data;

      if (rewardConfig && rewardConfig.id) {
          // 2. ถ้ามี Config ให้ดึง Entries (Leaderboard)
          // ใช้ endpoints.rewards.entries(configId)
          const entriesRes = await api.get(endpoints.rewards.entries(rewardConfig.id));
          const entriesData = entriesRes.data;
          const rawEntries = Array.isArray(entriesData) ? entriesData : (entriesData.entries || []);
          
          rewards = rawEntries.map((r: any) => ({
             id: r.id,
             user_id: r.user_id,
             // รองรับการ map field ที่อาจแตกต่างกันเล็กน้อย
             user_full_name: r.user_full_name || r.user_name || 'Unknown',
             user_email: r.user_email || r.email || '',
             user_nisit_id: r.user_nisit_id || r.nisit_id,
             user_role: r.user_role || 'participant',
             total_completions: r.total_completions || 0,
             rank: r.rank || 0,
             reward_id: r.reward_id,
             reward_name: r.reward_name, // Backend อาจส่งชื่อมา หรือต้อง lookup จาก tier
             reward_tier: r.reward_tier,
             qualified_at: r.qualified_at,
             rewarded_at: r.rewarded_at,
             created_at: r.created_at,
             updated_at: r.updated_at
          }));
            if (import.meta.env.DEV) console.debug('[rewards] loaded entries', { count: rewards.length, first: rewards[0] });

          // Prefetch user profiles for displayed entries (cache)
          try {
            const userIds = Array.from(new Set(rewards.map(r => r.user_id).filter(Boolean)));
            await Promise.all(userIds.map((id: number) => ensureUser(id)));
            if (import.meta.env.DEV) console.debug('[rewards] prefetched users', Object.keys(userCache).length);
          } catch (e) {
            console.warn('Prefetch users failed', e);
          }
      } else {
          // กรณีไม่มี Config อาจจะยังไม่เคยตั้งค่า
          console.warn("No reward config found for this event.");
      }

      calculateStatistics();
      applyFilters();
      if (import.meta.env.DEV) console.debug('[rewards] after selectEventForRewards', { view, rewardsLength: rewards.length, filteredLength: filteredRewards.length, statistics });
      view = 'leaderboard';
    } catch (err) {
      console.error('Error loading reward data', err);
      // หาก error 404 ที่ config อาจหมายถึงยังไม่สร้าง ให้แสดงหน้าว่างๆ หรือแจ้งเตือน
      view = 'leaderboard';
      rewards = [];
    } finally {
      loading = false;
    }
  }
  
  // ===== Filter Functions =====
  function applyFilters() {
    filteredRewards = rewards.filter(reward => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const match = (reward.user_full_name && reward.user_full_name.toLowerCase().includes(q)) ||
                      (reward.user_email && reward.user_email.toLowerCase().includes(q)) ||
                      (reward.user_nisit_id && reward.user_nisit_id.toLowerCase().includes(q));
        if (!match) return false;
      }
      
      if (selectedStatus) {
        const status = getStatusLabel(reward);
        if (status !== selectedStatus) return false;
      }
      
      if (selectedTier) {
        if (!reward.reward_tier || reward.reward_tier.toString() !== selectedTier) return false;
      }
      return true;
    });
    currentPage = 1;
    if (import.meta.env.DEV) console.debug('[rewards] applyFilters', { rewardsLength: rewards.length, filteredLength: filteredRewards.length, searchQuery, selectedStatus, selectedTier });
  }
  
  function resetFilters() {
    searchQuery = "";
    selectedStatus = "";
    selectedTier = "";
    applyFilters();
  }
  
  function closeAllDropdowns() {
    statusDropdownOpen = false;
    tierDropdownOpen = false;
    showExportMenu = false;
  }
  
  // ===== Action Functions =====
  
  // STEP 1: Calculate Ranks
  async function calculateRanks() {
    if (!rewardConfig) {
        Swal.fire({ icon: 'warning', title: lang.noEvents, text: lang.noConfigDesc });
        return;
    }

    const result = await Swal.fire({
      title: lang.confirmCalculate,
      text: lang.confirmCalculateText,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: lang.calculateRanks,
      cancelButtonText: lang.reset,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#64748b'
    });

    if (result.isConfirmed) {
      isCalculating = true;
      try {
        // ใช้ endpoint calculate-ranks
        // POST /api/reward-leaderboards/configs/{config_id}/calculate-ranks
        // หมายเหตุ: ใน endpoints.ts ไม่ได้ระบุ calculate-ranks ชัดเจน อาจจะต้องเพิ่ม หรือใช้ path manual
        const url = endpoints.rewards.preview(rewardConfig.id);
        const res = await api.post(url);
        
        // Response น่าจะคืนค่า stats หรือ entries ที่อัปเดตแล้ว
        // เพื่อความชัวร์ ให้ reload data ใหม่
        await selectEventForRewards(selectedEvent!);

        Swal.fire({ icon: 'success', title: lang.success, text: lang.rankCalculated, timer: 2000 });
      } catch (err) {
        showApiError(err, 'Failed to calculate ranks');
      } finally {
        isCalculating = false;
      }
    }
  }
  
  // STEP 3: Finalize
  async function finalizeLeaderboard() {
    if (!rewardConfig) return;

    const result = await Swal.fire({
      title: lang.confirmFinalize,
      text: lang.confirmFinalizeText,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: lang.finalizeLeaderboard,
      cancelButtonText: lang.reset,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b'
    });

    if (result.isConfirmed) {
      isFinalizing = true;
      try {
          // Ensure we have an access token
          const token = localStorage.getItem('access_token');
          if (!token) {
            Swal.fire({ icon: 'warning', title: 'Unauthorized', text: 'Please log in before finalizing.' });
            isFinalizing = false;
            return;
          }

          // endpoints.rewards.finalize expects JSON body { config_id: number, confirm: boolean }
          const payload = { config_id: rewardConfig.id, confirm: true };
          const url = endpoints.rewards.finalize(rewardConfig.id);
          console.debug('[rewards] finalize URL:', url);
          console.debug('[rewards] finalize payload:', payload);

          // POST to the canonical finalize endpoint with JSON body
          await api.post(url, payload, { headers: { 'Content-Type': 'application/json' } });
        
        // Reload to get updated status (is_finalized = true)
        await selectEventForRewards(selectedEvent!);

        Swal.fire({ icon: 'success', title: lang.success, text: lang.leaderboardFinalized, timer: 2000 });
      } catch (err) {
        showApiError(err, 'Failed to finalize leaderboard');
      } finally {
        isFinalizing = false;
      }
    }
  }
  
  async function resetLeaderboard() {
     // ฟังก์ชัน Reset อาจจะไม่มี Endpoint โดยตรงในบาง implementation
     // แต่ถ้ามีให้ใช้ logic ทำนองเดียวกัน
     Swal.fire({ icon: 'info', title: 'Info', text: 'Feature not available in this version' });
  }
  
  function backToEvents() {
    view = 'events';
    selectedEvent = null;
    rewards = [];
    rewardConfig = null;
  }
  
  // ===== Export Functions =====
  function toggleExportMenu() {
    showExportMenu = !showExportMenu;
  }
  
  async function exportLeaderboard(format: 'png' | 'pdf' | 'csv' | 'json') {
    isExporting = true;
    showExportMenu = false;
    
    try {
      if (format === 'csv') exportAsCSV();
      else if (format === 'json') exportAsJSON();
      
      Swal.fire({
        icon: 'success',
        title: lang.success,
        text: `Exported as ${format.toUpperCase()}`,
        timer: 1500
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: lang.error,
        text: 'Export failed',
        timer: 2000
      });
    } finally {
      isExporting = false;
    }
  }
  
  function exportAsCSV() {
    const headers = ['Rank','User ID','Name','Email','Nisit ID','Role','Completions','Status','Reward','Qualified At','Rewarded At','Created At'];
    const rows = filteredRewards.map((r) => {
      const user = userCache[r.user_id] || null;
      const name = (user && (user.first_name || user.last_name)) ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : (r.user_full_name || '-');
      const email = (user && user.email) || r.user_email || '-';
      const nisit = (user && (user.nisit_id || user.nisitId)) || r.user_nisit_id || '-';
      const role = (user && user.role) || r.user_role || '-';
      const rewardLabel = r.reward_name || (r.reward_tier ? `Tier ${r.reward_tier}` : '-');

      return [
        r.rank ?? '-',
        r.user_id ?? '-',
        name,
        email,
        nisit,
        role,
        r.total_completions ?? 0,
        getStatusLabel(r),
        rewardLabel,
        formatTimestamp(r.qualified_at),
        formatTimestamp(r.rewarded_at),
        r.created_at || ''
      ];
    });
    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    downloadFile(csv, `reward-leaderboard-${selectedEvent?.id}-${Date.now()}.csv`, 'text/csv');
  }
  
  function exportAsJSON() {
    const json = JSON.stringify({
      event: selectedEvent,
      config: rewardConfig,
      statistics,
      entries: filteredRewards
    }, null, 2);
    downloadFile(json, `reward-leaderboard-${selectedEvent?.id}-${Date.now()}.json`, 'application/json');
  }
  
  function downloadFile(content: string, filename: string, type: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }
  
  // ===== Pagination =====
  function nextPage() {
    if (currentPage < totalPages) currentPage++;
  }
  function prevPage() {
    if (currentPage > 1) currentPage--;
  }
  function jumpToPage(page: number) {
    currentPage = page;
  }

  // Events pagination handlers
  function prevEventsPage() { if (eventsPage > 1) eventsPage--; }
  function nextEventsPage() { if (eventsPage < totalEventsPages) eventsPage++; }
  function jumpToEventsPage(p: number) { eventsPage = p; showEventsPageDropdown = false; }
  
  // ===== Lifecycle =====
  onMount(() => {
    // Defer loading events to idle time to avoid blocking initial render
    try {
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => loadEvents());
      } else {
        setTimeout(() => loadEvents(), 200);
      }
    } catch (e) {
      setTimeout(() => loadEvents(), 200);
    }
    loadRewardDefinitions();
    // Initialize lazy image loader
    lazyLoadImages();
  });

  // Load reward definitions (GET /rewards)
  async function loadRewardDefinitions(skip = 0, limit = 100) {
    try {
      // Try several common endpoint paths in case the API base differs across environments
      const candidates = [] as string[];
      if ((endpoints as any)?.rewards?.list) candidates.push((endpoints as any).rewards.list);
      // Common REST prefixes
      candidates.push('/api/rewards', '/api/v1/rewards', '/rewards');

      let res = null;
      let usedUrl = '';
      for (const url of candidates) {
        try {
          res = await api.get(url, { params: { skip, limit } });
          usedUrl = url;
          break;
        } catch (e: any) {
          // If 404 or other client/server error, try next candidate
          if (import.meta.env.DEV) console.debug('[rewards] endpoint candidate failed', { url, status: e?.response?.status, message: e?.message });
          continue;
        }
      }

      if (!res) {
        throw new Error('No reward list endpoint available');
      }

      const data = res.data;
      const raw = Array.isArray(data) ? data : (data.data || data.items || []);
      rewardDefinitions = raw.map((r: any) => ({
        id: r.id,
        name: r.name,
        description: r.description ?? null,
        badge_image_url: r.badge_image_url ?? null,
        required_completions: typeof r.required_completions === 'number' ? r.required_completions : (r.required_completions ?? 3),
        time_period_days: typeof r.time_period_days === 'number' ? r.time_period_days : (r.time_period_days ?? 30),
        created_at: r.created_at,
        updated_at: r.updated_at
      }));

      // Deduplicate by id and filter out unhelpful numeric-only names
      const byId = new Map<number, RewardRead>();
      for (const rd of rewardDefinitions) {
        if (!byId.has(rd.id)) byId.set(rd.id, rd);
      }
      rewardDefinitions = Array.from(byId.values()).filter(rd => {
        const name = (rd.name ?? '').toString().trim();
        // drop empty names
        if (!name) return false;
        // drop names that are purely numeric (likely an id or bad label)
        if (/^\d+$/.test(name)) return false;
        // drop names that exactly equal the numeric id
        if (name === String(rd.id)) return false;
        return true;
      });

      if (import.meta.env.DEV) console.log('[rewards] loaded reward definitions from', usedUrl, 'count=', rewardDefinitions.length);

      // If we're in dev and nothing returned, fall back to a small mock so UI can be previewed
      if (USE_MOCK_REWARDS && rewardDefinitions.length === 0) {
        rewardDefinitions = [
          { id: 1, name: 'Early Bird', description: 'Join early to get this badge', badge_image_url: 'https://placehold.co/64x64', required_completions: 3, time_period_days: 30 },
          { id: 2, name: 'Consistent', description: 'Attend regularly for a month', badge_image_url: 'https://placehold.co/64x64', required_completions: 10, time_period_days: 30 }
        ];
      }
      // After updating rewardDefinitions (badges), ensure lazy loader attaches to badge images
      await tick();
      lazyLoadImages();
    } catch (err) {
      console.warn('Failed to load reward definitions', err);
      // Keep UI usable in dev — provide small mock set
      if (USE_MOCK_REWARDS) {
        rewardDefinitions = [
          { id: 1, name: 'Early Bird', description: 'Join early to get this badge', badge_image_url: 'https://placehold.co/64x64', required_completions: 3, time_period_days: 30 },
          { id: 2, name: 'Consistent', description: 'Attend regularly for a month', badge_image_url: 'https://placehold.co/64x64', required_completions: 10, time_period_days: 30 }
        ];
      }
    }
  }

  // Improved lazy-loading helper using a single IntersectionObserver instance.
  // Images should use the `lazy-img` class and `data-src` attribute.
  // Additionally we cache loaded image URLs in sessionStorage so that when
  // the user navigates away and back the images show immediately without
  // requiring a full page refresh.
  const IMG_CACHE_KEY_PREFIX = 'lazy-img:';
  let lazyObserver: IntersectionObserver | null = null;

  function safeSessionGet(key: string) {
    try { return sessionStorage.getItem(key); } catch (e) { return null; }
  }
  function safeSessionSet(key: string, val: string) {
    try { sessionStorage.setItem(key, val); } catch (e) { /* ignore */ }
  }

  function lazyLoadImages() {
    if (typeof window === 'undefined') return;
    const imgs = Array.from(document.querySelectorAll('img.lazy-img')) as HTMLImageElement[];
    if (!imgs.length) return;

    // If IntersectionObserver not supported, eagerly set src for all images
    if (!('IntersectionObserver' in window)) {
      imgs.forEach(img => {
        const s = img.dataset.src;
        if (s) {
          img.src = s;
          img.removeAttribute('data-src');
          img.classList.add('loaded');
        }
      });
      return;
    }

    // First, apply cached src for any images we've loaded previously
    imgs.forEach(img => {
      const s = img.dataset.src;
      if (s && safeSessionGet(IMG_CACHE_KEY_PREFIX + s)) {
        img.src = s;
        img.removeAttribute('data-src');
        img.classList.add('loaded');
      }
    });

    // Create observer if needed (idempotent)
    if (!lazyObserver) {
      lazyObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const img = entry.target as HTMLImageElement;
          const src = img.dataset.src;
          if (src) {
            img.src = src;
            img.removeAttribute('data-src');
            img.classList.add('loaded');
            safeSessionSet(IMG_CACHE_KEY_PREFIX + src, '1');
          }
          observer.unobserve(img);
        });
      }, { rootMargin: '200px' });
    }

    imgs.forEach(i => {
      // if image already loaded by cache or previous observation, skip
      if (!i.dataset.src) return;
      lazyObserver!.observe(i);
    });
  }

  onDestroy(() => {
    try { if (lazyObserver) { lazyObserver.disconnect(); lazyObserver = null; } } catch (e) { /* ignore */ }
  });

  // Ensure the lazy loader runs when component mounts and after updates
  onMount(() => {
    lazyLoadImages();
  });
  afterUpdate(() => {
    lazyLoadImages();
  });

  // Finalize availability: cannot finalize before event end
  $: _endsAtRaw = (rewardConfig && rewardConfig.ends_at) || (selectedEvent && selectedEvent.end_date) || null;
  $: endsAt = _endsAtRaw ? new Date(_endsAtRaw) : null;
  $: isFinalizable = endsAt ? (new Date() >= endsAt) : true;
  $: endsAtFormatted = endsAt ? endsAt.toLocaleString(currentLang === 'th' ? 'th-TH' : 'en-GB') : null;
</script>

<svelte:window on:click={closeAllDropdowns} />

<div class="reward-management-container">
  {#if view === 'events'}
    <div class="events-view">
      
      
      {#if loading}
        <div class="loading-state">
          <div class="spinner"></div>
          <p>{lang.loading}</p>
        </div>
      {:else if events.length === 0}
        <div class="empty-state">
          <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <p>{lang.noEvents}</p>
        </div>
      {:else}
        <div class="events-grid">
          {#each paginatedEvents as event}
            <div class="event-card">
              <div class="event-image-wrapper">
                <img
                  class="event-image lazy-img"
                  data-src={event.image || 'https://placehold.co/400x200/1e293b/ffffff?text=No+Image'}
                  src={IMAGE_PLACEHOLDER}
                  alt={event.title}
                  loading="lazy"
                  decoding="async"
                />
                <div class="event-status-badge" class:active={event.is_active} class:closed={!event.is_active}>
                  {event.is_active ? lang.enabled : lang.disabled}
                </div>
              </div>
              
              <div class="event-card-body">
                <h3 class="event-title">{event.title}</h3>
                <p class="event-description">{event.description ? event.description.substring(0, 100) + '...' : ''}</p>
                
                <div class="event-meta">
                  <div class="meta-item">
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                    <span>{event.location}</span>
                  </div>
                  
                  <div class="meta-item">
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    <span>{formatDateRange(event)}</span>
                  </div>
                </div>
                
                <button class="btn-view-rewards" on:click={() => selectEventForRewards(event)}>
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"></path>
                  </svg>
                  {lang.viewRewards}
                </button>
              </div>
            </div>
          {/each}
        </div>

        {#if totalEventsPages > 1}
          <div class="pagination-wrapper" style="margin-top:1.5rem;">
            <div class="pagination-controls">
              <button class="page-btn" aria-label={currentLang === 'th' ? 'ก่อนหน้า' : 'Previous'} on:click={() => { if (eventsPage > 1) eventsPage--; }} disabled={eventsPage === 1}>
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
              </button>
              <div class="page-select-wrapper">
                  <button class="page-indicator-box" on:click|stopPropagation={() => showEventsPageDropdown = !showEventsPageDropdown}>
                      <span class="current-page">{eventsPage}</span><span class="sep">/</span><span class="total-page">{totalEventsPages}</span>
                      <svg class="dropdown-arrow" class:flipped={showEventsPageDropdown} width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7"></path></svg>
                  </button>
                  {#if showEventsPageDropdown}
                      <div class="click-outside" role="button" tabindex="0" aria-hidden="true" on:click|stopPropagation={() => showEventsPageDropdown = false} on:keydown|stopPropagation={(e) => { if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') showEventsPageDropdown = false; }}></div>
                      <div class="page-dropdown-list">
                          {#each Array(totalEventsPages) as _, i}
                            <button class="page-option" class:active={eventsPage === i + 1} on:click|stopPropagation={() => { eventsPage = i + 1; showEventsPageDropdown = false; }}>{'Page ' + (i + 1)}</button>
                          {/each}
                      </div>
                  {/if}
              </div>
              <button class="page-btn" aria-label={currentLang === 'th' ? 'ถัดไป' : 'Next'} on:click={() => { if (eventsPage < totalEventsPages) eventsPage++; }} disabled={eventsPage === totalEventsPages}>
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
              </button>
            </div>
            <div class="showing-text">{lang.showingResults} {(eventsPage - 1) * eventsPerPage + 1} - {Math.min(eventsPage * eventsPerPage, events.length)} {lang.of} {events.length} {lang.results}</div>
          </div>
        {/if}
      {/if}
    </div>
  {:else}
    <div class="leaderboard-view">
      <div class="reward-header">
        <button class="btn-back" on:click={backToEvents}>
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
          </svg>
          {lang.backToEvents}
        </button>
        
        <div class="header-info">
          <h1>{selectedEvent?.title}</h1>
          <div class="event-meta-small">
            <span>{formatDateRange(selectedEvent)}</span>
            {#if rewardConfig}
              <span class="config-status" class:finalized={rewardConfig.is_finalized}>
                {rewardConfig.is_finalized ? lang.finalized : lang.notFinalized}
              </span>
            {/if}
          </div>
        </div>
        
        <div class="header-actions">
          <button class="btn-export" on:click|stopPropagation={toggleExportMenu} disabled={isExporting}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
            </svg>
            {lang.export}
          </button>
          
          {#if showExportMenu}
            <div class="export-menu">
              <button class="export-option" on:click={() => exportLeaderboard('csv')}>
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                {lang.exportCSV}
              </button>
              <button class="export-option" on:click={() => exportLeaderboard('json')}>
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
                </svg>
                {lang.exportJSON}
              </button>
            </div>
          {/if}
        </div>
      </div>
      
      <!-- reward definitions preview removed per request -->

      {#if !rewardConfig && !loading}
        <div class="empty-state">
            <p style="color: #ef4444; font-size: 1.2rem; font-weight: bold;">{lang.noConfigTitle}</p>
            <p>{lang.noConfigDesc}</p>
        </div>
      {:else}
      <div class="action-steps">
        <div class="step-card">
          <div class="step-number">1</div>
          <div class="step-content">
            <h3>{lang.step1}</h3>
            <p>{lang.step1Desc}</p>
            <button 
              class="btn-step" 
              on:click={calculateRanks}
              disabled={isCalculating || rewardConfig?.is_finalized}
            >
              {#if isCalculating}
                <div class="btn-spinner"></div>
                {lang.calculating}
              {:else}
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                </svg>
                {lang.calculateRanks}
              {/if}
            </button>
          </div>
        </div>
        
        <div class="step-card">
          <div class="step-number">2</div>
          <div class="step-content">
            <h3>{lang.step2}</h3>
            <p>{lang.step2Desc}</p>
            <div class="step-status">
              ✓ {lang.step2}
            </div>
          </div>
        </div>
        
        <div class="step-card">
          <div class="step-number">3</div>
          <div class="step-content">
            <h3>{lang.step3}</h3>
            <p>{lang.step3Desc}</p>
            <button 
              class="btn-step btn-danger" 
              on:click={finalizeLeaderboard}
              disabled={isFinalizing || rewardConfig?.is_finalized || !isFinalizable}
              title={!isFinalizable ? `Cannot finalize before event ends (${endsAtFormatted})` : ''}
            >
              {#if isFinalizing}
                <div class="btn-spinner"></div>
                {lang.finalizing}
              {:else}
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                {lang.finalizeLeaderboard}
              {/if}
            </button>
              {#if !isFinalizable}
                <div class="hint-block" style="margin-top:0.5rem;color:#f97316;font-size:0.95rem;">
                  Cannot finalize before event ends ({endsAtFormatted})
                </div>
              {/if}
          </div>
        </div>
      </div>
      
      <div class="stats-dashboard">
        <div class="stat-card">
          <div class="stat-icon" style="background: rgba(59, 130, 246, 0.1);">
            <svg width="24" height="24" fill="none" stroke="#3b82f6" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
          </div>
          <div class="stat-info">
            <div class="stat-value">{statistics.totalParticipants}</div>
            <div class="stat-label">{lang.totalParticipants}</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon" style="background: rgba(16, 185, 129, 0.1);">
            <svg width="24" height="24" fill="none" stroke="#10b981" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <div class="stat-info">
            <div class="stat-value">{statistics.totalRewarded}</div>
            <div class="stat-label">{lang.totalRewarded}</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon" style="background: rgba(245, 158, 11, 0.1);">
            <svg width="24" height="24" fill="none" stroke="#f59e0b" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <div class="stat-info">
            <div class="stat-value">{statistics.totalQualified}</div>
            <div class="stat-label">{lang.totalQualified}</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon" style="background: rgba(168, 85, 247, 0.1);">
            <svg width="24" height="24" fill="none" stroke="#a855f7" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
          </div>
          <div class="stat-info">
            <div class="stat-value">{statistics.averageCompletions}</div>
            <div class="stat-label">{lang.averageCompletions}</div>
          </div>
        </div>
      </div>
      
      <div class="filter-section">
        <div class="search-box">
          <svg class="search-icon" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
          <input
            type="text"
            placeholder={lang.search}
            bind:value={searchQuery}
            on:input={applyFilters}
            class="search-input"
          />
        </div>
        
        <div class="filter-dropdown" class:dropdown-open={statusDropdownOpen}>
          <button class="filter-trigger" on:click|stopPropagation={() => {
            const wasOpen = statusDropdownOpen;
            closeAllDropdowns();
            statusDropdownOpen = !wasOpen;
          }}>
            <span>{selectedStatus || lang.allStatus}</span>
            <svg class="chevron" class:rotated={statusDropdownOpen} width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>
          {#if statusDropdownOpen}
            <div class="filter-menu">
              <button class="filter-option" class:selected={!selectedStatus} on:click|stopPropagation={() => { selectedStatus = ""; statusDropdownOpen = false; applyFilters(); }}>{lang.allStatus}</button>
              <button class="filter-option" class:selected={selectedStatus === lang.rewarded} on:click|stopPropagation={() => { selectedStatus = lang.rewarded; statusDropdownOpen = false; applyFilters(); }}><span style="color: #10b981;">●</span> {lang.rewarded}</button>
              <button class="filter-option" class:selected={selectedStatus === lang.qualified} on:click|stopPropagation={() => { selectedStatus = lang.qualified; statusDropdownOpen = false; applyFilters(); }}><span style="color: #f59e0b;">●</span> {lang.qualified}</button>
              <button class="filter-option" class:selected={selectedStatus === lang.notQualified} on:click|stopPropagation={() => { selectedStatus = lang.notQualified; statusDropdownOpen = false; applyFilters(); }}><span style="color: #64748b;">●</span> {lang.notQualified}</button>
            </div>
          {/if}
        </div>
        
        <button class="btn-reset-filter" on:click={resetFilters}>
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
          {lang.reset}
        </button>
      </div>
      
      <div class="table-wrapper">
        {#if filteredRewards.length === 0}
          <div class="empty-state">
            <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <p>{lang.noData}</p>
          </div>
        {:else}
          <table class="leaderboard-table">
            <thead>
              <tr>
                <th>{lang.rank}</th>
                <th>{lang.name}</th>
                <th>{lang.email}</th>
                <th>{lang.nisitId}</th>
                <th>{lang.role}</th>
                <th>{lang.completions}</th>
                <th>{lang.status}</th>
                <th>{lang.reward}</th>
                <th>{lang.rewardedAt}</th>
              </tr>
            </thead>
            <tbody>
              {#each paginatedRewards as entry}
                <tr>
                  <td>
                    <div class="rank-badge" style="background: {getRankBadgeColor(entry.rank)};">
                      #{entry.rank}
                    </div>
                  </td>
                  <td class="name-cell">{formatUserName(entry)}</td>
                  <td class="email-cell">{userCache[entry.user_id]?.email || entry.user_email}</td>
                  <td class="nisit-cell">{formatNisitId(entry)}</td>
                  <td>
                    <span class="role-badge" class:officer={entry.user_role === 'officer'}>
                      {entry.user_role === 'officer' ? lang.officer : lang.participant}
                    </span>
                  </td>
                  <td class="completions-cell">{entry.total_completions}</td>
                  <td>
                    <span class="status-badge" style="background: {getStatusColor(entry)}20; border-color: {getStatusColor(entry)}40; color: {getStatusColor(entry)};">
                      {getStatusLabel(entry)}
                    </span>
                  </td>
                  <td class="reward-cell">
                    {#if entry.reward_name}
                        <span class="tier-badge"><span class="tier-text">{entry.reward_name}</span></span>
                    {:else if entry.reward_tier && rewardConfig}
                      {@const tier = rewardConfig.reward_tiers.find(t => t.tier === entry.reward_tier)}
                      {#if tier}
                        <span class="tier-badge"><span class="tier-text">{tier.reward_name}</span></span>
                      {:else}
                        Tier {entry.reward_tier}
                      {/if}
                    {:else}
                      -
                    {/if}
                  </td>
                  <td class="date-cell">{formatTimestamp(entry.rewarded_at)}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        {/if}
      </div>
      
      {#if totalPages > 1}
        <div class="pagination-wrapper">
          <div class="pagination-controls">
            <button class="page-btn" on:click={prevPage} disabled={currentPage === 1} aria-label={currentLang === 'th' ? 'ก่อนหน้า' : 'Previous'}>
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
              </svg>
            </button>
            <div class="page-select-wrapper">
              <button class="page-indicator-box" on:click|stopPropagation={() => showPageDropdown = !showPageDropdown}>
                <span class="current-page">{currentPage}</span>
                <span class="sep">/</span>
                <span class="total-page">{totalPages}</span>
                <svg class="dropdown-arrow" class:flipped={showPageDropdown} width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>
              {#if showPageDropdown}
                <div
                  class="click-outside"
                  role="button"
                  tabindex="0"
                  aria-label={currentLang === 'th' ? 'ปิด' : 'Close'}
                  on:click|stopPropagation={() => showPageDropdown = false}
                  on:keydown|stopPropagation={(e) => { if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') { showPageDropdown = false } }}
                ></div>
                <div class="page-dropdown-list">
                  {#each Array(totalPages) as _, i}
                    <button class="page-option" class:active={currentPage === i + 1} on:click|stopPropagation={() => { jumpToPage(i + 1); showPageDropdown = false; }}>
                      Page {i + 1}
                    </button>
                  {/each}
                </div>
              {/if}
            </div>
            <button class="page-btn" on:click={nextPage} disabled={currentPage === totalPages} aria-label={currentLang === 'th' ? 'ถัดไป' : 'Next'}>
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </button>
          </div>
          <div class="showing-text">
            {lang.showingResults} {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredRewards.length)} {lang.of} {filteredRewards.length} {lang.results}
          </div>
        </div>
      {/if}
      {/if}
    </div>
  {/if}
</div>

<style>
  /* ใช้ Style เดิมทั้งหมด (ไม่ได้เปลี่ยนแปลง CSS) */
  .reward-management-container { width: 100%; min-height: 100vh;  }
  .events-view { max-width: 1400px; margin: 0 auto; padding: 2rem; }
  /* page header removed per design preference */
  .events-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 2rem; }
  .event-card { background: rgba(30, 41, 59, 0.6); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 20px; overflow: hidden; transition: all 0.3s; }
  .event-card { min-width: 0; }
  .event-card:hover { transform: translateY(-4px); border-color: rgba(16, 185, 129, 0.4); box-shadow: 0 12px 30px rgba(0, 0, 0, 0.3); }
  .event-image-wrapper { position: relative; width: 100%; height: 200px; overflow: hidden; }
  .event-image { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s; }
  .event-card:hover .event-image { transform: scale(1.05); }
  .event-status-badge { position: absolute; top: 1rem; right: 1rem; padding: 0.5rem 1rem; border-radius: 12px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; backdrop-filter: blur(10px); }
  .event-status-badge.active { background: rgba(16, 185, 129, 0.9); color: white; }
  .event-status-badge.closed { background: rgba(100, 116, 139, 0.9); color: white; }
  .event-card-body { padding: 1.5rem; }
  .event-title { font-size: 1.25rem; font-weight: 700; color: #f8fafc; margin-bottom: 0.75rem; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%; }
  .event-description { color: #cbd5e1; font-size: 0.9rem; line-height: 1.6; margin-bottom: 1rem; }
  .event-meta { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.5rem; }
  .meta-item { display: flex; align-items: center; gap: 0.5rem; color: #94a3b8; font-size: 0.875rem; }
  .meta-item svg { flex-shrink: 0; color: #10b981; }
  .btn-view-rewards { width: 100%; padding: 0.875rem 1.25rem; background: linear-gradient(135deg, #10b981, #059669); border: none; border-radius: 12px; color: white; font-weight: 600; font-size: 0.95rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; cursor: pointer; transition: all 0.3s; }
  .btn-view-rewards:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4); }
  .leaderboard-view { max-width: 1600px; margin: 0 auto; padding: 2rem; }
  .reward-header { background: rgba(30, 41, 59, 0.6); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 20px; padding: 1.5rem; margin-bottom: 2rem; display: flex; align-items: center; gap: 1.5rem; flex-wrap: wrap;position: relative;
  z-index: 30; }
  .btn-back { background: rgba(100, 116, 139, 0.2); border: 1px solid rgba(100, 116, 139, 0.3); color: #94a3b8; padding: 0.75rem 1.25rem; border-radius: 12px; display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-size: 0.9rem; font-weight: 600; transition: all 0.2s; flex-shrink: 0; }
  .btn-back:hover { background: rgba(100, 116, 139, 0.3); border-color: #64748b; color: #f8fafc; transform: translateX(-2px); }
  .header-info { flex: 1; min-width: 0; }
  .header-info h1 { font-size: 1.75rem; font-weight: 700; color: #f8fafc; margin: 0 0 0.5rem 0; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%; }
  .event-meta-small { display: flex; align-items: center; gap: 1rem; font-size: 0.9rem; color: #94a3b8; }
  .config-status { display: inline-flex; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; background: rgba(100, 116, 139, 0.2); border: 1px solid rgba(100, 116, 139, 0.3); color: #64748b; }
  .config-status.finalized { background: rgba(16, 185, 129, 0.2); border-color: rgba(16, 185, 129, 0.3); color: #10b981; }
  .header-actions { display: flex; gap: 0.75rem; position: relative; }
  .btn-export { background: rgba(59, 130, 246, 0.2); border: 1px solid rgba(59, 130, 246, 0.3); color: #3b82f6; padding: 0.75rem 1.25rem; border-radius: 12px; font-weight: 600; font-size: 0.9rem; display: flex; align-items: center; gap: 0.5rem; cursor: pointer; transition: all 0.2s; }
  .btn-export:hover { background: rgba(59, 130, 246, 0.3); border-color: #3b82f6; }
  .btn-export:disabled { opacity: 0.5; cursor: not-allowed; }
  .export-menu { position: absolute; top: calc(100% + 0.5rem); right: 0; background: #1e293b; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 0.5rem; min-width: 200px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5); z-index: 1000; animation: slideDown 0.2s ease; }
  .export-option { width: 100%; padding: 0.75rem 1rem; background: transparent; border: none; color: #f8fafc; text-align: left; cursor: pointer; border-radius: 8px; font-size: 0.9rem; display: flex; align-items: center; gap: 0.75rem; transition: all 0.2s; }
  .export-option:hover { background: rgba(16, 185, 129, 0.1); color: #10b981; }
  .action-steps { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
  .step-card { background: rgba(30, 41, 59, 0.6); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 20px; padding: 1.5rem; display: flex; gap: 1rem; transition: all 0.3s; }
  .step-card:hover { border-color: rgba(16, 185, 129, 0.3); transform: translateY(-2px); }
  .step-number { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #10b981, #059669); color: white; font-weight: 700; font-size: 1.25rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .step-content { flex: 1; }
  .step-content h3 { font-size: 1rem; font-weight: 700; color: #f8fafc; margin: 0 0 0.5rem 0; }
  .step-content p { font-size: 0.875rem; color: #94a3b8; line-height: 1.6; margin: 0 0 1rem 0; }
  .btn-step { width: 100%; padding: 0.75rem 1rem; border: none; border-radius: 12px; color: white; font-weight: 600; font-size: 0.875rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; cursor: pointer; transition: all 0.2s; background: linear-gradient(135deg, #10b981, #059669); }
  .btn-step:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); }
  .btn-step:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn-step.btn-danger { background: linear-gradient(135deg, #ef4444, #dc2626); }
  .btn-step.btn-danger:hover:not(:disabled) { box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3); }
  /* removed unused .btn-step.btn-reset to silence css_unused_selector */
  .step-status { padding: 0.75rem 1rem; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 12px; color: #10b981; font-size: 0.875rem; font-weight: 600; text-align: center; }
  /* removed unused .step-reset to silence css_unused_selector */
  .btn-spinner { width: 16px; height: 16px; border: 2px solid rgba(255, 255, 255, 0.3); border-top-color: white; border-radius: 50%; animation: spin 0.6s linear infinite; }
  .stats-dashboard { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
  .stat-card { background: rgba(30, 41, 59, 0.6); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 1.5rem; display: flex; align-items: center; gap: 1rem; transition: all 0.3s; }
  .stat-card:hover { transform: translateY(-2px); border-color: rgba(16, 185, 129, 0.3); box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3); }
  .stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .stat-info { display: flex; flex-direction: column; gap: 0.25rem; }
  .stat-value { font-size: 2rem; font-weight: 700; color: #f8fafc; line-height: 1; }
  .stat-label { font-size: 0.875rem; font-weight: 500; color: #94a3b8; line-height: 1; }
  .filter-section { position: relative;
  z-index: 20;background: rgba(30, 41, 59, 0.6); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 20px; padding: 1.5rem; margin-bottom: 2rem; display: flex; gap: 1rem; flex-wrap: wrap; align-items: center; }
  .search-box { flex: 1; min-width: 250px; position: relative; }
  .search-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #64748b; pointer-events: none; }
  .search-input { width: 100%; padding: 0.75rem 1rem 0.75rem 2.75rem; background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; color: #f8fafc; font-size: 0.9rem; }
  .search-input::placeholder { color: #64748b; }
  .search-input:focus { outline: none; border-color: #10b981; box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1); }
  .filter-dropdown { position: relative; }
  .filter-trigger { padding: 0.75rem 1rem; background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; color: #f8fafc; font-size: 0.9rem; display: flex; align-items: center; gap: 0.5rem; cursor: pointer; min-width: 180px; transition: all 0.2s; }
  .filter-trigger:hover { border-color: rgba(16, 185, 129, 0.4); }
  .chevron { margin-left: auto; transition: transform 0.2s; }
  .chevron.rotated { transform: rotate(180deg); }
  .filter-menu { position: absolute; top: calc(100% + 0.5rem); left: 0; background: #1e293b; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 0.5rem; min-width: 220px; max-height: 300px; overflow-y: auto; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5); z-index: 1000; animation: slideDown 0.2s ease; }
  .filter-option { width: 100%; padding: 0.75rem 1rem; background: transparent; border: none; color: #f8fafc; text-align: left; cursor: pointer; border-radius: 8px; font-size: 0.9rem; display: flex; align-items: center; gap: 0.5rem; transition: all 0.2s; }
  .filter-option:hover { background: rgba(16, 185, 129, 0.1); }
  .filter-option.selected { background: rgba(16, 185, 129, 0.2); color: #10b981; }
  .btn-reset-filter { padding: 0.75rem 1.25rem; background: rgba(100, 116, 139, 0.2); border: 1px solid rgba(100, 116, 139, 0.3); border-radius: 12px; color: #94a3b8; font-weight: 600; font-size: 0.9rem; display: flex; align-items: center; gap: 0.5rem; cursor: pointer; transition: all 0.2s; }
  .btn-reset-filter:hover { background: rgba(100, 116, 139, 0.3); border-color: #64748b; }
  .table-wrapper { background: rgba(30, 41, 59, 0.6); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 20px; overflow: hidden; margin-bottom: 2rem; }
  .leaderboard-table { width: 100%; border-collapse: collapse; }
  .leaderboard-table thead { background: rgba(15, 23, 42, 0.8); }
  .leaderboard-table th { padding: 1rem; text-align: left; font-weight: 600; font-size: 0.875rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255, 255, 255, 0.08); }
  .leaderboard-table td { padding: 1rem; border-bottom: 1px solid rgba(255, 255, 255, 0.05); font-size: 0.9rem; color: #f8fafc; }
    .leaderboard-table td { overflow: hidden; }
  .leaderboard-table tbody tr { transition: all 0.2s; }
  .leaderboard-table tbody tr:hover { background: rgba(16, 185, 129, 0.05); }
  .rank-badge { display: inline-flex; align-items: center; justify-content: center; min-width: 50px; padding: 0.5rem 0.75rem; border-radius: 12px; font-weight: 700; font-size: 0.9rem; color: white; }
  .name-cell { font-weight: 600; color: #f8fafc; }
  .email-cell { color: #94a3b8; font-size: 0.85rem; }
  .nisit-cell { font-family: 'Courier New', monospace; color: #10b981; font-weight: 600; }
  .role-badge { display: inline-flex; padding: 0.375rem 0.75rem; border-radius: 12px; font-size: 0.8rem; font-weight: 600; background: rgba(168, 85, 247, 0.2); border: 1px solid rgba(168, 85, 247, 0.3); color: #a855f7; }
  .role-badge.officer { background: rgba(59, 130, 246, 0.2); border-color: rgba(59, 130, 246, 0.3); color: #3b82f6; }
  .completions-cell { font-weight: 700; font-size: 1.1rem; color: #10b981; }
  .status-badge { display: inline-flex; padding: 0.375rem 0.75rem; border: 1px solid; border-radius: 12px; font-size: 0.8rem; font-weight: 600; }
  .tier-badge { display: inline-flex; padding: 0.375rem 0.75rem; border-radius: 12px; font-size: 0.8rem; font-weight: 600; background: rgba(245, 158, 11, 0.2); border: 1px solid rgba(245, 158, 11, 0.3); color: #f59e0b; min-width: 0; align-items: center; gap: 0.375rem; }
  .tier-badge .tier-text { display: inline-block; max-width: 10rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; vertical-align: middle; }
  .tier-badge { min-width: 0; gap: 0.375rem; align-items: center; }
  .tier-badge .tier-text { display: inline-block; max-width: 10rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; vertical-align: middle; }
  .date-cell { color: #94a3b8; font-size: 0.85rem; }
  .reward-cell { max-width: 200px; overflow: hidden; }
  .pagination-wrapper { display: flex; flex-direction: column; align-items: center; gap: 1rem; }
  .pagination-controls { display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
  .page-btn { width: 40px; height: 40px; margin: 0; border-radius: 12px; background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(255, 255, 255, 0.08); color: #f8fafc; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
  .page-btn:hover:not(:disabled) { background: rgba(16, 185, 129, 0.2); border-color: #10b981; }
  .page-btn:disabled { opacity: 0.3; cursor: not-allowed; }
  .page-select-wrapper { position: relative; display: flex; align-items: center; min-width: 0; }
  .page-indicator-box { padding: 0.5rem 1rem; background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-weight: 600; color: #f8fafc; }
  .page-indicator-box .sep { color: #64748b; }
  .dropdown-arrow { transition: transform 0.2s; }
  .dropdown-arrow.flipped { transform: rotate(180deg); }
  .page-dropdown-list { position: absolute; top: calc(100% + 0.5rem); left: 0; transform: none; background: #1e293b; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 0; max-height: 300px; overflow-y: auto; min-width: 100%; width: 100%; box-sizing: border-box; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5); z-index: 2147483647; animation: slideDown 0.2s ease; }
  .page-option { display: block; width: 100%; padding: 0.75rem 1rem; background: transparent; border: none; color: #f8fafc; text-align: left; cursor: pointer; font-size: 0.95rem; transition: background 0.12s, color 0.12s; box-sizing: border-box; }
  .page-option:hover { background: rgba(16, 185, 129, 0.06); }
  .page-option.active { background: rgba(16, 185, 129, 0.15); color: #10b981; font-weight: 700; box-shadow: inset 0 0 0 1px rgba(16,185,129,0.06); }
  .page-option:first-child { border-top-left-radius: 12px; border-top-right-radius: 12px; }
  .page-option:last-child { border-bottom-left-radius: 12px; border-bottom-right-radius: 12px; }
  .showing-text { font-size: 0.9rem; color: #94a3b8; }
  .click-outside { position: fixed; inset: 0; z-index: 999; }
  .loading-state, .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem 2rem; color: #64748b; }
  .empty-state svg { margin-bottom: 1rem; }
  .loading-state p, .empty-state p { font-size: 1rem; margin: 0; }
  .spinner { width: 48px; height: 48px; border: 4px solid rgba(16, 185, 129, 0.1); border-top-color: #10b981; border-radius: 50%; animation: spin 1s linear infinite; }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes spin { to { transform: rotate(360deg); } }
  @media (max-width: 1024px) { .stats-dashboard { grid-template-columns: repeat(3, 1fr); } .action-steps { grid-template-columns: 1fr; } }
  @media (max-width: 768px) { .events-view, .leaderboard-view { padding: 1rem; } .events-grid { grid-template-columns: 1fr; } .reward-header { flex-direction: column; align-items: stretch; } .header-actions { width: 100%; } .btn-export { flex: 1; } .stats-dashboard { grid-template-columns: repeat(2, 1fr); } .filter-section { flex-direction: column; align-items: stretch; } .search-box, .filter-dropdown, .btn-reset-filter { width: 100%; } .table-wrapper { overflow-x: auto; } .leaderboard-table { min-width: 900px; } }
  @media (max-width: 640px) { .stats-dashboard { grid-template-columns: 1fr; } .header-info h1 { font-size: 1.5rem; } }
</style>