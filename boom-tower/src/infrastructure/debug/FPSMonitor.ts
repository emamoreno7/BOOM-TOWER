import Phaser from 'phaser';
import { Logger } from '../../core/Logger';

// ============================================
// FPS MONITOR — Monitor de rendimiento
// ============================================

export class FPSMonitor {
  private scene: Phaser.Scene;
  private text: Phaser.GameObjects.Text;
  private history: number[] = [];
  private maxHistory = 60;
  private updateInterval = 500;
  private lastUpdate = 0;
  
  private minFps = 60;
  private maxFps = 60;
  private avgFps = 60;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    
    this.text = scene.add.text(x, y, 'FPS: --', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#00ff00',
      backgroundColor: '#000000aa',
      padding: { x: 8, y: 4 },
    });
    
    this.text.setScrollFactor(0);
    this.text.setDepth(10000);
    this.text.setVisible(false);

    Logger.system('[FPSMonitor] Initialized');
  }

  show(): void {
    this.text.setVisible(true);
  }

  hide(): void {
    this.text.setVisible(false);
  }

  toggle(): void {
    this.text.setVisible(!this.text.visible);
  }

  update(delta: number): void {
    const now = Date.now();
    if (now - this.lastUpdate < this.updateInterval) return;
    this.lastUpdate = now;

    const fps = this.scene.game.loop.actualFps;
    
    this.history.push(fps);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    this.minFps = Math.min(...this.history);
    this.maxFps = Math.max(...this.history);
    this.avgFps = this.history.reduce((a, b) => a + b, 0) / this.history.length;

    // Color basado en fps
    let color = '#00ff00';
    if (fps < 45) color = '#ff4444';
    else if (fps < 55) color = '#ffaa00';

    this.text.setText(`FPS: ${fps.toFixed(0)} | Min: ${this.minFps.toFixed(0)} | Avg: ${this.avgFps.toFixed(0)}`);
    this.text.setStyle({ color });
  }

  // Reset stats
  reset(): void {
    this.history = [];
    this.minFps = 60;
    this.maxFps = 60;
    this.avgFps = 60;
  }

  getStats(): { min: number; max: number; avg: number } {
    return {
      min: this.minFps,
      max: this.maxFps,
      avg: this.avgFps,
    };
  }

  destroy(): void {
    this.text.destroy();
  }
}
