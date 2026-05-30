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
import { BlockType, isSpecial } from '../../domain/blocks/BlockType';
import { handleSpecialBlock } from '../../domain/blocks/special/SpecialBlockHandler';

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
    this.blockFactory       = new BlockFactory();
    this.grid               = new Grid({ rows: GRID_ROWS, cols: GRID_COLS });
    this.gridRefiller       = new GridRefiller(this.blockFactory);
    this.chainEvaluator     = new ChainEvaluator(2);
    this.chainProcessor     = new ChainProcessor();
    this.scoreSystem        = new ScoreSystem();
    this.comboSystem        = new ComboSystem(3000);
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

    // Pause overlay last
    this.pauseOverlay = new PauseOverlay(this);

    this.setupInput();
    this.setupEvents();

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
    for (const block of blocks) this.spawnBlockView(block);
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
        if (!StateManager.getGame().isPaused) GameController.pauseGame();
      }),
    );
  }

  // ==================== GAMEPLAY ====================

  private handleTap(row: number, col: number): void {
    const block = this.grid.get(row, col);
    if (!block) return;

    this.isProcessing = true;

    // Bloque especial
    if (isSpecial(block.type)) {
      this.handleSpecialTap(block);
      return;
    }

    // Cadena normal
    const chain = this.chainEvaluator.evaluate(this.grid, row, col);
    if (!chain) {
      this.playInvalidTap(row, col);
      this.isProcessing = false;
      return;
    }

    const comboLevel = this.comboSystem.hit();
    GameController.registerCombo(comboLevel);

    const score = this.scoreSystem.calculate(chain, comboLevel);
    GameController.addScore(score.total, chain.type);

    this.difficultyDirector.evaluate(StateManager.getGame().score, this.blockFactory);

    const { removedBlocks, affectedCols } = this.chainProcessor.process(this.grid, chain);
    this.playDestroyVFX(removedBlocks, score.total);

    if (removedBlocks.length >= 10) this.vfx.shake(0.02, 300);
    else if (removedBlocks.length >= 5) this.vfx.shake(0.01, 150);

    this.audio.playChainSFX(chain.blocks.length);
    if (comboLevel >= 5) this.audio.playComboSFX(comboLevel);

    this.playDestroyAnimation(removedBlocks, () => {
      this.applyGravityAndRefill(affectedCols, () => {
        this.checkCascade(() => {
          this.isProcessing = false;
        });
      });
    });
  }

  private handleSpecialTap(block: Block): void {
    const result = handleSpecialBlock(this.grid, block, this.getMostCommonType());
    if (!result) { this.isProcessing = false; return; }

    const { affectedBlocks, specialType, scoreMultiplier } = result;
    const baseScore = affectedBlocks.length * 100 * scoreMultiplier;
    GameController.addScore(baseScore, specialType);

    // VFX por tipo
    const { x, y } = this.gridToWorld(block.row, block.col);
    switch (specialType) {
      case BlockType.BOMB:
        this.vfx.playBombEffect(x, y);
        this.audio.playSpecialSFX('bomb');
        this.uiManager.showEventBanner('BOOM!', '#ff6600');
        break;
      case BlockType.LIGHTNING:
        this.vfx.playLightningEffect(this, x, 0, x, this.cameras.main.height);
        this.audio.playSpecialSFX('lightning');
        this.uiManager.showEventBanner('LIGHTNING!', '#ffff00');
        break;
      case BlockType.RAINBOW:
        this.vfx.playRainbowEffect(x, y);
        this.audio.playSpecialSFX('rainbow');
        this.uiManager.showEventBanner('RAINBOW!', '#ff88ff');
        break;
      case BlockType.JACKPOT:
        this.vfx.playJackpotEffect(x, y);
        this.audio.playSpecialSFX('jackpot');
        this.uiManager.showEventBanner('JACKPOT! x5', '#ffd700');
        break;
    }

    const affectedCols = [...new Set(affectedBlocks.map(b => b.col))];
    const { removedBlocks } = this.chainProcessor.process(
      this.grid,
      { blocks: affectedBlocks, type: specialType }
    );

    this.playDestroyAnimation(removedBlocks, () => {
      this.applyGravityAndRefill(affectedCols, () => {
        this.checkCascade(() => {
          this.isProcessing = false;
        });
      });
    });
  }

  // ==================== CASCADE ====================

  private checkCascade(onComplete: () => void): void {
    const chains = this.chainEvaluator.evaluateAll(this.grid);

    if (chains.length === 0) {
      if (!this.chainEvaluator.hasAnyChain(this.grid)) {
        this.triggerGameOver();
      } else {
        onComplete();
      }
      return;
    }

    // Auto-destruir cadenas grandes (cascade)
    const bigChains = chains.filter(c => c.blocks.length >= 6);
    if (bigChains.length === 0) { onComplete(); return; }

    Logger.info(`[Cascade] Auto-destroying ${bigChains.length} chains`);

    let processed = 0;
    const allAffectedCols = new Set<number>();

    for (const chain of bigChains) {
      const comboLevel = this.comboSystem.hit();
      GameController.registerCombo(comboLevel);
      const score = this.scoreSystem.calculate(chain, comboLevel);
      GameController.addScore(score.total, chain.type);

      const { removedBlocks, affectedCols } = this.chainProcessor.process(this.grid, chain);
      affectedCols.forEach(c => allAffectedCols.add(c));
      this.playDestroyVFX(removedBlocks, score.total);

      this.playDestroyAnimation(removedBlocks, () => {
        processed++;
        if (processed >= bigChains.length) {
          this.applyGravityAndRefill([...allAffectedCols], () => {
            // Recursivo — sigue buscando cascades
            this.time.delayedCall(200, () => this.checkCascade(onComplete));
          });
        }
      });
    }
  }

  // ==================== HELPERS ====================

  private applyGravityAndRefill(affectedCols: number[], onComplete: () => void): void {
    const fallen = this.chainProcessor.applyGravity(this.grid, affectedCols);
    this.updateFallenViews(fallen, () => {
      const newBlocks = this.gridRefiller.refillCols(this.grid, affectedCols);
      this.spawnNewBlockViews(newBlocks, onComplete);
    });
  }

  private getMostCommonType(): BlockType {
    const counts = new Map<BlockType, number>();
    for (const block of this.grid.getAll()) {
      counts.set(block.type, (counts.get(block.type) ?? 0) + 1);
    }
    let max = 0;
    let result = BlockType.RED;
    for (const [type, count] of counts) {
      if (count > max) { max = count; result = type; }
    }
    return result;
  }

  private playDestroyVFX(blocks: Block[], score: number): void {
    const positions = blocks.map(b => ({
      x: this.gridToWorld(b.row, b.col).x,
      y: this.gridToWorld(b.row, b.col).y,
      type: b.type,
    }));
    this.vfx.playChainExplosion(positions);

    if (positions.length > 0) {
      const cx = positions.reduce((s, b) => s + b.x, 0) / positions.length;
      const cy = positions.reduce((s, b) => s + b.y, 0) / positions.length;
      this.vfx.showFloatingScore(cx, cy, score);
    }
  }

  // ==================== ANIMACIONES ====================

  private playDestroyAnimation(blocks: Block[], onComplete: () => void): void {
    if (blocks.length === 0) { onComplete(); return; }
    let completed = 0;

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
    GameController.endGame();
    this.isProcessing = false;
    this.uiManager.showToast('No more moves!', 2000, '#ff4444');
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
