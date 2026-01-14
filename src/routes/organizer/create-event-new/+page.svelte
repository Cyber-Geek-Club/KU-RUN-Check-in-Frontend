<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import Swal from 'sweetalert2';
  import OrganizerLayout from '$lib/components/organizer/OrganizerLayout.svelte';
  import CreateEventWizard from '$lib/components/organizer/CreateEventWizard.svelte';
  import { resetForm, eventFormData } from '$lib/stores/eventFormStore';
  import { currentLang, lang } from '$lib/stores/organizerStore';
  import { ROUTES } from '$lib/utils/routes';
  import axios from 'axios';

  const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

  // Axios instance
  const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Add auth header
  api.interceptors.request.use((config) => {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  let langValue: 'th' | 'en' = 'th';
  currentLang.subscribe(v => langValue = v);

  let t: typeof import('$lib/stores/organizerStore').translations.th;
  lang.subscribe(v => t = v);

  // Convert Bangkok time to UTC ISO string
  function createUTCISOFromBangkok(dateStr: string, timeStr: string): string {
    const [yearStr, monthStr, dayStr] = dateStr.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);
    const timeParts = timeStr.trim().split(':');
    const hour = parseInt(timeParts[0].trim(), 10);
    const minute = parseInt(timeParts[1].trim(), 10);
    
    const bangkokTimestamp = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
    const bangkokOffsetMs = 7 * 60 * 60 * 1000;
    const utcTimestamp = bangkokTimestamp - bangkokOffsetMs;
    
    return new Date(utcTimestamp).toISOString();
  }

  async function handleSubmit(formData: typeof $eventFormData) {
    try {
      // Prepare payload
      const payload = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        start_datetime: createUTCISOFromBangkok(formData.startDate, formData.startTime),
        end_datetime: createUTCISOFromBangkok(formData.endDate, formData.endTime),
        total_slots: formData.totalSlots,
        distance_km: formData.distanceKm,
        event_type: formData.eventType,
        max_checkins_per_user: formData.maxCheckinsPerUser,
        is_public: formData.isPublic,
        is_active: formData.isActive,
        holiday_type: formData.holidayType,
        exclude_weekends: formData.excludeWeekends,
        specific_dates: formData.specificDates,
        rewards: formData.rewards.map((tier, index) => ({
          name: tier.name,
          quota: tier.quota,
          requirement: tier.requirement,
          tier_order: index + 1,
        })),
      };

      // Create event
      const response = await api.post('/api/events/', payload);

      // Upload image if exists
      if (formData.imageFile && response.data?.id) {
        const imageFormData = new FormData();
        imageFormData.append('file', formData.imageFile);
        
        try {
          await api.post(`/api/events/${response.data.id}/image`, imageFormData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        } catch (imgErr) {
          console.warn('Failed to upload image:', imgErr);
        }
      }

      // Success
      await Swal.fire({
        icon: 'success',
        title: langValue === 'th' ? 'สร้างกิจกรรมสำเร็จ!' : 'Event Created!',
        text: langValue === 'th' 
          ? 'กิจกรรมของคุณถูกสร้างเรียบร้อยแล้ว' 
          : 'Your event has been created successfully',
        background: '#1e293b',
        color: '#fff',
        confirmButtonColor: '#10b981',
        timer: 2500,
        timerProgressBar: true,
      });

      resetForm();
      goto(ROUTES.organizer.eventLog);

    } catch (error: any) {
      console.error('Create event error:', error);
      
      const errorMessage = error.response?.data?.detail || error.message || 'Unknown error';
      
      await Swal.fire({
        icon: 'error',
        title: langValue === 'th' ? 'เกิดข้อผิดพลาด' : 'Error',
        text: errorMessage,
        background: '#1e293b',
        color: '#fff',
        confirmButtonColor: '#ef4444',
      });

      throw error;
    }
  }

  function handleCancel() {
    goto(ROUTES.organizer.eventLog);
  }

  onMount(() => {
    // Check auth
    const token = localStorage.getItem('access_token');
    if (!token) {
      goto(ROUTES.auth.login);
    }
  });
</script>

<OrganizerLayout>
  <div class="create-event-page">
    <CreateEventWizard 
      currentLang={langValue}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
    />
  </div>
</OrganizerLayout>

<style>
  .create-event-page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem;
  }

  @media (min-width: 768px) {
    .create-event-page {
      padding: 2rem;
    }
  }
</style>
