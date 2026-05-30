import { Block, createBlock } from '../Block';
import { BlockType } from '../BlockType';
import { Grid } from '../../grid/Grid';

export interface LightningBlock extends Block {
  specialType: 'LIGHTNING';
  direction: 'ROW' | 'COL';
}

export function createLightningBlock(row: number, col: number, direction: 'ROW' | 'COL' = 'ROW'): LightningBlock {
  const base = createBlock(BlockType.YELLOW, row, col);
  return { ...base, specialType: 'LIGHTNING', direction };
}

export function getLightningCells(grid: Grid, row: number, col: number, direction: 'ROW' | 'COL'): Block[] {
  const affected: Block[] = [];
  if (direction === 'ROW') {
    for (let c = 0; c < grid.cols; c++) {
      const block = grid.get(row, c);
      if (block) affected.push(block);
    }
  } else {
    for (let r = 0; r < grid.rows; r++) {
      const block = grid.get(r, col);
      if (block) affected.push(block);
    }
  }
  return affected;
}
