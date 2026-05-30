import { Block, createBlock } from '../Block';
import { BlockType } from '../BlockType';
import { Grid } from '../../grid/Grid';

export interface BombBlock extends Block {
  specialType: 'BOMB';
  radius: number;
}

export function createBombBlock(row: number, col: number): BombBlock {
  const base = createBlock(BlockType.RED, row, col);
  return { ...base, specialType: 'BOMB', radius: 1 };
}

export function getBombExplosionCells(
  grid: Grid,
  row: number,
  col: number,
  radius: number
): Block[] {
  const affected: Block[] = [];
  for (let r = row - radius; r <= row + radius; r++) {
    for (let c = col - radius; c <= col + radius; c++) {
      const block = grid.get(r, c);
      if (block) affected.push(block);
    }
  }
  return affected;
}
