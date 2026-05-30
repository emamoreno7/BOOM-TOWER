import Phaser from 'phaser';
import { Logger } from '../../core/Logger';
import { EventBus } from '../../core/EventBus';

// ============================================
// FEEDBACK MANAGER — Sistema de feedback al jugador
// ============================================

interface FeedbackConfig {
  enableScreenShake: boolean;
  enableTimeDilation: boolean;
  enableHaptics: boolean;
  screenShakeDuration: number;
  timeDilationDuration: number;
}

const DEFAULT_CONFIG: FeedbackConfig = {
  enableScreenShake: true,
  enableTimeDilation: true,
  enableHaptics: true,
  screenShakeDuration: 200,
  timeDilationDuration: 300,
};

class FeedbackManager {
  private static instance: FeedbackManager;
  
  private scene: Phaser.Scene | null = null;
  private config: FeedbackConfig;
  private isTimeDilationActive = false;

  private constructor() {
    this.config = { ...DEFAULT_CONFIG };
    Logger.system('FeedbackManager initialized');
  }

  static getInstance(): FeedbackManager {
    if (!FeedbackManager.instance) {
      FeedbackManager.instance = new FeedbackManager();
    }
    return FeedbackManager.instance;
  }

  init(scene: Phaser.Scene): void {
    this.scene = scene;
    Logger.ui('[FeedbackManager] Scene set');
  }

  // Screen shake
  shake(intensity: number = 1, duration?: number): void {
    if (!this.config.enableScreenShake || !this.scene) return;

    const actualDuration = duration ?? this.config.screenShakeDuration;
    const camera = this.scene.cameras.main;

    camera.shake(intensity * 0.01, actualDuration);
    
    Logger.perf(`[Feedback] Screen shake: ${intensity}, ${actualDuration}ms`);
  }

  // Time dilation (bullet-time)
  slowMotion(scale: number = 0.3, duration?: number): void {
    if (!this.config.enableTimeDilation || !this.scene) return;
    if (this.isTimeDilationActive) return;

    this.isTimeDilationActive = true;
    const actualDuration = duration ?? this.config.timeDilationDuration;

    if (this.scene.game.loop) {
      this.scene.time.timeScale = scale;
    }

    this.scene?.time.delayedCall(actualDuration, () => {
      this.scene!.time.timeScale = 1;
      this.isTimeDilationActive = false;
    });

    Logger.perf(`[Feedback] Time dilation: ${scale}x for ${actualDuration}ms`);
  }

  // Flash de pantalla
  flash(color: number = 0xffffff, duration: number = 100): void {
    if (!this.scene) return;

    const camera = this.scene.cameras.main;
    camera.flash(duration, 
      (color >> 16) & 0xff,
      (color >> 8) & 0xff,
      color & 0xff,
      false
    );
  }

  // Vibración (móvil)
  vibrate(pattern: number[] = [50]): void {
    if (!this.config.enableHaptics) return;
    
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }

  // Haptic feedback
  haptic(type: 'light' | 'medium' | 'heavy' = 'light'): void {
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30, 10, 30],
    };
    this.vibrate(patterns[type]);
  }

  // Config
  setConfig(config: Partial<FeedbackConfig>): void {
    this.config = { ...this.config, ...config };
    Logger.ui('[FeedbackManager] Config updated', config);
  }

  getConfig(): FeedbackConfig {
    return { ...this.config };
  }

  // Disable todo
  disable(): void {
    this.config.enableScreenShake = false;
    this.config.enableTimeDilation = false;
    this.config.enableHaptics = false;
  }

  // Enable todo
  enable(): void {
    this.config.enableScreenShake = true;
    this.config.enableTimeDilation = true;
    this.config.enableHaptics = true;
  }
}

export const FeedbackManager = FeedbackManager.getInstance();
