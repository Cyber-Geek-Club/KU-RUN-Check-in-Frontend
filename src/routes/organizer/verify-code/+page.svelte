<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import axios from 'axios';
  import jsQR from 'jsqr';
  
  // ✅ Import API Endpoints
  import { endpoints } from '../_lib/api/endpoints';

  // API Configuration: prefer env; in dev without env use Vite proxy '/api', otherwise fall back to fixed host
  const rawApiBase = import.meta.env.VITE_API_BASE_URL;
  const DEFAULT_API_HOST = 'http://158.108.102.14:8001';
  const API_BASE_URL = rawApiBase
    ? rawApiBase.replace(/\/$/, '')
    : DEFAULT_API_HOST; // Force backend host when VITE_API_BASE_URL is not set

  const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
  });
  
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  // ✅ เพิ่ม Interceptor เพื่อจัดการ 404 เงียบๆ
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response && error.response.status === 404) {
         return Promise.reject(error);
      }
      return Promise.reject(error);
    }
  );
  
  // Language
  type Language = "th" | "en";
  let currentLang: Language = "th";
  
  if (typeof localStorage !== "undefined") {
    const saved = localStorage.getItem("app_language");
    if (saved === "th" || saved === "en") currentLang = saved;
  }
  
  const translations = {
    th: {
      checkIn: "เช็คอิน",
      checkOut: "เช็คเอาท์",
      typeSingle: "วันเดียว",
      typeMulti: "หลายวัน",
      participantCheckIn: "เช็คอินผู้เข้าร่วม",
      participantCheckOut: "เช็คเอาท์ผู้เข้าร่วม",
      verifyParticipantCode: "ตรวจสอบรหัสผู้เข้าร่วมงาน",
      verifyParticipantCodeOut: "ตรวจสอบรหัสเช็คเอาท์",
      pinCode: "รหัส PIN",
      scanQR: "สแกน QR",
      enterDigitCode: "กรอกรหัส 5 หลัก", // ✅ แก้ข้อความ
      autoCheckInEnabled: "Auto Check-in เปิดอยู่",
      autoCheckOutEnabled: "Auto Check-out เปิดอยู่",
      pressCheckIn: "กดปุ่มเพื่อเช็คอิน",
      pressCheckOut: "กดปุ่มเพื่อเช็คเอาท์",
      checkInSuccess: "เช็คอินสำเร็จ", // ✅ เพิ่ม
      checkOutSuccess: "เช็คเอาท์สำเร็จ",
      invalidCode: "รหัสไม่ถูกต้อง",
      alreadyCheckedIn: "เช็คอินแล้ว",
      notCheckedIn: "ยังไม่ได้เช็คอิน",
      eventNotFound: "ไม่พบกิจกรรม",
      cameraAccessDenied: "ไม่สามารถเข้าถึงกล้องได้",
      pointCameraAtQR: "เล็งกล้องไปที่ QR code ของผู้เข้าร่วม",
    },
    en: {
      checkIn: "Check In",
      checkOut: "Check Out",
      typeSingle: "Single-day",
      typeMulti: "Multi-day",
      participantCheckIn: "Participant Check-In",
      participantCheckOut: "Participant Check-Out",
      verifyParticipantCode: "Verify participant code",
      verifyParticipantCodeOut: "Verify check-out code",
      pinCode: "PIN Code",
      scanQR: "Scan QR",
      enterDigitCode: "Enter 5-digit code", // ✅ แก้ข้อความ
      autoCheckInEnabled: "Auto Check-in enabled",
      autoCheckOutEnabled: "Auto Check-out enabled",
      pressCheckIn: "Press button to check-in",
      pressCheckOut: "Press button to check-out",
      checkInSuccess: "Check-in successful", // ✅ เพิ่ม
      checkOutSuccess: "Check-out successful",
      invalidCode: "Invalid code",
      alreadyCheckedIn: "Already checked in",
      notCheckedIn: "Not checked in yet",
      eventNotFound: "Event not found",
      cameraAccessDenied: "Camera access denied",
      pointCameraAtQR: "Point camera at participant's QR code",
    },
  };
  
  $: lang = translations[currentLang];
  
  // State
  let verifyActionMode: "checkin" | "checkout" = "checkin";
  let verifyMode: "pin" | "qr" = "pin";
  
  // ✅ [เพิ่ม] State สำหรับเลือกประเภทกิจกรรม (Single/Multi)
  let eventTypeMode: "single" | "multi" = "single";

  let autoCheckIn = false;
  let isVerifying = false;
  let lastVerifySuccess = false;
  let lastCheckOutSuccess = false;
  let lastParticipantName = "";
  let verifyErrorMessage = "";
  let verifyErrorIndex: number | null = null;
  
  // ✅ [ลบ] eventsList, selectedEventId, dropdownOpen, dropdownRef ออก เพราะไม่ใช้แล้ว

  // Check-in mode: 'multi' => check-in daily, 'single' => single-day check-in
  let checkInMode: 'multi' | 'single' = (import.meta.env.VITE_CHECKIN_MODE === 'single' ? 'single' : 'multi');
  if (!import.meta.env.VITE_CHECKIN_MODE) {
    console.info('VITE_CHECKIN_MODE not set — defaulting to "multi" (check-in-daily)');
  }
  
  // ✅ [แก้ไข 1] PIN Mode: เหลือ 5 ช่อง
  let pins = ["", "", "", "", ""];
  let pinInputRefs: HTMLInputElement[] = [];
  
  // QR Mode
  let videoRef: HTMLVideoElement;
  let canvasRef: HTMLCanvasElement;
  let stream: MediaStream | null = null;
  let scanning = false;
  let cameraError = "";
  let qrSuccessShow = false;
  let scanInterval: any;
  let animationFrameId: number;
  
  // Functions
  function switchActionMode(mode: "checkin" | "checkout") {
    verifyActionMode = mode;
    clearPins();
    verifyErrorMessage = "";
    lastVerifySuccess = false;
    lastCheckOutSuccess = false;
  }

  // ✅ [เพิ่ม] ฟังก์ชันสลับประเภทกิจกรรม
  function switchEventTypeMode(mode: "single" | "multi") {
    eventTypeMode = mode;
    clearPins();
    verifyErrorMessage = "";
  }
  
  function switchVerifyMode(mode: "pin" | "qr") {
    verifyMode = mode;
    clearPins();
    verifyErrorMessage = "";
    
    if (mode === "qr") {
      setTimeout(() => startCamera(), 100);
    } else {
      stopCamera();
    }
  }

  // ✅ [ลบ] handleEventSelect, toggleDropdown, selectEventById ออก
  
  function clearPins() {
    pins = ["", "", "", "", ""]; // ✅ 5 ช่อง
    verifyErrorMessage = "";
    verifyErrorIndex = null;
    pinInputRefs[0]?.focus();
  }
  
  function handlePinInput(index: number, event: Event) {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    
    if (value && !/^\d$/.test(value)) {
      pins[index] = "";
      return;
    }
    
    pins[index] = value;
    
    // ✅ [แก้ไข 2] เลื่อน focus: index < 4 (เพราะช่องสุดท้ายคือ index 4)
    if (value && index < 4) {
      pinInputRefs[index + 1]?.focus();
    }
    
    if (autoCheckIn && pins.every(p => p !== "")) {
      handleVerifyPin();
    }
  }
  
  function handlePinKeydown(index: number, event: KeyboardEvent) {
    if (event.key === "Backspace" && !pins[index] && index > 0) {
      pinInputRefs[index - 1]?.focus();
    }
  }
  
  function handlePinFocus(index: number) {
    verifyErrorMessage = "";
    verifyErrorIndex = null;
  }
  
  async function handleVerifyPin() {
    const code = pins.join("");
    // ✅ [แก้ไข 3] ตรวจสอบความยาว 5 หลัก
    if (code.length !== 5) return;
    
    verifyCode(code, 'pin');
  }

  // ✅ Unified Verification Logic with Real API
  async function verifyCode(code: string, type: 'pin' | 'qr') {
    if (isVerifying) return;

    isVerifying = true;
    verifyErrorMessage = "";
    verifyErrorIndex = null;

    try {
      // ✅ เลือก Endpoint ตามโหมดที่ผู้ใช้เลือก (Single หรือ Multi)
      let endpoint = '';
      if (verifyActionMode === 'checkout') {
        endpoint = endpoints.participations.checkoutByCode;
      } else {
         // ถ้าเป็น Check-in ให้ดูว่าเลือก Activity (Single) หรือ Project (Multi/Daily) จาก Toggle
         endpoint = eventTypeMode === 'multi' 
          ? endpoints.participations.checkInDaily 
          : endpoints.participations.checkIn;
      }
      
      const payload = type === 'pin' 
          ? { code, join_code: code, type: 'pin' } 
          : { qr_data: code, join_code: code, type: 'qr' };

      // Try primary endpoint, and if check-in returns 422 try the alternate check-in endpoint.
      let response;
      try {
        response = await api.post(endpoint, payload);
      } catch (err: any) {
        const status = err?.response?.status;
        
        // ✅ [แก้ไขจุดที่ 1] เพิ่มเงื่อนไข status === 404 และ 400 เพื่อให้สลับ API อัตโนมัติเมื่อหาไม่เจอ
        // Only attempt automatic fallback for check-in actions when backend rejects (422, 404, or 400)
        if (verifyActionMode === 'checkin' && (status === 422 || status === 404 || status === 400)) {
          const altEndpoint = endpoint === endpoints.participations.checkInDaily
            ? endpoints.participations.checkIn
            : endpoints.participations.checkInDaily;
          try {
            console.log("Primary endpoint failed, trying alternate:", altEndpoint); // Optional log
            response = await api.post(altEndpoint, payload);
          } catch (err2: any) {
            // rethrow so outer catch handles it
            throw err2;
          }
        } else {
          throw err;
        }
      }

      // Success
      lastParticipantName = response.data.participant_name || 
                            response.data.user?.name || 
                            "Participant";

      if (verifyActionMode === "checkout") {
        lastCheckOutSuccess = true;
        setTimeout(() => { lastCheckOutSuccess = false; }, 3000);
      } else {
        lastVerifySuccess = true;
        setTimeout(() => { lastVerifySuccess = false; }, 3000);
      }

      // แสดง Success ใน QR Mode ด้วย
      if (type === 'qr') {
          qrSuccessShow = true;
          setTimeout(() => { 
              qrSuccessShow = false; 
              // Resume scanning
              if (verifyMode === 'qr' && !scanning) {
                  scanning = true;
                  requestAnimationFrame(scanFrame);
              } else if (verifyMode === 'qr') {
                  requestAnimationFrame(scanFrame);
              }
          }, 2000);
      }

      if (type === 'pin') clearPins();

    } catch (error: any) {
      // ✅ [ลบ] Logic การ Lookup ผ่าน selectedEventId ออก เพราะเราไม่มี Event Select แล้ว
      verifyErrorMessage = error.response?.data?.message || error.response?.data?.detail || lang.invalidCode;
      if (type === 'pin') verifyErrorIndex = 0;
      
      // QR Error: Delay slightly before rescanning
      if (type === 'qr') {
          setTimeout(() => {
              if (verifyMode === 'qr') requestAnimationFrame(scanFrame);
          }, 1500);
      }
    } finally {
      if (type === 'pin') isVerifying = false;
      // QR mode resets isVerifying after delay in success block or immediately in error
      if (type === 'qr' && verifyErrorMessage) isVerifying = false;
      if (type === 'qr' && !verifyErrorMessage) {
           setTimeout(() => { isVerifying = false; }, 2000);
      }
    }
  }
  
  // ✅ QR Scanner (Improved Error Handling)
  async function startCamera() {
    cameraError = "";
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        cameraError = "ไม่พบกล้องในอุปกรณ์นี้";
        return;
    }

    try {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }
        });
      } catch (e) {
        console.warn("Environment camera failed, trying fallback");
        stream = await navigator.mediaDevices.getUserMedia({
          video: true
        });
      }
      
      if (videoRef && stream) {
        videoRef.srcObject = stream;
        videoRef.setAttribute("playsinline", "true");
        
        videoRef.onloadedmetadata = () => {
            videoRef.play().then(() => {
                scanning = true;
                requestAnimationFrame(scanFrame);
            }).catch(e => {
                console.error("Video play error:", e);
                cameraError = lang.cameraAccessDenied;
            });
        };
      }
    } catch (error: any) {
      if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          cameraError = "ไม่พบกล้อง";
      } else if (error.name === 'NotAllowedError') {
          cameraError = "กรุณาอนุญาตให้เข้าถึงกล้อง";
      } else {
          cameraError = lang.cameraAccessDenied;
      }
    }
  }
  
  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      stream = null;
    }
    scanning = false;
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
  }
  
  function scanFrame() {
    if (!videoRef || !canvasRef || !scanning) return;
    
    // Pause checking if verification is in progress
    if (isVerifying || qrSuccessShow) {
       animationFrameId = requestAnimationFrame(scanFrame);
       return;
    }

    const canvas = canvasRef;
    const video = videoRef;
    
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
        });
        
        if (code && code.data) {
            verifyCode(code.data, 'qr');
            return;
        }
    }
    
    animationFrameId = requestAnimationFrame(scanFrame);
  }
  
  onMount(() => {
    pinInputRefs[0]?.focus();
    // ✅ [ลบ] ส่วนโหลด Event List ออก
  });
  
  onDestroy(() => {
    stopCamera();
    // ✅ [ลบ] event listener ของ dropdown ออก
  });
</script>

<div class="vc-container">
  <div class="vc-main-card">
    <div class="vc-action-selector">
      <button class="vc-action-tab" class:active={verifyActionMode === "checkin"} on:click={() => switchActionMode("checkin")}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
          <polyline points="10 17 15 12 10 7" />
          <line x1="15" y1="12" x2="3" y2="12" />
        </svg>
        <span>{lang.checkIn}</span>
      </button>
      
      <button class="vc-action-tab checkout" class:active={verifyActionMode === "checkout"} on:click={() => switchActionMode("checkout")}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        <span>{lang.checkOut}</span>
      </button>
      
      <div class="vc-action-slider" class:checkout={verifyActionMode === "checkout"}></div>
    </div>

    {#if verifyActionMode === "checkin"}
      <div class="vc-type-selector">
        <button class="vc-type-tab" class:active={eventTypeMode === "single"} on:click={() => switchEventTypeMode("single")}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>{lang.typeSingle}</span>
        </button>

        <button class="vc-type-tab multi" class:active={eventTypeMode === "multi"} on:click={() => switchEventTypeMode("multi")}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span>{lang.typeMulti}</span>
        </button>

        <div class="vc-type-slider" class:multi={eventTypeMode === "multi"}></div>
      </div>
    {/if}

    <div class="vc-card-header">
      <div class="vc-icon-wrapper" class:checkout={verifyActionMode === "checkout"}>
        <div class="vc-icon-bg"></div>
        {#if verifyActionMode === "checkout"}
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        {:else}
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        {/if}
      </div>
      <h2 class="vc-title">{verifyActionMode === "checkout" ? lang.participantCheckOut : lang.participantCheckIn}</h2>
      <p class="vc-subtitle">{verifyActionMode === "checkout" ? lang.verifyParticipantCodeOut : lang.verifyParticipantCode}</p>
    </div>

    <div class="vc-mode-selector" class:checkout={verifyActionMode === "checkout"}>
      <button class="vc-mode-tab" class:active={verifyMode === "pin"} class:checkout={verifyActionMode === "checkout"} on:click={() => switchVerifyMode("pin")}>
        <div class="vc-mode-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
        </div>
        <span>{lang.pinCode}</span>
      </button>

      <button class="vc-mode-tab" class:active={verifyMode === "qr"} class:checkout={verifyActionMode === "checkout"} on:click={() => switchVerifyMode("qr")}>
        <div class="vc-mode-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 7V5a2 2 0 0 1 2-2h2"></path>
            <path d="M17 3h2a2 2 0 0 1 2 2v2"></path>
            <path d="M21 17v2a2 2 0 0 1-2 2h-2"></path>
            <path d="M7 21H5a2 2 0 0 1-2-2v-2"></path>
            <rect x="7" y="7" width="10" height="10" rx="1.5"></rect>
          </svg>
        </div>
        <span>{lang.scanQR}</span>
      </button>

      <div class="vc-mode-slider" class:qr={verifyMode === "qr"} class:checkout={verifyActionMode === "checkout"}></div>
    </div>

    {#if lastVerifySuccess}
      <div class="vc-success">
        <div class="vc-success-check">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <div class="vc-success-info">
          <span class="vc-success-label">{currentLang === "th" ? "เช็คอินสำเร็จ" : "Check-in Successful"}</span>
          <span class="vc-success-name">{lastParticipantName}</span>
        </div>
      </div>
    {/if}

    {#if lastCheckOutSuccess}
      <div class="vc-success checkout">
        <div class="vc-success-check checkout">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <div class="vc-success-info">
          <span class="vc-success-label checkout">{lang.checkOutSuccess}</span>
          <span class="vc-success-name">{lastParticipantName}</span>
        </div>
      </div>
    {/if}

    <div class="vc-content">
      <div class="vc-pin-mode" class:active={verifyMode === "pin"}>
        <div class="vc-auto-toggle">
          <div class="vc-auto-info">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
            <span>{verifyActionMode === "checkout" ? (currentLang === "th" ? "Auto Check Out" : "Auto Check Out") : (currentLang === "th" ? "Auto Check In" : "Auto Check In")}</span>
          </div>
          <button
            class="vc-switch"
            class:checkout={verifyActionMode === "checkout"}
            class:on={autoCheckIn}
            on:click={() => { autoCheckIn = !autoCheckIn; clearPins(); }}
            aria-pressed={autoCheckIn}
            title={
              autoCheckIn
                ? (verifyActionMode === 'checkout'
                    ? (currentLang === 'th' ? 'ปิด Auto Check Out' : 'Disable Auto Check Out')
                    : (currentLang === 'th' ? 'ปิด Auto Check In' : 'Disable Auto Check In'))
                : (verifyActionMode === 'checkout'
                    ? (currentLang === 'th' ? 'เปิด Auto Check Out' : 'Enable Auto Check Out')
                    : (currentLang === 'th' ? 'เปิด Auto Check In' : 'Enable Auto Check In'))
            }
            aria-label={
              autoCheckIn
                ? (verifyActionMode === 'checkout'
                    ? (currentLang === 'th' ? 'ปิด Auto Check Out' : 'Disable Auto Check Out')
                    : (currentLang === 'th' ? 'ปิด Auto Check In' : 'Disable Auto Check In'))
                : (verifyActionMode === 'checkout'
                    ? (currentLang === 'th' ? 'เปิด Auto Check Out' : 'Enable Auto Check Out')
                    : (currentLang === 'th' ? 'เปิด Auto Check In' : 'Enable Auto Check In'))
            }
          >
            <span class="vc-switch-knob"></span>
          </button>
        </div>

        <div class="vc-pin-area">
          <div class="vc-pin-row">
            {#each pins as pin, i}
              <div class="vc-pin-cell" class:filled={pin !== ""} class:checkout={verifyActionMode === "checkout"} class:error={verifyErrorIndex !== null && (verifyErrorMessage ? true : verifyErrorIndex === i)}>
                <input type="text" inputmode="numeric" maxlength="1" class="vc-pin-input" bind:value={pins[i]} bind:this={pinInputRefs[i]} on:input={(e) => handlePinInput(i, e)} on:keydown={(e) => handlePinKeydown(i, e)} on:focus={() => handlePinFocus(i)} disabled={isVerifying} />
              </div>
            {/each}
          </div>
        </div>

        {#if verifyErrorMessage && verifyMode === "pin"}
          <div class="vc-error-msg">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{verifyErrorMessage}</span>
          </div>
        {/if}

        <div class="vc-submit-wrapper" class:hidden={autoCheckIn}>
          <button class="vc-submit" class:checkout={verifyActionMode === "checkout"} on:click={handleVerifyPin} disabled={isVerifying || pins.some((p) => p === "") || autoCheckIn}>
            {#if isVerifying}
              <span class="vc-loader"></span>
              <span>{currentLang === "th" ? "กำลังตรวจสอบ..." : "Verifying..."}</span>
            {:else if verifyActionMode === "checkout"}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>{lang.checkOut}</span>
            {:else}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{lang.checkIn}</span>
            {/if}
          </button>
        </div>

        {#if isVerifying && autoCheckIn}
          <div class="vc-verifying">
            <span class="vc-loader lg"></span>
            <span>{currentLang === "th" ? "กำลังตรวจสอบรหัส..." : "Verifying code..."}</span>
          </div>
        {/if}

        <p class="vc-hint">
          {#if autoCheckIn}
            {lang.enterDigitCode} • {verifyActionMode === "checkout" ? lang.autoCheckOutEnabled : lang.autoCheckInEnabled}
          {:else}
            {lang.enterDigitCode} • {verifyActionMode === "checkout" ? lang.pressCheckOut : lang.pressCheckIn}
          {/if}
        </p>
      </div>

      <div class="vc-qr-mode" class:active={verifyMode === "qr"}>
        <div class="vc-scanner">
          {#if cameraError}
            <div class="vc-camera-err">
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                <circle cx="12" cy="13" r="4" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
              <p>{cameraError}</p>
              <button class="vc-retry" on:click={startCamera}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M23 4v6h-6M1 20v-6h6" />
                  <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
                </svg>
                Try Again
              </button>
            </div>
          {:else}
            <video bind:this={videoRef} class="vc-video" playsinline muted></video>
            <canvas bind:this={canvasRef} class="vc-canvas"></canvas>

            <div class="vc-scan-overlay">
              <div class="vc-scan-frame" class:active={scanning && !isVerifying && !qrSuccessShow} class:success={qrSuccessShow} class:checkout={verifyActionMode === "checkout"}>
                <span class="vc-frame-corner tl"></span>
                <span class="vc-frame-corner tr"></span>
                <span class="vc-frame-corner bl"></span>
                <span class="vc-frame-corner br"></span>
                {#if scanning && !isVerifying && !qrSuccessShow}
                  <div class="vc-scan-beam" class:checkout={verifyActionMode === "checkout"}></div>
                {/if}
              </div>

              {#if qrSuccessShow}
                <div class="vc-qr-success" class:checkout={verifyActionMode === "checkout"}>
                  <div class="vc-qr-success-icon" class:checkout={verifyActionMode === "checkout"}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                      <path d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <span class="vc-qr-success-text">{lastParticipantName}</span>
                  <span class="vc-qr-success-label" class:checkout={verifyActionMode === "checkout"}>
                    {verifyActionMode === "checkout" ? (currentLang === "th" ? "เช็คเอาท์สำเร็จ!" : "Check-out Success!") : (currentLang === "th" ? "เช็คอินสำเร็จ!" : "Check-in Success!")}
                  </span>
                </div>
              {/if}
            </div>

            {#if isVerifying}
              <div class="vc-scan-status verifying">
                <span class="vc-loader sm"></span>
                <span>Verifying...</span>
              </div>
            {:else if qrSuccessShow}
              <div class="vc-scan-status success" class:checkout={verifyActionMode === "checkout"}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <path d="M5 13l4 4L19 7"></path>
                </svg>
                <span>{verifyActionMode === "checkout" ? "Check-out OK!" : "Check-in OK!"}</span>
              </div>
            {:else if scanning}
              <div class="vc-scan-status active" class:checkout={verifyActionMode === "checkout"}>
                <span class="vc-pulse-dot" class:checkout={verifyActionMode === "checkout"}></span>
                <span>Scanning...</span>
              </div>
            {/if}
          {/if}
        </div>

        {#if verifyErrorMessage && verifyMode === "qr"}
          <div class="vc-error-msg">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4m0 4h.01" />
            </svg>
            <span>{verifyErrorMessage}</span>
          </div>
        {/if}

        <p class="vc-hint">{lang.pointCameraAtQR}</p>
      </div>
    </div>
  </div>
</div>

<style>
  /* CONTAINER */
  .vc-container {
    padding: 2rem 1.5rem;
    max-width: 600px;
    margin: 0 auto;
  }

  .vc-main-card {
    background: rgba(30, 41, 59, 0.6);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 24px;
    padding: 2rem;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
  }

  /* ACTION SELECTOR (Check-in/Check-out) */
  .vc-action-selector {
    position: relative;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
    background: rgba(15, 23, 42, 0.5);
    padding: 0.5rem; /* Padding นี้ต้องถูกนำไปคิดใน Slider */
    border-radius: 16px;
    margin-bottom: 2rem;
  }

  .vc-action-tab {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.875rem 1rem;
    background: transparent;
    border: none;
    border-radius: 12px;
    color: #94a3b8;
    font-weight: 600;
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.3s;
  }

  .vc-action-tab svg {
    width: 20px;
    height: 20px;
  }

  .vc-action-tab.active {
    color: #ffffff;
  }

  .vc-action-tab.checkout.active {
    color: #ffffff;
  }

  .vc-action-slider {
    position: absolute;
    top: 0.5rem;
    left: 0.5rem;
    /* ✅ แก้ไข: ลบ Padding (0.5rem) และครึ่งหนึ่งของ Gap (0.25rem) ออกจาก 50% */
    width: calc(50% - 0.5rem - 0.25rem); 
    height: calc(100% - 1rem);
    background: linear-gradient(135deg, #10b981, #059669);
    border-radius: 12px;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 1;
  }

  .vc-action-slider.checkout {
    /* ✅ แก้ไข: เลื่อนไป 100% ของตัวเอง + Gap (0.5rem) */
    transform: translateX(calc(100% + 0.5rem));
    background: linear-gradient(135deg, #f59e0b, #d97706);
  }

  /* ✅ Type Selector (New) */
  .vc-type-selector {
    /* layout vars */
    --vc-type-gap: 0.5rem;
    --vc-type-pad-vertical: 0.45rem;
    --vc-type-pad-horizontal: 0.7rem; /* ค่านี้สำคัญ */
    
    position: relative;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--vc-type-gap);
    background: rgba(15, 23, 42, 0.3);
    padding: var(--vc-type-pad-vertical) var(--vc-type-pad-horizontal);
    border-radius: 12px;
    margin-bottom: 1.5rem;
    border: 1px solid rgba(255,255,255,0.05);
    overflow: hidden;
  }
  
  .vc-type-tab {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.6rem 0.5rem;
    background: transparent;
    border: none;
    border-radius: 8px;
    color: #64748b;
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.3s;
  }
  
  .vc-type-tab.active { color: #fff; }
  
 .vc-type-slider {
    position: absolute;
    top: var(--vc-type-pad-vertical);
    left: var(--vc-type-pad-horizontal);
    
    /* ✅ แก้ไข: คำนวณความกว้างให้พอดีโดยลบ Padding แนวนอนออกด้วย */
    width: calc(50% - var(--vc-type-pad-horizontal) - (var(--vc-type-gap) / 2));
    
    height: calc(100% - (var(--vc-type-pad-vertical) * 2));
    background: #334155;
    border-radius: 8px;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 1;
  }

  .vc-type-slider.multi { 
    /* ✅ แก้ไข: เลื่อนไป 100% ของตัวเอง + Gap */
    transform: translateX(calc(100% + var(--vc-type-gap))); 
  }

  .vc-type-tab {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: var(--vc-type-pad-vertical) var(--vc-type-pad-horizontal);
    background: transparent;
    border: none;
    border-radius: 8px;
    color: #64748b;
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.3s;
    overflow: hidden; /* ensure long labels do not push out */
  }

  .vc-type-tab span {
    display: inline-block;
    max-width: calc(100% - 28px);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .vc-type-tab svg {
    flex: 0 0 18px;
    width: 18px;
    height: 18px;
  }

  /* CARD HEADER */
  .vc-card-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .vc-icon-wrapper {
    width: 80px;
    height: 80px;
    margin: 0 auto 1.5rem;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .vc-icon-bg {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.1));
    border-radius: 50%;
    animation: pulse-ring 2s infinite;
  }

  .vc-icon-wrapper.checkout .vc-icon-bg {
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.1));
  }

  .vc-icon-wrapper svg {
    position: relative;
    z-index: 1;
    color: #10b981;
  }

  .vc-icon-wrapper.checkout svg {
    color: #f59e0b;
  }

  .vc-title {
    font-size: 1.75rem;
    font-weight: 700;
    color: #f8fafc;
    margin: 0 0 0.5rem 0;
  }

  .vc-subtitle {
    color: #94a3b8;
    font-size: 0.95rem;
    margin: 0;
  }

  /* MODE SELECTOR (PIN/QR) */
  .vc-mode-selector {
    position: relative;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
    background: rgba(15, 23, 42, 0.5);
    padding: 0.5rem;
    border-radius: 16px;
    margin-bottom: 2rem;
  }

  .vc-mode-tab {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 1rem;
    background: transparent;
    border: none;
    border-radius: 12px;
    color: #64748b;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
  }

  .vc-mode-icon {
    width: 36px;
    height: 36px;
    background: rgba(100, 116, 139, 0.1);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s;
  }

  .vc-mode-tab.active {
    color: #10b981;
  }

  .vc-mode-tab.active .vc-mode-icon {
    background: rgba(16, 185, 129, 0.15);
  }

  .vc-mode-tab.active .vc-mode-icon svg {
    color: #10b981;
  }

  .vc-mode-tab.checkout.active {
    color: #f59e0b;
  }

  .vc-mode-tab.checkout.active .vc-mode-icon {
    background: rgba(245, 158, 11, 0.15);
  }

  .vc-mode-tab.checkout.active .vc-mode-icon svg {
    color: #f59e0b;
  }

  .vc-mode-slider {
    position: absolute;
    top: 0.5rem;
    left: 0.5rem;
    width: calc(50% - 0.25rem);
    height: calc(100% - 1rem);
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.1));
    border: 1px solid rgba(16, 185, 129, 0.3);
    border-radius: 12px;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 1;
  }

  .vc-mode-slider.qr {
    transform: translateX(calc(100% + 0.5rem));
  }

  .vc-mode-slider.checkout {
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.1));
    border-color: rgba(245, 158, 11, 0.3);
  }

  /* SUCCESS MESSAGE */
  .vc-success {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.25rem 1.5rem;
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.05));
    border: 1px solid rgba(16, 185, 129, 0.3);
    border-radius: 16px;
    margin-bottom: 2rem;
    animation: slideDown 0.3s ease-out;
  }

  .vc-success.checkout {
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.05));
    border-color: rgba(245, 158, 11, 0.3);
  }

  .vc-success-check {
    width: 48px;
    height: 48px;
    background: #10b981;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .vc-success-check.checkout {
    background: #f59e0b;
  }

  .vc-success-check svg {
    color: white;
  }

  .vc-success-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .vc-success-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: #10b981;
    text-transform: uppercase;
  }

  .vc-success-label.checkout {
    color: #f59e0b;
  }

  .vc-success-name {
    font-size: 1.1rem;
    font-weight: 700;
    color: #f8fafc;
  }

  /* CONTENT */
  .vc-content {
    position: relative;
  }

  .vc-pin-mode, .vc-qr-mode {
    display: none;
  }

  .vc-pin-mode.active, .vc-qr-mode.active {
    display: block;
  }

  /* AUTO TOGGLE */
  .vc-auto-toggle {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.25rem;
    background: rgba(15, 23, 42, 0.5);
    border-radius: 12px;
    margin-bottom: 1.5rem;
  }

  .vc-auto-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: #94a3b8;
    font-weight: 500;
  }

  .vc-auto-info svg {
    color: #f59e0b;
  }

  .vc-switch {
    position: relative;
    width: 56px;
    height: 32px;
    background: rgba(100, 116, 139, 0.3);
    border: none;
    border-radius: 16px;
    cursor: pointer;
    transition: all 0.3s;
  }

  .vc-switch.on {
    background: #10b981;
  }

  .vc-switch.checkout.on {
    background: #f59e0b;
  }

  .vc-switch-knob {
    position: absolute;
    top: 4px;
    left: 4px;
    width: 24px;
    height: 24px;
    background: white;
    border-radius: 50%;
    transition: transform 0.3s;
  }

  .vc-switch.on .vc-switch-knob {
    transform: translateX(24px);
  }

  /* PIN INPUT */
  .vc-pin-area {
    margin-bottom: 1.5rem;
  }

  .vc-pin-row {
    display: grid;
    /* ✅ แก้เป็น 5 คอลัมน์ */
    grid-template-columns: repeat(5, 1fr);
    gap: 0.75rem;
  }

  .vc-pin-cell {
    position: relative;
    aspect-ratio: 1;
    background: rgba(15, 23, 42, 0.5);
    border: 2px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    transition: all 0.3s;
  }

  .vc-pin-cell.filled {
    border-color: #10b981;
    background: rgba(16, 185, 129, 0.05);
  }

  .vc-pin-cell.checkout.filled {
    border-color: #f59e0b;
    background: rgba(245, 158, 11, 0.05);
  }

  .vc-pin-cell.error {
    border-color: #ef4444;
    background: rgba(239, 68, 68, 0.05);
    animation: shake 0.3s;
  }

  .vc-pin-input {
    width: 100%;
    height: 100%;
    background: transparent;
    border: none;
    text-align: center;
    font-size: 1.5rem;
    font-weight: 700;
    color: #f8fafc;
    caret-color: #10b981;
  }

  .vc-pin-input:focus {
    outline: none;
  }

  .vc-pin-cell.checkout.filled .vc-pin-input {
    caret-color: #f59e0b;
  }

  /* ERROR MESSAGE */
  .vc-error-msg {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1.25rem;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 12px;
    color: #ef4444;
    margin-bottom: 1.5rem;
    animation: slideDown 0.3s;
  }

  .vc-error-msg svg {
    flex-shrink: 0;
  }

  /* SUBMIT BUTTON */
  .vc-submit-wrapper {
    margin-bottom: 1rem;
  }

  .vc-submit-wrapper.hidden {
    display: none;
  }

  .vc-submit {
    width: 100%;
    padding: 1.125rem 1.5rem;
    background: linear-gradient(135deg, #10b981, #059669);
    border: none;
    border-radius: 14px;
    color: white;
    font-size: 1rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    cursor: pointer;
    transition: all 0.3s;
    box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
  }

  .vc-submit.checkout {
    background: linear-gradient(135deg, #f59e0b, #d97706);
    box-shadow: 0 8px 20px rgba(245, 158, 11, 0.3);
  }

  .vc-submit:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 12px 28px rgba(16, 185, 129, 0.4);
  }

  .vc-submit.checkout:hover:not(:disabled) {
    box-shadow: 0 12px 28px rgba(245, 158, 11, 0.4);
  }

  .vc-submit:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* VERIFYING */
  .vc-verifying {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 2rem;
    color: #94a3b8;
  }

  /* HINT */
  .vc-hint {
    text-align: center;
    color: #64748b;
    font-size: 0.875rem;
    margin: 0;
  }

  /* QR SCANNER */
  .vc-scanner {
    position: relative;
    width: 100%;
    aspect-ratio: 1;
    background: #000;
    border-radius: 16px;
    overflow: hidden;
    margin-bottom: 1.5rem;
  }

  .vc-video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .vc-canvas {
    display: none;
  }

  .vc-camera-err {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 1rem;
    padding: 2rem;
    color: #94a3b8;
    text-align: center;
  }

  .vc-retry {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: #10b981;
    border: none;
    border-radius: 10px;
    color: white;
    font-weight: 600;
    cursor: pointer;
  }

  /* SCAN OVERLAY */
  .vc-scan-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .vc-scan-frame {
    position: relative;
    width: 70%;
    aspect-ratio: 1;
    border-radius: 16px;
  }

  .vc-frame-corner {
    position: absolute;
    width: 32px;
    height: 32px;
    border-color: rgba(255, 255, 255, 0.3);
  }

  .vc-frame-corner.tl { top: 0; left: 0; border-top: 3px solid; border-left: 3px solid; border-radius: 16px 0 0 0; }
  .vc-frame-corner.tr { top: 0; right: 0; border-top: 3px solid; border-right: 3px solid; border-radius: 0 16px 0 0; }
  .vc-frame-corner.bl { bottom: 0; left: 0; border-bottom: 3px solid; border-left: 3px solid; border-radius: 0 0 0 16px; }
  .vc-frame-corner.br { bottom: 0; right: 0; border-bottom: 3px solid; border-right: 3px solid; border-radius: 0 0 16px 0; }

  .vc-scan-frame.active .vc-frame-corner {
    border-color: #10b981;
  }

  .vc-scan-frame.checkout.active .vc-frame-corner {
    border-color: #f59e0b;
  }

  .vc-scan-frame.success .vc-frame-corner {
    border-color: #10b981;
  }

  .vc-scan-beam {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, #10b981, transparent);
    animation: scan 2s linear infinite;
  }

  .vc-scan-beam.checkout {
    background: linear-gradient(90deg, transparent, #f59e0b, transparent);
  }

  /* QR SUCCESS */
  .vc-qr-success {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    padding: 2rem;
    background: rgba(16, 185, 129, 0.95);
    border-radius: 16px;
    animation: scaleIn 0.3s;
  }

  .vc-qr-success.checkout {
    background: rgba(245, 158, 11, 0.95);
  }

  .vc-qr-success-icon {
    width: 64px;
    height: 64px;
    background: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .vc-qr-success-icon svg {
    width: 36px;
    height: 36px;
    color: #10b981;
  }

  .vc-qr-success-icon.checkout svg {
    color: #f59e0b;
  }

  .vc-qr-success-text {
    font-size: 1.25rem;
    font-weight: 700;
    color: white;
  }

  .vc-qr-success-label {
    font-size: 0.95rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.9);
    text-transform: uppercase;
  }

  /* SCAN STATUS */
  .vc-scan-status {
    position: absolute;
    top: 1rem;
    right: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(10px);
    border-radius: 20px;
    font-size: 0.875rem;
    font-weight: 600;
    color: white;
  }

  .vc-scan-status.active {
    color: #10b981;
  }

  .vc-scan-status.active.checkout {
    color: #f59e0b;
  }

  .vc-scan-status.success {
    background: rgba(16, 185, 129, 0.9);
  }

  .vc-scan-status.success.checkout {
    background: rgba(245, 158, 11, 0.9);
  }

  .vc-pulse-dot {
    width: 8px;
    height: 8px;
    background: #10b981;
    border-radius: 50%;
    animation: pulse 1.5s infinite;
  }

  .vc-pulse-dot.checkout {
    background: #f59e0b;
  }

  /* LOADER */
  .vc-loader {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  .vc-loader.sm {
    width: 16px;
    height: 16px;
  }

  .vc-loader.lg {
    width: 32px;
    height: 32px;
  }

  /* ANIMATIONS */
  @keyframes pulse-ring {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.1); opacity: 0.8; }
  }

  @keyframes slideDown {
    from { transform: translateY(-10px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
  }

  @keyframes scan {
    0% { transform: translateY(0); }
    100% { transform: translateY(100%); }
  }

  @keyframes scaleIn {
    from { transform: scale(0.8); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  /* RESPONSIVE */
  @media (max-width: 640px) {
    .vc-container {
      padding: 1rem;
    }

    .vc-main-card {
      padding: 1.5rem;
    }

    .vc-title {
      font-size: 1.5rem;
    }

    .vc-pin-row {
      gap: 0.5rem;
    }

    .vc-pin-input {
      font-size: 1.25rem;
    }
  }
</style>