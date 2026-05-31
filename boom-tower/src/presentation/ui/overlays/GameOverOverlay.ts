import Phaser from 'phaser';
import { EventBus } from '../../../core/EventBus';
import { StateManager } from '../../../application/state/StateManager';

export class GameOverOverlay {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private scoreText: Phaser.GameObjects.Text;
  private bestText: Phaser.GameObjects.Text;
  private subscriptions: string[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const { width, height } = scene.cameras.main;

    const bg = scene.add.rectangle(0, 0, width, height, 0x000000, 0.8);

    const panel = scene.add.rectangle(0, 0, width * 0.85, 420, 0x1a1a2e, 1)
      .setStrokeStyle(2, 0xff4444);

    const title = scene.add.text(0, -150, 'GAME OVER', {
      fontSize: '42px', fontFamily: 'Arial',
      color: '#ff4444', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 5,
    }).setOrigin(0.5);

    this.scoreText = scene.add.text(0, -70, 'SCORE: 0', {
      fontSize: '28px', fontFamily: 'Arial', color: '#ffffff',
    }).setOrigin(0.5);

    this.bestText = scene.add.text(0, -30, 'BEST: 0', {
      fontSize: '20px', fontFamily: 'Arial', color: '#ffd700',
    }).setOrigin(0.5);

    const restartBtn = scene.add.text(0, 60, '[ PLAY AGAIN ]', {
      fontSize: '28px', fontFamily: 'Arial',
      color: '#ffd700', fontStyle: 'bold',
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => EventBus.emit('game:restart', {}))
      .on('pointerover', function(this: Phaser.GameObjects.Text) { this.setColor('#ffffff'); })
      .on('pointerout', function(this: Phaser.GameObjects.Text) { this.setColor('#ffd700'); });

    const menuBtn = scene.add.text(0, 130, '[ MAIN MENU ]', {
      fontSize: '20px', fontFamily: 'Arial', color: '#888888',
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => EventBus.emit('scene:goto', { key: 'menu' }))
      .on('pointerover', function(this: Phaser.GameObjects.Text) { this.setColor('#ffffff'); })
      .on('pointerout', function(this: Phaser.GameObjects.Text) { this.setColor('#888888'); });

    this.container = scene.add.container(width / 2, height / 2, [
      bg, panel, title, this.scoreText, this.bestText, restartBtn, menuBtn,
    ]).setDepth(60).setVisible(false);

    this.setupListeners();
  }

  private setupListeners(): void {
    this.subscriptions.push(
      EventBus.on('game:over', (p: { score: number }) => this.show(p.score)),
      EventBus.on('game:restart', () => this.hide()),
    );
  }

  show(score: number): void {
    const best = StateManager.getGame().maxDepth ?? 0;
    this.scoreText.setText(`SCORE: ${score.toLocaleString()}`);
    this.bestText.setText(`BEST: ${best.toLocaleString()}`);
    this.container.setVisible(true).setAlpha(0);
    this.scene.tweens.add({
      targets: this.container, alpha: 1, duration: 400, ease: 'Power2',
    });
  }

  hide(): void {
    this.scene.tweens.add({
      targets: this.container, alpha: 0, duration: 200,
      onComplete: () => this.container.setVisible(false),
    });
  }

  destroy(): void {
    for (const id of this.subscriptions) EventBus.off(id);
    this.container.destroy();
  }
}
