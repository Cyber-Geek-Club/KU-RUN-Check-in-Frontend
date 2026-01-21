<script lang="ts">
  import { goto } from '$app/navigation';
  import { eventForm } from '../../_lib/stores/eventForm';
  import { appState } from '../../_lib/stores/appState';
  import { t } from '../../_lib/i18n';
  import { onMount } from 'svelte';
  
  $: lang = $appState.currentLang;
  
  type Reward = {
    name: string;
    requirement: number | null;
  };
  
  let ce_formData = {
    totalSlots: null as number | null,
    totalRewards: null as number | null,
    rewards: [{ name: '', requirement: null }] as Reward[]
  };
  
  let ce_validationErrors = new Set<string>();
  
  onMount(() => {
    const storeData = $eventForm as any;
    if (storeData.totalRewards) {
      ce_formData = { ...storeData };
    }
  });
  
  function ce_addTier() {
    ce_formData.rewards = [...ce_formData.rewards, { name: '', requirement: null }];
  }
  
  function ce_removeTier(index: number) {
    if (ce_formData.rewards.length > 1) {
      ce_formData.rewards.splice(index, 1);
      ce_formData.rewards = [...ce_formData.rewards];
    }
  }
  
  function ce_noNegative(e: Event) {
    const input = e.target as HTMLInputElement;
    if (Number(input.value) < 0) input.value = '0';
  }
  
  function validateForm(): boolean {
    ce_validationErrors.clear();
    
    if (!ce_formData.totalRewards || ce_formData.totalRewards <= 0) {
      ce_validationErrors.add('totalRewards');
    }
    
    const hasValidReward = ce_formData.rewards.some(r => r.name && r.requirement && r.requirement > 0);
    if (!hasValidReward) {
      ce_validationErrors.add('rewards');
    }
    
    ce_validationErrors = new Set(ce_validationErrors);
    return ce_validationErrors.size === 0;
  }
  
  function handleNext() {
    if (!validateForm()) {
      return;
    }
    
    eventForm.set({ ...$eventForm, ...ce_formData } as any);
    goto('/organizer/create-event/summary');
  }
  
  function handleBack() {
    eventForm.set({ ...$eventForm, ...ce_formData } as any);
    goto('/organizer/create-event/capacity');
  }
</script>

<div class="ce-grid-layout">
  <!-- Rewards Card -->
  <div class="ce-card ce-config-card" class:ce-locked-card={!ce_formData.totalSlots} class:error={ce_validationErrors.has('rewards')}>
    {#if !ce_formData.totalSlots}
      <div class="ce-lock-overlay">
        <svg class="ce-lock-icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
        </svg>
        <span>Enter <b>Total Capacity</b> first to unlock rewards.</span>
      </div>
    {/if}

    <div class="ce-card-head">
      <svg class="ce-icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
      <span>{t('rewardsDistribution')}</span>
    </div>

    <div class="ce-rewards-section">
      <!-- Total Rewards -->
      <div class="ce-total-rewards-row">
        <div class="ce-field-group" style="flex: 1;">
          <label for="ce_totalRewards" style="display: flex; align-items: center; gap: 8px; color: #f59e0b; font-weight: 600;">
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
            </svg>
            {lang === 'th' ? 'จำนวนของรางวัลทั้งหมด' : 'Total Reward Items'}
          </label>
          <div style="display: flex; align-items: center; gap: 8px; margin-top: 8px;">
            <input id="ce_totalRewards" type="number" min="1" bind:value={ce_formData.totalRewards} on:input={ce_noNegative} class="ce-input-compact" placeholder={lang === 'th' ? 'เช่น 100 ชิ้น' : 'e.g. 100 items'} style="max-width: 200px;" />
            <span class="ce-unit-label">{lang === 'th' ? 'ชิ้น' : 'items'}</span>
          </div>
        </div>
      </div>

      <!-- Info Box -->
      <div class="ce-reward-info-box">
        <div style="display: flex; align-items: flex-start; gap: 12px;">
          <div class="ce-info-icon">
            <svg width="20" height="20" fill="none" stroke="#3b82f6" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <div style="flex: 1;">
            <div class="ce-info-title">{lang === 'th' ? 'วิธีการแจกรางวัล' : 'How Rewards Work'}</div>
            <div class="ce-info-desc">{lang === 'th' ? 'ผู้ที่วิ่งครบตามจำนวนรอบของแต่ละ Tier จะได้รับรางวัลนั้น (ใครครบก่อนได้ก่อน) จนกว่าของรางวัลจะหมด' : 'Participants who complete required rounds for each tier will receive that reward (first come first served) until items run out'}</div>
          </div>
        </div>
      </div>

      <!-- Tier Cards -->
      <div class="ce-stack">
        {#each ce_formData.rewards as reward, i}
          <div class="ce-tier-card">
            <div class="ce-tier-header">
              <span class="ce-badge">
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5" style="margin-right: 4px;">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path>
                </svg>
                Tier {i + 1}
              </span>
              {#if ce_formData.rewards.length > 1}
                <button type="button" class="ce-btn-remove" on:click={() => ce_removeTier(i)} title={t('removeTier')}>×</button>
              {/if}
            </div>
            <div class="ce-tier-body">
              <div class="ce-tier-field">
                <label for="ce_name_{i}">
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" style="margin-right: 4px; vertical-align: middle;">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
                  </svg>
                  {lang === 'th' ? 'ชื่อรางวัล' : 'Reward Name'}
                </label>
                <input id="ce_name_{i}" type="text" bind:value={reward.name} placeholder={lang === 'th' ? 'เช่น 🥇 Premium Shoes' : 'e.g. 🥇 Premium Shoes'} class="ce-input-compact" />
              </div>
              <div class="ce-tier-field">
                <label for="ce_req_{i}">
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" style="margin-right: 4px; vertical-align: middle;">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                  </svg>
                  {lang === 'th' ? 'วิ่งครบกี่รอบ?' : 'Rounds Required'}
                </label>
                <input id="ce_req_{i}" type="number" min="1" bind:value={reward.requirement} on:input={ce_noNegative} placeholder={lang === 'th' ? 'เช่น 5' : 'e.g. 5'} class="ce-input-compact" />
              </div>
            </div>
          </div>
        {/each}
      </div>

      <button type="button" class="ce-btn-dashed" on:click={ce_addTier}>
        + {lang === 'th' ? 'เพิ่ม Tier ใหม่' : 'Add New Tier'}
      </button>

      <!-- Summary Box -->
      {#if ce_formData.rewards.some(r => r.name && r.requirement)}
        <div class="ce-summary-box">
          <div style="display: flex; align-items: flex-start; gap: 12px;">
            <div class="ce-success-icon">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div style="flex: 1;">
              <div class="ce-summary-title">{lang === 'th' ? 'สรุป Reward Tiers' : 'Reward Tiers Summary'}</div>
              <div class="ce-summary-content">
                {#each ce_formData.rewards.filter(r => r.name && r.requirement) as reward}
                  <div class="ce-summary-item">
                    <span class="ce-summary-rounds">{reward.requirement} {lang === 'th' ? 'รอบ' : 'rounds'}</span>
                    <span>→</span>
                    <span class="ce-summary-name">{reward.name}</span>
                  </div>
                {/each}
                <div class="ce-summary-total">
                  {lang === 'th' ? 'ของรางวัลทั้งหมด:' : 'Total reward items:'}
                  <strong>{ce_formData.totalRewards || 0}</strong>
                  {lang === 'th' ? 'ชิ้น (แชร์ทุก Tier)' : 'items (shared across all tiers)'}
                </div>
              </div>
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>

  <!-- Navigation Buttons -->
  <div class="ce-nav-buttons">
    <button type="button" class="ce-btn-cancel" on:click={handleBack}>
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      {t('back')}
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
 
  
  .ce-rewards-section {
    margin-top: 1.5rem;
  }

  .ce-total-rewards-row {
    display: flex;
    margin-bottom: 20px;
  }

  .ce-reward-info-box {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.05));
    border: 1px solid rgba(59, 130, 246, 0.3);
    border-radius: 12px;
    padding: 16px;
    margin: 16px 0;
  }

  .ce-info-icon {
    width: 36px;
    height: 36px;
    background: rgba(59, 130, 246, 0.15);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .ce-info-title {
    font-size: 14px;
    font-weight: 600;
    color: #60a5fa;
    margin-bottom: 6px;
  }

  .ce-info-desc {
    font-size: 13px;
    color: #93c5fd;
    line-height: 1.6;
  }

  .ce-stack {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .ce-tier-card {
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(234, 88, 12, 0.04));
    border: 1px solid rgba(245, 158, 11, 0.3);
    border-radius: 14px;
    padding: 0;
    overflow: hidden;
    transition: all 0.2s ease;
  }

  .ce-tier-card:hover {
    border-color: #10b981;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
  }

  .ce-tier-header {
    background: rgba(51, 65, 85, 0.3);
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    border-bottom: 1px solid #334155;
  }

  .ce-badge {
    background: linear-gradient(135deg, #f59e0b, #d97706);
    color: white;
    padding: 5px 12px;
    border-radius: 8px;
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.5px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    display: flex;
    align-items: center;
  }

  .ce-btn-remove {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #ef4444;
    width: 28px;
    height: 28px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1.3rem;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    margin-left: auto;
  }

  .ce-btn-remove:hover {
    background: #ef4444;
    color: white;
    transform: scale(1.05);
  }

  .ce-tier-body {
    padding: 16px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    align-items: end;
  }

  .ce-tier-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .ce-tier-field label {
    font-size: 0.75rem;
    color: #94a3b8;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin: 0;
    white-space: nowrap;
  }

  .ce-input-compact {
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: 10px;
    padding: 0 12px;
    height: 42px;
    color: white;
    font-size: 0.9rem;
    transition: all 0.2s;
    width: 100%;
  }

  .ce-input-compact:focus {
    border-color: #10b981;
    outline: none;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
  }

  .ce-input-compact::placeholder {
    color: #475569;
    font-size: 0.85rem;
  }

  .ce-btn-dashed {
    width: 100%;
    border: 1px dashed #475569;
    background: transparent;
    color: #94a3b8;
    padding: 12px;
    border-radius: 12px;
    cursor: pointer;
    margin-top: 15px;
    transition: 0.2s;
    font-weight: 500;
  }

  .ce-btn-dashed:hover {
    border-color: #10b981;
    color: #10b981;
    background: rgba(16, 185, 129, 0.05);
  }

  .ce-summary-box {
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(6, 95, 70, 0.05));
    border: 1px solid rgba(16, 185, 129, 0.3);
    border-radius: 12px;
    padding: 16px;
    margin-top: 20px;
  }

  .ce-success-icon {
    width: 36px;
    height: 36px;
    background: rgba(16, 185, 129, 0.15);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .ce-summary-title {
    font-size: 14px;
    font-weight: 600;
    color: #34d399;
    margin-bottom: 8px;
  }

  .ce-summary-content {
    font-size: 12px;
    color: #6ee7b7;
    line-height: 1.8;
  }

  .ce-summary-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 0;
  }

  .ce-summary-rounds {
    background: rgba(59, 130, 246, 0.2);
    color: #60a5fa;
    padding: 2px 8px;
    border-radius: 4px;
    font-weight: 600;
  }

  .ce-summary-name {
    color: #f0fdf4;
  }

  .ce-summary-total {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid rgba(16, 185, 129, 0.2);
    color: #a7f3d0;
  }

  .ce-summary-total strong {
    color: #10b981;
  }

  @media (max-width: 768px) {
    .ce-tier-body {
      grid-template-columns: 1fr;
    }
  }
</style>