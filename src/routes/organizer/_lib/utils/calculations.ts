export interface RewardTier {
  name: string;
  quota: number | null;
  requirement: number | null;
}

export function calculateTotalQuota(tiers: RewardTier[]): number {
  return tiers.reduce((sum, tier) => sum + (tier.quota || 0), 0);
}

export function calculateRemainingQuota(totalSlots: number, allocatedQuota: number): number {
  return Math.max(0, totalSlots - allocatedQuota);
}

export function validateQuotaAllocation(
  tiers: RewardTier[],
  totalSlots: number
): { valid: boolean; exceeded: number } {
  const allocated = calculateTotalQuota(tiers);
  const exceeded = Math.max(0, allocated - totalSlots);
  
  return {
    valid: allocated <= totalSlots,
    exceeded
  };
}

export function calculateTierProgress(
  currentCompletions: number,
  requirement: number
): number {
  if (requirement === 0) return 100;
  return Math.min(100, (currentCompletions / requirement) * 100);
}

export function calculateRankRange(
  tierIndex: number,
  tiers: RewardTier[]
): { start: number; end: number } {
  let start = 1;
  
  for (let i = 0; i < tierIndex; i++) {
    start += tiers[i].quota || 0;
  }
  
  const end = start + (tiers[tierIndex].quota || 0) - 1;
  
  return { start, end };
}

export function getNextTierRequirement(
  currentTier: number,
  tiers: RewardTier[]
): number | null {
  if (currentTier >= tiers.length - 1) return null;
  return tiers[currentTier + 1].requirement || null;
}

export function calculateCompletionRate(completed: number, total: number): number {
  if (total === 0) return 0;
  return (completed / total) * 100;
}

export function distributeRewards(
  participants: Array<{ id: number; completions: number }>,
  tiers: RewardTier[]
): Map<number, { tier: number; tierName: string; rank: number }> {
  const distribution = new Map();
  
  // Sort by completions (descending)
  const sorted = [...participants].sort((a, b) => b.completions - a.completions);
  
  let currentRank = 1;
  let tierIndex = 0;
  let tierQuotaUsed = 0;
  
  for (const participant of sorted) {
    // Check if meets requirement
    const tier = tiers[tierIndex];
    if (!tier || participant.completions < (tier.requirement || 0)) {
      continue;
    }
    
    // Assign to current tier
    distribution.set(participant.id, {
      tier: tierIndex + 1,
      tierName: tier.name,
      rank: currentRank
    });
    
    currentRank++;
    tierQuotaUsed++;
    
    // Move to next tier if quota filled
    if (tierQuotaUsed >= (tier.quota || 0)) {
      tierIndex++;
      tierQuotaUsed = 0;
    }
    
    // No more tiers
    if (tierIndex >= tiers.length) {
      break;
    }
  }
  
  return distribution;
}