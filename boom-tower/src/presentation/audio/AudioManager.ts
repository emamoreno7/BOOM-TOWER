import Phaser from 'phaser';
import { Logger } from '../../core/Logger';
import { EventBus } from '../../core/EventBus';

export class AudioManager {
  private scene: Phaser.Scene;
  private sfxVolume = 0.8;
  private musicVolume = 0.4;
  private muted = false;
  private subscriptions: string[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.setupListeners();
    Logger.info('[AudioManager] Initialized');
  }

  playSFX(key: string, volume?: number): void {
    if (this.muted) return;
    try {
      if (this.scene.cache.audio.exists(key)) {
        this.scene.sound.play(key, { volume: volume ?? this.sfxVolume });
      }
    } catch (e) {
      Logger.debug(`[AudioManager] SFX not found: ${key}`);
    }
  }

  playChainSFX(chainLength: number): void {
    if (chainLength >= 10) this.playSFX('sfx_chain_big');
    else if (chainLength >= 5) this.playSFX('sfx_chain_medium');
    else this.playSFX('sfx_chain_small');
  }

  playComboSFX(combo: number): void {
    if (combo >= 25) this.playSFX('sfx_combo_epic');
    else if (combo >= 10) this.playSFX('sfx_combo_big');
    else this.playSFX('sfx_combo');
  }

  playSpecialSFX(type: 'bomb' | 'lightning' | 'rainbow' | 'jackpot'): void {
    this.playSFX(`sfx_${type}`);
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    this.scene.sound.mute = muted;
    Logger.info(`[AudioManager] Muted: ${muted}`);
  }

  setSFXVolume(volume: number): void {
    this.sfxVolume = Phaser.Math.Clamp(volume, 0, 1);
  }

  setMusicVolume(volume: number): void {
    this.musicVolume = Phaser.Math.Clamp(volume, 0, 1);
  }

  private setupListeners(): void {
    this.subscriptions.push(
      EventBus.on('game:start', () => this.playSFX('sfx_start')),
      EventBus.on('game:over', () => this.playSFX('sfx_gameover')),
      EventBus.on('combo:increased', (p: { level: number }) => this.playComboSFX(p.level)),
    );
  }

  destroy(): void {
    for (const id of this.subscriptions) EventBus.off(id);
  }
}
