<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import jsQR from 'jsqr';

  const dispatch = createEventDispatcher<{
    scan: { data: string };
    error: { message: string };
    ready: void;
    stop: void;
  }>();

  export let active = false;
  export let width = 300;
  export let height = 300;

  let video: HTMLVideoElement;
  let canvas: HTMLCanvasElement;
  let canvasContext: CanvasRenderingContext2D | null;
  let stream: MediaStream | null = null;
  let animationFrame: number;
  let scanning = false;
  let cameraError = false;
  let errorMessage = '';

  $: if (active) {
    startCamera();
  } else {
    stopCamera();
  }

  onMount(() => {
    if (canvas) {
      canvasContext = canvas.getContext('2d');
    }
  });

  onDestroy(() => {
    stopCamera();
  });

  async function startCamera() {
    if (scanning) return;

    cameraError = false;
    errorMessage = '';

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: width },
          height: { ideal: height },
          facingMode: 'environment' // Prefer back camera
        }
      });

      if (video) {
        video.srcObject = stream;
        video.setAttribute('playsinline', 'true'); // Required for iOS
        video.play();

        video.onloadedmetadata = () => {
          scanning = true;
          dispatch('ready');
          scanForQRCode();
        };
      }
    } catch (error: any) {
      cameraError = true;
      errorMessage = error.message || 'Failed to access camera';
      dispatch('error', { message: errorMessage });
    }
  }

  function stopCamera() {
    scanning = false;
    
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }

    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      stream = null;
    }

    if (video) {
      video.srcObject = null;
    }

    dispatch('stop');
  }

  function scanForQRCode() {
    if (!scanning || !video || !canvas || !canvasContext) {
      return;
    }

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      canvasContext.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Get image data for QR code scanning
      const imageData = canvasContext.getImageData(0, 0, canvas.width, canvas.height);
      
      // Scan for QR code
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      
      if (code) {
        // Found QR code
        scanning = false;
        dispatch('scan', { data: code.data });
        return;
      }
    }

    // Continue scanning
    animationFrame = requestAnimationFrame(scanForQRCode);
  }

  function retryCamera() {
    cameraError = false;
    errorMessage = '';
    startCamera();
  }
</script>

<div class="qr-scanner" class:active>
  {#if cameraError}
    <div class="error-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M12 3c4.97 0 9 4.03 9 9s-4.03 9-9 9-9-4.03-9-9 4.03-9 9-9z"/>
      </svg>
      <h3>Camera Access Required</h3>
      <p>{errorMessage}</p>
      <button class="retry-btn" on:click={retryCamera}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
        Retry Camera
      </button>
    </div>
  {:else}
    <div class="scanner-container">
      <!-- Video element for camera feed -->
      <!-- svelte-ignore a11y-media-has-caption -->
      <video
        bind:this={video}
        style="width: {width}px; height: {height}px;"
        muted
        playsinline
      ></video>
      
      <!-- Hidden canvas for QR processing -->
      <canvas bind:this={canvas} style="display: none;"></canvas>
      
      <!-- Scanning overlay -->
      {#if scanning}
        <div class="scanning-overlay">
          <div class="scanner-frame">
            <div class="corner top-left"></div>
            <div class="corner top-right"></div>
            <div class="corner bottom-left"></div>
            <div class="corner bottom-right"></div>
          </div>
          
          <div class="scan-line"></div>
          
          <p class="scan-text">Position QR code within the frame</p>
        </div>
      {/if}
      
      <!-- Loading state -->
      {#if active && !scanning && !cameraError}
        <div class="loading-overlay">
          <div class="spinner"></div>
          <p>Starting camera...</p>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .qr-scanner {
    position: relative;
    border-radius: 16px;
    overflow: hidden;
    background: #1e293b;
    border: 2px solid rgba(100, 116, 139, 0.3);
    transition: all 0.3s ease;
  }

  .qr-scanner.active {
    border-color: #10b981;
    box-shadow: 0 0 20px rgba(16, 185, 129, 0.3);
  }

  .scanner-container {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  video {
    display: block;
    border-radius: 14px;
    background: #000;
  }

  .scanning-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    background: rgba(0, 0, 0, 0.3);
  }

  .scanner-frame {
    position: relative;
    width: 200px;
    height: 200px;
    border: 2px solid rgba(16, 185, 129, 0.8);
    border-radius: 8px;
  }

  .corner {
    position: absolute;
    width: 20px;
    height: 20px;
    border: 3px solid #10b981;
  }

  .corner.top-left {
    top: -2px;
    left: -2px;
    border-right: none;
    border-bottom: none;
  }

  .corner.top-right {
    top: -2px;
    right: -2px;
    border-left: none;
    border-bottom: none;
  }

  .corner.bottom-left {
    bottom: -2px;
    left: -2px;
    border-right: none;
    border-top: none;
  }

  .corner.bottom-right {
    bottom: -2px;
    right: -2px;
    border-left: none;
    border-top: none;
  }

  .scan-line {
    position: absolute;
    width: 180px;
    height: 2px;
    background: linear-gradient(90deg, transparent, #10b981, transparent);
    animation: scanMove 2s linear infinite;
  }

  @keyframes scanMove {
    0%, 100% {
      transform: translateY(-90px);
      opacity: 0;
    }
    50% {
      transform: translateY(0);
      opacity: 1;
    }
    100% {
      transform: translateY(90px);
      opacity: 0;
    }
  }

  .scan-text {
    margin-top: 2rem;
    color: #f8fafc;
    font-size: 0.9rem;
    text-align: center;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  }

  .loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    background: #1e293b;
    gap: 1rem;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(16, 185, 129, 0.2);
    border-top-color: #10b981;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  .loading-overlay p {
    color: #94a3b8;
    font-size: 0.9rem;
    margin: 0;
  }

  .error-state {
    padding: 2rem;
    text-align: center;
    color: #94a3b8;
  }

  .error-state svg {
    width: 48px;
    height: 48px;
    color: #ef4444;
    margin-bottom: 1rem;
  }

  .error-state h3 {
    margin: 0 0 0.5rem;
    color: #f8fafc;
    font-size: 1.125rem;
  }

  .error-state p {
    margin: 0 0 1.5rem;
    font-size: 0.9rem;
    color: #94a3b8;
  }

  .retry-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: #10b981;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    margin: 0 auto;
  }

  .retry-btn:hover {
    background: #059669;
    transform: translateY(-2px);
  }

  .retry-btn svg {
    width: 16px;
    height: 16px;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 640px) {
    .scanner-frame {
      width: 150px;
      height: 150px;
    }

    .scan-line {
      width: 130px;
    }

    @keyframes scanMove {
      0%, 100% {
        transform: translateY(-65px);
        opacity: 0;
      }
      50% {
        transform: translateY(0);
        opacity: 1;
      }
      100% {
        transform: translateY(65px);
        opacity: 0;
      }
    }
  }
</style>