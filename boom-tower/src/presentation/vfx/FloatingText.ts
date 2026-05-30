import Phaser from 'phaser';
import { Logger } from '../../core/Logger';

interface FloatingTextConfig {
  color?: number;
  scale?: number;
  duration?: number;
  fontSize?: number;
  rise?: number;
}

export class FloatingText {
  private scene: Phaser.Scene;
  private pool: Phaser.GameObjects.Text[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    Logger.ui('[FloatingText] Initialized');
  }

  show(x: number, y: number, text: string, config: FloatingTextConfig = {}): void {
    const color = config.color ?? 0xffffff;
    const scale = config.scale ?? 1;
    const duration = config.duration ?? 800;
    const fontSize = config.fontSize ?? 32;
    const rise = config.rise ?? 80;
    const hex = '#' + color.toString(16).padStart(6, '0');

    const label = this.scene.add.text(x, y, text, {
      fontSize: fontSize + 'px',
      fontFamily: 'Arial Black, Arial',
      color: hex,
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center',
    });

    label.setOrigin(0.5);
    label.setScale(scale * 0.5);
    label.setDepth(200);

    this.scene.tweens.add({
      targets: label,
      y: y - rise,
      scaleX: scale,
      scaleY: scale,
      alpha: { from: 1, to: 0 },
      duration,
      ease: 'Power2',
      onComplete: () => label.destroy(),
    });
  }

  destroy(): void {
    this.pool.forEach(t => t.destroy());
    this.pool = [];
  }
}
