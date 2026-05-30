import { Logger } from '../../core/Logger';
import { EventBus } from '../../core/EventBus';
import { createInitialGameState, GameState } from './GameState';
import { createInitialPlayerState, PlayerState } from './PlayerState';
import { createInitialSessionState, SessionState } from './SessionState';
import { createInitialProgressState, ProgressState } from './ProgressState';
import { createInitialUIState, UIState } from './UIState';

// ============================================
// STATE MANAGER — Estado centralizado de la aplicación
// ============================================

export interface AppState {
  game: GameState;
  player: PlayerState;
  session: SessionState;
  progress: ProgressState;
  ui: UIState;
}

class StateManager_ {
  private static instance: StateManager_;
  
  private state: AppState;
  private listeners = new Set<(state: AppState) => void>();
  private changeLog: StateChange[] = [];
  private maxChangeLog = 100;

  private constructor() {
    this.state = this.createInitialState();
    Logger.system('StateManager initialized');
  }

  static getInstance(): StateManager_ {
    if (!StateManager_.instance) {
      StateManager_.instance = new StateManager_();
    }
    return StateManager_.instance;
  }

  // Estado completo (readonly)
  get(): Readonly<AppState> {
    return this.state;
  }

  // Subscripción a cambios
  subscribe(listener: (state: AppState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Notificar cambios
  private notify(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.state);
      } catch (error) {
        Logger.error('[StateManager] Listener error', { error });
      }
    }
  }

  // Log de cambios
  private logChange(path: string, oldValue: unknown, newValue: unknown): void {
    this.changeLog.push({
      path,
      oldValue,
      newValue,
      timestamp: Date.now(),
    });
    if (this.changeLog.length > this.maxChangeLog) {
      this.changeLog.shift();
    }
  }

  // ==================== GAME STATE ====================

  getGame(): Readonly<GameState> {
    return this.state.game;
  }

  updateGame(updater: (state: GameState) => GameState): void {
    const oldState = { ...this.state.game };
    this.state.game = updater(this.state.game);
    this.logChange('game', oldState, this.state.game);
    this.notify();
    EventBus.emit('state:game:updated', this.state.game);
  }

  // ==================== PLAYER STATE ====================

  getPlayer(): Readonly<PlayerState> {
    return this.state.player;
  }

  updatePlayer(updater: (state: PlayerState) => PlayerState): void {
    const oldState = { ...this.state.player };
    this.state.player = updater(this.state.player);
    this.logChange('player', oldState, this.state.player);
    this.notify();
    EventBus.emit('state:player:updated', this.state.player);
  }

  // ==================== SESSION STATE ====================

  getSession(): Readonly<SessionState> {
    return this.state.session;
  }

  updateSession(updater: (state: SessionState) => SessionState): void {
    const oldState = { ...this.state.session };
    this.state.session = updater(this.state.session);
    this.logChange('session', oldState, this.state.session);
    this.notify();
    EventBus.emit('state:session:updated', this.state.session);
  }

  // ==================== PROGRESS STATE ====================

  getProgress(): Readonly<ProgressState> {
    return this.state.progress;
  }

  updateProgress(updater: (state: ProgressState) => ProgressState): void {
    const oldState = { ...this.state.progress };
    this.state.progress = updater(this.state.progress);
    this.logChange('progress', oldState, this.state.progress);
    this.notify();
    EventBus.emit('state:progress:updated', this.state.progress);
  }

  // ==================== UI STATE ====================

  getUI(): Readonly<UIState> {
    return this.state.ui;
  }

  updateUI(updater: (state: UIState) => UIState): void {
    const oldState = { ...this.state.ui };
    this.state.ui = updater(this.state.ui);
    this.logChange('ui', oldState, this.state.ui);
    this.notify();
    EventBus.emit('state:ui:updated', this.state.ui);
  }

  // ==================== SNAPSHOTS ====================

  // Crear snapshot para save
  createSnapshot(): AppState {
    return JSON.parse(JSON.stringify(this.state));
  }

  // Restaurar desde snapshot
  restore(snapshot: AppState): void {
    this.state = snapshot;
    this.notify();
    Logger.info('[StateManager] State restored from snapshot');
  }

  // Reset completo
  reset(): void {
    this.state = this.createInitialState();
    this.changeLog = [];
    this.notify();
    Logger.info('[StateManager] State reset');
  }

  // Reset solo sesión
  resetSession(): void {
    const { game, player, progress, ui } = this.state;
    this.state = {
      ...this.state,
      game: createInitialGameState(),
      session: createInitialSessionState(`session_${Date.now()}`),
    };
    this.notify();
    Logger.info('[StateManager] Session reset');
  }

  // ==================== DEBUG ====================

  getChangeLog(): readonly StateChange[] {
    return [...this.changeLog];
  }

  getDebugInfo(): object {
    return {
      listeners: this.listeners.size,
      changeLogSize: this.changeLog.length,
      stateSizes: {
        game: JSON.stringify(this.state.game).length,
        player: JSON.stringify(this.state.player).length,
        session: JSON.stringify(this.state.session).length,
        progress: JSON.stringify(this.state.progress).length,
        ui: JSON.stringify(this.state.ui).length,
      },
    };
  }

  // ==================== PRIVATE ====================

  private createInitialState(): AppState {
    const sessionId = `session_${Date.now()}`;
    return {
      game: createInitialGameState(),
      player: createInitialPlayerState(`player_${Date.now()}`),
      session: createInitialSessionState(sessionId),
      progress: createInitialProgressState(),
      ui: createInitialUIState(),
    };
  }
}

interface StateChange {
  path: string;
  oldValue: unknown;
  newValue: unknown;
  timestamp: number;
}

export const StateManager = StateManager_.getInstance();
