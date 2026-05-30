
import { BlockType } from './BlockType';

export interface Block {
  id: string;
  type: BlockType;
  row: number;
  col: number;
  isMarked: boolean;
  isExploding: boolean;
}

let nextId = 0;

export function createBlock(type: BlockType, row: number, col: number): Block {
  return {
    id: `block_${nextId++}`,
    type,
    row,
    col,
    isMarked: false,
    isExploding: false,
  };
}

export function cloneBlock(block: Block): Block {
  return { ...block };
}
// EOF