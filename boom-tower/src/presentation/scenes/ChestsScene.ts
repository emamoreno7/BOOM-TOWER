import Phaser from 'phaser';
import { Logger } from '../../core/Logger';
import { ChestSystem, ChestTier } from '../../domain/chests/ChestSystem';
import { EventBus } from '../../core/EventBus';

// ============================================
// CHESTS SCENE — Pantalla de cofres
// ============================================

export class ChestsScene extends Phaser.Scene {
  constructor() { super({ key: 'chests' }); }

  create(): void {
    const { width, height } = this.cameras.main;
    const cx = width / 2;
    Logger.ui('ChestsScene create');

    this.createBackground(width, height);

    this.add.text(cx, 80, 'COFRES', {
      fontSize: '48px', fontFamily: 'AriaBlack', color: '#ffffff',
      stroke: '#000000', strokeThickness: 5,
    }).setOrigin(0.5);

    const inventory = ChestSystem.getInventory();
    const tiers: ChestTier[] = ['common', 'rare', 'epic', 'legendary'];
    const tierColors: Record<ChestTier, string> = {
      common: '#aaaaaa', rare: '#4488ff', epic: '#aa44ff', legendary: '#ffd700',
    };
    const tierNames: Record<ChestTier, string> = {
      common: 'Comun', rare: 'Raro', epic: 'Epico', legendary: 'Legendario',
    };

    let y = 200;
    for (const tier of tiers) {
      const count = inventory[tier];
      const color = tierColors[tier];
      const name = tierNames[tier];

      this.add.text(cx - 150, y, name, {
        fontSize: '28px', fontFamily: 'Arial Black', color,
        stroke: '#000000', strokeThickness: 3,
      }).setOrigin(0.5);

      this.add.text(cx + 50, y, 'x' + count, {
        fontSize: '28px', fontFamily: 'Arial', color: '#ffffff',
      }).setOrigin(0.5);

      if (count > 0) {
        const openBtn = this.add.text(cx + 160, y, 'Abrir', {
          fontSize: '24px', fontFamily: 'Arial Black', color: '#44ff88',
          stroke: '#000000', strokeThickness: 3,
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        openBtn.on('pointerdown', () => {
          const loot = ChestSystem.open(tier);
          if (loot) {
            const msg = 'Coins: ' + loot.coins + ' Gems: ' + loot.gems + ' XP: ' + loot.xp;
            EventBus.emit('ui:toast', { message: msg });
            this.scene.restart();
          }
        });
        openBtn.on('pointerover', () => openBtn.setScale(1.1));
        openBtn.on('pointerout',  () => openBtn.setScale(1));
      }

      y += 100;
    }

    const backBtn = this.add.text(cx, height - 80, 'VOLVER', {
      fontSize: '36px', fontFamily: 'Arial Black', color: '#ff8844',
      stroke: '#000000', strokeThickness: 4,
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
