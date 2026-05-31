import { Random } from '../../core/Random';

// ============================================
// LOOT TABLE — Tabla de recompensas por cofre
// ============================================

export type ChestTier = 'common' | 'rare' | 'epic' | 'legendary';

export interface LootEntry {
  type: 'coins' | 'gems' | 'skin' | 'xp';
  value: number | string;
  weight: number;
}

export interface LootResult {
  coins: number;
  gems: number;
  xp: number;
  skins: string[];
}

const LOOT_TABLES: Record<ChestTier, LootEntry[]> = {
  common: [
    { type: 'coins', value: 50,  weight: 50 },
    { type: 'coins', value: 100, weight: 30 },
    { type: 'xp',   value: 50,  weight: 15 },
    { type: 'gems', value: 1,   weight: 5  },
  ],
  rare: [
    { type: 'coins', value: 200,           weight: 40 },
    { type: 'coins', value: 400,           weight: 25 },
    { type: 'xp',   value: 200,           weight: 20 },
    { type: 'gems', value: 5,             weight: 10 },
  { type: 'skin', value: 'skin_rare_1', weight: 5  },
  ],
  epic: [
    { type: 'coins', value: 600,           weight: 30 },
    { type: 'gems', value: 15,            weight: 25 },
    { type: 'xp',   value: 500,           weight: 20 },
    { type: 'skin', value: 'skin_epic_1', weight: 15 },
    { type: 'skin', value: 'skin_epic_2', weight: 10 },
  ],
  legendary: [
    { type: 'coins', value: 1000,                weight: 20 },
    { type: 'gems', value: 50,                  weight: 25 },
    { type: 'xp',   value: 1000,                weight: 20 },
    { type: 'skin', value: 'skin_legendary_1',  weight: 20 },
    { type: 'skin', value: 'skin_legendary_2',  weight: 15 },
  ],
};

export class LootTable {
  roll(tier: ChestTier, rolls = 3): LootResult {
    const table = LOOT_TABLES[tier];
    const result: LootResult = { coins: 0, gems: 0, xp: 0, skins: [] };
    const weights = table.map(e => e.weight);

    for (let i = 0; i < rolls; i++) {
      const entry = Random.weightedPick(table, weights);
      if (entry.type === 'coins')     result.coins += entry.value as number;
      else if (entry.type === 'gems') result.gems  += entry.value as number;
      else if (entry.type === 'xp')  result.xp    += entry.value as number;
      else if (entry.type === 'skin') result.skins.push(entry.value as string);
    }

    return result;
  }
}
