import Phaser from 'phaser';
import { Logger } from '../../core/Logger';
import { EventBus } from '../../core/EventBus';
import { StateManager } from '../../application/state/StateManager';
import { GameController } from '../../application/GameController';
import { Grid } from '../../domain/grid/Grid';
import { GridRefiller } from '../../domain/grid/GridRefiller';
import { BlockFactory } from '../../domain/blocks/BlockFactory';
import { ChainEvaluator } from '../../domain/chain/ChainEvaluator';
import { ChainProcessor } from '../../domain/chain/ChainProcessor';
import { ScoreSystem } from '../../domain/scoring/ScoreSystem';
import { ComboSystem } from '../../domain/scoring/ComboSystem';
import { DifficultyDirector } from '../../domain/difficulty/DifficultyDirector';
import { BlockView } from '../vfx/BlockView';
import { VFXManager } from '../vfx/VFXManager';
import { HUD } from '../hud/HUD';
import { ComboTextOverlay } from '../overlay/ComboTextOverlay';
import { PauseOverlay } from '../overlay/PauseOverlay';
import { UIManager } from '../ui/UIManager';
import { AudioManager } from '../audio/AudioManager';
import { Block } from '../../domain/blocks/Block';

const GRID_ROWS = 8;
const GRID_COLS = 6;

export class GameScene extends Phaser.Scene {
  // Domain
  private grid!: Grid;
  private blockFactory!: BlockFactory;
  private gridRefiller!: GridRefiller;
  private chainEvaluator!: ChainEvaluator;
  private chainProcessor!: ChainProcessor;
  private scoreSystem!: ScoreSystem;
  private comboSystem!: ComboSystem;
  private difficultyDirector!: DifficultyDirector;

  // Presentation
  private blockViews = new Map<string, BlockView>();
  private vfx!: VFXManager;
  private hud!: HUD;
  private comboOverlay!: ComboTextOverlay;
  private pauseOverlay!: PauseOverlay;
  private uiManager!: UIManager;
  private audio!: AudioManager;

  // Grid layout
  private gridOriginX = 0;
  private gridOriginY = 0;
  private cellSize = 0;

  // State
  private isProcessing = false;
  private subscriptions: string[] = [];

  constructor() {
    super({ key: 'game' });
  }

  create(): void {
    const { width, height } = this.cameras.main;
    Logger.game('GameScene create — Fase 2');

    this.cellSize = BlockView.cellSize();
    this.gridOriginX = width / 2 - (GRID_COLS * this.cellSize) / 2 + this.cellSize / 2;
    this.gridOriginY = height / 2 - (GRID_ROWS * this.cellSize) / 2 + this.cellSize / 2;

    // Domain
    this.blockFactory      = new BlockFactory();
    this.grid              = new Grid({ rows: GRID_ROWS, cols: GRID_COLS });
    this.gridRefiller      = new GridRefiller(this.blockFactory);
    this.chainEvaluator    = new ChainEvaluator(2);
    this.chainProcessor    = new ChainProcessor();
    this.scoreSystem       = new ScoreSystem();
    this.comboSystem       = new ComboSystem(3000);
    this.difficultyDirector = new DifficultyDirector();

    // Presentation
    this.vfx          = new VFXManager(this);
    this.hud          = new HUD(this);
    this.comboOverlay = new ComboTextOverlay(this);
    this.uiManager    = new UIManager(this);
    this.audio        = new AudioManager(this);

    // Build scene
    this.createBackground(width, height);
    this.createGridBackground();
    this.fillGrid();
    this.hud.create();

    // Pause overlay last (highest depth)
    this.pauseOverlay = new PauseOverlay(this);

    // Input + events
    this.setupInput();
    this.setupEvents();

    // Start
    GameController.init(this);
    GameController.startGame();

    this.cameras.main.fadeIn(300);
    Logger.game('GameScene ready — Fase 2');
  }

  // ==================== SETUP ====================

  private createBackground(width: number, height: number): void {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a0a1a, 0x0a0a1a, 0x1a1a2e, 0x1a1a2e, 1);
    bg.fillRect(0, 0, width, height);
    bg.setDepth(0);
  }

  private createGridBackground(): void {
    const g = this.add.graphics();
    g.setDepth(1);
    const w = GRID_COLS * this.cellSize;
  const h = GRID_ROWS * this.cellSize;
    const x = this.gridOriginX - this.cellSize / 2;
    const y = this.gridOriginY - this.cellSize / 2;

    g.fillStyle(0x111122, 0.8);
    g.fillRoundedRect(x - 8, y - 8, w + 16, h + 16, 12);
    g.lineStyle(2, 0x334466, 0.8);
    g.strokeRoundedRect(x - 8, y - 8, w + 16, h + 16, 12);
    g.lineStyle(1, 0x223344, 0.4);
    for (let r = 0; r <= GRID_ROWS; r++) {
      g.lineBetween(x, y + r * this.cellSize, x + w, y + r * this.cellSize);
    }
    for (let c = 0; c <= GRID_COLS; c++) {
      g.lineBetween(x + c * this.cellSize, y, x + c * this.cellSize, y + h);
    }
  }

  private fillGrid(): void {
    const blocks = this.gridRefiller.refill(this.grid);
    for (const block of blocks) {
      this.spawnBlockView(block);
    }
  }

  private setupInput(): void {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.isProcessing) return;
      if (StateManager.getGame().isPaused) return;
      if (StateManager.getGame().isGameOver) return;
      const cell = this.worldToGrid(pointer.x, pointer.y);
      if (!cell) return;
      this.handleTap(cell.row, cell.col);
    });
  }

  private setupEvents(): void {
    this.subscriptions.push(
      EventBus.on('game:restart', () => this.restartScene()),
      EventBus.on('input:pause', () => {
        if (!StateManager.getGame().isPaused) {
          GameController.pauseGame();
        }
      }),
    );
  }

  // ==================== GAMEPLAY ====================

  private handleTap(row: number, col: number): void {
    const chain = this.chainEvaluator.evaluate(this.grid, row, col);

    if (!chain) {
      this.playInvalidTap(row, col);
      return;
    }

    this.isProcessing = true;

    const comboLevel = this.comboSystem.hit();
    GameController.registerCombo(comboLevel);

    const score = this.scoreSystem.calculate(chain, comboLevel);
    GameController.addScore(score.total, chain.type);

    this.difficultyDirector.evaluate(
      StateManager.getGame().score,
      this.blockFactory
    );

    const { removedBlocks, affectedCols } = this.chainProcessor.process(this.grid, chain);

    // VFX
    const blockPositions = removedBlocks.map(b => ({
      x: this.gridToWorld(b.row, b.col).x,
      y: this.gridToWorld(b.row, b.col).y,
      type: b.type,
    }));
    this.vfx.playChainExplosion(blockPositions);

    // Score flotante en el centro de la cadena
    if (blockPositions.length > 0) {
      const cx = blockPositions.reduce((s, b) => s + b.x, 0) / blockPositions.length;
      const cy = blockPositions.reduce((s, b) => s + b.y, 0) / blockPositions.length;
      this.vfx.showFloatingScore(cx, cy, score.total);
    }

    // Shake según tamaño
    if (removedBlocks.length >= 10) this.vfx.shake(0.02, 300);
    else if (removedBlocks.length >= 5) this.vfx.shake(0.01, 150);

    // Audio
    this.audio.playChainSFX(chain.blocks.length);
    if (comboLevel >= 5) this.audio.playComboSFX(comboLevel);

    // Destruir vistas
    this.playDestroyAnimation(removedBlocks, () => {
      const fallen = this.chainProcessor.applyGravity(this.grid, affectedCols);
      this.updateFallenViews(fallen, () => {
        const newBlocks = this.gridRefiller.refillCols(this.grid, affectedCols);
        this.spawnNewBlockViews(newBlocks, () => {
          if (!this.chainEvaluator.hasAnyChain(this.grid)) {
            this.triggerGameOver();
          } else {
            this.isProcessing = false;
          }
        });
      });
    });
  }

  // ==================== ANIMACIONES ====================

  private playDestroyAnimation(blocks: Block[], onComplete: () => void): void {
    let completed = 0;
    if (blocks.length === 0) { onComplete(); return; }

    for (const block of blocks) {
      const view = this.blockViews.get(block.id);
      if (!view) { completed++; if (completed >= blocks.length) onComplete(); continue; }

      view.playExplode(() => {
        this.blockViews.delete(block.id);
        completed++;
        if (completed >= blocks.length) onComplete();
      });
    }
  }

  private updateFallenViews(fallen: Block[], onComplete: () => void): void {
    if (fallen.length === 0) { onComplete(); return; }

    let completed = 0;
    const checked = new Set<string>();

    for (const block of fallen) {
      if (checked.has(block.id)) { completed++; continue; }
      checked.add(block.id);

      const view = this.blockViews.get(block.id);
      if (!view) { completed++; if (completed >= checked.size) onComplete(); continue; }

      const { x, y } = this.gridToWorld(block.row, block.col);
      this.tweens.add({
        targets: view['graphics'],
        x, y, duration: 150, ease: 'Power2',
        onComplete: () => {
          view.draw();
          completed++;
          if (completed >= checked.size) onComplete();
        },
      });
    }
  }

  private spawnNewBlockViews(blocks: Block[], onComplete: () => void): void {
    if (blocks.length === 0) { onComplete(); return; }
    for (const block of blocks) this.spawnBlockView(block, true);
    this.time.delayedCall(200, onComplete);
  }

  private playInvalidTap(row: number, col: number): void {
    const { x, y } = this.gridToWorld(row, col);
    const g = this.add.graphics();
    g.lineStyle(2, 0xff0000, 0.8);
    g.strokeCircle(x, y, 25);
    g.setDepth(10);
    this.tweens.add({
      targets: g, alpha: 0, scaleX: 1.5, scaleY: 1.5,
      duration: 300, onComplete: () => g.destroy(),
    });
  }

  // ==================== VIEWS ====================

  private spawnBlockView(block: Block, animate = false): BlockView {
    const { x, y } = this.gridToWorld(block.row, block.col);
    const view = new BlockView(this, block, x, y);
    view.setDepth(5);
    this.blockViews.set(block.id, view);

    if (animate) {
      view['graphics'].setAlpha(0).setScale(0.5);
      this.tweens.add({
        targets: view['graphics'],
        alpha: 1, scaleX: 1, scaleY: 1,
        duration: 180, ease: 'Back.easeOut',
      });
    }

    return view;
  }

  // ==================== GAME OVER ====================

  private triggerGameOver(): void {
    const score = StateManager.getGame().score;
    GameController.endGame();
    this.isProcessing = false;
    this.uiManager.showToast('No more moves!', 2000, '#ff4444');
    Logger.game(`Game over — score: ${score}`);
  }

  private restartScene(): void {
    this.cleanupViews();
    this.grid.clear();
    this.comboSystem.reset();
    GameController.restartGame();
    this.fillGrid();
    this.isProcessing = false;
  }

  private cleanupViews(): void {
    for (const view of this.blockViews.values()) view.destroy();
    this.blockViews.clear();
  }

  // ==================== HELPERS ====================

  private gridToWorld(row: number, col: number): { x: number, y: number } {
    return {
      x: this.gridOriginX + col * this.cellSize,
      y: this.gridOriginY + row * this.cellSize,
    };
  }

  private worldToGrid(wx: number, wy: number): { row: number, col: number } | null {
    const col = Math.round((wx - this.gridOriginX) / this.cellSize);
    const row = Math.round((wy - this.gridOriginY) / this.cellSize);
    if (row < 0 || row >= GRID_ROWS || col < 0 || col >= GRID_COLS) return null;
    return { row, col };
  }

  // ==================== UPDATE ====================

  update(): void {
    const now = Date.now();
    const wasReset = this.comboSystem.tick(now);
    if (wasReset) {
      EventBus.emit('combo:reset', {});
      GameController.registerCombo(0);
    }
    this.hud.updateDepth(StateManager.getGame().currentDepth);
  }

  // ==================== DESTROY ====================

  shutdown(): void {
    for (const id of this.subscriptions) EventBus.off(id);
    this.hud.destroy();
    this.comboOverlay.destroy();
    this.pauseOverlay.destroy();
    this.uiManager.destroy();
    this.audio.destroy();
    this.cleanupViews();
  }
}
