import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';
import type { AppEvent } from './eventList';

export interface LeaderboardEntry {
  userId: number;
  userName: string;
  userEmail: string;
  totalCompletions: number;
  qualifiedAt: string | null;
  rank: number | null;
  rewardTier: number | null;
  rewardName: string | null;
  tierProgress: number | null;
}

export interface RewardConfig {
  id: number;
  eventId: number;
  tiers: Array<{
    name: string;
    quota: number;
    requirement: number;
  }>;
  isFinalized: boolean;
  finalizedAt: string | null;
}

export interface RewardsState {
  selectedEvent: AppEvent | null;
  isLoading: boolean;
  leaderboardEntries: LeaderboardEntry[];
  leaderboardConfig: RewardConfig | null;
  currentConfigId: number | undefined;
  leaderboardFinalized: boolean;
  tierFilter: string;
  sortBy: 'global_rank' | 'tier_rank' | 'completions';
  sortOrder: 'asc' | 'desc';
  searchQuery: string;
  currentPage: number;
  itemsPerPage: number;
  totalUsers: number;
  selectedUsers: Set<number>;
  showMessageModal: boolean;
}

const initialState: RewardsState = {
  selectedEvent: null,
  isLoading: false,
  leaderboardEntries: [],
  leaderboardConfig: null,
  currentConfigId: undefined,
  leaderboardFinalized: false,
  tierFilter: 'All',
  sortBy: 'global_rank',
  sortOrder: 'asc',
  searchQuery: '',
  currentPage: 1,
  itemsPerPage: 50,
  totalUsers: 0,
  selectedUsers: new Set(),
  showMessageModal: false
};

function createRewardsStore() {
  const { subscribe, set, update }: Writable<RewardsState> = writable(initialState);

  return {
    subscribe,
    set,
    update,
    
    setLeaderboard: (entries: LeaderboardEntry[], config?: RewardConfig, total?: number) => {
      update(state => ({
        ...state,
        leaderboardEntries: entries,
        leaderboardConfig: config || state.leaderboardConfig,
        totalUsers: total ?? entries.length,
        isLoading: false
      }));
    },
    
    finalize: () => {
      update(state => ({
        ...state,
        leaderboardFinalized: true
      }));
    },
    
    reset: () => set(initialState)
  };
}

export const rewards = createRewardsStore();