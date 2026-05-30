// ============================================
// CHAIN EVALUATOR — Detecta cadenas de bloques del mismo tipo
// ============================================

import { Grid } from '../grid/Grid';
import { Block } from '../blocks/Block';
import { BlockType } from '../blocks/BlockType';
import { Logger } from '../../core/Logger';

export interface Chain {
  blocks: Block[];
  type: BlockType;
}

export class ChainEvaluator {
  private minChainLength: number;

  constructor(minChainLength = 2) {
    this.minChainLength = minChainLength;
  }

  // Evalúa cadena a partir de un bloque tocado
  evaluate(grid: Grid, startRow: number, startCol: number): Chain | null {
    const startBlock = grid.get(startRow, startCol);
    if (!startBlock || startBlock.type === BlockType.EMPTY) return null;

    const visited = new Set<string>();
    const chain: Block[] = [];

    this.floodFill(grid, startRow, startCol, startBlock.type, visited, chain);

    if (chain.length < this.minChainLength) {
      Logger.debug(`[ChainEvaluator] Chain too short: ${chain.length}`);
      return null;
    }

    Logger.info(`[ChainEvaluator] Chain found: ${chain.length} blocks of type ${startBlock.type}`);
    return { blocks: chain, type: startBlock.type };
  }

  // Evalúa todas las cadenas posibles en el grid
  evaluateAll(grid: Grid): Chain[] {
    const visited = new Set<string>();
    const chains: Chain[] = [];

    for (let r = 0; r < grid.rows; r++) {
      for (let c = 0; c < grid.cols; c++) {
        const key = `${r},${c}`;
        if (visited.has(key)) continue;

        const block = grid.get(r, c);
        if (!block || block.type === BlockType.EMPTY) continue;

        const chain: Block[] = [];
        const groupVisited = new Set<string>();
        this.floodFill(grid, r, c, block.type, groupVisited, chain);

        for (const k of groupVisited) visited.add(k);

        if (chain.length >= this.minChainLength) {
          chains.push({ blocks: chain, type: block.type });
        }
      }
    }

    return chains;
  }

  hasAnyChain(grid: Grid): boolean {
    return this.evaluateAll(grid).length > 0;
  }

  private floodFill(
    grid: Grid,
    row: number,
    col: number,
    type: BlockType,
    visited: Set<string>,
    chain: Block[]
  ): void {
    const key = `${row},${col}`;
    if (visited.has(key)) return;

    const block = grid.get(row, col);
    if (!block || block.type !== type) return;

    visited.add(key);
    chain.push(block);

    const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
    for (const [dr, dc] of dirs) {
      this.floodFill(grid, row + dr, col + dc, type, visited, chain);
    }
  }
}
// EOF