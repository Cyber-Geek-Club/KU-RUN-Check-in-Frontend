=== rewards/./_components/MessageModal.svelte ===
<script lang="ts">
  import { appState } from '../../_lib/stores/appState';
  
  export let show: boolean;
  export let recipientCount: number;
  export let onSend: (message: string) => void;
  export let onClose: () => void;
  
  $: lang = $appState.currentLang;
  
  let message = '';
  
  function handleSend() {
    if (!message.trim()) return;
    onSend(message);
    message = '';
    onClose();
  }
</script>

{#if show}
  <div class="modal-overlay" on:click={onClose} on:keypress role="button" tabindex="0">
    <div class="modal-content" on:click|stopPropagation on:keypress role="button" tabindex="0">
      <div class="modal-header">
        <h3>{lang === 'th' ? 'ส่งข้อความ' : 'Send Message'}</h3>
        <button class="btn-close" aria-label={lang === 'th' ? 'ปิด' : 'Close'} on:click={onClose}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div class="modal-body">
        <p class="recipient-info">
          {lang === 'th' ? 'ส่งถึง' : 'Send to'}: <strong>{recipientCount}</strong> {lang === 'th' ? 'คน' : 'recipients'}
        </p>
        
        <textarea 
          class="message-input"
          rows="6"
          placeholder={lang === 'th' ? 'กรอกข้อความ...' : 'Enter message...'}
          bind:value={message}
        ></textarea>
        
        <div class="modal-actions">
          <button class="btn-cancel" on:click={onClose}>{lang === 'th' ? 'ยกเลิก' : 'Cancel'}</button>
          <button class="btn-send" disabled={!message.trim()} on:click={handleSend}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            {lang === 'th' ? 'ส่ง' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; z-index: 100; }
  .modal-content { background: white; border-radius: 12px; max-width: 500px; width: 90%; max-height: 80vh; overflow: hidden; }
  .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 1.5rem; border-bottom: 1px solid var(--border); }
  .modal-header h3 { margin: 0; font-size: 1.25rem; font-weight: 600; }
  .btn-close { width: 32px; height: 32px; padding: 0; background: transparent; border: none; border-radius: 6px; cursor: pointer; }
  .btn-close:hover { background: var(--bg-alt); }
  .btn-close svg { width: 20px; height: 20px; }
  .modal-body { padding: 1.5rem; }
  .recipient-info { font-size: 0.875rem; color: var(--text-muted); margin: 0 0 1rem; }
  .recipient-info strong { color: var(--text); }
  .message-input { width: 100%; padding: 0.75rem; border: 1px solid var(--border); border-radius: 8px; font-size: 0.875rem; resize: vertical; margin-bottom: 1rem; }
  .message-input:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.1); }
  .modal-actions { display: flex; gap: 0.75rem; justify-content: flex-end; }
  .btn-cancel, .btn-send { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.25rem; border-radius: 8px; font-size: 0.875rem; font-weight: 600; cursor: pointer; }
  .btn-cancel { background: transparent; border: 1px solid var(--border); }
  .btn-send { background: var(--primary); color: white; border: none; }
  .btn-send:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn-send svg { width: 16px; height: 16px; }
</style>