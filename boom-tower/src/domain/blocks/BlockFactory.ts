import { Block, createBlock } from './Block';
import { BlockType, PLAYABLE_TYPES, SPECIAL_TYPES } from './BlockType';
import { Logger } from '../../core/Logger';

export class BlockFactory {
  private weights: Map<BlockType, number>;
  private specialChance = 0.05;
  private totalBlocksCreated = 0;

  constructor() {
    this.weights = new Map([
      [BlockType.RED,    1],
      [BlockType.BLUE,   1],
      [BlockType.GREEN,  1],
      [BlockType.YELLOW, 0.7],
      [BlockType.PURPLE, 0.5],
    ]);
  }

  create(row: number, col: number, type?: BlockType): Block {
    const resolvedType = type ?? this.pickRandom();
    this.totalBlocksCreated++;
    return createBlock(resolvedType, row, col);
  }

  setWeight(type: BlockType, weight: number): void {
    this.weights.set(type, weight);
  }

  setSpecialChance(chance: number): void {
    this.specialChance = Math.max(0, Math.min(0.3, chance));
    Logger.debug(`[BlockFactory] Special chance: ${this.specialChance}`);
  }

  private pickRandom(): BlockType {
    // Intentar especial
    if (Math.random() < this.specialChance) {
      return this.pickSpecial();
    }
    return this.pickNormal();
  }

  private pickNormal(): BlockType {
    const total = PLAYABLE_TYPES.reduce(
      (sum, t) => sum + (this.weights.get(t) ?? 1), 0
    );
    let rand = Math.random() * total;
    for (const type of PLAYABLE_TYPES) {
      rand -= this.weights.get(type) ?? 1;
      if (rand <= 0) return type;
    }
    return BlockType.RED;
  }

  private pickSpecial(): BlockType {
    // Pesos de especiales: Bomba más común, Jackpot más raro
    const specialWeights = [
      { type: BlockType.BOMB,      weight: 0.4 },
      { type: BlockType.LIGHTNING, weight: 0.35 },
      { type: BlockType.RAINBOW,   weight: 0.15 },
      { type: BlockType.JACKPOT,   weight: 0.1 },
    ];
    const total = specialWeights.reduce((s, w) => s + w.weight, 0);
    let rand = Math.random() * total;
    for (const { type, weight } of specialWeights) {
      rand -= weight;
      if (rand <= 0) return type;
    }
    return BlockType.BOMB;
  }

  getStats(): { totalCreated: number; specialChance: number } {
    return {
      totalCreated: this.totalBlocksCreated,
      specialChance: this.specialChance,
    };
  }
}
