import Phaser from 'phaser';
import { EventBus } from '../../core/EventBus';
import { GameController } from '../../application/GameController';

export class PauseOverlay {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private visible = false;
  private subscriptions: string[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const { width, height } = scene.cameras.main;

    const bg = scene.add.rectangle(0, 0, width, height, 0x000000, 0.7);

    const title = scene.add.text(0, -80, 'PAUSED', {
      fontSize: '48px', fontFamily: 'Arial',
      color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);

    const resumeBtn = scene.add.text(0, 20, '[ RESUME ]', {
      fontSize: '28px', fontFamily: 'Arial', color: '#ffd700',
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => EventBus.emit('game:resume', {}))
      .on('pointerover', function(this: Phaser.GameObjects.Text) { this.setColor('#ffffff'); })
      .on('pointerout', function(this: Phaser.GameObjects.Text) { this.setColor('#ffd700'); });

    const restartBtn = scene.add.text(0, 80, '[ RESTART ]', {
      fontSize: '22px', fontFamily: 'Arial', color: '#888888',
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => EventBus.emit('game:restart', {}))
      .on('pointerover', function(this: Phaser.GameObjects.Text) { this.setColor('#ffffff'); })
      .on('pointerout', function(this: Phaser.GameObjects.Text) { this.setColor('#888888'); });

    this.container = scene.add.container(width / 2, height / 2, [
      bg, title, resumeBtn, restartBtn,
    ]).setDepth(50).setVisible(false);

    this.setupListeners();
  }

  private setupListeners(): void {
    this.subscriptions.push(
      EventBus.on('input:pause', () => this.toggle()),
      EventBus.on('game:resume', () => {
        this.hide();
        GameController.resumeGame();
      }),
      EventBus.on('game:restart', () => this.hide()),
    );
  }

  toggle(): void {
    this.visible ? this.hide() : this.show();
  }

  show(): void {
    this.visible = true;
    this.container.setVisible(true).setAlpha(0);
    this.scene.tweens.add({
      targets: this.container,
      alpha: 1, duration: 200,
    });
    GameController.pauseGame();
  }

  hide(): void {
    this.visible = false;
    this.scene.tweens.add({
      targets: this.container,
      alpha: 0, duration: 200,
      onComplete: () => this.container.setVisible(false),
    });
  }

  destroy(): void {
    for (const id of this.subscriptions) EventBus.off(id);
    this.container.destroy();
  }
}
