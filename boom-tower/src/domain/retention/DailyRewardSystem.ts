import { RetentionState, getTodayString } from './RetentionState';
import { Logger } from '../../core/Logger';

export interface DailyReward {
  day: number;
  coins: number;
  gems: number;
  label: string;
  isSpecial: boolean;
}

export const DAILY_REWARDS: DailyReward[] = [
  { day: 1, coins: 100,  gems: 0,  label: 'Day 1',  isSpecial: false },
  { day: 2, coins: 150,  gems: 0,  label: 'Day 2',  isSpecial: false },
  { day: 3, coins: 200,  gems: 1,  label: 'Day 3',  isSpecial: false },
  { day: 4, coins: 250,  gems: 0,  label: 'Day 4',  isSpecial: false },
  { day: 5, coins: 300,  gems: 2,  label: 'Day 5',  isSpecial: false },
  { day: 6, coins: 400,  gems: 0,  label: 'Day 6',  isSpecial: false },
  { day: 7, coins: 500,  gems: 5,  label: 'Day 7',  isSpecial: true  },
  { day: 8, coins: 200,  gems: 0,  label: 'Day 8',  isSpecial: false },
  { day: 9, coins: 250,  gems: 1,  label: 'Day 9',  isSpecial: false },
  { day: 10, coins: 300, gems: 0,  label: 'Day 10', isSpecial: false },
  { day: 11, coins: 350, gems: 2,  label: 'Day 11', isSpecial: false },
  { day: 12, coins: 400, gems: 0,  label: 'Day 12', isSpecial: false },
  { day: 13, coins: 450, gems: 3,  label: 'Day 13', isSpecial: false },
  { day: 14, coins: 1000,gems: 10, label: 'Day 14', isSpecial: true  },
];

export class DailyRewardSystem {

  getRewardForDay(day: number): DailyReward {
    const index = ((day - 1) % DAILY_REWARDS.length);
    return DAILY_REWARDS[index];
  }

  canClaim(state: RetentionState): boolean {
    return !state.hasClaimedToday;
  }

  claim(state: RetentionState): { updated: RetentionState; reward: DailyReward } | null {
    if (!this.canClaim(state)) {
      Logger.info('[DailyReward] Already claimed today');
      return null;
    }

    const reward = this.getRewardForDay(state.dailyRewardDay);
    const updated: RetentionState = {
      ...state,
      hasClaimedToday: true,
      lastRewardClaimed: getTodayString(),
      dailyRewardDay: state.dailyRewardDay + 1,
    };

    Logger.info(`[DailyReward] Claimed day ${reward.day}: ${reward.coins} coins, ${reward.gems} gems`);
    return { updated, reward };
  }

  getUpcomingRewards(state: RetentionState, count = 7): DailyReward[] {
    const rewards: DailyReward[] = [];
    for (let i = 0; i < count; i++) {
      rewards.push(this.getRewardForDay(state.dailyRewardDay + i));
    }
    return rewards;
  }
}
