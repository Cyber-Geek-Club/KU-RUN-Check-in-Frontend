<script lang="ts">
  import { onMount } from "svelte";
  import ParticipantHistoryViewer from "$lib/components/organizer/ParticipantHistoryViewer.svelte";
  import { lazyLoad } from '$lib/utils/lazyLoad';

  const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(
    /\/$/,
    ""
  );

  interface User {
    id: number;
    first_name: string;
    last_name: string;
    profile_url?: string;
  }
  interface Participation {
    event_id: number;
    id: number;
    user_id: number;
    status: string;
    created_at?: string;
  }
  interface LogParticipant {
    id: number;
    name: string;
    avatar: string;
    profileUrl?: string;
    originalIndex?: number;
  }
  interface LogEntry {
    action: string;
    timestamp: string;
    detail?: string;
    type: "success" | "warning" | "error" | "info";
    participants?: LogParticipant[];
  }
  interface EventData {
    id: number;
    title: string;
    dateDisplay: string;
    rawDate: Date | null;
    image: string;
    logs: LogEntry[];
    statsLoaded: boolean;
    isLoading: boolean;
    searchQuery: string;
  }
  let events: EventData[] = [];
  let isLoadingAll = true;
  let expandedEventId: number | null = null;
  let contentHeights: Record<number, number> = {};
  
  // View mode: 'logs' or 'history'
  let viewMode: 'logs' | 'history' = 'logs';
  let currentLang: 'th' | 'en' = 'th';

  let mainSearchQuery = "";
  let showDateFilter = false;
  let isSearchFocused = false;

  let selectedYear: number | "All" = "All";
  let selectedMonth: number | "All" = "All";

  const filterMonths = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  let currentPage = 1;
  let itemsPerPage = 5;

  $: availableYears = Array.from(
    new Set(
      events
        .map((e) => (e.rawDate ? e.rawDate.getFullYear() : null))
        .filter((y): y is number => y !== null)
    )
  ).sort((a, b) => b - a);

  $: filteredEvents = events.filter((e) => {
    const matchesText = e.title
      .toLowerCase()
      .includes(mainSearchQuery.trim().toLowerCase());

    let matchesYear = true;
    if (selectedYear !== "All" && e.rawDate) {
      matchesYear = e.rawDate.getFullYear() === selectedYear;
    }

    let matchesMonth = true;
    if (selectedMonth !== "All" && e.rawDate) {
      matchesMonth = e.rawDate.getMonth() === selectedMonth;
    }

    return matchesText && matchesYear && matchesMonth;
  });

  $: {
    if (mainSearchQuery || selectedYear || selectedMonth) {
      currentPage = 1;
    }
  }

  $: totalPages = Math.ceil(filteredEvents.length / itemsPerPage);

  $: paginatedEvents = filteredEvents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  function changePage(step: number) {
    const nextPage = currentPage + step;
    if (nextPage >= 1 && nextPage <= totalPages) {
      currentPage = nextPage;
      document
        .querySelector(".scroll-container")
        ?.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  onMount(() => {
    window.addEventListener("click", handleClickOutside);
    (async () => {
      try {
        const token = localStorage.getItem("access_token");
        await fetchEventList(token);
      } catch (error) {
        console.error("Failed to load events:", error);
      } finally {
        isLoadingAll = false;
      }
    })();
    return () => window.removeEventListener("click", handleClickOutside);
  });

  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest(".search-filter-wrapper")) {
      showDateFilter = false;
    }
  }

  async function fetchEventList(token: string | null) {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}/api/events/`, { headers });
    if (!res.ok) throw new Error("Fetch failed");
    const data = await res.json();
    const list = Array.isArray(data) ? data : data.data || [];

    events = list.map((evt: any) => ({
      id: evt.id,
      title: evt.title,
      dateDisplay: formatDate(evt.event_date),
      rawDate: evt.event_date ? new Date(evt.event_date) : null,
      image: evt.banner_image_url || "https://via.placeholder.com/400x200",
      logs: [],
      statsLoaded: false,
      isLoading: false,
      searchQuery: "",
    }));
  }

  async function fetchUserDetails(
    userId: number,
    token: string | null
  ): Promise<User | null> {
    try {
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const r = await fetch(`${API_BASE_URL}/api/users/${userId}`, { headers });
      return r.ok ? await r.json() : null;
    } catch {
      return null;
    }
  }

  async function fetchParticipants(eventId: number) {
    const idx = events.findIndex((e) => e.id === eventId);
    if (idx === -1 || events[idx].statsLoaded) return;
    events[idx].isLoading = true;
    events = events;

    const token = localStorage.getItem("access_token");
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/participations/event/${eventId}`,
        { headers }
      );
      if (res.ok) {
        const raw = await res.json();
        const list: Participation[] = Array.isArray(raw) ? raw : raw.data || [];
        const uids = [...new Set(list.map((p) => p.user_id))];
        const users = await Promise.all(
          uids.map((u) => fetchUserDetails(u, token))
        );
        const uMap: Record<number, User> = {};
        users.forEach((u) => {
          if (u) uMap[u.id] = u;
        });
        events[idx].logs = convertParticipantsToLogs(list, uMap);
        events[idx].statsLoaded = true;
      } else {
        events[idx].logs = [{ action: "Error", timestamp: "-", type: "error" }];
      }
    } catch {
      events[idx].logs = [{ action: "Error", timestamp: "-", type: "error" }];
    } finally {
      if (events[idx]) {
        events[idx].isLoading = false;
        events = events;
      }
    }
  }

  function convertParticipantsToLogs(
    list: Participation[],
    userMap: Record<number, User>
  ): LogEntry[] {
    const logs: LogEntry[] = [];
    const uniqueMap = new Map<number, LogParticipant>();
    const groups: Record<string, LogParticipant[]> = {};
    list.forEach((p, i) => {
      const u = userMap[p.user_id];
      const obj: LogParticipant = {
        id: p.user_id,
        name: u ? `${u.first_name} ${u.last_name}` : `ID: ${p.user_id}`,
        avatar: u?.first_name[0].toUpperCase() || "?",
        profileUrl: u?.profile_url,
      };
      if (!uniqueMap.has(p.user_id)) uniqueMap.set(p.user_id, obj);
      const s = p.status || "unknown";
      if (!groups[s]) groups[s] = [];
      groups[s].push(obj);
    });
    logs.push({
      action: "Total Participants",
      timestamp: `${uniqueMap.size}`,
      type: "info",
      participants: Array.from(uniqueMap.values()),
    });
    if (list.length === 0) return logs;
    const prio = ["checked_in", "joined", "pending", "rejected", "cancelled"];
    Object.keys(groups)
      .sort((a, b) => prio.indexOf(a) - prio.indexOf(b))
      .forEach((s) => {
        const t = ["joined", "checked_in"].includes(s)
          ? "success"
          : s === "pending"
            ? "warning"
            : "error";
        logs.push({
          action: `Status: ${capitalize(s)}`,
          timestamp: `${new Set(groups[s].map((p) => p.id)).size}`,
          type: t as any,
          participants: groups[s],
        });
      });
    return logs;
  }

  function filterUsers(users: LogParticipant[] | undefined, q: string) {
    return users
      ? q
        ? users.filter((u) => u.name.toLowerCase().includes(q.toLowerCase()))
        : users
      : [];
  }
  function formatDate(d: string) {
    return d
      ? new Date(d).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
        })
      : "-";
  }
  function capitalize(s: string) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ") : "";
  }

  function toggleExpand(id: number) {
    expandedEventId = expandedEventId === id ? null : id;
    if (expandedEventId) {
      if (viewMode === 'logs') {
        fetchParticipants(id);
      }
      // For history mode, the component will handle its own data fetching
    }
  }

  function handleKeydown(e: KeyboardEvent, id: number) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleExpand(id);
    }
  }
  
  function switchViewMode(mode: 'logs' | 'history') {
    viewMode = mode;
    // Reset expanded state when switching modes
    if (expandedEventId) {
      const id = expandedEventId;
      expandedEventId = null;
      // Re-expand after a tick to trigger proper loading
      setTimeout(() => toggleExpand(id), 10);
    }
  }
</script>

<div class="app-screen">
  <div class="header-container">
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
      <h1 class="page-title">EVENT LOG</h1>
    </div>
  </div>

  <div class="fixed-search-area">
    <div class="content-wrapper">
      <!-- View Mode Tabs -->
      <div class="view-mode-tabs">
        <button 
          class="tab-btn {viewMode === 'logs' ? 'active' : ''}"
          on:click={() => switchViewMode('logs')}
        >
          📊 Current Logs
        </button>
        <button 
          class="tab-btn {viewMode === 'history' ? 'active' : ''}"
          on:click={() => switchViewMode('history')}
        >
          📜 Participant History
        </button>
      </div>
      
      <div class="search-filter-wrapper">
        <div
          class="main-search-input-box {isSearchFocused ||
          showDateFilter ||
          mainSearchQuery
            ? 'active'
            : ''}"
        >
          <div class="search-icon-wrapper">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              ><circle cx="11" cy="11" r="8"></circle><line
                x1="21"
                y1="21"
                x2="16.65"
                y2="16.65"
              ></line></svg
            >
          </div>
          <input
            type="text"
            placeholder="Search events..."
            bind:value={mainSearchQuery}
            on:focus={() => (isSearchFocused = true)}
            on:blur={() => (isSearchFocused = false)}
          />
          <button
            class="calendar-btn {showDateFilter ? 'active' : ''}"
            aria-label="Filter by Date"
            on:click={() => (showDateFilter = !showDateFilter)}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              ><rect x="3" y="4" width="18" height="18" rx="2" ry="2"
              ></rect><line x1="16" y1="2" x2="16" y2="6"></line><line
                x1="8"
                y1="2"
                x2="8"
                y2="6"
              ></line><line x1="3" y1="10" x2="21" y2="10"></line></svg
            >
          </button>
        </div>

        {#if showDateFilter}
          <div class="filter-popover">
            <div class="popover-triangle"></div>
            <div class="popover-content">
              <div class="filter-col year-col">
                <div class="col-sub-header">YEAR</div>
                <button
                  class="filter-btn wide {selectedYear === 'All'
                    ? 'active'
                    : ''}"
                  on:click={() => (selectedYear = "All")}>All</button
                >
                <div class="year-list">
                  {#each availableYears as yr}
                    <button
                      class="filter-text-btn {selectedYear === yr
                        ? 'active-text'
                        : ''}"
                      on:click={() => (selectedYear = yr)}>{yr}</button
                    >
                  {/each}
                </div>
              </div>
              <div class="divider"></div>
              <div class="filter-col month-col">
                <div class="col-sub-header">MONTH</div>
                <button
                  class="filter-btn wide {selectedMonth === 'All'
                    ? 'active'
                    : ''}"
                  on:click={() => (selectedMonth = "All")}>All Months</button
                >
                <div class="month-grid">
                  {#each filterMonths as m, i}
                    <button
                      class="month-btn {selectedMonth === i
                        ? 'active-month'
                        : ''}"
                      on:click={() => (selectedMonth = i)}>{m}</button
                    >
                  {/each}
                </div>
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>

  <div class="scroll-container">
    {#if isLoadingAll}
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Loading events...</p>
      </div>
    {:else}
      <div class="content-wrapper">
        {#each paginatedEvents as event (event.id)}
          <div
            class="log-card {expandedEventId === event.id ? 'expanded' : ''}"
          >
            <div
              class="card-summary"
              role="button"
              tabindex="0"
              on:click={() => toggleExpand(event.id)}
              on:keydown={(e) => handleKeydown(e, event.id)}
            >
              <div class="img-box">
                <img use:lazyLoad={event.image} alt={event.title} />
              </div>
              <div class="info-box">
                <div class="row-top">
                  <h2 class="title">{event.title}</h2>
                  <span class="date">{event.dateDisplay}</span>
                </div>
                <div class="latest-activity-row">
                  <div
                    class="activity-indicator {event.statsLoaded
                      ? 'success'
                      : 'info'}"
                  ></div>
                  <div class="activity-text">
                    {#if event.statsLoaded}
                      View Details
                    {:else}
                      Tap to view details
                    {/if}
                  </div>
                  <div class="expand-arrow">▼</div>
                </div>
              </div>
            </div>

            {#if expandedEventId === event.id}
              <div
                class="timeline-wrapper"
                style="height: {contentHeights[event.id] || 0}px"
              >
                <div
                  class="inner-measurer"
                  bind:clientHeight={contentHeights[event.id]}
                >
                  {#if viewMode === 'history'}
                    <!-- Participant History View -->
                    <div class="history-container">
                      <ParticipantHistoryViewer 
                        eventId={event.id}
                        eventTitle={event.title}
                        {currentLang}
                      />
                    </div>
                  {:else}
                    <!-- Original Logs View -->
                    {#if event.isLoading}
                    <div class="inline-loader">
                      <div class="spinner small"></div>
                      <span>Loading...</span>
                    </div>
                  {:else if !event.statsLoaded}
                    <div class="inline-loader"><span>Retry</span></div>
                  {:else}
                    <div class="search-container internal">
                      <div class="search-icon">🔍</div>
                      <input
                        type="text"
                        placeholder="Filter inside..."
                        bind:value={event.searchQuery}
                        on:click|stopPropagation
                      />
                      {#if event.searchQuery}<button
                          class="clear-btn"
                          aria-label="Clear Search"
                          on:click|stopPropagation={() =>
                            (event.searchQuery = "")}>✕</button
                        >{/if}
                    </div>
                    <div class="timeline-track">
                      {#each event.logs as log, i}
                        {@const fList = filterUsers(
                          log.participants,
                          event.searchQuery
                        )}
                        {#if !log.participants || fList.length > 0 || (!event.searchQuery && log.detail)}
                          <div class="timeline-item">
                            <div class="timeline-line-col">
                              <div class="dot {log.type}"></div>
                              {#if i !== event.logs.length - 1}<div
                                  class="line"
                                ></div>{/if}
                            </div>
                            <div class="timeline-content">
                              <div class="log-header">
                                <span class="log-action">{log.action}</span>
                                <span class="log-time"
                                  >{log.participants
                                    ? event.searchQuery
                                      ? `Found ${new Set(fList.map((u) => u.id)).size}`
                                      : `${log.timestamp} Users`
                                    : log.timestamp}</span
                                >
                              </div>
                              {#if log.detail && !log.participants}<p
                                  class="log-detail-text"
                                >
                                  {log.detail}
                                </p>{/if}
                              {#if log.participants && fList.length > 0}
                                <div class="user-list-container">
                                  {#each fList as p}<div class="user-chip">
                                      <div class="user-avatar">{p.avatar}</div>
                                      <span class="user-name">{p.name}</span>
                                    </div>{/each}
                                </div>
                              {/if}
                            </div>
                          </div>
                        {/if}
                      {/each}
                    </div>
                  {/if}
                  {/if}
                </div>
              </div>
            {/if}
          </div>
        {/each}

        {#if filteredEvents.length === 0}
          <div class="empty-state">No events match.</div>
        {/if}

        {#if totalPages > 1}
          <div class="pagination-controls">
            <button
              class="page-btn nav"
              disabled={currentPage === 1}
              on:click={() => changePage(-1)}
            >
              &lt; Prev
            </button>

            <span class="page-pill">{currentPage} / {totalPages}</span>

            <button
              class="page-btn nav"
              disabled={currentPage === totalPages}
              on:click={() => changePage(1)}
            >
              Next &gt;
            </button>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  @import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap");
  :global(body) {
    margin: 0;
    background-color: #111827;
    color: white;
    font-family: "Inter", sans-serif;
  }

  .app-screen {
    height: 100vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .header-container {
    flex-shrink: 0;
    z-index: 50;
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

  .fixed-search-area {
    flex-shrink: 0;
    z-index: 45;
    padding: 16px 20px 0 20px;
    background: transparent;
    margin-bottom: 30px;
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
    font-size: 28px;
    font-weight: 700;
    letter-spacing: 1px;
    margin: 0;
  }

  .scroll-container {
    flex: 1;
    overflow-y: auto;
    padding: 0 20px 40px 20px;
    scrollbar-width: none;
  }

  .content-wrapper {
    max-width: 500px;
    margin: 0 auto;
    width: 100%;
  }

  .search-filter-wrapper {
    position: relative;
    width: 100%;
  }

  .main-search-input-box {
    display: flex;
    align-items: center;
    background: transparent; 
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 0 12px;
    height: 48px;
    margin-top: 70px;
    transition: all 0.3s ease;
  }
  .main-search-input-box.active {
    border-color: #10b981;
    box-shadow: 0 0 0 1px #10b981;
    background: rgba(16, 185, 129, 0.05); 
  }

  .search-icon-wrapper {
    color: #9ca3af;
    margin-right: 10px;
    display: flex;
  }
  .main-search-input-box input {
    background: transparent;
    border: none;
    outline: none;
    color: white;
    flex: 1;
    font-size: 15px;
  }
  .main-search-input-box input::placeholder {
    color: #9ca3af;
  }

  .calendar-btn {
    background: none;
    border: none;
    color: #6b7280;
    cursor: pointer;
    padding: 6px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }
  .calendar-btn:hover {
    color: #e5e7eb;
    background: rgba(255, 255, 255, 0.05);
  }
  .calendar-btn.active {
    color: #10b981;
  }

  .filter-popover {
    position: absolute;
    top: 56px;
    right: 0;
    width: 320px;
    background: #1e293b;
    border-radius: 16px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.05);
    padding: 20px;
    display: flex;
    flex-direction: column;
    z-index: 100;
  }
  .popover-triangle {
    position: absolute;
    top: -6px;
    right: 18px;
    width: 12px;
    height: 12px;
    background: #1e293b;
    transform: rotate(45deg);
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    border-left: 1px solid rgba(255, 255, 255, 0.05);
  }
  .popover-content {
    display: flex;
    gap: 16px;
  }
  .filter-col {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  .year-col {
    flex: 0.8;
  }
  .month-col {
    flex: 1.2;
  }
  .divider {
    width: 1px;
    background: rgba(255, 255, 255, 0.1);
    margin: 0 4px;
  }
  .col-sub-header {
    font-size: 10px;
    font-weight: 700;
    color: #64748b;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .filter-btn {
    border: none;
    border-radius: 6px;
    padding: 8px 12px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    background: #334155;
    color: #94a3b8;
    transition: all 0.2s;
    margin-bottom: 12px;
  }
  .filter-btn.wide {
    width: 100%;
    text-align: center;
  }
  .filter-btn.active {
    background: #10b981;
    color: white;
  }
  .year-list {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }
  .filter-text-btn {
    background: none;
    border: none;
    color: #94a3b8;
    font-size: 14px;
    cursor: pointer;
    padding: 4px 8px;
  }
  .filter-text-btn:hover {
    color: white;
  }
  .filter-text-btn.active-text {
    color: white;
    font-weight: bold;
  }
  .month-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
  .month-btn {
    background: none;
    border: none;
    color: #94a3b8;
    font-size: 12px;
    padding: 6px 0;
    cursor: pointer;
    border-radius: 4px;
  }
  .month-btn:hover {
    background: rgba(255, 255, 255, 0.05);
    color: white;
  }
  .month-btn.active-month {
    color: #10b981;
    font-weight: 700;
  }

  .log-card {
    background: white;
    border-radius: 12px;
    margin-bottom: 16px;
    overflow: hidden;
    color: #1f2937;
  }
  .card-summary {
    display: flex;
    padding: 12px;
    gap: 12px;
    cursor: pointer;
    outline: none;
  }
  .card-summary:focus-visible {
    background: #f3f4f6;
  }
  .img-box {
    width: 60px;
    height: 60px;
    border-radius: 8px;
    overflow: hidden;
    background: #f3f4f6;
    flex-shrink: 0;
  }
  .img-box img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .info-box {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .row-top {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 6px;
  }
  .title {
    font-size: 14px;
    font-weight: 700;
    margin: 0;
  }
  .date {
    font-size: 11px;
    color: #6b7280;
  }
  .latest-activity-row {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #f9fafb;
    padding: 6px 8px;
    border-radius: 6px;
    border: 1px solid #e5e7eb;
  }
  .activity-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #3b82f6;
    flex-shrink: 0;
  }
  .activity-indicator.success {
    background: #10b981;
  }
  .activity-text {
    flex: 1;
    font-size: 12px;
    font-weight: 500;
    color: #374151;
  }
  .expand-arrow {
    color: #9ca3af;
    font-size: 10px;
    transition: transform 0.3s;
  }
  .log-card.expanded .expand-arrow {
    transform: rotate(180deg);
  }

  .timeline-wrapper {
    background: #f8fafc;
    overflow: hidden;
    transition: height 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  }
  .inner-measurer {
    padding: 16px 20px;
    box-sizing: border-box;
  }
  .search-container.internal {
    display: flex;
    align-items: center;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 0 12px;
    height: 40px;
    margin-bottom: 20px;
  }
  .search-container.internal input {
    border: none;
    outline: none;
    flex: 1;
    font-size: 14px;
    color: #1f2937;
    background: transparent;
  }
  .timeline-track {
    position: relative;
  }
  .timeline-item {
    display: flex;
    gap: 12px;
    padding-bottom: 24px;
  }
  .timeline-item:last-child {
    padding-bottom: 0;
  }
  .timeline-line-col {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 16px;
    flex-shrink: 0;
  }
  .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: 2px solid white;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    z-index: 2;
  }
  .dot.success {
    background: #10b981;
  }
  .dot.info {
    background: #3b82f6;
  }
  .dot.warning {
    background: #f59e0b;
  }
  .dot.error {
    background: #ef4444;
  }
  .line {
    width: 2px;
    background: #e2e8f0;
    flex: 1;
    margin-top: -2px;
    margin-bottom: -14px;
  }
  .timeline-content {
    flex: 1;
    padding-top: -2px;
    width: 0;
  }
  .log-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }
  .log-action {
    font-size: 13px;
    font-weight: 600;
    color: #1e293b;
  }
  .log-time {
    font-size: 10px;
    font-weight: 600;
    color: #64748b;
    background: #e2e8f0;
    padding: 2px 6px;
    border-radius: 4px;
  }
  .log-detail-text {
    font-size: 12px;
    color: #64748b;
    margin: 0;
  }
  .user-list-container {
    display: flex;
    flex-direction: column;
    gap: 6px;
    background: white;
    padding: 8px;
    border-radius: 8px;
    border: 1px solid #f1f5f9;
    max-height: 160px;
    overflow-y: auto;
    scrollbar-width: none;
  }
  .user-list-container::-webkit-scrollbar {
    display: none;
  }
  .user-chip {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px;
    border-radius: 4px;
    transition: background 0.2s;
  }
  .user-chip:hover {
    background: #f8fafc;
  }
  .user-avatar {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #e2e8f0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: bold;
    color: #64748b;
    overflow: hidden;
    flex-shrink: 0;
  }
  .user-name {
    font-size: 12px;
    color: #334155;
    font-weight: 500;
  }
  .loading-state,
  .inline-loader {
    text-align: center;
    color: #6b7280;
    padding: 10px;
    font-size: 13px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }
  .spinner {
    width: 24px;
    height: 24px;
    border: 2px solid rgba(255, 255, 255, 0.1);
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: spin 1s infinite;
  }
  .spinner.small {
    width: 20px;
    height: 20px;
    border-color: #cbd5e1;
    border-top-color: #3b82f6;
  }
  .empty-state {
    text-align: center;
    color: #9ca3af;
    padding-top: 20px;
    font-size: 14px;
  }
  .clear-btn {
    background: none;
    border: none;
    font-size: 14px;
    color: #9ca3af;
    cursor: pointer;
    padding: 0;
  }

  .pagination-controls {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-top: 24px;
    padding-bottom: 20px;
  }
  .page-btn {
    background: #1f2937;
    color: #e5e7eb;
    border: 1px solid #374151;
    padding: 8px 16px;
    border-radius: 20px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .page-btn:hover:not(:disabled) {
    background: #374151;
    color: white;
    border-color: #4b5563;
  }
  .page-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .page-pill {
    background: #111827;
    color: white;
    padding: 6px 16px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 700;
    border: 1px solid #1f2937;
  }

  /* View Mode Tabs */
  .view-mode-tabs {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 1.25rem;
    padding: 0.5rem;
    background: rgba(15, 23, 42, 0.6);
    border-radius: 16px;
    border: 1px solid rgba(100, 116, 139, 0.3);
  }

  .tab-btn {
    flex: 1;
    padding: 0.75rem 1.5rem;
    background: transparent;
    border: none;
    border-radius: 12px;
    color: #94a3b8;
    font-size: 0.938rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .tab-btn:hover {
    background: rgba(16, 185, 129, 0.1);
    color: #10b981;
  }

  .tab-btn.active {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
  }

  .history-container {
    padding: 1rem 0;
    min-height: 400px;
  }

  @media (max-width: 768px) {
    .view-mode-tabs {
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .tab-btn {
      font-size: 0.875rem;
      padding: 0.625rem 1rem;
    }
  }
</style>
