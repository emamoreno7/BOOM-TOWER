import Phaser from 'phaser';
import { Logger } from '../../core/Logger';
import { EconomySystem } from '../../domain/economy/EconomySystem';
import { SkinSystem } from '../../domain/skins/SkinSystem';
import { EconomyBalancer } from '../../domain/economy/EconomyBalancer';

export class ShopScene extends Phaser.Scene {
  private balancer = new EconomyBalancer();

  constructor() { super({ key: 'shop' }); }

  create(): void {
    const { width, height } = this.cameras.main;
    const cx = width / 2;
    Logger.ui('ShopScene create');
    this.createBackground(width, height);

    this.add.text(cx, 80, 'TIENDA', {
      fontSize: '48px',
      fontFamily: 'Arial Black',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 5,
    }).setOrigin(0.5);

    const wallet = EconomySystem.getWallet();
    this.add.text(cx, 140, 'Monedas: ' + wallet.getCoins() + '  Gemas: ' + wallet.getGems(), {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#ffdd00',
    }).setOrigin(0.5);

    const skins = SkinSystem.getAll();
    let y = 210;

    for (const skin of skins) {
      const owned = SkinSystem.isOwned(skin.id);
      const cost = this.balancer.getSkinCost(skin.tier);
      const color = owned ? '#44ff88' : '#ffffff';
      const status = owned ? 'Equipar' : cost.coins + ' coins';

      this.add.text(cx - 100, y, skin.name, {
        fontSize: '26px',
        fontFamily: 'Arial Black',
        color,
        stroke: '#000000',
        strokeThickness: 3,
      }).setOrigin(0.5);

      const actionBtn = this.add.text(cx + 150, y, status, {
        fontSize: '22px',
        fontFamily: 'Arial Black',
        color: owned ? '#44ff88' : '#ffdd00',
        stroke: '#000000',
        strokeThickness: 3,
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      actionBtn.on('pointerdown', () => {
        if (owned) {
          SkinSystem.equipSkin(skin.id);
        } else {
          const success = EconomySystem.purchase(cost.coins, cost.gems, skin.id);
          if (success) {
            SkinSystem.unlockSkin(skin.id);
            this.scene.restart();
          }
        }
      });
      actionBtn.on('pointerover', () => actionBtn.setScale(1.1));
      actionBtn.on('pointerout',  () => actionBtn.setScale(1));
      y += 90;
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
