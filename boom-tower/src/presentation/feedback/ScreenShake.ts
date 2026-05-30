import Phaser from 'phaser';
// ============================================
// SCREEN SHAKE — Efecto de sacudida de pantalla
// ============================================
export class ScreenShake {
  private scene: Phaser.Scene;
  private camera: Phaser.Cameras.Scene2D.Camera;
  private baseIntensity = 0;
  private duration = 0;
  private elapsed = 0;
  private isActive = false;
  private shakeTimer: number | null = null;
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
    this.cancel();
    this.baseIntensity = intensity;
    this.duration = duration;
    this.elapsed = 0;
    this.isActive = true;
    this.camera.shake(duration, intensity);
    this.shakeTimer = window.setTimeout(() => {
      this.isActive = false;
    }, duration);
  }
  // Shake con decaimiento
  shakeDecay(intensity: number, duration: number): void {
    this.cancel();
    this.isActive = true;
    this.baseIntensity = intensity;
    this.duration = duration;
    this.elapsed = 0;
    const decay = intensity / (duration / 16);
    const tick = () => {
      if (!this.isActive) return;
      this.elapsed += 16;
      const currentIntensity = Math.max(0, this.baseIntensity - decay * (this.elapsed / 16));
      this.camera.shake(16, currentIntensity);
      if (this.elapsed >= duration) {
        this.isActive = false;
      } else {
        this.shakeTimer = requestAnimationFrame(tick);
      }
    };
    tick();
  }
  // Cancelar
  cancel(): void {
    if (this.shakeTimer !== null) {
      clearTimeout(this.shakeTimer);
      cancelAnimationFrame(this.shakeTimer);
      this.shakeTimer = null;
    }
    this.isActive = false;
    this.camera.resetFX();
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
