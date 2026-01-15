// Check-in Store - State management for PIN/QR code verification
import { writable, derived, get } from "svelte/store";
import { api, API_BASE_URL, getAuthHeaders } from "$lib/api/axiosConfig";
import axios from "axios";

// ==========================================
// 🗄️ TYPES
// ==========================================

export interface CheckInResult {
  success: boolean;
  message: string;
  userName?: string;
  userEmail?: string;
  checkinCount?: number;
}

export interface CheckInState {
  mode: "pin" | "qr";
  actionMode: "checkin" | "checkout";
  pins: string[];
  autoProcess: boolean;
  isProcessing: boolean;
  lastResult: CheckInResult | null;
  error: string;
  cameraActive: boolean;
  scanning: boolean;
}

// ==========================================
// 🗄️ INITIAL STATE
// ==========================================

const initialState: CheckInState = {
  mode: "pin",
  actionMode: "checkin",
  pins: ["", "", "", "", ""],
  autoProcess: false,
  isProcessing: false,
  lastResult: null,
  error: "",
  cameraActive: false,
  scanning: false,
};

// ==========================================
// 📦 STORES
// ==========================================

export const checkInState = writable<CheckInState>(initialState);
export const selectedEventForCheckIn = writable<number | null>(null);

// ==========================================
// 📊 DERIVED STORES
// ==========================================

export const isPinComplete = derived(checkInState, ($state) => {
  return $state.pins.every((pin) => pin.length === 1);
});

export const currentPin = derived(checkInState, ($state) => {
  return $state.pins.join("");
});

// ==========================================
// 📝 ACTIONS
// ==========================================

export function setCheckInMode(mode: "pin" | "qr") {
  checkInState.update((state) => ({
    ...state,
    mode,
    error: "",
    lastResult: null,
  }));
}

export function setActionMode(actionMode: "checkin" | "checkout") {
  checkInState.update((state) => ({
    ...state,
    actionMode,
    error: "",
    lastResult: null,
  }));
}

export function toggleAutoProcess() {
  checkInState.update((state) => ({
    ...state,
    autoProcess: !state.autoProcess,
  }));
}

export function clearPins() {
  checkInState.update((state) => ({
    ...state,
    pins: ["", "", "", "", ""],
    error: "",
    lastResult: null,
  }));
}

export function updatePin(index: number, value: string) {
  checkInState.update((state) => {
    const newPins = [...state.pins];
    newPins[index] = value;
    return {
      ...state,
      pins: newPins,
    };
  });

  // Auto-process if enabled and complete
  const state = get(checkInState);
  if (state.autoProcess && state.pins.every((p, i) => i === index ? value.length === 1 : p.length === 1)) {
    setTimeout(() => processVerification(), 100);
  }
}

export async function processVerification(): Promise<CheckInResult> {
  const state = get(checkInState);
  const eventId = get(selectedEventForCheckIn);
  const code = state.pins.join("");

  if (code.length !== 5) {
    return { success: false, message: "Please enter a 5-digit code" };
  }

  checkInState.update((s) => ({
    ...s,
    isProcessing: true,
    error: "",
  }));

  try {
    let result: CheckInResult;

    if (state.actionMode === "checkin") {
      result = await verifyCode(code, eventId);
    } else {
      result = await checkOutCode(code, eventId);
    }

    checkInState.update((s) => ({
      ...s,
      isProcessing: false,
      lastResult: result,
      error: result.success ? "" : result.message,
    }));

    // Clear pins on success
    if (result.success) {
      setTimeout(() => clearPins(), 1500);
    }

    return result;
  } catch (error: any) {
    const errorResult = { success: false, message: error.message };
    checkInState.update((s) => ({
      ...s,
      isProcessing: false,
      lastResult: errorResult,
      error: error.message,
    }));
    return errorResult;
  }
}

async function verifyCode(code: string, eventId: number | null): Promise<CheckInResult> {
  try {
    const axiosHeaders = getAuthHeaders();
    
    // Try to find user by code (assuming code is nisit_id or check-in code)
    const endpoint = eventId
      ? `${API_BASE_URL}/api/events/${eventId}/checkin`
      : `${API_BASE_URL}/api/checkin`;

    const response = await axios.post(
      endpoint,
      { code: code },
      { headers: axiosHeaders }
    );

    if (response.data?.success || response.status === 200) {
      return {
        success: true,
        message: response.data?.message || "Check-in successful!",
        userName: response.data?.user_name,
        userEmail: response.data?.email,
        checkinCount: response.data?.checkin_count,
      };
    }

    return {
      success: false,
      message: response.data?.detail || "Check-in failed",
    };
  } catch (error: any) {
    console.error("Check-in error:", error);
    
    const status = error.response?.status;
    const detail = error.response?.data?.detail;

    if (status === 404) {
      return { success: false, message: "Code not found or invalid" };
    }
    if (status === 400) {
      return { success: false, message: detail || "Invalid code format" };
    }
    if (status === 409) {
      return { success: false, message: detail || "Already checked in" };
    }

    return { success: false, message: detail || error.message || "Check-in failed" };
  }
}

async function checkOutCode(code: string, eventId: number | null): Promise<CheckInResult> {
  try {
    const axiosHeaders = getAuthHeaders();

    const endpoint = eventId
      ? `${API_BASE_URL}/api/events/${eventId}/checkout`
      : `${API_BASE_URL}/api/checkout`;

    const response = await axios.post(
      endpoint,
      { code: code },
      { headers: axiosHeaders }
    );

    if (response.data?.success || response.status === 200) {
      return {
        success: true,
        message: response.data?.message || "Check-out successful!",
        userName: response.data?.user_name,
        userEmail: response.data?.email,
      };
    }

    return {
      success: false,
      message: response.data?.detail || "Check-out failed",
    };
  } catch (error: any) {
    console.error("Check-out error:", error);

    const status = error.response?.status;
    const detail = error.response?.data?.detail;

    if (status === 404) {
      return { success: false, message: "Code not found or not checked in" };
    }
    if (status === 400) {
      return { success: false, message: detail || "Invalid code format" };
    }

    return { success: false, message: detail || error.message || "Check-out failed" };
  }
}

// QR Code functions
export function setCameraActive(active: boolean) {
  checkInState.update((state) => ({
    ...state,
    cameraActive: active,
    scanning: active,
  }));
}

export function setScanning(scanning: boolean) {
  checkInState.update((state) => ({
    ...state,
    scanning,
  }));
}

export async function processQRCode(qrData: string): Promise<CheckInResult> {
  const state = get(checkInState);
  const eventId = get(selectedEventForCheckIn);

  checkInState.update((s) => ({
    ...s,
    isProcessing: true,
    error: "",
  }));

  try {
    // Extract code from QR data (might be URL or plain code)
    let code = qrData;
    
    // If QR contains URL, extract the code parameter
    if (qrData.includes("code=")) {
      const match = qrData.match(/code=(\w+)/);
      if (match) code = match[1];
    } else if (qrData.includes("/")) {
      // If QR contains path, take the last segment
      code = qrData.split("/").pop() || qrData;
    }

    let result: CheckInResult;
    if (state.actionMode === "checkin") {
      result = await verifyCode(code, eventId);
    } else {
      result = await checkOutCode(code, eventId);
    }

    checkInState.update((s) => ({
      ...s,
      isProcessing: false,
      lastResult: result,
      error: result.success ? "" : result.message,
    }));

    return result;
  } catch (error: any) {
    const errorResult = { success: false, message: error.message };
    checkInState.update((s) => ({
      ...s,
      isProcessing: false,
      lastResult: errorResult,
      error: error.message,
    }));
    return errorResult;
  }
}

export function resetCheckInState() {
  checkInState.set(initialState);
  selectedEventForCheckIn.set(null);
}

export default {
  checkInState,
  selectedEventForCheckIn,
  isPinComplete,
  currentPin,
  setCheckInMode,
  setActionMode,
  toggleAutoProcess,
  clearPins,
  updatePin,
  processVerification,
  setCameraActive,
  setScanning,
  processQRCode,
  resetCheckInState,
};
