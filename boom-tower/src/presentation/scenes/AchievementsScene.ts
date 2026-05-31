import Phaser from 'phaser';
import { Logger } from '../../core/Logger';
import { AchievementSystem } from '../../domain/achievements/AchievementSystem';

export class AchievementsScene extends Phaser.Scene {
  constructor() { super({ key: 'achievements' }); }

  create(): void {
    const { width, height } = this.cameras.main;
    const cx = width / 2;
    Logger.ui('AchievementsScene create');
    this.createBackground(width, height);

    this.add.text(cx, 80, 'LOGROS', {
      fontSize: '48px',
      fontFamily: 'Arial Black',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 5,
    }).setOrigin(0.5);

    const achievements = AchievementSystem.getAll();
    let y = 160;

    for (const achievement of achievements.slice(0, 8)) {
      const completed = AchievementSystem.isCompleted(achievement.id);
      const color = completed ? '#44ff88' : '#888888';
      const prefix = completed ? 'OK ' : '-- ';

      this.add.text(cx, y, prefix + achievement.name, {
        fontSize: '24px',
        fontFamily: 'Arial Black',
        color,
        stroke: '#000000',
        strokeThickness: 3,
      }).setOrigin(0.5);

      this.add.text(cx, y + 28, achievement.description, {
        fontSize: '18px',
        fontFamily: 'Arial',
        color: '#aaaaaa',
      }).setOrigin(0.5);

      y += 75;
    }

    const backBtn = this.add.text(cx, height - 80, 'VOLVER', {
      fontSize: '36px',
      fontFamily: 'Arial Black',
      color: '#ff8844',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    backBtn.on('pointerdown', () => this.scene.start('menu'));
    backBtn.on('pointerover', () => backBtn.setScale(1.1));
    backBtn.on('pointerout',  () => backBtn.setScale(1));
    this.cameras.main.fadeIn(200);
  }

  private createBackground(width: number, height: number): void {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a0a1a, 0x0a0a1a, 0x1a1a2e, 0x1a1a2e, 1);
    bg.fillRect(0, 0, width, height);
  }
}
