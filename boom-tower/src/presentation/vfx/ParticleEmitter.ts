import Phaser from 'phaser';
import { BlockType } from '../../domain/blocks/BlockType';
import { BLOCK_COLORS } from '../../domain/blocks/BlockType';

export class ParticleEmitter {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  emitBurst(x: number, y: number, type: BlockType, count = 10): void {
    const color = BLOCK_COLORS[type];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = Phaser.Math.Between(40, 120);
      const size = Phaser.Math.Between(3, 8);
      const g = this.scene.add.graphics();
      g.fillStyle(color, 1);
      g.fillRect(-size / 2, -size / 2, size, size);
      g.setPosition(x, y).setDepth(15);
      this.scene.tweens.add({
        targets: g,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0, scaleX: 0.2, scaleY: 0.2,
        duration: Phaser.Math.Between(300, 600),
        ease: 'Power2',
        onComplete: () => g.destroy(),
      });
    }
  }

  emitStar(x: number, y: number, color = 0xffd700): void {
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const g = this.scene.add.graphics();
      g.fillStyle(color, 1);
      g.fillCircle(0, 0, 5);
      g.setPosition(x, y).setDepth(15);
      this.scene.tweens.add({
        targets: g,
        x: x + Math.cos(angle) * 80,
        y: y + Math.sin(angle) * 80,
        alpha: 0, duration: 500,
        onComplete: () => g.destroy(),
      });
    }
  }
}
