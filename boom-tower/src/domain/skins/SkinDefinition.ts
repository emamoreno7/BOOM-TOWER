export interface SkinDefinition {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: 'coins' | 'gems';
  isDefault: boolean;
  isUnlocked: boolean;
  blockColors: Record<string, number>;
  particleColor: number;
  bgColor: number;
}

export const DEFAULT_SKINS: SkinDefinition[] = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'The original BOOM TOWER look',
    price: 0,
    currency: 'coins',
    isDefault: true,
    isUnlocked: true,
    blockColors: {
      RED: 0xff4444,
      BLUE: 0x4488ff,
      GREEN: 0x44cc44,
      YELLOW: 0xffdd00,
      PURPLE: 0xaa44ff,
    },
    particleColor: 0xffffff,
    bgColor: 0x1a1a2e,
  },
  {
    id: 'neon',
    name: 'Neon',
    description: 'Glowing neon colors',
    price: 500,
    currency: 'coins',
    isDefault: false,
    isUnlocked: false,
    blockColors: {
      RED: 0xff0066,
      BLUE: 0x00ffff,
      GREEN: 0x00ff88,
      YELLOW: 0xffff00,
      PURPLE: 0xcc00ff,
    },
    particleColor: 0x00ffff,
    bgColor: 0x0a0a0a,
  },
  {
    id: 'pastel',
    name: 'Pastel',
    description: 'Soft pastel tones',
    price: 300,
    currency: 'coins',
    isDefault: false,
    isUnlocked: false,
    blockColors: {
      RED: 0xffaaaa,
      BLUE: 0xaaccff,
      GREEN: 0xaaffcc,
      YELLOW: 0xfffaaa,
      PURPLE: 0xddaaff,
    },
    particleColor: 0xffddff,
    bgColor: 0x2a1a2e,
  },
  {
    id: 'fire',
    name: 'Fire',
    description: 'Blazing hot colors',
    price: 5,
    currency: 'gems',
    isDefault: false,
    isUnlocked: false,
    blockColors: {
      RED: 0xff2200,
      BLUE: 0xff6600,
      GREEN: 0xff9900,
      YELLOW: 0xffcc00,
      PURPLE: 0xff4400,
    },
    particleColor: 0xff6600,
    bgColor: 0x1a0800,
  },
];
