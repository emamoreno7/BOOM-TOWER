// ============================================
// COMBO SYSTEM — Gestiona el combo y su decay
// ============================================

import { Logger } from '../../core/Logger';

export interface ComboState {
  level: number;
  lastHitTime: number;
  decayDelay: number; // ms sin acción antes de resetear
}

export class ComboSystem {
  private state: ComboState;

  constructor(decayDelay = 3000) {
    this.state = { level: 0, lastHitTime: 0, decayDelay };
  }

  hit(): number {
    this.state.level++;
    this.state.lastHitTime = Date.now();
    Logger.debug(`[ComboSystem] Combo: ${this.state.level}`);
    return this.state.level;
  }

  reset(): void {
    this.state.level = 0;
    Logger.debug('[ComboSystem] Combo reset');
  }

  tick(now: number): boolean {
    if (this.state.level === 0) return false;
    const elapsed = now - this.state.lastHitTime;
    if (elapsed >= this.state.decayDelay) {
      this.reset();
      return true; // devuelve true si hubo reset
    }
    return false;
  }

  getLevel(): number {
    return this.state.level;
  }
}
// EOF