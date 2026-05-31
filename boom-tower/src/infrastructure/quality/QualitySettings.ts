import { Logger } from '../../core/Logger';
import { EventBus } from '../../core/EventBus';

export type QualityLevel = 'low' | 'medium' | 'high';

export interface QualityConfig {
  level: QualityLevel;
  particleCount: number;
  enableScreenShake: boolean;
  enableShadows: boolean;
  enableAnimations: boolean;
  targetFPS: number;
}

const QUALITY_PRESETS: Record<QualityLevel, QualityConfig> = {
  low: {
    level: 'low',
    particleCount: 4,
    enableScreenShake: false,
    enableShadows: false,
    enableAnimations: false,
    targetFPS: 30,
  },
  medium: {
    level: 'medium',
    particleCount: 6,
    enableScreenShake: true,
    enableShadows: false,
    enableAnimations: true,
    targetFPS: 60,
  },
  high: {
    level: 'high',
    particleCount: 10,
    enableScreenShake: true,
    enableShadows: true,
    enableAnimations: true,
    targetFPS: 60,
  },
};

export class QualitySettings {
  private config: QualityConfig;

  constructor() {
    this.config = { ...QUALITY_PRESETS.high };
    Logger.info('[QualitySettings] Initialized');
  }

  setLevel(level: QualityLevel): void {
    this.config = { ...QUALITY_PRESETS[level] };
    EventBus.emit('quality:changed', { level });
    Logger.info(`[QualitySettings] Level set: ${level}`);
  }

  get(): QualityConfig {
    return { ...this.config };
  }

  autoDetect(fps: number): void {
    if (fps < 25) this.setLevel('low');
    else if (fps < 50) this.setLevel('medium');
    else this.setLevel('high');
  }

  serialize(): { level: QualityLevel } {
    return { level: this.config.level };
  }

  restore(data: { level: QualityLevel }): void {
    this.setLevel(data.level);
  }
}
