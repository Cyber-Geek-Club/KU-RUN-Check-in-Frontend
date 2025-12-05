<script lang="ts">
  import { slide } from "svelte/transition";

  let eventName = "";

  let selDay = "";
  let selMonth = "";
  let selYear = "";

  let selStartTime = "";
  let selEndTime = "";
  let selSlots = "";

  let eventLocation = "";
  let eventDescription = "";
  let previewImage = "";
  let activeDropdown = "";
  let isEditMode = false;

  let errorMessage = "";
  let successMessage = "";
  let msgTimeout: any;

  let errorField: string = "";

  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) =>
    (currentYear + i).toString()
  );

  const times: string[] = [];
  for (let i = 0; i < 24; i++) {
    const hour = i.toString().padStart(2, "0");
    times.push(`${hour}:00`);
    times.push(`${hour}:30`);
  }

  const slotsOptions = [
    "10",
    "20",
    "30",
    "40",
    "50",
    "100",
    "200",
    "500",
    "Unlimited",
  ];

  function clearMessages() {
    if (errorMessage || successMessage) {
      errorMessage = "";
      successMessage = "";
      if (msgTimeout) clearTimeout(msgTimeout);
    }
  }

  function handleImageUpload() {
    clearMessages();
    previewImage =
      "https://images.unsplash.com/photo-1552674605-46f5383a6719?auto=format&fit=crop&w=600&q=80";
  }

  function toggleDropdown(name: string, event: Event) {
    event.stopPropagation();
    activeDropdown = activeDropdown === name ? "" : name;
  }

  function openDropdown(name: string) {
    activeDropdown = name;
  }

  function selectOption(type: string, value: any) {
    clearMessages();
    if (type === "day") selDay = value;
    if (type === "month") selMonth = value;
    if (type === "year") selYear = value;

    if (type === "startTime") selStartTime = value;
    if (type === "endTime") selEndTime = value;
    if (type === "slots") selSlots = value;

    activeDropdown = "";
  }

  function closeDropdowns() {
    activeDropdown = "";
  }

  function handleTimeInput(event: Event, type: "start" | "end") {
    clearMessages();
    const input = event.target as HTMLInputElement;
    let v = input.value.replace(/[^0-9]/g, "");

    if (v.length > 4) v = v.slice(0, 4);
    if (v.length > 2) v = v.slice(0, 2) + ":" + v.slice(2);

    input.value = v;
    if (type === "start") selStartTime = v;
    if (type === "end") selEndTime = v;
  }

  function handleSlotInput(event: Event) {
    clearMessages();
    const input = event.target as HTMLInputElement;
    let v = input.value.replace(/[^0-9]/g, "");
    input.value = v;
    selSlots = v;
  }

  function getSelectClass(value: any) {
    return value === "" ? "text-gray" : "text-dark";
  }

  function handlePublish() {
    if (msgTimeout) clearTimeout(msgTimeout);
    errorMessage = "";
    successMessage = "";
    errorField = "";

    if (!eventName) {
      errorField = "eventName";
      errorMessage = "Please enter the Event name.";
    } else if (!selDay) {
      errorField = "day";
      errorMessage = "Please select the Event Day.";
    } else if (!selMonth) {
      
      errorField = "month";
      errorMessage = "Please select the Event Month.";
    } else if (!selYear) {
      
      errorField = "year";
      errorMessage = "Please select the Event Year.";
    } else if (!selStartTime) {
      errorField = "startTime";
      errorMessage = "Please enter the Start time.";
    } else if (!selEndTime) {
      errorField = "endTime";
      errorMessage = "Please enter the End time.";
    } else if (!eventLocation) {
      errorField = "eventLocation";
      errorMessage = "Please enter the Event location.";
    } else if (!eventDescription) {
      errorField = "eventDescription"; 
      errorMessage = "Please enter the Event description.";
    } else if (!selSlots) {
      errorField = "slots";
      errorMessage = "Please enter or select the Number of slots.";
    }

    if (errorMessage) {
      msgTimeout = setTimeout(() => {
        errorMessage = "";
        errorField = "";
      }, 3000);
      return;
    }

    successMessage = isEditMode
      ? "Event updated successfully."
      : "Event created successfully.";
    msgTimeout = setTimeout(() => {
      successMessage = "";
    }, 3000);
  }
</script>

<svelte:window on:click={closeDropdowns} />

<div class="app-screen">
  <div class="glass-header">
    <a href="/createevent-officer" class="back-btn" aria-label="Back">
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        ><line x1="19" y1="12" x2="5" y2="12"></line><polyline
          points="12 19 5 12 12 5"
        ></polyline></svg
      >
    </a>
    <h1 class="page-title">{isEditMode ? "EDIT EVENT" : "CREATE EVENT"}</h1>
  </div>

  <div class="scroll-container">
    <div class="content-wrapper">
      <div class="form-card">
        <button
          type="button"
          class="upload-section"
          on:click={handleImageUpload}
          aria-label="Upload Event Image"
        >
          {#if previewImage}
            <img src={previewImage} alt="Preview" class="uploaded-img" />
            <div class="change-overlay">Change Image</div>
          {:else}
            <div class="upload-placeholder">
              <svg
                class="camera-icon"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                ><path
                  d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
                ></path><circle cx="12" cy="13" r="4"></circle></svg
              >
              <span class="upload-text">Tap To Upload Image</span>
            </div>
          {/if}
        </button>
        <div class="divider"></div>

        <div class="form-group">
          <label class="form-label" for="eventName">Event Name</label>
          <input
            id="eventName"
            type="text"
            class="form-input"
            class:error-border={errorField === "eventName"}
            placeholder="Enter your event name"
            bind:value={eventName}
            on:input={clearMessages}
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="daySelect">Date</label>
          <div class="date-row" class:error-border={errorField === "date"}>
            <div class="custom-select-container" style="flex: 1;">
              <button
                class="form-input select-trigger {getSelectClass(selDay)}"
                class:error-border={errorField === "day"}
                on:click={(e) => toggleDropdown("day", e)}
              >
                {selDay || "Day"}
                <svg
                  class="chevron-icon {activeDropdown === 'day'
                    ? 'rotate'
                    : ''}"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  ><polyline points="6 9 12 15 18 9"></polyline></svg
                >
              </button>
              {#if activeDropdown === "day"}
                <div
                  class="dropdown-options"
                  transition:slide={{ duration: 200 }}
                >
                  {#each days as day}
                    <button
                      class="option-item {selDay === day ? 'selected' : ''}"
                      on:click={(e) => {
                        e.stopPropagation();
                        selectOption("day", day);
                      }}>{day}</button
                    >
                  {/each}
                </div>
              {/if}
            </div>
            <div class="custom-select-container" style="flex: 2;">
              <button
                class="form-input select-trigger {getSelectClass(selMonth)}"
                class:error-border={errorField === "month"}
                on:click={(e) => toggleDropdown("month", e)}
              >
                {selMonth || "Month"}
                <svg
                  class="chevron-icon {activeDropdown === 'month'
                    ? 'rotate'
                    : ''}"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  ><polyline points="6 9 12 15 18 9"></polyline></svg
                >
              </button>
              {#if activeDropdown === "month"}
                <div
                  class="dropdown-options"
                  transition:slide={{ duration: 200 }}
                >
                  {#each months as month}
                    <button
                      class="option-item {selMonth === month ? 'selected' : ''}"
                      on:click={(e) => {
                        e.stopPropagation();
                        selectOption("month", month);
                      }}>{month}</button
                    >
                  {/each}
                </div>
              {/if}
            </div>
            <div class="custom-select-container" style="flex: 1.5;">
              <button
                class="form-input select-trigger {getSelectClass(selYear)}"
                class:error-border={errorField === "year"}
                on:click={(e) => toggleDropdown("year", e)}
              >
                {selYear || "Year"}
                <svg
                  class="chevron-icon {activeDropdown === 'year'
                    ? 'rotate'
                    : ''}"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  ><polyline points="6 9 12 15 18 9"></polyline></svg
                >
              </button>
              {#if activeDropdown === "year"}
                <div
                  class="dropdown-options"
                  transition:slide={{ duration: 200 }}
                >
                  {#each years as year}
                    <button
                      class="option-item {selYear === year ? 'selected' : ''}"
                      on:click={(e) => {
                        e.stopPropagation();
                        selectOption("year", year);
                      }}>{year}</button
                    >
                  {/each}
                </div>
              {/if}
            </div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="startTime">Start Time</label>
            <div class="custom-select-container">
              <input
                id="startTime"
                type="text"
                class="form-input"
                class:error-border={errorField === "startTime"}
                placeholder="00:00"
                value={selStartTime}
                on:input={(e) => handleTimeInput(e, "start")}
                on:focus={(e) => {
                  e.stopPropagation();
                  openDropdown("startTime");
                }}
                on:click={(e) => {
                  e.stopPropagation();
                  openDropdown("startTime");
                }}
                maxlength="5"
                inputmode="numeric"
              />
              <svg
                class="chevron-icon overlay-icon"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                ><circle cx="12" cy="12" r="10"></circle><polyline
                  points="12 6 12 12 16 14"
                ></polyline></svg
              >
              {#if activeDropdown === "startTime"}
                <div
                  class="dropdown-options"
                  transition:slide={{ duration: 200 }}
                >
                  {#each times as time}
                    <button
                      class="option-item {selStartTime === time
                        ? 'selected'
                        : ''}"
                      on:click={(e) => {
                        e.stopPropagation();
                        selectOption("startTime", time);
                      }}>{time}</button
                    >
                  {/each}
                </div>
              {/if}
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="endTime">End Time</label>
            <div class="custom-select-container">
              <input
                id="endTime"
                type="text"
                class="form-input"
                class:error-border={errorField === "endTime"}
                placeholder="00:00"
                value={selEndTime}
                on:input={(e) => handleTimeInput(e, "end")}
                on:focus={(e) => {
                  e.stopPropagation();
                  openDropdown("endTime");
                }}
                on:click={(e) => {
                  e.stopPropagation();
                  openDropdown("endTime");
                }}
                maxlength="5"
                inputmode="numeric"
              />
              <svg
                class="chevron-icon overlay-icon"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                ><circle cx="12" cy="12" r="10"></circle><polyline
                  points="12 6 12 12 16 14"
                ></polyline></svg
              >
              {#if activeDropdown === "endTime"}
                <div
                  class="dropdown-options"
                  transition:slide={{ duration: 200 }}
                >
                  {#each times as time}
                    <button
                      class="option-item {selEndTime === time
                        ? 'selected'
                        : ''}"
                      on:click={(e) => {
                        e.stopPropagation();
                        selectOption("endTime", time);
                      }}>{time}</button
                    >
                  {/each}
                </div>
              {/if}
            </div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="eventLocation">Location</label>
          <input
            id="eventLocation"
            type="text"
            class="form-input"
            class:error-border={errorField === "eventLocation"}
            placeholder="Enter your location"
            bind:value={eventLocation}
            on:input={clearMessages}
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="eventDesc">Description</label>
          <textarea
            id="eventDesc"
            class="form-input textarea"
            class:error-border={errorField === "eventDescription"}
            placeholder="Enter your description"
            bind:value={eventDescription}
            on:input={clearMessages}
          ></textarea>
        </div>

        <div class="form-group">
          <label class="form-label" for="eventSlots">Slots</label>
          <div class="custom-select-container">
            <input
              id="eventSlots"
              type="text"
              class="form-input"
              class:error-border={errorField === "slots"}
              placeholder="Enter or select slots"
              value={selSlots}
              on:input={handleSlotInput}
              on:focus={(e) => {
                e.stopPropagation();
                openDropdown("slots");
              }}
              on:click={(e) => {
                e.stopPropagation();
                openDropdown("slots");
              }}
              inputmode="numeric"
            />
            <svg
              class="chevron-icon overlay-icon"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              ><polyline points="6 9 12 15 18 9"></polyline></svg
            >
            {#if activeDropdown === "slots"}
              <div
                class="dropdown-options"
                transition:slide={{ duration: 200 }}
              >
                {#each slotsOptions as slot}
                  <button
                    class="option-item {selSlots === slot ? 'selected' : ''}"
                    on:click={(e) => {
                      e.stopPropagation();
                      selectOption("slots", slot);
                    }}>{slot}</button
                  >
                {/each}
              </div>
            {/if}
          </div>
        </div>

        {#if errorMessage}
          <div class="message-container error" transition:slide>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              ><circle cx="12" cy="12" r="10"></circle><line
                x1="12"
                y1="8"
                x2="12"
                y2="12"
              ></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg
            >
            <span>{errorMessage}</span>
          </div>
        {/if}

        {#if successMessage}
          <div class="message-container success" transition:slide>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              ><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline
                points="22 4 12 14.01 9 11.01"
              ></polyline></svg
            >
            <span>{successMessage}</span>
          </div>
        {/if}

        <button class="publish-btn" on:click={handlePublish}>
          {isEditMode ? "UPDATE EVENT" : "PUBLISH EVENT"}
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  @import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap");

  :global(body) {
    margin: 0;
    padding: 0;
    background-color: #111827;
    color: white;
    font-family: "Inter", sans-serif;
    overflow: hidden;
  }

  :global(button),
  :global(input),
  :global(textarea),
  :global(select),
  :global(h1),
  :global(h2),
  :global(h3),
  :global(h4),
  :global(h5),
  :global(h6),
  :global(p),
  :global(span),
  :global(a),
  :global(div),
  :global(label) {
    font-family: "Inter", sans-serif !important;
  }

  :global(::placeholder) {
    font-family: "Inter", sans-serif !important;
  }

  .app-screen {
    height: 100vh;
    display: flex;
    flex-direction: column;
    position: relative;
  }

  .glass-header {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 80px;
    z-index: 50;
    background: rgba(17, 24, 39, 0.95);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(17, 24, 39, 0.95);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .error-border {
    border-color: #ef4444 !important; 
    box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.25) !important;
  }

  .back-btn {
    position: absolute;
    left: 20px;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    cursor: pointer;
    transition: 0.2s;
  }
  .back-btn:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .page-title {
    color: white;
    font-size: 28px;
    font-weight: 700;
    margin: 0;
    letter-spacing: 1px;
  }
  .scroll-container {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
    padding-top: 100px;
    padding-bottom: 40px;
  }
  .scroll-container::-webkit-scrollbar {
    display: none;
  }
  .content-wrapper {
    width: 100%;
    max-width: 400px;
    margin: 0 auto;
    padding: 0 20px;
    box-sizing: border-box;
  }
  .form-card {
    background: white;
    border-radius: 20px;
    padding: 30px 24px;
    color: #111827;
  }

  .upload-section {
    width: 100%;
    height: 120px;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 20px;
    cursor: pointer;
    position: relative;
    border-radius: 12px;
    overflow: hidden;
    background: transparent;
    border: 1px dashed #9ca3af;
    padding: 0;
    font-family: inherit;
  }
  .upload-section:hover {
    background-color: #f9fafb;
  }
  .upload-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    color: #111827;
  }
  .upload-text {
    font-size: 12px;
    color: #6b7280;
    font-weight: 500;
  }
  .camera-icon {
    color: #111827;
  }
  .uploaded-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border: none;
  }
  .change-overlay {
    position: absolute;
    bottom: 0;
    width: 100%;
    background: rgba(0, 0, 0, 0.5);
    color: white;
    font-size: 10px;
    text-align: center;
    padding: 4px;
  }
  .divider {
    height: 1px;
    background-color: #e5e7eb;
    width: 60%;
    margin: 0 auto 24px auto;
  }
  .form-group {
    margin-bottom: 16px;
  }
  .form-row {
    display: flex;
    gap: 12px;
  }
  .form-row .form-group {
    flex: 1;
  }
  .date-row {
    display: flex;
    gap: 8px;
    width: 100%;
  }
  .form-label {
    display: block;
    font-size: 14px;
    font-weight: 600;
    color: #374151;
    margin-bottom: 8px;
  }
  .form-input {
    width: 100%;
    padding: 10px 12px;
    border: 2px solid #9ca3af;
    border-radius: 8px;
    font-size: 14px;
    font-family: "Inter", sans-serif;
    color: #111827;
    box-sizing: border-box;
    outline: none;
    transition: 0.2s;
    background-color: white;
  }
  .form-input:focus {
    border-color: #10b981;
  }
  .form-input::placeholder {
    color: #9ca3af;
  }
  .custom-select-container {
    position: relative;
  }
  .select-trigger {
    text-align: left;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .dropdown-options {
    position: absolute;
    top: calc(100% + 5px);
    left: 0;
    width: 100%;
    max-height: 200px;
    overflow-y: auto;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
    border: 1px solid #e5e7eb;
    z-index: 100;
  }
  .dropdown-options::-webkit-scrollbar {
    width: 6px;
  }
  .dropdown-options::-webkit-scrollbar-track {
    background: transparent;
    margin: 4px 0;
  }
  .dropdown-options::-webkit-scrollbar-thumb {
    background-color: #d1d5db;
    border-radius: 10px;
  }
  .dropdown-options::-webkit-scrollbar-thumb:hover {
    background-color: #9ca3af;
  }
  .option-item {
    display: block;
    width: 100%;
    padding: 10px 12px;
    text-align: left;
    background: white;
    border: none;
    font-size: 14px;
    color: #374151;
    cursor: pointer;
    transition: 0.1s;
  }
  .option-item:hover {
    background-color: #f3f4f6;
  }
  .option-item.selected {
    background-color: #ecfdf5;
    color: #10b981;
    font-weight: 600;
  }
  .text-gray {
    color: #9ca3af;
  }
  .text-dark {
    color: #111827;
  }
  .textarea {
    resize: vertical;
    min-height: 80px;
  }
  .chevron-icon {
    color: #6b7280;
    pointer-events: none;
    transition: transform 0.2s;
  }
  .chevron-icon.rotate {
    transform: rotate(180deg);
  }
  .overlay-icon {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
  }

  .message-container {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 10px 14px;
    border-radius: 8px;
    margin-top: 15px;
    margin-bottom: 5px;
    font-size: 13px;
    font-weight: 600;
    gap: 10px;
    text-align: center;
    width: 100%;
    box-sizing: border-box;
  }

  .message-container.error {
    background-color: #fef2f2;
    border: 1px solid #fecaca;
    color: #b91c1c;
  }

  .message-container.success {
    background-color: #ecfdf5;
    border: 1px solid #a7f3d0;
    color: #047857;
  }

  .publish-btn {
    width: 100%;
    background-color: #10b981; 
    color: white;
    border: none;
    padding: 12px 0;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    margin-top: 15px;
    text-transform: uppercase;
    transition: 0.2s;
    font-family: "Inter", sans-serif;
  }
  .publish-btn:hover {
    background-color: #059669;
  }
</style>
