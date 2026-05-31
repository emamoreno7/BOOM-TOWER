import { XPCurve } from './XPCurve';
import { EventBus } from '../../core/EventBus';
import { Logger } from '../../core/Logger';

export interface LevelState {
  level: number;
  totalXP: number;
  xpInLevel: number;
  xpForNext: number;
}

class LevelSystem_ {
  private static instance: LevelSystem_;
  private curve: XPCurve = new XPCurve();
  private totalXP = 0;
  private level = 1;
  private xpInLevel = 0;
  private xpForNext = 0;

  private constructor() {
    this.sync();
    Logger.system('LevelSystem initialized');
  }

  static getInstance(): LevelSystem_ {
    if (!LevelSystem_.instance) {
      LevelSystem_.instance = new LevelSystem_();
    }
    return LevelSystem_.instance;
  }

  addXP(amount: number): void {
    if (amount <= 0) return;
    const prevLevel = this.level;
    this.totalXP += amount;
    this.sync();
    if (this.level > prevLevel) {
      Logger.game('[LevelSystem] Level up! ' + prevLevel + ' -> ' + this.level);
      EventBus.emit('level:up', { prevLevel, newLevel: this.level });
      for (let l = prevLevel + 1; l <= this.level; l++) {
        EventBus.emit('level:reached', { level: l });
      }
    }
    EventBus.emit('level:xpChanged', { totalXP: this.totalXP, xpInLevel: this.xpInLevel, xpForNext: this.xpForNext });
  }

  private sync(): void {
    const result = this.curve.levelFromXP(this.totalXP);
    this.level     = result.level;
    this.xpInLevel = result.xpInLevel;
    this.xpForNext = result.xpForNext;
  }

  getLevel(): number     { return this.level; }
  getTotalXP(): number   { return this.totalXP; }
  getXPInLevel(): number { return this.xpInLevel; }
  getXPForNext(): number { return this.xpForNext; }
  getProgress(): number  { return this.xpForNext > 0 ? this.xpInLevel / this.xpForNext : 1; }

  getState(): LevelState {
    return { level: this.level, totalXP: this.totalXP, xpInLevel: this.xpInLevel, xpForNext: this.xpForNext };
  }

  restore(state: LevelState): void {
    this.totalXP = state.totalXP;
    this.sync();
  }
}

export const LevelSystem = LevelSystem_.getInstance();
