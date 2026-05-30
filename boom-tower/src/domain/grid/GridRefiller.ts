// ============================================
// GRID REFILLER — Rellena el grid con bloques nuevos
// ============================================

import { Grid } from './Grid';
import { Block } from '../blocks/Block';
import { BlockFactory } from '../blocks/BlockFactory';
import { Logger } from '../../core/Logger';

export class GridRefiller {
  private factory: BlockFactory;

  constructor(factory: BlockFactory) {
    this.factory = factory;
  }

  // Rellena todas las celdas vacías desde arriba
  refill(grid: Grid): Block[] {
    const newBlocks: Block[] = [];

    for (let col = 0; col < grid.cols; col++) {
      for (let row = 0; row < grid.rows; row++) {
        if (grid.isEmpty(row, col)) {
          const block = this.factory.create(row, col);
          grid.set(row, col, block);
          newBlocks.push(block);
        }
      }
    }

    Logger.info(`[GridRefiller] Added ${newBlocks.length} new blocks`);
    return newBlocks;
  }

  // Rellena solo columnas específicas
  refillCols(grid: Grid, cols: number[]): Block[] {
    const newBlocks: Block[] = [];

    for (const col of cols) {
      for (let row = 0; row < grid.rows; row++) {
        if (grid.isEmpty(row, col)) {
          const block = this.factory.create(row, col);
          grid.set(row, col, block);
          newBlocks.push(block);
        }
      }
    }

    return newBlocks;
  }
}
// EOF