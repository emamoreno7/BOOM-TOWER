import Phaser from 'phaser';
import { EventBus } from '../../../core/EventBus';

export class AchievementToast {
  private scene: Phaser.Scene;
  private queue: { title: string; desc: string }[] = [];
  private isShowing = false;
  private subscriptions: string[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.setupListeners();
  }

  private setupListeners(): void {
    this.subscriptions.push(
      EventBus.on('achievement:unlocked', (p: { title: string; desc: string }) => {
        this.enqueue(p.title, p.desc);
      }),
    );
  }

  enqueue(title: string, desc: string): void {
    this.queue.push({ title, desc });
    if (!this.isShowing) this.showNext();
  }

  private showNext(): void {
    if (this.queue.length === 0) { this.isShowing = false; return; }
    this.isShowing = true;
    const { title, desc } = this.queue.shift()!;
    this.show(title, desc);
  }

  private show(title: string, desc: string): void {
    const { width } = this.scene.cameras.main;

    const bg = this.scene.add.rectangle(width / 2, -60, width * 0.9, 70, 0x1a1a2e, 0.95)
      .setStrokeStyle(2, 0xffd700).setDepth(70);

    const titleText = this.scene.add.text(width / 2 - width * 0.35, -60, `🏆 ${title}`, {
      fontSize: '18px', fontFamily: 'Arial',
      color: '#ffd700', fontStyle: 'bold',
    }).setOrigin(0, 0.5).setDepth(71);

    const descText = this.scene.add.text(width / 2 - width * 0.35, -40, desc, {
      fontSize: '13px', fontFamily: 'Arial', color: '#aaaaaa',
    }).setOrigin(0, 0.5).setDepth(71);

    // Slide in
    this.scene.tweens.add({
      targets: [bg, titleText, descText],
      y: '+=90', duration: 400, ease: 'Power2',
      onComplete: () => {
        this.scene.time.delayedCall(2500, () => {
          this.scene.tweens.add({
            targets: [bg, titleText, descText],
            y: '-=90', alpha: 0, duration: 300,
            onComplete: () => {
              bg.destroy(); titleText.destroy();descText.destroy();
              this.showNext();
            },
          });
        });
      },
    });
  }

  destroy(): void {
    for (const id of this.subscriptions) EventBus.off(id);
  }
}
