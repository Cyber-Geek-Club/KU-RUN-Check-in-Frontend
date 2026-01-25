import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';
import type { AppEvent } from './eventList';

export interface ActivityLog {
  id: number;
  eventId: number;
  userId: number;
  userName: string;
  userEmail: string;
  nisitId: string;
  action: 'joined' | 'checked_in' | 'checked_out' | 'completed' | 'cancelled' | 'rejected';
  status: string;
  timestamp: string;
  details: any;
}

export interface TimelineItem {
  timestamp: string;
  action: string;
  userName: string;
  status: string;
  details: string;
}

export interface LogsState {
  selectedEvent: AppEvent | null;
  logs: ActivityLog[];
  isLoading: boolean;
  wsConnected: boolean;
  newLogsCount: number;
  autoRefreshEnabled: boolean;
  actionFilter: string;
  statusFilter: string;
  nisitYearFilter: string;
  nisitIdFilter: string;
  exportFormat: 'csv' | 'excel' | 'pdf';
  isExporting: boolean;
  showTimelineModal: boolean;
  timelineItems: TimelineItem[];
  currentPage: number;
  itemsPerPage: number;
  totalLogs: number;
}

const initialState: LogsState = {
  selectedEvent: null,
  logs: [],
  isLoading: false,
  wsConnected: false,
  newLogsCount: 0,
  autoRefreshEnabled: true,
  actionFilter: 'all',
  statusFilter: 'all',
  nisitYearFilter: '',
  nisitIdFilter: '',
  exportFormat: 'csv',
  isExporting: false,
  showTimelineModal: false,
  timelineItems: [],
  currentPage: 1,
  itemsPerPage: 50,
  totalLogs: 0
};

function createLogsStore() {
  const { subscribe, set, update }: Writable<LogsState> = writable(initialState);

  // Load export preferences
  if (typeof window !== 'undefined') {
    const exportFormat = localStorage.getItem('logs_export_format');
    if (exportFormat) {
      update(state => ({ ...state, exportFormat: exportFormat as any }));
    }
  }

  return {
    subscribe,
    set,
    update,
    
    setLogs: (logs: ActivityLog[], total?: number) => {
      update(state => ({
        ...state,
        logs,
        totalLogs: total ?? logs.length,
        isLoading: false
      }));
    },
    
    addLog: (log: ActivityLog) => {
      update(state => ({
        ...state,
        logs: [log, ...state.logs],
        newLogsCount: state.newLogsCount + 1,
        totalLogs: state.totalLogs + 1
      }));
    },
    
    // ✅ เพิ่มฟังก์ชันนี้เพื่อให้ +page.svelte เรียกใช้ได้
    setWebSocketConnected: (connected: boolean) => {
      update(state => ({ ...state, wsConnected: connected }));
    },
    
    setExportFormat: (format: 'csv' | 'excel' | 'pdf') => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('logs_export_format', format);
      }
      update(state => ({ ...state, exportFormat: format }));
    },
    
    reset: () => set(initialState)
  };
}

export const logs = createLogsStore();