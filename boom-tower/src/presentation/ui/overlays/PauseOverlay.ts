import Phaser from 'phaser';
import { Logger } from '../../../core/Logger';
import { EventBus } from '../../../core/EventBus';

export class PauseOverlay {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private isVisible = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0);
    this.container.setDepth(500);
    this.container.setAlpha(0);
    this.build();
    Logger.ui('[PauseOverlay] Initialized');
  }

  private build(): void {
    const { width, height } = this.scene.cameras.main;
    const cx = width / 2;
    const cy = height / 2;

    const bg = this.scene.add.rectangle(cx, cy, width, height, 0x000000, 0.7);

    const title = this.scene.add.text(cx, cy - 150, 'PAUSED', {
      fontSize: '72px',
      fontFamily: 'Arial Black, Arial',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5);

    const resumeBtn = this.scene.add.text(cx, cy + 20, 'CONTINUAR', {
      fontSize: '40px',
      fontFamily: 'Arial Black, Arial',
      color: '#44ff44',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    resumeBtn.on('pointerdown', () => EventBus.emit('game:resume', {}));
    resumeBtn.on('pointerover', () => resumeBtn.setScale(1.1));
    resumeBtn.on('pointerout',  () => resumeBtn.setScale(1));

    const menuBtn = this.scene.add.text(cx, cy + 120, 'MENU', {
      fontSize: '36px',
      fontFamily: 'Arial Black, Arial',
      color: '#ff8844',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    menuBtn.on('pointerdown', () => EventBus.emit('scene:goto', { scene: 'menu' }));
    menuBtn.on('pointerover', () => menuBtn.setScale(1.1));
    menuBtn.on('pointerout',  () => menuBtn.setScale(1));

    this.container.add([bg, title, resumeBtn, menuBtn]);
  }

  show(): void {
    if (this.isVisible) return;
    this.isVisible = true;
    this.scene.tweens.add({ targets: this.container, alpha: 1, duration: 200, ease: 'Power2' });
  }

  hide(): void {
    if (!this.isVisible) return;
    this.isVisible = false;
    this.scene.tweens.add({ targets: this.container, alpha: 0, duration: 200, ease: 'Power2' });
  }

  toggle(): void { this.isVisible ? this.hide() : this.show(); }
  getIsVisible(): boolean { return this.isVisible; }
  destroy(): void { this.container.destroy(); }
}
