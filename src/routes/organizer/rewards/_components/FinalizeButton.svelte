=== rewards/./_components/FinalizeButton.svelte ===
<script lang="ts">
  import { appState } from '../../_lib/stores/appState';
  
  export let disabled: boolean;
  export let isFinalized: boolean;
  export let onFinalize: () => void;
  
  $: lang = $appState.currentLang;
  
  let showConfirm = false;
  
  function handleClick() {
    if (isFinalized) return;
    showConfirm = true;
  }
  
  function handleConfirm() {
    onFinalize();
    showConfirm = false;
  }
</script>

<div class="finalize-button">
  <button 
    class="btn-finalize" 
    class:finalized={isFinalized}
    {disabled}
    on:click={handleClick}
  >
    {#if isFinalized}
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {lang === 'th' ? 'ยืนยันแล้ว' : 'Finalized'}
    {:else}
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>
      {lang === 'th' ? 'ยืนยันรางวัล' : 'Finalize Rewards'}
    {/if}
  </button>
  
  {#if showConfirm}
    <div class="confirm-overlay" on:click={() => showConfirm = false} on:keypress role="button" tabindex="0">
      <div class="confirm-dialog" on:click|stopPropagation on:keypress role="button" tabindex="0">
        <h3>{lang === 'th' ? 'ยืนยันการดำเนินการ' : 'Confirm Action'}</h3>
        <p>{lang === 'th' ? 'คุณแน่ใจหรือไม่ที่จะยืนยันรางวัล? การดำเนินการนี้ไม่สามารถย้อนกลับได้' : 'Are you sure you want to finalize rewards? This action cannot be undone.'}</p>
        <div class="confirm-actions">
          <button class="btn-cancel" on:click={() => showConfirm = false}>{lang === 'th' ? 'ยกเลิก' : 'Cancel'}</button>
          <button class="btn-confirm" on:click={handleConfirm}>{lang === 'th' ? 'ยืนยัน' : 'Confirm'}</button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .btn-finalize { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.5rem; background: var(--success); color: white; border: none; border-radius: 8px; font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
  .btn-finalize:hover:not(:disabled) { transform: translateY(-1px); box-shadow: var(--shadow-md); }
  .btn-finalize:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn-finalize.finalized { background: var(--text-muted); cursor: default; }
  .btn-finalize svg { width: 18px; height: 18px; }
  .confirm-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; z-index: 100; }
  .confirm-dialog { background: white; border-radius: 12px; padding: 1.5rem; max-width: 400px; width: 90%; }
  .confirm-dialog h3 { margin: 0 0 1rem; font-size: 1.25rem; font-weight: 600; }
  .confirm-dialog p { margin: 0 0 1.5rem; color: var(--text-muted); }
  .confirm-actions { display: flex; gap: 0.75rem; justify-content: flex-end; }
  .btn-cancel, .btn-confirm { padding: 0.625rem 1.25rem; border-radius: 8px; font-size: 0.875rem; font-weight: 600; cursor: pointer; }
  .btn-cancel { background: transparent; border: 1px solid var(--border); }
  .btn-confirm { background: var(--success); color: white; border: none; }
</style>