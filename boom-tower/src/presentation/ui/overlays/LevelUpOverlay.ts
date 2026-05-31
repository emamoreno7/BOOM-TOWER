import Phaser from 'phaser';
import { EventBus } from '../../../core/EventBus';

export class LevelUpOverlay {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private levelText: Phaser.GameObjects.Text;
  private subscriptions: string[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const { width, height } = scene.cameras.main;

    const bg = scene.add.rectangle(0, 0, width, height, 0x000000, 0.7);

    const panel = scene.add.rectangle(0, 0, width * 0.8, 300, 0x1a1a2e, 1)
      .setStrokeStyle(3, 0xffd700);

    const title = scene.add.text(0, -80, 'LEVEL UP!', {
      fontSize: '48px', fontFamily: 'Arial',
      color: '#ffd700', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 6,
    }).setOrigin(0.5);

    this.levelText = scene.add.text(0, 0, 'LEVEL 2', {
      fontSize: '36px', fontFamily: 'Arial',
      color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);

    const continueBtn = scene.add.text(0, 80, '[ CONTINUE ]', {
      fontSize: '24px', fontFamily: 'Arial', color: '#ffd700',
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.hide())
      .on('pointerover', function(this: Phaser.GameObjects.Text) { this.setColor('#ffffff'); })
      .on('pointerout', function(this: Phaser.GameObjects.Text) { this.setColor('#ffd700'); });

    this.container = scene.add.container(width / 2, height / 2, [
      bg, panel, title, this.levelText, continueBtn,
    ]).setDepth(65).setVisible(false);

    this.setupListeners();
  }

  private setupListeners(): void {
    this.subscriptions.push(
      EventBus.on('player:level_up', (p: { level: number }) => this.show(p.level)),
    );
  }

  show(level: number): void {
    this.levelText.setText(`LEVEL ${level}`);
    this.container.setVisible(true).setAlpha(0).setScale(0.8);
    this.scene.tweens.add({
      targets: this.container,
      alpha: 1, scaleX: 1, scaleY: 1,
      duration: 400, ease: 'Back.easeOut',
    });
  }

  hide(): void {
    this.scene.tweens.add({
      targets: this.container, alpha: 0, scaleX: 0.8, scaleY: 0.8,
      duration: 300,
      onComplete: () => this.container.setVisible(false),
    });
  }

  destroy(): void {
    for (const id of this.subscriptions) EventBus.off(id);
    this.container.destroy();
  }
}
