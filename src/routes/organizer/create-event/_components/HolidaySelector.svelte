<script lang="ts">
  export let holidayType: "none" | "weekends" | "specific" | "public" | "weekends_public" = "none";
  export let holidays: string[] = [];
  export let startDate: string;
  export let endDate: string;
  export let options: { value: string; label: string }[] = [];

  let isOpen = false;
  let selectedHoliday = "";

  function toggleDropdown() {
    if (options.length === 0) return;
    isOpen = !isOpen;
  }

  function handleTriggerKeydown(e: KeyboardEvent) {
    const key = e.key;
    if (key === 'Enter' || key === ' ' || key === 'Spacebar') {
      e.preventDefault();
      toggleDropdown();
    }
  }

  function handleDropdownKeydown(e: KeyboardEvent) {
    const key = e.key;
    if (key === 'Escape') {
      isOpen = false;
    }
  }

  function selectDate(value: string) {
    selectedHoliday = value;
    isOpen = false;
    addHoliday();
  }

  function addHoliday() {
    if (selectedHoliday && !holidays.includes(selectedHoliday)) {
      holidays = [...holidays, selectedHoliday];
      selectedHoliday = "";
    }
  }

  function removeHoliday(date: string) {
    holidays = holidays.filter(d => d !== date);
  }

  function getHolidayLabel(date: string): string {
    const option = options.find(o => o.value === date);
    return option?.label || date;
  }

  $: canAddHolidays = startDate && endDate && options.length > 0;
</script>

<div class="holiday-selector">
  <!-- Radio Options -->
  <div class="hs-options">
    <label class="hs-radio">
      <input type="radio" bind:group={holidayType} value="none" />
      <span>ไม่มีวันหยุด</span>
    </label>
    
    <label class="hs-radio">
      <input type="radio" bind:group={holidayType} value="weekends" />
      <span>หยุดเสาร์-อาทิตย์</span>
    </label>
    
    <label class="hs-radio">
      <input type="radio" bind:group={holidayType} value="public" />
      <span>หยุดวันหยุดราชการ</span>
    </label>
    
    <label class="hs-radio">
      <input type="radio" bind:group={holidayType} value="weekends_public" />
      <span>หยุดเสาร์-อาทิตย์ + วันหยุดราชการ</span>
    </label>
    
    <label class="hs-radio">
      <input type="radio" bind:group={holidayType} value="specific" />
      <span>เลือกวันที่เฉพาะ</span>
    </label>
  </div>

  <!-- Specific Date Selector -->
  {#if holidayType === "specific"}
    <div class="hs-specific">
      {#if !canAddHolidays}
        <div class="hs-warning">
          <svg class="hs-warning-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          <span>กรุณาเลือกวันเริ่มและวันสิ้นสุดก่อน</span>
        </div>
      {:else}
        <div class="hs-dropdown-wrapper">
          <div
            class="hs-trigger"
            role="button"
            tabindex="0"
            aria-expanded={isOpen}
            on:click={toggleDropdown}
            on:keydown={handleTriggerKeydown}
          >
            <input
              type="text"
              value={selectedHoliday ? getHolidayLabel(selectedHoliday) : ""}
              placeholder="เลือกวันที่หยุดจากช่วงเวลากิจกรรม"
              class="hs-input"
              readonly
              aria-readonly="true"
            />
            <span class="hs-arrow">▼</span>
          </div>
          
          {#if isOpen}
            <div class="hs-dropdown" role="listbox" tabindex="0" on:click|stopPropagation on:keydown={handleDropdownKeydown}>
              {#if options.length === 0}
                <div class="hs-empty">ไม่มีวันที่ให้เลือก</div>
              {:else}
                {#each options as option}
                  <button 
                    type="button"
                    class="hs-option" 
                    class:selected={holidays.includes(option.value)}
                    on:click={() => selectDate(option.value)}
                  >
                    {option.label}
                    {#if holidays.includes(option.value)}
                      <svg class="hs-check" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                      </svg>
                    {/if}
                  </button>
                {/each}
              {/if}
            </div>
          {/if}
        </div>

        <!-- Selected Holidays -->
        {#if holidays.length > 0}
          <div class="hs-chips">
            {#each holidays as date}
              <div class="hs-chip">
                <span>{getHolidayLabel(date)}</span>
                <button type="button" on:click={() => removeHoliday(date)}>×</button>
              </div>
            {/each}
          </div>
        {/if}
      {/if}
    </div>
  {/if}
</div>

<style>
  .holiday-selector {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .hs-options {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .hs-radio {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    background: rgba(15, 23, 42, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .hs-radio:hover {
    border-color: rgba(16, 185, 129, 0.3);
    background: rgba(16, 185, 129, 0.05);
  }

  .hs-radio input[type="radio"] {
    width: 20px;
    height: 20px;
    accent-color: #10b981;
    cursor: pointer;
  }

  .hs-radio span {
    color: #f8fafc;
    font-weight: 500;
  }

  .hs-specific {
    margin-top: 0.5rem;
  }

  .hs-warning {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    background: rgba(245, 158, 11, 0.1);
    border: 1px solid rgba(245, 158, 11, 0.3);
    border-radius: 12px;
    color: #fbbf24;
  }

  .hs-warning-icon {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }

  .hs-warning span {
    font-size: 0.9rem;
  }

  .hs-dropdown-wrapper {
    position: relative;
  }

  .hs-trigger {
    position: relative;
    cursor: pointer;
  }

  .hs-input {
    width: 100%;
    padding: 0.75rem 2.5rem 0.75rem 1rem;
    background: rgba(15, 23, 42, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    color: #f8fafc;
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .hs-input:hover {
    border-color: rgba(16, 185, 129, 0.3);
  }

  .hs-input::placeholder {
    color: #94a3b8;
  }

  .hs-arrow {
    position: absolute;
    right: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: #94a3b8;
    font-size: 0.75rem;
    pointer-events: none;
  }

  .hs-dropdown {
    position: absolute;
    top: calc(100% + 0.5rem);
    left: 0;
    right: 0;
    max-height: 300px;
    overflow-y: auto;
    overflow-x: hidden;
    background: #1e293b;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    z-index: 100;
    padding: 0.5rem;
    
    /* ✅ ซ่อน scrollbar แบบเข้มข้น */
    scrollbar-width: none !important; /* Firefox */
    -ms-overflow-style: none !important; /* IE/Edge */
    scrollbar-color: transparent transparent !important;
  }

  .hs-dropdown::-webkit-scrollbar {
    display: none !important; /* Chrome/Safari/Opera */
    width: 0 !important;
    height: 0 !important;
    background: transparent !important;
  }
  
  .hs-dropdown::-webkit-scrollbar-track {
    display: none !important;
    background: transparent !important;
  }
  
  .hs-dropdown::-webkit-scrollbar-thumb {
    display: none !important;
    background: transparent !important;
  }

  .hs-empty {
    padding: 1rem;
    text-align: center;
    color: #94a3b8;
    font-size: 0.9rem;
  }

  .hs-option {
    width: 100%;
    padding: 0.75rem 1rem;
    background: transparent;
    border: none;
    text-align: left;
    color: #f8fafc;
    cursor: pointer;
    border-radius: 8px;
    transition: all 0.2s;
    font-size: 0.95rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .hs-option:hover {
    background: rgba(16, 185, 129, 0.1);
    color: #10b981;
  }

  .hs-option.selected {
    background: rgba(16, 185, 129, 0.15);
    color: #10b981;
    font-weight: 500;
  }

  .hs-check {
    width: 16px;
    height: 16px;
    color: #10b981;
  }

  .hs-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 1rem;
  }

  .hs-chip {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.3);
    border-radius: 20px;
    color: #10b981;
    font-size: 0.9rem;
  }

  .hs-chip button {
    width: 20px;
    height: 20px;
    background: rgba(239, 68, 68, 0.1);
    border: none;
    border-radius: 50%;
    color: #ef4444;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    line-height: 1;
    transition: all 0.2s;
  }

  .hs-chip button:hover {
    background: rgba(239, 68, 68, 0.2);
  }
</style>