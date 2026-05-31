import { SkinDefinition, DEFAULT_SKINS } from './SkinDefinition';
import { Logger } from '../../core/Logger';
import { EventBus } from '../../core/EventBus';

export class SkinSystem {
  private skins: Map<string, SkinDefinition> = new Map();
  private activeSkinId = 'classic';

  constructor() {
    for (const skin of DEFAULT_SKINS) {
      this.skins.set(skin.id, { ...skin });
    }
    Logger.info('[SkinSystem] Initialized');
  }

  getActiveSkin(): SkinDefinition {
    return this.skins.get(this.activeSkinId) ?? DEFAULT_SKINS[0];
  }

  setActiveSkin(id: string): boolean {
    const skin = this.skins.get(id);
    if (!skin) {
      Logger.warn(`[SkinSystem] Skin not found: ${id}`);
      return false;
    }
    if (!skin.isUnlocked) {
      Logger.warn(`[SkinSystem] Skin not unlocked: ${id}`);
      return false;
    }
    this.activeSkinId = id;
    EventBus.emit('skin:changed', { skinId: id });
    Logger.info(`[SkinSystem] Active skin: ${id}`);
    return true;
  }

  unlock(id: string): boolean {
    const skin = this.skins.get(id);
    if (!skin) return false;
    skin.isUnlocked = true;
    EventBus.emit('skin:unlocked', { skinId: id });
    Logger.info(`[SkinSystem] Unlocked skin: ${id}`);
    return true;
  }

  isUnlocked(id: string): boolean {
    return this.skins.get(id)?.isUnlocked ?? false;
  }

  getAll(): SkinDefinition[] {
    return [...this.skins.values()];
  }

  getUnlocked(): SkinDefinition[] {
    return this.getAll().filter(s => s.isUnlocked);
  }

  serialize(): { activeSkinId: string; unlockedIds: string[] } {
    return {
      activeSkinId: this.activeSkinId,
      unlockedIds: this.getUnlocked().map(s => s.id),
    };
  }

  restore(data: { activeSkinId: string; unlockedIds: string[] }): void {
    for (const id of data.unlockedIds) {
      const skin = this.skins.get(id);
      if (skin) skin.isUnlocked = true;
    }
    this.activeSkinId = data.activeSkinId;
    Logger.info('[SkinSystem] Restored');
  }
}
