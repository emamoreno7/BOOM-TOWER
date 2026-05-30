import Phaser from 'phaser';
import { Logger } from '../../core/Logger';
import { EventBus } from '../../core/EventBus';
import { StateManager } from '../../application/state/StateManager';
import { PoolManager } from '../../core/ObjectPool';

// ============================================
// DEBUG PANEL — Panel de diagnóstico en runtime
// ============================================

export class DebugPanel {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private isVisible = false;
  private updateInterval = 1000;
  private lastUpdate = 0;
  private fpsHistory: number[] = [];
  private maxFpsHistory = 60;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(20, 20);
    this.container.setScrollFactor(0);
    this.container.setDepth(9999);
    this.container.setVisible(false);

    this.createPanel();
    this.setupToggle();
    
    Logger.system('[DebugPanel] Initialized');
  }

  private createPanel(): void {
    // Fondo semi-transparente
    const bg = this.scene.add.rectangle(0, 0, 350, 400, 0x000000, 0.85);
    bg.setOrigin(0, 0);
    bg.setStrokeStyle(2, 0xff6b35);
    bg.setDepth(0);
    this.container.add(bg);

    // Título
    const title = this.scene.add.text(15, 15, '🔧 DEBUG PANEL', {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: '#ffd700',
      fontStyle: 'bold',
    });
    this.container.add(title);

    // Info container
    this.createInfoSection(15, 45);
  }

  private createInfoSection(x: number, y: number): void {
    // Aquí se mostrarán las stats
    const infoText = this.scene.add.text(x, y, '', {
      fontSize: '13px',
      fontFamily: 'monospace',
      color: '#00ff00',
      lineSpacing: 6,
    });
    this.container.add(infoText);
  }

  private setupToggle(): void {
    // Toggle con F3 o triple tap
    this.scene.input.keyboard?.on('keydown-F3', () => {
      this.toggle();
    });

    // También con Ctrl+Shift+D
    this.scene.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.code === 'KeyD') {
        this.toggle();
      }
    });
  }

  toggle(): void {
    this.isVisible = !this.isVisible;
    this.container.setVisible(this.isVisible);
    
    if (this.isVisible) {
      this.scene.input.keyboard?.disableGlobalCapture();
    } else {
      this.scene.input.keyboard?.enableGlobalCapture();
    }

    Logger.debug(`[DebugPanel] ${this.isVisible ? 'Shown' : 'Hidden'}`);
  }

  show(): void {
    if (!this.isVisible) this.toggle();
  }

  hide(): void {
    if (this.isVisible) this.toggle();
  }

  update(delta: number): void {
    if (!this.isVisible) return;

    const now = Date.now();
    if (now - this.lastUpdate < this.updateInterval) return;
    this.lastUpdate = now;

    this.updateInfo();
  }

  private updateInfo(): void {
    const state = StateManager.get();
    const game = state.game;
    const player = state.player;
    const session = state.session;
    const poolMetrics = PoolManager.getAllMetrics();

    const fps = this.scene.game.loop.actualFps;
    this.fpsHistory.push(fps);
    if (this.fpsHistory.length > this.maxFpsHistory) {
      this.fpsHistory.shift();
    }
    const avgFps = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;

    const info = `
=== GAME ===
State: ${game.appState}
Playing: ${game.isPlaying}
Score: ${game.score}
Combo: ${game.combo}
Depth: ${game.currentDepth}

=== PLAYER ===
Level: ${player.level}
XP: ${player.xp}/${player.xpToNextLevel}
Coins: ${player.coins}
Gems: ${player.gems}

=== SESSION ===
ID: ${session.sessionId.substring(0, 12)}...
Blocks: ${session.blocksDestroyed}
Max Combo: ${session.maxCombo}
Time: ${Math.floor(Date.now() - session.startedAt / 1000)}s

=== PERFORMANCE ===
FPS: ${fps.toFixed(1)} (avg: ${avgFps.toFixed(1)})
Pools: ${Object.keys(poolMetrics).length}
Events: ${EventBus.getDebugInfo().totalSubscriptions}
    `.trim();

    // Actualizar el texto (el segundo hijo del container)
    const textObj = this.container.list[1] as Phaser.GameObjects.Text;
    if (textObj) {
      textObj.setText(info);
    }
  }

  // Log custom
  log(message: string): void {
    Logger.debug(`[Debug] ${message}`);
  }

  destroy(): void {
    this.container.destroy();
  }
}
