<script lang="ts">
  import { onMount } from "svelte";
  import Swal from "sweetalert2";
  import { fly, fade, slide } from "svelte/transition";


  interface UserTracker {
    id: number;
    user_id: string;
    full_name: string;
    current_val: number;
    target_val: number;
    started_at: string;
    time_limit_days: number;
    status: "ongoing" | "completed" | "expired";
  }

  let rawData: UserTracker[] = [];
  let displayList: UserTracker[] = [];
  let isLoading = false;

  let searchUserId = "";

  let activeDropdown: "month" | "status" | null = null;

  let selectedMonthVal = "";
  let selectedMonthLabel = "All Months";

  let selectedProgressVal = "";
  let selectedProgressLabel = "-- Show All --";

  let messageDrafts: Record<number, string> = {};
  let isEditModalOpen = false;
  let editForm: UserTracker | null = null;


  let editError = "";
  let errorTimer: any = null;

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

  const progressOptions = [
    { value: "completed", label: "Completed" },
    { value: "ongoing_high", label: "Almost Done" },
    { value: "ongoing_mid", label: "In Progress" },
    { value: "not_started", label: "Not Started" },
    { value: "expired", label: "Expired / Time's up" },
  ];

  onMount(() => {
    loadMockData();
    window.addEventListener("click", (e: any) => {
      if (!e.target.closest(".custom-select-wrapper")) {
        activeDropdown = null;
      }
    });
  });

  function loadMockData() {
    isLoading = true;
    setTimeout(() => {
      rawData = [
        {
          id: 1,
          user_id: "user_alice",
          full_name: "Alice Skywalker",
          current_val: 8,
          target_val: 10,
          started_at: new Date(
            new Date().setDate(new Date().getDate() - 2)
          ).toISOString(),
          time_limit_days: 7,
          status: "ongoing",
        },
        {
          id: 2,
          user_id: "user_bob",
          full_name: "Bob The Builder",
          current_val: 5,
          target_val: 5,
          started_at: "2023-10-01T09:00:00Z",
          time_limit_days: 30,
          status: "completed",
        },
        {
          id: 3,
          user_id: "user_charlie",
          full_name: "Charlie Puth",
          current_val: 1,
          target_val: 20,
          started_at: new Date(
            new Date().setDate(new Date().getDate() - 20)
          ).toISOString(),
          time_limit_days: 15,
          status: "ongoing",
        },
        {
          id: 4,
          user_id: "user_dave",
          full_name: "Dave Grohl",
          current_val: 0,
          target_val: 10,
          started_at: new Date().toISOString(),
          time_limit_days: 5,
          status: "ongoing",
        },
      ];
      applyFilters();
      isLoading = false;
    }, 500);
  }

  function toggleDropdown(name: "month" | "status") {
    activeDropdown = activeDropdown === name ? null : name;
  }

  function selectMonth(index: number | null) {
    if (index === null) {
      selectedMonthVal = "";
      selectedMonthLabel = "All Months";
    } else {
      selectedMonthVal = index.toString();
      selectedMonthLabel = months[index];
    }
    activeDropdown = null;
    applyFilters();
  }

  function selectStatus(val: string, label: string) {
    selectedProgressVal = val;
    selectedProgressLabel = label;
    activeDropdown = null;
    applyFilters();
  }

  function getProgressPercent(current: number, target: number) {
    if (target <= 0) return 100;
    return Math.min(100, Math.max(0, (current / target) * 100));
  }

  function getTimeInfo(startedAt: string, limitDays: number) {
    if (!limitDays)
      return { text: "∞ Unlimited Time", isExpired: false, daysLeft: 999 };
    const diff =
      new Date(startedAt).getTime() +
      limitDays * 86400000 -
      new Date().getTime();
    if (diff <= 0)
      return { text: "⚠️ Time's Up!", isExpired: true, daysLeft: -1 };
    return {
      text: `⏳ ${Math.ceil(diff / 86400000)} days left`,
      isExpired: false,
      daysLeft: Math.ceil(diff / 86400000),
    };
  }

  function applyFilters() {
    let list = [...rawData];
    if (searchUserId)
      list = list.filter(
        (i) =>
          i.user_id.toLowerCase().includes(searchUserId.toLowerCase()) ||
          i.full_name.toLowerCase().includes(searchUserId.toLowerCase())
      );
    if (selectedMonthVal !== "")
      list = list.filter(
        (i) => new Date(i.started_at).getMonth() === parseInt(selectedMonthVal)
      );
    if (selectedProgressVal) {
      list = list.filter((item) => {
        const pct = getProgressPercent(item.current_val, item.target_val);
        const t = getTimeInfo(item.started_at, item.time_limit_days);
        switch (selectedProgressVal) {
          case "completed":
            return pct >= 100;
          case "ongoing_high":
            return pct >= 80 && pct < 100 && !t.isExpired;
          case "ongoing_mid":
            return pct > 0 && pct < 80 && !t.isExpired;
          case "not_started":
            return pct === 0 && !t.isExpired;
          case "expired":
            return t.isExpired && pct < 100;
          default:
            return true;
        }
      });
    }
    displayList = list;
  }

  function resetFilters() {
    searchUserId = "";
    selectedMonthVal = "";
    selectedMonthLabel = "All Months";
    selectedProgressVal = "";
    selectedProgressLabel = "-- Show All --";
    applyFilters();
  }

  function sendMessage(id: number, user: string) {
    if (!messageDrafts[id])
      return Swal.fire("Oops", "Please type a message", "warning");
    Swal.fire({
      icon: "success",
      title: "Message Sent!",
      text: `To ${user}: "${messageDrafts[id]}"`,
      timer: 1500,
      showConfirmButton: false,
    });
    messageDrafts[id] = "";
  }

  async function handleDelete(item: UserTracker) {
    const res = await Swal.fire({
      title: "Delete?",
      text: `Remove "${item.full_name}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Yes, Delete",
    });
    if (res.isConfirmed) {
      rawData = rawData.filter((r) => r.id !== item.id);
      applyFilters();
      Swal.fire("Deleted!", "", "success");
    }
  }

  function openEditModal(item: UserTracker) {
    editForm = { ...item };
    clearError();
    isEditModalOpen = true;
  }

  function showError(msg: string) {
    if (errorTimer) clearTimeout(errorTimer);
    editError = msg;
    errorTimer = setTimeout(() => {
      editError = "";
    }, 3000);
  }

  function clearError() {
    if (errorTimer) clearTimeout(errorTimer);
    editError = "";
  }

  function saveUpdate() {
    if (!editForm) return;
    if (editForm.current_val > editForm.target_val) {
      showError("Progress cannot exceed Goal");
      return;
    }
    const idx = rawData.findIndex((r) => r.id === editForm!.id);
    if (idx !== -1) {
      editForm.status =
        editForm.current_val >= editForm.target_val ? "completed" : "ongoing";
      rawData[idx] = { ...editForm };
      applyFilters();
    }
    isEditModalOpen = false;
  }

  function adjustEditProgress(amount: number) {
    if (!editForm) return;
    clearError();
    const newVal = editForm.current_val + amount;
    if (newVal >= 0) editForm.current_val = newVal;
  }

  function adjustEditTarget(amount: number) {
    if (!editForm) return;
    clearError();
    const newVal = editForm.target_val + amount;
    if (newVal >= 1) editForm.target_val = newVal;
  }

  function handleKeydown(e: KeyboardEvent, callback: () => void) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      callback();
    }
  }
</script>

<div class="app-screen">
  <div class="glass-header">
    <a href="/organizer/event-log" class="back-btn" aria-label="Back">
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <line x1="19" y1="12" x2="5" y2="12"></line>
        <polyline points="12 19 5 12 12 5"></polyline>
      </svg>
    </a>
    <h1 class="page-title">MONTHLY REWARD</h1>
  </div>

  <div class="scroll-container">
    <div class="static-controls-area">
      <div class="content-wrapper">
        <div class="control-panel">
          <div class="filter-row">
            <div class="input-box flex-2">
              <label for="search">Search User</label>
              <input
                id="search"
                type="text"
                bind:value={searchUserId}
                on:input={applyFilters}
                placeholder="Search name..."
              />
            </div>

            <div class="input-box flex-1">
              <label for="month-trigger">Start Month</label>
              <div class="custom-select-wrapper">
                <button
                  id="month-trigger"
                  type="button"
                  class="custom-select-trigger"
                  on:click={() => toggleDropdown("month")}
                >
                  <span>{selectedMonthLabel}</span>
                  <span class="arrow" class:open={activeDropdown === "month"}
                    >▼</span
                  >
                </button>
                {#if activeDropdown === "month"}
                  <div
                    class="custom-options"
                    transition:slide={{ duration: 200 }}
                  >
                    <div
                      role="button"
                      tabindex="0"
                      class="option-item"
                      class:selected={selectedMonthVal === ""}
                      on:click={() => selectMonth(null)}
                      on:keydown={(e) =>
                        handleKeydown(e, () => selectMonth(null))}
                    >
                      All Months
                    </div>
                    {#each months as m, i}
                      <div
                        role="button"
                        tabindex="0"
                        class="option-item"
                        class:selected={selectedMonthVal === i.toString()}
                        on:click={() => selectMonth(i)}
                        on:keydown={(e) =>
                          handleKeydown(e, () => selectMonth(i))}
                      >
                        {m}
                      </div>
                    {/each}
                  </div>
                {/if}
              </div>
            </div>
          </div>

          <div class="filter-row">
            <div class="input-box flex-2">
              <label for="status-trigger">Status</label>
              <div class="custom-select-wrapper">
                <button
                  id="status-trigger"
                  type="button"
                  class="custom-select-trigger"
                  on:click={() => toggleDropdown("status")}
                >
                  <span>{selectedProgressLabel}</span>
                  <span class="arrow" class:open={activeDropdown === "status"}
                    >▼</span
                  >
                </button>
                {#if activeDropdown === "status"}
                  <div
                    class="custom-options"
                    transition:slide={{ duration: 200 }}
                  >
                    <div
                      role="button"
                      tabindex="0"
                      class="option-item"
                      class:selected={selectedProgressVal === ""}
                      on:click={() => selectStatus("", "-- Show All --")}
                      on:keydown={(e) =>
                        handleKeydown(e, () =>
                          selectStatus("", "-- Show All --")
                        )}
                    >
                      -- Show All --
                    </div>
                    {#each progressOptions as opt}
                      <div
                        role="button"
                        tabindex="0"
                        class="option-item"
                        class:selected={selectedProgressVal === opt.value}
                        on:click={() => selectStatus(opt.value, opt.label)}
                        on:keydown={(e) =>
                          handleKeydown(e, () =>
                            selectStatus(opt.value, opt.label)
                          )}
                      >
                        {opt.label}
                      </div>
                    {/each}
                  </div>
                {/if}
              </div>
            </div>
            <div class="input-box w-auto">
              <span class="label-spacer">&nbsp;</span>
              <button class="btn-reset" on:click={resetFilters}>Reset</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="content-wrapper">
      <div class="list-area">
        {#if isLoading}
          <div class="msg">Loading data...</div>
        {:else if displayList.length === 0}
          <div class="msg">No data found.</div>
        {:else}
          {#each displayList as item (item.id)}
            {@const percent = getProgressPercent(
              item.current_val,
              item.target_val
            )}
            {@const timeInfo = getTimeInfo(
              item.started_at,
              item.time_limit_days
            )}
            {@const isDone = percent >= 100}

            <div class="tracker-card" in:fly={{ y: 20, duration: 300 }}>
              <div class="card-top">
                <div class="reward-info">
                  <h3>{item.full_name}</h3>
                  <div class="user-pill">ID: {item.user_id}</div>
                </div>
                <div
                  class="status-badge {isDone
                    ? 'done'
                    : timeInfo.isExpired
                      ? 'fail'
                      : 'active'}"
                >
                  {isDone
                    ? "COMPLETED"
                    : timeInfo.isExpired
                      ? "EXPIRED"
                      : "ONGOING"}
                </div>
              </div>

              <div class="progress-section">
                <div class="bar-labels">
                  <span>Progress</span>
                  <span class="nums"
                    ><span class="curr">{item.current_val}</span> / {item.target_val}</span
                  >
                </div>
                <div class="track-bg">
                  <div
                    class="track-fill"
                    class:success={isDone}
                    class:danger={timeInfo.isExpired && !isDone}
                    style="width: {percent}%"
                  ></div>
                </div>
              </div>

              <div class="meta-row">
                <div class="meta-item">
                  Started: {new Date(item.started_at).toLocaleDateString()}
                </div>
                <div
                  class="meta-item time-remaining"
                  class:urgent={timeInfo.daysLeft < 3 &&
                    !isDone &&
                    !timeInfo.isExpired}
                >
                  {timeInfo.text}
                </div>
              </div>

              <div class="admin-controls">
                <button
                  class="action-btn edit"
                  on:click={() => openEditModal(item)}>Edit</button
                >
                <button
                  class="action-btn delete"
                  on:click={() => handleDelete(item)}>Delete</button
                >
              </div>

              <div class="action-footer">
                <input
                  type="text"
                  class="msg-input"
                  placeholder="Type a message..."
                  bind:value={messageDrafts[item.id]}
                />
                <button
                  class="send-btn"
                  on:click={() => sendMessage(item.id, item.user_id)}
                  aria-label="Send message"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    ><line x1="22" y1="2" x2="11" y2="13"></line><polygon
                      points="22 2 15 22 11 13 2 9 22 2"
                    ></polygon></svg
                  >
                </button>
              </div>
            </div>
          {/each}
        {/if}
      </div>
    </div>
  </div>

  {#if isEditModalOpen && editForm}
    <div class="modal-overlay" transition:fade role="dialog" aria-modal="true">
      <div class="modal-box" in:fly={{ y: 50, duration: 300 }}>
        <div class="modal-header">
          <h2>Edit User</h2>
          <button
            class="close-icon"
            on:click={() => (isEditModalOpen = false)}
            aria-label="Close modal">✕</button
          >
        </div>
        <div class="modal-body">
          <div class="form-info">
            <strong>{editForm.full_name}</strong> ({editForm.user_id})
          </div>
          <div class="form-group">
            <label for="edit-progress">Progress</label>
            <div class="input-stepper">
              <button type="button" on:click={() => adjustEditProgress(-1)}
                >-</button
              >
              <input
                id="edit-progress"
                type="number"
                bind:value={editForm.current_val}
                on:input={clearError}
              />
              <button type="button" on:click={() => adjustEditProgress(1)}
                >+</button
              >
            </div>
          </div>
          <div class="form-group">
            <label for="edit-target">Goal</label>
            <div class="input-stepper">
              <button type="button" on:click={() => adjustEditTarget(-1)}
                >-</button
              >
              <input
                id="edit-target"
                type="number"
                bind:value={editForm.target_val}
                min="1"
                on:input={clearError}
              />
              <button type="button" on:click={() => adjustEditTarget(1)}
                >+</button
              >
            </div>
          </div>
        </div>

        {#if editError}
          <div class="modal-error-box" transition:slide>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="error-icon"
              ><circle cx="12" cy="12" r="10"></circle><line
                x1="12"
                y1="8"
                x2="12"
                y2="12"
              ></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg
            >
            <span>{editError}</span>
          </div>
        {/if}

        <div class="modal-footer">
          <button class="btn-cancel" on:click={() => (isEditModalOpen = false)}
            >Cancel</button
          >
          <button class="btn-save" on:click={saveUpdate}>Save</button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  :global(body) {
    margin: 0;
    background-color: #111827;
    color: #334155;
    font-family: "Inter", "Segoe UI", sans-serif;
  }
  .app-screen {
    height: 100vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
  }

  .glass-header {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 80px;
    z-index: 50;
    background: #111827;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid #111827;
    display: flex;
    align-items: center;
    justify-content: center;
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
    margin: 0;
    font-size: 28px;
    font-weight: 700;
    color: #ffffff;
    letter-spacing: 0.5px;
  }

  .scroll-container {
    flex: 1;
    width: 100%;
    overflow-y: auto;
    padding-top: 60px;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  .scroll-container::-webkit-scrollbar {
    display: none;
  }
  .static-controls-area {
    position: sticky;
    top: 0;
    z-index: 40;
    padding: 20px 20px 0 20px;
    pointer-events: none;
  }
  .content-wrapper {
    max-width: 550px;
    margin: 0 auto;
    padding-bottom: 20px;
  }
  .list-area {
    padding: 0 20px;
  }

  .control-panel {
    background: #ffffff;
    padding: 16px;
    border-radius: 12px;
    margin-bottom: 16px;
    border: 1px solid #e2e8f0;
    pointer-events: auto;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  }
  .filter-row {
    display: flex;
    gap: 12px;
    margin-bottom: 12px;
    align-items: flex-end;
  }
  .filter-row:last-child {
    margin-bottom: 0;
  }
  .input-box {
    display: flex;
    flex-direction: column;
  }
  .input-box label {
    font-size: 11px;
    color: #64748b;
    margin-bottom: 5px;
    font-weight: 600;
    text-transform: uppercase;
  }
  .label-spacer {
    display: block;
    margin-bottom: 5px;
  }
  .flex-1 {
    flex: 1;
  }
  .flex-2 {
    flex: 2;
  }
  .w-auto {
    width: auto;
  }

  input {
    background: #ffffff;
    border: 1px solid #cbd5e1;
    color: #1e293b;
    padding: 10px;
    border-radius: 6px;
    width: 100%;
    box-sizing: border-box;
    font-size: 13px;
    transition: 0.2s;
  }
  input:focus {
    border-color: #3b82f6;
    outline: none;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }

  .custom-select-wrapper {
    position: relative;
    width: 100%;
    font-size: 13px;
  }

  .custom-select-trigger {
    background: #ffffff;
    border: 1px solid #cbd5e1;
    color: #1e293b;
    padding: 10px;
    border-radius: 6px;
    width: 100%;
    box-sizing: border-box;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    transition: 0.2s;
  }
  .custom-select-trigger:hover {
    border-color: #94a3b8;
  }
  .custom-select-trigger:focus {
    border-color: #10b981;
  }

  .arrow {
    font-size: 10px;
    color: #94a3b8;
  }
  .arrow.open {
    transform: rotate(180deg);
    color: #10b981;
  }

  .custom-options {
    position: absolute;
    top: 105%;
    left: 0;
    width: 100%;
    box-sizing: border-box;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    z-index: 100;
    max-height: 200px;
    overflow-y: auto;
    overflow-x: hidden;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  }

  .custom-options::-webkit-scrollbar {
    width: 5px;
  }
  .custom-options::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-options::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 10px;
  }
  .custom-options::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }

  .option-item {
    padding: 10px 12px;
    cursor: pointer;
    color: #475569;
    border-bottom: 1px solid #f1f5f9;
  }
  .option-item:last-child {
    border-bottom: none;
  }
  .option-item:hover {
    background: #f8fafc;
    color: #0f172a;
  }
  .option-item.selected {
    background: #eff6ff;
    color: #10b981;
    font-weight: 600;
  }

  .btn-reset {
    background: #e2e8f0;
    color: #475569;
    border: none;
    padding: 0 16px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    height: 38px;
  }
  .btn-reset:hover {
    background: #cbd5e1;
  }

  .tracker-card {
    background: white;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 16px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
    position: relative;
  }
  .card-top {
    display: flex;
    justify-content: space-between;
    margin-bottom: 12px;
  }
  .reward-info h3 {
    margin: 0 0 4px 0;
    font-size: 15px;
    font-weight: 700;
    color: #1e293b;
  }
  .user-pill {
    font-size: 11px;
    color: #64748b;
    background: #f1f5f9;
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-weight: 500;
  }

  .status-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 26px;
    min-width: 85px;
    padding: 0 12px;
    border-radius: 99px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    line-height: 1;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  }
  .status-badge.done {
    background: #dcfce7;
    color: #15803d;
    border: 1px solid #bbf7d0;
  }
  .status-badge.active {
    background: #eff6ff;
    color: #1d4ed8;
    border: 1px solid #dbeafe;
  }
  .status-badge.fail {
    background: #fef2f2;
    color: #b91c1c;
    border: 1px solid #fee2e2;
  }

  .progress-section {
    margin-bottom: 14px;
  }
  .bar-labels {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    font-weight: 600;
    margin-bottom: 6px;
    color: #64748b;
  }
  .nums .curr {
    color: #0f172a;
    font-weight: 700;
  }
  .track-bg {
    height: 8px;
    background: #f1f5f9;
    border-radius: 4px;
    overflow: hidden;
  }
  .track-fill {
    height: 100%;
    background: #10b981;
    border-radius: 4px;
    transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .track-fill.success {
    background: #10b981;
  }
  .track-fill.danger {
    background: #ef4444;
  }

  .meta-row {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: #64748b;
    margin-bottom: 12px;
    padding-bottom: 10px;
    border-bottom: 1px dashed #e2e8f0;
  }
  .time-remaining.urgent {
    color: #ea580c;
    font-weight: 700;
  }

  /* Admin Buttons */
  .admin-controls {
    display: flex;
    gap: 10px;
    margin-bottom: 12px;
    padding-bottom: 12px;
    border-bottom: 1px solid #f1f5f9;
  }
  .action-btn {
    flex: 1;
    padding: 10px;
    border-radius: 8px;
    border: 1px solid transparent;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .action-btn.edit {
    background: #eff6ff;
    color: #10b981;
    border-color: #dbeafe;
  }
  .action-btn.edit:hover {
    background: #10b981;
    color: #ffffff;
    border-color: #10b981;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
  }
  .action-btn.delete {
    background: #fef2f2;
    color: #dc2626;
    border-color: #fee2e2;
  }
  .action-btn.delete:hover {
    background: #ef4444;
    color: #ffffff;
    border-color: #ef4444;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(239, 68, 68, 0.2);
  }
  .action-footer {
    display: flex;
    gap: 8px;
  }
  .msg-input {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    color: #334155;
  }
  .msg-input:focus {
    background: white;
    border-color: #10b981;
  }
  .send-btn {
    background: #10b981;
    color: white;
    border: none;
    border-radius: 6px;
    width: 40px;
    height: 38px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: 0.2s;
    padding: 0;
  }
  .send-btn:hover {
    background: #0b7652;
  }
  .msg {
    text-align: center;
    color: #94a3b8;
    margin-top: 40px;
    font-size: 14px;
  }


  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(2px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 60;
    padding: 20px;
  }
  .modal-box {
    background: #ffffff;
    width: 100%;
    max-width: 380px;
    border-radius: 12px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }
  .modal-header {
    padding: 15px 20px;
    border-bottom: 1px solid #f1f5f9;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #f8fafc;
  }
  .modal-header h2 {
    margin: 0;
    font-size: 16px;
    color: #1e293b;
  }
  .close-icon {
    background: none;
    border: none;
    color: #94a3b8;
    font-size: 20px;
    cursor: pointer;
  }

  .modal-body {
    padding: 20px;
  }
  .form-info {
    font-size: 13px;
    color: #475569;
    background: #f1f5f9;
    padding: 10px;
    border-radius: 6px;
    margin-bottom: 16px;
    border: 1px solid #e2e8f0;
  }
  .form-group {
    margin-bottom: 16px;
  }
  .form-group label {
    display: block;
    color: #64748b;
    font-size: 11px;
    margin-bottom: 6px;
    font-weight: 700;
    text-transform: uppercase;
  }

  /* Stepper */
  .input-stepper {
    display: flex;
    align-items: center;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    overflow: hidden;
    background: #ffffff;
    height: 40px;
  }
  .input-stepper button {
    width: 44px;
    height: 100%;
    background: #f8fafc;
    border: none;
    color: #334155;
    font-size: 18px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
    border-right: 1px solid #f1f5f9;
  }
  .input-stepper button:last-child {
    border-right: none;
    border-left: 1px solid #f1f5f9;
  }
  .input-stepper button:hover {
    background: #e2e8f0;
    color: #0f172a;
  }
  .input-stepper button:active {
    background: #cbd5e1;
  }
  .input-stepper input {
    flex: 1;
    text-align: center;
    border: none;
    background: transparent;
    color: #0f172a;
    font-size: 16px;
    font-weight: 700;
    padding: 0;
    height: 100%;
  }
  .input-stepper input:focus {
    outline: none;
    box-shadow: none;
  }
  .input-stepper input::-webkit-outer-spin-button,
  .input-stepper input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  /* Error Box Styles */
  .modal-error-box {
    margin: 0 20px 15px 20px;
    background: #fef2f2;
    border: 1px solid #fee2e2;
    color: #dc2626;
    padding: 10px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  .error-icon {
    color: #dc2626;
    width: 18px;
    height: 18px;
  }

  .modal-footer {
    padding: 15px 20px;
    background: #f8fafc;
    display: flex;
    gap: 10px;
    border-top: 1px solid #f1f5f9;
  }
  .btn-cancel {
    flex: 1;
    background: white;
    border: 1px solid #cbd5e1;
    color: #475569;
    padding: 10px;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
  }
  .btn-cancel:hover {
    background: #f1f5f9;
  }
  .btn-save {
    flex: 1;
    background: #10b981;
    border: none;
    color: white;
    font-weight: 600;
    padding: 10px;
    border-radius: 6px;
    cursor: pointer;
  }
  .btn-save:hover {
    background: #0b7652;
  }
</style>
