// ============================================
// SCORE SYSTEM — Calcula puntuación por cadena
// ============================================

import { Chain } from '../chain/ChainEvaluator';
import { BLOCK_SCORE } from '../blocks/BlockType';
import { Logger } from '../../core/Logger';

export interface ScoreResult {
  base: number;
  multiplier: number;
  total: number;
  breakdown: string;
}

export class ScoreSystem {

  calculate(chain: Chain, combo: number): ScoreResult {
    const base = chain.blocks.length * (BLOCK_SCORE[chain.type] ?? 100);
    const sizeBonus = this.getSizeBonus(chain.blocks.length);
    const multiplier = this.getComboMultiplier(combo) * sizeBonus;
    const total = Math.floor(base * multiplier);

    const breakdown = `${chain.blocks.length} blocks × ${BLOCK_SCORE[chain.type]} × ${multiplier.toFixed(1)}x`;
    Logger.debug(`[ScoreSystem] ${breakdown} = ${total}`);

    return { base, multiplier, total, breakdown };
  }

  private getSizeBonus(size: number): number {
    if (size >= 20) return 3;
    if (size >= 10) return 2;
    if (size >= 6)  return 1.5;
    return 1;
  }

  private getComboMultiplier(combo: number): number {
    if (combo >= 100) return 10;
    if (combo >= 50)  return 7;
    if (combo >= 25)  return 5;
    if (combo >= 10)  return 3;
    if (combo >= 5)   return 2;
    return 1;
  }
}
// EOF