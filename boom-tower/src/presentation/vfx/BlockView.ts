import Phaser from 'phaser';
import { Block } from '../../domain/blocks/Block';
import { BLOCK_COLORS, BlockType } from '../../domain/blocks/BlockType';

// ============================================
// BLOCK VIEW — Representación visual de un bloque
// ============================================

const BLOCK_SIZE = 60;
const BLOCK_PAD  = 4;

// Colores override por skin (se setea globalmente)
let activeSkinColors: Partial<Record<string, number>> = {};

export function setSkinColors(colors: Partial<Record<string, number>>): void {
  activeSkinColors = colors;
}

function getBlockColor(type: BlockType): number {
  return activeSkinColors[type] ?? BLOCK_COLORS[type] ?? 0x888888;
}

// Icono por tipo especial
const SPECIAL_LABELS: Partial<Record<BlockType, string>> = {
  [BlockType.BOMB]:      '💣',
  [BlockType.LIGHTNING]: '⚡',
  [BlockType.RAINBOW]:   '🌈',
  [BlockType.JACKPOT]:   '★',
};

export class BlockView {
  private scene: Phaser.Scene;
  private graphics: Phaser.GameObjects.Graphics;
  private label: Phaser.GameObjects.Text | null = null;
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
    const color = getBlockColor(this.block.type);
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

    // Borde especial
    const specialLabel = SPECIAL_LABELS[this.block.type];
    if (specialLabel) {
      g.lineStyle(3, 0xffffff, 0.8);
      g.strokeRoundedRect(this.x - s / 2, this.y - s / 2, s, s, 8);

      if (!this.label) {
        this.label = this.scene.add.text(this.x, this.y, specialLabel, {
          fontSize: '20px',
          fontFamily: 'Arial',
        }).setOrigin(0.5).setDepth(6);
      } else {
        this.label.setPosition(this.x, this.y);
      }
    }
  }

  highlight(on: boolean): void {
    const g     = this.graphics;
    const color = getBlockColor(this.block.type);
    const s     = BLOCK_SIZE - BLOCK_PAD;

    g.clear();

    if (on) {
      g.lineStyle(3, 0xffffff, 1);
      g.strokeRoundedRect(this.x - s / 2 - 2, this.y - s / 2 - 2, s + 4, s + 4, 10);
    }

    g.fillStyle(color, on ? 1 : 0.85);
    g.fillRoundedRect(this.x - s / 2, this.y - s / 2, s, s, 8);
    g.fillStyle(0xffffff, 0.2);
    g.fillRoundedRect(this.x - s / 2 + 4, this.y - s / 2 + 4, s * 0.5, s * 0.25, 4);
  }

  playExplode(onComplete?: () => void): void {
    if (this.label) {
      this.scene.tweens.add({
        targets: this.label, alpha: 0, duration: 180,
        onComplete: () => this.label?.destroy(),
      });
    }
    this.scene.tweens.add({
      targets: this.graphics,
      scaleX: 1.4, scaleY: 1.4, alpha: 0,
      duration: 180, ease: 'Power2',
      onComplete: () => {
        this.destroy();
        onComplete?.();
      },
    });
  }

  moveTo(x: number, y: number, duration = 120): void {
    this.x = x;
    this.y = y;
    this.label?.setPosition(x, y);
    this.scene.tweens.add({
      targets: this.graphics,
      x: x - this.graphics.x,
      y: y - this.graphics.y,
      duration, ease: 'Power1',
      onComplete: () => this.draw(),
    });
  }

  setDepth(depth: number): void {
    this.graphics.setDepth(depth);
    this.label?.setDepth(depth + 1);
  }

  destroy(): void {
    this.graphics.destroy();
    this.label?.destroy();
  }
}
