// ============================================
// CHAIN PROCESSOR — Procesa y elimina cadenas del grid
// ============================================

import { Grid } from '../grid/Grid';
import { Chain } from './ChainEvaluator';
import { Block } from '../blocks/Block';
import { Logger } from '../../core/Logger';

export interface ProcessResult {
  removedBlocks: Block[];
  affectedCols: number[];
}

export class ChainProcessor {

  process(grid: Grid, chain: Chain): ProcessResult {
    const removedBlocks: Block[] = [];
    const affectedCols = new Set<number>();

    for (const block of chain.blocks) {
      const removed = grid.remove(block.row, block.col);
      if (removed) {
        removedBlocks.push(removed);
        affectedCols.add(removed.col);
      }
    }

    Logger.info(`[ChainProcessor] Removed ${removedBlocks.length} blocks`);
    return { removedBlocks, affectedCols: [...affectedCols] };
  }

  // Aplica gravedad: bloques caen hacia abajo
  applyGravity(grid: Grid, affectedCols: number[]): Block[] {
    const fallen: Block[] = [];

    for (const col of affectedCols) {
      const column = grid.getColumn(col);
      const blocks = column.filter((b): b is Block => b !== null);

      // Limpiar columna
      for (let r = 0; r < grid.rows; r++) {
        grid.set(r, col, null);
      }

      // Recolocar desde abajo
      let row = grid.rows - 1;
      for (let i = blocks.length - 1; i >= 0; i--) {
        grid.set(row, col, blocks[i]);
        fallen.push(blocks[i]);
        row--;
      }
    }

    Logger.debug(`[ChainProcessor] Gravity applied to cols: ${affectedCols}`);
    return fallen;
  }
}
// EOF