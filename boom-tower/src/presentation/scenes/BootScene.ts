import Phaser from 'phaser';
import { Logger } from '../../core/Logger';
import { EventBus } from '../../core/EventBus';
import { ConfigLoader } from '../../core/ConfigLoader';
import { SaveSystem } from '../../infrastructure/save/SaveSystem';
import { LocalStorageDriver } from '../../infrastructure/save/LocalStorageDriver';
import { StateManager } from '../../application/state/StateManager';
import { SessionManager } from '../../application/SessionManager';
import { SceneRouter } from '../../application/SceneRouter';
import { StatsTracker } from '../../domain/stats/StatsTracker';

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
    
    // Cargar assets dummy (placeholder para Fase 0)
    // En fases futuras se cargarán sprites reales aquí
  }

  create(): void {
    Logger.game('Boot scene creating');

    // Ocultar loading
    this.hideLoadingUI();

    // Inicializar sistemas core
    this.initializeCore();

    // Cargar configs si existen
    this.loadConfigs();

    // Cargar save
    this.loadSave();

    // Iniciar sesión
    SessionManager.start();

    // Transición a splash
    this.time.delayedCall(500, () => {
      this.scene.start('splash');
    });
  }

  private createLoadingUI(): void {
    const { width, height } = this.cameras.main;

    // Progress box
    this.progressBox = this.add.graphics();
    this.progressBox.fillStyle(0x333333, 1);
    this.progressBox.fillRect(width / 2 - 160, height / 2, 320, 30);
    this.progressBox.setDepth(100);

    // Progress bar
    this.progressBar = this.add.graphics();
    this.progressBar.setDepth(100);

    // Loading text
    this.loadingText = this.add.text(width / 2, height / 2 - 50, 'LOADING...', {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#ffd700',
      fontStyle: 'bold',
    });
    this.loadingText.setOrigin(0.5);
    this.loadingText.setDepth(100);

    // Asset text
    this.assetText = this.add.text(width / 2, height / 2 + 50, '', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#888888',
    });
    this.assetText.setOrigin(0.5);
    this.assetText.setDepth(100);
  }

  private hideLoadingUI(): void {
    if (this.progressBox) this.progressBox.destroy();
    if (this.progressBar) this.progressBar.destroy();
    if (this.loadingText) this.loadingText.destroy();
    if (this.assetText) this.assetText.destroy();
  }

  private setupLoadEvents(): void {
    // Progress bar
    this.load.on('progress', (value: number) => {
      this.updateProgressBar(value);
    });

    // File complete
    this.load.on('fileprogress', (file: Phaser.Loader.File) => {
      if (this.assetText) {
        this.assetText.setText(`Loading: ${file.key}`);
      }
    });

    // Complete
    this.load.on('complete', () => {
      if (this.loadingText) {
        this.loadingText.setText('READY!');
      }
    });
  }

  private updateProgressBar(value: number): void {
    if (!this.progressBar || !this.progressBox) return;

    const { width, height } = this.cameras.main;
    
    this.progressBar.clear();
    this.progressBar.fillStyle(0xffd700, 1);
    this.progressBar.fillRect(width / 2 - 160, height / 2, 320 * value, 30);
  }

  private initializeCore(): void {
    Logger.info('[Boot] Initializing core systems');

    // Storage driver
    const storageDriver = new LocalStorageDriver();
    SaveSystem.init(storageDriver);

    // Stats tracker
    StatsTracker.init();

    Logger.info('[Boot] Core systems initialized');
  }

  private async loadConfigs(): Promise<void> {
    // Placeholder - en fases futuras cargar JSONs
    ConfigLoader.setBasePath('/data');
    
    // Intentar cargar config si existe
    try {
      const result = await ConfigLoader.load('game_config');
      if (result.success) {
        Logger.info('[Boot] Game config loaded');
      }
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
