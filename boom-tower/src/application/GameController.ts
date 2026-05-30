import Phaser from 'phaser';
import { Logger } from '../core/Logger';
import { EventBus } from '../core/EventBus';
import { StateManager } from './state/StateManager';
import { InputManager } from './InputManager';
import { StatsTracker } from '../domain/stats/StatsTracker';

// ============================================
// GAME CONTROLLER — Orquestador del gameplay
// ============================================

class GameController_ {
  private static instance: GameController_;
  
  private game: Phaser.Game | null = null;
  private inputManager: InputManager | null = null;
  private isRunning = false;
  private lastUpdateTime = 0;

  private constructor() {
    Logger.system('GameController initialized');
  }

  static getInstance(): GameController_ {
    if (!GameController_.instance) {
      GameController_.instance = new GameController_();
    }
    return GameController_.instance;
  }

  // Inicializar con Phaser game
  init(scene: Phaser.Scene): void {
    this.game = scene.game;
    this.setupEventListeners();
    Logger.info('[GameController] Initialized');
  }
  // Iniciar partida
  startGame(): void {
    if (this.isRunning) {
      Logger.warn('[GameController] Game already running');
      return;
    }

    Logger.game('Starting new game');

    StateManager.updateGame((state) => ({
      ...state,
      appState: 'PLAYING',
      isPlaying: true,
      isPaused: false,
      isGameOver: false,
      score: 0,
      combo: 0,
      maxComboThisRun: 0,
      chainLength: 0,
      currentDepth: 0,
      sessionStartTime: Date.now(),
      lastActionTime: Date.now(),
    }));

    StatsTracker.startSession();
    EventBus.emit('game:start', { scene: 'game' });

    this.isRunning = true;
  }

  // Pausar
  pauseGame(): void {
    if (!this.isRunning) return;

    Logger.game('Game paused');

    StateManager.updateGame((state) => ({
      ...state,
      isPaused: true,
      appState: 'PAUSED',
      pauseStartTime: Date.now(),
    }));

    EventBus.emit('game:pause', {});
  }

  // Reanudar
  resumeGame(): void {
    StateManager.updateGame((state) => {
      if (!state.isPaused) return state;
      
      const pauseDuration = state.pauseStartTime 
        ? Date.now() - state.pauseStartTime 
        : 0;
      
      return {
        ...state,
        isPaused: false,
        appState: 'PLAYING',
        totalPausedTime: state.totalPausedTime + pauseDuration,
        pauseStartTime: null,
      };
    });

    Logger.game('Game resumed');
    EventBus.emit('game:resume', {});
  }

  // Terminar partida
  endGame(): void {
    if (!this.isRunning) return;

    const gameState = StateManager.getGame();

    Logger.game('Game over', {
      score: gameState.score,
      depth: gameState.maxDepth,
      maxCombo: gameState.maxComboThisRun,
    });

    StateManager.updateGame((state) => ({
      ...state,
      isPlaying: false,
      isGameOver: true,
      appState: 'GAME_OVER',
    }));

    StatsTracker.endSession();
    EventBus.emit('game:over', {
      score: gameState.score,
      depth: gameState.maxDepth,
    });
  }

  // Reiniciar
  restartGame(): void {
    Logger.game('Restarting game');

    StateManager.resetSession();
    StatsTracker.startSession();

    StateManager.updateGame((state) => ({
      ...state,
      appState: 'PLAYING',
      isPlaying: true,
      isPaused: false,
      isGameOver: false,
      score: 0,
      combo: 0,
      chainLength: 0,
      currentDepth: 0,
      sessionStartTime: Date.now(),
      lastActionTime: Date.now(),
    }));

    EventBus.emit('game:restart', {});
  }

  // Agregar score
  addScore(amount: number, source = 'block'): void {
    StateManager.updateGame((state) => ({
      ...state,
      score: state.score + amount,
      lastActionTime: Date.now(),
    }));

    StatsTracker.recordBlockDestroyed(source);
    EventBus.emit('score:gained', { amount, source });
  }

  // Registrar combo
  registerCombo(level: number): void {
    StateManager.updateGame((state) => ({
      ...state,
      combo: level,
      chainLength: level,
      maxComboThisRun: Math.max(state.maxComboThisRun, level),
    }));

    StatsTracker.recordCombo(level);
    EventBus.emit('combo:increased', { level, multiplier: this.getComboMultiplier(level) });
  }

  // Registrar profundidad
  setDepth(depth: number): void {
    StateManager.updateGame((state) => ({
      ...state,
      currentDepth: depth,
      maxDepth: Math.max(state.maxDepth, depth),
    }));

    StatsTracker.recordDepth(depth);
  }

  // Actualizar combo (decay)
  updateCombo(delta: number): void {
    const state = StateManager.getGame();
    if (state.combo > 0 && delta > 3) {
      StateManager.updateGame((s) => ({
        ...s,
        combo: 0,
        chainLength: 0,
      }));
    }
  }

  // Getters
  isGameRunning(): boolean {
    return this.isRunning;
  }

  isGamePaused(): boolean {
    return StateManager.getGame().isPaused;
  }

  isGameOver(): boolean {
    return StateManager.getGame().isGameOver;
  }

  getScore(): number {
    return StateManager.getGame().score;
  }

  getCombo(): number {
    return StateManager.getGame().combo;
  }

  private getComboMultiplier(level: number): number {
    if (level >= 100) return 10;
    if (level >= 50) return 7;
    if (level >= 25) return 5;
    if (level >= 10) return 3;
    if (level >= 5) return 2;
    return 1;
  }

  // Setup event listeners
  private setupEventListeners(): void {
    EventBus.on('game:over', () => {
      this.isRunning = false;
    });
  }

  // Destroy
  destroy(): void {
    this.inputManager?.destroy();
    this.game = null;
    this.isRunning = false;
    Logger.system('[GameController] Destroyed');
  }
}

export const GameController = GameController_.getInstance();
