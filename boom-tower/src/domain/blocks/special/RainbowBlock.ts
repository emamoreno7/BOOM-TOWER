import { BlockType, isPlayable } from '../BlockType';
import { Grid } from '../../grid/Grid';
import { SpecialBlockResult } from './BombBlock';

// ============================================
// RAINBOW BLOCK — Elimina todos los bloques del color más abundante
// ============================================
export class RainbowBlock {
  static readonly TYPE = BlockType.RAINBOW;

  static activate(grid: Grid, _row: number, _col: number): SpecialBlockResult {
    const counts: Partial<Record<BlockType, number>> = {};

    for (let r = 0; r < grid.rows; r++) {
      for (let c = 0; c < grid.cols; c++) {
        const block = grid.get(r, c);
        if (block && isPlayable(block.type)) {
          counts[block.type] = (counts[block.type] ?? 0) + 1;
        }
      }
    }

    const dominant = (Object.entries(counts) as [BlockType, number][])
      .sort((a, b) => b[1] - a[1])[0]?.[0];

    if (!dominant) return { affectedCells: [], score: 0, type: BlockType.RAINBOW };

    const affected: Array<{ row: number; col: number }> = [];
    for (let r = 0; r < grid.rows; r++) {
      for (let c = 0; c < grid.cols; c++) {
        if (grid.get(r, c)?.type === dominant) affected.push({ row: r, col: c });
      }
    }

    return {
      affectedCells: affected,
      score: affected.length * 200,
      type: BlockType.RAINBOW,
    };
  }
}
