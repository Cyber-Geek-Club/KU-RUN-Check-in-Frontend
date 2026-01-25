<script lang="ts">
  import { appState } from '$lib/stores/appState';
  
  export let onExport: (format: 'csv' | 'json') => void;
  
  $: lang = $appState.currentLang;
  
  let showMenu = false;
</script>

<div class="export-button">
  <button class="btn-export" on:click={() => showMenu = !showMenu}>
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
    {lang === 'th' ? 'à¸ªà¹ˆà¸‡à¸­à¸­à¸' : 'Export'}
  </button>
  
  {#if showMenu}
    <div class="menu">
      <button class="menu-item" on:click={() => { onExport('csv'); showMenu = false; }}>
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        CSV
      </button>
      <button class="menu-item" on:click={() => { onExport('json'); showMenu = false; }}>
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
        </svg>
        JSON
      </button>
    </div>
  {/if}
</div>

<style>
  .export-button { position: relative; }
  .btn-export { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1rem; background: white; border: 1px solid var(--border); border-radius: 8px; font-size: 0.875rem; font-weight: 500; cursor: pointer; }
  .btn-export:hover { background: var(--bg-alt); border-color: var(--primary); }
  .btn-export svg { width: 18px; height: 18px; }
  .menu { position: absolute; top: calc(100% + 0.5rem); right: 0; min-width: 150px; background: white; border: 1px solid var(--border); border-radius: 8px; box-shadow: var(--shadow-md); z-index: 10; }
  .menu-item { width: 100%; display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; background: transparent; border: none; text-align: left; cursor: pointer; }
  .menu-item:hover { background: var(--bg-alt); }
  .menu-item svg { width: 16px; height: 16px; }
</style>


