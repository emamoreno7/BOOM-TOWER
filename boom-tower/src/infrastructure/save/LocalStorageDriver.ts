import { Logger } from '../../core/Logger';
import type { StorageDriver } from './SaveSystem';

// ============================================
// LOCAL STORAGE DRIVER
// ============================================

export class LocalStorageDriver implements StorageDriver {
  private prefix: string;
  private storage: Storage;

  constructor(prefix = 'bt_') {
    this.prefix = prefix;
    this.storage = localStorage;
    Logger.system('[LocalStorageDriver] Initialized');
  }

  async get(key: string): Promise<string | null> {
    try {
      const value = this.storage.getItem(this.prefix + key);
      return value;
    } catch (error) {
      Logger.error('[LocalStorageDriver] Get failed', { key, error });
      return null;
    }
  }

  async set(key: string, value: string): Promise<void> {
    try {
      this.storage.setItem(this.prefix + key, value);
    } catch (error) {
      Logger.error('[LocalStorageDriver] Set failed', { key, error });
      throw error;
    }
  }

  async remove(key: string): Promise<void> {
    try {
      this.storage.removeItem(this.prefix + key);
    } catch (error) {
      Logger.error('[LocalStorageDriver] Remove failed', { key, error });
      throw error;
    }
  }

  // Debug: ver todo
  getAllKeys(): string[] {
    const keys: string[] = [];
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key?.startsWith(this.prefix)) {
        keys.push(key.substring(this.prefix.length));
      }
    }
    return keys;
  }

  // Limpiar todo
  clear(): void {
    const keys = this.getAllKeys();
    for (const key of keys) {
      this.storage.removeItem(this.prefix + key);
    }
    Logger.info('[LocalStorageDriver] Cleared');
  }
}
