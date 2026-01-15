<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import Swal from 'sweetalert2';
  
  // Import components
  import OrganizerLayout from '$lib/components/organizer/OrganizerLayout.svelte';
  import CreateEventWizard from '$lib/components/organizer/CreateEventWizard.svelte';
  
  // Import stores and API
  import { currentLang, lang, decodeJWT } from '$lib/stores/organizerStore';
  import { createEvent, API_BASE_URL } from '$lib/api/organizerApi';
  import { resetForm } from '$lib/stores/eventFormStore';
  
  // Auth check
  let isAuthorized = false;
  let isLoading = true;

  // Get current language
  let langValue: 'th' | 'en';
  currentLang.subscribe(v => langValue = v);
  
  // Get translations
  let t: typeof import('$lib/stores/organizerStore').translations.th;
  lang.subscribe(v => t = v);

  onMount(() => {
    checkAuth();
  });

  function checkAuth() {
    const token = typeof localStorage !== 'undefined' 
      ? localStorage.getItem('access_token') 
      : null;
      
    if (!token) {
      goto('/auth/login');
      return;
    }

    const decoded = decodeJWT(token);
    if (!decoded || !decoded.exp) {
      localStorage.removeItem('access_token');
      goto('/auth/login');
      return;
    }

    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp < now) {
      localStorage.removeItem('access_token');
      goto('/auth/login');
      return;
    }

    isAuthorized = true;
    isLoading = false;
  }

  async function handleSubmit(data: any) {
    try {
      // Create FormData for multipart upload
      const formData = new FormData();
      
      // Add basic fields
      formData.append('title', data.title);
      formData.append('description', data.description || '');
      formData.append('location', data.location || '');
      formData.append('start_date', data.startDate);
      formData.append('end_date', data.endDate);
      formData.append('start_time', data.startTime);
      formData.append('end_time', data.endTime);
      formData.append('capacity', data.capacity.toString());
      formData.append('distance', (data.distance || 0).toString());
      formData.append('is_public', data.isPublic ? 'true' : 'false');
      formData.append('is_active', data.isActive ? 'true' : 'false');
      formData.append('event_type', data.eventType || 'single');
      formData.append('max_checkins_per_user', (data.maxCheckinsPerUser || 1).toString());
      
      // Add holidays
      if (data.holidays && data.holidays.length > 0) {
        formData.append('holidays', JSON.stringify(data.holidays));
      }
      
      // Add rewards
      if (data.rewards && data.rewards.length > 0) {
        formData.append('rewards', JSON.stringify(data.rewards));
      }
      
      // Add image if exists
      if (data.imageFile) {
        formData.append('image', data.imageFile);
      }

      await createEvent(formData);
      
      await Swal.fire({
        icon: 'success',
        title: t.success,
        text: t.eventCreated,
        timer: 2000,
        showConfirmButton: false
      });
      
      // Reset form and go back
      resetForm();
      goto('/organizer/create-event');
      
    } catch (error: any) {
      console.error('Error creating event:', error);
      
      await Swal.fire({
        icon: 'error',
        title: t.error,
        text: error.response?.data?.message || error.message || t.somethingWentWrong
      });
      
      throw error; // Re-throw to let wizard handle loading state
    }
  }

  function handleCancel() {
    resetForm();
    // Stay on same page or go to event list
    // For now, just reset the form
  }
</script>

<svelte:head>
  <title>{t.createEvent} | KU RUN</title>
</svelte:head>

<OrganizerLayout>
  {#if isLoading}
    <div class="loading-container">
      <div class="spinner"></div>
      <p>{t.loading}</p>
    </div>
  {:else if isAuthorized}
    <div class="page-container">
      <CreateEventWizard
        currentLang={langValue}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  {:else}
    <div class="unauthorized-container">
      <p>{t.error}</p>
    </div>
  {/if}
</OrganizerLayout>

<style>
  .page-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem;
  }

  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    gap: 1rem;
  }

  .spinner {
    width: 48px;
    height: 48px;
    border: 4px solid rgba(16, 185, 129, 0.2);
    border-top-color: #10b981;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .loading-container p {
    color: #94a3b8;
    font-size: 1rem;
  }

  .unauthorized-container {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    color: #ef4444;
  }

  @media (min-width: 768px) {
    .page-container {
      padding: 2rem;
    }
  }
</style>
