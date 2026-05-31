import { Wallet, WalletState } from './Wallet';
import { Logger } from '../../core/Logger';
import { EventBus } from '../../core/EventBus';

export interface EconomyReward {
  coins?: number;
  gems?: number;
  reason: string;
}

export interface EconomyConfig {
  coinsPerPoint: number;
  comboBonus: number;
  perfectRunBonus: number;
  dailyBonusCoins: number;
}

const DEFAULT_CONFIG: EconomyConfig = {
  coinsPerPoint: 0.01,
  comboBonus: 10,
  perfectRunBonus: 50,
  dailyBonusCoins: 100,
};

class EconomySystem_ {
  private static instance: EconomySystem_;
  private wallet: Wallet = new Wallet();
  private config: EconomyConfig = DEFAULT_CONFIG;

  private constructor() {
    Logger.system('EconomySystem initialized');
  }

  static getInstance(): EconomySystem_ {
    if (!EconomySystem_.instance) {
      EconomySystem_.instance = new EconomySystem_();
    }
    return EconomySystem_.instance;
  }

  init(walletState?: Partial<WalletState>): void {
    this.wallet = new Wallet(walletState);
    Logger.info('[EconomySystem] Wallet initialized');
  }

  rewardFromScore(score: number, maxCombo: number): EconomyReward {
    const base = Math.floor(score * this.config.coinsPerPoint);
    const combo = Math.floor(maxCombo * this.config.comboBonus);
    const total = base + combo;
    this.wallet.addCoins(total);
    EventBus.emit('economy:reward', { coins: total, reason: 'game_end' });
    Logger.info('[EconomySystem] Score reward: ' + total + ' coins');
    return { coins: total, reason: 'game_end' };
  }

  reward(reward: EconomyReward): boolean {
    if (reward.coins) this.wallet.addCoins(reward.coins);
    if (reward.gems)  this.wallet.addGems(reward.gems);
    EventBus.emit('economy:reward', reward);
    return true;
  }

  purchase(costCoins: number, costGems: number, itemId: string): boolean {
    if (costCoins > 0 && !this.wallet.canAffordCoins(costCoins)) return false;
    if (costGems  > 0 && !this.wallet.canAffordGems(costGems))   return false;
    if (costCoins > 0) this.wallet.spendCoins(costCoins);
    if (costGems  > 0) this.wallet.spendGems(costGems);
    EventBus.emit('economy:purchase', { itemId, costCoins, costGems });
    Logger.info('[EconomySystem] Purchase: ' + itemId);
    return true;
  }

  getWallet(): Wallet { return this.wallet; }

  setConfig(config: Partial<EconomyConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

export const EconomySystem = EconomySystem_.getInstance();
