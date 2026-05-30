import Phaser from 'phaser';
import { Logger } from '../../core/Logger';
import { EventBus } from '../../core/EventBus';

// ============================================
// MUSIC LAYER SYSTEM — Musica dinamica por capas
// ============================================

interface MusicLayer {
  key: string; sound: Phaser.Sound.BaseSound | null;
  targetVolume: number;
  currentVolume: number;
}

export class MusicLayerSystem {
  private scene: Phaser.Scene;
  private layers: Map<string, MusicLayer> = new Map();
  private masterVolume = 0.7;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.setupListeners();
    Logger.ui('[MusicLayerSystem] Initialized');
  }

  addLayer(id: string, key: string, startVolume = 0): void {
    if (!this.scene.cache.audio.exists(key)) {
      Logger.warn('[MusicLayerSystem] Audio not found: ' + key);
      return;
    }
    const sound = this.scene.sound.add(key, { volume: startVolume, loop: true });
    sound.play();
    this.layers.set(id, { key, sound, targetVolume: startVolume, currentVolume: startVolume });
    Logger.ui('[MusicLayerSystem] Layer added: ' + id);
  }

  setLayerVolume(id: string, volume: number): void {
    const layer = this.layers.get(id);
    if (layer) layer.targetVolume = Math.max(0, Math.min(1, volume)) * this.masterVolume;
  }

  fadeIn(id: string): void  { this.setLayerVolume(id, 1); }
  fadeOut(id: string): void { this.setLayerVolume(id, 0); }

  update(): void {
    for (const layer of this.layers.values()) {
      if (!layer.sound) continue;
      const diff = layer.targetVolume - layer.currentVolume;
      if (Math.abs(diff) < 0.001) continue;
      layer.currentVolume += diff * 0.2;
      (layer.sound as Phaser.Sound.WebAudioSound).setVolume(layer.currentVolume);
    }
  }

  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  private setupListeners(): void {
    EventBus.on('event:started', () => this.fadeIn('intensity'));
    EventBus.on('event:ended',   () => this.fadeOut('intensity'));
    EventBus.on('combo:hit', (data: { level: number }) => {
      if (data.level >= 3) this.fadeIn('intensity');
    });
  }

  destroy(): void {
    for (const layer of this.layers.values()) {
      layer.sound?.stop();
      layer.sound?.destroy();
    }
    this.layers.clear();
  }
}
