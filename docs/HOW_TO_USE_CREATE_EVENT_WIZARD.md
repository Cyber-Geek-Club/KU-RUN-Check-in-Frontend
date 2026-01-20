# 📖 วิธีใช้งาน Create Event Wizard

## 🎯 Overview

Create Event Wizard เป็นคอมโพเนนต์สำหรับสร้างกิจกรรมใหม่ โดยใช้รูปแบบ **Step-by-Step Wizard** ที่ช่วยให้ผู้ใช้กรอกข้อมูลได้ง่ายและถูกต้อง

---

## 📁 ไฟล์ที่เกี่ยวข้อง

```
src/lib/
├── stores/
│   └── eventFormStore.ts                    # State management
├── components/
│   └── organizer/
│       ├── CreateEventWizard.svelte         # Main wizard
│       └── steps/
│           ├── BasicInfoStep.svelte         # Step 1 ✅
│           ├── ScheduleStep.svelte          # Step 2 🚧
│           ├── RewardsStep.svelte           # Step 3 🚧
│           └── ReviewStep.svelte            # Step 4 🚧
```

✅ = พร้อมใช้งาน  
🚧 = ยังไม่เสร็จ (ต้องสร้างเอง)

---

## 🚀 วิธีใช้งาน

### 1. Import Component

```svelte
<script lang="ts">
  import CreateEventWizard from '$lib/components/organizer/CreateEventWizard.svelte';
  import type { EventFormData } from '$lib/stores/eventFormStore';
</script>
```

### 2. ใช้งาน Component

```svelte
<CreateEventWizard
  currentLang="th"
  onSubmit={handleSubmit}
  onCancel={handleCancel}
/>
```

### 3. สร้าง Handler Functions

```typescript
async function handleSubmit(data: EventFormData) {
  try {
    // เรียก API เพื่อสร้างกิจกรรม
    const response = await fetch('/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      },
      body: JSON.stringify({
        title: data.title,
        description: data.description,
        location: data.location,
        event_type: data.eventType,
        max_checkins: data.maxCheckinsPerUser,
        start_date: data.startDate,
        end_date: data.endDate,
        start_time: data.startTime,
        end_time: data.endTime,
        capacity: data.totalSlots,
        distance_km: data.distanceKm,
        exclude_weekends: data.excludeWeekends,
        specific_dates: data.specificDates,
        rewards: data.rewards.map(r => ({
          name: r.name,
          quota: r.quota,
          requirement: r.requirement
        })),
        is_public: data.isPublic,
        is_active: data.isActive,
      })
    });

    if (!response.ok) {
      throw new Error('Failed to create event');
    }

    const result = await response.json();
    
    // แสดงข้อความสำเร็จ
    Swal.fire({
      icon: 'success',
      title: 'สำเร็จ!',
      text: 'สร้างกิจกรรมเรียบร้อยแล้ว',
      timer: 2000
    });

    // Refresh หรือ redirect
    await refreshEventList();
    
  } catch (error) {
    console.error('Error creating event:', error);
    Swal.fire({
      icon: 'error',
      title: 'เกิดข้อผิดพลาด',
      text: error.message || 'ไม่สามารถสร้างกิจกรรมได้'
    });
  }
}

function handleCancel() {
  // กลับไปหน้ารายการกิจกรรม
  currentView = 'list';
}
```

---

## 🎨 Props

### CreateEventWizard

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `currentLang` | `'th' \| 'en'` | ✅ | - | ภาษาที่ใช้แสดงผล |
| `onSubmit` | `(data: EventFormData) => Promise<void>` | ✅ | - | Callback เมื่อ submit form |
| `onCancel` | `() => void` | ✅ | - | Callback เมื่อยกเลิก |

---

## 📊 EventFormData Type

```typescript
interface EventFormData {
  // Basic Info
  title: string;                    // ชื่อกิจกรรม
  description: string;              // รายละเอียด
  location: string;                 // สถานที่
  imageFile: File | null;           // ไฟล์รูปภาพ
  imagePreview: string | null;      // URL สำหรับแสดงรูป

  // Event Type
  eventType: 'single_day' | 'multi_day';
  maxCheckinsPerUser: number;       // จำนวนเช็คอินสูงสุด (สำหรับ multi_day)
  allowDailyCheckin: boolean;

  // Schedule
  startDate: string;                // YYYY-MM-DD
  endDate: string;                  // YYYY-MM-DD
  startTime: string;                // HH:mm
  endTime: string;                  // HH:mm
  
  // Holidays
  holidayType: 'none' | 'weekends' | 'specific';
  excludeWeekends: boolean;
  specificDates: string[];          // Array of YYYY-MM-DD

  // Capacity & Requirements
  totalSlots: number;               // จำนวนที่รับทั้งหมด
  distanceKm: number | null;        // ระยะทางที่ต้องวิ่ง (km)
  requiredCompletions: number | null;

  // Rewards
  rewards: RewardTier[];

  // Status
  isPublic: boolean;                // เปิดเผยต่อสาธารณะ
  isActive: boolean;                // เปิดใช้งาน
}

interface RewardTier {
  id: string;                       // Unique ID
  name: string;                     // ชื่อรางวัล
  quota: number;                    // จำนวนรางวัล
  requirement: number;              // จำนวนรอบที่ต้องทำ
  rankStart?: number;               // อันดับเริ่มต้น (คำนวณอัตโนมัติ)
  rankEnd?: number;                 // อันดับสิ้นสุด (คำนวณอัตโนมัติ)
}
```

---

## 🔄 Store Functions

### State Accessors

```typescript
import {
  eventFormData,      // Current form data
  currentStep,        // Current step (1-4)
  validationErrors,   // Array of validation errors
  isSubmitting,       // Is form being submitted
  totalAllocatedSlots, // Total rewards allocated
  remainingSlots,     // Remaining capacity
  isStepValid,        // Is current step valid
} from '$lib/stores/eventFormStore';
```

### Actions

```typescript
import {
  resetForm,          // Reset form to default
  nextStep,           // Go to next step
  prevStep,           // Go to previous step
  goToStep,           // Jump to specific step
  addRewardTier,      // Add new reward tier
  removeRewardTier,   // Remove reward tier
  updateRewardTier,   // Update reward tier
  calculateRankRanges, // Calculate rank ranges for tiers
  validateForm,       // Validate form (all or specific step)
} from '$lib/stores/eventFormStore';
```

### Usage Examples

```typescript
// Read data
$eventFormData.title  // Get event title
$currentStep          // Get current step number
$isStepValid          // Check if current step is valid

// Modify data
eventFormData.update(data => ({
  ...data,
  title: 'New Title'
}));

// Actions
nextStep();           // Go to step 2
prevStep();           // Go back to step 1
goToStep(3);          // Jump to step 3
resetForm();          // Reset everything

// Rewards
addRewardTier();      // Add new tier
removeRewardTier('tier-123');  // Remove tier
updateRewardTier('tier-123', { name: 'Gold' });  // Update tier
calculateRankRanges(); // Recalculate all rank ranges
```

---

## 🎯 Wizard Steps

### Step 1: Basic Information ✅

**เสร็จแล้ว** - พร้อมใช้งาน

**หน้าที่**:
- อัพโหลดรูปภาพ (drag & drop)
- เลือกประเภทกิจกรรม (Single/Multi Day)
- กรอกชื่อกิจกรรม
- กรอกรายละเอียด
- กรอกสถานที่

**Validation**:
- ✅ ชื่อกิจกรรมไม่ว่าง
- ✅ รายละเอียดไม่ว่าง
- ✅ สถานที่ไม่ว่าง
- ✅ รูปภาพไม่เกิน 5MB

---

### Step 2: Schedule 🚧

**ยังไม่เสร็จ** - ต้องสร้างเอง

**หน้าที่ (แนะนำ)**:
- เลือกวันที่เริ่ม/สิ้นสุด (date picker)
- เลือกเวลาเริ่ม/สิ้นสุด (time picker)
- แสดงระยะเวลากิจกรรม (คำนวณอัตโนมัติ)
- เลือกตัวเลือกวันหยุด:
  - ไม่มีวันหยุด
  - ยกเว้นวันเสาร์-อาทิตย์
  - เลือกวันที่เฉพาะ (calendar)

**Validation ที่ต้องทำ**:
- วันเริ่มต้นไม่อยู่หลังวันสิ้นสุด
- เวลาเริ่มต้นไม่อยู่หลังเวลาสิ้นสุด
- ต้องมีอย่างน้อย 1 วัน

**ตัวอย่างโค้ด**:
```svelte
<!-- ScheduleStep.svelte -->
<script lang="ts">
  import { eventFormData } from '$lib/stores/eventFormStore';
  
  $: duration = calculateDuration($eventFormData.startDate, $eventFormData.endDate);
</script>

<div class="schedule-step">
  <div class="date-range">
    <label>Start Date</label>
    <input type="date" bind:value={$eventFormData.startDate} />
    
    <label>End Date</label>
    <input type="date" bind:value={$eventFormData.endDate} />
  </div>
  
  <div class="time-range">
    <label>Start Time</label>
    <input type="time" bind:value={$eventFormData.startTime} />
    
    <label>End Time</label>
    <input type="time" bind:value={$eventFormData.endTime} />
  </div>
  
  <div class="duration-display">
    Duration: {duration} days
  </div>
</div>
```

---

### Step 3: Rewards 🚧

**ยังไม่เสร็จ** - ต้องสร้างเอง

**หน้าที่ (แนะนำ)**:
- กรอกจำนวนที่รับทั้งหมด
- กรอกระยะทาง (ถ้ามี)
- แสดง Quota Tracker (visual)
- เพิ่ม/ลบ Reward Tiers
- กรอกรายละเอียด tier แต่ละตัว:
  - ชื่อรางวัล
  - จำนวนรางวัล (quota)
  - จำนวนรอบที่ต้องทำ
- แสดงอันดับที่คำนวณ (rankStart-rankEnd)

**Validation ที่ต้องทำ**:
- จำนวนที่รับ > 0
- ระยะทาง >= 0 (ถ้ากรอก)
- ผลรวม quota ≤ จำนวนที่รับทั้งหมด
- แต่ละ tier:
  - ชื่อไม่ว่าง
  - quota > 0
  - requirement > 0

**ตัวอย่างโค้ด**:
```svelte
<!-- RewardsStep.svelte -->
<script lang="ts">
  import { eventFormData, totalAllocatedSlots, remainingSlots, addRewardTier, removeRewardTier, updateRewardTier } from '$lib/stores/eventFormStore';
</script>

<div class="rewards-step">
  <div class="capacity-input">
    <label>Total Capacity</label>
    <input type="number" bind:value={$eventFormData.totalSlots} min="1" />
  </div>
  
  <div class="quota-tracker">
    <div class="progress-bar">
      <div class="fill" style="width: {($totalAllocatedSlots / $eventFormData.totalSlots) * 100}%"></div>
    </div>
    <p>Allocated: {$totalAllocatedSlots} / {$eventFormData.totalSlots}</p>
    <p>Remaining: {$remainingSlots}</p>
  </div>
  
  <div class="tiers-list">
    {#each $eventFormData.rewards as tier}
      <div class="tier-card">
        <input type="text" placeholder="Tier Name" 
          value={tier.name}
          on:input={(e) => updateRewardTier(tier.id, { name: e.target.value })}
        />
        <input type="number" placeholder="Quota"
          value={tier.quota}
          on:input={(e) => updateRewardTier(tier.id, { quota: +e.target.value })}
        />
        <input type="number" placeholder="Requirement"
          value={tier.requirement}
          on:input={(e) => updateRewardTier(tier.id, { requirement: +e.target.value })}
        />
        <p>Rank: {tier.rankStart} - {tier.rankEnd}</p>
        <button on:click={() => removeRewardTier(tier.id)}>Remove</button>
      </div>
    {/each}
  </div>
  
  <button on:click={addRewardTier}>+ Add Tier</button>
</div>
```

---

### Step 4: Review & Publish 🚧

**ยังไม่เสร็จ** - ต้องสร้างเอง

**หน้าที่ (แนะนำ)**:
- แสดงสรุปข้อมูลทั้งหมด
- มีปุ่ม "Edit" สำหรับแต่ละ section (กลับไป step นั้นๆ)
- Toggle switches:
  - Public/Private
  - Active/Draft
- Checkbox: Accept terms & conditions
- ปุ่ม "Publish Event"

**Validation ที่ต้องทำ**:
- ตรวจสอบข้อมูลทั้งหมดอีกครั้ง
- ต้องติ๊ก Accept terms

**ตัวอย่างโค้ด**:
```svelte
<!-- ReviewStep.svelte -->
<script lang="ts">
  import { eventFormData, goToStep } from '$lib/stores/eventFormStore';
  
  let acceptTerms = false;
</script>

<div class="review-step">
  <!-- Image Preview -->
  <section>
    <h3>Event Image</h3>
    {#if $eventFormData.imagePreview}
      <img src={$eventFormData.imagePreview} alt="Preview" />
    {/if}
    <button on:click={() => goToStep(1)}>Edit</button>
  </section>
  
  <!-- Basic Info -->
  <section>
    <h3>Basic Information</h3>
    <dl>
      <dt>Event Type:</dt>
      <dd>{$eventFormData.eventType}</dd>
      
      <dt>Name:</dt>
      <dd>{$eventFormData.title}</dd>
      
      <dt>Description:</dt>
      <dd>{$eventFormData.description}</dd>
      
      <dt>Location:</dt>
      <dd>{$eventFormData.location}</dd>
    </dl>
    <button on:click={() => goToStep(1)}>Edit</button>
  </section>
  
  <!-- Schedule -->
  <section>
    <h3>Schedule</h3>
    <dl>
      <dt>Start:</dt>
      <dd>{$eventFormData.startDate} {$eventFormData.startTime}</dd>
      
      <dt>End:</dt>
      <dd>{$eventFormData.endDate} {$eventFormData.endTime}</dd>
    </dl>
    <button on:click={() => goToStep(2)}>Edit</button>
  </section>
  
  <!-- Rewards -->
  <section>
    <h3>Rewards</h3>
    <p>Total Capacity: {$eventFormData.totalSlots}</p>
    <p>Distance: {$eventFormData.distanceKm} km</p>
    <ul>
      {#each $eventFormData.rewards as tier}
        <li>{tier.name}: {tier.quota} slots, {tier.requirement} rounds required</li>
      {/each}
    </ul>
    <button on:click={() => goToStep(3)}>Edit</button>
  </section>
  
  <!-- Publish Options -->
  <section>
    <h3>Publish Options</h3>
    <label>
      <input type="checkbox" bind:checked={$eventFormData.isPublic} />
      Public Event
    </label>
    <label>
      <input type="checkbox" bind:checked={$eventFormData.isActive} />
      Active (Open for Registration)
    </label>
  </section>
  
  <!-- Terms -->
  <label class="terms">
    <input type="checkbox" bind:checked={acceptTerms} />
    I accept the terms and conditions
  </label>
</div>
```

---

## 💾 Auto-save Feature

Form data จะถูกบันทึกลง `localStorage` อัตโนมัติ

**Key**: `eventFormDraft`

```typescript
// ดูข้อมูลที่ save ไว้
const saved = localStorage.getItem('eventFormDraft');
console.log(JSON.parse(saved));

// ลบข้อมูล draft
localStorage.removeItem('eventFormDraft');

// หรือใช้ function
import { resetForm } from '$lib/stores/eventFormStore';
resetForm();
```

---

## 🎨 Customization

### เปลี่ยนสี Theme

แก้ไขใน CSS variables:

```css
/* CreateEventWizard.svelte */
:root {
  --primary-color: #10b981;  /* Emerald */
  --error-color: #ef4444;    /* Red */
  --warning-color: #f59e0b;  /* Amber */
  --success-color: #10b981;  /* Same as primary */
}
```

### เพิ่ม/ลด Steps

1. แก้ `steps` array ใน `CreateEventWizard.svelte`
2. สร้าง component ใหม่
3. Import และเพิ่มใน array

```typescript
const steps = [
  // ... existing steps
  {
    id: 5,
    title: { th: 'ขั้นตอนใหม่', en: 'New Step' },
    icon: 'M...', // SVG path
    component: NewStep,
  },
];
```

---

## 🧪 Testing

### Unit Tests (ตัวอย่าง)

```typescript
// eventFormStore.test.ts
import { describe, it, expect } from 'vitest';
import { eventFormData, validateForm, addRewardTier } from '$lib/stores/eventFormStore';
import { get } from 'svelte/store';

describe('Event Form Store', () => {
  it('should validate required fields', () => {
    // Reset form
    eventFormData.set({
      title: '',
      description: '',
      location: '',
      // ... other fields
    });

    const isValid = validateForm(1);
    expect(isValid).toBe(false);
  });

  it('should add reward tier', () => {
    addRewardTier();
    const data = get(eventFormData);
    expect(data.rewards.length).toBeGreaterThan(0);
  });
});
```

### Integration Tests

```typescript
// CreateEventWizard.test.ts
import { render, fireEvent } from '@testing-library/svelte';
import CreateEventWizard from '$lib/components/organizer/CreateEventWizard.svelte';

describe('CreateEventWizard', () => {
  it('should navigate to next step when valid', async () => {
    const { getByText, getByRole } = render(CreateEventWizard, {
      currentLang: 'en',
      onSubmit: () => {},
      onCancel: () => {},
    });

    // Fill in required fields
    const titleInput = getByRole('textbox', { name: /event name/i });
    await fireEvent.input(titleInput, { target: { value: 'Test Event' } });

    // Click next
    const nextButton = getByText('Next');
    await fireEvent.click(nextButton);

    // Should be on step 2
    expect(getByText(/schedule/i)).toBeInTheDocument();
  });
});
```

---

## 🐛 Troubleshooting

### ปัญหา: Form data หายหลัง refresh

**สาเหตุ**: localStorage อาจถูกปิดใช้งาน

**วิธีแก้**:
```typescript
// Check if localStorage is available
if (typeof localStorage !== 'undefined') {
  // Use localStorage
} else {
  // Fallback to memory storage
}
```

### ปัญหา: Validation ไม่ทำงาน

**สาเหตุ**: อาจมี bug ใน validation logic

**วิธีแก้**:
```typescript
// Debug validation errors
$validationErrors.subscribe(errors => {
  console.log('Validation errors:', errors);
});

// Manual validation
validateForm(1); // Validate step 1
validateForm(2); // Validate step 2
validateForm(); // Validate all
```

### ปัญหา: Image upload ไม่ทำงาน

**สาเหตุ**: File size เกิน 5MB หรือไม่ใช่ไฟล์รูป

**วิธีแก้**:
- ตรวจสอบ file.type.startsWith('image/')
- ตรวจสอบ file.size < 5 * 1024 * 1024
- แสดง error message ที่ชัดเจน

---

## 📚 Additional Resources

- [Svelte Documentation](https://svelte.dev/docs)
- [SvelteKit Documentation](https://kit.svelte.dev/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Svelte Stores Guide](https://svelte.dev/docs/svelte-store)

---

## ✅ Checklist Before Using

- [ ] อ่านเอกสารนี้จนจบ
- [ ] ตรวจสอบว่ามีไฟล์ครบถ้วน
- [ ] สร้าง Step 2-4 (ScheduleStep, RewardsStep, ReviewStep)
- [ ] Test wizard flow
- [ ] Integrate กับ API
- [ ] Test การสร้างกิจกรรมจริง
- [ ] Deploy และ monitor errors

---

**Good luck! 🚀**
