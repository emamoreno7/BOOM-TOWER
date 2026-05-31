import Phaser from 'phaser';
import { Logger } from '../../core/Logger';
import { EventBus } from '../../core/EventBus';
import { LevelSystem } from '../../domain/leveling/LevelSystem';
import { EconomySystem } from '../../domain/economy/EconomySystem';
import { AchievementSystem } from '../../domain/achievements/AchievementSystem';

// ============================================
// PROFILE SCENE — Perfil del jugador
// ============================================

export class ProfileScene extends Phaser.Scene {
  constructor() { super({ key: 'profile' }); }

  create(): void {
    const { width, height } = this.cameras.main;
    const cx = width / 2;
    Logger.ui('ProfileScene create');

    this.createBackground(width, height);

    const levelState = LevelSystem.getState();
    const wallet = EconomySystem.getWallet();

    // Titulo
    this.add.text(cx, 80, 'PERFIL', {
      fontSize: '48px', fontFamily: 'Arial Black', color: '#ffffff',
    stroke: '#000000', strokeThickness: 5,
    }).setOrigin(0.5);

    // Nivel
    this.add.text(cx, 160, 'Nivel ' + levelState.level, {
      fontSize: '36px', fontFamily: 'Arial Black', color: '#ffdd00',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5);

    // Barra XP
    const barW = width * 0.7;
    const barX = cx - barW / 2;
    const barY = 200;
    this.add.rectangle(barX + barW / 2, barY, barW, 20, 0x333333).setOrigin(0.5);
    const progress = LevelSystem.getProgress();
    this.add.rectangle(barX + (barW * progress) / 2, barY, barW * progress, 20, 0x44aaff).setOrigin(0.5);
    this.add.text(cx, 220, levelState.xpInLevel + ' / ' + levelState.xpForNext + ' XP', {
      fontSize: '20px', fontFamily: 'Arial', color: '#aaaaaa',
    }).setOrigin(0.5);

    // Monedas y gemas
    this.add.text(cx, 280, 'Monedas: ' + wallet.getCoins(), {
      fontSize: '28px', fontFamily: 'Arial Black', color: '#ffdd00',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5);

    this.add.text(cx, 330, 'Gemas: ' + wallet.getGems(), {
      fontSize: '28px', fontFamily: 'Arial Black', color: '#88eeff',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5);

    // Logros completados
    const completed = AchievementSystem.getCompleted().length;
    const total = AchievementSystem.getAll().length;
    this.add.text(cx, 390, 'Logros: ' + completed + ' / ' + total, {
      fontSize: '24px', fontFamily: 'Arial', color: '#ffffff',
    }).setOrigin(0.5);

    // Boton volver
    const backBtn = this.add.text(cx, height - 80, 'VOLVER', {
      fontSize: '36px', fontFamily: 'Arial Black', color: '#ff8844',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    backBtn.on('pointerdown', () => {
      EventBus.emit('scene:goto', { scene: 'menu' });
      this.scene.start('menu');
    });
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
