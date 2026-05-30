import { Logger } from '../../core/Logger';
import type { StorageDriver } from './SaveSystem';

// ============================================
// INDEXED DB DRIVER
// ============================================

const DB_NAME = 'boom_tower_db';
const DB_VERSION = 1;
const STORE_NAME = 'saves';

export class IndexedDBDriver implements StorageDriver {
  private db: IDBDatabase | null = null;
  private dbPromise: Promise<IDBDatabase>;

  constructor() {
    this.dbPromise = this.initDB();
    Logger.system('[IndexedDBDriver] Initializing');
  }

  private initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        Logger.error('[IndexedDBDriver] Open failed', { error: request.error });
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        Logger.info('[IndexedDBDriver] Database opened');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'key' });
          Logger.info('[IndexedDBDriver] Store created');
        }
      };
    });
  }

  async get(key: string): Promise<string | null> {
    const db = await this.dbPromise;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result?.value ?? null);
      };

      request.onerror = () => {
        Logger.error('[IndexedDBDriver] Get failed', { key });
        reject(request.error);
      };
    });
  }

  async set(key: string, value: string): Promise<void> {
    const db = await this.dbPromise;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put({ key, value, updatedAt: Date.now() });

      request.onsuccess = () => resolve();
      request.onerror = () => {
        Logger.error('[IndexedDBDriver] Set failed', { key });
        reject(request.error);
      };
    });
  }

  async remove(key: string): Promise<void> {
    const db = await this.dbPromise;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        Logger.error('[IndexedDBDriver] Remove failed', { key });
        reject(request.error);
      };
    });
  }
}
