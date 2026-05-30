import Phaser from 'phaser';

// ============================================
// SCREEN SHAKE — Efecto de sacudida de pantalla
// ============================================

export class ScreenShake {
  private scene: Phaser.Scene;
  private camera: Phaser.Cameras.Scene2D.Camera;
  private baseIntensity = 0;
  private currentIntensity = 0;
  private duration = 0;
  private elapsed = 0;
  private isActive = false;
  private tween: Phaser.Tweens.Tween | null = null;

  // Niveles predefinidos
  static readonly LEVELS = {
    SUBTLE: 0.005,
    LIGHT: 0.01,
    MEDIUM: 0.02,
    STRONG: 0.04,
    BRUTAL: 0.08,
  };

  constructor(scene: Phaser.Scene, camera?: Phaser.Cameras.Scene2D.Camera) {
    this.scene = scene;
    this.camera = camera ?? scene.cameras.main;
  }

  shake(intensity: number = 0.01, duration: number = 200): void {
    // Cancelar anterior
    this.cancel();

    this.baseIntensity = intensity;
    this.currentIntensity = intensity;
    this.duration = duration;
    this.elapsed = 0;
    this.isActive = true;

    // Crear tween de shake
    this.tween = this.scene.tweens.add({
      targets: this.camera,
      shakeX: { from: -intensity * 100, to: intensity * 100, duration: 50, yoyo: true, repeat: duration / 100 },
      shakeY: { from: -intensity * 50, to: intensity * 50, duration: 80, yoyo: true, repeat: duration / 160 },
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.isActive = false;
        this.camera.shakeX = 0;
        this.camera.shakeY = 0;
      },
    });
  }

  // Shake con decaimiento
  shakeDecay(intensity: number, duration: number): void {
    this.cancel();
    this.isActive = true;
    this.baseIntensity = intensity;
    this.duration = duration;
    this.elapsed = 0;

    // Decaimiento lineal
    const decay = intensity / (duration / 16);

    const shake = () => {
      if (!this.isActive) return;

      this.elapsed += 16;
      const currentIntensity = Math.max(0, this.baseIntensity - decay * (this.elapsed / 16));
      
      this.camera.shake(currentIntensity, 16);

      if (this.elapsed >= duration) {
        this.isActive = false;
      } else {
        requestAnimationFrame(shake);
      }
    };

    shake();
  }

  // Cancelar
  cancel(): void {
    if (this.tween) {
      this.tween.stop();
      this.tween = null;
    }
    this.isActive = false;
    this.camera.shakeX = 0;
    this.camera.shakeY = 0;
  }

  // Verificar si está activo
  getIsActive(): boolean {
    return this.isActive;
  }
}

// Helper para crear screen shake rápido
export function quickShake(scene: Phaser.Scene, level: number = ScreenShake.LEVELS.LIGHT): void {
  const shake = new ScreenShake(scene);
  shake.shake(level, 200);
}
