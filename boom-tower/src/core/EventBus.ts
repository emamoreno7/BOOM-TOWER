import { Logger } from './Logger';

// ============================================
// EVENT BUS — Sistema de eventos tipado y desacoplado
// ============================================

type EventHandler<T = unknown> = (payload: T) => void;

interface Subscription {
  id: string;
  event: string;
  handler: EventHandler;
  context?: object;
  once: boolean;
}

class EventBus {
  private static instance: EventBus;
  private subscriptions = new Map<string, Subscription[]>();
  private eventHistory: EventRecord[] = [];
  private nextId = 0;
  private maxHistory = 1000;

  private constructor() {
    Logger.system('EventBus initialized');
  }

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  // Suscribirse a un evento
  on<T = unknown>(event: string, handler: EventHandler<T>, context?: object): string {
    const id = `evt_${this.nextId++}`;
    const sub: Subscription = { id, event, handler: handler as EventHandler, context, once: false };
    
    if (!this.subscriptions.has(event)) {
      this.subscriptions.set(event, []);
    }
    this.subscriptions.get(event)!.push(sub);
    
    Logger.debug(`[EventBus] Subscribed: ${event} (id: ${id})`);
    return id;
  }

  // Suscribirse una sola vez
  once<T = unknown>(event: string, handler: EventHandler<T>, context?: object): string {
    const id = `evt_${this.nextId++}`;
    const sub: Subscription = { id, event, handler: handler as EventHandler, context, once: true };
    
    if (!this.subscriptions.has(event)) {
      this.subscriptions.set(event, []);
    }
    this.subscriptions.get(event)!.push(sub);
    
    Logger.debug(`[EventBus] Subscribed once: ${event} (id: ${id})`);
    return id;
  }

  // Desuscribirse por id
  off(id: string): boolean {
    for (const [, subs] of this.subscriptions) {
      const index = subs.findIndex(s => s.id === id);
      if (index !== -1) {
        subs.splice(index, 1);
        Logger.debug(`[EventBus] Unsubscribed: ${id}`);
        return true;
      }
    }
    return false;
  }

  // Desuscribirse por evento
  offAll(event: string): number {
    const subs = this.subscriptions.get(event);
    if (subs) {
      const count = subs.length;
      this.subscriptions.delete(event);
      Logger.debug(`[EventBus] Unsubscribed all: ${event} (count: ${count})`);
      return count;
    }
    return 0;
  }

  // Emitir evento síncrono
  emit<T = unknown>(event: string, payload?: T): void {
    const subs = this.subscriptions.get(event);
    
    // Registrar en historial
    const record: EventRecord = {
      event,
      payload,
      timestamp: Date.now(),
    };
    this.eventHistory.push(record);
    if (this.eventHistory.length > this.maxHistory) {
      this.eventHistory.shift();
    }

    if (!subs || subs.length === 0) {
      Logger.debug(`[EventBus] Event with no listeners: ${event}`);
      return;
    }

    // Ejecutar handlers (puede mutar el array)
    const toRemove: string[] = [];
    for (const sub of subs) {
      try {
        sub.handler(payload as T);
      } catch (error) {
        Logger.error(`[EventBus] Handler error in ${event}`, {
          error: error instanceof Error ? error.message : String(error),
          handlerId: sub.id,
        });
      }
      if (sub.once) {
        toRemove.push(sub.id);
      }
    }

    // Limpiar subscriptions "once"
    for (const id of toRemove) {
      this.off(id);
    }
  }

  // Emitir de forma asíncrona
  emitAsync<T = unknown>(event: string, payload?: T): Promise<void> {
    return new Promise((resolve) => {
      this.emit(event, payload);
      resolve();
    });
  }

  // Verificar si hay listeners
  hasListeners(event: string): boolean {
    const subs = this.subscriptions.get(event);
    return !!subs && subs.length > 0;
  }

  // Contar listeners
  listenerCount(event: string): number {
    return this.subscriptions.get(event)?.length ?? 0;
  }

  // Limpiar todos los eventos
  clear(): void {
    this.subscriptions.clear();
    Logger.system('EventBus cleared');
  }

  // Historial de eventos
  getHistory(event?: string): EventRecord[] {
    if (event) {
      return this.eventHistory.filter(r => r.event === event);
    }
    return [...this.eventHistory];
  }

  // Debug info
  getDebugInfo(): { eventCount: number; totalSubscriptions: number; historySize: number } {
    let total = 0;
    for (const [, subs] of this.subscriptions) {
      total += subs.length;
    }
    return {
      eventCount: this.subscriptions.size,
      totalSubscriptions: total,
      historySize: this.eventHistory.length,
    };
  }
}

interface EventRecord {
  event: string;
  payload?: unknown;
  timestamp: number;
}

// Singleton export
export const EventBus = EventBus.getInstance();

// Helper para crear listeners con tipado
export function createEventHandler<T>(handler: (payload: T) => void): EventHandler<T> {
  return handler;
}
