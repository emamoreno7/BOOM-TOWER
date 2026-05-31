import { RetentionState, getTodayString, isNewDay } from './RetentionState';
import { Logger } from '../../core/Logger';

export interface StreakResult {
  isNewDay: boolean;
  streakContinued: boolean;
  streakBroken: boolean;
  currentStreak: number;
}

export class LoginStreakSystem {

  checkLogin(state: RetentionState): { updated: RetentionState; result: StreakResult } {
    const today = getTodayString();
    const newDay = isNewDay(state.lastLoginDate);

    if (!newDay) {
      return {
        updated: state,
        result: {
          isNewDay: false,
          streakContinued: false,
          streakBroken: false,
          currentStreak: state.loginStreak,
        },
      };
    }

    const yesterday = this.getYesterdayString();
    const streakContinued = state.lastLoginDate === yesterday;
    const streakBroken = state.lastLoginDate !== null && !streakContinued;

    const newStreak = streakContinued ? state.loginStreak + 1 : 1;

    const updated: RetentionState = {
      ...state,
      lastLoginDate: today,
      loginStreak: newStreak,
      maxLoginStreak: Math.max(state.maxLoginStreak, newStreak),
      totalLogins: state.totalLogins + 1,
      hasClaimedToday: false,
    };

    Logger.info(`[LoginStreak] Streak: ${newStreak} (continued: ${streakContinued}, broken: ${streakBroken})`);

    return {
      updated,
      result: {
        isNewDay: true,
        streakContinued,
        streakBroken,
        currentStreak: newStreak,
      },
    };
  }

  private getYesterdayString(): string {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }

  getMilestone(streak: number): string | null {
    if (streak === 7)  return '7 DAY STREAK!';
    if (streak === 14) return '2 WEEK STREAK!';
    if (streak === 30) return '30 DAY STREAK!';
    return null;
  }
}
