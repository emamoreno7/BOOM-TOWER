import { EventBus } from '../../core/EventBus';
import { Logger } from '../../core/Logger';

// ============================================
// SKIN SYSTEM — Sistema de skins de bloques
// ============================================

export interface Skin {
  id: string;
  name: string;
  tier: 'basic' | 'premium' | 'legendary';
  colors: Record<string, number>;
  unlockId?: string;
}

const DEFAULT_SKINS: Skin[] = [
  {
    id: 'default',
    name: 'Clasico',
    tier: 'basic',
    colors: {
      RED: 0xff4444, BLUE: 0x4488ff, GREEN: 0x44cc44,
      YELLOW: 0xffdd00, PURPLE: 0xaa44ff,
    },
  },
  {
    id: 'neon',
    name: 'Neon',
    tier: 'basic',
    colors: { RED: 0xff0066, BLUE: 0x00ffff, GREEN: 0x00ff88,
      YELLOW: 0xffff00, PURPLE: 0xff00ff,
    },
    unlockId: 'skin_rare_1',
  },
  {
    id: 'pastel',
    name: 'Pastel',
    tier: 'premium',
    colors: {
      RED: 0xffaaaa, BLUE: 0xaaccff, GREEN: 0xaaffcc,
      YELLOW: 0xffffaa, PURPLE: 0xddaaff,
    },
    unlockId: 'skin_epic_1',
  },
  {
    id: 'gold',
    name: 'Dorado',
    tier: 'legendary',
    colors: {
      RED: 0xff8800, BLUE: 0xffcc00, GREEN: 0xffee00,
      YELLOW: 0xffd700, PURPLE: 0xff9900,
    },
    unlockId: 'skin_legendary_1',
  },
];

class SkinSystem_ {
  private static instance: SkinSystem_;
  private skins: Map<string, Skin> = new Map();
  private equippedSkinId = 'default';
  private ownedSkinIds = new Set<string>(['default']);

  private constructor() {
    for (const skin of DEFAULT_SKINS) this.skins.set(skin.id, skin);
    Logger.system('SkinSystem initialized');
  }

  static getInstance(): SkinSystem_ {
    if (!SkinSystem_.instance) {
      SkinSystem_.instance = new SkinSystem_();
    }
    return SkinSystem_.instance;
  }

  unlockSkin(skinId: string): boolean {
    if (!this.skins.has(skinId)) return false;
    if (this.ownedSkinIds.has(skinId)) return false;
    this.ownedSkinIds.add(skinId);
    EventBus.emit('skin:unlocked', { skinId });
    Logger.info('[SkinSystem] Skin unlocked: ' + skinId);
    return true;
  }

  equipSkin(skinId: string): boolean {
    if (!this.ownedSkinIds.has(skinId)) return false;
    this.equippedSkinId = skinId;
    EventBus.emit('skin:equipped', { skinId });
    Logger.info('[SkinSystem] Skin equipped: ' + skinId);
    return true;
  }

  getEquipped(): Skin {
    return this.skins.get(this.equippedSkinId) ?? DEFAULT_SKINS[0];
  }

  getEquippedColors(): Record<string, number> {
    return this.getEquipped().colors;
  }

  getAll(): Skin[]              { return [...this.skins.values()]; }
  getOwned(): Skin[]            { return this.getAll().filter(s => this.ownedSkinIds.has(s.id)); }
  getLocked(): Skin[]           { return this.getAll().filter(s => !this.ownedSkinIds.has(s.id)); }
  isOwned(id: string): boolean  { return this.ownedSkinIds.has(id); }

  restore(state: { equippedId: string; ownedIds: string[] }): void {
    this.equippedSkinId = state.equippedId;
    this.ownedSkinIds   = new Set(state.ownedIds);
  }

  serialize(): { equippedId: string; ownedIds: string[] } {
    return { equippedId: this.equippedSkinId, ownedIds: [...this.ownedSkinIds] };
  }
}

export const SkinSystem = SkinSystem_.getInstance();
