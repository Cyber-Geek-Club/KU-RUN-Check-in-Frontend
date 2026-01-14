// Event Form Store - Centralized state management for Create/Edit Event
import { writable, derived } from 'svelte/store';

export interface EventFormData {
  // Basic Info
  title: string;
  description: string;
  location: string;
  imageFile: File | null;
  imagePreview: string | null;

  // Event Type
  eventType: 'single_day' | 'multi_day';
  maxCheckinsPerUser: number;
  allowDailyCheckin: boolean;

  // Schedule
  startDate: string; // YYYY-MM-DD
  endDate: string;
  startTime: string; // HH:mm
  endTime: string;
  
  // Holidays
  holidayType: 'none' | 'weekends' | 'specific';
  excludeWeekends: boolean;
  specificDates: string[]; // Array of YYYY-MM-DD
  
  // Capacity & Requirements
  totalSlots: number;
  distanceKm: number | null;
  requiredCompletions: number | null;

  // Rewards
  rewards: RewardTier[];
  
  // Status
  isPublic: boolean;
  isActive: boolean;
}

export interface RewardTier {
  id: string;
  name: string;
  quota: number;
  requirement: number; // จำนวนรอบที่ต้องทำ
  rankStart?: number; // คำนวณอัตโนมัติ
  rankEnd?: number;
}

export interface ValidationError {
  field: string;
  message: string;
}

// Default form data
const defaultFormData: EventFormData = {
  title: '',
  description: '',
  location: '',
  imageFile: null,
  imagePreview: null,
  eventType: 'single_day',
  maxCheckinsPerUser: 1,
  allowDailyCheckin: false,
  startDate: '',
  endDate: '',
  startTime: '',
  endTime: '',
  holidayType: 'none',
  excludeWeekends: false,
  specificDates: [],
  totalSlots: 10000,
  distanceKm: null,
  requiredCompletions: null,
  rewards: [],
  isPublic: true,
  isActive: true,
};

// Create stores
export const eventFormData = writable<EventFormData>(defaultFormData);
export const currentStep = writable<number>(1);
export const validationErrors = writable<ValidationError[]>([]);
export const isSubmitting = writable<boolean>(false);

// Auto-save to localStorage
if (typeof localStorage !== 'undefined') {
  eventFormData.subscribe((data) => {
    localStorage.setItem('eventFormDraft', JSON.stringify(data));
  });

  // Load from localStorage on init
  const saved = localStorage.getItem('eventFormDraft');
  if (saved) {
    try {
      eventFormData.set(JSON.parse(saved));
    } catch (e) {
      console.error('Failed to load form draft:', e);
    }
  }
}

// Derived store: Calculate total allocated slots
export const totalAllocatedSlots = derived(
  eventFormData,
  ($formData) => $formData.rewards.reduce((sum, tier) => sum + tier.quota, 0)
);

// Derived store: Remaining slots
export const remainingSlots = derived(
  [eventFormData, totalAllocatedSlots],
  ([$formData, $totalAllocated]) => $formData.totalSlots - $totalAllocated
);

// Derived store: Is form valid for current step
export const isStepValid = derived(
  [currentStep, eventFormData, validationErrors],
  ([$step, $data, $errors]) => {
    const stepErrors = $errors.filter((err) => {
      if ($step === 1) {
        return ['title', 'description', 'location'].includes(err.field);
      } else if ($step === 2) {
        return ['startDate', 'endDate', 'startTime', 'endTime'].includes(err.field);
      } else if ($step === 3) {
        return ['rewards', 'totalSlots'].includes(err.field);
      }
      return false;
    });
    return stepErrors.length === 0;
  }
);

// Actions
export const resetForm = () => {
  eventFormData.set(defaultFormData);
  currentStep.set(1);
  validationErrors.set([]);
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('eventFormDraft');
  }
};

export const nextStep = () => {
  currentStep.update((n) => Math.min(n + 1, 4));
};

export const prevStep = () => {
  currentStep.update((n) => Math.max(n - 1, 1));
};

export const goToStep = (step: number) => {
  if (step >= 1 && step <= 4) {
    currentStep.set(step);
  }
};

export const addRewardTier = () => {
  eventFormData.update((data) => {
    const newTier: RewardTier = {
      id: `tier-${Date.now()}`,
      name: '',
      quota: 0,
      requirement: 1,
    };
    return {
      ...data,
      rewards: [...data.rewards, newTier],
    };
  });
};

export const removeRewardTier = (id: string) => {
  eventFormData.update((data) => ({
    ...data,
    rewards: data.rewards.filter((tier) => tier.id !== id),
  }));
};

export const updateRewardTier = (id: string, updates: Partial<RewardTier>) => {
  eventFormData.update((data) => ({
    ...data,
    rewards: data.rewards.map((tier) =>
      tier.id === id ? { ...tier, ...updates } : tier
    ),
  }));
};

// Calculate rank ranges for tiers
export const calculateRankRanges = () => {
  eventFormData.update((data) => {
    let currentRank = 1;
    const updatedRewards = data.rewards
      .sort((a, b) => b.requirement - a.requirement) // Sort by requirement DESC
      .map((tier) => {
        const rankStart = currentRank;
        const rankEnd = currentRank + tier.quota - 1;
        currentRank = rankEnd + 1;
        return {
          ...tier,
          rankStart,
          rankEnd,
        };
      });

    return {
      ...data,
      rewards: updatedRewards,
    };
  });
};

// Validation function
export const validateForm = (step?: number): boolean => {
  const errors: ValidationError[] = [];
  let data!: EventFormData; // Use definite assignment assertion
  
  eventFormData.subscribe((d) => (data = d))();

  // Step 1: Basic Info
  if (!step || step === 1) {
    if (!data.title.trim()) {
      errors.push({ field: 'title', message: 'Event name is required' });
    }
    if (!data.description.trim()) {
      errors.push({ field: 'description', message: 'Description is required' });
    }
    if (!data.location.trim()) {
      errors.push({ field: 'location', message: 'Location is required' });
    }
  }

  // Step 2: Schedule
  if (!step || step === 2) {
    if (!data.startDate) {
      errors.push({ field: 'startDate', message: 'Start date is required' });
    }
    if (!data.endDate) {
      errors.push({ field: 'endDate', message: 'End date is required' });
    }
    if (!data.startTime) {
      errors.push({ field: 'startTime', message: 'Start time is required' });
    }
    if (!data.endTime) {
      errors.push({ field: 'endTime', message: 'End time is required' });
    }
    
    // Date range validation
    if (data.startDate && data.endDate && data.startDate > data.endDate) {
      errors.push({
        field: 'endDate',
        message: 'End date must be after start date',
      });
    }
  }

  // Step 3: Rewards
  if (!step || step === 3) {
    if (data.totalSlots <= 0) {
      errors.push({ field: 'totalSlots', message: 'Total slots must be greater than 0' });
    }

    const totalAllocated = data.rewards.reduce((sum, tier) => sum + tier.quota, 0);
    if (totalAllocated > data.totalSlots) {
      errors.push({
        field: 'rewards',
        message: `Total allocated (${totalAllocated}) exceeds capacity (${data.totalSlots})`,
      });
    }

    data.rewards.forEach((tier, index) => {
      if (!tier.name.trim()) {
        errors.push({
          field: `reward-${tier.id}-name`,
          message: `Tier ${index + 1}: Name is required`,
        });
      }
      if (tier.quota <= 0) {
        errors.push({
          field: `reward-${tier.id}-quota`,
          message: `Tier ${index + 1}: Quota must be greater than 0`,
        });
      }
      if (tier.requirement <= 0) {
        errors.push({
          field: `reward-${tier.id}-requirement`,
          message: `Tier ${index + 1}: Requirement must be greater than 0`,
        });
      }
    });
  }

  validationErrors.set(errors);
  return errors.length === 0;
};

export default {
  eventFormData,
  currentStep,
  validationErrors,
  isSubmitting,
  totalAllocatedSlots,
  remainingSlots,
  isStepValid,
  resetForm,
  nextStep,
  prevStep,
  goToStep,
  addRewardTier,
  removeRewardTier,
  updateRewardTier,
  calculateRankRanges,
  validateForm,
};
