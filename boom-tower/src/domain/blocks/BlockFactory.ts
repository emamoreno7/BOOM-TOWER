import { Block, createBlock } from './Block';
import { BlockType, PLAYABLE_TYPES } from './BlockType';

export class BlockFactory {
  private weights: Map<BlockType, number>;

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
    return createBlock(resolvedType, row, col);
  }

  setWeight(type: BlockType, weight: number): void {
    this.weights.set(type, weight);
  }

  private pickRandom(): BlockType {
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
}
// EOF