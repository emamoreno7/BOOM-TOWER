import Phaser from 'phaser';
import { Logger } from '../../core/Logger';
import { EventBus } from '../../core/EventBus';
import { StateManager } from '../../application/state/StateManager';
import { GameController } from '../../application/GameController';
import { FeedbackManager } from '../feedback/FeedbackManager';

// ============================================
// MENU SCENE — Menú principal
// ============================================

export class MenuScene extends Phaser.Scene {
  private playButton: Phaser.GameObjects.Container | null = null;
  private titleText: Phaser.GameObjects.Text | null = null;
  private scoreText: Phaser.GameObjects.Text | null = null;
  private coinsText: Phaser.GameObjects.Text | null = null;
  private settingsButton: Phaser.GameObjects.Text | null = null;

  constructor() {
    super({ key: 'menu' });
  }

  create(): void {
    const { width, height } = this.cameras.main;

    Logger.game('Menu scene creating');

    // Fondo
    this.createBackground(width, height);

    // Título
    this.createTitle(width, height);

    // HUD superior
    this.createHUD(width, height);

    // Botón JUGAR
    this.createPlayButton(width, height);

    // Botón de ajustes (placeholder)
    this.createSettingsButton(width, height);

    // Partículas de fondo
    this.createBackgroundParticles(width, height);

    // Eventos
    this.setupEventListeners();

    // Entrance animation
    this.playEntranceAnimation();
  }

  private createBackground(width: number, height: number): void {
    // Gradiente oscuro
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a0a1a, 0x0a0a1a, 0x1a1a2e, 0x1a1a2e, 1);
    bg.fillRect(0, 0, width, height);
  }

  private createTitle(width: number, height: number): void {
    this.titleText = this.add.text(width / 2, height * 0.18, 'BOOM TOWER', {
      fontSize: '48px',
      fontFamily: 'Arial Black, Arial',
      color: '#ffd700',
      fontStyle: 'bold',
      stroke: '#ff6b35',
      strokeThickness: 6,
    });
    this.titleText.setOrigin(0.5);
    this.titleText.setAlpha(0);
  }

  private createHUD(width: number, height: number): void {
    const state = StateManager.get();
    const player = state.player;

    // Nivel
    const levelText = this.add.text(30, 30, `LV ${player.level}`, {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    levelText.setAlpha(0);

    // XP bar
    const xpBarBg = this.add.graphics();
    xpBarBg.fillStyle(0x333333, 1);
    xpBarBg.fillRect(30, 60, 200, 12);
    xpBarBg.setAlpha(0);

    const xpBar = this.add.graphics();
    xpBar.fillStyle(0xffd700, 1);
    xpBar.fillRect(30, 60, 200 * (player.xp / player.xpToNextLevel), 12);
    xpBar.setAlpha(0);

    // Coins
    this.coinsText = this.add.text(width - 30, 30, `${this.formatNumber(player.coins)}`, {
      fontSize: '22px',
      fontFamily: 'Arial',
      color: '#ffd700',
      fontStyle: 'bold',
    });
    this.coinsText.setOrigin(1, 0);
    this.coinsText.setAlpha(0);

    // Score máximo
    this.scoreText = this.add.text(width / 2, 30, `BEST: ${this.formatNumber(state.game.score)}`, {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#888888',
    });
    this.scoreText.setOrigin(0.5, 0);
    this.scoreText.setAlpha(0);

    // Guardar referencias para animaciones
    this.titleText.setData('levelText', levelText);
    this.titleText.setData('xpBarBg', xpBarBg);
    this.titleText.setData('xpBar', xpBar);
  }

  private createPlayButton(width: number, height: number): void {
    // Container para el botón
    this.playButton = this.add.container(width / 2, height * 0.55);

    // Fondo del botón
    const buttonBg = this.add.graphics();
    buttonBg.fillStyle(0xffd700, 1);
    buttonBg.fillRoundedRect(-150, -50, 300, 100, 20);
    buttonBg.fillStyle(0xff6b35, 1);
    buttonBg.fillRoundedRect(-145, -45, 290, 90, 16);

    // Texto del botón
    const buttonText = this.add.text(0, 0, '▶  PLAY', {
      fontSize: '36px',
      fontFamily: 'Arial Black, Arial',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    buttonText.setOrigin(0.5);

    this.playButton.add([buttonBg, buttonText]);
    this.playButton.setAlpha(0);
    this.playButton.setScale(0.5);

    // Interactividad
    this.playButton.setSize(300, 100);
    this.playButton.setInteractive({ useHandCursor: true });

    this.playButton.on('pointerover', () => {
      this.tweens.add({
        targets: this.playButton,
        scale: 1.08,
        duration: 150,
        ease: 'Back.easeOut',
      });
    });

    this.playButton.on('pointerout', () => {
      this.tweens.add({
        targets: this.playButton,
        scale: 1,
        duration: 150,
        ease: 'Power2',
      });
    });

    this.playButton.on('pointerdown', () => {
      FeedbackManager.haptic('medium');
      this.startGame();
    });
  }

  private createSettingsButton(width: number, height: number): void {
    this.settingsButton = this.add.text(width - 30, height - 50, '⚙️', {
      fontSize: '32px',
      fontFamily: 'Arial',
      color: '#666666',
    });
    this.settingsButton.setOrigin(0.5);
    this.settingsButton.setAlpha(0);
    this.settingsButton.setInteractive({ useHandCursor: true });

    this.settingsButton.on('pointerover', () => {
      this.settingsButton!.setColor('#ffffff');
    });

    this.settingsButton.on('pointerout', () => {
      this.settingsButton!.setColor('#666666');
    });

    this.settingsButton.on('pointerdown', () => {
      this.openSettings();
    });
  }

  private createBackgroundParticles(width: number, height: number): void {
    // Estrellas decorativas simples
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
    EventBus.on('level:up', () => {
      this.updateHUD();
    });

    EventBus.on('coins:awarded', () => {
      this.updateHUD();
    });
  }

  private playEntranceAnimation(): void {
    // Título
    this.tweens.add({
      targets: this.titleText,
      alpha: 1,
      duration: 600,
      delay: 200,
      ease: 'Power2',
    });

    // HUD items
    const hudItems = [
      this.titleText.getData('levelText'),
      this.titleText.getData('xpBarBg'),
      this.titleText.getData('xpBar'),
      this.coinsText,
      this.scoreText,
    ];

    hudItems.forEach((item, index) => {
      if (item) {
        this.tweens.add({
          targets: item,
          alpha: 1,
          duration: 400,
          delay: 300 + index * 100,
          ease: 'Power2',
        });
      }
    });

    // Botón JUGAR
    this.tweens.add({
      targets: this.playButton,
      alpha: 1,
      scale: 1,
      duration: 800,
      delay: 500,
      ease: 'Back.easeOut',
    });

    // Settings
    this.tweens.add({
      targets: this.settingsButton,
      alpha: 1,
      duration: 400,
      delay: 800,
      ease: 'Power2',
    });

    // Pulso en el botón
    this.time.delayedCall(1500, () => {
      this.tweens.add({
        targets: this.playButton,
        scale: 1.05,
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    });
  }

  private startGame(): void {
    // Feedback
    FeedbackManager.shake(0.01, 150);
    
    // Transición
    this.cameras.main.fadeOut(300, 26, 26, 46);

    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('game');
    });
  }

  private openSettings(): void {
    Logger.ui('[Menu] Settings clicked');
    // Placeholder - en fases futuras mostrar modal de settings
    FeedbackManager.haptic('light');
  }

  private updateHUD(): void {
    const state = StateManager.get();
    const player = state.player;

    if (this.coinsText) {
      this.coinsText.setText(`${this.formatNumber(player.coins)}`);
    }

    if (this.scoreText) {
      this.scoreText.setText(`BEST: ${this.formatNumber(state.game.score)}`);
    }
  }

  private formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  update(): void {
    // Update logic si es necesario
  }
}