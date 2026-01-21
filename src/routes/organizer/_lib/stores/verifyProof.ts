import { writable, derived } from 'svelte/store';
import type { Writable } from 'svelte/store';
import type { AppEvent } from './eventList';

export interface ProofSubmission {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  eventId: number;
  eventName: string;
  imageUrl: string;
  description?: string;
  stravaLink: string | null;
  actualDistance: number | null;
  status: 'pending' | 'approved' | 'rejected';
  points?: number;
  submittedAt: string;
  reviewedAt: string | null;
  rejectionReason: string | null;
}

export interface VerifyProofState {
  selectedEvent: AppEvent | null;
  submissions: ProofSubmission[];
  isLoading: boolean;
  statusFilter: 'all' | 'pending' | 'approved' | 'rejected';
  showApprovalModal: boolean;
  showRejectionModal: boolean;
  selectedSubmission: ProofSubmission | null;
  rejectionReason: string;
}

const initialState: VerifyProofState = {
  selectedEvent: null,
  submissions: [],
  isLoading: false,
  statusFilter: 'all',
  showApprovalModal: false,
  showRejectionModal: false,
  selectedSubmission: null,
  rejectionReason: ''
};

function createVerifyProofStore() {
  const { subscribe, set, update }: Writable<VerifyProofState> = writable(initialState);

  return {
    subscribe,
    set,
    update,
    
    setSubmissions: (submissions: ProofSubmission[]) => {
      update(state => ({
        ...state,
        submissions,
        isLoading: false
      }));
    },
    
    reset: () => set(initialState)
  };
}

export const verifyProof = createVerifyProofStore();

// Derived stores for counts - ต้องมี export ตรงนี้!
export const pendingCount = derived(
  verifyProof,
  $store => $store.submissions.filter(s => s.status === 'pending').length
);

export const approvedCount = derived(
  verifyProof,
  $store => $store.submissions.filter(s => s.status === 'approved').length
);

export const rejectedCount = derived(
  verifyProof,
  $store => $store.submissions.filter(s => s.status === 'rejected').length
);