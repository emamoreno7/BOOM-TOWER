import Phaser from 'phaser';
import { Logger } from '../../core/Logger';
import { EventBus } from '../../core/EventBus';
import { StateManager } from '../../application/state/StateManager';

// ============================================
// SPLASH SCENE — Pantalla de splash con logo
// ============================================

export class SplashScene extends Phaser.Scene {
  private logo: Phaser.GameObjects.Text | null = null;
  private tagline: Phaser.GameObjects.Text | null = null;
  private particles: Phaser.GameObjects.Particles.ParticleEmitter | null = null;

  constructor() {
    super({ key: 'splash' });
  }

  create(): void {
    const { width, height } = this.cameras.main;

    Logger.game('Splash scene creating');

    // Fondo con gradiente
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x16213e, 1);
    bg.fillRect(0, 0, width, height);

    // Logo
    this.logo = this.add.text(width / 2, height * 0.35, 'BOOM TOWER', {
      fontSize: '64px',
      fontFamily: 'Arial Black, Arial',
      color: '#ffd700',
      fontStyle: 'bold',
      stroke: '#ff6b35',
      strokeThickness: 8,
    });
    this.logo.setOrigin(0.5);
    this.logo.setAlpha(0);
    this.logo.setScale(0.5);

    // Tagline
    this.tagline = this.add.text(width / 2, height * 0.45, 'JACKPOT EXPLOSION', {
      fontSize: '28px',
      fontFamily: 'Arial',
      color: '#ff6b35',
      fontStyle: 'italic',
    });
    this.tagline.setOrigin(0.5);
    this.tagline.setAlpha(0);

    // Partículas decorativas (estrellas)
    this.createParticles(width, height);

    // Animación de entrada
    this.playIntroAnimation(width, height);

    // Transición automática después de 2.5s
    this.time.delayedCall(2500, () => {
      this.transitionToMenu();
    });
  }

  private createParticles(width: number, height: number): void {
    // Sistema de partículas simple (placeholder)
    const graphics = this.add.graphics();
    graphics.fillStyle(0xffd700, 0.5);

    for (let i = 0; i < 20; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const size = Phaser.Math.Between(2, 5);
      graphics.fillCircle(x, y, size);
    }
  }

  private playIntroAnimation(width: number, height: number): void {
    // Logo bounce in
    this.tweens.add({
      targets: this.logo,
      alpha: 1,
      scale: 1,
      duration: 800,
      ease: 'Back.easeOut',
      delay: 300,
    });

    // Tagline fade in
    this.tweens.add({
      targets: this.tagline,
      alpha: 1,
      duration: 600,
      ease: 'Power2',
      delay: 700,
    });

    // Efecto de brillo en el logo
    this.tweens.add({
      targets: this.logo,
      alpha: 0.8,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: 1200,
    });

    // Shake sutil inicial
    this.cameras.main.shake(200, 0.003);
  }

  private transitionToMenu(): void {
    // Fade out
    this.cameras.main.fadeOut(400, 26, 26, 46);

    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('menu');
    });
  }

  // Permitir skip con tap
  update(): void {
    // Tap para skip
    if (this.input.activePointer.isDown) {
      this.transitionToMenu();
    }
  }
}