<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { ROUTES } from '$lib/utils/routes';

  onMount(() => {
    goto(ROUTES.organizer.eventList);
  });
</script>

<svelte:head>
  <title>Organizer</title>
</svelte:head>

<div style="padding:24px; text-align:center; color:var(--surface-1, #fff);">
  Redirecting to organizer events...
</div>
