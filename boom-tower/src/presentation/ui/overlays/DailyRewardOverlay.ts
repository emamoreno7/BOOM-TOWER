import Phaser from 'phaser';
import { EventBus } from '../../../core/EventBus';
import { DailyRewardSystem, DAILY_REWARDS, DailyReward } from '../../../domain/retention/DailyRewardSystem';
import { Logger } from '../../../core/Logger';

export class DailyRewardOverlay {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private system: DailyRewardSystem;
  private subscriptions: string[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.system = new DailyRewardSystem();
    const { width, height } = scene.cameras.main;

    const bg = scene.add.rectangle(0, 0, width, height, 0x000000, 0.85);

    const panel = scene.add.rectangle(0, 0, width * 0.85, height * 0.7, 0x1a1a2e, 1)
      .setStrokeStyle(2, 0xffd700, 1);

    const title = scene.add.text(0, -height * 0.28, 'DAILY REWARD', {
      fontSize: '32px', fontFamily: 'Arial',
      color: '#ffd700', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5);

    const streakText = scene.add.text(0, -height * 0.22, 'LOGIN STREAK: 0', {
      fontSize: '18px', fontFamily: 'Arial', color: '#aaaaaa',
    }).setOrigin(0.5);

    // Grid de recompensas (7 días visibles)
    const rewardCards = this.createRewardCards(scene, width, height);

    const claimBtn = scene.add.text(0, height * 0.25, '[ CLAIM REWARD ]', {
      fontSize: '28px', fontFamily: 'Arial',
      color: '#ffd700', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
      backgroundColor: '#00000088',
      padding: { x: 20, y: 10 },
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => EventBus.emit('retention:claim', {}))
      .on('pointerover', function(this: Phaser.GameObjects.Text) { this.setColor('#ffffff'); })
      .on('pointerout', function(this: Phaser.GameObjects.Text) { this.setColor('#ffd700'); });

   const closeBtn = scene.add.text(width * 0.38, -height * 0.32, '✕', {
      fontSize: '24px', fontFamily: 'Arial', color: '#888888',
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.hide());

    this.container = scene.add.container(width / 2, height / 2, [
      bg, panel, title, streakText, ...rewardCards, claimBtn, closeBtn,
    ]).setDepth(60).setVisible(false);

    this.setupListeners();
  }

  private createRewardCards(scene: Phaser.Scene, width: number, height: number): Phaser.GameObjects.GameObject[] {
    const cards: Phaser.GameObjects.GameObject[] = [];
    const days = DAILY_REWARDS.slice(0, 7);
    const cardW = (width * 0.75) / 7;
    const startX = -(width * 0.75) / 2 + cardW / 2;

    days.forEach((reward, i) => {
      const x = startX + i * cardW;
      const y = -height * 0.05;
      const color = reward.isSpecial ? 0xffd700 : 0x334466;

      const card = scene.add.rectangle(x, y, cardW - 6, 90, color, 0.8)
        .setStrokeStyle(1, 0x556688);

      const dayLabel = scene.add.text(x, y - 28, `D${reward.day}`, {
        fontSize: '12px', fontFamily: 'Arial', color: '#aaaaaa',
      }).setOrigin(0.5);

      const coinsLabel = scene.add.text(x, y, `${reward.coins}`, {
        fontSize: '14px', fontFamily: 'Arial',
        color: '#ffd700', fontStyle: 'bold',
      }).setOrigin(0.5);

      const gemsLabel = scene.add.text(x, y + 22, reward.gems > 0 ? `+${reward.gems}💎` : '', {
        fontSize: '12px', fontFamily: 'Arial', color: '#88aaff',
      }).setOrigin(0.5);

      cards.push(card, dayLabel, coinsLabel, gemsLabel);
    });

    return cards;
  }

  private setupListeners(): void {
    this.subscriptions.push(
      EventBus.on('retention:show_daily', () => this.show()),
      EventBus.on('retention:claim_success', (p: { coins: number; gems: number }) => {
        this.showClaimFeedback(p.coins, p.gems);
      }),
    );
  }

  show(): void {
    this.container.setVisible(true).setAlpha(0);
    this.scene.tweens.add({
      targets: this.container, alpha: 1, duration: 300, ease: 'Power2',
    });
    Logger.info('[DailyRewardOverlay] Shown');
  }

  hide(): void {
    this.scene.tweens.add({
      targets: this.container, alpha: 0, duration: 200,
      onComplete: () => this.container.setVisible(false),
    });
  }

  private showClaimFeedback(coins: number, gems: number): void {
    const { width, height } = this.scene.cameras.main;
    const msg = gems > 0 ? `+${coins} coins  +${gems} gems!` : `+${coins} coins!`;
    const text = this.scene.add.text(width / 2, height / 2, msg, {
      fontSize: '36px', fontFamily: 'Arial',
      color: '#ffd700', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(70).setAlpha(0);

    this.scene.tweens.add({
      targets: text, alpha: 1, y: height / 2 - 80,
      duration: 600, ease: 'Power2',
      onComplete: () => {
        this.scene.time.delayedCall(800, () => {
          this.scene.tweens.add({
            targets: text, alpha: 0, duration: 400,
            onComplete: () => { text.destroy(); this.hide(); },
          });
        });
      },
    });
  }

  destroy(): void {
    for (const id of this.subscriptions) EventBus.off(id);
    this.container.destroy();
  }
}
