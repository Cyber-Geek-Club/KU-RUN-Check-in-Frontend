# 🚀 Quick Start Guide - Create Event Wizard

## ⚡ เริ่มต้นใช้งาน 5 นาที

### 1️⃣ Import และใช้งาน

```svelte
<!-- src/routes/organizer/create-event/+page.svelte -->
<script lang="ts">
  import CreateEventWizard from '$lib/components/organizer/CreateEventWizard.svelte';
  import Swal from 'sweetalert2';

  let currentLang: 'th' | 'en' = 'th';

  async function handleSubmit(data) {
    console.log('Submitting:', data);
    
    // TODO: Call your API
    // const response = await api.post('/api/events', data);
    
    Swal.fire({
      icon: 'success',
      title: 'สำเร็จ!',
      text: 'สร้างกิจกรรมเรียบร้อยแล้ว'
    });
  }

  function handleCancel() {
    // Go back to event list
    window.history.back();
  }
</script>

<CreateEventWizard
  {currentLang}
  onSubmit={handleSubmit}
  onCancel={handleCancel}
/>
```

---

## 📁 ไฟล์ที่ต้องมี

```
✅ src/lib/stores/eventFormStore.ts
✅ src/lib/components/organizer/CreateEventWizard.svelte
✅ src/lib/components/organizer/steps/BasicInfoStep.svelte
🚧 src/lib/components/organizer/steps/ScheduleStep.svelte (ต้องสร้างเอง)
🚧 src/lib/components/organizer/steps/RewardsStep.svelte (ต้องสร้างเอง)
🚧 src/lib/components/organizer/steps/ReviewStep.svelte (ต้องสร้างเอง)
```

---

## 🔧 สร้าง Steps ที่เหลือ

### Step 2: ScheduleStep.svelte (แนะนำ)

```svelte
<script lang="ts">
  import { eventFormData } from '$lib/stores/eventFormStore';
  export let currentLang: 'th' | 'en' = 'th';
</script>

<div class="schedule-step">
  <h3>{currentLang === 'th' ? 'กำหนดการ' : 'Schedule'}</h3>
  
  <label>
    {currentLang === 'th' ? 'วันเริ่มต้น' : 'Start Date'}
    <input type="date" bind:value={$eventFormData.startDate} />
  </label>
  
  <label>
    {currentLang === 'th' ? 'วันสิ้นสุด' : 'End Date'}
    <input type="date" bind:value={$eventFormData.endDate} />
  </label>
  
  <label>
    {currentLang === 'th' ? 'เวลาเริ่ม' : 'Start Time'}
    <input type="time" bind:value={$eventFormData.startTime} />
  </label>
  
  <label>
    {currentLang === 'th' ? 'เวลาสิ้นสุด' : 'End Time'}
    <input type="time" bind:value={$eventFormData.endTime} />
  </label>
</div>

<style>
  .schedule-step {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    color: #cbd5e1;
  }
  input {
    padding: 0.75rem;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(100, 116, 139, 0.3);
    border-radius: 12px;
    color: #f8fafc;
  }
</style>
```

### Step 3: RewardsStep.svelte (แนะนำ)

```svelte
<script lang="ts">
  import { eventFormData, addRewardTier, removeRewardTier, updateRewardTier } from '$lib/stores/eventFormStore';
  export let currentLang: 'th' | 'en' = 'th';
</script>

<div class="rewards-step">
  <h3>{currentLang === 'th' ? 'รางวัล' : 'Rewards'}</h3>
  
  <label>
    {currentLang === 'th' ? 'จำนวนที่รับทั้งหมด' : 'Total Capacity'}
    <input type="number" bind:value={$eventFormData.totalSlots} min="1" />
  </label>
  
  <div class="tiers">
    {#each $eventFormData.rewards as tier}
      <div class="tier-card">
        <input 
          type="text" 
          placeholder={currentLang === 'th' ? 'ชื่อรางวัล' : 'Tier Name'}
          value={tier.name}
          on:input={(e) => updateRewardTier(tier.id, { name: e.target.value })}
        />
        <input 
          type="number" 
          placeholder={currentLang === 'th' ? 'จำนวน' : 'Quota'}
          value={tier.quota}
          on:input={(e) => updateRewardTier(tier.id, { quota: +e.target.value })}
        />
        <input 
          type="number" 
          placeholder={currentLang === 'th' ? 'รอบที่ต้องทำ' : 'Requirement'}
          value={tier.requirement}
          on:input={(e) => updateRewardTier(tier.id, { requirement: +e.target.value })}
        />
        <button on:click={() => removeRewardTier(tier.id)}>
          {currentLang === 'th' ? 'ลบ' : 'Remove'}
        </button>
      </div>
    {/each}
  </div>
  
  <button on:click={addRewardTier}>
    + {currentLang === 'th' ? 'เพิ่มระดับ' : 'Add Tier'}
  </button>
</div>

<style>
  .rewards-step {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  .tiers {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .tier-card {
    display: flex;
    gap: 0.5rem;
    padding: 1rem;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(100, 116, 139, 0.3);
    border-radius: 12px;
  }
  input {
    flex: 1;
    padding: 0.5rem;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(100, 116, 139, 0.3);
    border-radius: 8px;
    color: #f8fafc;
  }
  button {
    padding: 0.5rem 1rem;
    background: #10b981;
    border: none;
    border-radius: 8px;
    color: white;
    cursor: pointer;
  }
</style>
```

### Step 4: ReviewStep.svelte (แนะนำ)

```svelte
<script lang="ts">
  import { eventFormData, goToStep } from '$lib/stores/eventFormStore';
  export let currentLang: 'th' | 'en' = 'th';
</script>

<div class="review-step">
  <h3>{currentLang === 'th' ? 'ตรวจสอบข้อมูล' : 'Review Information'}</h3>
  
  <section class="review-section">
    <h4>{currentLang === 'th' ? 'ข้อมูลพื้นฐาน' : 'Basic Information'}</h4>
    <dl>
      <dt>{currentLang === 'th' ? 'ชื่อกิจกรรม' : 'Event Name'}:</dt>
      <dd>{$eventFormData.title}</dd>
      
      <dt>{currentLang === 'th' ? 'รายละเอียด' : 'Description'}:</dt>
      <dd>{$eventFormData.description}</dd>
      
      <dt>{currentLang === 'th' ? 'สถานที่' : 'Location'}:</dt>
      <dd>{$eventFormData.location}</dd>
    </dl>
    <button on:click={() => goToStep(1)}>
      {currentLang === 'th' ? 'แก้ไข' : 'Edit'}
    </button>
  </section>
  
  <section class="review-section">
    <h4>{currentLang === 'th' ? 'กำหนดการ' : 'Schedule'}</h4>
    <dl>
      <dt>{currentLang === 'th' ? 'เริ่ม' : 'Start'}:</dt>
      <dd>{$eventFormData.startDate} {$eventFormData.startTime}</dd>
      
      <dt>{currentLang === 'th' ? 'สิ้นสุด' : 'End'}:</dt>
      <dd>{$eventFormData.endDate} {$eventFormData.endTime}</dd>
    </dl>
    <button on:click={() => goToStep(2)}>
      {currentLang === 'th' ? 'แก้ไข' : 'Edit'}
    </button>
  </section>
  
  <section class="review-section">
    <h4>{currentLang === 'th' ? 'รางวัล' : 'Rewards'}</h4>
    <p>{currentLang === 'th' ? 'จำนวนที่รับ' : 'Capacity'}: {$eventFormData.totalSlots}</p>
    <ul>
      {#each $eventFormData.rewards as tier}
        <li>{tier.name}: {tier.quota} {currentLang === 'th' ? 'รางวัล' : 'rewards'}</li>
      {/each}
    </ul>
    <button on:click={() => goToStep(3)}>
      {currentLang === 'th' ? 'แก้ไข' : 'Edit'}
    </button>
  </section>
  
  <div class="publish-options">
    <label>
      <input type="checkbox" bind:checked={$eventFormData.isPublic} />
      {currentLang === 'th' ? 'เปิดเผยต่อสาธารณะ' : 'Public Event'}
    </label>
    <label>
      <input type="checkbox" bind:checked={$eventFormData.isActive} />
      {currentLang === 'th' ? 'เปิดใช้งาน' : 'Active'}
    </label>
  </div>
</div>

<style>
  .review-step {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }
  .review-section {
    padding: 1.5rem;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(100, 116, 139, 0.3);
    border-radius: 12px;
  }
  h4 {
    margin: 0 0 1rem;
    color: #10b981;
  }
  dl {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0.5rem 1rem;
    margin: 0 0 1rem;
  }
  dt {
    color: #94a3b8;
    font-weight: 600;
  }
  dd {
    margin: 0;
    color: #f8fafc;
  }
  button {
    padding: 0.5rem 1rem;
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid #10b981;
    border-radius: 8px;
    color: #10b981;
    cursor: pointer;
  }
  .publish-options {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #cbd5e1;
  }
</style>
```

---

## 🎯 ขั้นตอนการใช้งาน

### 1. สร้าง Steps ที่เหลือ

Copy โค้ดด้านบนไปสร้างไฟล์:
- `src/lib/components/organizer/steps/ScheduleStep.svelte`
- `src/lib/components/organizer/steps/RewardsStep.svelte`
- `src/lib/components/organizer/steps/ReviewStep.svelte`

### 2. Update CreateEventWizard.svelte

แก้ไข import ใน `CreateEventWizard.svelte`:

```typescript
// เดิม (แสดง error เพราะยังไม่มีไฟล์)
import BasicInfoStep from './steps/BasicInfoStep.svelte';
import ScheduleStep from './steps/ScheduleStep.svelte';
import RewardsStep from './steps/RewardsStep.svelte';
import ReviewStep from './steps/ReviewStep.svelte';

// ✅ หลังสร้างไฟล์แล้ว ก็จะใช้งานได้
```

### 3. ทดสอบการทำงาน

```bash
# รัน dev server
npm run dev
# หรือ
pnpm dev

# เปิด browser ไปที่
http://localhost:5173/organizer/create-event
```

### 4. ปรับแต่ง API Integration

แก้ไข `handleSubmit` function:

```typescript
async function handleSubmit(data) {
  try {
    const formData = new FormData();
    
    // เพิ่มรูปภาพ (ถ้ามี)
    if (data.imageFile) {
      formData.append('image', data.imageFile);
    }
    
    // เพิ่มข้อมูลอื่นๆ
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('location', data.location);
    formData.append('event_type', data.eventType);
    formData.append('start_date', data.startDate);
    formData.append('end_date', data.endDate);
    formData.append('start_time', data.startTime);
    formData.append('end_time', data.endTime);
    formData.append('capacity', data.totalSlots.toString());
    formData.append('rewards', JSON.stringify(data.rewards));
    formData.append('is_public', data.isPublic.toString());
    formData.append('is_active', data.isActive.toString());

    const response = await fetch('YOUR_API_URL/api/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error('Failed to create event');
    }

    // แสดงข้อความสำเร็จ
    Swal.fire({
      icon: 'success',
      title: 'สำเร็จ!',
      text: 'สร้างกิจกรรมเรียบร้อยแล้ว'
    });

    // Refresh หรือ redirect
    window.location.href = '/organizer/events';
    
  } catch (error) {
    console.error('Error:', error);
    Swal.fire({
      icon: 'error',
      title: 'เกิดข้อผิดพลาด',
      text: error.message
    });
  }
}
```

---

## ✅ Checklist

- [ ] สร้าง `ScheduleStep.svelte`
- [ ] สร้าง `RewardsStep.svelte`
- [ ] สร้าง `ReviewStep.svelte`
- [ ] ทดสอบ wizard navigation
- [ ] ทดสอบ validation
- [ ] ทดสอบ auto-save
- [ ] Connect API
- [ ] ทดสอบ image upload
- [ ] ทดสอบสร้างกิจกรรมจริง
- [ ] Deploy

---

## 🎨 ปรับแต่ง Theme

เปลี่ยนสีได้ที่ CSS variables:

```css
/* ใน <style> ของแต่ละไฟล์ */
:root {
  --primary: #10b981;    /* สีหลัก */
  --danger: #ef4444;     /* สีแดง */
  --warning: #f59e0b;    /* สีเหลือง */
  --success: #10b981;    /* สีเขียว */
}
```

หรือใช้ class utilities:

```css
.btn-primary { background: #10b981; }
.btn-danger { background: #ef4444; }
.text-primary { color: #10b981; }
.border-primary { border-color: #10b981; }
```

---

## 🐛 Debug Tips

### ดู Form Data

```svelte
<script>
  import { eventFormData } from '$lib/stores/eventFormStore';
</script>

<!-- แสดงข้อมูล form ปัจจุบัน -->
<pre>{JSON.stringify($eventFormData, null, 2)}</pre>
```

### ดู Validation Errors

```svelte
<script>
  import { validationErrors } from '$lib/stores/eventFormStore';
</script>

<!-- แสดง errors -->
{#if $validationErrors.length > 0}
  <ul>
    {#each $validationErrors as error}
      <li>{error.field}: {error.message}</li>
    {/each}
  </ul>
{/if}
```

### Reset Form

```svelte
<script>
  import { resetForm } from '$lib/stores/eventFormStore';
</script>

<button on:click={resetForm}>
  Reset Form
</button>
```

---

## 📞 Need Help?

**เอกสารเพิ่มเติม**:
- [📖 Full Documentation](./HOW_TO_USE_CREATE_EVENT_WIZARD.md)
- [📋 Improvements Summary](./CREATE_EVENT_IMPROVEMENTS_SUMMARY.md)
- [💡 Implementation Plan](./IMPROVEMENTS.md)

**Common Issues**:
- Form data หาย → ตรวจสอบ localStorage
- Validation ไม่ทำงาน → เช็ค validationErrors store
- Image ไม่โชว์ → เช็ค imagePreview URL

---

## 🎉 เสร็จแล้ว!

คุณพร้อมใช้งาน Create Event Wizard แล้ว! 🚀

**อย่าลืม**:
- ✅ Test ทุก step
- ✅ ทดสอบบนมือถือ
- ✅ ทดสอบการสร้างกิจกรรมจริง
- ✅ Monitor errors ใน production

**Happy Coding! 💻✨**
