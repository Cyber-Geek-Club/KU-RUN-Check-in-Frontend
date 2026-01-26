# Proof Submission Debugging & Best Practices Guide

This guide addresses the parsing/validation error (400 Bad Request) you are encountering and provides best practices for SvelteKit and FastAPI.

## 1. Request Body Structure

Based on your code and common patterns, the JSON payload for `submit-proof` (171 bytes) should look like this:

```json
{
  "proof_image_url": "https://storage.googleapis.com/.../proof.jpg",
  "strava_link": "https://www.strava.com/activities/1234567890",
  "actual_distance_km": 5.0
}
```

### Common Validation Pitfalls:
-   **`actual_distance_km`**: Must be a number (float/int), not a string. `Number(distanceInput)` in your code handles this, but verify `distanceInput` isn't `NaN`.
-   **`strava_link`**: Some backends validate the URL format strictly (e.g., must start with `http`).
-   **`proof_image_url`**: Ensure it's not empty or null.

---

## 2. FastAPI Backend Improvements

To debug *why* FastAPI returns 400, you need to see the `detail` field.

### Pydantic Model (Recommended)
Ensure your backend model matches the frontend payload:

```python
from pydantic import BaseModel, HttpUrl, Field, validator

class ProofSubmission(BaseModel):
    proof_image_url: str = Field(..., description="URL of the uploaded image")
    strava_link: str = Field(..., description="Valid Strava Activity Link")
    # ✅ Allow both int/float, force to float
    actual_distance_km: float = Field(..., gt=0, description="Distance in KM")

    @validator('strava_link')
    def validate_strava(cls, v):
        if not ("strava.com" in v or "strava.app.link" in v):
            raise ValueError("Invalid Strava URL")
        return v
```

### Debugging Middleware (Add to `main.py`)
This will print validation errors to your server console:

```python
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    # 🔍 LOG THE ERROR DETAILS
    print(f"❌ Validation Error: {exc.errors()}")
    print(f"📦 Body: {exc.body}")
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, # or 400
        content={"detail": exc.errors(), "body": exc.body},
    )
```

---

## 3. SvelteKit Best Practices

The current implementation uses client-side `fetch` in `+page.svelte`. The "SvelteKit way" is to use **Form Actions** (`+page.server.ts`).

### Advantages:
-   Runs on server (hides tokens/logic).
-   Works without JS (progressive enhancement).
-   Better error handling.

### Example Refactor

**1. Create `src/routes/student/myevents-upcoming/+page.server.ts`**

```typescript
import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions = {
    submitProof: async ({ request, fetch, cookies }) => {
        const formData = await request.formData();
        const participationId = formData.get('participation_id');
        const proofUrl = formData.get('proof_image_url');
        const stravaLink = formData.get('strava_link');
        const distance = Number(formData.get('actual_distance_km'));

        // Basic validation
        if (!proofUrl || !stravaLink || !distance) {
            return fail(400, { missing: true, message: 'Missing required fields' });
        }

        const payload = {
            proof_image_url: proofUrl,
            strava_link: stravaLink,
            actual_distance_km: distance
        };

        try {
            // Forward request to FastAPI
            const res = await fetch(`http://backend:8000/api/participations/${participationId}/submit-proof`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${cookies.get('token')}` // Or however you store tokens
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const error = await res.json();
                // Return error to frontend
                return fail(res.status, { 
                    success: false, 
                    message: error.detail || 'Submission failed',
                    errors: error.detail // Pydantic details
                });
            }

            return { success: true };
            
        } catch (err) {
            console.error('Submission error:', err);
            return fail(500, { message: 'Server connection error' });
        }
    }
} satisfies Actions;
```

**2. Update `+page.svelte` to use the Form**

```svelte
<script lang="ts">
    import { enhance } from '$app/forms';
    export let form; // Access returned data/errors
</script>

<!-- Show Error -->
{#if form?.message}
    <div class="alert alert-error">{form.message}</div>
{/if}

<form method="POST" action="?/submitProof" use:enhance>
    <input type="hidden" name="participation_id" value={selectedEvent.participation_id} />
    <input type="hidden" name="proof_image_url" value={proofImageUrl} />
    
    <label>Strava Link</label>
    <input type="text" name="strava_link" bind:value={stravaLink} />

    <label>Distance</label>
    <input type="number" step="0.01" name="actual_distance_km" bind:value={distance} />

    <button type="submit">Submit Proof</button>
</form>
```

---

## 4. Debugging Steps (Immediate Fix)

Since I've added the logging to your frontend:

1.  **Open Browser Console** (F12).
2.  **Retry Submission**.
3.  Look for the red **"❌ POST Failed with 400..."** message.
4.  Expand the object. You should see specifically *what* field is wrong.

**Example Error Scenarios:**

| valid? | Error Message (Backend) | Fix |
| :--- | :--- | :--- |
| ❌ | `value is not a valid float` | Check `distanceInput`. Is it `"5,5"` (comma)? It must be `"5.5"` (dot). |
| ❌ | `field required` | A field name is typoed in the payload. |
| ❌ | `Invalid Strava URL` | The regex validator on backend rejected the link format. |
