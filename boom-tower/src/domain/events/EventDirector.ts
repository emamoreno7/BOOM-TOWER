import { Logger } from '../../core/Logger';
import { EventBus } from '../../core/EventBus';
import { Random } from '../../core/Random';

// ============================================
// EVENT DIRECTOR — Eventos core de sesión
// ============================================

export type GameEventType = 'FEVER' | 'RUSH' | 'JACKPOT_WAVE' | 'NONE';

export interface GameEvent {
  type: GameEventType;
  duration: number;
  multiplier: number;
  label: string;
  color: number;
}

const EVENTS: Record<Exclude<GameEventType, 'NONE'>, GameEvent> = {
  FEVER: {
    type: 'FEVER',
    duration: 10000,
    multiplier: 2,
    label: '🔥 FEVER!',
    color: 0xff4400,
  },
  RUSH: {
    type: 'RUSH',
    duration: 8000,
    multiplier: 1.5,
    label: '⚡ RUSH!',
    color: 0xffff00,
  },
  JACKPOT_WAVE: {
    type: 'JACKPOT_WAVE',
    duration: 6000,
    multiplier: 3,
    label: '💰 JACKPOT!',
    color: 0xffd700,
  },
};

export class EventDirector {
  private currentEvent: GameEvent | null = null;
  private eventTimer: ReturnType<typeof setTimeout> | null = null;
  private scoreAccumulator = 0;
  private readonly triggerThreshold: number;

  constructor(triggerThreshold = 2000) {
    this.triggerThreshold = triggerThreshold;
  }

  onScore(points: number): void {
    this.scoreAccumulator += points;
    if (this.scoreAccumulator >= this.triggerThreshold && !this.currentEvent) {
      this.scoreAccumulator = 0; this.triggerRandomEvent();
    }
  }

  onCombo(level: number): void {
    if (level >= 5 && !this.currentEvent) {
      this.triggerEvent('FEVER');
    } else if (level >= 3 && !this.currentEvent) {
      this.triggerEvent('RUSH');
    }
  }

  private triggerRandomEvent(): void {
    const types = Object.keys(EVENTS) as Exclude<GameEventType, 'NONE'>[];
    const picked = types[Random.integer(0, types.length - 1)];
    this.triggerEvent(picked);
  }

  private triggerEvent(type: Exclude<GameEventType, 'NONE'>): void {
    const event = EVENTS[type];
    this.currentEvent = event;

    Logger.game(`[EventDirector] Event triggered: ${event.label}`);
    EventBus.emit('event:started', { event });

    if (this.eventTimer) clearTimeout(this.eventTimer);
    this.eventTimer = setTimeout(() => {
      this.endEvent();
    }, event.duration);
  }

  private endEvent(): void {
    if (!this.currentEvent) return;
    Logger.game(`[EventDirector] Event ended: ${this.currentEvent.type}`);
    EventBus.emit('event:ended', { event: this.currentEvent });
    this.currentEvent = null;
    this.eventTimer = null;
  }

  getActiveEvent(): GameEvent | null {
    return this.currentEvent;
  }

  getMultiplier(): number {
    return this.currentEvent?.multiplier ?? 1;
  }

  isActive(): boolean {
    return this.currentEvent !== null;
  }

  reset(): void {
    if (this.eventTimer) clearTimeout(this.eventTimer);
    this.currentEvent = null;
    this.scoreAccumulator = 0;
  }
}
