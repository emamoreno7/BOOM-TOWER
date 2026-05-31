import Phaser from 'phaser';
import { ExplosionEffect } from './ExplosionEffect';
import { FloatingText } from './FloatingText';
import { ScreenShake } from './ScreenShake';
import { BlockType } from '../../domain/blocks/BlockType';
import { QualitySettings } from '../../infrastructure/quality/QualitySettings';
import { Logger } from '../../core/Logger';

export class VFXManager {
  private scene: Phaser.Scene;
  private explosion: ExplosionEffect;
  private floatingText: FloatingText;
  private screenShake: ScreenShake;
  private quality: QualitySettings;

  constructor(scene: Phaser.Scene, quality?: QualitySettings) {
    this.scene        = scene;
    this.explosion    = new ExplosionEffect(scene);
    this.floatingText = new FloatingText(scene);
    this.screenShake  = new ScreenShake(scene);
    this.quality      = quality ?? new QualitySettings();
    Logger.info('[VFXManager] Initialized');
  }

  playExplosion(x: number, y: number, type: BlockType): void {
    this.explosion.play(x, y, type);
  }

  playChainExplosion(blocks: { x: number; y: number; type: BlockType }[]): void {
    const config = this.quality.get();
    // En calidad baja solo reproducimos cada 2 bloques
    const filtered = config.level === 'low'
      ? blocks.filter((_, i) => i % 2 === 0)
      : blocks;
    this.explosion.playChain(filtered);
  }

  showFloatingScore(x: number, y: number, score: number): void {
    const config = this.quality.get();
    if (!config.enableAnimations) return;
    this.floatingText.showScore(x, y, score);
  }

  showComboText(x: number, y: number, combo: number): void {
    const config = this.quality.get();
    if (!config.enableAnimations) return;
    this.floatingText.showCombo(x, y, combo);
  }

  shake(intensity = 0.01, duration = 200): void {
    const config = this.quality.get();
    if (!config.enableScreenShake) return;
    this.screenShake.play(intensity, duration);
  }

  playBombEffect(x: number, y: number): void {
    const config = this.quality.get();
    const g = this.scene.add.graphics();
    g.fillStyle(0xff6600, 0.8);
    g.fillCircle(x, y, 80);
    g.setDepth(20);
    this.scene.tweens.add({
      targets: g,
      scaleX: 2, scaleY: 2, alpha: 0,
      duration: 400, ease: 'Power2',
      onComplete: () => g.destroy(),
    });
    if (config.enableScreenShake) this.shake(0.02, 300);

    // Partículas extra solo en high
    if (config.level === 'high') {
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const p = this.scene.add.graphics();
        p.fillStyle(0xff4400, 1);
        p.fillCircle(0, 0, 6);
        p.setPosition(x, y).setDepth(21);
        this.scene.tweens.add({
          targets: p,
          x: x + Math.cos(angle) * 100,
          y: y + Math.sin(angle) * 100,
          alpha: 0, duration: 400,
          onComplete: () => p.destroy(),
        });
      }
    }
  }

  playLightningEffect(scene: Phaser.Scene, x1: number, y1: number, x2: number, y2: number): void {
    const g = scene.add.graphics();
    g.lineStyle(4, 0xffff00, 1);
    g.lineBetween(x1, y1, x2, y2);
    g.setDepth(20);
    scene.tweens.add({
      targets: g, alpha: 0, duration: 300,
      onComplete: () => g.destroy(),
    });
  }

  playRainbowEffect(x: number, y: number): void {
    const config = this.quality.get();
    const colors = [0xff0000, 0xff7700, 0xffff00, 0x00ff00, 0x0000ff, 0x8b00ff];
    const count = config.level === 'low' ? 3 : colors.length;

    colors.slice(0, count).forEach((color, i) => {
      this.scene.time.delayedCall(i * 40, () => {
        const g = this.scene.add.graphics();
        g.fillStyle(color, 0.7);
        g.fillCircle(x, y, 30 + i * 10);
        g.setDepth(20);
        this.scene.tweens.add({
          targets: g, alpha: 0, scaleX: 2, scaleY: 2,
          duration: 400, onComplete: () => g.destroy(),
        });
      });
    });
  }

  playJackpotEffect(x: number, y: number): void {
    const config = this.quality.get();
    const count = config.particleCount;

    for (let i = 0; i < count; i++) {
      this.scene.time.delayedCall(i * 50, () => {
        const g = this.scene.add.graphics();
        g.fillStyle(0xffd700, 1);
        g.fillTriangle(x, y - 15, x + 12, y + 10, x - 12, y + 10);
        g.setDepth(25);
        const angle = Math.random() * Math.PI * 2;
        const dist = Phaser.Math.Between(50, 200);
        this.scene.tweens.add({
          targets: g,
          x: x + Math.cos(angle) * dist,
          y: y + Math.sin(angle) * dist,
          alpha: 0, duration: 600,
          onComplete: () => g.destroy(),
        });
      });
    }
    if (config.enableScreenShake) this.shake(0.03, 500);
  }

  setQuality(quality: QualitySettings): void {
    this.quality = quality;
    Logger.info(`[VFXManager] Quality updated: ${quality.get().level}`);
  }
}
