import Phaser from 'phaser';
import { EventBus } from '../../core/EventBus';
import { Logger } from '../../core/Logger';

// ============================================
// COMBO TEXT OVERLAY — Overlay de combo en pantalla
// ==========================================

export class ComboTextOverlay {
  private scene: Phaser.Scene;
  private comboText: Phaser.GameObjects.Text;
  private multiplierText: Phaser.GameObjects.Text;
  private hideTimer: Phaser.Time.TimerEvent | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    const cx = scene.cameras.main.width / 2;

    this.comboText = scene.add.text(cx, 200, '', {
      fontSize: '64px',
      fontFamily: 'Arial Black, Arial',
      color: '#ffdd00',
      stroke: '#000000',
      strokeThickness: 6,
      align: 'center',
    }).setOrigin(0.5).setDepth(150).setAlpha(0);

    this.multiplierText = scene.add.text(cx, 270, '', {
      fontSize: '36px',
      fontFamily: 'Arial Black, Arial',
      color: '#ff8800',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center',
    }).setOrigin(0.5).setDepth(150).setAlpha(0);

    this.setupListeners();
    Logger.ui('[ComboTextOverlay] Initialized');
  }

  private setupListeners(): void {
    EventBus.on('combo:hit', (data: { level: number; multiplier: number }) => {
      if (data.level < 2) return;
      this.show(data.level, data.multiplier);
    });

    EventBus.on('combo:reset', () => {
      this.hide();
    });
  }

  private show(level: number, multiplier: number): void {
    const labels = ['', '', 'COMBO x2', 'COMBO x3', 'COMBO x4', 'COMBO x5', 'MAX COMBO!'];
    const label = labels[Math.min(level, labels.length - 1)] ?? ('COMBO x' + level);

    this.comboText.setText(label);
    this.multiplierText.setText(multiplier > 1 ? ('x' + multiplier + ' pts') : '');

    this.scene.tweens.add({
      targets: [this.comboText, this.multiplierText],
      alpha: 1,
      scaleX: { from: 1.3, to: 1 },
      scaleY: { from: 1.3, to: 1 },
      duration: 200,
      ease: 'Back.easeOut',
    });

    if (this.hideTimer) this.hideTimer.remove();
    this.hideTimer = this.scene.time.addEvent({
      delay: 1500,
      callback: this.hide,
      callbackScope: this,
    });
  }

  private hide(): void {
    this.scene.tweens.add({
      targets: [this.comboText, this.multiplierText],
      alpha: 0,
      duration: 300,
      ease: 'Power2',
    });
  }

  destroy(): void {
    this.comboText.destroy();
    this.multiplierText.destroy();
  }
}
