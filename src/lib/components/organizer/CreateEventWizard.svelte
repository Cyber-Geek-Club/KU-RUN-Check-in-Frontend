<script lang="ts">
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import {
    eventFormData,
    currentStep,
    isStepValid,
    nextStep,
    prevStep,
    goToStep,
    resetForm,
    validateForm,
    isSubmitting,
  } from '$lib/stores/eventFormStore';
  
  // Import step components (will be created separately)
  import BasicInfoStep from './steps/BasicInfoStep.svelte';
  // TODO: Create these step components
  // import ScheduleStep from './steps/ScheduleStep.svelte';
  // import RewardsStep from './steps/RewardsStep.svelte';
  // import ReviewStep from './steps/ReviewStep.svelte';

  export let currentLang: 'th' | 'en' = 'th';
  export let onSubmit: (data: any) => Promise<void>;
  export let onCancel: () => void;

  // Placeholder components for missing steps
  const PlaceholderStep = BasicInfoStep; // Use BasicInfoStep as placeholder

  const steps = [
    {
      id: 1,
      title: { th: 'ข้อมูลพื้นฐาน', en: 'Basic Information' },
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      component: BasicInfoStep,
    },
    {
      id: 2,
      title: { th: 'กำหนดการ', en: 'Schedule' },
      icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
      component: PlaceholderStep, // ScheduleStep,
    },
    {
      id: 3,
      title: { th: 'รางวัล', en: 'Rewards' },
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      component: PlaceholderStep, // RewardsStep,
    },
    {
      id: 4,
      title: { th: 'ตรวจสอบและเผยแพร่', en: 'Review & Publish' },
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      component: PlaceholderStep, // ReviewStep,
    },
  ];

  let isLoading = false;

  async function handleNext() {
    if (!validateForm($currentStep)) {
      return;
    }
    
    if ($currentStep === 4) {
      // Final step - submit
      await handleSubmit();
    } else {
      nextStep();
    }
  }

  async function handleSubmit() {
    if (!validateForm()) {
      return;
    }

    isSubmitting.set(true);
    try {
      await onSubmit($eventFormData);
      resetForm();
    } catch (error) {
      console.error('Submit error:', error);
      // Error handling will be done in parent component
    } finally {
      isSubmitting.set(false);
    }
  }

  function handleCancel() {
    if (confirm(currentLang === 'th' ? 'ยกเลิกการสร้างกิจกรรม?' : 'Cancel event creation?')) {
      resetForm();
      onCancel();
    }
  }

  $: progressPercent = ($currentStep / steps.length) * 100;
  $: canGoNext = $isStepValid;
  $: canGoPrev = $currentStep > 1;
</script>

<div class="wizard-container">
  <!-- Header with Progress -->
  <div class="wizard-header">
    <div class="wizard-title">
      <h2>
        {currentLang === 'th' ? 'สร้างกิจกรรมใหม่' : 'Create New Event'}
      </h2>
      <p class="wizard-subtitle">
        {currentLang === 'th' 
          ? 'กรอกข้อมูลตามขั้นตอนด้านล่าง' 
          : 'Fill in the information step by step below'}
      </p>
    </div>
    
    <!-- Progress Bar -->
    <div class="progress-container">
      <div class="progress-bar">
        <div class="progress-fill" style="width: {progressPercent}%"></div>
      </div>
      <span class="progress-text">
        {currentLang === 'th' ? 'ขั้นตอนที่' : 'Step'} {$currentStep} / {steps.length}
      </span>
    </div>
  </div>

  <!-- Step Indicators -->
  <div class="step-indicators">
    {#each steps as step, index}
      <button
        class="step-indicator"
        class:active={$currentStep === step.id}
        class:completed={$currentStep > step.id}
        on:click={() => goToStep(step.id)}
        disabled={$currentStep < step.id}
      >
        <div class="step-icon">
          {#if $currentStep > step.id}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          {:else}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={step.icon} />
            </svg>
          {/if}
        </div>
        <span class="step-title">{step.title[currentLang]}</span>
        <div class="step-number">{step.id}</div>
      </button>
      
      {#if index < steps.length - 1}
        <div class="step-connector" class:completed={$currentStep > step.id}></div>
      {/if}
    {/each}
  </div>

  <!-- Step Content -->
  <div class="step-content">
    {#each steps as step}
      {#if $currentStep === step.id}
        <div class="step-wrapper" in:fade={{ duration: 200 }}>
          <svelte:component this={step.component} {currentLang} />
        </div>
      {/if}
    {/each}
  </div>

  <!-- Navigation Buttons -->
  <div class="wizard-footer">
    <button
      class="btn btn-secondary"
      on:click={handleCancel}
      disabled={$isSubmitting}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
      {currentLang === 'th' ? 'ยกเลิก' : 'Cancel'}
    </button>

    <div class="nav-buttons">
      {#if canGoPrev}
        <button
          class="btn btn-outline"
          on:click={prevStep}
          disabled={$isSubmitting}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          {currentLang === 'th' ? 'ย้อนกลับ' : 'Previous'}
        </button>
      {/if}

      <button
        class="btn btn-primary"
        on:click={handleNext}
        disabled={!canGoNext || $isSubmitting}
      >
        {#if $isSubmitting}
          <div class="spinner"></div>
        {:else if $currentStep === 4}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {currentLang === 'th' ? 'เผยแพร่กิจกรรม' : 'Publish Event'}
        {:else}
          {currentLang === 'th' ? 'ถัดไป' : 'Next'}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        {/if}
      </button>
    </div>
  </div>
</div>

<style>
  .wizard-container {
    max-width: 1000px;
    margin: 0 auto;
    padding: 2rem;
    background: linear-gradient(165deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%);
    border-radius: 24px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
  }

  .wizard-header {
    margin-bottom: 2.5rem;
    text-align: center;
  }

  .wizard-title h2 {
    margin: 0 0 0.5rem;
    font-size: 1.8rem;
    font-weight: 700;
    color: #f8fafc;
  }

  .wizard-subtitle {
    margin: 0;
    color: #94a3b8;
    font-size: 0.95rem;
  }

  .progress-container {
    margin-top: 1.5rem;
  }

  .progress-bar {
    height: 8px;
    background: rgba(100, 116, 139, 0.2);
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 0.5rem;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #10b981 0%, #059669 100%);
    transition: width 0.3s ease;
  }

  .progress-text {
    font-size: 0.85rem;
    color: #cbd5e1;
    font-weight: 500;
  }

  /* Step Indicators */
  .step-indicators {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 3rem;
    position: relative;
  }

  .step-indicator {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    background: none;
    border: none;
    cursor: pointer;
    position: relative;
    flex: 1;
    max-width: 150px;
    transition: all 0.3s ease;
  }

  .step-indicator:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .step-icon {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: rgba(100, 116, 139, 0.2);
    border: 2px solid rgba(100, 116, 139, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #64748b;
    transition: all 0.3s ease;
  }

  .step-indicator.active .step-icon {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    border-color: #10b981;
    color: white;
    box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
  }

  .step-indicator.completed .step-icon {
    background: rgba(16, 185, 129, 0.15);
    border-color: #10b981;
    color: #10b981;
  }

  .step-icon svg {
    width: 24px;
    height: 24px;
  }

  .step-title {
    font-size: 0.85rem;
    color: #94a3b8;
    font-weight: 500;
    text-align: center;
    transition: color 0.3s ease;
  }

  .step-indicator.active .step-title {
    color: #10b981;
    font-weight: 600;
  }

  .step-indicator.completed .step-title {
    color: #cbd5e1;
  }

  .step-number {
    position: absolute;
    top: 0;
    right: 0;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: rgba(100, 116, 139, 0.3);
    color: #cbd5e1;
    font-size: 0.7rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .step-indicator.active .step-number {
    background: #10b981;
    color: white;
  }

  .step-connector {
    height: 2px;
    flex: 1;
    background: rgba(100, 116, 139, 0.2);
    margin: 0 -10px;
    margin-bottom: 2rem;
    transition: background 0.3s ease;
  }

  .step-connector.completed {
    background: #10b981;
  }

  /* Step Content */
  .step-content {
    min-height: 400px;
    margin-bottom: 2rem;
  }

  .step-wrapper {
    animation: fadeIn 0.3s ease;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Footer */
  .wizard-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 2rem;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }

  .nav-buttons {
    display: flex;
    gap: 1rem;
  }

  /* Buttons */
  .btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border-radius: 12px;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
  }

  .btn svg {
    width: 18px;
    height: 18px;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-primary {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }

  .btn-primary:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
  }

  .btn-secondary {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #f87171;
  }

  .btn-secondary:hover:not(:disabled) {
    background: rgba(239, 68, 68, 0.2);
  }

  .btn-outline {
    background: transparent;
    border: 1px solid rgba(100, 116, 139, 0.3);
    color: #cbd5e1;
  }

  .btn-outline:hover:not(:disabled) {
    border-color: #10b981;
    color: #10b981;
    background: rgba(16, 185, 129, 0.05);
  }

  .spinner {
    width: 18px;
    height: 18px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Responsive */
  @media (max-width: 768px) {
    .wizard-container {
      padding: 1.5rem;
    }

    .step-indicators {
      overflow-x: auto;
      gap: 0.5rem;
      padding-bottom: 1rem;
    }

    .step-indicator {
      min-width: 80px;
    }

    .step-icon {
      width: 48px;
      height: 48px;
    }

    .step-title {
      font-size: 0.75rem;
    }

    .wizard-footer {
      flex-direction: column;
      gap: 1rem;
    }

    .nav-buttons {
      width: 100%;
      justify-content: space-between;
    }

    .btn {
      flex: 1;
    }
  }
</style>
