import { LootTable, ChestTier, LootResult } from './LootTable';
import { EventBus } from '../../core/EventBus';
import { Logger } from '../../core/Logger';

export type { ChestTier } from './LootTable';

export interface ChestInventory {
  common: number;
  rare: number;
  epic: number;
  legendary: number;
}

class ChestSystem_ {
  private static instance: ChestSystem_;
  private inventory: ChestInventory = { common: 0, rare: 0, epic: 0, legendary: 0 };
  private table: LootTable = new LootTable();

  private constructor() {
    Logger.system('ChestSystem initialized');
  }

  static getInstance(): ChestSystem_ {
    if (!ChestSystem_.instance) {
      ChestSystem_.instance = new ChestSystem_();
    }
    return ChestSystem_.instance;
  }

  addChest(tier: ChestTier, amount = 1): void {
    this.inventory[tier] += amount;
    EventBus.emit('chest:added', { tier, amount, inventory: { ...this.inventory } });
    Logger.info('[ChestSystem] Added ' + amount + ' ' + tier + ' chest(s)');
  }

  open(tier: ChestTier): LootResult | null {
    if (this.inventory[tier] <= 0) {
      Logger.warn('[ChestSystem] No ' + tier + ' chests available');
      return null;
    }
    this.inventory[tier]--;
    const rolls = tier === 'legendary' ? 5 : tier === 'epic' ? 4 : tier === 'rare' ? 3 : 2;
    const loot = this.table.roll(tier, rolls);
    EventBus.emit('chest:opened', { tier, loot, inventory: { ...this.inventory } });
    EventBus.emit('economy:reward', { coins: loot.coins, gems: loot.gems, reason: 'chest_' + tier });
    Logger.info('[ChestSystem] Opened ' + tier + ' chest');
    return loot;
  }

  getInventory(): ChestInventory { return { ...this.inventory }; }
  hasChests(): boolean { return Object.values(this.inventory).some(v => v > 0); }
  restore(inventory: ChestInventory): void { this.inventory = { ...inventory }; }
}

export const ChestSystem = ChestSystem_.getInstance();
