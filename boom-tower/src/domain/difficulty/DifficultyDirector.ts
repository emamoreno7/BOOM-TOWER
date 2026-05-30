import { BlockFactory } from '../blocks/BlockFactory';
import { BlockType } from '../blocks/BlockType';
import { Logger } from '../../core/Logger';

export interface DifficultyLevel {
  minChain: number;
  typesAvailable: BlockType[];
  specialChance: number;
  label: string;
}

const LEVELS: DifficultyLevel[] = [
  {
    minChain: 2,
    typesAvailable: [BlockType.RED, BlockType.BLUE, BlockType.GREEN],
    specialChance: 0.03,
    label: 'Easy',
  },
  {
    minChain: 2,
    typesAvailable: [BlockType.RED, BlockType.BLUE, BlockType.GREEN, BlockType.YELLOW],
    specialChance: 0.05,
    label: 'Normal',
  },
  {
    minChain: 2,
    typesAvailable: [BlockType.RED, BlockType.BLUE, BlockType.GREEN, BlockType.YELLOW, BlockType.PURPLE],
    specialChance: 0.08,
    label: 'Hard',
  },
  {
    minChain: 2,
    typesAvailable: [BlockType.RED, BlockType.BLUE, BlockType.GREEN, BlockType.YELLOW, BlockType.PURPLE],
    specialChance: 0.12,
    label: 'Insane',
  },
];

const SCORE_THRESHOLDS = [0, 2000, 8000, 20000];

export class DifficultyDirector {
  private currentLevel = 0;

  evaluate(score: number, factory: BlockFactory): void {
    let newLevel = 0;
    for (let i = SCORE_THRESHOLDS.length - 1; i >= 0; i--) {
      if (score >= SCORE_THRESHOLDS[i]) {
        newLevel = i;
        break;
      }
    }

    if (newLevel !== this.currentLevel) {
      this.currentLevel = newLevel;
      const level = LEVELS[this.currentLevel];
      Logger.info(`[DifficultyDirector] Level up: ${level.label}`);

      // Ajustar pesos normales
      for (const type of Object.values(BlockType)) {
        if (type === BlockType.EMPTY) continue;
        const available = level.typesAvailable.includes(type as BlockType);
        if (available) factory.setWeight(type as BlockType, 1);
      }

      // Ajustar chance de especiales
      factory.setSpecialChance(level.specialChance);
    }
  }

  getCurrentLevel(): DifficultyLevel {
    return LEVELS[this.currentLevel];
  }

  getCurrentLevelIndex(): number {
    return this.currentLevel;
  }
}
