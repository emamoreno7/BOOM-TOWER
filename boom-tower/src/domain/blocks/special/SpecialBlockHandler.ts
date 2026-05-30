import { Grid } from '../../grid/Grid';
import { Block } from '../Block';
import { BlockType, isSpecial } from '../BlockType';
import { getBombExplosionCells } from './BombBlock';
import { getLightningCells } from './LightningBlock';
import { getRainbowCells } from './RainbowBlock';
import { getJackpotCells } from './JackpotBlock';
import { Logger } from '../../../core/Logger';

export interface SpecialResult {
  affectedBlocks: Block[];
  specialType: BlockType;
  scoreMultiplier: number;
}

export function handleSpecialBlock(
  grid: Grid,
  block: Block,
  targetType?: BlockType
): SpecialResult | null {
  if (!isSpecial(block.type)) return null;

  let affectedBlocks: Block[] = [];
  let scoreMultiplier = 1;

  switch (block.type) {
    case BlockType.BOMB:
      affectedBlocks = getBombExplosionCells(grid, block.row, block.col, 1);
      scoreMultiplier = 2;
      Logger.info('[Special] BOMB triggered');
      break;

    case BlockType.LIGHTNING:
      const dir = Math.random() > 0.5 ? 'ROW' : 'COL';
      affectedBlocks = getLightningCells(grid, block.row, block.col, dir);
      scoreMultiplier = 2;
      Logger.info(`[Special] LIGHTNING triggered (${dir})`);
      break;

    case BlockType.RAINBOW:
      const target = targetType ?? BlockType.RED;
      affectedBlocks = getRainbowCells(grid, target);
      scoreMultiplier = 3;
      Logger.info(`[Special] RAINBOW triggered (type: ${target})`);
      break;

    case BlockType.JACKPOT:
      affectedBlocks = getJackpotCells(grid);
      scoreMultiplier = 5;
      Logger.info('[Special] JACKPOT triggered');
      break;
  }

  return { affectedBlocks, specialType: block.type, scoreMultiplier };
}
