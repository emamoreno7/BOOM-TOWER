import Phaser from 'phaser';
import { ExplosionEffect } from './ExplosionEffect';
import { FloatingText } from './FloatingText';
import { ScreenShake } from './ScreenShake';
import { BlockType } from '../../domain/blocks/BlockType';
import { Logger } from '../../core/Logger';

export class VFXManager {
  private scene: Phaser.Scene;
  private explosion: ExplosionEffect;
  private floatingText: FloatingText;
  private screenShake: ScreenShake;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.explosion = new ExplosionEffect(scene);
    this.floatingText = new FloatingText(scene);
    this.screenShake = new ScreenShake(scene);
    Logger.info('[VFXManager] Initialized');
  }

  playExplosion(x: number, y: number, type: BlockType): void {
    this.explosion.play(x, y, type);
  }

  playChainExplosion(blocks: { x: number; y: number; type: BlockType }[]): void {
    this.explosion.playChain(blocks);
  }

  showFloatingScore(x: number, y: number, score: number): void {
    this.floatingText.showScore(x, y, score);
  }

  showComboText(x: number, y: number, combo: number): void {
    this.floatingText.showCombo(x, y, combo);
  }

  shake(intensity = 0.01, duration = 200): void {
    this.screenShake.play(intensity, duration);
  }

  playBombEffect(x: number, y: number): void {
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
    this.shake(0.02, 300);
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
    const colors = [0xff0000, 0xff7700, 0xffff00, 0x00ff00, 0x0000ff, 0x8b00ff];
    colors.forEach((color, i) => {
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
    for (let i = 0; i < 20; i++) {
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
    this.shake(0.03, 500);
  }
}
