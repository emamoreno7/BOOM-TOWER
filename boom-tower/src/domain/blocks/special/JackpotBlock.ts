import { BlockType } from '../BlockType';
import { Grid } from '../../grid/Grid';
import { SpecialBlockResult } from './BombBlock';

// ============================================
// JACKPOT BLOCK — Multiplicador masivo de score
// ============================================
export class JackpotBlock {
  static readonly TYPE = BlockType.JACKPOT;
  static readonly MULTIPLIER = 5;
  static readonly RADIUS = 2;
  static readonlRADIUS = 2;

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
      score: affected.length * 500 * this.MULTIPLIER,
      type: BlockType.JACKPOT,
    };
  }
}
