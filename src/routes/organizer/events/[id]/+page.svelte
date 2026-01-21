<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import api from '../../_lib/api/client';
  import { endpoints } from '../../_lib/api/endpoints';
  import LoadingSpinner from '../../_lib/components/LoadingSpinner.svelte';

  let isLoading = true;
  let errorMessage = '';
  let event: any = null;

  $: id = $page.params.id;

  async function loadEvent() {
    isLoading = true;
    errorMessage = '';
    try {
      const resp = await api.get(endpoints.events.get(Number(id)));
      event = resp.data;
    } catch (err: any) {
      console.error('Failed to load event:', err);
      errorMessage = err.response?.data?.message || 'Failed to load event';
    } finally {
      isLoading = false;
    }
  }

  onMount(() => {
    loadEvent();
  });

  function goBack() {
    goto('/organizer/events');
  }
</script>

{#if isLoading}
  <div class="center"><LoadingSpinner size="lg" /></div>
{:else}
  {#if errorMessage}
    <div class="error">{errorMessage}</div>
    <button on:click={goBack}>Back</button>
  {:else}
    <div class="event-details">
      <button class="btn-back" on:click={goBack}>Back</button>
      <h1>{event.title}</h1>
      <p>{event.description}</p>
      <dl>
        <dt>Location</dt>
        <dd>{event.location || '-'}</dd>
        <dt>Start</dt>
        <dd>{event.startDate || '-'}</dd>
        <dt>End</dt>
        <dd>{event.endDate || '-'}</dd>
      </dl>
    </div>
  {/if}
{/if}

<style>
  .center { display:flex; align-items:center; justify-content:center; height:60vh }
  .event-details { max-width:900px; margin:2rem auto; padding:1rem }
  .btn-back { margin-bottom:1rem }
</style>
