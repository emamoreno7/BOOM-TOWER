// ============================================
// GRID — Tablero de juego
// ============================================

import { Block } from '../blocks/Block';
import { BlockType } from '../blocks/BlockType';
import { Logger } from '../../core/Logger';

export interface GridConfig {
  rows: number;
  cols: number;
}

export class Grid {
  readonly rows: number;
  readonly cols: number;
  private cells: (Block | null)[][];

  constructor(config: GridConfig) {
    this.rows = config.rows;
    this.cols = config.cols;
    this.cells = Array.from({ length: config.rows }, () =>
      Array(config.cols).fill(null)
    );
    Logger.info(`[Grid] Created ${config.rows}x${config.cols}`);
  }

  get(row: number, col: number): Block | null {
    if (!this.inBounds(row, col)) return null;
    return this.cells[row][col];
  }

  set(row: number, col: number, block: Block | null): void {
    if (!this.inBounds(row, col)) return;
    this.cells[row][col] = block;
    if (block) {
      block.row = row;
      block.col = col;
    }
  }

  remove(row: number, col: number): Block | null {
    const block = this.cells[row][col];
    this.cells[row][col] = null;
    return block;
  }

  inBounds(row: number, col: number): boolean {
    return row >= 0 && row < this.rows && col >= 0 && col < this.cols;
  }

  getNeighbors(row: number, col: number): Block[] {
    const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
    const neighbors: Block[] = [];
    for (const [dr, dc] of dirs) {
      const b = this.get(row + dr, col + dc);
      if (b) neighbors.push(b);
    }
    return neighbors;
  }

  getAll(): Block[] {
    const blocks: Block[] = [];
    for (const row of this.cells) {
      for (const cell of row) {
        if (cell) blocks.push(cell);
      }
    }
    return blocks;
  }

  getColumn(col: number): (Block | null)[] {
    return this.cells.map(row => row[col]);
  }

  isEmpty(row: number, col: number): boolean {
    return this.get(row, col) === null;
  }

  isFull(): boolean {
    return this.getAll().length === this.rows * this.cols;
  }

  countEmpty(): number {
    return this.rows * this.cols - this.getAll().length;
  }

  clear(): void {
    this.cells = Array.from({ length: this.rows }, () =>
      Array(this.cols).fill(null)
    );
  }

  debug(): string {
    return this.cells
      .map(row => row.map(c => (c ? c.type[0] : '.')).join(' '))
      .join('\n');
  }
}
// EOF