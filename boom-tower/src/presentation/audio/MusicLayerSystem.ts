import Phaser from 'phaser';
import { Logger } from '../../core/Logger';

export class MusicLayerSystem {
  private scene: Phaser.Scene;
  private layers: Map<string, Phaser.Sound.BaseSound> = new Map();
  private activeLayer: string | null = null;
  private volume = 0.4;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    Logger.info('[MusicLayerSystem] Initialized');
  }

  addLayer(key: string): void {
    if (!this.scene.cache.audio.exists(key)) {
      Logger.debug(`[MusicLayerSystem] Audio not found: ${key}`);
      return;
    }
    const sound = this.scene.sound.add(key, {
      loop: true, volume: 0,
    });
    this.layers.set(key, sound);
  }

  play(key: string, fadeDuration = 500): void {
    if (this.activeLayer === key) return;

    // Fade out anterior
    if (this.activeLayer) {
      const prev = this.layers.get(this.activeLayer);
      if (prev) {
        this.scene.tweens.add({
          targets: prev, volume: 0,
          duration: fadeDuration,
          onComplete: () => (prev as Phaser.Sound.WebAudioSound).stop(),
        });
      }
    }

    // Fade in nuevo
    const next = this.layers.get(key);
    if (next) {
      (next as Phaser.Sound.WebAudioSound).play();
      this.scene.tweens.add({
        targets: next, volume: this.volume,
        duration: fadeDuration,
      });
      this.activeLayer = key;
    }
  }

  stop(fadeDuration = 500): void {
    if (!this.activeLayer) return;
    const current = this.layers.get(this.activeLayer);
    if (current) {
      this.scene.tweens.add({
        targets: current, volume: 0,
        duration: fadeDuration,
        onComplete: () => (current as Phaser.Sound.WebAudioSound).stop(),
      });
    }
    this.activeLayer = null;
  }

  setVolume(volume: number): void {
    this.volume = Phaser.Math.Clamp(volume, 0, 1);
    if (this.activeLayer) {
      const current = this.layers.get(this.activeLayer);
      if (current) (current as any).volume = this.volume;
    }
  }

  destroy(): void {
    for (const [, sound] of this.layers) {
      sound.destroy();
    }
    this.layers.clear();
  }
}
