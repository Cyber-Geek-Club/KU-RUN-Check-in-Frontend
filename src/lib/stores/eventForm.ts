import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';

export interface EventFormData {
  title: string;
  description: string;
  location: string;
  imagePreview: string | null;
  imageFile: File | null;
  eventType: 'single_day' | 'multi_day';
  allowDailyCheckin: boolean;
  maxCheckinsPerUser: number;
  startDate: { day: string; month: string; year: string };
  endDate: { day: string; month: string; year: string };
  startTime: string;
  endTime: string;
  totalSlots: number | null;
  distanceKm: number | null;
  holidayType: 'none' | 'weekends' | 'specific';
  holidays: string[];
  specificDates: Date[];
  excludeWeekends: boolean;
  rewards: Array<{
    name: string;
    requirement: number | null;
    quota: number | null;
  }>;
  totalRewards: number | null;
  requiredCompletions: number | null;
  isPublic: boolean;
  isActive: boolean;
  validationErrors: Map<string, string>;
  activeDropdown: string | null;
  holidayMode: 'calendar' | 'list' | null;
  editingEventId: number | null;
}

const initialFormData: EventFormData = {
  title: '',
  description: '',
  location: '',
  imagePreview: null,
  imageFile: null,
  eventType: 'single_day',
  allowDailyCheckin: false,
  maxCheckinsPerUser: 1,
  startDate: { day: '', month: '', year: '' },
  endDate: { day: '', month: '', year: '' },
  startTime: '',
  endTime: '',
  totalSlots: null,
  distanceKm: null,
  holidayType: 'none',
  holidays: [],
  specificDates: [],
  excludeWeekends: false,
  rewards: [{ name: '', requirement: null, quota: null }],
  totalRewards: null,
  requiredCompletions: null,
  isPublic: true,
  isActive: true,
  validationErrors: new Map(),
  activeDropdown: null,
  holidayMode: null,
  editingEventId: null
};

function createEventFormStore() {
  const { subscribe, set, update }: Writable<EventFormData> = writable(initialFormData);

  let saveTimeout: any;

  // Auto-save to localStorage
  subscribe(value => {
    if (typeof window !== 'undefined') {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        const { imageFile, ...dataToSave } = value;
        // Convert validationErrors Map to array of entries for JSON
        // Ensure validationErrors is serialized robustly:
        // - If it's a Map -> Array of entries
        // - If it's already an Array -> keep it
        // - If it's a plain object -> Object.entries
        // - Otherwise -> empty array
        const ve = dataToSave.validationErrors;
        let validationEntries: Array<[string, string]> = [];
        if (ve instanceof Map) {
          validationEntries = Array.from(ve.entries());
        } else if (Array.isArray(ve)) {
          validationEntries = ve;
        } else if (ve && typeof ve === 'object') {
          validationEntries = Object.entries(ve) as Array<[string, string]>;
        }

        const serializable = {
          ...dataToSave,
          validationErrors: validationEntries,
        };
        localStorage.setItem('draft_event_form', JSON.stringify(serializable));
      }, 3000);
    }
  });

  // Load draft on init
  if (typeof window !== 'undefined') {
    const draft = localStorage.getItem('draft_event_form');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        // Restore validationErrors as Map if present (stored as array of entries or object)
        if (parsed) {
          if (Array.isArray(parsed.validationErrors)) {
            parsed.validationErrors = new Map(parsed.validationErrors);
          } else if (parsed.validationErrors && typeof parsed.validationErrors === 'object') {
            parsed.validationErrors = new Map(Object.entries(parsed.validationErrors));
          } else {
            parsed.validationErrors = new Map();
          }
        }
        set({ ...initialFormData, ...parsed });
      } catch (e) {
        console.error('Failed to load draft:', e);
      }
    }
  }

  return {
    subscribe,
    set,
    update,
    reset: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('draft_event_form');
        sessionStorage.removeItem('editing_event_id');
      }
      set(initialFormData);
    },
    clearDraft: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('draft_event_form');
      }
    }
  };
}

export const eventForm = createEventFormStore();