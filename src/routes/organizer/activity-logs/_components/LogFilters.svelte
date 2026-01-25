<script lang="ts">
  import { appState } from '$lib/stores/appState';
  import { onMount } from 'svelte';
  import api from '$lib/api/client';
  import { endpoints } from '$lib/api/endpoints';
  
  export let actionFilter: string;
  export let eventFilter: string;
  export let dateRange: { start: string; end: string };
  
  $: lang = $appState.currentLang;
  
  let events: any[] = [];
  
  const actions = [
    { value: 'all', label: { th: 'à¸—à¸±à¹‰à¸‡à¸«à¸¡à¸”', en: 'All' } },
    { value: 'check_in', label: { th: 'à¹€à¸Šà¹‡à¸„à¸­à¸´à¸™', en: 'Check-in' } },
    { value: 'check_out', label: { th: 'à¹€à¸Šà¹‡à¸„à¹€à¸­à¸²à¸—à¹Œ', en: 'Check-out' } },
    { value: 'register', label: { th: 'à¸¥à¸‡à¸—à¸°à¹€à¸šà¸µà¸¢à¸™', en: 'Register' } },
    { value: 'approve', label: { th: 'à¸­à¸™à¸¸à¸¡à¸±à¸•à¸´', en: 'Approve' } },
    { value: 'reject', label: { th: 'à¸›à¸à¸´à¹€à¸ªà¸˜', en: 'Reject' } }
  ];
  
  onMount(async () => {
    try {
      const response = await api.get(endpoints.events.list);
      events = response.data;
    } catch (error) {
      console.error('Failed to load events:', error);
    }
  });
</script>

<div class="log-filters">
  <select class="filter-select" bind:value={actionFilter}>
    {#each actions as action}
      <option value={action.value}>{action.label[lang]}</option>
    {/each}
  </select>
  
  <select class="filter-select" bind:value={eventFilter}>
    <option value="all">{lang === 'th' ? 'à¸à¸´à¸ˆà¸à¸£à¸£à¸¡à¸—à¸±à¹‰à¸‡à¸«à¸¡à¸”' : 'All Events'}</option>
    {#each events as event}
      <option value={event.id}>{event.title}</option>
    {/each}
  </select>
  
  <input type="date" class="date-input" bind:value={dateRange.start} placeholder={lang === 'th' ? 'à¸§à¸±à¸™à¸—à¸µà¹ˆà¹€à¸£à¸´à¹ˆà¸¡' : 'Start date'} />
  <input type="date" class="date-input" bind:value={dateRange.end} placeholder={lang === 'th' ? 'à¸§à¸±à¸™à¸—à¸µà¹ˆà¸ªà¸´à¹‰à¸™à¸ªà¸¸à¸”' : 'End date'} />
  
  {#if actionFilter !== 'all' || eventFilter !== 'all' || dateRange.start || dateRange.end}
    <button class="btn-reset" on:click={() => { actionFilter = 'all'; eventFilter = 'all'; dateRange = { start: '', end: '' }; }}>
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      {lang === 'th' ? 'à¸£à¸µà¹€à¸‹à¹‡à¸•' : 'Reset'}
    </button>
  {/if}
</div>

<style>
  .log-filters { display: flex; gap: 0.75rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
  .filter-select, .date-input { padding: 0.75rem 1rem; border: 1px solid var(--border); border-radius: 8px; font-size: 0.875rem; background: white; }
  .filter-select:focus, .date-input:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.1); }
  .btn-reset { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1rem; background: var(--bg-alt); border: 1px solid var(--border); border-radius: 8px; font-size: 0.875rem; cursor: pointer; }
  .btn-reset:hover { background: var(--bg-hover); border-color: var(--primary); }
  .btn-reset svg { width: 16px; height: 16px; }
</style>


