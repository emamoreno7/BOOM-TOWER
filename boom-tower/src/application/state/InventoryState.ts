import { ChestInventory } from '../../domain/chests/ChestSystem';

// ============================================
// INVENTORY STATE — Estado del inventario del jugador
// ============================================

export interface InventoryState {
  ownedSkinIds: string[];
  equippedSkinId: string;
  chests: ChestInventory;
  achievementsCompleted: string[];
  unlocksGranted: string[];
  missions: import('../../domain/missions/MissionGenerator').Mission[];
}

export function createInitialInventoryState(): InventoryState {
  return {
    ownedSkinIds: ['default'],
    equippedSkinId: 'default',
    chests: { common: 0, rare: 0, epic: 0, legendary: 0 },
    achievementsCompleted: [],
    unlocksGranted: [],
    missions: [],
  };
}
