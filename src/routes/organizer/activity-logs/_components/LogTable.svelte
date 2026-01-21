<script lang="ts">
  import { appState } from '../../_lib/stores/appState';
  import { formatDate } from '../../_lib/utils/dateTime';
  
  export let logs: any[];
  export let onViewTimeline: (log: any) => void;
  
  $: lang = $appState.currentLang;
  
  function getActionColor(action: string) {
    const colors: Record<string, string> = {
      check_in: '#10b981',
      check_out: '#f59e0b',
      register: '#3b82f6',
      approve: '#10b981',
      reject: '#ef4444',
      create: '#8b5cf6',
      update: '#f59e0b',
      delete: '#ef4444'
    };
    return colors[action] || '#64748b';
  }
  
  function getActionLabel(action: string) {
    const labels: Record<string, { th: string; en: string }> = {
      check_in: { th: 'เช็คอิน', en: 'Check-in' },
      check_out: { th: 'เช็คเอาท์', en: 'Check-out' },
      register: { th: 'ลงทะเบียน', en: 'Register' },
      approve: { th: 'อนุมัติ', en: 'Approve' },
      reject: { th: 'ปฏิเสธ', en: 'Reject' },
      create: { th: 'สร้าง', en: 'Create' },
      update: { th: 'แก้ไข', en: 'Update' },
      delete: { th: 'ลบ', en: 'Delete' }
    };
    return labels[action]?.[lang] || action;
  }
</script>

<div class="log-table-wrapper">
  <table class="log-table">
    <thead>
      <tr>
        <th>{lang === 'th' ? 'เวลา' : 'Time'}</th>
        <th>{lang === 'th' ? 'การกระทำ' : 'Action'}</th>
        <th>{lang === 'th' ? 'ผู้ใช้' : 'User'}</th>
        <th>{lang === 'th' ? 'กิจกรรม' : 'Event'}</th>
        <th>{lang === 'th' ? 'รายละเอียด' : 'Details'}</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      {#each logs as log}
        <tr class="log-row">
          <td class="timestamp">{formatDate(log.timestamp, 'long')}</td>
          <td>
            <span class="action-badge" style="background: {getActionColor(log.action)}">
              {getActionLabel(log.action)}
            </span>
          </td>
          <td class="user-cell">
            <div class="user-info">
              <div class="user-avatar">{log.userName?.[0] || 'U'}</div>
              <span>{log.userName || log.userId}</span>
            </div>
          </td>
          <td>{log.eventName || log.eventId || '-'}</td>
          <td class="details">{log.details || '-'}</td>
          <td>
            <button class="btn-timeline" aria-label={lang === 'th' ? 'แสดงไทม์ไลน์' : 'View timeline'} on:click={() => onViewTimeline(log)}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  .log-table-wrapper { overflow-x: auto; background: white; border: 1px solid var(--border); border-radius: 12px; }
  .log-table { width: 100%; border-collapse: collapse; }
  .log-table thead th { padding: 1rem; text-align: left; font-size: 0.875rem; font-weight: 600; color: var(--text-muted); background: var(--bg-alt); border-bottom: 1px solid var(--border); }
  .log-row { transition: background 0.2s; }
  .log-row:hover { background: var(--bg-alt); }
  .log-row td { padding: 1rem; font-size: 0.875rem; border-bottom: 1px solid var(--border); }
  .log-row:last-child td { border-bottom: none; }
  .timestamp { color: var(--text-muted); white-space: nowrap; }
  .action-badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600; color: white; }
  .user-info { display: flex; align-items: center; gap: 0.75rem; }
  .user-avatar { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: var(--primary); color: white; border-radius: 50%; font-size: 0.875rem; font-weight: 600; }
  .details { max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .btn-timeline { width: 32px; height: 32px; padding: 0; background: var(--bg-alt); border: 1px solid var(--border); border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
  .btn-timeline:hover { background: var(--primary); border-color: var(--primary); color: white; }
  .btn-timeline svg { width: 16px; height: 16px; }
  @media (max-width: 768px) { .log-table thead th, .log-row td { padding: 0.75rem 0.5rem; font-size: 0.75rem; } }
</style>
