import Phaser from 'phaser';
import { Block } from '../../domain/blocks/Block';
import { BLOCK_COLORS } from '../../domain/blocks/BlockType';

// ============================================
// BLOCK VIEW — Representación visual de un bloque
// ============================================

const BLOCK_SIZE = 60;
const BLOCK_PAD  = 4;

export class BlockView {
  private scene: Phaser.Scene;
  private graphics: Phaser.GameObjects.Graphics;
  private block: Block;
  x: number;
  y: number;

  constructor(scene: Phaser.Scene, block: Block, x: number, y: number) {
    this.scene   = scene;
    this.block   = block;
    this.x       = x;
    this.y       = y;
    this.graphics = scene.add.graphics();
    this.draw();
  }

  static cellSize(): number { return BLOCK_SIZE; }

  draw(): void {
    const g     = this.graphics;
    const color = BLOCK_COLORS[this.block.type];
    const s     = BLOCK_SIZE - BLOCK_PAD;

    g.clear();

    // Sombra
    g.fillStyle(0x000000, 0.3);
    g.fillRoundedRect(this.x - s / 2 + 3, this.y - s / 2 + 3, s, s, 8);

    // Cuerpo
    g.fillStyle(color, 1);
    g.fillRoundedRect(this.x - s / 2, this.y - s / 2, s, s, 8);

    // Brillo
    g.fillStyle(0xffffff, 0.2);
    g.fillRoundedRect(this.x - s / 2 + 4, this.y - s / 2 + 4, s * 0.5, s * 0.25, 4);
  }

  highlight(on: boolean): void {
    const g     = this.graphics;
    const color = BLOCK_COLORS[this.block.type];
    const s     = BLOCK_SIZE - BLOCK_PAD;

    g.clear();

    if (on) {
      // Borde de selección
      g.lineStyle(3, 0xffffff, 1);
      g.strokeRoundedRect(this.x - s / 2 - 2, this.y - s / 2 - 2, s + 4, s + 4, 10);
    }

    g.fillStyle(color, on ? 1 : 0.85);
    g.fillRoundedRect(this.x - s / 2, this.y - s / 2, s, s, 8);

    g.fillStyle(0xffffff, 0.2);
    g.fillRoundedRect(this.x - s / 2 + 4, this.y - s / 2 + 4, s * 0.5, s * 0.25, 4);
  }

  playExplode(onComplete?: () => void): void {
    this.scene.tweens.add({
      targets: this.graphics,
      scaleX: 1.4,
      scaleY: 1.4,
      alpha: 0,
      duration: 180,
      ease: 'Power2',
      onComplete: () => {
        this.destroy();
        onComplete?.();
      },
    });
  }

  moveTo(x: number, y: number, duration = 120): void {
    this.x = x;
    this.y = y;
    this.scene.tweens.add({
      targets: this.graphics,
      x: x - this.graphics.x,
      y: y - this.graphics.y,
      duration,
      ease: 'Power1',
      onComplete: () => this.draw(),
    });
  }

  setDepth(depth: number): void {
    this.graphics.setDepth(depth);
  }

  destroy(): void {
    this.graphics.destroy();
  }
}