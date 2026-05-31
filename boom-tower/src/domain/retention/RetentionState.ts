export interface RetentionState {
  lastLoginDate: string | null;
  loginStreak: number;
  maxLoginStreak: number;
  totalLogins: number;
  dailyRewardDay: number;
  lastRewardClaimed: string | null;
  hasClaimedToday: boolean;
}

export function createInitialRetentionState(): RetentionState {
  return {
    lastLoginDate: null,
    loginStreak: 0,
    maxLoginStreak: 0,
    totalLogins: 0,
    dailyRewardDay: 1,
    lastRewardClaimed: null,
    hasClaimedToday: false,
  };
}

export function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

export function isNewDay(lastDate: string | null): boolean {
  if (!lastDate) return true;
  return lastDate !== getTodayString();
}
