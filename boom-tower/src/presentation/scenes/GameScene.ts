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
import { EventDirector } from '../../domain/events/EventDirector';
import { BlockView } from '../vfx/BlockView';
import { ExplosionEffect } from '../vfx/ExplosionEffect';
import { VFXManager } from '../vfx/VFXManager';
import { ComboTextOverlay } from '../vfx/ComboTextOverlay';
import { HUD } from '../hud/HUD';
import { AudioManager } from '../audio/AudioManager';
import { MusicLayerSystem } from '../audio/MusicLayerSystem';
import { PauseOverlay } from '../ui/overlays/PauseOverlay';
import { Block } from '../../domain/blocks/Block';
import { isSpecial, BlockType, BLOCK_COLORS } from '../../domain/blocks/BlockType';
import { BombBlock } from '../../domain/blocks/special/BombBlock';
import { LightningBlock } from '../../domain/blocks/special/LightningBlock';
import { RainbowBlock } from '../../domain/blocks/special/RainbowBlock';
import { JackpotBlock } from '../../domain/blocks/special/JackpotBlock';

// ============================================
// GAME SCENE — Escena principal de gameplay Fase 2
// ============================================

const GRID_ROWS = 8;
const GRID_COLS = 6;

export class GameScene extends Phaser.Scene {
  // Domain
  private grid!: Grid;
  private blockFactory!: BlockFactory;
  private gridRefiller!: GridRefiller;
  private chainEvaluator!: ChainEvaluator; private chainProcessor!: ChainProcessor;
  private scoreSystem!: ScoreSystem;
  private comboSystem!: ComboSystem;
  private difficultyDirector!: DifficultyDirector;
  private eventDirector!: EventDirector;

  // Presentation
  private blockViews = new Map<string, BlockView>();
  private explosionEffect!: ExplosionEffect;
  private vfx!: VFXManager;
  private comboOverlay!: ComboTextOverlay;
  private hud!: HUD;
  private audio!: AudioManager;
  private music!: MusicLayerSystem;
  private pauseOverlay!: PauseOverlay;

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
    this.gridOrigi = height / 2 - (GRID_ROWS * this.cellSize) / 2 + this.cellSize / 2;

    // Domain
    this.blockFactory       = new BlockFactory();
    this.grid               = new Grid({ rows: GRID_ROWS, cols: GRID_COLS });
    this.gridRefiller       = new GridRefiller(this.blockFactory);
    this.chainEvaluator     = new ChainEvaluator(2);
    this.chainProcessor     = new ChainProcessor();
    this.scoreSystem        = new ScoreSystem();
    this.comboSystem        = new ComboSystem(3000);
    this.difficultyDirector = new DifficultyDirector();
    this.eventDirector      = new EventDirector(2000);

    // Presentation
    this.explosionEffect = new ExplosionEffect(this);
    this.vfx             = new VFXManager(this);
    this.comboOverlay    = new ComboTextOverlay(this);
    this.hud             = new HUD(this);
    this.audio           = new AudioManager(this);
    this.music           = new MusicLayerSystem(this);
    this.pauseOverlay    = new PauseOverlay(this);

    this.createBackground(width, height);
    this.createGridBackground();
    this.fillGrid();
    this.hud.create();

    this.setupInput();
    this.setupEvents();

    GameController.init(this.game);
    GameController.startGame();

    this.cameras.main.fadeIn(300);
    Logger.game('GameScene ready');
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
      EventBus.on('input:pause', () => this.togglePause()),
      EventBus.on('game:resume', () => this.togglePause()),
      EventBus.on('event:started', (data: { event: { label: string; color: number } }) => {
        const { width, height } = this.cameras.main;
        this.vfx.showEvent(width / 2, height * 0.3, data.event.label, data.event.color);
      }),
    );
  }

  private togglePause(): void {
    if (StateManager.getGame().isPaused) {
      GameController.resumeGame();
      this.pauseOverlay.hide();
    } else {
      GameController.pauseGame();
      this.pauseOverlay.show();
    }
  }

  // ==================== GAMEPLAY ====================

  private handleTap(row: number, col: number): void {
    const block = this.grid.get(row, col);
    if (!block) return;

    // Bloques especiales
    if (isSpecial(block.type)) {
      this.handleSpecialBlock(block, row, col);
      return;
    }

    const chain = this.chainEvaluator.evaluate(this.grid, row, col);
    if (!chain) {
      this.playInvalidTap(row, col);
      return;
    }

    this.isProcessing = true;

    const comboLevel = this.comboSystem.hit();
    GameController.registerCombo(comboLevel);

    const eventMultiplier = this.eventDirector.getMultiplier();
    const score = this.scoreSystem.calculate(chain, comboLevel);
    const finalScore = Math.floor(score.total * eventMultiplier);
    GameController.addScore(finalScore, chain.type);

    this.eventDirector.onScore(finalScore);
    this.eventDirector.onCombo(comboLevel);

    this.difficultyDirector.evaluate(StateManager.getGame().score, this.blockFactory);

    const { x, y } = this.gridToWorld(row, col);
    this.vfx.showScore(x, y - 20, finalScore);
    if (comboLevel >= 2) this.vfx.showCombo(x, y - 60, comboLevel);

    const { removedBlocks, affectedCols } = this.chainProcessor.process(this.grid, chain);

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

  private handleSpecialBlock(block: Block, row: number, col: number): void {
    this.isProcessing = true;
    const { x, y } = this.gridToWorld(row, col);
    const color = BLOCK_COLORS[block.type];

    let result;
    switch (block.type) {
      case BlockType.BOMB:
        result = BombBlock.activate(this.grid, row, col);
        this.vfx.specialExplode(x, y, color);
        break;
      case BlockType.LIGHTNING:
        result = LightningBlock.activate(this.grid, row, col);
        this.vfx.specialExplode(x, y, color);
        break;
      case BlockType.RAINBOW:
        result = RainbowBlock.activate(this.grid, row, col);
        this.vfx.specialExplode(x, y, color);
        break;
      case BlockType.JACKPOT:
        result = JackpotBlock.activate(this.grid, row, col);
        this.vfx.jackpot(x, y);
        break;
      default:
        this.isProcessing = false;
        return;
    }

    GameController.addScore(result.score, block.type);
    this.eventDirector.onScore(result.score);
    this.vfx.showScore(x, y - 40, result.score);

    const affectedCols = new Set<number>();
    const blocksToRemove: Block[] = [];

    for (const cell of result.affectedCells) {
      const b = this.grid.get(cell.row, cell.col);
      if (b) {
        blocksToRemove.push(b);
        affectedCols.add(cell.col);
        this.grid.remove(cell.row, cell.col);
      }
    }

    this.playDestroyAnimation(blocksToRemove, () => {
      const cols = [...affectedCols];
      const fallen = this.chainProcessor.applyGravity(this.grid, cols);
      this.updateFallenViews(fallen, () => {
        const newBlocks = this.gridRefiller.refillCols(this.grid, cols);
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
    for (const block of blocks) {
      const view = this.blockViews.get(block.id);
      if (!view) { completed++; continue; }

      const { x, y } = this.gridToWorld(block.row, block.col);
      this.explosionEffect.play(x, y, block.type);
      this.vfx.blockExplode(x, y, BLOCK_COLORS[block.type]);

      view.playExplode(() => {
        this.blockViews.delete(block.id);
        completed++;
        if (completed >= blocks.length) onComplete();
      });
    }
    if (blocks.length === 0) onComplete();
  }

  private updateFallenViews(fallen: Block[], onComplete: () => void): void {
    if (fallen.length === 0) { onComplete(); return; }

    let completed = 0;
    const checked = new Set<string>();

    for (const block of fallen) {
      if (checked.has(block.id)) { completed++; continue; }
      checked.add(block.id);

      const view = this.blockViews.get(block.id);
      if (!view) { completed++; continue; }

      const { x, y } = this.gridToWorld(block.row, block.col);
      this.tweens.add({
        targets: view['graphics'],
        x, y,
        duration: 150,
        ease: 'Power2',
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
      targets: g,
      alpha: 0,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 300,
      onComplete: () => g.destroy(),
    });
  }

  // ==================== VIEWS ====================

  private spawnBlockView(block: Block, animate = false): BlockView {
    const { x, y } = this.gridToWorld(block.row, block.col);
    const view = new BlockView(this, block, x, y);
    view.setDepth(5);
    this.blockViews.set(block.id, view);

    if (animate) {
      view['graphics'].setAlpha(0);
      view['graphics'].setScale(0.5);
      this.tweens.add({
        targets: view['graphics'],
        alpha: 1, scaleX: 1, scaleY: 1,
        duration: 180,
        ease: 'Back.easeOut',
      });
    }
    return view;
  }

  // ==================== GAME OVER ====================

  private triggerGameOver(): void {
    const score = StateManager.getGame().score;
    this.vfx.gameOver();
    GameController.endGame();
    this.isProcessing = false;
    Logger.game('Game over — score: ' + score);
  }

  private restartScene(): void {
    this.cleanupViews();
    this.grid.clear();
    this.comboSystem.reset();
    this.eventDirector.reset();
    GameController.restartGame();
    this.fillGrid();
    this.isProcessing = false;
  }

  private cleanupViews(): void {
    for (const view of this.blockViews.values()) view.destroy();
    this.blockViews.clear();
  }

  // ==================== HELPERS ====================

  private gridToWorld(row: number, col: number): { x: number; y: number } {
    return {
      x: this.gridOriginX + col * this.cellSize,
      y: this.gridOriginY + row * this.cellSize,
    };
  }

  private worldToGrid(wx: number, wy: number): { row: number; col: number } | null {
    const col = Math.round((wx - this.gridOriginX) / this.cellSize);
    cot row = Math.round((wy - this.gridOriginY) / this.cellSize);
    if (row < 0 || row >= GRID_ROWS || col < 0 || col >= GRID_COLS) return null;
    return { row, col };
  }

  // ==================== UPDATE ====================

  update(_time: number, _delta: number): void {
    const now = Date.now();
    const wasReset = this.comboSystem.tick(now);
    if (wasReset) {
      EventBus.emit('combo:reset', {});
      GameController.registerCombo(0);
    }
    this.music.update();
    this.hud.updateDepth(StateManager.getGame().currentDepth);
  }

  // ==================== DESTROY ====================

  shutdown(): void {
    for (const id of this.subscriptions) EventBus.off(id);
    this.hud.destroy();
    this.vfx.destroy();
    this.audio.destroy();
    this.music.destroy();
    this.pauseOverlay.destroy();
    this.comboOverlay.destroy();
    this.cleanupViews();
    this.eventDirector.reset();
  }
}
