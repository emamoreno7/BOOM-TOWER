import Phaser from 'phaser';
import { Logger } from '../../core/Logger';
import { EventBus } from '../../core/EventBus';
import { ConfigLoader } from '../../core/ConfigLoader';
import { SaveSystem } from '../../infrastructure/save/SaveSystem';
import { LocalStorageDriver } from '../../infrastructure/save/LocalStorageDriver';
import { StateManager } from '../../application/state/StateManager';
import { SessionManager } from '../../application/SessionManager';
import { StatsTracker } from '../../domain/stats/StatsTracker';
import { LoginStreakSystem } from '../../domain/retention/LoginStreakSystem';
import { DailyRewardSystem } from '../../domain/retention/DailyRewardSystem';
import { createInitialRetentionState } from '../../domain/retention/RetentionState';

// ============================================
// BOOT SCENE — Inicialización del juego
// ============================================

export class BootScene extends Phaser.Scene {
  private progressBar: Phaser.GameObjects.Graphics | null = null;
  private progressBox: Phaser.GameObjects.Graphics | null = null;
  private loadingText: Phaser.GameObjects.Text | null = null;
  private assetText: Phaser.GameObjects.Text | null = null;

  constructor() {
    super({ key: 'boot' });
  }

  preload(): void {
    this.createLoadingUI();
    this.setupLoadEvents();
  }

  create(): void {
    Logger.game('Boot scene creating');
    this.hideLoadingUI();
    this.initializeCore();
    this.loadConfigs();
    this.loadSave();
    SessionManager.start();

    this.time.delayedCall(500, () => {
      this.checkRetention();
      this.scene.start('splash');
    });
  }

  // ==================== RETENTION ====================

  private checkRetention(): void {
    const streakSystem = new LoginStreakSystem();
    const rewardSystem = new DailyRewardSystem();

    // Cargar estado de retención del localStorage
    let retentionState = createInitialRetentionState();
    try {
      const saved = localStorage.etItem('boom_tower_retention');
      if (saved) retentionState = JSON.parse(saved);
    } catch {
      Logger.debug('[Boot] No retention state found');
    }

    // Chequear login
    const { updated, result } = streakSystem.checkLogin(retentionState);
    retentionState = updated;

    if (result.isNewDay) {
      Logger.info(`[Boot] New day! Streak: ${result.currentStreak}`);

      // Milestone de racha
      const milestone = streakSystem.getMilestone(result.currentStreak);
      if (milestone) {
        this.time.delayedCall(1500, () => {
          EventBus.emit('ui:toast', { message: milestone, color: '#ffd700' });
        });
      }

      // Racha rota
      if (result.streakBroken) {
        Logger.info('[Boot] Streak broken!');
        retentionState.loginStreak = 1;
      }

      // Mostrar daily reward si no reclamó hoy
      if (rewardSystem.canClaim(retentionState)) {
        this.time.delayedCall(2000, () => {
          EventBus.emit('retention:show_daily', {});
        });
      }
    

    // Guardar estado actualizado
    try {
      localStorage.setItem('boom_tower_retention', JSON.stringify(retentionState));
    } catch {
      Logger.error('[Boot] Failed to save retention state', {});
    }

    // Emitir streak actual
    EventBus.emit('retention:streak_updated', {
      streak: retentionState.loginStreak,
      isNewDay: result.isNewDay,
    });
  }

  // ==================== UI ====================

  // ==================== UI ====================
    const { width, height } = this.cameras.main;

    this.progressBox = this.add.graphics();
    this.progressBox.fillStyle(0x333333, 1);
    this.progressBox.fillRect(width / 2 - 160, height / 2, 320, 30);
    this.progressBox.setDepth(100);

    this.progressBar = this.add.graphics();
    this.progressBar.setDepth(100);

    this.loadingText = this.add.text(width / 2, height / 2 - 50, 'LOADING...', {
      fontSize: '24px', fontFamily: 'Arial',
      color: '#ffd700', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(100);

    this.assetText = this.add.text(width / 2, height / 2 + 50, '', {
      fontSize: '16px', fontFamily: 'Arial', color: '#888888',
    }).setOrigin(0.5).setDepth(100);
  }

  private hideLoadingUI(): void {
    this.progressBox?.destroy();
    this.progressBar?.destroy();
    this.loadingText?.destroy();
    this.assetText?.destroy();
  }

  private setupLoadEvents(): void {
    this.load.on('progress', (value: number) => this.updateProgressBar(value));
    this.load.on('fileprogress', (file: Phaser.Loader.File) => {
      this.assetText?.setText(`Loading: ${file.key}`);
    });
    this.load.on('complete', () => {
      this.loadingText?.setText('READY!');
    });
  }

  private updateProgressBar(value: number): void {
    if (!this.progressBar) return;
    const { width, height } = this.cameras.main;
    this.progressBar.clear();
    this.progressBar.fillStyle(0xffd700, 1);
    this.progressBar.fillRect(width / 2 - 160, height / 2, 320 * value, 30);
  }

  // ==================== CORE ====================

  private initializeCore(): void {
    Logger.info('[Boot] Initializing core systems');
    const storageDriver = new LocalStorageDriver();
    SaveSystem.init(storageDriver);
    StatsTracker.init();
    Logger.info('[Boot] Core systems initialized');
  }

  private async loadConfigs(): Promise<void> {
    ConfigLoader.setBasePath('/data');
    try {
      const result = await ConfigLoader.load('game_config');
      if (result.success) Logger.info('[Boot] Game config loaded');
    } catch {
      Logger.debug('[Boot] No game config found, using defaults');
    }
  }

  private async loadSave(): Promise<void> {
    try {
      const hasSave = await SaveSystem.exists();
      if (hasSave) {
        await SessionManager.load();
        Logger.info('[Boot] Save data loaded');
      } else {
        Logger.info('[Boot] No save data found, starting fresh');
      }
    } catch (error) {
      Logger.error('[Boot] Failed to load save', { error });
    }
  }
}
