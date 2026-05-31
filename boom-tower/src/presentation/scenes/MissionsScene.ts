import Phaser from 'phaser';
import { Logger } from '../../core/Logger';
import { MissionSystem } from '../../domain/missions/MissionSystem';

// ============================================
// MISSIONS SCENE — Pantalla de misiones diarias
// ============================================

export class MissionsScene extends Phaser.Scene {
  constructor() { super({ key: 'missions' }); }

  create(): void {
    const { width, height } = this.cameras.main;
    const cx = width / 2;
    Logger.ui('MissionsScene create');

    this.createBackground(width, height);

    this.add.text(cx, 80, 'MISIONES', {
      fontSize: '48px',
      fontFamily: 'Arial Black',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 5,
    }).setOrigin(0.5);

    this.add.text(cx, 135, 'Misiones diarias', {
      fontSize: '22px',
      fontFamily: 'Arial',
      color: '#aaaaaa',
    }).setOrigin(0.5);

    const missions = MissionSystem.getMissions();
    let y = 200;

    for (const mission of missions) {
      const color = mission.completed ? '#44ff88' : '#ffffff';
      const progress = mission.completed
        ? 'COMPLETADA'
        : mission.current + ' / ' + mission.target;

      this.add.text(cx, y, mission.description, {
        fontSize: '24px',
        fontFamily: 'Arial Black',
        color,
        stroke: '#000000',
        strokeThickness: 3,
      }).setOrigin(0.5);

      this.add.text(cx, y + 30, progress, {
        fontSize: '20px',
        fontFamily: 'Arial',
        color: '#aaaaaa',
      }).setOrigin(0.5);

      const rewardText = 'Recompensa: ' + mission.reward.coins + ' coins' +
        (mission.reward.gems ? ' + ' + mission.reward.gems + ' gems' : '');

      this.add.text(cx, y + 55, rewardText, {
        fontSize: '18px',
        fontFamily: 'Arial',
        color: '#ffdd00',
      }).setOrigin(0.5);

      if (!mission.completed) {
        const barW = width * 0.6;
        const barX = cx - barW / 2;
        const ratio = Math.min(1, mission.current / mission.target);
        this.add.rectangle(barX + barW / 2, y + 80, barW, 12, 0x333333).setOrigin(0.5);
        if (ratio > 0) {
          this.add.rectangle(barX + (barW * ratio) / 2, y + 80, barW * ratio, 12, 0x44aaff).setOrigin(0.5);
        }
      }

      y += 120;
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
