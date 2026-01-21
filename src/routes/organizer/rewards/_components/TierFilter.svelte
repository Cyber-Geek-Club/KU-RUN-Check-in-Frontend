=== rewards/./_components/TierFilter.svelte ===
<script lang="ts">
  import { appState } from '../../_lib/stores/appState';
  
  export let selectedTier: string;
  export let tiers: any[];
  
  $: lang = $appState.currentLang;
</script>

<div class="tier-filter">
  <div class="filter-label">{lang === 'th' ? 'กรองตามระดับ' : 'Filter by Tier'}</div>
  <div class="tier-buttons">
    <button 
      class="tier-btn" 
      class:active={selectedTier === 'all'}
      on:click={() => selectedTier = 'all'}
    >
      {lang === 'th' ? 'ทั้งหมด' : 'All'}
    </button>
    {#each tiers as tier}
      <button 
        class="tier-btn" 
        class:active={selectedTier === tier.name}
        on:click={() => selectedTier = tier.name}
      >
        {tier.name}
      </button>
    {/each}
  </div>
</div>

<style>
  .tier-filter { display: flex; flex-direction: column; gap: 0.5rem; }
  .tier-filter .filter-label { font-size: 0.875rem; font-weight: 600; color: var(--text); }
  .tier-buttons { display: flex; gap: 0.5rem; flex-wrap: wrap; }
  .tier-btn { padding: 0.625rem 1rem; background: white; border: 1px solid var(--border); border-radius: 8px; font-size: 0.875rem; font-weight: 500; cursor: pointer; transition: all 0.2s; }
  .tier-btn:hover { background: var(--bg-alt); border-color: var(--primary); }
  .tier-btn.active { background: var(--primary); color: white; border-color: var(--primary); }
</style>