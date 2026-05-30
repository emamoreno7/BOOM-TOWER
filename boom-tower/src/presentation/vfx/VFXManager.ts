import Phaser from 'phaser';
import { Logger } from '../../core/Logger';
import { ParticleEmitter } from './ParticleEmitter';
import { FloatingText } from './FloatingText';
import { ScreenShake } from '../feedback/ScreenShake';

// ============================================
// VFX MANAGER — Coordinador central de efectos visuales
// ============================================

export class VFXManager {
  private scene: Phaser.Scene;
  private particles: ParticleEmitter;
  private floatingText: FloatingText;
  private screenShake: ScreenShake;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.particles = new ParticleEmitter(scene);
    this.floatingText = new FloatingText(scene);
    this.screenShake = new ScreenShake(scene);
    Logger.ui('[VFXManager] Initialized');
  }

  // Explosión de bloque
  blockExplode(x: number, y: number, color: number): void {
    this.particles.burst(x, y, color, 12);
  }

  // Explosión especial (bomba, r etc)
  specialExplode(x: number, y: number, color: number): void {
    this.particles.burst(x, y, color, 30);
    this.screenShake.shake(ScreenShake.LEVELS.MEDIUM, 300);
  }

  // Combo text
  showCombo(x: number, y: number, level: number): void {
    const labels = ['', '', 'COMBO!', 'GREAT!', 'AMAZING!', 'INSANE!', 'GODLIKE!'];
    const label = labels[Math.min(level, labels.length - 1)] ?? 'COMBO!';
    const scale = 1 + level * 0.1;
    this.floatingText.show(x, y, label, { color: 0xffdd00, scale, duration: 900 });
  }

  // Score flotante
  showScore(x: number, y: number, points: number): void {
    this.floatingText.show(x, y, `+${points}`, { color: 0xffffff, scale: 0.8, duration: 700 });
  }

  // Evento especial
  showEvent(x: number, y: number, label: string, color: number): void {
    this.floatingText.show(x, y, label, { color, scale: 1.4, duration: 1200 });
    this.screenShake.shake(ScreenShake.LEVELS.LIGHT, 200);
  }

  // Jackpot
  jackpot(x: number, y: number): void {
    this.particles.burst(x, y, 0xffd700, 50);
    this.screenShake.shake(ScreenShake.LEVELS.STRONG, 500);
    this.floatingText.show(x, y, '💰 JACKPOT!', { color: 0xffd700, scale: 1.6, duration: 1500 });
  }

  // Game over
  gameOver(): void {
    this.screenShake.shake(ScreenShake.LEVELS.BRUTAL, 600);
  }

  destroy(): void {
    this.particles.destroy();
    this.floatingText.destroy();
    this.screenShake.cancel();
  }
}
