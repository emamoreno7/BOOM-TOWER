import { Block, createBlock } from '../Block';
import { BlockType } from '../BlockType';
import { Grid } from '../../grid/Grid';

export interface JackpotBlock extends Block {
  specialType: 'JACKPOT';
  multiplier: number;
}

export function createJackpotBlock(row: number, col: number): JackpotBlock {
  const base = createBlock(BlockType.YELLOW, row, col);
  return { ...base, specialType: 'JACKPOT', multiplier: 5 };
}

export function getJackpotCells(grid: Grid): Block[] {
  return grid.getAll();
}
