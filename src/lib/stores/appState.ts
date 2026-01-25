import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';

export interface AppState {
  currentLang: 'th' | 'en';
  isLoading: boolean;
  isMobileMenuOpen: boolean;
  searchQueries: {
    eventList: string;
    verifyProof: string;
    logs: string;
    reward: string;
  };
  filters: {
    eventList: { year: string; month: string };
    verifyProof: { year: string; month: string };
    logs: { year: string; month: string };
    reward: { year: string; month: string };
  };
  dropdownStates: {
    monthOpen: boolean;
    yearOpen: boolean;
    pageDropdown: boolean;
    exportMenu: boolean;
  };
}

const initialState: AppState = {
  currentLang: 'th',
  isLoading: false,
  isMobileMenuOpen: false,
  searchQueries: {
    eventList: '',
    verifyProof: '',
    logs: '',
    reward: ''
  },
  filters: {
    eventList: { year: 'All', month: 'All' },
    verifyProof: { year: 'All', month: 'All' },
    logs: { year: 'All', month: 'All' },
    reward: { year: 'All', month: 'All' }
  },
  dropdownStates: {
    monthOpen: false,
    yearOpen: false,
    pageDropdown: false,
    exportMenu: false
  }
};

function createAppState() {
  const { subscribe, set, update }: Writable<AppState> = writable(initialState);

  // Load language from localStorage
  if (typeof window !== 'undefined') {
    const savedLang = localStorage.getItem('app_language');
    if (savedLang === 'th' || savedLang === 'en') {
      update(state => ({ ...state, currentLang: savedLang }));
    }
  }

  return {
    subscribe,
    set,
    update,
    reset: () => set(initialState)
  };
}

export const appState = createAppState();