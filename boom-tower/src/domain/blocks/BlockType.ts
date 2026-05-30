export enum BlockType {
  RED    = 'RED',
  BLUE   = 'BLUE',
  GREEN  = 'GREEN',
  YELLOW = 'YELLOW',
  PURPLE = 'PURPLE',
  BOMB   = 'BOMB',
  LIGHTNING = 'LIGHTNING',
  RAINBOW   = 'RAINBOW',
  JACKPOT   = 'JACKPOT',
  EMPTY  = 'EMPTY',
}

export const BLOCK_COLORS: Record<BlockType, number> = {
  [BlockType.RED]:       0xff4444,
  [BlockType.BLUE]:      0x4488ff,
  [BlockType.GREEN]:     0x44cc44,
  [BlockType.YELLOW]:    0xffdd00,
  [BlockType.PURPLE]:    0xaa44ff,
  [BlockType.BOMB]:      0xff6600,
  [BlockType.LIGHTNING]: 0xffff00,
  [BlockType.RAINBOW]:   0xff88ff,
  [BlockType.JACKPOT]:   0xffd700,
  [BlockType.EMPTY]:     0x000000,
};

export const BLOCK_SCORE: Record<BlockType, number> = {
  [BlockType.RED]:       100,
  [BlockType.BLUE]:      100,
  [BlockType.GREEN]:     100,
  [BlockType.YELLOW]:    150,
  [BlockType.PURPLE]:    200,
  [BlockType.BOMB]:      500,
  [BlockType.LIGHTNING]: 500,
  [BlockType.RAINBOW]:   800,
  [BlockType.JACKPOT]:   1000,
  [BlockType.EMPTY]:     0,
};

export const PLAYABLE_TYPES = [
  BlockType.RED,
  BlockType.BLUE,
  BlockType.GREEN,
  BlockType.YELLOW,
  BlockType.PURPLE,
];

export const SPECIAL_TYPES = [
  BlockType.BOMB,
  BlockType.LIGHTNING,
  BlockType.RAINBOW,
  BlockType.JACKPOT,
];

export function isSpecial(type: BlockType): boolean {
  return SPECIAL_TYPES.includes(type);
}
