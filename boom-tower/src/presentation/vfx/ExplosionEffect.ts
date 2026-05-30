import Phaser from 'phaser';
import { BLOCK_COLORS } from '../../domain/blocks/BlockType';
import { BlockType } from '../../domain/blocks/BlockType';

// ============================================
// EXPLOSION EFFECT — Partículas al destruir un bloque
// ============================================

const PARTICLE_COUNT = 8;

export class ExplosionEffect {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  play(x: number, y: number, type: BlockType): void {
    const color = BLOCK_COLORS[type];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle  = (i / PARTICLE_COUNT) * Math.PI * 2;
      const speed  = Phaser.Math.Between(60, 140);
      const size   = Phaser.Math.Between(4, 10);
      const vx     = Math.cos(angle) * speed;
      const vy     = Math.sin(angle) * speed;

      const g = this.scene.add.graphics();
      g.fillStyle(color, 1);
      g.fillCircle(0, 0, size);
      g.setPosition(x, y);
      g.setDepth(15);

      this.scene.tweens.add({
        targets: g,
        x: x + vx,
        y: y + vy,
        alpha: 0,
        scaleX: 0.2,
        scaleY: 0.2,
        duration: Phaser.Math.Between(250, 450),
        ease: 'Power2',
        onComplete: () => g.destroy(),
      });
    }

    // Flash central
    const flash = this.scene.add.graphics();
    flash.fillStyle(0xffffff, 0.8);
    flash.fillCircle(0, 0, 20);
    flash.setPosition(x, y);
    flash.setDepth(16);

    this.scene.tweens.add({
      targets: flash,
      scaleX: 2.5,
      scaleY: 2.5,
      alpha: 0,
      duration: 200,
      ease: 'Power2',
      onComplete: () => flash.destroy(),
    });
  }

  playChain(blocks: { x: number; y: number; type: BlockType }[], delayBetween = 30): void {
    blocks.forEach((b, i) => {
      this.scene.time.delayedCall(i * delayBetween, () => {
        this.play(b.x, b.y, b.type);
      });
    });
  }
}