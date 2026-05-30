import { Logger } from '../core/Logger';
import { EventBus } from '../core/EventBus';
import { StateManager } from './state/StateManager';
import type { AppState } from './state/StateManager';
import { SaveSystem } from '../infrastructure/save/SaveSystem';

// ============================================
// SESSION MANAGER — Gestor de sesión y auto-save
// ============================================

class SessionManager_ {
  private static instance: SessionManager_;
  
  private autoSaveInterval: number | null = null;
  private lastAutoSave = 0;
  private sessionStartTime = 0;
  private isPaused = false;

  private constructor() {
    Logger.system('SessionManager initialized');
  }

  static getInstance(): SessionManager_ {
    if (!SessionManager_.instance) {
      SessionManager_.instance = new SessionManager_();
    }
    return SessionManager_.instance;
  }

  // Iniciar sesión
  start(): void {
    this.sessionStartTime = Date.now();
    
    // Actualizar player state
    StateManager.updatePlayer((state) => ({
      ...state,
      lastPlayedAt: Date.now(),
    }));

    // Iniciar auto-save
    this.startAutoSave();

    // Escuchar eventos de fin de sesión
    this.setupEventListeners();

    Logger.info('[SessionManager] Session started', {
      sessionId: StateManager.getSession().sessionId,
    });

    EventBus.emit('session:started', { 
      sessionId: StateManager.getSession().sessionId,
    });
  }

  // Terminar sesión
  async end(): Promise<void> {
    Logger.info('[SessionManager] Session ending');

    this.stopAutoSave();

    // Guardar estado final
    await this.save();

    EventBus.emit('session:ended', {
      duration: this.getSessionDuration(),
    });
  }

  // Pausar
  pause(): void {
    this.isPaused = true;
    Logger.info('[SessionManager] Session paused');
  }

  // Reanudar
  resume(): void {
    this.isPaused = false;
    Logger.info('[SessionManager] Session resumed');
  }

  // Guardar manualmente
  async save(): Promise<void> {
    try {
      const snapshot = StateManager.createSnapshot();
      await SaveSystem.save(snapshot);
      this.lastAutoSave = Date.now();
      
      Logger.info('[SessionManager] Save completed');
      EventBus.emit('save:completed', { timestamp: this.lastAutoSave });
    } catch (error) {
      Logger.error('[SessionManager] Save failed', { error });
      EventBus.emit('save:failed', { error: String(error) });
    }
  }

  // Cargar al inicio
  async load(): Promise<boolean> {
    try {
      const data = await SaveSystem.load();
      
      if (data) {
        StateManager.restore(data as AppState);
        Logger.info('[SessionManager] Load successful');
        EventBus.emit('load:completed', { timestamp: Date.now() });
        return true;
      }
      
      Logger.info('[SessionManager] No save data found');
      return false;
    } catch (error) {
      Logger.error('[SessionManager] Load failed', { error });
      return false;
    }
  }

  // Duración de sesión en ms
  getSessionDuration(): number {
    return Date.now() - this.sessionStartTime;
  }

  // Duración formateada
  getSessionDurationFormatted(): string {
    const ms = this.getSessionDuration();
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  }

  // Auto-save
  private startAutoSave(): void {
    const interval = 30000; // 30 segundos

    this.autoSaveInterval = window.setInterval(() => {
      if (!this.isPaused) {
        this.save();
      }
    }, interval);

    Logger.info(`[SessionManager] Auto-save every ${interval / 1000}s`);
  }

  private stopAutoSave(): void {
    if (this.autoSaveInterval !== null) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }

  // Setup listeners
  private setupEventListeners(): void {
    // Guardar antes de cerrar
    window.addEventListener('beforeunload', () => {
      this.save();
    });

    // Guardar cuando se minimiza
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.save();
        this.pause();
      } else {
        this.resume();
      }
    });

    // Request save
    EventBus.on('save:requested', () => {
      this.save();
    });
  }

  // Verificar si es primera sesión del jugador
  isFirstSession(): boolean {
    return StateManager.getPlayer().totalGamesPlayed === 0;
  }

  // Verificar si debe mostrar onboarding
  shouldShowOnboarding(): boolean {
    const session = StateManager.getSession();
    const player = StateManager.getPlayer();
    return !session.hasMadeFirstPurchase && player.totalGamesPlayed < 3;
  }
}

export const SessionManager = SessionManager_.getInstance();
