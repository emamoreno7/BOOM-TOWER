import Phaser from 'phaser';
import { Logger } from '../../core/Logger';

// ============================================
// PARTICLE EMITTER — Emisor de particulas para VFX
// ============================================

interface BurstConfig {
  count: number;
  speed: number;
  scale: number;
  duration: number;
  gravity: number;
}

const DEFAULT_BURST: BurstConfig = {
  count: 12,
  speed: 200,
  scale: 0.15,
  duration: 600,
  gravity: 300,
};

export class ParticleEmitter {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    Logger.ui('[ParticleEmitter] Initialized');
  }

  burst(x: number, y: number, color: number, count = DEFAULT_BURST.count): void {
    const cfg = { ...DEFAULT_BURST, count };

    for (let i = 0; i < cfg.count; i++) {
      const angle = (i / cfg.count) * Math.PI * 2;
      const speed = cfg.speed * (0.5 + Math.random() * 0.5);
      const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
      const size = 6 + Math.random() * 8;

      const dot = this.scene.add.graphics();
      dot.fillStyle(color, 1);
      dot.fillCircle(0, 0, size);
      dot.setPosition(x, y);
      dot.setDepth(100);

      const t = cfg.duration / 1000;
      this.scene.tweens.add({
        targets: dot,
        x: x + vx * t,
        y: y + vy * t + cfg.gravity * t * t / 2,
        alpha: 0,
        scaleX: 0.1,
        scaleY: 0.1,
        duration: cfg.duration,
        ease: 'Power2',
        onComplete: () => dot.destroy(),
      });
    }
  }

  destroy(): void {
    // dots se auto-destruyen via tween
  }
}
