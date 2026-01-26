<script lang="ts">
  import { appState } from "../../_lib/stores/appState";
  import { onMount } from "svelte";
  import api from "../../_lib/api/client";
  import { endpoints } from "$lib/api/endpoints";

  export let actionFilter: string;
  export let eventFilter: string;
  export let dateRange: { start: string; end: string };

  $: lang = $appState.currentLang;

  let events: any[] = [];

  const actions = [
    { value: "all", label: { th: "ทั้งหมด", en: "All" } },
    { value: "check_in", label: { th: "เช็คอิน", en: "Check-in" } },
    { value: "check_out", label: { th: "เช็คเอาท์", en: "Check-out" } },
    { value: "register", label: { th: "ลงทะเบียน", en: "Register" } },
    { value: "approve", label: { th: "อนุมัติ", en: "Approve" } },
    { value: "reject", label: { th: "ปฏิเสธ", en: "Reject" } },
  ];

  onMount(async () => {
    try {
      const response = await api.get(endpoints.events.list);
      events = response.data;
    } catch (error) {
      console.error("Failed to load events:", error);
    }
  });
</script>

<div class="log-filters">
  <select class="filter-select" bind:value={actionFilter}>
    {#each actions as action}
      <option value={action.value}>{action.label[lang]}</option>
    {/each}
  </select>

  <select class="filter-select" bind:value={eventFilter}>
    <option value="all"
      >{lang === "th" ? "กิจกรรมทั้งหมด" : "All Events"}</option
    >
    {#each events as event}
      <option value={event.id}>{event.title}</option>
    {/each}
  </select>

  <input
    type="date"
    class="date-input"
    bind:value={dateRange.start}
    placeholder={lang === "th" ? "วันที่เริ่ม" : "Start date"}
  />
  <input
    type="date"
    class="date-input"
    bind:value={dateRange.end}
    placeholder={lang === "th" ? "วันที่สิ้นสุด" : "End date"}
  />

  {#if actionFilter !== "all" || eventFilter !== "all" || dateRange.start || dateRange.end}
    <button
      class="btn-reset"
      on:click={() => {
        actionFilter = "all";
        eventFilter = "all";
        dateRange = { start: "", end: "" };
      }}
    >
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
      {lang === "th" ? "รีเซ็ต" : "Reset"}
    </button>
  {/if}
</div>

<style>
  .log-filters {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
  }
  .filter-select,
  .date-input {
    padding: 0.75rem 1rem;
    border: 1px solid var(--border);
    border-radius: 8px;
    font-size: 0.875rem;
    background: white;
  }
  .filter-select:focus,
  .date-input:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.1);
  }
  .btn-reset {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: var(--bg-alt);
    border: 1px solid var(--border);
    border-radius: 8px;
    font-size: 0.875rem;
    cursor: pointer;
  }
  .btn-reset:hover {
    background: var(--bg-hover);
    border-color: var(--primary);
  }
  .btn-reset svg {
    width: 16px;
    height: 16px;
  }
</style>
