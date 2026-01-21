<script lang="ts">
  import { goto } from '$app/navigation';
  import { eventForm } from '../../_lib/stores/eventForm';
  import { appState } from '../../_lib/stores/appState';
  import { t } from '../../_lib/i18n';
  import { onMount } from 'svelte';
  
  // [สำคัญ] ดึงข้อมูลวันหยุด
  import holidaysData from '$lib/data/holidays.json'; 

  $: lang = $appState.currentLang;
  
  let ce_activeDropdown: string | null = null;
  
  let ce_formData = {
    sDay: '',
    sMonth: '',
    sYear: '',
    eDay: '',
    eMonth: '',
    eYear: '',
    startTime: '',
    endTime: '',
    totalSlots: null as number | null,
    distanceKm: null as number | null,
    holidays: [] as string[],
    holidayMode: null as 'weekends' | 'specific' | 'none' | 'public' | 'weekends_public' | null
  };
  
  let ce_validationErrors = new Set<string>();
  let isDateRangeValid = false;
  
  const ce_days = Array.from({ length: 31 }, (_, i) => i + 1);
  const ce_months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
  const ce_displayMonths = lang === 'th' 
    ? ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // [ปรับแก้] เริ่มต้นปีที่ 2026 เพื่อให้ตรงกับไฟล์ holidays.json ของคุณ
  // ถ้าต้องการปีปัจจุบันให้แก้เป็น new Date().getFullYear()
  const startYear = 2026; 
  const ce_years = Array.from({ length: 10 }, (_, i) => startYear + i);
  
  const ce_timeList = Array.from({ length: 48 }, (_, i) => {
    const h = Math.floor(i / 2);
    const m = i % 2 === 0 ? '00' : '30';
    return `${h.toString().padStart(2, '0')}:${m}`;
  });

  onMount(() => {
    // ตรวจสอบว่าโหลดไฟล์ JSON ได้หรือไม่
    console.log("Loaded Holidays Data:", holidaysData.length, "entries");

    const storeData = $eventForm as any;
    if (storeData.sDay) {
      ce_formData = { 
        ...ce_formData, 
        ...storeData,
        // ป้องกัน holidays หาย
        holidays: Array.isArray(storeData.holidays) ? storeData.holidays : []
      };
    }
    validateDateRangeOnly();
  });

  // แปลงวันที่เป็น YYYY-MM-DD เพื่อเทียบกับ JSON
  function formatDateKey(day: string | number, month: string, year: string | number): string {
    const d = String(day).padStart(2, '0');
    const m = String(month).padStart(2, '0');
    const y = String(year);
    return `${y}-${m}-${d}`;
  }

  // ฟังก์ชันคำนวณวันหยุด
  function calculatePublicHolidays() {
    if (!isDateRangeValid) return [];
    
    const startStr = formatDateKey(ce_formData.sDay, ce_formData.sMonth, ce_formData.sYear);
    const endStr = formatDateKey(ce_formData.eDay, ce_formData.eMonth, ce_formData.eYear);

    console.log(`Searching for holidays between ${startStr} and ${endStr}`);

    // กรองวันหยุดในช่วงเวลา
    const found = holidaysData
        .filter((h: any) => h.date >= startStr && h.date <= endStr)
        .map((h: any) => h.date);
    
    console.log("Found holidays:", found);
    return found;
  }

  function validateDateRangeOnly() {
    if (ce_formData.sDay && ce_formData.sMonth && ce_formData.sYear && 
        ce_formData.eDay && ce_formData.eMonth && ce_formData.eYear) {
      const startStr = formatDateKey(ce_formData.sDay, ce_formData.sMonth, ce_formData.sYear);
      const endStr = formatDateKey(ce_formData.eDay, ce_formData.eMonth, ce_formData.eYear);
      isDateRangeValid = startStr <= endStr;
    } else {
      isDateRangeValid = false;
    }
  }

  function checkDateRangeAndRefreshHolidays() {
    validateDateRangeOnly();

    // ถ้าวันที่มีการเปลี่ยนแปลง และอยู่ในโหมด Auto ให้คำนวณใหม่ทันที
    if (isDateRangeValid && (ce_formData.holidayMode === 'public' || ce_formData.holidayMode === 'weekends_public')) {
        const newHolidays = calculatePublicHolidays();
        ce_formData.holidays = newHolidays;
        ce_formData = { ...ce_formData }; // Force Update UI
    }
  }
  
  function ce_toggleDD(name: string) {
    ce_activeDropdown = ce_activeDropdown === name ? null : name;
  }
  
  function ce_selectOpt(field: string, value: any) {
    (ce_formData as any)[field] = String(value);
    ce_activeDropdown = null;
    checkDateRangeAndRefreshHolidays(); // สำคัญ: คำนวณวันหยุดใหม่เมื่อเปลี่ยนวันที่
  }
  
  function ce_selectCombo(field: string, value: any) {
    (ce_formData as any)[field] = value;
    ce_activeDropdown = null;
  }
  
  // Logic การเลือกโหมด
  function ce_setHolidayMode(mode: 'weekends' | 'specific' | 'none' | 'public' | 'weekends_public' | null) {
    if (ce_formData.holidayMode === mode) {
      ce_formData.holidayMode = 'none';
      ce_formData.holidays = [];
    } else {
      ce_formData.holidayMode = mode;
      
      if (mode === 'public' || mode === 'weekends_public') {
         // ดึงข้อมูลวันหยุด
         const found = calculatePublicHolidays();
         ce_formData.holidays = found;
      } else {
         // โหมดอื่นๆ เคลียร์วันหยุด
         ce_formData.holidays = [];
      }
    }
    ce_formData = { ...ce_formData };
  }
  
  function ce_toggleHoliday(date: string) {
    const idx = ce_formData.holidays.indexOf(date);
    if (idx >= 0) {
      ce_formData.holidays.splice(idx, 1);
    } else {
      ce_formData.holidays.push(date);
    }
    ce_formData.holidays = [...ce_formData.holidays];
    ce_formData = { ...ce_formData };
  }
  
  function translateMonth(month: string) {
    const idx = ce_months.indexOf(month);
    return idx >= 0 ? ce_displayMonths[idx] : '';
  }
  
  function validateForm(): boolean {
    ce_validationErrors.clear();
    if (!ce_formData.sDay || !ce_formData.sMonth || !ce_formData.sYear) ce_validationErrors.add('startDate');
    if (!ce_formData.eDay || !ce_formData.eMonth || !ce_formData.eYear) ce_validationErrors.add('endDate');
    if (!ce_formData.startTime) ce_validationErrors.add('startTime');
    if (!ce_formData.endTime) ce_validationErrors.add('endTime');
    if (!ce_formData.totalSlots) ce_validationErrors.add('totalSlots');
    
    ce_validationErrors = new Set(ce_validationErrors);
    return ce_validationErrors.size === 0 && isDateRangeValid;
  }
  
  function handleNext() {
    if (!validateForm()) return;
    console.log("Saving Event Data:", ce_formData);
    eventForm.set({ ...$eventForm, ...ce_formData } as any);
    goto('/organizer/create-event/rewards');
  }
  
  function handleBack() {
    eventForm.set({ ...$eventForm, ...ce_formData } as any);
    goto('/organizer/create-event/general');
  }
  
  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') ce_activeDropdown = null;
  }
</script>

<div 
  class="ce-scroll-container"
  on:click={() => (ce_activeDropdown = null)}
  on:keydown={handleKeyDown}
  role="presentation"
>
  <div class="ce-grid-layout">
    <div class="ce-card ce-config-card">
      <div class="ce-card-head">
        <svg class="ce-icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
        </svg>
        <span>{t('dateAndTime')}</span>
      </div>

      <div class="ce-dual-row">
        <div class="ce-input-group">
          <div class="ce-label-wrapper"><span class="ce-label">{t('startDateLabel')} <span class="ce-req">*</span></span></div>
          <div class="ce-date-row compact-gap" class:error={ce_validationErrors.has('startDate')}>
            <div class="ce-dd-wrap flex-1-5">
              <button type="button" class="ce-trigger" on:click|stopPropagation={() => ce_toggleDD('sDay')}>
                <input type="text" value={ce_formData.sDay} placeholder={lang === 'th' ? 'วัน' : 'Day'} class="ce-input-dis" readonly /><span class="ce-arrow">▼</span>
              </button>
              {#if ce_activeDropdown === 'sDay'}
                <div class="ce-options">{#each ce_days as d} <button type="button" class="ce-opt" on:click|stopPropagation={() => ce_selectOpt('sDay', d)}>{d}</button> {/each}</div>
              {/if}
            </div>
            <div class="ce-dd-wrap flex-2">
              <button type="button" class="ce-trigger" on:click|stopPropagation={() => ce_toggleDD('sMonth')}>
                <input type="text" value={translateMonth(ce_formData.sMonth)} placeholder={lang === 'th' ? 'เดือน' : 'Month'} class="ce-input-dis" readonly /><span class="ce-arrow">▼</span>
              </button>
              {#if ce_activeDropdown === 'sMonth'}
                <div class="ce-options">{#each ce_months as m, idx} <button type="button" class="ce-opt" on:click|stopPropagation={() => ce_selectOpt('sMonth', m)}>{ce_displayMonths[idx]}</button> {/each}</div>
              {/if}
            </div>
            <div class="ce-dd-wrap flex-1-5">
              <button type="button" class="ce-trigger" on:click|stopPropagation={() => ce_toggleDD('sYear')}>
                <input type="text" value={ce_formData.sYear} placeholder={lang === 'th' ? 'ปี' : 'Year'} class="ce-input-dis" readonly /><span class="ce-arrow">▼</span>
              </button>
              {#if ce_activeDropdown === 'sYear'}
                <div class="ce-options">{#each ce_years as y} <button type="button" class="ce-opt" on:click|stopPropagation={() => ce_selectOpt('sYear', y)}>{y}</button> {/each}</div>
              {/if}
            </div>
          </div>
        </div>

        <div class="ce-input-group">
          <div class="ce-label-wrapper"><span class="ce-label">{t('endDateLabel')} <span class="ce-req">*</span></span></div>
          <div class="ce-date-row compact-gap" class:error={ce_validationErrors.has('endDate')}>
            <div class="ce-dd-wrap flex-1-5">
              <button type="button" class="ce-trigger" on:click|stopPropagation={() => ce_toggleDD('eDay')}>
                <input type="text" value={ce_formData.eDay} placeholder={lang === 'th' ? 'วัน' : 'Day'} class="ce-input-dis" readonly /><span class="ce-arrow">▼</span>
              </button>
              {#if ce_activeDropdown === 'eDay'}
                <div class="ce-options">{#each ce_days as d} <button type="button" class="ce-opt" on:click|stopPropagation={() => ce_selectOpt('eDay', d)}>{d}</button> {/each}</div>
              {/if}
            </div>
            <div class="ce-dd-wrap flex-2">
              <button type="button" class="ce-trigger" on:click|stopPropagation={() => ce_toggleDD('eMonth')}>
                <input type="text" value={translateMonth(ce_formData.eMonth)} placeholder={lang === 'th' ? 'เดือน' : 'Month'} class="ce-input-dis" readonly /><span class="ce-arrow">▼</span>
              </button>
              {#if ce_activeDropdown === 'eMonth'}
                <div class="ce-options">{#each ce_months as m, idx} <button type="button" class="ce-opt" on:click|stopPropagation={() => ce_selectOpt('eMonth', m)}>{ce_displayMonths[idx]}</button> {/each}</div>
              {/if}
            </div>
            <div class="ce-dd-wrap flex-1-5">
              <button type="button" class="ce-trigger" on:click|stopPropagation={() => ce_toggleDD('eYear')}>
                <input type="text" value={ce_formData.eYear} placeholder={lang === 'th' ? 'ปี' : 'Year'} class="ce-input-dis" readonly /><span class="ce-arrow">▼</span>
              </button>
              {#if ce_activeDropdown === 'eYear'}
                <div class="ce-options">{#each ce_years as y} <button type="button" class="ce-opt" on:click|stopPropagation={() => ce_selectOpt('eYear', y)}>{y}</button> {/each}</div>
              {/if}
            </div>
          </div>
        </div>
      </div>

      {#if !isDateRangeValid && ce_formData.sDay && ce_formData.eDay}
        <div class="ce-error-msg" role="alert">⚠️ {t('invalidDateRangeMsg')}</div>
      {/if}

      <div class="ce-time-capacity-row">
        <div class="ce-input-group">
           <div class="ce-label-wrapper"><span class="ce-label">{t('startTimeLabel')} <span class="ce-req">*</span></span></div>
           <div class="ce-dd-wrap" class:error={ce_validationErrors.has('startTime')}>
             <button type="button" class="ce-trigger-compact" on:click|stopPropagation={() => ce_toggleDD('startTime')}>
               <input type="text" bind:value={ce_formData.startTime} placeholder="00:00" class="ce-input-inline" maxlength="5" /><span class="ce-arrow">▼</span>
             </button>
             {#if ce_activeDropdown === 'startTime'}
               <div class="ce-options">{#each ce_timeList as t} <button type="button" class="ce-opt" on:click|stopPropagation={() => ce_selectCombo('startTime', t)}>{t}</button> {/each}</div>
             {/if}
           </div>
        </div>
        <div class="ce-input-group">
           <div class="ce-label-wrapper"><span class="ce-label">{t('endTimeLabel')} <span class="ce-req">*</span></span></div>
           <div class="ce-dd-wrap" class:error={ce_validationErrors.has('endTime')}>
             <button type="button" class="ce-trigger-compact" on:click|stopPropagation={() => ce_toggleDD('endTime')}>
               <input type="text" bind:value={ce_formData.endTime} placeholder="00:00" class="ce-input-inline" maxlength="5" /><span class="ce-arrow">▼</span>
             </button>
             {#if ce_activeDropdown === 'endTime'}
               <div class="ce-options">{#each ce_timeList as t} <button type="button" class="ce-opt" on:click|stopPropagation={() => ce_selectCombo('endTime', t)}>{t}</button> {/each}</div>
             {/if}
           </div>
        </div>
        <div class="ce-input-group">
           <div class="ce-label-wrapper"><span class="ce-label">{t('capacityLabel')} <span class="ce-req">*</span></span></div>
           <div class="ce-dd-wrap" class:error={ce_validationErrors.has('totalSlots')}>
             <button type="button" class="ce-trigger-compact" on:click|stopPropagation={() => ce_toggleDD('slots')}>
               <input type="number" min="0" bind:value={ce_formData.totalSlots} placeholder={lang === 'th' ? 'สูงสุด' : 'Max'} class="ce-input-inline" /><span class="ce-arrow">▼</span>
             </button>
             {#if ce_activeDropdown === 'slots'}
               <div class="ce-options">{#each [50, 100, 200, 500, 1000, 2000, 5000] as s} <button type="button" class="ce-opt" on:click|stopPropagation={() => ce_selectCombo('totalSlots', s)}>{s} {lang === 'th' ? 'ที่นั่ง' : 'Slots'}</button> {/each}</div>
             {/if}
           </div>
        </div>
      </div>

      <div class="ce-input-group">
        <div class="ce-label-wrapper"><span class="ce-label">{t('distanceLabel')}</span></div>
        <div class="ce-dd-wrap">
          <button type="button" class="ce-trigger-compact" on:click|stopPropagation={() => ce_toggleDD('distanceKm')}>
            <input type="number" min="0" step="1" bind:value={ce_formData.distanceKm} placeholder="0" class="ce-input-inline" /><span class="ce-unit-label">km</span><span class="ce-arrow">▼</span>
          </button>
          {#if ce_activeDropdown === 'distanceKm'}
            <div class="ce-options">{#each [1, 2, 3, 5, 10, 15, 21, 42] as d} <button type="button" class="ce-opt" on:click|stopPropagation={() => ce_selectCombo('distanceKm', d)}>{d} km</button> {/each}</div>
          {/if}
        </div>
      </div>
    </div>

    <div class="ce-card ce-config-card" class:ce-locked-card={!isDateRangeValid}>
      {#if !isDateRangeValid}
        <div class="ce-lock-overlay" role="status" aria-live="polite">
          <svg class="ce-lock-icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
          </svg>
          <span>Set valid <strong>Start & End Date</strong> to unlock.</span>
        </div>
      {/if}

      <div class="ce-card-head">
        <svg class="ce-icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path>
        </svg>
        <span>{t('holidaysAndExclusions')}</span>
      </div>

      <div class="ce-holiday-control">
        <div class="ce-holiday-buttons">
          <label class="ce-check-row" class:active={ce_formData.holidayMode === 'none'}>
            <input type="checkbox" checked={ce_formData.holidayMode === 'none'} disabled={!isDateRangeValid} on:change={() => ce_setHolidayMode('none')} />
            <div class="ce-check-content">
              <span class="ce-check-title">{t('noHolidaysOption')}</span>
              <span class="ce-check-desc">{lang === 'th' ? 'กิจกรรมทุกวัน' : 'Event runs daily'}</span>
            </div>
          </label>

          <label class="ce-check-row" class:active={ce_formData.holidayMode === 'weekends'}>
            <input type="checkbox" checked={ce_formData.holidayMode === 'weekends'} disabled={!isDateRangeValid} on:change={() => ce_setHolidayMode('weekends')} />
            <div class="ce-check-content">
              <span class="ce-check-title">{t('excludeWeekends')}</span>
              <span class="ce-check-desc">{lang === 'th' ? 'ไม่นับวันเสาร์-อาทิตย์' : 'Exclude Sat-Sun'}</span>
            </div>
          </label>
          
          <label class="ce-check-row" class:active={ce_formData.holidayMode === 'public'}>
            <input type="checkbox" checked={ce_formData.holidayMode === 'public'} disabled={!isDateRangeValid} on:change={() => ce_setHolidayMode('public')} />
            <div class="ce-check-content">
              <span class="ce-check-title">{lang === 'th' ? 'วันหยุดราชการ' : 'Public Holidays'}</span>
              <span class="ce-check-desc">{lang === 'th' ? 'หยุดเฉพาะวันราชการ' : 'Public holidays only'}</span>
            </div>
          </label>

          <label class="ce-check-row" class:active={ce_formData.holidayMode === 'weekends_public'}>
            <input type="checkbox" checked={ce_formData.holidayMode === 'weekends_public'} disabled={!isDateRangeValid} on:change={() => ce_setHolidayMode('weekends_public')} />
            <div class="ce-check-content">
              <span class="ce-check-title">{lang === 'th' ? 'เสาร์-อาทิตย์ + ราชการ' : 'Sat-Sun & Public'}</span>
              <span class="ce-check-desc">{lang === 'th' ? 'หยุดทุกวันหยุด' : 'Exclude all holidays'}</span>
            </div>
          </label>
        </div>

        <hr class="ce-divider" />

        <div class="ce-input-group">
          <div class="ce-label-wrapper">
            <span class="ce-label">{lang === 'th' ? 'วันที่หยุดที่เลือก' : 'Selected Holidays'}</span>
          </div>
          <div class="ce-tags" style="margin-top: 10px;">
            {#if ce_formData.holidays.length === 0}
               {#if ce_formData.holidayMode === 'public' || ce_formData.holidayMode === 'weekends_public'}
                  <span style="color: #f59e0b; font-size: 0.85rem;">
                    {lang === 'th' ? '⚠️ ไม่พบวันหยุดในช่วงเวลานี้ (ข้อมูลวันหยุดมีปี 2026-2030 เท่านั้น)' : '⚠️ No holidays found in range. (Data available for 2026-2030)'}
                  </span>
               {:else}
                  <span style="color: #64748b; font-size: 0.85rem;">{lang === 'th' ? 'ยังไม่มีวันหยุดที่เลือก' : 'No holidays selected'}</span>
               {/if}
            {:else}
              {#each ce_formData.holidays as h}
                <span class="ce-tag">
                  {h}
                  <button type="button" on:click={() => ce_toggleHoliday(h)} aria-label={`Remove ${h}`}>×</button>
                </span>
              {/each}
            {/if}
          </div>
        </div>
      </div>
    </div>

    <div class="ce-nav-buttons">
      <button type="button" class="ce-btn-cancel" on:click={handleBack}>
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
        {t('back')}
      </button>
      <button type="button" class="ce-btn-save" on:click={handleNext}>
        {t('next')}
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
      </button>
    </div>
  </div>
</div>

<style>
  /* Scrollbar Settings: ซ่อน Scrollbar แต่ยังเลื่อนได้ */
  .ce-scroll-container {
    height: calc(100vh - 180px);
    overflow-y: auto; /* อนุญาตให้เลื่อน */
    overflow-x: hidden;
    scrollbar-width: none !important; /* Firefox */
    -ms-overflow-style: none !important; /* IE/Edge */
  }
  
  .ce-scroll-container::-webkit-scrollbar {
    display: none !important; /* Chrome/Safari */
  }

  /* Grid Layout */
  .ce-grid-layout { display: flex; flex-direction: column; gap: 24px; max-width: 900px; margin: 0 auto; position: relative; z-index: 10; padding: 0 16px 24px; }
  .ce-card { background: #1e293b; border: 1px solid #334155; border-radius: 20px; padding: 24px; position: relative; box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.3); overflow: visible; }
  .ce-card-head { font-size: 1.1rem; font-weight: 700; color: #f1f5f9; display: flex; align-items: center; gap: 10px; border-bottom: 1px solid #334155; padding-bottom: 15px; margin-bottom: 20px; }
  .ce-icon-svg { width: 20px; height: 20px; flex-shrink: 0; color: #10b981; }
  .ce-input-group { margin-bottom: 1.2rem; } .ce-input-group:last-child { margin-bottom: 0; }
  .ce-label-wrapper { margin-bottom: 8px; } .ce-label { display: block; color: #94a3b8; font-size: 0.85rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; } .ce-req { color: #ef4444; margin-left: 4px; }
  .ce-dual-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 1.5rem; }
  .ce-time-capacity-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-top: 1.5rem; }
  .ce-date-row { display: flex; gap: 10px; } .ce-date-row.compact-gap { gap: 6px; }
  .flex-2 { flex: 2; } .flex-1-5 { flex: 1.5; }
  .ce-dd-wrap { position: relative; }
  .ce-trigger, .ce-trigger-compact { display: flex; align-items: center; gap: 8px; background: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 0 14px; height: 48px; cursor: pointer; transition: all 0.2s; position: relative; width: 100%; text-align: left; }
  .ce-trigger:hover, .ce-trigger-compact:hover { border-color: #64748b; }
  .ce-input-dis, .ce-input-inline { flex: 1; background: transparent; border: none; color: white; font-size: 0.95rem; outline: none; pointer-events: none; }
  .ce-input-inline { pointer-events: auto; }
  .ce-arrow { color: #64748b; font-size: 0.7rem; pointer-events: none; }
  .ce-unit-label { font-size: 0.85rem; color: #10b981; font-weight: 600; margin-left: 4px; margin-right: 8px; pointer-events: none; }
  .ce-options { position: absolute; top: calc(100% + 8px); left: 0; right: 0; background: #1e293b; border: 1px solid #334155; border-radius: 12px; max-height: 300px; overflow-y: auto; z-index: 100; box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.5); }
  .ce-opt { padding: 12px 16px; color: #e2e8f0; cursor: pointer; transition: all 0.2s; display: flex; justify-content: space-between; align-items: center; background: transparent; border: none; width: 100%; text-align: left; }
  .ce-opt:hover { background: #10b981; color: white; }
  .ce-locked-card { opacity: 0.5; pointer-events: none; border-style: dashed; border-color: #475569; filter: grayscale(0.8); }
  .ce-lock-overlay { position: absolute; inset: 0; background: rgba(15, 23, 42, 0.85); z-index: 50; display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 20px; color: #e2e8f0; font-weight: 500; backdrop-filter: blur(2px); gap: 10px; }
  .ce-lock-icon-svg { width: 48px; height: 48px; color: #64748b; margin-bottom: 10px; }
  .ce-holiday-buttons { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
  .ce-check-row { display: flex; align-items: center; gap: 15px; cursor: pointer; padding: 14px; background: #0f172a; border-radius: 12px; border: 1px solid #334155; transition: 0.2s; user-select: none; }
  .ce-check-row:hover { border-color: #64748b; background: #162032; }
  .ce-check-row.active { border-color: #10b981; background: rgba(16, 185, 129, 0.05); }
  .ce-check-row input { width: 20px; height: 20px; accent-color: #10b981; cursor: pointer; }
  .ce-check-content { display: flex; flex-direction: column; }
  .ce-check-title { color: white; font-weight: 600; font-size: 0.95rem; }
  .ce-check-desc { color: #64748b; font-size: 0.8rem; margin-top: 2px; }
  .ce-divider { border: 0; border-top: 1px solid #334155; margin: 20px 0; }
  .ce-tags { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 15px; }
  .ce-tag { background: rgba(239, 68, 68, 0.15); color: #fca5a5; padding: 6px 12px; border-radius: 20px; font-size: 0.85rem; display: flex; align-items: center; gap: 8px; border: 1px solid rgba(239, 68, 68, 0.3); }
  .ce-tag button { background: none; border: none; color: inherit; cursor: pointer; font-size: 1.1rem; line-height: 1; }
  .ce-error-msg { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); color: #fca5a5; padding: 10px 14px; border-radius: 10px; font-size: 0.85rem; margin-top: 15px; display: flex; align-items: center; gap: 8px; }
  .ce-nav-buttons { display: flex; gap: 12px; justify-content: flex-end; position: sticky; bottom: 0; background: linear-gradient(to top, #0f172a 80%, transparent); padding: 20px 0 0; margin: 0 -16px; padding-left: 16px; padding-right: 16px; }
  .ce-btn-cancel { background: transparent; border: 1px solid #475569; color: #94a3b8; padding: 0.7rem 1.5rem; border-radius: 12px; cursor: pointer; font-weight: 600; transition: all 0.2s; display: flex; align-items: center; gap: 8px; }
  .ce-btn-cancel:hover { border-color: #e2e8f0; color: #e2e8f0; }
  .ce-btn-save { background: linear-gradient(135deg, #10b981, #059669); border: none; color: white; padding: 0.7rem 2rem; border-radius: 12px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3); transition: all 0.2s; display: flex; align-items: center; gap: 8px; }
  .ce-btn-save:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4); }
  @media (max-width: 1024px) { .ce-dual-row { grid-template-columns: 1fr; } .ce-time-capacity-row { grid-template-columns: 1fr; } }
  @media (max-width: 640px) { .ce-scroll-container { height: calc(100vh - 140px); } .ce-grid-layout { gap: 16px; padding: 0 12px 16px; } .ce-card { padding: 16px; border-radius: 16px; } .ce-holiday-buttons { grid-template-columns: 1fr; } .ce-date-row { flex-direction: column; gap: 10px; } .ce-nav-buttons { flex-direction: column; gap: 10px; } .ce-btn-cancel, .ce-btn-save { width: 100%; justify-content: center; } }
</style>