import { BlockType } from '../BlockType';
import { Grid } from '../../grid/Grid';

// ============================================
// BOMB BLOCK — Explosión en área 3x3
// ============================================
export interface SpecialBlockResult {
  affectedCells: Array<{ row: number; col: number }>;
  score: number;
  type: BlockType;
}

export class BombBlock {
  static readonly TYPE = BlockType.BOMB;
  static readonly RADIUS = 1;

  static activate(grid: Grid, row: number, col: number): SpecialBlockResult {
    const affected: Array<{ row: number; col: number }> = [];

    for (let r = row - this.RADIUS; r <= row + this.RADIUS; r++) {
      for (let c = col - this.RADIUS; c <= col + this.RADIUS; c++) {
        if (grid.inBounds(r, c) && !grid.isEmpty(r, c)) {
          affected.push({ row: r, col: c });
        }
      }
    }

    return {
      affectedCells: affected,
      score: affected.length * 150,
      type: BlockType.BOMB,
};
  }
}
