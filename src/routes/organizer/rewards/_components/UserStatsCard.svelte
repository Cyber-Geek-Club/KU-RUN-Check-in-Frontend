=== rewards/./_components/UserStatsCard.svelte ===
<script lang="ts">
  import { appState } from '../../_lib/stores/appState';
  
  export let totalParticipants: number;
  export let qualifiedUsers: number;
  export let isFinalized: boolean;
  
  $: lang = $appState.currentLang;
  $: qualificationRate = totalParticipants > 0 ? ((qualifiedUsers / totalParticipants) * 100).toFixed(1) : '0';
</script>

<div class="stats-card">
  <div class="stat-item">
    <div class="stat-icon" style="background: #dbeafe;">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: #3b82f6;">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    </div>
    <div class="stat-content">
      <div class="stat-label">{lang === 'th' ? 'ผู้เข้าร่วมทั้งหมด' : 'Total Participants'}</div>
      <div class="stat-value">{totalParticipants}</div>
    </div>
  </div>
  
  <div class="stat-item">
    <div class="stat-icon" style="background: #d1fae5;">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: #10b981;">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    </div>
    <div class="stat-content">
      <div class="stat-label">{lang === 'th' ? 'มีสิทธิ์รับรางวัล' : 'Qualified Users'}</div>
      <div class="stat-value">{qualifiedUsers}</div>
    </div>
  </div>
  
  <div class="stat-item">
    <div class="stat-icon" style="background: #fef3c7;">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: #f59e0b;">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    </div>
    <div class="stat-content">
      <div class="stat-label">{lang === 'th' ? 'อัตราผ่านเกณฑ์' : 'Qualification Rate'}</div>
      <div class="stat-value">{qualificationRate}%</div>
    </div>
  </div>
  
  <div class="stat-item">
    <div class="stat-icon" style="background: {isFinalized ? '#d1fae5' : '#fee2e2'};">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: {isFinalized ? '#10b981' : '#ef4444'};">
        {#if isFinalized}
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        {:else}
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        {/if}
      </svg>
    </div>
    <div class="stat-content">
      <div class="stat-label">{lang === 'th' ? 'สถานะ' : 'Status'}</div>
      <div class="stat-value stat-status" class:finalized={isFinalized}>
        {isFinalized ? (lang === 'th' ? 'ยืนยันแล้ว' : 'Finalized') : (lang === 'th' ? 'รอยืนยัน' : 'Pending')}
      </div>
    </div>
  </div>
</div>

<style>
  .stats-card { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; }
  .stat-item { display: flex; align-items: center; gap: 1rem; padding: 1.25rem; background: white; border: 1px solid var(--border); border-radius: 12px; }
  .stat-icon { width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; border-radius: 12px; flex-shrink: 0; }
  .stat-icon svg { width: 24px; height: 24px; }
  .stat-content { flex: 1; min-width: 0; }
  .stat-label { font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.25rem; }
  .stat-value { font-size: 1.5rem; font-weight: 700; color: var(--text); }
  .stat-status { font-size: 1rem; font-weight: 600; }
  .stat-status.finalized { color: var(--success); }
  @media (max-width: 768px) { .stats-card { grid-template-columns: 1fr; } }
</style>