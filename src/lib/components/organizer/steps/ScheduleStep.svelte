<script lang="ts">
  import { eventFormData, validationErrors } from '$lib/stores/eventFormStore';
  
  export let currentLang: 'th' | 'en' = 'th';

  // Generate time options (every 30 minutes)
  const timeOptions: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hour = h.toString().padStart(2, '0');
      const minute = m.toString().padStart(2, '0');
      timeOptions.push(`${hour}:${minute}`);
    }
  }

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  // Check if date range is valid
  $: isDateRangeValid = !$eventFormData.startDate || !$eventFormData.endDate || 
    $eventFormData.startDate <= $eventFormData.endDate;

  // Get dates between start and end for holiday selection
  $: dateRange = getDateRange($eventFormData.startDate, $eventFormData.endDate);

  function getDateRange(start: string, end: string): Date[] {
    if (!start || !end) return [];
    
    const dates: Date[] = [];
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    // Limit to max 365 days
    const maxDays = 365;
    let count = 0;
    
    for (let d = new Date(startDate); d <= endDate && count < maxDays; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d));
      count++;
    }
    
    return dates;
  }

  function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  function isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6;
  }

  function isDateExcluded(date: Date): boolean {
    const dateStr = formatDate(date);
    if ($eventFormData.holidayType === 'weekends' && isWeekend(date)) {
      return true;
    }
    if ($eventFormData.holidayType === 'specific' && $eventFormData.specificDates.includes(dateStr)) {
      return true;
    }
    return false;
  }

  function toggleSpecificDate(dateStr: string) {
    eventFormData.update(d => {
      const exists = d.specificDates.includes(dateStr);
      return {
        ...d,
        specificDates: exists 
          ? d.specificDates.filter(date => date !== dateStr)
          : [...d.specificDates, dateStr]
      };
    });
  }

  function setHolidayType(type: 'none' | 'weekends' | 'specific') {
    eventFormData.update(d => ({
      ...d,
      holidayType: type,
      excludeWeekends: type === 'weekends',
      specificDates: type === 'specific' ? d.specificDates : []
    }));
  }

  $: getError = (field: string) => {
    return $validationErrors.find(e => e.field === field);
  };

  // Count excluded days
  $: excludedDaysCount = dateRange.filter(isDateExcluded).length;
  $: activeDaysCount = dateRange.length - excludedDaysCount;
</script>

<div class="schedule-step">
  <!-- Date Section -->
  <div class="section">
    <div class="section-header">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
      </svg>
      <h3>{currentLang === 'th' ? 'วันที่จัดกิจกรรม' : 'Event Dates'}</h3>
    </div>

    <div class="date-inputs">
      <div class="form-group">
        <label for="start-date">
          {currentLang === 'th' ? 'วันเริ่มต้น' : 'Start Date'}
          <span class="required">*</span>
        </label>
        <input
          id="start-date"
          type="date"
          bind:value={$eventFormData.startDate}
          min={today}
          class:error={getError('startDate')}
        />
        {#if getError('startDate')}
          <p class="error-message">{getError('startDate')?.message}</p>
        {/if}
      </div>

      <div class="date-arrow">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
        </svg>
      </div>

      <div class="form-group">
        <label for="end-date">
          {currentLang === 'th' ? 'วันสิ้นสุด' : 'End Date'}
          <span class="required">*</span>
        </label>
        <input
          id="end-date"
          type="date"
          bind:value={$eventFormData.endDate}
          min={$eventFormData.startDate || today}
          class:error={getError('endDate') || !isDateRangeValid}
        />
        {#if getError('endDate')}
          <p class="error-message">{getError('endDate')?.message}</p>
        {:else if !isDateRangeValid}
          <p class="error-message">
            {currentLang === 'th' ? 'วันสิ้นสุดต้องหลังวันเริ่มต้น' : 'End date must be after start date'}
          </p>
        {/if}
      </div>
    </div>

    {#if $eventFormData.startDate && $eventFormData.endDate && isDateRangeValid}
      <div class="date-summary">
        <div class="summary-item">
          <span class="summary-label">{currentLang === 'th' ? 'ระยะเวลา' : 'Duration'}</span>
          <span class="summary-value">{dateRange.length} {currentLang === 'th' ? 'วัน' : 'days'}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">{currentLang === 'th' ? 'วันที่เปิดใช้งาน' : 'Active days'}</span>
          <span class="summary-value success">{activeDaysCount} {currentLang === 'th' ? 'วัน' : 'days'}</span>
        </div>
        {#if excludedDaysCount > 0}
          <div class="summary-item">
            <span class="summary-label">{currentLang === 'th' ? 'วันหยุด' : 'Holidays'}</span>
            <span class="summary-value muted">{excludedDaysCount} {currentLang === 'th' ? 'วัน' : 'days'}</span>
          </div>
        {/if}
      </div>
    {/if}
  </div>

  <!-- Time Section -->
  <div class="section">
    <div class="section-header">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <h3>{currentLang === 'th' ? 'เวลาเช็คอิน/เช็คเอาท์' : 'Check-in/Check-out Time'}</h3>
    </div>

    <div class="time-inputs">
      <div class="form-group">
        <label for="start-time">
          {currentLang === 'th' ? 'เวลาเริ่ม' : 'Start Time'}
          <span class="required">*</span>
        </label>
        <select
          id="start-time"
          bind:value={$eventFormData.startTime}
          class:error={getError('startTime')}
        >
          <option value="">{currentLang === 'th' ? 'เลือกเวลา' : 'Select time'}</option>
          {#each timeOptions as time}
            <option value={time}>{time}</option>
          {/each}
        </select>
        {#if getError('startTime')}
          <p class="error-message">{getError('startTime')?.message}</p>
        {/if}
      </div>

      <div class="time-arrow">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
        </svg>
      </div>

      <div class="form-group">
        <label for="end-time">
          {currentLang === 'th' ? 'เวลาสิ้นสุด' : 'End Time'}
          <span class="required">*</span>
        </label>
        <select
          id="end-time"
          bind:value={$eventFormData.endTime}
          class:error={getError('endTime')}
        >
          <option value="">{currentLang === 'th' ? 'เลือกเวลา' : 'Select time'}</option>
          {#each timeOptions as time}
            <option value={time}>{time}</option>
          {/each}
        </select>
        {#if getError('endTime')}
          <p class="error-message">{getError('endTime')?.message}</p>
        {/if}
      </div>
    </div>
  </div>

  <!-- Holiday Settings -->
  <div class="section">
    <div class="section-header">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
          d="M6 18L18 6M6 6l12 12"/>
      </svg>
      <h3>{currentLang === 'th' ? 'วันหยุด' : 'Holidays'}</h3>
    </div>

    <div class="holiday-options">
      <button
        type="button"
        class="holiday-option"
        class:active={$eventFormData.holidayType === 'none'}
        on:click={() => setHolidayType('none')}
      >
        <div class="option-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        <div class="option-content">
          <h4>{currentLang === 'th' ? 'ไม่มีวันหยุด' : 'No Holidays'}</h4>
          <p>{currentLang === 'th' ? 'เปิดทุกวันตามกำหนด' : 'Open every day as scheduled'}</p>
        </div>
      </button>

      <button
        type="button"
        class="holiday-option"
        class:active={$eventFormData.holidayType === 'weekends'}
        on:click={() => setHolidayType('weekends')}
      >
        <div class="option-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
        </div>
        <div class="option-content">
          <h4>{currentLang === 'th' ? 'ยกเว้นวันเสาร์-อาทิตย์' : 'Exclude Weekends'}</h4>
          <p>{currentLang === 'th' ? 'ปิดวันเสาร์และอาทิตย์' : 'Close on Saturday and Sunday'}</p>
        </div>
      </button>

      <button
        type="button"
        class="holiday-option"
        class:active={$eventFormData.holidayType === 'specific'}
        on:click={() => setHolidayType('specific')}
      >
        <div class="option-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
          </svg>
        </div>
        <div class="option-content">
          <h4>{currentLang === 'th' ? 'เลือกวันที่เฉพาะ' : 'Specific Dates'}</h4>
          <p>{currentLang === 'th' ? 'เลือกวันหยุดด้วยตัวเอง' : 'Choose your own holiday dates'}</p>
        </div>
      </button>
    </div>

    <!-- Calendar for specific dates -->
    {#if $eventFormData.holidayType === 'specific' && dateRange.length > 0}
      <div class="calendar-container">
        <div class="calendar-header">
          <span>{currentLang === 'th' ? 'คลิกเพื่อเลือกวันหยุด' : 'Click to select holidays'}</span>
          <span class="selected-count">
            {$eventFormData.specificDates.length} {currentLang === 'th' ? 'วันที่เลือก' : 'selected'}
          </span>
        </div>
        <div class="calendar-grid">
          {#each dateRange as date}
            {@const dateStr = formatDate(date)}
            {@const isSelected = $eventFormData.specificDates.includes(dateStr)}
            <button
              type="button"
              class="calendar-day"
              class:selected={isSelected}
              class:weekend={isWeekend(date)}
              on:click={() => toggleSpecificDate(dateStr)}
            >
              <span class="day-number">{date.getDate()}</span>
              <span class="day-name">
                {date.toLocaleDateString(currentLang === 'th' ? 'th-TH' : 'en-US', { weekday: 'short' })}
              </span>
            </button>
          {/each}
        </div>
      </div>
    {/if}
  </div>

  <!-- Capacity & Distance -->
  <div class="section">
    <div class="section-header">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
      </svg>
      <h3>{currentLang === 'th' ? 'จำนวนผู้เข้าร่วมและระยะทาง' : 'Capacity & Distance'}</h3>
    </div>

    <div class="capacity-inputs">
      <div class="form-group">
        <label for="total-slots">
          {currentLang === 'th' ? 'จำนวนที่รับ (คน)' : 'Total Slots'}
          <span class="required">*</span>
        </label>
        <input
          id="total-slots"
          type="number"
          min="1"
          max="100000"
          bind:value={$eventFormData.totalSlots}
          placeholder="10000"
        />
      </div>

      <div class="form-group">
        <label for="distance">
          {currentLang === 'th' ? 'ระยะทาง (กม.)' : 'Distance (km)'}
        </label>
        <input
          id="distance"
          type="number"
          min="0"
          step="0.1"
          bind:value={$eventFormData.distanceKm}
          placeholder={currentLang === 'th' ? 'ไม่จำกัด' : 'No limit'}
        />
      </div>
    </div>
  </div>
</div>

<style>
  .schedule-step {
    display: flex;
    flex-direction: column;
    gap: 2.5rem;
  }

  .section {
    background: rgba(15, 23, 42, 0.4);
    border: 1px solid rgba(100, 116, 139, 0.2);
    border-radius: 16px;
    padding: 1.5rem;
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }

  .section-header svg {
    width: 22px;
    height: 22px;
    color: #10b981;
  }

  .section-header h3 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: #f8fafc;
  }

  /* Date & Time Inputs */
  .date-inputs,
  .time-inputs {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
  }

  .date-arrow,
  .time-arrow {
    display: flex;
    align-items: center;
    padding-top: 2rem;
    color: #64748b;
  }

  .date-arrow svg,
  .time-arrow svg {
    width: 24px;
    height: 24px;
  }

  .form-group {
    flex: 1;
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

  input[type="date"],
  input[type="number"],
  select {
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
  select:focus {
    outline: none;
    border-color: #10b981;
    background: rgba(15, 23, 42, 0.8);
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
  }

  input.error,
  select.error {
    border-color: #ef4444;
  }

  .error-message {
    margin: 0;
    font-size: 0.85rem;
    color: #f87171;
  }

  /* Date Summary */
  .date-summary {
    display: flex;
    gap: 2rem;
    margin-top: 1.5rem;
    padding: 1rem;
    background: rgba(16, 185, 129, 0.05);
    border: 1px solid rgba(16, 185, 129, 0.2);
    border-radius: 12px;
  }

  .summary-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .summary-label {
    font-size: 0.8rem;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .summary-value {
    font-size: 1.1rem;
    font-weight: 600;
    color: #f8fafc;
  }

  .summary-value.success {
    color: #10b981;
  }

  .summary-value.muted {
    color: #94a3b8;
  }

  /* Holiday Options */
  .holiday-options {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }

  .holiday-option {
    display: flex;
    gap: 1rem;
    padding: 1.25rem;
    background: rgba(15, 23, 42, 0.6);
    border: 2px solid rgba(100, 116, 139, 0.3);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
  }

  .holiday-option:hover {
    border-color: rgba(16, 185, 129, 0.5);
  }

  .holiday-option.active {
    border-color: #10b981;
    background: rgba(16, 185, 129, 0.08);
  }

  .option-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: rgba(100, 116, 139, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .holiday-option.active .option-icon {
    background: rgba(16, 185, 129, 0.2);
    color: #10b981;
  }

  .option-icon svg {
    width: 20px;
    height: 20px;
  }

  .option-content h4 {
    margin: 0 0 0.25rem;
    font-size: 0.9rem;
    font-weight: 600;
    color: #f8fafc;
  }

  .option-content p {
    margin: 0;
    font-size: 0.8rem;
    color: #94a3b8;
    line-height: 1.4;
  }

  /* Calendar */
  .calendar-container {
    margin-top: 1.5rem;
    padding: 1rem;
    background: rgba(15, 23, 42, 0.4);
    border-radius: 12px;
  }

  .calendar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    font-size: 0.9rem;
    color: #cbd5e1;
  }

  .selected-count {
    color: #10b981;
    font-weight: 600;
  }

  .calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 0.5rem;
    max-height: 300px;
    overflow-y: auto;
  }

  .calendar-day {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.75rem 0.5rem;
    background: rgba(100, 116, 139, 0.1);
    border: 1px solid transparent;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .calendar-day:hover {
    background: rgba(100, 116, 139, 0.2);
  }

  .calendar-day.weekend {
    background: rgba(239, 68, 68, 0.05);
  }

  .calendar-day.selected {
    background: rgba(239, 68, 68, 0.15);
    border-color: rgba(239, 68, 68, 0.5);
  }

  .day-number {
    font-size: 1rem;
    font-weight: 600;
    color: #f8fafc;
  }

  .day-name {
    font-size: 0.7rem;
    color: #94a3b8;
    text-transform: uppercase;
  }

  /* Capacity Inputs */
  .capacity-inputs {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }

  @media (max-width: 768px) {
    .date-inputs,
    .time-inputs {
      flex-direction: column;
    }

    .date-arrow,
    .time-arrow {
      display: none;
    }

    .holiday-options {
      grid-template-columns: 1fr;
    }

    .calendar-grid {
      grid-template-columns: repeat(5, 1fr);
    }

    .capacity-inputs {
      grid-template-columns: 1fr;
    }
  }
</style>
