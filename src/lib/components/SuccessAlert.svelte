<script lang="ts">
  export let message: string;
  export let title: string = 'Success';
  export let dismissible: boolean = true;
  export let onDismiss: (() => void) | undefined = undefined;
  export let autoDismiss: boolean = false;
  export let autoDismissDelay: number = 3000;
  
  if (autoDismiss && onDismiss) {
    setTimeout(() => {
      onDismiss?.();
    }, autoDismissDelay);
  }
</script>

<div class="success-alert">
  <div class="success-icon">
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  </div>
  
  <div class="success-content">
    <h4 class="success-title">{title}</h4>
    <p class="success-text">{message}</p>
  </div>
  
  {#if dismissible}
    <button class="dismiss-btn" on:click={onDismiss} aria-label="Dismiss">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>
  {/if}
</div>

<style>
  .success-alert {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1rem;
    background: #d1fae5;
    border: 1px solid #6ee7b7;
    border-radius: 8px;
    color: #065f46;
  }
  
  .success-icon {
    flex-shrink: 0;
    width: 24px;
    height: 24px;
  }
  
  .success-content {
    flex: 1;
  }
  
  .success-title {
    font-size: 0.875rem;
    font-weight: 600;
    margin-bottom: 0.25rem;
  }
  
  .success-text {
    font-size: 0.875rem;
    color: #047857;
  }
  
  .dismiss-btn {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
    padding: 0;
    background: transparent;
    border: none;
    cursor: pointer;
    color: #065f46;
    opacity: 0.7;
    transition: opacity 0.2s;
  }
  
  .dismiss-btn:hover {
    opacity: 1;
  }
</style>