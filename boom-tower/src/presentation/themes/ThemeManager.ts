import Phaser from 'phaser';
import { ThemeSystem } from '../../domain/themes/ThemeSystem';
import { SkinSystem } from '../../domain/skins/SkinSystem';
import { EventBus } from '../../core/EventBus';
import { Logger } from '../../core/Logger';

export class ThemeManager {
  private scene: Phaser.Scene;
  private themeSystem: ThemeSystem;
  private skinSystem: SkinSystem;
  private bg: Phaser.GameObjects.Graphics | null = null;
  private subscriptions: string[] = [];

  constructor(scene: Phaser.Scene, themeSystem: ThemeSystem, skinSystem: SkinSystem) {
    this.scene = scene;
    this.themeSystem = themeSystem;
    this.skinSystem = skinSystem;
    this.setupListeners();
    Logger.info('[ThemeManager] Initialized');
  }

  applyTheme(): void {
    const theme = this.themeSystem.getActiveTheme();
    const { width, height } = this.scene.cameras.main;

    if (this.bg) this.bg.destroy();
    this.bg = this.scene.add.graphics();
    this.bg.fillGradientStyle(
      theme.bgTopColor, theme.bgTopColor,
      theme.bgBottomColor, theme.bgBottomColor, 1
    );
    this.bg.fillRect(0, 0, width, height);
    this.bg.setDepth(0);

    Logger.info(`[ThemeManager] Applied theme: ${theme.id}`);
  }

  getBlockColor(blockType: string, fallback: number): number {
    const skin = this.skinSystem.getActiveSkin();
    return skin.blockColors[blockType] ?? fallback;
  }

  getAccentColor(): number {
    return this.themeSystem.getActiveTheme().accentColor;
  }

  private setupListeners(): void {
    this.subscriptions.push(
      EventBus.on('theme:changed', () => this.applyTheme()),
      EventBus.on('skin:changed', () => {
        Logger.info('[ThemeManager] Skin changed');
      }),
    );
  }

  destroy(): void {
    for (const id of this.subscriptions) EventBus.off(id);
    this.bg?.destroy();
  }
}
