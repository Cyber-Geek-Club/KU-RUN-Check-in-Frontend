=== rewards/./_components/LeaderboardTable.svelte ===
<script lang="ts">
  import { appState } from '../../_lib/stores/appState';
  
  export let leaderboard: any[];
  export let selectedUsers: Set<number>;
  export let onToggleUser: (userId: number) => void;
  
  $: lang = $appState.currentLang;
  
  function getTierColor(tier: string) {
    const colors: Record<string, string> = {
      gold: '#fbbf24',
      silver: '#d1d5db',
      bronze: '#cd7f32',
      platinum: '#e5e7eb'
    };
    return colors[tier?.toLowerCase?.()] || '#64748b';
  }
  
  function getTierIcon(tier: string) {
    return tier.toLowerCase() === 'gold' ? '🥇' : tier.toLowerCase() === 'silver' ? '🥈' : tier.toLowerCase() === 'bronze' ? '🥉' : '🏆';
  }
</script>

<div class="leaderboard-wrapper">
  <table class="leaderboard-table">
    <thead>
      <tr>
        <th class="col-checkbox">
          <input type="checkbox" on:change={(e: Event) => {
            const target = e.currentTarget as HTMLInputElement;
            if (target && target.checked) {
              leaderboard.forEach(entry => selectedUsers.add(entry.userId));
            } else {
              selectedUsers.clear();
            }
            // reassign to trigger Svelte reactivity for Set
            selectedUsers = new Set(selectedUsers);
          }} />
        </th>
        <th class="col-rank">{lang === 'th' ? 'อันดับ' : 'Rank'}</th>
        <th>{lang === 'th' ? 'ผู้เข้าร่วม' : 'Participant'}</th>
        <th class="col-center">{lang === 'th' ? 'รอบ' : 'Rounds'}</th>
        <th class="col-center">{lang === 'th' ? 'คะแนน' : 'Points'}</th>
        <th class="col-tier">{lang === 'th' ? 'ระดับ' : 'Tier'}</th>
      </tr>
    </thead>
    <tbody>
      {#each leaderboard as entry, i}
        <tr class="table-row" class:selected={selectedUsers.has(entry.userId)}>
          <td class="col-checkbox">
            <input 
              type="checkbox" 
              checked={selectedUsers.has(entry.userId)}
              on:change={() => onToggleUser(entry.userId)}
            />
          </td>
          <td class="col-rank">
            <div class="rank-badge" class:top-three={i < 3}>
              {i < 3 ? (i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉') : `#${i + 1}`}
            </div>
          </td>
          <td>
            <div class="user-info">
              <div class="user-avatar">{entry.userName?.[0] || 'U'}</div>
              <div class="user-details">
                <div class="user-name">{entry.userName}</div>
                <div class="user-email">{entry.userEmail}</div>
              </div>
            </div>
          </td>
          <td class="col-center"><strong>{entry.completedRounds}</strong></td>
          <td class="col-center"><strong>{entry.points}</strong></td>
          <td class="col-tier">
            <div class="tier-badge" style="background: {getTierColor(entry.tier)}">
              {getTierIcon(entry.tier)} {entry.tier}
            </div>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  .leaderboard-wrapper { overflow-x: auto; background: white; border: 1px solid var(--border); border-radius: 12px; }
  .leaderboard-table { width: 100%; border-collapse: collapse; }
  .leaderboard-table thead th { padding: 1rem; text-align: left; font-size: 0.875rem; font-weight: 600; color: var(--text-muted); background: var(--bg-alt); border-bottom: 1px solid var(--border); }
  .col-checkbox { width: 50px; text-align: center; }
  .col-rank { width: 80px; }
  .col-center { text-align: center; width: 100px; }
  .col-tier { width: 150px; }
  .table-row { transition: background 0.2s; }
  .table-row:hover { background: var(--bg-alt); }
  .table-row.selected { background: #f0fdfa; }
  .table-row td { padding: 1rem; font-size: 0.875rem; border-bottom: 1px solid var(--border); }
  .table-row:last-child td { border-bottom: none; }
  .rank-badge { display: inline-flex; align-items: center; justify-content: center; min-width: 40px; padding: 0.25rem 0.5rem; background: var(--bg-alt); border-radius: 6px; font-weight: 600; font-size: 0.875rem; }
  .rank-badge.top-three { background: transparent; font-size: 1.5rem; }
  .user-info { display: flex; align-items: center; gap: 0.75rem; }
  .user-avatar { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background: var(--primary); color: white; border-radius: 50%; font-size: 1rem; font-weight: 600; }
  .user-details { display: flex; flex-direction: column; gap: 0.25rem; }
  .user-name { font-weight: 600; color: var(--text); }
  .user-email { font-size: 0.75rem; color: var(--text-muted); }
  .tier-badge { display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.375rem 0.75rem; border-radius: 6px; font-size: 0.875rem; font-weight: 600; color: white; }
</style>