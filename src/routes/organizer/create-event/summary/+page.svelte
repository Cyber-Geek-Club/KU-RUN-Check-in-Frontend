<script lang="ts">
  import { goto } from '$app/navigation';
  import { eventForm } from '$lib/stores/eventForm';
  import { appState } from '$lib/stores/appState';
  import { t } from '$lib/i18n';
  import { onMount } from 'svelte';
  import { resolveImageUrl as resolveApiImageUrl } from '$lib/utils/imageUtils';
  // âœ… Import endpoints à¹€à¸žà¸·à¹ˆà¸­à¹ƒà¸Šà¹‰ URL à¸—à¸µà¹ˆà¸–à¸¹à¸à¸•à¹‰à¸­à¸‡
  import { endpoints } from '$lib/api/endpoints';

  $: lang = $appState.currentLang;
  $: storeData = $eventForm as any;
  $: editingEventId = storeData?.editingEventId;

  let formData = {
    imagePreview: null as string | null,
    title: '',
    description: '',
    location: '',
    eventType: 'single_day',
    maxCheckinsPerUser: 1,
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
    holidayMode: null as string | null,
    totalRewards: null as number | null,
    rewards: [] as any[],
    isPublic: true,
    isActive: true
  };

  let isSubmitting = false;
  let error = '';

  onMount(() => {
    formData = { ...$eventForm } as any;
  });

  function handleSummaryImgError(e: Event) {
    const img = e.currentTarget as HTMLImageElement;
    img.src = 'https://placehold.co/600x400/1e293b/64748b?text=Image+Not+Found';
  }

  function formatDate(day: string, month: string, year: string) {
    if (!day || !month || !year) return '';
    const monthNames = lang === 'th'
      ? ['à¸¡.à¸„.', 'à¸.à¸ž.', 'à¸¡à¸µ.à¸„.', 'à¹€à¸¡.à¸¢.', 'à¸ž.à¸„.', 'à¸¡à¸´.à¸¢.', 'à¸.à¸„.', 'à¸ª.à¸„.', 'à¸.à¸¢.', 'à¸•.à¸„.', 'à¸ž.à¸¢.', 'à¸˜.à¸„.']
      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthIndex = parseInt(month) - 1;
    return `${day} ${monthNames[monthIndex]} ${year}`;
  }

  function getEventTypeLabel(type: string) {
    const types: Record<string, { th: string; en: string }> = {
      single_day: { th: 'à¸à¸´à¸ˆà¸à¸£à¸£à¸¡à¸§à¸±à¸™à¹€à¸”à¸µà¸¢à¸§', en: 'Single Day Event' },
      multi_day: { th: 'à¸à¸´à¸ˆà¸à¸£à¸£à¸¡à¸«à¸¥à¸²à¸¢à¸§à¸±à¸™', en: 'Multi-Day Event' }
    };
    return types[type]?.[lang] || type;
  }

  function getHolidayModeLabel(mode: string | null) {
    if (!mode) return lang === 'th' ? 'à¹„à¸¡à¹ˆà¸¡à¸µ' : 'None';
    const modes: Record<string, { th: string; en: string }> = {
      weekends: { th: 'à¹„à¸¡à¹ˆà¸™à¸±à¸šà¸§à¸±à¸™à¸«à¸¢à¸¸à¸”à¸ªà¸¸à¸”à¸ªà¸±à¸›à¸”à¸²à¸«à¹Œ', en: 'Exclude Weekends' },
      none: { th: 'à¹„à¸¡à¹ˆà¸¡à¸µà¸§à¸±à¸™à¸«à¸¢à¸¸à¸”', en: 'No Holidays' },
      specific: { th: `${formData.holidays.length} à¸§à¸±à¸™à¸—à¸µà¹ˆà¹€à¸¥à¸·à¸­à¸`, en: `${formData.holidays.length} specific dates` }
    };
    return modes[mode]?.[lang] || mode;
  }

  // âœ… à¹à¸à¹‰à¹„à¸‚ handleSubmit à¹ƒà¸«à¹‰à¸—à¸³à¸‡à¸²à¸™ 3 Steps: Event -> Reward(s) -> Config
  async function handleSubmit() {
    isSubmitting = true;
    error = '';
    console.log("ðŸš€ [START] handleSubmit initiated..."); 

    try {
      // =========================================================
      // STEP 1: Create/Update Event
      // =========================================================
      console.log("ðŸ“¦ [STEP 1] Preparing Event Data..."); 
      const formDataToSend = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        // à¹à¸¢à¸ rewards à¹„à¸§à¹‰à¸—à¸³à¸—à¸µà¸«à¸¥à¸±à¸‡ à¹„à¸¡à¹ˆà¸ªà¹ˆà¸‡à¹„à¸› endpoint events
        if (key === 'rewards' || key === 'totalRewards') return;
        
        if (value !== null && value !== undefined) {
          if (Array.isArray(value)) {
            formDataToSend.append(key, JSON.stringify(value));
          } else if (typeof value === 'object' && key !== 'imageFile') {
            formDataToSend.append(key, JSON.stringify(value));
          } else if (key !== 'imagePreview') {
            formDataToSend.append(key, String(value));
          }
        }
      });

      const eventUrl = editingEventId 
        ? endpoints.events.update(editingEventId)
        : endpoints.events.create;
      
      console.log(`ðŸ”— Sending Event to: ${eventUrl}`);

      const eventResponse = await fetch(eventUrl, {
        method: editingEventId ? 'PUT' : 'POST',
        body: formDataToSend,
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`
        }
      });

      if (!eventResponse.ok) {
        const errData = await eventResponse.json().catch(() => ({}));
        console.error("âŒ Event Creation Failed:", errData);
        throw new Error(errData.detail || errData.message || 'Failed to submit event');
      }

      const eventResult = await eventResponse.json();
      // à¸£à¸±à¸š ID à¹ƒà¸«à¹‰à¸Šà¸±à¸§à¸£à¹Œ à¸£à¸­à¸‡à¸£à¸±à¸šà¸—à¸±à¹‰à¸‡ structure { id: 1 } à¹à¸¥à¸° { data: { id: 1 } }
      const eventId = eventResult.id || eventResult.data?.id || editingEventId;
      
      console.log("âœ… [STEP 1 SUCCESS] Event ID:", eventId);

      // =========================================================
      // STEP 2: Create Rewards Individually (à¹€à¸žà¸·à¹ˆà¸­à¹€à¸­à¸² reward_id)
      // =========================================================
      if (eventId && formData.rewards && formData.rewards.length > 0) {
          console.log(`ðŸ† [STEP 2] Processing ${formData.rewards.length} rewards...`);
          
          // à¹€à¸à¹‡à¸š Tier à¸—à¸µà¹ˆà¸ªà¸£à¹‰à¸²à¸‡à¸ªà¸³à¹€à¸£à¹‡à¸ˆà¹à¸¥à¸°à¸¡à¸µ ID à¹à¸¥à¹‰à¸§ à¹€à¸•à¸£à¸µà¸¢à¸¡à¸ªà¹ˆà¸‡à¹„à¸› Config
          const validTiers = [];

          // à¸§à¸™à¸¥à¸¹à¸›à¸ªà¸£à¹‰à¸²à¸‡ Reward à¸—à¸µà¸¥à¸°à¸­à¸±à¸™
          for (const [index, r] of formData.rewards.entries()) {
              console.log(`   ðŸ”¸ Creating Reward #${index + 1}: ${r.name}`);

              const rewardPayload = {
                  name: r.name,
                  description: `Reward Tier ${index + 1} for Event ${eventId}`,
                  required_completions: Number(r.requirement),
                  time_period_days: 60, // à¸«à¸£à¸·à¸­à¸„à¸³à¸™à¸§à¸“à¸ˆà¸²à¸à¸£à¸°à¸¢à¸°à¹€à¸§à¸¥à¸²à¸à¸´à¸ˆà¸à¸£à¸£à¸¡
                  meta: { event_id: eventId }
              };

              // à¸¢à¸´à¸‡ API à¸ªà¸£à¹‰à¸²à¸‡ Reward (endpoints.rewards.createReward à¸•à¹‰à¸­à¸‡à¸¡à¸µà¸„à¹ˆà¸²à¹€à¸›à¹‡à¸™ '/api/rewards')
              const rewardRes = await fetch(endpoints.rewards.createReward, {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`
                  },
                  body: JSON.stringify(rewardPayload)
              });

              if (!rewardRes.ok) {
                  console.error(`      âŒ Failed to create reward #${index+1}`);
                  continue; // à¸‚à¹‰à¸²à¸¡à¸•à¸±à¸§à¸—à¸µà¹ˆà¸žà¸±à¸‡à¹„à¸› à¹à¸•à¹ˆà¸—à¸³à¸•à¸±à¸§à¸–à¸±à¸”à¹„à¸›à¸•à¹ˆà¸­
              }

              const rewardData = await rewardRes.json();
              const newRewardId = rewardData.id || rewardData.data?.id;
              
              console.log(`      âœ… Created! Reward ID: ${newRewardId}`);

              if (newRewardId) {
                  validTiers.push({
                      tier: index + 1,
                      reward_id: newRewardId, // âœ… à¸•à¹‰à¸­à¸‡à¸ªà¹ˆà¸‡ ID à¸™à¸µà¹‰à¹„à¸›à¸œà¸¹à¸à¸à¸±à¸š Config
                      reward_name: r.name,
                      required_completions: Number(r.requirement),
                      quantity: 0, // unlimited
                      min_rank: 0,
                      max_rank: 0
                  });
              }
          }

          // =========================================================
          // STEP 3: Create Leaderboard Config (à¹ƒà¸Šà¹‰à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸ˆà¸²à¸ Step 2)
          // =========================================================
          if (validTiers.length > 0) {
              console.log("âš™ï¸ [STEP 3] Creating Leaderboard Config...");
              
              let endsAtStr = new Date().toISOString();
              if (formData.eYear && formData.eMonth && formData.eDay && formData.endTime) {
                  const y = formData.eYear;
                  const m = formData.eMonth.toString().padStart(2, '0');
                  const d = formData.eDay.toString().padStart(2, '0');
                  const time = formData.endTime;
                  endsAtStr = `${y}-${m}-${d}T${time}:00`;
              }

              const configPayload = {
                  event_id: eventId,
                  name: "Main Leaderboard",
                  description: "Auto-generated config",
                  max_reward_recipients: Number(formData.totalRewards) || 100,
                  required_completions: 1, 
                  starts_at: new Date().toISOString(),
                  ends_at: new Date(endsAtStr).toISOString(),
                  reward_tiers: validTiers // âœ… à¸ªà¹ˆà¸‡ array à¸—à¸µà¹ˆà¸¡à¸µ reward_id à¹à¸¥à¹‰à¸§
              };

              const configRes = await fetch(endpoints.rewards.createConfig, {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`
                  },
                  body: JSON.stringify(configPayload)
              });

              if (configRes.ok) {
                  console.log("âœ… [STEP 3 SUCCESS] Config Created");
              } else {
                  console.warn("âš ï¸ [STEP 3 FAILED] Could not create config:", await configRes.text());
              }
          } else {
              console.warn("âš ï¸ No rewards were created successfully, skipping config creation.");
          }
      } else {
          console.log("â„¹ï¸ No rewards selected, skipping Step 2 & 3.");
      }
      
      console.log("ðŸ [FINISH] Redirecting to event list...");
      eventForm.reset();
      goto('/organizer/events');
      
    } catch (err: any) {
      console.error("ðŸ’¥ Critical Error in handleSubmit:", err);
      error = err.message || 'An error occurred';
      isSubmitting = false;
    }
  }
  
  function handleBack() {
    goto('/organizer/create-event/rewards');
  }

  function handleEdit(section: string) {
    goto(`/organizer/create-event/${section}`);
  }
</script>

<div class="ce-grid-layout">
  <div class="ce-summary-header">
    <div class="ce-summary-icon">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    </div>
    <div>
      <h3 class="ce-summary-title">{lang === 'th' ?
        'à¸•à¸£à¸§à¸ˆà¸ªà¸­à¸šà¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸à¹ˆà¸­à¸™à¹€à¸œà¸¢à¹à¸žà¸£à¹ˆ' : 'Review Before Publishing'}</h3>
      <p class="ce-summary-desc">{lang === 'th' ?
        'à¸à¸£à¸¸à¸“à¸²à¸•à¸£à¸§à¸ˆà¸ªà¸­à¸šà¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¹ƒà¸«à¹‰à¸–à¸¹à¸à¸•à¹‰à¸­à¸‡à¸à¹ˆà¸­à¸™à¹€à¸œà¸¢à¹à¸žà¸£à¹ˆà¸à¸´à¸ˆà¸à¸£à¸£à¸¡' : 'Please verify all information before publishing your event'}</p>
    </div>
  </div>

  <div class="ce-card ce-summary-card">
    <div class="ce-card-head">
      <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
        <svg class="ce-icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
        <span>{lang === 'th' ? 'à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸—à¸±à¹ˆà¸§à¹„à¸›' : 'General Information'}</span>
      </div>
      <button type="button" class="ce-btn-edit" on:click={() => handleEdit('general')}>
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        {t('edit')}
      </button>
    </div>

    {#if formData.imagePreview}
        <div class="ce-summary-image">
          <img src={resolveApiImageUrl(formData.imagePreview)} alt="Event banner" on:error={handleSummaryImgError} />
        </div>
    {/if}

    <div class="ce-summary-grid">
      <div class="ce-summary-item">
        <span class="ce-summary-label">{t('eventName')}</span>
        <span class="ce-summary-value">{formData.title || '-'}</span>
      </div>

      <div class="ce-summary-item">
        <span class="ce-summary-label">{t('eventType')}</span>
        <span class="ce-summary-badge">{getEventTypeLabel(formData.eventType)}</span>
      </div>

      <div class="ce-summary-item full-width">
        <span class="ce-summary-label">{t('description')}</span>
        <span class="ce-summary-value">{formData.description || '-'}</span>
      </div>

      <div class="ce-summary-item full-width">
        <span class="ce-summary-label">{t('location')}</span>
        <span class="ce-summary-value">{formData.location || '-'}</span>
      </div>

      {#if formData.eventType === 'multi_day'}
        <div class="ce-summary-item">
          <span class="ce-summary-label">{t('maxCheckinsPerUser')}</span>
          <span class="ce-summary-value">{formData.maxCheckinsPerUser} {t('checkinTimes')}</span>
        </div>
      {/if}
    </div>
  </div>

  <div class="ce-card ce-summary-card">
    <div class="ce-card-head">
      <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
        <svg class="ce-icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
        </svg>
        <span>{lang === 'th' ? 'à¸§à¸±à¸™à¹€à¸§à¸¥à¸²à¹à¸¥à¸°à¸ˆà¸³à¸™à¸§à¸™' : 'Date, Time & Capacity'}</span>
      </div>
      <button type="button" class="ce-btn-edit" on:click={() => handleEdit('capacity')}>
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        {t('edit')}
      </button>
    </div>

    <div class="ce-summary-grid">
      <div class="ce-summary-item">
        <span class="ce-summary-label">{t('startDateLabel')}</span>
        <span class="ce-summary-value">{formatDate(formData.sDay, formData.sMonth, formData.sYear)}</span>
      </div>

      <div class="ce-summary-item">
        <span class="ce-summary-label">{t('endDateLabel')}</span>
        <span class="ce-summary-value">{formatDate(formData.eDay, formData.eMonth, formData.eYear)}</span>
      </div>

      <div class="ce-summary-item">
        <span class="ce-summary-label">{t('startTimeLabel')}</span>
        <span class="ce-summary-value">{formData.startTime || '-'}</span>
      </div>

      <div class="ce-summary-item">
        <span class="ce-summary-label">{t('endTimeLabel')}</span>
        <span class="ce-summary-value">{formData.endTime || '-'}</span>
      </div>

      <div class="ce-summary-item">
        <span class="ce-summary-label">{t('capacityLabel')}</span>
        <span class="ce-summary-value-highlight">{formData.totalSlots || '-'} {lang === 'th' ? 'à¸—à¸µà¹ˆà¸™à¸±à¹ˆà¸‡' : 'slots'}</span>
      </div>

      <div class="ce-summary-item">
        <span class="ce-summary-label">{t('distanceLabel')}</span>
        <span class="ce-summary-value">{formData.distanceKm || 0} km</span>
      </div>

      <div class="ce-summary-item full-width">
        <span class="ce-summary-label">{t('holidaysAndExclusions')}</span>
        <span class="ce-summary-value">{getHolidayModeLabel(formData.holidayMode)}</span>
      </div>
    </div>
  </div>

  <div class="ce-card ce-summary-card">
    <div class="ce-card-head">
      <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
        <svg class="ce-icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"></path>
        </svg>
        <span>{lang === 'th' ? 'à¸£à¸²à¸‡à¸§à¸±à¸¥' : 'Rewards'}</span>
      </div>
      <button type="button" class="ce-btn-edit" on:click={() => handleEdit('rewards')}>
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        {t('edit')}
      </button>
    </div>

    <div class="ce-summary-item" style="margin-bottom: 16px;">
      <span class="ce-summary-label">{lang === 'th' ? 'à¸ˆà¸³à¸™à¸§à¸™à¸‚à¸­à¸‡à¸£à¸²à¸‡à¸§à¸±à¸¥à¸—à¸±à¹‰à¸‡à¸«à¸¡à¸”' : 'Total Reward Items'}</span>
      <span class="ce-summary-value-highlight">{formData.totalRewards || 0} {lang === 'th' ? 'à¸Šà¸´à¹‰à¸™' : 'items'}</span>
    </div>

    {#if formData.rewards.length > 0}
      <div class="ce-rewards-grid">
        {#each formData.rewards.sort((a: any, b: any) => (a.requirement || 0) - (b.requirement || 0)) as reward}
          <div class="ce-reward-summary-card">
            <div class="ce-reward-rounds">{reward.requirement || 0} {lang === 'th' ? 'à¸£à¸­à¸š' : 'rounds'}</div>
            <div class="ce-reward-name">{reward.name || '-'}</div>
          </div>
        {/each}
      </div>
    {:else}
      <div class="ce-empty-state">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <span>{lang === 'th' ? 'à¸¢à¸±à¸‡à¹„à¸¡à¹ˆà¸¡à¸µà¸£à¸²à¸‡à¸§à¸±à¸¥' : 'No rewards configured'}</span>
      </div>
    {/if}
  </div>

  {#if error}
    <div class="ce-error-msg">
      âš ï¸ {error}
    </div>
  {/if}

  <div class="ce-nav-buttons">
    <button type="button" class="ce-btn-cancel" on:click={handleBack} disabled={isSubmitting}>
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      {t('back')}
    </button>
    <button type="button" class="ce-btn-save ce-btn-publish" on:click={handleSubmit} disabled={isSubmitting}>
      {#if isSubmitting}
        <div class="btn-loader"></div>
      {:else}
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
      {/if}
      {editingEventId ?
        (lang === 'th' ? 'à¸šà¸±à¸™à¸—à¸¶à¸à¸à¸²à¸£à¹à¸à¹‰à¹„à¸‚' : 'Save Changes') : (lang === 'th' ? 'à¹€à¸œà¸¢à¹à¸žà¸£à¹ˆà¸à¸´à¸ˆà¸à¸£à¸£à¸¡' : 'Publish Event')}
    </button>
  </div>
</div>

<style>
  .ce-summary-header {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 24px;
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(6, 95, 70, 0.05));
    border: 1px solid rgba(16, 185, 129, 0.3);
    border-radius: 20px;
    margin-bottom: 24px;
  }

  .ce-summary-icon {
    width: 56px;
    height: 56px;
    background: rgba(16, 185, 129, 0.15);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .ce-summary-icon svg {
    width: 28px;
    height: 28px;
    color: #10b981;
  }

  .ce-summary-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: #10b981;
    margin: 0 0 4px 0;
  }

  .ce-summary-desc {
    font-size: 0.9rem;
    color: #6ee7b7;
    margin: 0;
  }

  .ce-summary-card {
    position: relative;
  }

  .ce-btn-edit {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    background: rgba(59, 130, 246, 0.1);
    border: 1px solid rgba(59, 130, 246, 0.3);
    border-radius: 10px;
    color: #60a5fa;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .ce-btn-edit:hover {
    background: rgba(59, 130, 246, 0.2);
    border-color: #3b82f6;
  }

  .ce-btn-edit svg {
    width: 16px;
    height: 16px;
  }

  .ce-summary-image {
    width: 100%;
    height: 200px;
    border-radius: 12px;
    overflow: hidden;
    margin-bottom: 20px;
  }

  .ce-summary-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .ce-summary-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .ce-summary-item {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .ce-summary-item.full-width {
    grid-column: 1 / -1;
  }

  .ce-summary-label {
    font-size: 0.75rem;
    color: #94a3b8;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .ce-summary-value {
    font-size: 0.95rem;
    color: #e2e8f0;
    font-weight: 500;
  }

  .ce-summary-value-highlight {
    font-size: 1.1rem;
    color: #10b981;
    font-weight: 700;
  }

  .ce-summary-badge {
    display: inline-flex;
    align-items: center;
    padding: 6px 12px;
    background: rgba(16, 185, 129, 0.15);
    border: 1px solid rgba(16, 185, 129, 0.3);
    border-radius: 8px;
    color: #10b981;
    font-size: 0.85rem;
    font-weight: 600;
    width: fit-content;
  }

  .ce-rewards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 12px;
  }

  .ce-reward-summary-card {
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(234, 88, 12, 0.05));
    border: 1px solid rgba(245, 158, 11, 0.3);
    border-radius: 12px;
    padding: 16px;
    text-align: center;
  }

  .ce-reward-rounds {
    background: rgba(59, 130, 246, 0.2);
    color: #60a5fa;
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 700;
    display: inline-block;
    margin-bottom: 8px;
  }

  .ce-reward-name {
    color: #f0fdf4;
    font-size: 0.9rem;
    font-weight: 600;
  }

  .ce-empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 40px;
    color: #64748b;
  }

  .ce-empty-state svg {
    width: 48px;
    height: 48px;
  }

  .ce-btn-publish {
    background: linear-gradient(135deg, #10b981, #059669);
    box-shadow: 0 8px 16px rgba(16, 185, 129, 0.3);
  }

  .ce-btn-publish:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 12px 24px rgba(16, 185, 129, 0.4);
  }

  .ce-btn-publish:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .btn-loader {
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

  @media (max-width: 768px) {
    .ce-summary-grid {
      grid-template-columns: 1fr;
    }

    .ce-rewards-grid {
      grid-template-columns: 1fr;
    }
  }
</style>

