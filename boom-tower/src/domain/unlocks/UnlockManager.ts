import { EventBus } from '../../core/EventBus';
import { Logger } from '../../core/Logger';

// ============================================
// UNLOCK MANAGER — Sistema de desbloqueos
// ============================================

export type UnlockType = 'skin' | 'block' | 'feature' | 'achievement';

export interface Unlock {
  id: string;
  type: UnlockType;
  name: string;
  requiredLevel?: number;
  requiredAchievement?: string;
  cost?: { coins?: number; ge?: number };
}

class UnlockManager_ {
  private static instance: UnlockManager_;
  private unlocked = new Set<string>();
  private registry = new Map<string, Unlock>();

  private constructor() {
    Logger.system('UnlockManager initialized');
  }

  static getInstance(): UnlockManager_ {
    if (!UnlockManager_.instance) {
      UnlockManager_.instance = new UnlockManager_();
    }
    return UnlockManager_.instance;
  }

  register(unlock: Unlock): void {
    this.registry.set(unlock.id, unlock);
  }

  registerMany(unlocks: Unlock[]): void {
    for (const u of unlocks) this.register(u);
  }

  unlock(id: string): boolean {
    if (this.unlocked.has(id)) return false;
    this.unlocked.add(id);
    const unlock = this.registry.get(id);
    EventBus.emit('unlock:granted', { id, unlock });
    Logger.info('[UnlockManager] Unlocked: ' + id);
    return true;
  }

  isUnlocked(id: string): boolean  { return this.unlocked.has(id); }
  getAll(): Unlock[]               { return [...this.registry.values()]; }
  getUnlocked(): string[]          { return [...this.unlocked]; }
  getLocked(): Unlock[]            { return [...this.registry.values()].filter(u => !this.unlocked.has(u.id)); }

  restore(unlockedIds: string[]): void {
    this.unlocked = new Set(unlockedIds);
  }
}

export const UnlockManager = UnlockManager_.getInstance();
