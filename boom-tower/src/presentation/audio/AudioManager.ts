import Phaser from 'phaser';
import { Logger } from '../../core/Logger';
import { EventBus } from '../../core/EventBus';

// ============================================
// AUDIO MANAGER — Gestor central de audio
// ============================================

type SoundKey = string;

interface SoundConfig {
  volume?: number;
  loop?: boolean;
  rate?: number;
}

export class AudioManager {
  private scene: Phaser.Scene;
  private sfxVolume = 1;
  private musicVolume = 0.7;
  private isMuted = false;
  private currentMusic: Phaser.Sound.BaseSound | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.setupListeners();
    Logger.ui('[AudioManager] Initialized');
  }

  playSFX(key: SoundKey, config: SoundConfig = {}): void {
    if (this.isMuted) return;
    if (!this.scene.cache.audio.exists(key)) {
      Logger.warn(`[AudioManager] SFX not found: ${key}`);
      return;
    }
    this.scene.sound.play(key, {
    volume: (config.volume ?? 1) * this.sfxVolume,
      rate: config.rate ?? 1,
      loop: false,
    });
  }

  playMusic(key: SoundKey, config: SoundConfig = {}): void {
    if (this.currentMusic?.key === key) return;
    this.stopMusic();
    if (!this.scene.cache.audio.exists(key)) {
      Logger.warn(`[AudioManager] Music not found: ${key}`);
      return;
    }
    this.currentMusic = this.scene.sound.add(key, {
      volume: (config.volume ?? 1) * this.musicVolume,
      loop: config.loop ?? true,
    });
    this.currentMusic.play();
    Logger.ui(`[AudioManager] Music playing: ${key}`);
  }

  stopMusic(): void {
    if (this.currentMusic) {
      this.currentMusic.stop();
      this.currentMusic.destroy();
      this.currentMusic = null;
    }
  }

  setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.currentMusic) {
      (this.currentMusic as Phaser.Sound.WebAudioSound).setVolume(this.musicVolume);
    }
  }

  setSFXVolume(volume: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
  }

  mute(): void {
    this.isMuted = true;
    this.scene.sound.mute = true;
  }

  unmute(): void {
    this.isMuted = false;
    this.scene.sound.mute = false;
  }

  toggleMute(): void {
    this.isMuted ? this.unmute() : this.mute();
  }

  private setupListeners(): void {
    EventBus.on('settings:musicVolume', (data: { value: number }) => {
      this.setMusicVolume(data.value);
    });
    EventBus.on('settings:sfxVolume', (data: { value: number }) => {
      this.setSFXVolume(data.value);
    });
  }

  destroy(): void {
    this.stopMusic();
  }
}
