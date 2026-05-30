// ============================================
// DIFFICULTY DIRECTOR — Ajusta la dificultad según el progreso
// ============================================

import { BlockFactory } from '../blocks/BlockFactory';
import { BlockType } from '../blocks/BlockType';
import { Logger } from '../../core/Logger';

export interface DifficultyLevel {
  minChain: number;
  typesAvailable: BlockType[];
  label: string;
}

const LEVELS: DifficultyLevel[] = [
  { minChain: 2, typesAvailable: [BlockType.RED, BlockType.BLUE, BlockType.GREEN], label: 'Easy' },
  { minChain: 2, typesAvailable: [BlockType.RED, BlockType.BLUE, BlockType.GREEN, BlockType.YELLOW], label: 'Normal' },
  { minChain: 2, typesAvailable: [BlockType.RED, BlockType.BLUE, BlockType.GREEN, BlockType.YELLOW, BlockType.PURPLE], label: 'Hard' },
];

export class DifficultyDirector {
  private currentLevel = 0;
  private scoreThresholds = [0, 2000, 8000];

  evaluate(score: number, factory: BlockFactory): void {
    let newLevel = 0;
    for (let i = this.scoreThresholds.length - 1; i >= 0; i--) {
      if (score >= this.scoreThresholds[i]) {
        newLevel = i;
        break;
      }
    }

    if (newLevel !== this.currentLevel) {
      this.currentLevel = newLevel;
      const level = LEVELS[this.currentLevel];
      Logger.info(`[DifficultyDirector] Level up: ${level.label}`);

      // Ajustar pesos del factory
      for (const type of Object.values(BlockType)) {
        if (type === BlockType.EMPTY) continue;
        const available = level.typesAvailable.includes(type as BlockType);
        factory.setWeight(type as BlockType, available ? 1 : 0);
      }
    }
  }

  getCurrentLevel(): DifficultyLevel {
    return LEVELS[this.currentLevel];
  }
}
// EOF