import Phaser from 'phaser';
import { Logger } from '../../core/Logger';
import { EventBus } from '../../core/EventBus';
import { StateManager } from '../../application/state/StateManager';
import { FeedbackManager } from '../feedback/FeedbackManager';

// ============================================
// MENU SCENE — Menú principal
// ============================================

export class MenuScene extends Phaser.Scene {
  private playButton: Phaser.GameObjects.Container | null = null;
  private titleText: Phaser.GameObjects.Text | null = null;
  private scoreText: Phaser.GameObjects.Text | null = null;
  private coinsText: Phaser.GameObjects.Text | null = null;
  private navButtons: Phaser.GameObjects.Container[] = [];

  constructor() {
    super({ key: 'menu' });
  }

  create(): void {
    const { width, height } = this.cameras.main;
    Logger.game('Menu scene creating');

    this.createBackground(width, height);
    this.createTitle(width, height);
    this.createHUD(width, height);
    this.createPlayButton(width, height);
    this.createNavButtons(width, height);
    this.createBackgroundParticles(width, height);
    this.setupEventListeners();
    this.playEntranceAnimation();
  }

  private createBackground(width: number, height: number): void {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a0a1a, 0x0a0a1a, 0x1a1a2e, 0x1a1a2e, 1);
    bg.fillRect(0, 0, width, height);
  }

  private createTitle(width: number, height: number): void {
    this.titleText = this.add.text(width / 2, height * 0.15, 'BOOM TOWER', {
      fontSize: '48px',
      fontFamily: 'Arial Black, Arial',
      color: '#ffd700',
      fontStyle: 'bold',
      stroke: '#ff6b35',
      strokeThickness: 6,
    }).setOrigin(0.5).setAlpha(0);
  }

  private createHUD(width: number, height: number): void {
    const state = StateManager.get();
    const player = state.player;

    const levelText = this.add.text(30, 30, `LV ${player.level}`, {
      fontSize: '20px', fontFamily: 'Arial',
      color: '#ffffff', fontStyle: 'bold',
    }).setAlpha(0);

    const xpBarBg = this.add.graphics().setAlpha(0);
    xpBarBg.fillStyle(0x333333, 1);
    xpBarBg.fillRect(30, 60, 200, 12);

    const xpBar = this.add.graphics().setAlpha(0);
    xpBar.fillStyle(0xffd700, 1);
    xpBar.fillRect(30, 60, 200 * (player.xp / Math.max(1, player.xpToNextLevel)), 12);

    this.coinsText = this.add.text(width - 30, 30, `🪙 ${this.formatNumber(player.coins)}`, {
      fontSize: '22px', fontFamily: 'Arial',
      color: '#ffd700', fontStyle: 'bold',
    }).setOrigin(1, 0).setAlpha(0);

    this.scoreText = this.add.text(width / 2, 30, `BEST: ${this.formatNumber(state.game.score)}`, {
      fontSize: '18px', fontFamily: 'Arial', color: '#888888',
    }).setOrigin(0.5, 0).setAlpha(0);

    this.titleText!.setData('levelText', levelText);
    this.titleText!.setData('xpBarBg', xpBarBg);
    this.titleText!.setData('xpBar', xpBar);
  }

  private createPlayButton(width: number, height: number): void {
    this.playButton = this.add.container(width / 2, height * 0.48);

    const buttonBg = this.add.graphics();
    buttonBg.fillStyle(0xffd700, 1);
    buttonBg.fillRoundedRect(-150, -50, 300, 100, 20);
    buttonBg.fillStyle(0xff6b35, 1);
    buttonBg.fillRoundedRect(-145, -45, 290, 90, 16);

    const buttonText = this.add.text(0, 0, '▶  PLAY', {
      fontSize: '36px', fontFamily: 'Arial Black, Arial',
      color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.playButton.add([buttonBg, buttonText]);
    this.playButton.setAlpha(0).setScale(0.5);
    this.playButton.setSize(300, 100);
    this.playButton.setInteractive({ useHandCursor: true });

    this.playButton.on('pointerover', () => {
      this.tweens.add({ targets: this.playButton, scale: 1.08, duration: 150, ease: 'Back.easeOut' });
    });
    this.playButton.on('pointerout', () => {
      this.tweens.add({ targets: this.playButton, scale: 1, duration: 150, ease: 'Power2' });
    });
    this.playButton.on('pointerdn', () => {
      FeedbackManager.haptic('medium');
      this.startGame();
    });
  }

  private createNavButtons(width: number, height: number): void {
    const buttons = [
      { label: '🏪 SHOP',         scene: 'shop',         color: 0x4488ff },
      { label: '📦 CHESTS',       scene: 'chests',       color: 0xaa44ff },
      { label: '👤 PROFILE',      scene: 'profile',      color: 0x44cc88 },
      { label: '📋 MISSIONS',     scene: 'missions',     color: 0xff8844 },
      { label: '🏆 ACHIEVEMENTS', scene: 'achievements', color: 0xffd700 },
    ];

    const btnW = width * 0.42;
    const btnH = 55;
    const startY = height * 0.63;
    const gap = 65;

    buttons.forEach((btn, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = col === 0 ? width * 0.27 : width * 0.73;
      const y = startY + row * gap;

      // Último botón centrado si es impar
      const finalX = (buttons.length % 2 !== 0 && i === buttons.length - 1)
        ? width / 2 : x;

   const container = this.add.container(finalX, y);

      const bg = this.add.graphics();
      bg.fillStyle(btn.color, 0.2);
      bg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 12);
      bg.lineStyle(2, btn.color, 0.8);
      bg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 12);

      const text = this.add.text(0, 0, btn.label, {
        fontSize: '18px', fontFamily: 'Arial',
        color: '#ffffff', fontStyle: 'bold',
      }).setOrigin(0.5);

      container.add([bg, text]);
      container.setAlpha(0);
      container.setSize(btnW, btnH);
      container.setInteractive({ useHandCursor: true });

      container.on('pointerover', () => {
        this.tweens.add({ targets: container, scale: 1.05, duration: 100 });
        bg.clear();
        bg.fillStyle(btn.color, 0.4);
        bg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 12);
        bg.lineStyle(2, btn.color, 1);
        bg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 12);
      });

      container.on('pointerout', () => {
        this.tweens.add({ targets: container, scale: 1, duration: 100 });
        bg.clear();
        bg.fillStyle(btn.color, 0.2);
        bg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 12);
        bg.lineStyle(2, btn.color, 0.8);
        bg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 12);
      });

      container.on('pointerdown', () => {
        FeedbackManager.haptic('light');
        this.navigateTo(btn.scene);
      });

      this.navButtons.push(container);
    });
  }

  private createBackgroundParticles(width: number, height: number): void {
    const graphics = this.add.graphics();
    for (let i = 0; i < 50; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const size = Phaser.Math.Between(1, 3);
      const alpha = Phaser.Math.FloatBetween(0.2, 0.6);
      graphics.fillStyle(0xffffff, alpha);
      graphics.fillCircle(x, y, size);
    }
  }

  private setupEventListeners(): void {
    EventBus.on('level:up', () => this.updateHUD());
    EventBus.on('coins:awarded', () => this.updateHUD());
    EventBus.on('scene:goto', (p: { key: string }) => this.navigateTo(p.key));
  }

  private playEntranceAnimation(): void {
    this.tweens.add({
      targets: this.titleText, alpha: 1,
      duration: 600, delay: 200, ease: 'Power2',
    });

    const hudItems = [
      this.titleText!.getData('levelText'),
      this.titleText!.getData('xpBarBg'),
      this.titleText!.getData('xpBar'),
      this.coinsText,
      this.scoreText,
    ];

    hudItems.forEach((item, i) => {
      if (item) {
        this.tweens.add({
          targets: item, alpha: 1,
          duration: 400, delay: 300 + i * 100, ease: 'Power2',
        });
      }
    });

    this.tweens.add({
      targets: this.playButton, alpha: 1, scale: 1,
      duration: 800, delay: 500, ease: 'Back.easeOut',
    });

    this.navButtons.forEach((btn, i) => {
      this.tweens.add({
        targets: btn, alpha: 1,
        duration: 400, delay: 700 + i * 80, ease: 'Power2',
      });
    });

    this.time.delayedCall(1500, () => {
      this.tweens.add({
        targets: this.playButton, scale: 1.05,
        duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    });
  }

  private startGame(): void {
    FeedbackManager.shake(0.01, 150);
    this.cameras.main.fadeOut(300, 26, 26, 46);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('game');
    });
  }

  private navigateTo(sceneKey: string): void {
    Logger.ui(`[Menu] Navigating to: ${sceneKey}`);
    this.cameras.main.fadeOut(200, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(sceneKey);
    });
  }

  private updateHUD(): void {
    const state = StateManager.get();
    const player = state.player;
    this.coinsText?.setText(`🪙 ${this.formatNumber(player.coins)}`);
    this.scoreText?.setText(`BEST: ${this.formatNumber(state.game.score)}`);
  }

  private formatNumber(num: number): string {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  }

  update(): void {}
}
