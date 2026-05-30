import Phaser from 'phaser';
import { Logger } from '../../core/Logger';

export class ScreenShake {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  play(intensity = 0.01, duration = 200): void {
    this.scene.cameras.main.shake(duration, intensity);
    Logger.debug(`[ScreenShake] intensity=${intensity} duration=${duration}`);
  }

  stop(): void {
    this.scene.cameras.main.shake(0, 0);
  }
}
