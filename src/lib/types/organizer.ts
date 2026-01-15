// ==========================================
// 🎯 SHARED TYPES & INTERFACES
// ==========================================

// Language type
export type Language = "th" | "en";

// Event interface
export interface AppEvent {
  id: number;
  title: string;
  description: string;
  location: string;
  month: string;
  year: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  slots: number;
  registered: number;
  status: string;
  image: string;
  banner_image_url?: string;
  event_type?: string;
  allow_daily_checkin?: boolean;
  max_checkins_per_user?: number;
  is_active?: boolean;
  is_published?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Leaderboard entry
export interface LeaderboardEntry {
  user_id: number;
  user_name: string;
  email: string;
  rank: number;
  completions: number;
  total_distance_km: number;
  reward_tier?: string;
  reward_name?: string;
}

// Reward user
export interface RewardUser {
  id: string;
  name: string;
  email: string;
  nisit_id: string;
  faculty: string;
  phone: string;
  avatar: string;
  role: string;
  tier: string;
  tierIcon: string;
  tierColor: string;
  tierRange: string;
  rank: number;
  completions: number;
  totalDistance: number;
  status: string;
  joinedAt: string;
  completedAt: string;
  rewardId: string | null;
  rewardName: string;
  claimed: boolean;
  claimedAt: string | null;
}

// Reward data state
export interface RewardData {
  selectedEvent: AppEvent | null;
  users: RewardUser[];
  filteredUsers: RewardUser[];
  loading: boolean;
  error: string;
  searchQuery: string;
  filterTier: string;
  filterStatus: string;
  showSendAllModal: boolean;
  sendAllMessage: string;
  sendingMessages: boolean;
  messagesSent: number;
  messagesFailed: number;
  showMessageModal: boolean;
  messageUser: RewardUser | null;
  message: string;
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
  autoRefresh: boolean;
  showExportMenu: boolean;
  availableTiers: { name: string; icon: string; color: string }[];
}

// Log interface
export interface Log {
  id: string;
  eventId: string;
  eventTitle: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar: string;
  userNisitId?: string;
  participationId?: number;
  action: string;
  timestamp: string;
  status: string;
  proofImage?: string | null;
  details?: {
    registrationCode?: string;
    slotNumber?: number;
    rewardTier?: string;
    tierRange?: string;
    checkInMethod?: string;
    location?: string;
    joinedAt?: string;
    checkedInAt?: string;
    rewardName?: string;
    rank?: number;
    reason?: string;
    refundAmount?: number;
    changedFields?: string[];
    estimatedDelivery?: string;
  };
  metadata?: {
    ipAddress?: string;
    device?: string;
    role?: string;
    participationStatus?: string;
    joinedAt?: string;
    checkedInAt?: string;
    completedAt?: string;
    cancelledAt?: string;
    distance_covered?: number;
    actual_distance_km?: number;
    checkin_count?: number;
    proof_image_url?: string | null;
    proof_submitted_at?: string;
    strava_link?: string | null;
  };
}

// Logs data state
export interface LogsData {
  selectedEvent: AppEvent | null;
  logs: Log[];
  loading: boolean;
  error: string;
  searchQuery: string;
  selectedAction: string;
  selectedStatus: string;
  dateFrom: string;
  dateTo: string;
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
  actionDropdownOpen: boolean;
  statusDropdownOpen: boolean;
  dateFromDropdownOpen: boolean;
  dateToDropdownOpen: boolean;
  showDetailModal: boolean;
  selectedLog: Log | null;
  statistics: LogsStatistics;
  eventStats?: EventStats;
}

export interface LogsStatistics {
  totalLogs: number;
  uniqueUsers: number;
  successRate: number;
  topAction: string;
  totalRegistrations?: number;
  totalCheckIns?: number;
  totalRewards?: number;
  totalCancelled?: number;
}

export interface EventStats {
  total: number;
  by_status: Record<string, number>;
  by_role: { officer: number; student: number };
}

// Proof submission
export interface ProofSubmission {
  id: number;
  participationId: number;
  userId: number;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  nisitId?: string;
  eventId: number;
  eventTitle: string;
  proofImage: string | null;
  stravaLink?: string | null;
  distance?: number;
  status: string;
  submittedAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
}

// Verify proof data
export interface VerifyProofData {
  selectedEvent: AppEvent | null;
  submissions: ProofSubmission[];
  loading: boolean;
  error: string;
  searchQuery: string;
  filterStatus: string;
  autoRefresh: boolean;
  refreshInterval: number | null;
}

// Reward form (for creating events)
export interface RewardForm {
  name: string;
  requirement: number;
  quantity?: number;
}

// Create event form data
export interface CreateEventForm {
  title: string;
  description: string;
  location: string;
  eventType: string;
  allowDailyCheckin: boolean;
  maxCheckinsPerUser: number;
  isActive: boolean;
  isPublic: boolean;
  totalSlots: number;
  totalRewards: number;
  sDay: string;
  sMonth: string;
  sYear: string;
  sHour: string;
  sMinute: string;
  eDay: string;
  eMonth: string;
  eYear: string;
  eHour: string;
  eMinute: string;
  rewards: RewardForm[];
  holidayType: "none" | "thai" | "specific";
  excludeWeekends: boolean;
  specificDates: string[];
  bannerImage: File | null;
  bannerPreview: string | null;
}

// Reward config
export interface RewardConfig {
  id: number;
  event_id: number;
  name: string;
  description: string;
  required_completions: number;
  max_reward_recipients: number;
  reward_tiers: RewardTier[];
  starts_at: string;
  ends_at: string;
}

export interface RewardTier {
  tier: number;
  min_rank: number;
  max_rank: number;
  reward_id: number;
  reward_name: string;
  quantity: number;
  required_completions: number;
}

// User profile
export interface UserProfile {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  nisit_id?: string;
  phone?: string;
  faculty?: string;
  major?: string;
  department?: string;
  role: string;
  avatar_url?: string;
}

// Action type config
export interface ActionTypeConfig {
  value: string;
  label: string;
  labelTh: string;
  icon: string;
  color: string;
}

// Status type config
export interface StatusTypeConfig {
  value: string;
  label: string;
  labelTh: string;
  color: string;
}

// Performance data point
export interface PerfDataPoint {
  time: number;
  fps: number;
  memory?: number;
}
