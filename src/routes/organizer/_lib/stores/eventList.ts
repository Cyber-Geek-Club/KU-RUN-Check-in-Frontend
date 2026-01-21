import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';

export interface AppEvent {
  id: number;
  title: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  totalSlots: number;
  distanceKm: number | null;
  imageUrl: string | null;
  isPublic: boolean;
  isActive: boolean;
  eventType: 'single_day' | 'multi_day';
  participantCount: number;
  status: 'active' | 'draft' | 'closed';
  createdAt: string;
  updatedAt: string;
}

export interface EventListState {
  events: AppEvent[];
  isLoading: boolean;
  selectedEvent: AppEvent | null;
  currentPage: number;
  itemsPerPage: number;
  totalEvents: number;
  sortBy: 'date' | 'title' | 'participants';
  sortOrder: 'asc' | 'desc';
}

const initialState: EventListState = {
  events: [],
  isLoading: false,
  selectedEvent: null,
  currentPage: 1,
  itemsPerPage: 12,
  totalEvents: 0,
  sortBy: 'date',
  sortOrder: 'desc'
};

function createEventListStore() {
  const { subscribe, set, update }: Writable<EventListState> = writable(initialState);

  // Load preferences from localStorage
  if (typeof window !== 'undefined') {
    const sortBy = localStorage.getItem('event_sort_by');
    const sortOrder = localStorage.getItem('event_sort_order');
    const itemsPerPage = localStorage.getItem('event_items_per_page');

    if (sortBy || sortOrder || itemsPerPage) {
      update(state => ({
        ...state,
        sortBy: (sortBy as any) || state.sortBy,
        sortOrder: (sortOrder as any) || state.sortOrder,
        itemsPerPage: itemsPerPage ? parseInt(itemsPerPage) : state.itemsPerPage
      }));
    }
  }

  return {
    subscribe,
    set,
    update,
    
    setEvents: (events: AppEvent[], total?: number) => {
      update(state => ({
        ...state,
        events,
        totalEvents: total ?? events.length,
        isLoading: false
      }));
    },
    
    setSortPreferences: (sortBy: 'date' | 'title' | 'participants', sortOrder: 'asc' | 'desc') => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('event_sort_by', sortBy);
        localStorage.setItem('event_sort_order', sortOrder);
      }
      update(state => ({ ...state, sortBy, sortOrder }));
    },
    
    clearCache: () => {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('event_list_cache');
      }
    },
    
    reset: () => set(initialState)
  };
}

export const eventList = createEventListStore();