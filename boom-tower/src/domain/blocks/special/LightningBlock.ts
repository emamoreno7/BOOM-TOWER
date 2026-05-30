import { BlockType } from '../BlockType';
import { Grid } from '../../grid/Grid';
import { SpecialBlockResult } from './BombBlock';

// ============================================
// LIGHTNING BLOCK — Elimina fila y columna completa
// ============================================
export class LightningBlock {
  static readonly TYPE = BlockType.LIGHTNING;

  static activate(grid: Grid, row: number, col: number): SpecialBlockResult {
    const affected: Array<{ row: number; col: number }> = [];

    for (let c = 0; c < grid.cols; c++) {
      if (!grid.isEmpty(row, c)) affected.push({ row, col: c });
    }

    for (let r = 0; r < grid.rows; r++) {
      if (r !== row && !grid.isEmpty(r, col)) affected.push({ row: r, col });
    }

    return {
      affectedCells: affected,
      score: affected.length * 120,
      type: BlockType.LIGHTNING,
    };
  }
}
