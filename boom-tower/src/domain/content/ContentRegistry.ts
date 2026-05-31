import { Logger } from '../../core/Logger';

export interface ContentEntry {
  id: string;
  type: 'skin' | 'theme' | 'block' | 'event';
  unlocked: boolean;
  requiredLevel?: number;
  requiredAchievement?: string;
}

export class ContentRegistry {
  private entries: Map<string, ContentEntry> = new Map();

  register(entry: ContentEntry): void {
    this.entries.set(entry.id, entry);
  }

  unlock(id: string): boolean {
    const entry = this.entries.get(id);
    if (!entry) return false;
    entry.unlocked = true;
    Logger.info(`[ContentRegistry] Unlocked: ${id}`);
    return true;
  }

  isUnlocked(id: string): boolean {
    return this.entries.get(id)?.unlocked ?? false;
  }

  getByType(type: ContentEntry['type']): ContentEntry[] {
    return [...this.entries.values()].filter(e => e.type === type);
  }

  getUnlocked(): ContentEntry[] {
    return [...this.entries.values()].filter(e => e.unlocked);
  }

  serialize(): ContentEntry[] {
    return [...this.entries.values()];
  }

  restore(entries: ContentEntry[]): void {
    for (const entry of entries) {
      this.entries.set(entry.id, entry);
    }
    Logger.info('[ContentRegistry] Restored');
  }
}
