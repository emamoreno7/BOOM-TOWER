import Phaser from 'phaser';
import { Logger } from '../core/Logger';
import { EventBus } from '../core/EventBus';
import { StateManager } from './state/StateManager';
import { InputManager } from './InputManager';
import { StatsTracker } from '../domain/stats/StatsTracker';
import { EconomySystem } from '../domain/economy/EconomySystem';
import { LevelSystem } from '../domain/leveling/LevelSystem';
import { AchievementSystem } from '../domain/achievements/AchievementSystem';
import { MissionSystem } from '../domain/missions/MissionSystem';

// ============================================
// GAME CONTROLLER — Orquestador del gameplay
// ============================================

class GameController_ {
  private static instance: GameController_;

  private game: Phaser.Game | null = null;
  private inputManager: InputManager | null = null;
  private isRunning = false;
  private blocksDestroyedThisRun = 0;

  private constructor() {
    Logger.system('GameController initialized');
  }

  static getInstance(): GameController_ {
    if (!GameController_.instance) {
      GameController_.instance = new GameController_();
    }
    return GameController_.instance;
  }

  init(scene: Phaser.Scene): void {
    this.game = scene.game;
    this.setupEventListeners();
    MissionSystem.init();
    Logger.info('[GameController] Initialized');
  }

  startGame(): void {
    if (this.isRunning) {
      Logger.warn('[GameController] Game already running');
      return;
    }
    Logger.game('Starting new game');
    this.blocksDestroyedThisRun = 0;

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

  resumeGame(): void {
    StateManager.updateGame((state) => {
      if (!state.isPaused) return state;
      const pauseDuration = state.pauseStartTime ? Date.now() - state.pauseStartTime : 0;
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

  endGame(): void {
    if (!this.isRunning) return;

    const gameState = StateManager.getGame();
    const score     = gameState.score;
    const maxCombo  = gameState.maxComboThisRun;

    Logger.game('Game over', { score, maxCombo });

    StateManager.updateGame((state) => ({
      ...state,
      isPlaying: false,
      isGameOver: true,
      appState: 'GAME_OVER',
    }));

    StatsTracker.endSession();

    // Recompensar con coins
    const reward = EconomySystem.rewardFromScore(score, maxCombo);

    // XP basada en score
    const xp = Math.floor(score / 10) + maxCombo * 5;
    LevelSystem.addXP(xp);

    // Evaluar logros
    const player = StateManager.getPlayer();
    AchievementSystem.evaluate({
      totalGamesPlayed:       player.totalGamesPlayed + 1,
      totalScore:             score,
      maxCombo,
      totalBlocksDestroyed:   this.blocksDestroyedThisRun,
      level:                  LevelSystem.getLevel(),
      specialBlocksActivated: 0,
      jackpotsTriggered:      0,
      perfectRuns:            0,
    });

    // Progreso de misiones
    EventBus.emit('game:ended', {
      score,
      maxCombo,
      blocksDestroyed: this.blocksDestroyedThisRun,
    });

    EventBus.emit('game:over', { score, depth: gameState.maxDepth, reward });
    this.isRunning = false;
  }

  restartGame(): void {
    Logger.game('Restarting game');
    this.blocksDestroyedThisRun = 0;
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

  addScore(amount: number, source = 'block'): void {
    this.blocksDestroyedThisRun++;
    StateManager.updateGame((state) => ({
      ...state,
      score: state.score + amount,
      lastActionTime: Date.now(),
    }));
    StatsTracker.recordBlockDestroyed(source);
    EventBus.emit('score:gained', { amount, source });
  }

  registerCombo(level: number): void {
    StateManager.updateGame((state) => ({
      ...state,
      combo: level,
      chainLength: level,
      maxComboThisRun: Math.max(state.maxComboThisRun, level),
    }));
    StatsTracker.recordCombo(level);
    EventBus.emit('combo:hit', { level, multiplier: this.getComboMultiplier(level) });
    EventBus.emit('combo:increased', { level, multiplier: this.getComboMultiplier(level) });
  }

  setDepth(depth: number): void {
    StateManager.updateGame((state) => ({
      ...state,
      currentDepth: depth,
      maxDepth: Math.max(state.maxDepth, depth),
    }));
    StatsTracker.recordDepth(depth);
  }

  isGameRunning(): boolean { return this.isRunning; }
  isGamePaused(): boolean  { return StateManager.getGame().isPaused; }
  isGameOver(): boolean    { return StateManager.getGame().isGameOver; }
  getScore(): number       { return StateManager.getGame().score; }
  getCombo(): number       { return StateManager.getGame().combo; }

  private getComboMultiplier(level: number): number {
    if (level >= 100) return 10;
    if (level >= 50)  return 7;
    if (level >= 25)  return 5;
    if (level >= 10)  return 3;
    if (level >= 5)   return 2;
    return 1;
  }

  private setupEventListeners(): void {
    EventBus.on('game:over', () => { this.isRunning = false; });
    EventBus.on('economy:reward', (data: { coins?: number; gems?: number; reason: string }) => {
      if (data.coins) EconomySystem.reward({ coins: data.coins, reason: data.reason });
      if (data.gems)  EconomySystem.reward({ gems: data.gems, reason: data.reason });
    });
  }

  destroy(): void {
    this.inputManager?.destroy();
    this.game = null;
    this.isRunning = false;
    Logger.system('[GameController] Destroyed');
  }
}

export const GameController = GameController_.getInstance();
