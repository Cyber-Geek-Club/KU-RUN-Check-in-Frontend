<script lang="ts">
  import { slide } from "svelte/transition";
  import { quintOut } from "svelte/easing";

  let participants = [
    { id: 1, name: "Test dee", progress: 3, total: 3, status: "completed" },
    { id: 2, name: "Test dee", progress: 1, total: 3, status: "in-progress" },
    { id: 3, name: "John Doe", progress: 2, total: 3, status: "in-progress" },
    { id: 4, name: "Sarah Smith", progress: 3, total: 3, status: "completed" },
    {
      id: 5,
      name: "Michael Jordan",
      progress: 1,
      total: 3,
      status: "in-progress",
    },
    { id: 6, name: "Lisa Black", progress: 3, total: 3, status: "completed" },
    {
      id: 7,
      name: "Tom Holland",
      progress: 0,
      total: 3,
      status: "in-progress",
    },
    { id: 8, name: "Jerry West", progress: 2, total: 3, status: "in-progress" },
    { id: 9, name: "Kobe Bryant", progress: 3, total: 3, status: "completed" },
  ];

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
  let currentMonth = "Choose";
  let isDropdownOpen = false;

  function toggleDropdown(event: Event) {
    event.stopPropagation();
    isDropdownOpen = !isDropdownOpen;
  }

  function selectMonth(month: string) {
    currentMonth = month;
    isDropdownOpen = false;
  }

  function closeDropdown() {
    isDropdownOpen = false;
  }

  function getStatusStyle(status: string) {
    if (status === "completed")
      return "background-color: #10B981; color: white;";
    return "background-color: #D1D5DB; color: #374151;";
  }

  function getStatusText(status: string) {
    return status === "completed" ? "Completed" : "In Progress";
  }
</script>

<svelte:window on:click={closeDropdown} />

<div class="app-screen">
  <div class="glass-header">
    <a href="/organizer/create-event" class="back-btn" aria-label="Back">
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

  <div class="pinned-month-selector">
    <div class="month-selector-container">
      <button
        class="month-btn {isDropdownOpen ? 'open' : ''}"
        on:click={toggleDropdown}
      >
        {currentMonth}
        <svg
          class="arrow-icon {isDropdownOpen ? 'rotate' : ''}"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="3"
          stroke-linecap="round"
          stroke-linejoin="round"
          ><polyline points="6 9 12 15 18 9"></polyline></svg
        >
      </button>

      {#if isDropdownOpen}
        <div
          class="dropdown-menu"
          transition:slide={{ duration: 300, easing: quintOut, axis: "y" }}
        >
          <div class="dropdown-inner">
            {#each months as month}
              <button
                class="dropdown-item {month === currentMonth ? 'active' : ''}"
                on:click={(e) => {
                  e.stopPropagation();
                  selectMonth(month);
                }}
              >
                {month}
              </button>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  </div>

  <div class="scroll-container">
    <div class="content-wrapper">
      <div class="list-container">
        {#each participants as item (item.id)}
          <div class="card">
            <div class="card-info">
              <h3 class="card-name">Name: {item.name}</h3>
              <p class="card-progress">
                Progress: {item.progress}/{item.total}
              </p>
            </div>
            <div class="card-action">
              <div class="status-badge" style={getStatusStyle(item.status)}>
                {getStatusText(item.status)}
              </div>
            </div>
          </div>
        {/each}
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
  :global(div) {
    font-family: "Inter", sans-serif !important;
  }

  .app-screen {
    height: 100vh;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
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
    text-transform: uppercase;
  }

  .pinned-month-selector {
    position: absolute;
    top: 85px;
    left: 0;
    width: 100%;
    z-index: 40;
    background: transparent;
    padding-top: 15px;
    display: flex;
    justify-content: center;
    pointer-events: none;
  }

  .month-selector-container {
    position: relative;
    display: inline-block;
    width: 120px;
    pointer-events: auto;
  }

  .month-btn {
    width: 100%;
    padding: 8px 16px;
    border-radius: 30px;
    background-color: white;
    color: #111827;
    border: none;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
    transition: 0.2s;
  }
  .month-btn:active {
    transform: scale(0.98);
    background-color: #f3f4f6;
  }
  .month-btn:hover,
  .month-btn.open {
    background-color: #f9fafb;
  }

  .dropdown-menu {
    position: absolute;
    top: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    background: white;
    border-radius: 16px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
    z-index: 100;
    padding: 6px;
    box-sizing: border-box;
  }

  .dropdown-inner {
    max-height: 200px;
    overflow-y: auto;
    padding-right: 2px;
    -webkit-overflow-scrolling: touch;
  }
  .dropdown-inner::-webkit-scrollbar {
    width: 4px;
  }
  .dropdown-inner::-webkit-scrollbar-thumb {
    background-color: #cbd5e0;
    border-radius: 10px;
  }

  .dropdown-item {
    display: flex;
    align-items: center;
    width: 100%;
    padding: 8px 12px;
    text-align: left;
    background: transparent;
    border: none;
    color: #4a5568;
    font-size: 13px;
    cursor: pointer;
    border-radius: 8px;
    font-weight: 500;
    margin-bottom: 2px;
    box-sizing: border-box;
  }
  .dropdown-item:hover {
    background-color: #f7fafc;
    color: #2d3748;
  }
  .dropdown-item.active {
    background-color: #e6f9ee;
    color: #00c266;
    font-weight: 600;
  }

  .arrow-icon {
    transition: transform 0.3s ease;
  }
  .arrow-icon.rotate {
    transform: rotate(180deg);
  }

  .scroll-container {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
    padding-top: 150px;
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

  .list-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .card {
    background: white;
    border-radius: 12px;
    padding: 16px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .card-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .card-name {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: #111827;
  }
  .card-progress {
    margin: 0;
    font-size: 12px;
    color: #4b5563;
    font-weight: 500;
  }

  .card-action {
    display: flex;
    align-items: center;
  }

  .status-badge {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    padding: 6px 12px;
    border-radius: 6px;
    min-width: 80px;
    text-align: center;
  }
</style>
