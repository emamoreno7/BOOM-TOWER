import Phaser from 'phaser';
import { EventBus } from '../../core/EventBus';
import { StateManager } from '../../application/state/StateManager';

// ============================================
// HUD — Interfaz de usuario durante el juego
// ============================================

export class HUD {
  private scene: Phaser.Scene;
  private scoreText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private depthText!: Phaser.GameObjects.Text;
  private pauseButton!: Phaser.GameObjects.Text;
  private gameOverPanel!: Phaser.GameObjects.Container;
  private subscriptions: string[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  create(): void {
    const { width, height } = this.scene.cameras.main;
    this.createScoreText();
    this.createComboText();
    this.createDepthText();
    this.createPauseButton(width);
    this.createGameOverPanel(width, height);
    this.setupListeners();
  }

  private createScoreText(): void {
    this.scoreText = this.scene.add.text(20, 20, 'SCORE: 0', {
      fontSize: '28px', fontFamily: 'Arial',
      color: '#ffffff', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 4,
    }).setDepth(20);
  }

  private createComboText(): void {
    this.comboText = this.scene.add.text(20, 60, '', {
      fontSize: '22px', fontFamily: 'Arial',
      color: '#ffd700',
      stroke: '#000000', strokeThickness: 3,
    }).setDepth(20);
  }

  private createDepthText(): void {
    this.depthText = this.scene.add.text(20, 95, 'DEPTH: 0', {
      fontSize: '16px', fontFamily: 'Arial',
      color: '#888888',
    }).setDepth(20);
  }

  private createPauseButton(width: number): void {
    this.pauseButton = this.scene.add.text(width - 20, 20, '⏸', {
      fontSize: '32px', fontFamily: 'Arial',
    })
      .setOrigin(1, 0)
      .setDepth(20)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => EventBus.emit('input:pause', {}));
  }

  private createGameOverPanel(width: number, height: number): void {
    const bg = this.scene.add.rectangle(0, 0, width * 0.8, 280, 0x000000, 0.85)
      .setStrokeStyle(2, 0xffffff, 0.3);

    const title = this.scene.add.text(0, -90, 'GAME OVER', {
      fontSize: '36px', fontFamily: 'Arial',
      color: '#ff4444', fontStyle: 'bold',
    }).setOrigin(0.5);

    const scoreLabel = this.scene.add.text(0, -30, 'SCORE: 0', {
      fontSize: '24px', fontFamily: 'Arial', color: '#ffffff',
    }).setOrigin(0.5);

    const restartBtn = this.scene.add.text(0, 40, '[ RESTART ]', {
      fontSize: '26px', fontFamily: 'Arial', color: '#ffd700',
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => EventBus.emit('game:restart', {}))
      .on('pointerover', function(this: Phaser.GameObjects.Text) { this.setColor('#ffffff'); })
      .on('pointerout', function(this: Phaser.GameObjects.Text) { this.setColor('#ffd700'); });

    this.gameOverPanel = this.scene.add.container(width / 2, height / 2, [
      bg, title, scoreLabel, restartBtn,
    ]).setDepth(30).setVisible(false);

    (this.gameOverPanel as any)._scoreLabel = scoreLabel;
  }

  private setupListeners(): void {
    this.subscriptions.push(
      EventBus.on('score:gained', () => this.updateScore()),
      EventBus.on('combo:increased', (p: { level: number }) => this.updateCombo(p.level)),
      EventBus.on('combo:reset', () => this.hideCombo()),
      EventBus.on('game:over', (p: { score: number }) => this.showGameOver(p.score)),
      EventBus.on('game:restart', () => this.hideGameOver()),
      EventBus.on('game:start', () => this.hideGameOver()),
    );
  }

  private updateScore(): void {
    const score = StateManager.getGame().score;
    this.scoreText.setText(`SCORE: ${score.toLocaleString()}`);
  }

  private updateCombo(level: number): void {
    this.comboText.setText(`COMBO x${level}`);
    const color = level >= 25 ? '#ff4444' : level >= 10 ? '#ffaa00' : '#ffd700';
    this.comboText.setColor(color);
    this.scene.tweens.add({
      targets: this.comboText,
      scale: 1.3, duration: 80, yoyo: true, ease: 'Back.easeOut',
    });
  }

  private hideCombo(): void {
    this.comboText.setText('');
  }

  private showGameOver(score: number): void {
    const label = (this.gameOverPanel as any)._scoreLabel as Phaser.GameObjects.Text;
    label.setText(`SCORE: ${score.toLocaleString()}`);
    this.gameOverPanel.setVisible(true);
    this.scene.tweens.add({
      targets: this.gameOverPanel,
      alpha: { from: 0, to: 1 }, duration: 400, ease: 'Power2',
    });
  }

  private hideGameOver(): void {
    this.gameOverPanel.setVisible(false);
    this.updateScore();
    this.hideCombo();
  }

  updateDepth(depth: number): void {
    this.depthText.setText(`DEPTH: ${depth}`);
  }

  destroy(): void {
    for (const id of this.subscriptions) EventBus.off(id);
  }
}