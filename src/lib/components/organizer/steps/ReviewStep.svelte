<script lang="ts">
  import { eventFormData } from '$lib/stores/eventFormStore';
  
  export let currentLang: 'th' | 'en' = 'th';

  // Format date for display
  function formatDisplayDate(dateStr: string): string {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString(currentLang === 'th' ? 'th-TH' : 'en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Calculate total allocated
  $: totalAllocated = $eventFormData.rewards.reduce((sum, tier) => sum + tier.quota, 0);
  $: remainingSlots = $eventFormData.totalSlots - totalAllocated;

  // Calculate active days
  $: activeDays = calculateActiveDays();

  function calculateActiveDays(): number {
    if (!$eventFormData.startDate || !$eventFormData.endDate) return 0;
    
    const start = new Date($eventFormData.startDate);
    const end = new Date($eventFormData.endDate);
    let count = 0;
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const day = d.getDay();
      const dateStr = d.toISOString().split('T')[0];
      
      if ($eventFormData.holidayType === 'weekends' && (day === 0 || day === 6)) {
        continue;
      }
      if ($eventFormData.holidayType === 'specific' && $eventFormData.specificDates.includes(dateStr)) {
        continue;
      }
      count++;
    }
    
    return count;
  }

  // Get holiday type label
  function getHolidayTypeLabel(): string {
    switch ($eventFormData.holidayType) {
      case 'none':
        return currentLang === 'th' ? 'ไม่มีวันหยุด' : 'No holidays';
      case 'weekends':
        return currentLang === 'th' ? 'ยกเว้นเสาร์-อาทิตย์' : 'Exclude weekends';
      case 'specific':
        return `${$eventFormData.specificDates.length} ${currentLang === 'th' ? 'วันที่เลือก' : 'selected dates'}`;
      default:
        return '-';
    }
  }
</script>

<div class="review-step">
  <!-- Summary Header -->
  <div class="review-header">
    <div class="header-icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
    </div>
    <div class="header-content">
      <h2>{currentLang === 'th' ? 'ตรวจสอบข้อมูลกิจกรรม' : 'Review Event Details'}</h2>
      <p>{currentLang === 'th' ? 'กรุณาตรวจสอบข้อมูลก่อนเผยแพร่กิจกรรม' : 'Please review all information before publishing'}</p>
    </div>
  </div>

  <!-- Event Preview Card -->
  <div class="preview-card">
    {#if $eventFormData.imagePreview}
      <div class="preview-image">
        <img src={$eventFormData.imagePreview} alt="Event preview" />
      </div>
    {/if}
    
    <div class="preview-content">
      <h3 class="event-title">{$eventFormData.title || 'Untitled Event'}</h3>
      <p class="event-description">{$eventFormData.description || 'No description'}</p>
      
      <div class="event-meta">
        <div class="meta-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
          <span>{$eventFormData.location || 'No location'}</span>
        </div>
        <div class="meta-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          <span>{formatDisplayDate($eventFormData.startDate)} - {formatDisplayDate($eventFormData.endDate)}</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Details Sections -->
  <div class="details-grid">
    <!-- Basic Info -->
    <div class="detail-section">
      <div class="section-header">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
        <h4>{currentLang === 'th' ? 'ข้อมูลพื้นฐาน' : 'Basic Information'}</h4>
      </div>
      <div class="detail-list">
        <div class="detail-row">
          <span class="detail-label">{currentLang === 'th' ? 'ประเภท' : 'Type'}</span>
          <span class="detail-value">
            {$eventFormData.eventType === 'single_day' 
              ? (currentLang === 'th' ? 'วันเดียว' : 'Single Day')
              : (currentLang === 'th' ? 'หลายวัน' : 'Multi Day')}
          </span>
        </div>
        {#if $eventFormData.eventType === 'multi_day'}
          <div class="detail-row">
            <span class="detail-label">{currentLang === 'th' ? 'เช็คอินสูงสุด/คน' : 'Max check-ins'}</span>
            <span class="detail-value">{$eventFormData.maxCheckinsPerUser} {currentLang === 'th' ? 'ครั้ง' : 'times'}</span>
          </div>
        {/if}
        <div class="detail-row">
          <span class="detail-label">{currentLang === 'th' ? 'จำนวนที่รับ' : 'Capacity'}</span>
          <span class="detail-value highlight">{$eventFormData.totalSlots.toLocaleString()} {currentLang === 'th' ? 'คน' : 'users'}</span>
        </div>
        {#if $eventFormData.distanceKm}
          <div class="detail-row">
            <span class="detail-label">{currentLang === 'th' ? 'ระยะทาง' : 'Distance'}</span>
            <span class="detail-value">{$eventFormData.distanceKm} km</span>
          </div>
        {/if}
      </div>
    </div>

    <!-- Schedule -->
    <div class="detail-section">
      <div class="section-header">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <h4>{currentLang === 'th' ? 'กำหนดการ' : 'Schedule'}</h4>
      </div>
      <div class="detail-list">
        <div class="detail-row">
          <span class="detail-label">{currentLang === 'th' ? 'วันเริ่ม' : 'Start'}</span>
          <span class="detail-value">{formatDisplayDate($eventFormData.startDate)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">{currentLang === 'th' ? 'วันสิ้นสุด' : 'End'}</span>
          <span class="detail-value">{formatDisplayDate($eventFormData.endDate)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">{currentLang === 'th' ? 'เวลา' : 'Time'}</span>
          <span class="detail-value">{$eventFormData.startTime || '--:--'} - {$eventFormData.endTime || '--:--'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">{currentLang === 'th' ? 'วันหยุด' : 'Holidays'}</span>
          <span class="detail-value">{getHolidayTypeLabel()}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">{currentLang === 'th' ? 'วันที่เปิด' : 'Active days'}</span>
          <span class="detail-value highlight">{activeDays} {currentLang === 'th' ? 'วัน' : 'days'}</span>
        </div>
      </div>
    </div>

    <!-- Rewards Summary -->
    <div class="detail-section full-width">
      <div class="section-header">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <h4>{currentLang === 'th' ? 'รางวัล' : 'Rewards'} ({$eventFormData.rewards.length} {currentLang === 'th' ? 'ระดับ' : 'tiers'})</h4>
      </div>
      
      {#if $eventFormData.rewards.length > 0}
        <div class="rewards-table">
          <div class="table-header">
            <span>{currentLang === 'th' ? 'ระดับ' : 'Tier'}</span>
            <span>{currentLang === 'th' ? 'โควต้า' : 'Quota'}</span>
            <span>{currentLang === 'th' ? 'เงื่อนไข' : 'Requirement'}</span>
          </div>
          {#each $eventFormData.rewards.sort((a, b) => b.requirement - a.requirement) as tier, index}
            <div class="table-row">
              <span class="tier-name">
                <span class="tier-badge">#{index + 1}</span>
                {tier.name || 'Unnamed'}
              </span>
              <span>{tier.quota.toLocaleString()} {currentLang === 'th' ? 'คน' : ''}</span>
              <span>{tier.requirement} {currentLang === 'th' ? 'รอบ' : 'rounds'}</span>
            </div>
          {/each}
          <div class="table-footer">
            <span>{currentLang === 'th' ? 'รวมจัดสรร' : 'Total allocated'}</span>
            <span class="total-value" class:over={remainingSlots < 0}>
              {totalAllocated.toLocaleString()} / {$eventFormData.totalSlots.toLocaleString()}
            </span>
          </div>
        </div>
      {:else}
        <div class="no-rewards">
          <p>{currentLang === 'th' ? 'ไม่มีรางวัล' : 'No rewards configured'}</p>
        </div>
      {/if}
    </div>
  </div>

  <!-- Status Section -->
  <div class="status-section">
    <div class="status-header">
      <h4>{currentLang === 'th' ? 'สถานะเมื่อเผยแพร่' : 'Status after publishing'}</h4>
    </div>
    <div class="status-badges">
      <div class="status-badge" class:active={$eventFormData.isPublic}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
            d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <span>{$eventFormData.isPublic 
          ? (currentLang === 'th' ? 'เปิดเผยสาธารณะ' : 'Public') 
          : (currentLang === 'th' ? 'ไม่เปิดเผย' : 'Private')}</span>
      </div>
      <div class="status-badge success" class:active={$eventFormData.isActive}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <span>{$eventFormData.isActive 
          ? (currentLang === 'th' ? 'เปิดใช้งาน' : 'Active') 
          : (currentLang === 'th' ? 'ปิดใช้งาน' : 'Inactive')}</span>
      </div>
    </div>

    <div class="status-toggles">
      <label class="toggle-item">
        <span>{currentLang === 'th' ? 'เปิดเผยสาธารณะ' : 'Public visibility'}</span>
        <input type="checkbox" bind:checked={$eventFormData.isPublic} />
        <span class="toggle-switch"></span>
      </label>
      <label class="toggle-item">
        <span>{currentLang === 'th' ? 'เปิดใช้งาน' : 'Active'}</span>
        <input type="checkbox" bind:checked={$eventFormData.isActive} />
        <span class="toggle-switch"></span>
      </label>
    </div>
  </div>
</div>

<style>
  .review-step {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  /* Header */
  .review-header {
    display: flex;
    align-items: center;
    gap: 1.25rem;
    padding: 1.5rem;
    background: rgba(16, 185, 129, 0.08);
    border: 1px solid rgba(16, 185, 129, 0.2);
    border-radius: 16px;
  }

  .header-icon {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: rgba(16, 185, 129, 0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .header-icon svg {
    width: 28px;
    height: 28px;
    color: #10b981;
  }

  .header-content h2 {
    margin: 0 0 0.25rem;
    font-size: 1.25rem;
    font-weight: 600;
    color: #f8fafc;
  }

  .header-content p {
    margin: 0;
    font-size: 0.9rem;
    color: #94a3b8;
  }

  /* Preview Card */
  .preview-card {
    display: flex;
    gap: 1.5rem;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(100, 116, 139, 0.2);
    border-radius: 16px;
    overflow: hidden;
  }

  .preview-image {
    width: 200px;
    flex-shrink: 0;
  }

  .preview-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .preview-content {
    flex: 1;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .event-title {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
    color: #f8fafc;
  }

  .event-description {
    margin: 0;
    font-size: 0.95rem;
    color: #94a3b8;
    line-height: 1.6;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .event-meta {
    display: flex;
    gap: 1.5rem;
    margin-top: auto;
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    color: #cbd5e1;
  }

  .meta-item svg {
    width: 18px;
    height: 18px;
    color: #64748b;
  }

  /* Details Grid */
  .details-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }

  .detail-section {
    background: rgba(15, 23, 42, 0.4);
    border: 1px solid rgba(100, 116, 139, 0.2);
    border-radius: 14px;
    padding: 1.25rem;
  }

  .detail-section.full-width {
    grid-column: span 2;
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid rgba(100, 116, 139, 0.15);
  }

  .section-header svg {
    width: 20px;
    height: 20px;
    color: #10b981;
  }

  .section-header h4 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: #f8fafc;
  }

  .detail-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .detail-label {
    font-size: 0.9rem;
    color: #94a3b8;
  }

  .detail-value {
    font-size: 0.9rem;
    font-weight: 500;
    color: #f8fafc;
  }

  .detail-value.highlight {
    color: #10b981;
    font-weight: 600;
  }

  /* Rewards Table */
  .rewards-table {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .table-header,
  .table-row {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr;
    gap: 1rem;
    padding: 0.75rem 1rem;
  }

  .table-header {
    background: rgba(100, 116, 139, 0.1);
    border-radius: 8px;
    font-size: 0.8rem;
    font-weight: 600;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .table-row {
    background: rgba(15, 23, 42, 0.4);
    border-radius: 8px;
    font-size: 0.9rem;
    color: #cbd5e1;
  }

  .tier-name {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-weight: 500;
    color: #f8fafc;
  }

  .tier-badge {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(16, 185, 129, 0.15);
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 700;
    color: #10b981;
  }

  .table-footer {
    display: flex;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    margin-top: 0.5rem;
    background: rgba(16, 185, 129, 0.05);
    border: 1px solid rgba(16, 185, 129, 0.2);
    border-radius: 8px;
    font-weight: 600;
    color: #cbd5e1;
  }

  .total-value {
    color: #10b981;
  }

  .total-value.over {
    color: #ef4444;
  }

  .no-rewards {
    padding: 2rem;
    text-align: center;
    color: #64748b;
  }

  /* Status Section */
  .status-section {
    background: rgba(15, 23, 42, 0.4);
    border: 1px solid rgba(100, 116, 139, 0.2);
    border-radius: 14px;
    padding: 1.25rem;
  }

  .status-header h4 {
    margin: 0 0 1rem;
    font-size: 1rem;
    font-weight: 600;
    color: #f8fafc;
  }

  .status-badges {
    display: flex;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .status-badge {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1rem;
    background: rgba(100, 116, 139, 0.1);
    border: 1px solid rgba(100, 116, 139, 0.2);
    border-radius: 10px;
    font-size: 0.9rem;
    color: #94a3b8;
  }

  .status-badge.active {
    background: rgba(16, 185, 129, 0.1);
    border-color: rgba(16, 185, 129, 0.3);
    color: #10b981;
  }

  .status-badge svg {
    width: 18px;
    height: 18px;
  }

  .status-toggles {
    display: flex;
    gap: 2rem;
  }

  .toggle-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    cursor: pointer;
  }

  .toggle-item span:first-child {
    font-size: 0.9rem;
    color: #cbd5e1;
  }

  .toggle-item input {
    display: none;
  }

  .toggle-switch {
    width: 44px;
    height: 24px;
    background: rgba(100, 116, 139, 0.3);
    border-radius: 12px;
    position: relative;
    transition: background 0.2s ease;
  }

  .toggle-switch::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
    background: white;
    border-radius: 50%;
    transition: transform 0.2s ease;
  }

  .toggle-item input:checked + .toggle-switch {
    background: #10b981;
  }

  .toggle-item input:checked + .toggle-switch::after {
    transform: translateX(20px);
  }

  @media (max-width: 768px) {
    .preview-card {
      flex-direction: column;
    }

    .preview-image {
      width: 100%;
      height: 180px;
    }

    .details-grid {
      grid-template-columns: 1fr;
    }

    .detail-section.full-width {
      grid-column: span 1;
    }

    .status-toggles {
      flex-direction: column;
      gap: 1rem;
    }
  }
</style>
