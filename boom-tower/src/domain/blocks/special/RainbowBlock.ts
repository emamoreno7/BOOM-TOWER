import { Block, createBlock } from '../Block';
import { BlockType } from '../BlockType';
import { Grid } from '../../grid/Grid';

export interface RainbowBlock extends Block {
  specialType: 'RAINBOW';
}

export function createRainbowBlock(row: number, col: number): RainbowBlock {
  const base = createBlock(BlockType.PURPLE, row, col);
  return { ...base, specialType: 'RAINBOW' };
}

export function getRainbowCells(grid: Grid, targetType: BlockType): Block[] {
  return grid.getAll().filter(b => b.type === targetType);
}
