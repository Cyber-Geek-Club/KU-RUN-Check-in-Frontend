<script lang="ts">
  export let show: boolean = false;
  export let title: string = 'Confirm';
  export let message: string;
  export let confirmText: string = 'Confirm';
  export let cancelText: string = 'Cancel';
  export let confirmColor: string = 'var(--primary)';
  export let onConfirm: () => void;
  export let onCancel: () => void;
  
  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  }

  function handleBackdropKeydown(e: KeyboardEvent) {
    const key = e.key;
    if (key === 'Enter' || key === ' ' || key === 'Spacebar') {
      const target = e.target as EventTarget;
      if (target === e.currentTarget) {
        e.preventDefault();
        onCancel();
      }
    }
  }
</script>

{#if show}
  <div
    class="modal-backdrop"
    role="button"
    tabindex="0"
    aria-label="Close dialog"
    on:click={handleBackdropClick}
    on:keydown={handleBackdropKeydown}
  >
    <div class="modal-content" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
      <div class="modal-header">
        <h3 id="confirm-dialog-title" class="modal-title">{title}</h3>
        <button class="close-btn" on:click={onCancel} aria-label="Close">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      
      <div class="modal-body">
        <p>{message}</p>
      </div>
      
      <div class="modal-footer">
        <button class="btn btn-cancel" on:click={onCancel}>
          {cancelText}
        </button>
        <button 
          class="btn btn-confirm" 
          style="background-color: {confirmColor};"
          on:click={onConfirm}
        >
          {confirmText}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }
  
  .modal-content {
    background: white;
    border-radius: 12px;
    box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1);
    max-width: 500px;
    width: 100%;
    overflow: hidden;
  }
  
  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.5rem;
    border-bottom: 1px solid var(--border);
  }
  
  .modal-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text);
  }
  
  .close-btn {
    width: 32px;
    height: 32px;
    padding: 0;
    background: transparent;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    color: var(--text-muted);
    transition: all 0.2s;
  }
  
  .close-btn:hover {
    background: var(--bg-hover);
    color: var(--text);
  }
  
  .close-btn svg {
    width: 20px;
    height: 20px;
  }
  
  .modal-body {
    padding: 1.5rem;
  }
  
  .modal-body p {
    color: var(--text);
    line-height: 1.6;
  }
  
  .modal-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.75rem;
    padding: 1.5rem;
    border-top: 1px solid var(--border);
    background: var(--bg-alt);
  }
  
  .btn {
    padding: 0.625rem 1.25rem;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
  }
  
  .btn-cancel {
    background: transparent;
    border: 1px solid var(--border);
    color: var(--text);
  }
  
  .btn-cancel:hover {
    background: var(--bg-hover);
  }
  
  .btn-confirm {
    background: var(--primary);
    color: white;
  }
  
  .btn-confirm:hover {
    opacity: 0.9;
  }
</style>