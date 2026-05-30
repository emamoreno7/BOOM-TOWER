import Phaser from 'phaser';
import { EventBus } from '../../core/EventBus';
import { Logger } from '../../core/Logger';

export class UIManager {
  private scene: Phaser.Scene;
  private subscriptions: string[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.setupListeners();
    Logger.info('[UIManager] Initialized');
  }

  private setupListeners(): void {
    this.subscriptions.push(
      EventBus.on('game:over', () => this.onGameOver()),
      EventBus.on('game:start', () => this.onGameStart()),
      EventBus.on('game:pause', () => this.onPause()),
      EventBus.on('game:resume', () => this.onResume()),
    );
  }

  private onGameOver(): void {
    Logger.info('[UIManager] Game over');
  }

  private onGameStart(): void {
    Logger.info('[UIManager] Game start');
  }

  private onPause(): void {
    Logger.info('[UIManager] Paused');
  }

  private onResume(): void {
    Logger.info('[UIManager] Resumed');
  }

  showToast(message: string, duration = 2000, color = '#ffffff'): void {
    const { width, height } = this.scene.cameras.main;
    const text = this.scene.add.text(width / 2, height * 0.15, message, {
      fontSize: '24px', fontFamily: 'Arial',
      color, fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 4,
      backgroundColor: '#00000088',
      padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setDepth(40).setAlpha(0);

    this.scene.tweens.add({
      targets: text, alpha: 1, duration: 200,
      onComplete: () => {
        this.scene.time.delayedCall(duration, () => {
          this.scene.tweens.add({
            targets: text, alpha: 0, duration: 300,
            onComplete: () => text.destroy(),
          });
        });
      },
    });
  }

  showEventBanner(label: string, color = '#ff6600'): void {
    const { width, height } = this.scene.cameras.main;
    const text = this.scene.add.text(width / 2, height * 0.25, label, {
      fontSize: '36px', fontFamily: 'Arial',
      color, fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 6,
    }).setOrigin(0.5).setDepth(40).setAlpha(0).setScale(0.5);

    this.scene.tweens.add({
      targets: text,
      alpha: 1, scaleX: 1, scaleY: 1,
      duration: 300, ease: 'Back.easeOut',
      onComplete: () => {
        this.scene.time.delayedCall(1500, () => {
          this.scene.tweens.add({
            targets: text, alpha: 0, y: text.y - 40,
            duration: 400,
            onComplete: () => text.destroy(),
          });
        });
      },
    });
  }

  destroy(): void {
    for (const id of this.subscriptions) EventBus.off(id);
  }
}
