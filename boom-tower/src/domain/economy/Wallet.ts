import { EventBus } from '../../core/EventBus';
import { Logger } from '../../core/Logger';

export interface WalletState {
  coins: number;
  gems: number;
  lifetimeCoinsEarned: number;
  lifetimeGemsEarned: number;
}

export class Wallet {
  private coins: number;
  private gems: number;
  private lifetimeCoinsEarned: number;
  private lifetimeGemsEarned: number;

  constructor(state?: Partial<WalletState>) {
    this.coins = state?.coins ?? 0;
    this.gems = state?.gems ?? 0;
    this.lifetimeCoinsEarned = state?.lifetimeCoinsEarned ?? 0;
    this.lifetimeGemsEarned = state?.lifetimeGemsEarned ?? 0;
  }

  addCoins(amount: number): void {
    if (amount <= 0) return;
    this.coins += amount;
    this.lifetimeCoinsEarned += amount;
    EventBus.emit('wallet:coinsChanged', { coins: this.coins, delta: amount });
    Logger.info('[Wallet] Coins added: ' + amount + ' total: ' + this.coins);
  }

  addGems(amount: number): void {
    if (amount <= 0) return;
    this.gems += amount;
    this.lifetimeGemsEarned += amount;
    EventBus.emit('wallet:gemsChanged', { gems: this.gems, delta: amount });
    Logger.info('[Wallet] Gems added: ' + amount + ' total: ' + this.gems);
  }

  spendCoins(amount: number): boolean {
    if (amount <= 0) return false;
    if (this.coins < amount) {
      Logger.warn('[Wallet] Not enough coins: need ' + amount + ' have ' + this.coins);
      EventBus.emit('wallet:insufficientCoins', { needed: amount, have: this.coins });
      return false;
    }
    this.coins -= amount;
    EventBus.emit('wallet:coinsChanged', { coins: this.coins, delta: -amount });
    return true;
  }

  spendGems(amount: number): boolean {
    if (amount <= 0) return false;
    if (this.gems < amount) {
      Logger.warn('[Wallet] Not enough gems: need ' + amount + ' have ' + this.gems);
      EventBus.emit('wallet:insufficientGems', { needed: amount, have: this.gems });
      return false;
    }
    this.gems -= amount;
    EventBus.emit('wallet:gemsChanged', { gems: this.gems, delta: -amount });
    return true;
  }

  canAffordCoins(amount: number): boolean { return this.coins >= amount; }
  canAffordGems(amount: number): boolean  { return this.gems >= amount; }
  getCoins(): number { return this.coins; }
  getGems(): number  { return this.gems; }
  getLifetimeCoinsEarned(): number { return this.lifetimeCoinsEarned; }
  getLifetimeGemsEarned(): number  { return this.lifetimeGemsEarned; }

  getState(): WalletState {
    return {
      coins: this.coins,
      gems: this.gems,
      lifetimeCoinsEarned: this.lifetimeCoinsEarned,
      lifetimeGemsEarned: this.lifetimeGemsEarned,
    };
  }

  restore(state: WalletState): void {
    this.coins = state.coins;
    this.gems = state.gems;
    this.lifetimeCoinsEarned = state.lifetimeCoinsEarned;
    this.lifetimeGemsEarned = state.lifetimeGemsEarned;
  }
}
