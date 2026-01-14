<script lang="ts">
  import { onMount } from 'svelte';
  import type { 
    Snapshot, 
    SnapshotEntry, 
    SnapshotsResponse,
    SnapshotEntriesResponse 
  } from '$lib/utils/apiClient';
  import { 
    getParticipantSnapshots, 
    getSnapshotEntries,
    createParticipantSnapshot 
  } from '$lib/utils/apiClient';

  export let eventId: number;
  export let eventTitle: string = '';
  export let currentLang: 'th' | 'en' = 'th';

  // State
  let snapshots: Snapshot[] = [];
  let selectedSnapshot: Snapshot | null = null;
  let entries: SnapshotEntry[] = [];
  
  let isLoadingSnapshots = false;
  let isLoadingEntries = false;
  let isCreatingSnapshot = false;
  
  let snapshotsPage = 1;
  let entriesPage = 1;
  let snapshotsTotal = 0;
  let entriesTotal = 0;
  let perPage = 10;
  let entriesPerPage = 50;
  
  let errorMessage = '';
  let searchQuery = '';

  // Translations
  const t = {
    th: {
      title: 'ประวัติผู้เข้าร่วม',
      snapshots: 'ประวัติการบันทึก (Snapshots)',
      noSnapshots: 'ยังไม่มีประวัติการบันทึก',
      createSnapshot: 'สร้าง Snapshot ใหม่',
      creatingSnapshot: 'กำลังสร้าง...',
      selectSnapshot: 'เลือก snapshot เพื่อดูรายละเอียด',
      participants: 'ผู้เข้าร่วม',
      action: 'สถานะ',
      time: 'เวลา',
      entries: 'รายการ',
      search: 'ค้นหาชื่อหรืออีเมล...',
      previous: 'ก่อนหน้า',
      next: 'ถัดไป',
      page: 'หน้า',
      of: 'จาก',
      exportCSV: 'ส่งออก CSV',
      snapshotTime: 'เวลาบันทึก',
      totalEntries: 'จำนวนรายการ',
      userId: 'User ID',
      name: 'ชื่อ',
      email: 'อีเมล',
      createdAt: 'สร้างเมื่อ',
      joined: 'เข้าร่วม',
      checked_in: 'เช็คอินแล้ว',
      cancelled: 'ยกเลิก',
      rejected: 'ปฏิเสธ',
      pending: 'รอดำเนินการ',
      errorLoading: 'เกิดข้อผิดพลาดในการโหลดข้อมูล',
      refresh: 'รีเฟรช',
    },
    en: {
      title: 'Participant History',
      snapshots: 'Snapshot History',
      noSnapshots: 'No snapshots yet',
      createSnapshot: 'Create New Snapshot',
      creatingSnapshot: 'Creating...',
      selectSnapshot: 'Select a snapshot to view details',
      participants: 'Participants',
      action: 'Status',
      time: 'Time',
      entries: 'Entries',
      search: 'Search name or email...',
      previous: 'Previous',
      next: 'Next',
      page: 'Page',
      of: 'of',
      exportCSV: 'Export CSV',
      snapshotTime: 'Snapshot Time',
      totalEntries: 'Total Entries',
      userId: 'User ID',
      name: 'Name',
      email: 'Email',
      createdAt: 'Created At',
      joined: 'Joined',
      checked_in: 'Checked In',
      cancelled: 'Cancelled',
      rejected: 'Rejected',
      pending: 'Pending',
      errorLoading: 'Error loading data',
      refresh: 'Refresh',
    }
  };

  $: lang = t[currentLang];
  $: filteredEntries = entries.filter(entry => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return entry.user_name.toLowerCase().includes(query) ||
           entry.user_email.toLowerCase().includes(query);
  });

  onMount(() => {
    loadSnapshots();
  });

  async function loadSnapshots() {
    isLoadingSnapshots = true;
    errorMessage = '';
    
    try {
      const response: SnapshotsResponse = await getParticipantSnapshots(
        eventId,
        snapshotsPage,
        perPage
      );
      
      snapshots = response.snapshots;
      snapshotsTotal = response.total;
      
      // Auto-select first snapshot if available
      if (snapshots.length > 0 && !selectedSnapshot) {
        selectSnapshot(snapshots[0]);
      }
    } catch (error) {
      console.error('Failed to load snapshots:', error);
      errorMessage = lang.errorLoading;
    } finally {
      isLoadingSnapshots = false;
    }
  }

  async function selectSnapshot(snapshot: Snapshot) {
    selectedSnapshot = snapshot;
    entriesPage = 1;
    await loadEntries();
  }

  async function loadEntries() {
    if (!selectedSnapshot) return;
    
    isLoadingEntries = true;
    errorMessage = '';
    
    try {
      const response: SnapshotEntriesResponse = await getSnapshotEntries(
        eventId,
        selectedSnapshot.snapshot_id,
        entriesPage,
        entriesPerPage
      );
      
      entries = response.entries;
      entriesTotal = response.total;
    } catch (error) {
      console.error('Failed to load entries:', error);
      errorMessage = lang.errorLoading;
    } finally {
      isLoadingEntries = false;
    }
  }

  async function handleCreateSnapshot() {
    isCreatingSnapshot = true;
    errorMessage = '';
    
    try {
      const result = await createParticipantSnapshot(eventId);
      
      // Reload snapshots list
      snapshotsPage = 1;
      await loadSnapshots();
      
      // Show success message (you can use SweetAlert2 here if needed)
      console.log('Snapshot created:', result);
    } catch (error) {
      console.error('Failed to create snapshot:', error);
      errorMessage = 'Failed to create snapshot';
    } finally {
      isCreatingSnapshot = false;
    }
  }

  function changeSnapshotsPage(delta: number) {
    const newPage = snapshotsPage + delta;
    const maxPage = Math.ceil(snapshotsTotal / perPage);
    
    if (newPage >= 1 && newPage <= maxPage) {
      snapshotsPage = newPage;
      loadSnapshots();
    }
  }

  function changeEntriesPage(delta: number) {
    const newPage = entriesPage + delta;
    const maxPage = Math.ceil(entriesTotal / entriesPerPage);
    
    if (newPage >= 1 && newPage <= maxPage) {
      entriesPage = newPage;
      loadEntries();
    }
  }

  function formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString(currentLang === 'th' ? 'th-TH' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getActionColor(action: string): string {
    switch (action) {
      case 'joined': return '#10b981';
      case 'checked_in': return '#3b82f6';
      case 'cancelled': return '#ef4444';
      case 'rejected': return '#f59e0b';
      case 'pending': return '#94a3b8';
      default: return '#64748b';
    }
  }

  function exportToCSV() {
    if (!selectedSnapshot || entries.length === 0) return;
    
    // Create CSV headers
    const headers = [
      lang.userId,
      lang.name,
      lang.email,
      lang.action,
      lang.createdAt
    ];
    
    // Create CSV rows
    const rows = entries.map(entry => [
      entry.user_id,
      entry.user_name,
      entry.user_email,
      lang[entry.action as keyof typeof lang] || entry.action,
      formatDateTime(entry.created_at)
    ]);
    
    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `participants_${eventId}_${selectedSnapshot.snapshot_id}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
</script>

<div class="history-viewer">
  <div class="header">
    <h2>{lang.title}</h2>
    {#if eventTitle}
      <p class="event-title">{eventTitle}</p>
    {/if}
  </div>

  {#if errorMessage}
    <div class="error-banner">
      <span>⚠️ {errorMessage}</span>
      <button on:click={loadSnapshots}>{lang.refresh}</button>
    </div>
  {/if}

  <div class="content-grid">
    <!-- Left Panel: Snapshots List -->
    <div class="snapshots-panel">
      <div class="panel-header">
        <h3>{lang.snapshots}</h3>
        <button 
          class="create-btn"
          on:click={handleCreateSnapshot}
          disabled={isCreatingSnapshot}
        >
          {isCreatingSnapshot ? lang.creatingSnapshot : lang.createSnapshot}
        </button>
      </div>

      {#if isLoadingSnapshots}
        <div class="loading">
          <div class="spinner"></div>
          <p>Loading snapshots...</p>
        </div>
      {:else if snapshots.length === 0}
        <div class="empty-state">
          <p>{lang.noSnapshots}</p>
        </div>
      {:else}
        <div class="snapshots-list">
          {#each snapshots as snapshot}
            <button
              class="snapshot-card"
              class:active={selectedSnapshot?.snapshot_id === snapshot.snapshot_id}
              on:click={() => selectSnapshot(snapshot)}
            >
              <div class="snapshot-info">
                <div class="snapshot-time">
                  {formatDateTime(snapshot.snapshot_time)}
                </div>
                <div class="snapshot-count">
                  {snapshot.entry_count} {lang.entries}
                </div>
              </div>
              <div class="snapshot-icon">→</div>
            </button>
          {/each}
        </div>

        <!-- Snapshots Pagination -->
        {#if snapshotsTotal > perPage}
          <div class="pagination">
            <button 
              on:click={() => changeSnapshotsPage(-1)}
              disabled={snapshotsPage === 1}
            >
              {lang.previous}
            </button>
            <span>
              {lang.page} {snapshotsPage} {lang.of} {Math.ceil(snapshotsTotal / perPage)}
            </span>
            <button 
              on:click={() => changeSnapshotsPage(1)}
              disabled={snapshotsPage >= Math.ceil(snapshotsTotal / perPage)}
            >
              {lang.next}
            </button>
          </div>
        {/if}
      {/if}
    </div>

    <!-- Right Panel: Entries Details -->
    <div class="entries-panel">
      {#if !selectedSnapshot}
        <div class="empty-state">
          <p>{lang.selectSnapshot}</p>
        </div>
      {:else}
        <div class="panel-header">
          <div>
            <h3>{lang.participants}</h3>
            <p class="subtitle">
              {lang.snapshotTime}: {formatDateTime(selectedSnapshot.snapshot_time)}
            </p>
          </div>
          <button class="export-btn" on:click={exportToCSV}>
            📥 {lang.exportCSV}
          </button>
        </div>

        <div class="search-box">
          <input
            type="text"
            bind:value={searchQuery}
            placeholder={lang.search}
          />
        </div>

        {#if isLoadingEntries}
          <div class="loading">
            <div class="spinner"></div>
            <p>Loading entries...</p>
          </div>
        {:else if filteredEntries.length === 0}
          <div class="empty-state">
            <p>No entries found</p>
          </div>
        {:else}
          <div class="entries-table-wrapper">
            <table class="entries-table">
              <thead>
                <tr>
                  <th>{lang.userId}</th>
                  <th>{lang.name}</th>
                  <th>{lang.email}</th>
                  <th>{lang.action}</th>
                  <th>{lang.createdAt}</th>
                </tr>
              </thead>
              <tbody>
                {#each filteredEntries as entry (entry.entry_id)}
                  <tr>
                    <td>{entry.user_id}</td>
                    <td>{entry.user_name}</td>
                    <td class="email">{entry.user_email}</td>
                    <td>
                      <span 
                        class="status-badge"
                        style="background-color: {getActionColor(entry.action)}20; color: {getActionColor(entry.action)}; border: 1px solid {getActionColor(entry.action)}40;"
                      >
                        {lang[entry.action as keyof typeof lang] || entry.action}
                      </span>
                    </td>
                    <td>{formatDateTime(entry.created_at)}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>

          <!-- Entries Pagination -->
          {#if entriesTotal > entriesPerPage}
            <div class="pagination">
              <button 
                on:click={() => changeEntriesPage(-1)}
                disabled={entriesPage === 1}
              >
                {lang.previous}
              </button>
              <span>
                {lang.page} {entriesPage} {lang.of} {Math.ceil(entriesTotal / entriesPerPage)}
              </span>
              <button 
                on:click={() => changeEntriesPage(1)}
                disabled={entriesPage >= Math.ceil(entriesTotal / entriesPerPage)}
              >
                {lang.next}
              </button>
            </div>
          {/if}
        {/if}
      {/if}
    </div>
  </div>
</div>

<style>
  .history-viewer {
    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
    border-radius: 20px;
    padding: 2rem;
    color: #f8fafc;
    min-height: 600px;
  }

  .header {
    margin-bottom: 2rem;
    border-bottom: 1px solid rgba(100, 116, 139, 0.3);
    padding-bottom: 1rem;
  }

  .header h2 {
    margin: 0 0 0.5rem;
    color: #10b981;
    font-size: 1.75rem;
  }

  .event-title {
    margin: 0;
    color: #cbd5e1;
    font-size: 1rem;
  }

  .error-banner {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 12px;
    padding: 1rem;
    margin-bottom: 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: #fca5a5;
  }

  .error-banner button {
    background: rgba(239, 68, 68, 0.2);
    border: 1px solid #ef4444;
    color: #fca5a5;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .error-banner button:hover {
    background: rgba(239, 68, 68, 0.3);
  }

  .content-grid {
    display: grid;
    grid-template-columns: 350px 1fr;
    gap: 2rem;
    min-height: 500px;
  }

  @media (max-width: 1024px) {
    .content-grid {
      grid-template-columns: 1fr;
    }
  }

  .snapshots-panel,
  .entries-panel {
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(100, 116, 139, 0.3);
    border-radius: 16px;
    padding: 1.5rem;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.5rem;
    gap: 1rem;
  }

  .panel-header h3 {
    margin: 0;
    color: #f8fafc;
    font-size: 1.25rem;
  }

  .subtitle {
    margin: 0.5rem 0 0;
    color: #94a3b8;
    font-size: 0.875rem;
  }

  .create-btn,
  .export-btn {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    border: none;
    border-radius: 10px;
    color: white;
    padding: 0.625rem 1.25rem;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
    white-space: nowrap;
  }

  .create-btn:hover:not(:disabled),
  .export-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3);
  }

  .create-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem;
    color: #94a3b8;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(16, 185, 129, 0.1);
    border-top-color: #10b981;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 3rem;
    color: #64748b;
    text-align: center;
  }

  .snapshots-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
    overflow-y: auto;
    flex: 1;
  }

  .snapshot-card {
    background: rgba(30, 41, 59, 0.6);
    border: 1px solid rgba(100, 116, 139, 0.3);
    border-radius: 12px;
    padding: 1rem;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    justify-content: space-between;
    align-items: center;
    text-align: left;
    color: #cbd5e1;
    width: 100%;
  }

  .snapshot-card:hover {
    background: rgba(30, 41, 59, 0.8);
    border-color: #10b981;
    transform: translateX(4px);
  }

  .snapshot-card.active {
    background: rgba(16, 185, 129, 0.1);
    border-color: #10b981;
    color: #10b981;
  }

  .snapshot-time {
    font-weight: 600;
    margin-bottom: 0.25rem;
  }

  .snapshot-count {
    font-size: 0.875rem;
    color: #94a3b8;
  }

  .snapshot-icon {
    font-size: 1.5rem;
    opacity: 0.5;
    transition: opacity 0.2s;
  }

  .snapshot-card:hover .snapshot-icon,
  .snapshot-card.active .snapshot-icon {
    opacity: 1;
  }

  .search-box {
    margin-bottom: 1.5rem;
  }

  .search-box input {
    width: 100%;
    padding: 0.75rem 1rem;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(100, 116, 139, 0.3);
    border-radius: 12px;
    color: #f8fafc;
    font-size: 0.875rem;
    transition: all 0.2s;
  }

  .search-box input:focus {
    outline: none;
    border-color: #10b981;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
  }

  .search-box input::placeholder {
    color: #64748b;
  }

  .entries-table-wrapper {
    overflow-x: auto;
    flex: 1;
    margin-bottom: 1.5rem;
  }

  .entries-table {
    width: 100%;
    border-collapse: collapse;
  }

  .entries-table th,
  .entries-table td {
    padding: 0.875rem 1rem;
    text-align: left;
    border-bottom: 1px solid rgba(100, 116, 139, 0.2);
  }

  .entries-table th {
    background: rgba(15, 23, 42, 0.8);
    color: #10b981;
    font-weight: 600;
    font-size: 0.875rem;
    text-transform: uppercase;
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .entries-table tbody tr {
    transition: background 0.2s;
  }

  .entries-table tbody tr:hover {
    background: rgba(16, 185, 129, 0.05);
  }

  .entries-table td {
    color: #cbd5e1;
    font-size: 0.875rem;
  }

  .entries-table td.email {
    color: #94a3b8;
    font-size: 0.813rem;
  }

  .status-badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(100, 116, 139, 0.2);
  }

  .pagination button {
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.3);
    border-radius: 8px;
    color: #10b981;
    padding: 0.5rem 1rem;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 0.875rem;
  }

  .pagination button:hover:not(:disabled) {
    background: rgba(16, 185, 129, 0.2);
    border-color: #10b981;
  }

  .pagination button:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .pagination span {
    color: #94a3b8;
    font-size: 0.875rem;
  }
</style>
