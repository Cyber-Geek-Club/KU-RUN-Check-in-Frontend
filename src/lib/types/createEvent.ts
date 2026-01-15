// ==========================================
// 🔧 CREATE EVENT TYPES
// ==========================================

export interface CreateEventForm {
  title: string;
  description: string;
  location: string;
  sDay: string;
  sMonth: string;
  sYear: string;
  eDay: string;
  eMonth: string;
  eYear: string;
  startTime: string;
  endTime: string;
  totalSlots: number | null;
  distanceKm: number | null;
  holidays: string[];
  excludeWeekends: boolean;
  holidayType: 'none' | 'weekends' | 'specific';
  specificDates: string[];
  tempHoliday: string;
  totalRewards: number | null;
  requiredCompletions: number | null;
  rewards: RewardTier[];
  isPublic: boolean;
  isActive: boolean;
  imagePreview: string | null;
  eventType: 'single_day' | 'multi_day';
  allowDailyCheckin: boolean;
  maxCheckinsPerUser: number;
  rewardTiers?: RewardTier[];
}

export interface RewardTier {
  name: string;
  requirement: number | null;
  tier?: number;
  quota?: number | null;
  rangeStart?: number;
  rangeEnd?: number | null;
  reward_id?: number;
  required_completions?: number;
  max_reward_recipients?: number;
  description?: string;
}

export interface AppEvent {
  id: number;
  title: string;
  description?: string;
  image: string;
  location: string;
  finalized_at?: string | null;
  startDate?: {
    day: string;
    month: string;
    year: string;
  };
  endDate?: {
    day: string;
    month: string;
    year: string;
  };
  startTime?: string;
  endTime?: string;
  totalSlots?: number;
  usedSlots?: number;
  distanceKm?: number;
  totalRewards?: number;
  rewards?: RewardTier[];
  reward_tiers?: Array<{
    tier: number;
    min_rank: number;
    max_rank: number;
    reward_id: number;
    reward_name: string;
    quantity: number;
  }>;
  required_completions?: number;
  max_reward_recipients?: number;
  name?: string;
  rewardConfigId?: number;
  holidays?: string[];
  excludeWeekends?: boolean;
  isPublic?: boolean;
  isActive?: boolean;
  is_published?: boolean;
  is_active?: boolean;
  status: string;
  pendingCount?: number;
  month: string;
  year: string;
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

export interface VerifyProofData {
  selectedEvent: AppEvent | null;
  submissions: ProofSubmission[];
  loading: boolean;
  error: string;
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
  participationId?: number;
  stravaLink?: string;
  distance?: number;
  proofImage?: string | null;
  rewardId?: number;
  rewardTier?: number;
  rewardDescription?: string;
}

export interface RewardData {
  selectedEvent: AppEvent | null;
  users: RewardUser[];
  currentConfigId?: number;
  loading: boolean;
  error: string;
  searchQuery: string;
  selectedTier: string;
  currentPage: number;
  itemsPerPage: number;
  leaderboardFinalized?: boolean;
}

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
  details?: any;
  metadata?: any;
  proofImage?: string | null;
  fetchedAt?: string;
}

export interface LogStatistics {
  totalLogs: number;
  uniqueUsers: number;
  successRate: number;
  topAction: string;
  totalRegistrations?: number;
  totalCheckIns?: number;
  totalRewards?: number;
  totalCancelled?: number;
}

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
  statistics: LogStatistics;
  stats?: {
    total: number;
    by_status: Record<string, number>;
    by_role: Record<string, number>;
  };
  eventStats?: {
    total: number;
    by_status: Record<string, number>;
    by_role: Record<string, number>;
    quickStats?: any;
    activeParticipants?: number;
  };
}

export interface TimelineItem {
  timestamp: string;
  action: string;
  userName: string;
  status: string;
  details: string;
}

export interface LeaderboardEntry {
  user_id: string;
  user_name: string;
  total_completions: number;
  qualified_at: string | null;
  rank?: number;
  reward_tier?: number;
  reward_name?: string;
}

export type Language = 'th' | 'en';
export type HolidayMode = 'none' | 'weekends' | 'specific' | null;
export type VerifyMode = 'pin' | 'qr';
export type VerifyActionMode = 'checkin' | 'checkout';
