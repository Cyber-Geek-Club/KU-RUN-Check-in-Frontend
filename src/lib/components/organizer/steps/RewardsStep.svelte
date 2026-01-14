<script lang="ts">
  import { 
    eventFormData, 
    validationErrors, 
    totalAllocatedSlots, 
    remainingSlots,
    addRewardTier,
    removeRewardTier,
    updateRewardTier 
  } from '$lib/stores/eventFormStore';
  
  export let currentLang: 'th' | 'en' = 'th';

  // Predefined tier names
  const tierPresets = [
    { name: 'Gold', color: '#fbbf24' },
    { name: 'Silver', color: '#94a3b8' },
    { name: 'Bronze', color: '#d97706' },
    { name: 'Platinum', color: '#a78bfa' },
    { name: 'Diamond', color: '#22d3ee' },
  ];

  function handleAddTier() {
    addRewardTier();
  }

  function handleRemoveTier(id: string) {
    removeRewardTier(id);
  }

  function handleUpdateTier(id: string, field: string, value: any) {
    updateRewardTier(id, { [field]: value });
  }

  // Calculate rank ranges
  $: sortedRewards = [...$eventFormData.rewards].sort((a, b) => b.requirement - a.requirement);
  $: rankedRewards = calculateRanks(sortedRewards);

  function calculateRanks(rewards: typeof $eventFormData.rewards) {
    let currentRank = 1;
    return rewards.map(tier => {
      const rankStart = currentRank;
      const rankEnd = currentRank + tier.quota - 1;
      currentRank = rankEnd + 1;
      return { ...tier, rankStart, rankEnd };
    });
  }

  $: isOverAllocated = $remainingSlots < 0;
  $: allocationPercent = Math.min(100, ($totalAllocatedSlots / $eventFormData.totalSlots) * 100);

  $: getError = (field: string) => {
    return $validationErrors.find(e => e.field === field);
  };
</script>

<div class="rewards-step">
  <!-- Capacity Summary -->
  <div class="capacity-summary">
    <div class="summary-header">
      <h3>{currentLang === 'th' ? 'จำนวนที่รับทั้งหมด' : 'Total Capacity'}</h3>
      <span class="capacity-value">{$eventFormData.totalSlots.toLocaleString()}</span>
    </div>
    
    <div class="allocation-bar">
      <div 
        class="allocation-fill" 
        class:over={isOverAllocated}
        style="width: {allocationPercent}%"
      ></div>
    </div>

    <div class="allocation-info">
      <div class="info-item">
        <span class="info-label">{currentLang === 'th' ? 'จัดสรรแล้ว' : 'Allocated'}</span>
        <span class="info-value" class:over={isOverAllocated}>
          {$totalAllocatedSlots.toLocaleString()}
        </span>
      </div>
      <div class="info-item">
        <span class="info-label">{currentLang === 'th' ? 'คงเหลือ' : 'Remaining'}</span>
        <span class="info-value" class:negative={$remainingSlots < 0}>
          {$remainingSlots.toLocaleString()}
        </span>
      </div>
    </div>

    {#if isOverAllocated}
      <div class="allocation-warning">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
        <span>
          {currentLang === 'th' 
            ? `เกินจำนวนที่รับไป ${Math.abs($remainingSlots).toLocaleString()} คน` 
            : `Exceeded capacity by ${Math.abs($remainingSlots).toLocaleString()}`}
        </span>
      </div>
    {/if}
  </div>

  <!-- Reward Tiers -->
  <div class="tiers-section">
    <div class="section-header">
      <div class="header-left">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <h3>{currentLang === 'th' ? 'ระดับรางวัล' : 'Reward Tiers'}</h3>
      </div>
      <button type="button" class="btn-add-tier" on:click={handleAddTier}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v12m6-6H6"/>
        </svg>
        {currentLang === 'th' ? 'เพิ่มระดับ' : 'Add Tier'}
      </button>
    </div>

    {#if $eventFormData.rewards.length === 0}
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
            d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V6a2 2 0 10-2 2h2zm0 0h4l-4 4-4-4h4z"/>
        </svg>
        <p>{currentLang === 'th' ? 'ยังไม่มีรางวัล กดปุ่มเพิ่มระดับเพื่อเริ่มต้น' : 'No rewards yet. Click Add Tier to start.'}</p>
      </div>
    {:else}
      <div class="tiers-list">
        {#each rankedRewards as tier, index (tier.id)}
          {@const originalTier = $eventFormData.rewards.find(t => t.id === tier.id)}
          <div class="tier-card">
            <div class="tier-header">
              <div class="tier-badge">
                <span class="tier-number">#{index + 1}</span>
              </div>
              <div class="tier-rank">
                {#if tier.quota > 0}
                  <span class="rank-label">{currentLang === 'th' ? 'อันดับ' : 'Rank'}</span>
                  <span class="rank-value">{tier.rankStart} - {tier.rankEnd}</span>
                {/if}
              </div>
              <button 
                type="button" 
                class="btn-remove-tier"
                aria-label="{currentLang === 'th' ? 'ลบระดับรางวัล' : 'Remove reward tier'}"
                on:click={() => handleRemoveTier(tier.id)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div class="tier-body">
              <div class="form-row">
                <div class="form-group">
                  <label for="tier-name-{tier.id}">{currentLang === 'th' ? 'ชื่อรางวัล' : 'Tier Name'}</label>
                  <input
                    id="tier-name-{tier.id}"
                    type="text"
                    value={originalTier?.name || ''}
                    on:input={(e) => handleUpdateTier(tier.id, 'name', e.currentTarget.value)}
                    placeholder={tierPresets[index]?.name || 'Tier Name'}
                  />
                </div>
              </div>

              <div class="form-row two-col">
                <div class="form-group">
                  <label for="tier-quota-{tier.id}">{currentLang === 'th' ? 'โควต้า (คน)' : 'Quota'}</label>
                  <input
                    id="tier-quota-{tier.id}"
                    type="number"
                    min="1"
                    value={originalTier?.quota || 0}
                    on:input={(e) => handleUpdateTier(tier.id, 'quota', parseInt(e.currentTarget.value) || 0)}
                    placeholder="100"
                  />
                </div>
                <div class="form-group">
                  <label for="tier-requirement-{tier.id}">{currentLang === 'th' ? 'เงื่อนไข (รอบ)' : 'Required Rounds'}</label>
                  <input
                    id="tier-requirement-{tier.id}"
                    type="number"
                    min="1"
                    value={originalTier?.requirement || 1}
                    on:input={(e) => handleUpdateTier(tier.id, 'requirement', parseInt(e.currentTarget.value) || 1)}
                    placeholder="1"
                  />
                </div>
              </div>
            </div>

            <div class="tier-preview">
              <div class="preview-item">
                <span class="preview-icon">👤</span>
                <span>{originalTier?.quota || 0} {currentLang === 'th' ? 'คน' : 'users'}</span>
              </div>
              <div class="preview-item">
                <span class="preview-icon">🎯</span>
                <span>{originalTier?.requirement || 1} {currentLang === 'th' ? 'รอบ' : 'rounds'}</span>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Quick Add Presets -->
  {#if $eventFormData.rewards.length < 5}
    <div class="presets-section">
      <span class="presets-label">{currentLang === 'th' ? 'เพิ่มเร็ว:' : 'Quick add:'}</span>
      <div class="presets-buttons">
        {#each tierPresets.slice($eventFormData.rewards.length) as preset}
          <button
            type="button"
            class="preset-btn"
            style="--color: {preset.color}"
            on:click={() => {
              addRewardTier();
              const newId = $eventFormData.rewards[$eventFormData.rewards.length - 1]?.id;
              if (newId) {
                updateRewardTier(newId, { name: preset.name });
              }
            }}
          >
            <span class="preset-dot" style="background: {preset.color}"></span>
            {preset.name}
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .rewards-step {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  /* Capacity Summary */
  .capacity-summary {
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(100, 116, 139, 0.2);
    border-radius: 16px;
    padding: 1.5rem;
  }

  .summary-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .summary-header h3 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: #cbd5e1;
  }

  .capacity-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: #f8fafc;
  }

  .allocation-bar {
    height: 12px;
    background: rgba(100, 116, 139, 0.2);
    border-radius: 6px;
    overflow: hidden;
    margin-bottom: 1rem;
  }

  .allocation-fill {
    height: 100%;
    background: linear-gradient(90deg, #10b981 0%, #059669 100%);
    transition: width 0.3s ease;
    border-radius: 6px;
  }

  .allocation-fill.over {
    background: linear-gradient(90deg, #ef4444 0%, #dc2626 100%);
  }

  .allocation-info {
    display: flex;
    justify-content: space-between;
  }

  .info-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .info-label {
    font-size: 0.8rem;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .info-value {
    font-size: 1.1rem;
    font-weight: 600;
    color: #10b981;
  }

  .info-value.over,
  .info-value.negative {
    color: #ef4444;
  }

  .allocation-warning {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 1rem;
    padding: 0.75rem 1rem;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 8px;
    color: #f87171;
    font-size: 0.9rem;
  }

  .allocation-warning svg {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
  }

  /* Tiers Section */
  .tiers-section {
    background: rgba(15, 23, 42, 0.4);
    border: 1px solid rgba(100, 116, 139, 0.2);
    border-radius: 16px;
    padding: 1.5rem;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .header-left svg {
    width: 22px;
    height: 22px;
    color: #10b981;
  }

  .header-left h3 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: #f8fafc;
  }

  .btn-add-tier {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1rem;
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.3);
    border-radius: 10px;
    color: #10b981;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-add-tier:hover {
    background: rgba(16, 185, 129, 0.2);
    border-color: #10b981;
  }

  .btn-add-tier svg {
    width: 18px;
    height: 18px;
  }

  /* Empty State */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 2rem;
    color: #64748b;
  }

  .empty-state svg {
    width: 64px;
    height: 64px;
    margin-bottom: 1rem;
    opacity: 0.5;
  }

  .empty-state p {
    margin: 0;
    font-size: 0.95rem;
  }

  /* Tiers List */
  .tiers-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .tier-card {
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(100, 116, 139, 0.2);
    border-radius: 14px;
    overflow: hidden;
    transition: all 0.2s ease;
  }

  .tier-card:hover {
    border-color: rgba(16, 185, 129, 0.3);
  }

  .tier-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.25rem;
    background: rgba(100, 116, 139, 0.1);
  }

  .tier-badge {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .tier-number {
    font-size: 0.9rem;
    font-weight: 700;
    color: #f8fafc;
  }

  .tier-rank {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }

  .rank-label {
    font-size: 0.7rem;
    color: #94a3b8;
    text-transform: uppercase;
  }

  .rank-value {
    font-size: 0.9rem;
    font-weight: 600;
    color: #10b981;
  }

  .btn-remove-tier {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.2);
    border-radius: 8px;
    color: #f87171;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-remove-tier:hover {
    background: rgba(239, 68, 68, 0.2);
    border-color: rgba(239, 68, 68, 0.4);
  }

  .btn-remove-tier svg {
    width: 16px;
    height: 16px;
  }

  .tier-body {
    padding: 1.25rem;
  }

  .form-row {
    margin-bottom: 1rem;
  }

  .form-row:last-child {
    margin-bottom: 0;
  }

  .form-row.two-col {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-group label {
    font-size: 0.85rem;
    font-weight: 500;
    color: #94a3b8;
  }

  .form-group input {
    padding: 0.75rem 1rem;
    background: rgba(15, 23, 42, 0.8);
    border: 1px solid rgba(100, 116, 139, 0.3);
    border-radius: 10px;
    color: #f8fafc;
    font-size: 0.95rem;
    transition: all 0.2s ease;
  }

  .form-group input:focus {
    outline: none;
    border-color: #10b981;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
  }

  .tier-preview {
    display: flex;
    gap: 1.5rem;
    padding: 0.75rem 1.25rem;
    background: rgba(16, 185, 129, 0.05);
    border-top: 1px solid rgba(100, 116, 139, 0.1);
  }

  .preview-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    color: #cbd5e1;
  }

  .preview-icon {
    font-size: 1rem;
  }

  /* Presets Section */
  .presets-section {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: rgba(100, 116, 139, 0.1);
    border-radius: 12px;
  }

  .presets-label {
    font-size: 0.9rem;
    color: #94a3b8;
    white-space: nowrap;
  }

  .presets-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .preset-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: #cbd5e1;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .preset-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: var(--color);
  }

  .preset-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }

  @media (max-width: 768px) {
    .form-row.two-col {
      grid-template-columns: 1fr;
    }

    .presets-section {
      flex-direction: column;
      align-items: flex-start;
    }
  }
</style>
