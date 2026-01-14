<script lang="ts">
  import { eventFormData, validationErrors } from '$lib/stores/eventFormStore';
  
  export let currentLang: 'th' | 'en' = 'th';

  let fileInput: HTMLInputElement;
  let isDragging = false;

  const handleImageSelect = (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      processImage(file);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    isDragging = false;
    
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processImage(file);
    }
  };

  const processImage = (file: File) => {
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert(currentLang === 'th' ? 'ไฟล์ใหญ่เกิน 5MB' : 'File size exceeds 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      eventFormData.update(data => ({
        ...data,
        imageFile: file,
        imagePreview: e.target?.result as string
      }));
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    eventFormData.update(data => ({
      ...data,
      imageFile: null,
      imagePreview: null
    }));
  };

  const triggerFileInput = () => {
    fileInput?.click();
  };

  $: getError = (field: string) => {
    return $validationErrors.find(e => e.field === field);
  };
</script>

<div class="basic-info-step">
  <!-- Image Upload Section -->
  <div class="image-upload-section">
    <div class="section-label">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
      </svg>
      {currentLang === 'th' ? 'รูปภาพกิจกรรม' : 'Event Image'}
    </div>

    <input
      type="file"
      accept="image/*"
      bind:this={fileInput}
      on:change={handleImageSelect}
      hidden
    />

    <div
      class="image-dropzone"
      class:dragging={isDragging}
      class:has-image={$eventFormData.imagePreview}
      on:click={triggerFileInput}
      on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); triggerFileInput(); } }}
      on:dragover|preventDefault={() => isDragging = true}
      on:dragleave={() => isDragging = false}
      on:drop|preventDefault={handleDrop}
      role="button"
      tabindex="0"
    >
      {#if $eventFormData.imagePreview}
        <div class="image-preview">
          <img src={$eventFormData.imagePreview} alt="Preview" />
          <div class="image-overlay">
            <button
              type="button"
              class="btn-remove"
              on:click|stopPropagation={removeImage}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {currentLang === 'th' ? 'ลบรูป' : 'Remove'}
            </button>
            <button
              type="button"
              class="btn-change"
              on:click|stopPropagation={triggerFileInput}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              {currentLang === 'th' ? 'เปลี่ยนรูป' : 'Change'}
            </button>
          </div>
        </div>
      {:else}
        <div class="dropzone-placeholder">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p class="dropzone-text">
            {currentLang === 'th' ? 'ลากรูปมาวางหรือคลิกเพื่ออัพโหลด' : 'Drag image here or click to upload'}
          </p>
          <p class="dropzone-hint">
            {currentLang === 'th' ? 'แนะนำ 1200x630px • ไม่เกิน 5MB' : 'Recommended 1200x630px • Max 5MB'}
          </p>
        </div>
      {/if}
    </div>
  </div>

  <!-- Event Type Selection -->
  <div class="form-group">
    <div class="section-label">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
      </svg>
      {currentLang === 'th' ? 'ประเภทกิจกรรม' : 'Event Type'}
    </div>

    <div class="event-type-grid">
      <button
        type="button"
        class="event-type-card"
        class:active={$eventFormData.eventType === 'single_day'}
        on:click={() => eventFormData.update(d => ({ ...d, eventType: 'single_day', maxCheckinsPerUser: 1 }))}
      >
        <div class="type-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div class="type-content">
          <h4>{currentLang === 'th' ? 'วันเดียว' : 'Single Day'}</h4>
          <p>{currentLang === 'th' ? 'กิจกรรมจัดขึ้นในวันเดียว เช็คอินได้ 1 ครั้ง' : 'One-day event with single check-in'}</p>
        </div>
        {#if $eventFormData.eventType === 'single_day'}
          <div class="check-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        {/if}
      </button>

      <button
        type="button"
        class="event-type-card"
        class:active={$eventFormData.eventType === 'multi_day'}
        on:click={() => eventFormData.update(d => ({ ...d, eventType: 'multi_day' }))}
      >
        <div class="type-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2zM9 12h.01M15 12h.01M9 16h.01M15 16h.01" />
          </svg>
        </div>
        <div class="type-content">
          <h4>{currentLang === 'th' ? 'หลายวัน' : 'Multi Day'}</h4>
          <p>{currentLang === 'th' ? 'กิจกรรมหลายวัน สามารถเช็คอินได้หลายครั้ง' : 'Multi-day event with multiple check-ins'}</p>
        </div>
        {#if $eventFormData.eventType === 'multi_day'}
          <div class="check-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        {/if}
      </button>
    </div>

    {#if $eventFormData.eventType === 'multi_day'}
      <div class="checkin-limit-control">
        <label for="max-checkins">
          {currentLang === 'th' ? 'จำนวนเช็คอินสูงสุดต่อคน' : 'Max check-ins per person'}
        </label>
        <div class="stepper">
          <button
            type="button"
            on:click={() => {
              if ($eventFormData.maxCheckinsPerUser > 1) {
                eventFormData.update(d => ({ ...d, maxCheckinsPerUser: d.maxCheckinsPerUser - 1 }));
              }
            }}
            disabled={$eventFormData.maxCheckinsPerUser <= 1}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 12H6" />
            </svg>
          </button>
          <input
            id="max-checkins"
            type="number"
            min="1"
            max="365"
            bind:value={$eventFormData.maxCheckinsPerUser}
          />
          <button
            type="button"
            on:click={() => {
              if ($eventFormData.maxCheckinsPerUser < 365) {
                eventFormData.update(d => ({ ...d, maxCheckinsPerUser: d.maxCheckinsPerUser + 1 }));
              }
            }}
            disabled={$eventFormData.maxCheckinsPerUser >= 365}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v12m6-6H6" />
            </svg>
          </button>
        </div>
      </div>
    {/if}
  </div>

  <!-- Event Name -->
  <div class="form-group">
    <label for="event-title">
      {currentLang === 'th' ? 'ชื่อกิจกรรม' : 'Event Name'}
      <span class="required">*</span>
    </label>
    <input
      id="event-title"
      type="text"
      bind:value={$eventFormData.title}
      placeholder={currentLang === 'th' ? 'ชื่อกิจกรรมอย่างเป็นทางการ' : 'Official event name'}
      class:error={getError('title')}
      maxlength="200"
    />
    {#if getError('title')}
      <p class="error-message">{getError('title')?.message}</p>
    {/if}
    <p class="input-hint">
      {$eventFormData.title.length}/200 {currentLang === 'th' ? 'ตัวอักษร' : 'characters'}
    </p>
  </div>

  <!-- Description -->
  <div class="form-group">
    <label for="event-description">
      {currentLang === 'th' ? 'รายละเอียด' : 'Description'}
      <span class="required">*</span>
    </label>
    <textarea
      id="event-description"
      bind:value={$eventFormData.description}
      placeholder={currentLang === 'th' ? 'อธิบายรายละเอียดของกิจกรรม...' : 'Describe your event...'}
      class:error={getError('description')}
      rows="5"
      maxlength="1000"
    ></textarea>
    {#if getError('description')}
      <p class="error-message">{getError('description')?.message}</p>
    {/if}
    <p class="input-hint">
      {$eventFormData.description.length}/1000 {currentLang === 'th' ? 'ตัวอักษร' : 'characters'}
    </p>
  </div>

  <!-- Location -->
  <div class="form-group">
    <label for="event-location">
      {currentLang === 'th' ? 'สถานที่' : 'Location'}
      <span class="required">*</span>
    </label>
    <input
      id="event-location"
      type="text"
      bind:value={$eventFormData.location}
      placeholder={currentLang === 'th' ? 'สถานที่จัดกิจกรรม' : 'Event location'}
      class:error={getError('location')}
      maxlength="200"
    />
    {#if getError('location')}
      <p class="error-message">{getError('location')?.message}</p>
    {/if}
  </div>
</div>

<style>
  .basic-info-step {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .section-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1rem;
    font-weight: 600;
    color: #f8fafc;
    margin-bottom: 1rem;
  }

  .section-label svg {
    width: 20px;
    height: 20px;
    color: #10b981;
  }

  /* Image Upload */
  .image-dropzone {
    width: 100%;
    height: 280px;
    border: 2px dashed rgba(100, 116, 139, 0.3);
    border-radius: 16px;
    background: rgba(15, 23, 42, 0.5);
    cursor: pointer;
    transition: all 0.3s ease;
    overflow: hidden;
  }

  .image-dropzone.dragging {
    border-color: #10b981;
    background: rgba(16, 185, 129, 0.05);
  }

  .image-dropzone.has-image {
    border-style: solid;
    border-color: rgba(16, 185, 129, 0.3);
  }

  .dropzone-placeholder {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 2rem;
  }

  .dropzone-placeholder svg {
    width: 64px;
    height: 64px;
    color: #64748b;
  }

  .dropzone-text {
    margin: 0;
    font-size: 1rem;
    font-weight: 500;
    color: #cbd5e1;
  }

  .dropzone-hint {
    margin: 0;
    font-size: 0.85rem;
    color: #64748b;
  }

  .image-preview {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .image-preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .image-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .image-preview:hover .image-overlay {
    opacity: 1;
  }

  .btn-remove,
  .btn-change {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.25rem;
    border-radius: 10px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
  }

  .btn-remove {
    background: rgba(239, 68, 68, 0.9);
    color: white;
  }

  .btn-change {
    background: rgba(16, 185, 129, 0.9);
    color: white;
  }

  .btn-remove svg,
  .btn-change svg {
    width: 18px;
    height: 18px;
  }

  /* Event Type Cards */
  .event-type-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .event-type-card {
    position: relative;
    display: flex;
    gap: 1rem;
    padding: 1.5rem;
    background: rgba(15, 23, 42, 0.6);
    border: 2px solid rgba(100, 116, 139, 0.3);
    border-radius: 16px;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .event-type-card:hover {
    border-color: rgba(16, 185, 129, 0.5);
    background: rgba(15, 23, 42, 0.8);
  }

  .event-type-card.active {
    border-color: #10b981;
    background: rgba(16, 185, 129, 0.08);
  }

  .type-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: rgba(100, 116, 139, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all 0.3s ease;
  }

  .event-type-card.active .type-icon {
    background: rgba(16, 185, 129, 0.2);
    color: #10b981;
  }

  .type-icon svg {
    width: 24px;
    height: 24px;
  }

  .type-content h4 {
    margin: 0 0 0.5rem;
    font-size: 1rem;
    font-weight: 600;
    color: #f8fafc;
  }

  .type-content p {
    margin: 0;
    font-size: 0.85rem;
    color: #94a3b8;
    line-height: 1.4;
  }

  .check-badge {
    position: absolute;
    top: 1rem;
    right: 1rem;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #10b981;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .check-badge svg {
    width: 16px;
    height: 16px;
  }

  /* Stepper */
  .checkin-limit-control {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: rgba(16, 185, 129, 0.05);
    border: 1px solid rgba(16, 185, 129, 0.2);
    border-radius: 12px;
  }

  .checkin-limit-control label {
    font-size: 0.9rem;
    color: #cbd5e1;
    margin: 0;
  }

  .stepper {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .stepper button {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.3);
    color: #10b981;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .stepper button:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .stepper button:hover:not(:disabled) {
    background: rgba(16, 185, 129, 0.2);
  }

  .stepper button svg {
    width: 16px;
    height: 16px;
  }

  .stepper input {
    width: 60px;
    text-align: center;
    padding: 0.5rem;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(100, 116, 139, 0.3);
    border-radius: 8px;
    color: #f8fafc;
    font-weight: 600;
  }

  /* Form Groups */
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-group label {
    font-size: 0.9rem;
    font-weight: 500;
    color: #cbd5e1;
  }

  .required {
    color: #ef4444;
  }

  input[type="text"],
  input[type="number"],
  textarea {
    width: 100%;
    padding: 0.875rem 1rem;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(100, 116, 139, 0.3);
    border-radius: 12px;
    color: #f8fafc;
    font-size: 0.95rem;
    transition: all 0.2s ease;
  }

  input:focus,
  textarea:focus {
    outline: none;
    border-color: #10b981;
    background: rgba(15, 23, 42, 0.8);
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
  }

  input.error,
  textarea.error {
    border-color: #ef4444;
  }

  textarea {
    resize: vertical;
    font-family: inherit;
  }

  .error-message {
    margin: 0;
    font-size: 0.85rem;
    color: #f87171;
  }

  .input-hint {
    margin: 0;
    font-size: 0.8rem;
    color: #64748b;
  }

  @media (max-width: 768px) {
    .event-type-grid {
      grid-template-columns: 1fr;
    }

    .checkin-limit-control {
      flex-direction: column;
      gap: 1rem;
    }
  }
</style>
