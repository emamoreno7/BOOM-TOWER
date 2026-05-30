import Phaser from 'phaser';
import { EventBus } from '../../core/EventBus';

export class ComboTextOverlay {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private text: Phaser.GameObjects.Text;
  private subscriptions: string[] = [];
  private hideTimer: Phaser.Time.TimerEvent | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const { width, height } = scene.cameras.main;

    this.text = scene.add.text(0, 0, '', {
      fontSize: '48px', fontFamily: 'Arial',
      color: '#ffd700', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 6,
    }).setOrigin(0.5);

    this.container = scene.add.container(width / 2, height * 0.35, [this.text]);
    this.container.setDepth(30).setAlpha(0);

    this.setupListeners();
  }

  private setupListeners(): void {
    this.subscriptions.push(
      EventBus.on('combo:increased', (p: { level: number }) => {
        if (p.level >= 5) this.show(p.level);
      }),
      EventBus.on('combo:reset', () => this.hide()),
    );
  }

  show(combo: number): void {
    const label = combo >= 50 ? ' INSANE!' : combo >= 25 ? ' EPIC!' : combo >= 10 ? ' GREAT!' : `COMBO x${combo}`;
    const color = combo >= 25 ? '#ff4444' : combo >= 10 ? '#ffaa00' : '#ffd700';

    this.text.setText(label).setColor(color);
    this.container.setAlpha(1).setScale(0.5);

    this.scene.tweens.add({
      targets: this.container,
      scaleX: 1, scaleY: 1,
      duration: 200, ease: 'Back.easeOut',
    });

    if (this.hideTimer) this.hideTimer.remove();
    this.hideTimer = this.scene.time.delayedCall(1500, () => this.hide());
  }

  hide(): void {
    this.scene.tweens.add({
      targets: this.container,
      alpha: 0, duration: 300,
    });
  }

  destroy(): void {
    for (const id of this.subscriptions) EventBus.off(id);
    this.container.destroy();
  }
}
