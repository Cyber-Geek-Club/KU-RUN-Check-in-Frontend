=== ./+page.svelte ===
<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  
  onMount(() => {
    goto('/organizer/create-event/general', { replaceState: true });
  });
</script>