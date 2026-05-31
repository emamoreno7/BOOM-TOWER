export interface BalanceConfig {
  minCoinsPerGame: number;
  maxCoinsPerGame: number;
  chestCostCoins: Record<string, number>;
  chestCostGems: Record<string, number>;
  skinCostCoins: Record<string, number>;
  skinCostGems: Record<string, number>;
  gemsPerLevel: number;
}

export const DEFAULT_BALANCE: BalanceConfig = {
  minCoinsPerGame: 20,
  maxCoinsPerGame: 300,
  chestCostCoins: { common: 100, rare: 500, epic: 1500, legendary: 5000 },
  chestCostGems:  { common: 0,   rare: 10,  epic: 30,   legendary: 100  },
  skinCostCoins:  { basic: 200,  premium: 1000, legendary: 5000 },
  skinCostGems:   { basic: 0,    premium: 20,   legendary: 80   },
  gemsPerLevel: 5,
};

export class EconomyBalancer {
  private config: BalanceConfig;

  constructor(config?: Partial<BalanceConfig>) {
    this.config = { ...DEFAULT_BALANCE, ...config };
  }

  getChestCost(tier: string): { coins: number; gems: number } {
    return {
      coins: this.config.chestCostCoins[tier] ?? 100,
      gems:  this.config.chestCostGems[tier]  ?? 0,
    };
  }

  getSkinCost(tier: string): { coins: number; gems: number } {
    return {
      coins: this.config.skinCostCoins[tier] ?? 200,
      gems:  this.config.skinCostGems[tier]  ?? 0,
    };
  }

  getGemsPerLevel(): number { return this.config.gemsPerLevel; }

  clampGameReward(coins: number): number {
    return Math.max(this.config.minCoinsPerGame, Math.min(this.config.maxCoinsPerGame, coins));
  }

  getConfig(): BalanceConfig { return { ...this.config }; }
}
