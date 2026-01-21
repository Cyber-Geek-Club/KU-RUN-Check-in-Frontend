<script lang="ts">
  import { goto } from '$app/navigation';
  import { eventForm } from '../../_lib/stores/eventForm';
  import { appState } from '../../_lib/stores/appState';
  import { t } from '../../_lib/i18n';
  import { onMount } from 'svelte';
  
  $: lang = $appState.currentLang;
  
  let ce_fileInput: HTMLInputElement;
  let ce_activeDropdown: string | null = null;
  let ce_formData = {
    imagePreview: null as string | null,
    imageFile: null as File | null,
    title: '',
    description: '',
    location: '',
    eventType: 'single_day',
    maxCheckinsPerUser: 1
  };
  
  let ce_validationErrors = new Set<string>();
  
  onMount(() => {
    const storeData = $eventForm as any;
    if (storeData.title) {
      ce_formData = { ...storeData };
    }
  });
  
  function ce_trigFile() {
    ce_fileInput?.click();
  }
  
  function ce_handleImg(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert(lang === 'th' ? 'ไฟล์ใหญ่เกิน 5MB' : 'File size exceeds 5MB');
        return;
      }
      ce_formData.imageFile = file;
      const reader = new FileReader();
      reader.onload = (ev) => {
        ce_formData.imagePreview = ev.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  function ce_handleImgError(e: Event) {
    const img = e.currentTarget as HTMLImageElement;
    img.src = '/image 7.png';
  }
  
  function ce_setEventType(type: 'single_day' | 'multi_day') {
    ce_formData.eventType = type;
    if (type === 'single_day') {
      ce_formData.maxCheckinsPerUser = 1;
    }
  }
  
  function validateForm(): boolean {
    ce_validationErrors.clear();
    
    if (!ce_formData.title.trim()) ce_validationErrors.add('title');
    if (!ce_formData.description.trim()) ce_validationErrors.add('description');
    if (!ce_formData.location.trim()) ce_validationErrors.add('location');
    
    ce_validationErrors = new Set(ce_validationErrors);
    return ce_validationErrors.size === 0;
  }
  
  function handleNext() {
    if (!validateForm()) {
      return;
    }
    
    eventForm.set(ce_formData as any);
    goto('/organizer/create-event/capacity');
  }
  
  function handleSaveDraft() {
    eventForm.set({ ...ce_formData, status: 'draft' } as any);
    alert(lang === 'th' ? 'บันทึกแบบร่างแล้ว' : 'Draft saved');
  }
</script>

<div class="ce-grid-layout">
  <!-- Image Upload Section -->
  <div
    class="ce-card ce-img-card"
    class:has-img={ce_formData.imagePreview}
    role="button"
    tabindex="0"
    aria-label="Upload event image"
    on:click={ce_trigFile}
    on:keydown={(e) => {
      if (e.key === "Enter" || e.key === " ") ce_trigFile();
    }}
  >
    <input
      type="file"
      accept="image/*"
      bind:this={ce_fileInput}
      on:change={ce_handleImg}
      hidden
    />
    {#if ce_formData.imagePreview}
      <img
        src={ce_formData.imagePreview}
        alt="Preview"
        class="ce-preview-img"
        on:error={ce_handleImgError}
      />
      <div class="ce-overlay">
        <span>{lang === 'th' ? 'เปลี่ยนรูปภาพ' : 'Change Image'}</span>
      </div>
    {:else}
      <img src="/image 7.png" alt="No Banner" class="ce-preview-img" style="opacity:0.5;object-fit:contain;" />
      <div class="ce-upload-placeholder">
        <div class="ce-icon-upload">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            ></path>
          </svg>
        </div>
        <span>{lang === 'th' ? 'อัพโหลดแบนเนอร์กิจกรรม' : 'Upload Event Banner'}</span>
      </div>
    {/if}
  </div>

  <!-- Basic Info -->
  <div class="ce-card ce-form-card">
    <div class="ce-card-head">
      <svg class="ce-icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        ></path>
      </svg>
      <span>{lang === 'th' ? 'ข้อมูลพื้นฐาน' : 'Basic Information'}</span>
    </div>

    <div class="ce-input-group">
      <label for="event-title">{t('eventName')} <span class="ce-req">*</span></label>
      <input
        id="event-title"
        type="text"
        bind:value={ce_formData.title}
        placeholder={lang === 'th' ? 'ชื่อกิจกรรมอย่างเป็นทางการ' : 'Official Event Name'}
        class="ce-input"
        class:error={ce_validationErrors.has('title')}
      />
    </div>

    <div class="ce-input-group">
      <label for="event-desc">{t('description')} <span class="ce-req">*</span></label>
      <textarea
        id="event-desc"
        bind:value={ce_formData.description}
        placeholder={lang === 'th' ? 'รายละเอียดกิจกรรม...' : 'Event details...'}
        class="ce-textarea"
        class:error={ce_validationErrors.has('description')}
      ></textarea>
    </div>

    <div class="ce-input-group">
      <label for="event-location">{t('location')} <span class="ce-req">*</span></label>
      <input
        id="event-location"
        type="text"
        bind:value={ce_formData.location}
        placeholder={lang === 'th' ? 'สถานที่จัดกิจกรรม' : 'Location'}
        class="ce-input"
        class:error={ce_validationErrors.has('location')}
      />
    </div>
  </div>

  <!-- Event Type -->
  <div class="ce-card ce-config-card">
    <div class="ce-card-head">
      <svg class="ce-icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
        ></path>
      </svg>
      <span>{t('eventTypeTitle')}</span>
    </div>

    <div class="ce-event-type-control">
      <div class="ce-event-type-buttons">
        <button
          type="button"
          class="ce-event-type-btn"
          class:active={ce_formData.eventType === 'single_day'}
          on:click={() => ce_setEventType('single_day')}
        >
          <div class="ce-event-type-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              ></path>
            </svg>
          </div>
          <div class="ce-event-type-content">
            <span class="ce-event-type-title">{t('singleDay')}</span>
            <span class="ce-event-type-desc">{t('singleDayDesc')}</span>
          </div>
          {#if ce_formData.eventType === 'single_day'}
            <div class="ce-event-type-check">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                ></path>
              </svg>
            </div>
          {/if}
        </button>

        <button
          type="button"
          class="ce-event-type-btn"
          class:active={ce_formData.eventType === 'multi_day'}
          on:click={() => ce_setEventType('multi_day')}
        >
          <div class="ce-event-type-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2zM9 12h.01M15 12h.01M9 16h.01M15 16h.01"
              ></path>
            </svg>
          </div>
          <div class="ce-event-type-content">
            <span class="ce-event-type-title">{t('multiDay')}</span>
            <span class="ce-event-type-desc">{t('multiDayDesc')}</span>
          </div>
          {#if ce_formData.eventType === 'multi_day'}
            <div class="ce-event-type-check">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                ></path>
              </svg>
            </div>
          {/if}
        </button>
      </div>

      {#if ce_formData.eventType === 'multi_day'}
        <div class="ce-checkin-section">
          <span class="ce-checkin-label">{t('maxCheckinsPerUser')}</span>
          <div class="ce-checkin-stepper">
            <button
              type="button"
              class="ce-stepper-btn minus"
              aria-label="Decrease"
              on:click={() => {
                if (ce_formData.maxCheckinsPerUser > 1) {
                  ce_formData.maxCheckinsPerUser--;
                }
              }}
              disabled={ce_formData.maxCheckinsPerUser <= 1}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 12H6"></path>
              </svg>
            </button>
            <div class="ce-stepper-value">
              {ce_formData.maxCheckinsPerUser}
            </div>
            <button
              type="button"
              class="ce-stepper-btn plus"
              aria-label="Increase"
              on:click={() => {
                if (ce_formData.maxCheckinsPerUser < 365) {
                  ce_formData.maxCheckinsPerUser++;
                }
              }}
              disabled={ce_formData.maxCheckinsPerUser >= 365}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v12m6-6H6"></path>
              </svg>
            </button>
            <span class="ce-stepper-unit">{t('checkinTimes')}</span>
          </div>
        </div>
      {/if}
    </div>
  </div>

  <!-- Navigation Buttons -->
  <div class="ce-nav-buttons">
    <button type="button" class="ce-btn-secondary" on:click={handleSaveDraft}>
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
      </svg>
      {lang === 'th' ? 'บันทึกแบบร่าง' : 'Save Draft'}
    </button>
    <button type="button" class="ce-btn-save" on:click={handleNext}>
      {t('next')}
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  </div>
</div>

<style>
  /* Grid Layout */
  .ce-grid-layout {
    display: flex;
    flex-direction: column;
    gap: 24px;
    max-width: 900px;
    margin: 0 auto;
    position: relative;
    z-index: 10;
  }

  /* Card Styles */
  .ce-card {
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 20px;
    padding: 24px;
    position: relative;
    box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.3);
    overflow: visible;
  }

  .ce-card-head {
    font-size: 1.1rem;
    font-weight: 700;
    color: #f1f5f9;
    display: flex;
    align-items: center;
    gap: 10px;
    border-bottom: 1px solid #334155;
    padding-bottom: 15px;
    margin-bottom: 20px;
  }

  .ce-icon-svg {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    color: #10b981;
  }

  /* Image Upload */
  .ce-img-card {
    padding: 0;
    min-height: 280px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    border: 2px dashed #334155;
    background: #0f172a;
    transition: 0.2s;
    overflow: hidden;
  }

  .ce-img-card:hover {
    border-color: #10b981;
    background: #131c31;
  }

  .ce-img-card.has-img {
    border-style: solid;
    border-color: #334155;
  }

  .ce-preview-img {
    width: 100%;
    height: 280px;
    object-fit: cover;
  }

  .ce-upload-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    color: #64748b;
    font-weight: 500;
  }

  .ce-icon-upload {
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(16, 185, 129, 0.1);
    border-radius: 50%;
    margin-bottom: 5px;
  }

  .ce-icon-upload svg {
    width: 32px;
    height: 32px;
    color: #10b981;
  }

  .ce-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 600;
    opacity: 0;
    transition: 0.2s;
    backdrop-filter: blur(4px);
  }

  .ce-img-card:hover .ce-overlay {
    opacity: 1;
  }

  /* Input Styles */
  .ce-input-group {
    margin-bottom: 1.2rem;
  }

  .ce-input-group:last-child {
    margin-bottom: 0;
  }

  .ce-input-group label {
    display: block;
    color: #94a3b8;
    font-size: 0.85rem;
    font-weight: 600;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .ce-req {
    color: #ef4444;
    margin-left: 4px;
  }

  .ce-input,
  .ce-textarea {
    width: 100%;
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: 12px;
    padding: 0 14px;
    color: white;
    height: 48px;
    font-size: 0.95rem;
    transition: all 0.2s;
  }

  .ce-textarea {
    height: auto;
    min-height: 140px;
    padding: 14px;
    resize: vertical;
    line-height: 1.6;
  }

  .ce-input:focus,
  .ce-textarea:focus {
    border-color: #10b981;
    outline: none;
    box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
  }

  .ce-input.error,
  .ce-textarea.error {
    border-color: #ef4444 !important;
    animation: ceShake 0.4s;
  }

  @keyframes ceShake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
  }

  /* Event Type Styles */
  .ce-event-type-control {
    padding: 0;
  }

  .ce-event-type-buttons {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .ce-event-type-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 20px 16px;
    background: #0f172a;
    border: 2px solid #334155;
    border-radius: 16px;
    cursor: pointer;
    transition: all 0.25s ease;
    position: relative;
    text-align: center;
  }

  .ce-event-type-btn:hover {
    border-color: #64748b;
    background: #162032;
    transform: translateY(-2px);
  }

  .ce-event-type-btn.active {
    border-color: #10b981;
    background: rgba(16, 185, 129, 0.08);
    box-shadow: 0 0 20px rgba(16, 185, 129, 0.15);
  }

  .ce-event-type-icon {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(100, 116, 139, 0.15);
    border-radius: 12px;
    transition: all 0.25s ease;
  }

  .ce-event-type-btn.active .ce-event-type-icon {
    background: rgba(16, 185, 129, 0.15);
  }

  .ce-event-type-icon svg {
    width: 24px;
    height: 24px;
    color: #94a3b8;
    transition: all 0.25s ease;
  }

  .ce-event-type-btn.active .ce-event-type-icon svg {
    color: #10b981;
  }

  .ce-event-type-content {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .ce-event-type-title {
    font-size: 1rem;
    font-weight: 700;
    color: #f1f5f9;
  }

  .ce-event-type-btn.active .ce-event-type-title {
    color: #10b981;
  }

  .ce-event-type-desc {
    font-size: 0.75rem;
    color: #64748b;
    line-height: 1.4;
  }

  .ce-event-type-check {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 24px;
    height: 24px;
    background: #10b981;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: scaleIn 0.2s ease;
  }

  .ce-event-type-check svg {
    width: 14px;
    height: 14px;
    color: white;
  }

  @keyframes scaleIn {
    from {
      transform: scale(0);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }

  /* Checkin Section */
  .ce-checkin-section {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 16px;
    padding: 16px 20px;
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: 12px;
  }

  .ce-checkin-label {
    font-size: 0.95rem;
    font-weight: 500;
    color: #e2e8f0;
  }

  .ce-checkin-stepper {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .ce-stepper-btn {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 10px;
    color: #94a3b8;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .ce-stepper-btn svg {
    width: 18px;
    height: 18px;
  }

  .ce-stepper-btn.minus:hover:not(:disabled) {
    background: rgba(239, 68, 68, 0.1);
    border-color: rgba(239, 68, 68, 0.4);
    color: #f87171;
  }

  .ce-stepper-btn.plus:hover:not(:disabled) {
    background: rgba(16, 185, 129, 0.1);
    border-color: rgba(16, 185, 129, 0.4);
    color: #34d399;
  }

  .ce-stepper-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .ce-stepper-value {
    min-width: 48px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1rem;
    font-weight: 700;
    color: #10b981;
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.25);
    border-radius: 10px;
  }

  .ce-stepper-unit {
    color: #64748b;
    font-size: 0.85rem;
    margin-left: 4px;
  }

  /* Navigation Buttons */
  .ce-nav-buttons {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }

  .ce-btn-secondary {
    background: transparent;
    border: 1px solid #475569;
    color: #94a3b8;
    padding: 0.7rem 1.5rem;
    border-radius: 12px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .ce-btn-secondary svg {
    width: 18px;
    height: 18px;
  }

  .ce-btn-secondary:hover {
    border-color: #e2e8f0;
    color: #e2e8f0;
  }

  .ce-btn-save {
    background: linear-gradient(135deg, #10b981, #059669);
    border: none;
    color: white;
    padding: 0.7rem 2rem;
    border-radius: 12px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .ce-btn-save svg {
    width: 18px;
    height: 18px;
  }

  .ce-btn-save:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
  }

  /* Responsive */
  @media (max-width: 640px) {
    .ce-event-type-buttons {
      grid-template-columns: 1fr;
    }

    .ce-event-type-btn {
      flex-direction: row;
      text-align: left;
      padding: 16px;
    }

    .ce-event-type-icon {
      width: 40px;
      height: 40px;
    }

    .ce-event-type-content {
      flex: 1;
    }

    .ce-checkin-section {
      flex-direction: column;
      align-items: flex-start;
      gap: 14px;
    }

    .ce-nav-buttons {
      flex-direction: column;
    }

    .ce-btn-secondary,
    .ce-btn-save {
      width: 100%;
      justify-content: center;
    }
  }
</style>