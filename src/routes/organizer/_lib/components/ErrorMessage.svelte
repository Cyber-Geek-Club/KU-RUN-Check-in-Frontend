<script lang="ts">
  export let message: string;
  export let title: string = 'Error';
  export let dismissible: boolean = true;
  export let onDismiss: (() => void) | undefined = undefined;
</script>

<div class="error-message">
  <div class="error-icon">
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  </div>
  
  <div class="error-content">
    <h4 class="error-title">{title}</h4>
    <p class="error-text">{message}</p>
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
  .error-message {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1rem;
    background: #fee2e2;
    border: 1px solid #fca5a5;
    border-radius: 8px;
    color: #991b1b;
  }
  
  .error-icon {
    flex-shrink: 0;
    width: 24px;
    height: 24px;
  }
  
  .error-content {
    flex: 1;
  }
  
  .error-title {
    font-size: 0.875rem;
    font-weight: 600;
    margin-bottom: 0.25rem;
  }
  
  .error-text {
    font-size: 0.875rem;
    color: #7f1d1d;
  }
  
  .dismiss-btn {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
    padding: 0;
    background: transparent;
    border: none;
    cursor: pointer;
    color: #991b1b;
    opacity: 0.7;
    transition: opacity 0.2s;
  }
  
  .dismiss-btn:hover {
    opacity: 1;
  }
</style>