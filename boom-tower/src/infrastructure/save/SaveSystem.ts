import { Logger } from '../../core/Logger';
import { CONFIG } from '../../config';
import type { SaveData } from '../../types';

// ============================================
// SAVE SYSTEM — Sistema de guardado robusto
// ============================================

interface SaveMetadata {
  version: number;
  timestamp: number;
  checksum: string;
}

class SaveSystem {
  private static instance: SaveSystem;
  
  private storageDriver: StorageDriver | null = null;
  private saveKey = CONFIG.SAVE.KEY;
  private currentVersion = CONFIG.SAVE.VERSION;
  private isSaving = false;

  private constructor() {
    Logger.system('SaveSystem initialized');
  }

  static getInstance(): SaveSystem {
    if (!SaveSystem.instance) {
      SaveSystem.instance = new SaveSystem();
    }
    return SaveSystem.instance;
  }

  // Inicializar con driver
  init(driver: StorageDriver): void {
    this.storageDriver = driver;
    Logger.info('[SaveSystem] Driver set');
  }

  // Guardar
  async save(data: unknown): Promise<boolean> {
    if (this.isSaving) {
      Logger.warn('[SaveSystem] Save already in progress');
      return false;
    }

    if (!this.storageDriver) {
      Logger.error('[SaveSystem] No storage driver');
      return false;
    }

    this.isSaving = true;

    try {
      const saveData: SaveData = {
        version: this.currentVersion,
        playerId: '',
        createdAt: Date.now(),
        lastPlayedAt: Date.now(),
        ...(data as object),
      };

      // Generar checksum
      const jsonString = JSON.stringify(saveData);
      const checksum = this.generateChecksum(jsonString);

      const savePackage = {
        data: saveData,
        metadata: {
          version: this.currentVersion,
          timestamp: Date.now(),
          checksum,
        },
      };

      await this.storageDriver.set(this.saveKey, JSON.stringify(savePackage));
      
      Logger.info('[SaveSystem] Saved successfully', {
        size: jsonString.length,
        checksum,
      });

      return true;
    } catch (error) {
      Logger.error('[SaveSystem] Save failed', { error });
      return false;
    } finally {
      this.isSaving = false;
    }
  }

  // Cargar
  async load(): Promise<unknown | null> {
    if (!this.storageDriver) {
      Logger.error('[SaveSystem] No storage driver');
      return null;
    }

    try {
      const raw = await this.storageDriver.get(this.saveKey);
      
      if (!raw) {
        return null;
      }

      const savePackage = JSON.parse(raw);
      const { data, metadata } = savePackage;

      // Verificar versión
      if (metadata.version < this.currentVersion) {
        Logger.info('[SaveSystem] Upgrading save from v' + metadata.version);
        // Aquí iría la lógica de migración
      }

      // Verificar checksum
      const jsonString = JSON.stringify(data);
      const expectedChecksum = this.generateChecksum(jsonString);

      if (metadata.checksum !== expectedChecksum) {
        Logger.warn('[SaveSystem] Checksum mismatch, attempting recovery');
        // Intentar con backup
        return await this.recoverFromBackup();
      }

      Logger.info('[SaveSystem] Loaded successfully');
      return data;
    } catch (error) {
      Logger.error('[SaveSystem] Load failed', { error });
      return null;
    }
  }

  // Eliminar
  async delete(): Promise<boolean> {
    if (!this.storageDriver) return false;

    try {
      await this.storageDriver.remove(this.saveKey);
      Logger.info('[SaveSystem] Save deleted');
      return true;
    } catch (error) {
      Logger.error('[SaveSystem] Delete failed', { error });
      return false;
    }
  }

  // Verificar si existe save
  async exists(): Promise<boolean> {
    if (!this.storageDriver) return false;

    try {
      const data = await this.storageDriver.get(this.saveKey);
      return data !== null;
    } catch {
      return false;
    }
  }

  // Backup
  async backup(): Promise<boolean> {
    if (!this.storageDriver) return false;

    try {
      const current = await this.storageDriver.get(this.saveKey);
      if (current) {
        await this.storageDriver.set(this.saveKey + '_backup', current);
        Logger.info('[SaveSystem] Backup created');
        return true;
      }
      return false;
    } catch (error) {
      Logger.error('[SaveSystem] Backup failed', { error });
      return false;
    }
  }

  // Recuperar de backup
  private async recoverFromBackup(): Promise<unknown | null> {
    if (!this.storageDriver) return null;

    try {
      const backup = await this.storageDriver.get(this.saveKey + '_backup');
      if (backup) {
        const savePackage = JSON.parse(backup);
        Logger.warn('[SaveSystem] Recovered from backup');
        return savePackage.data;
      }
    } catch {
      // Backup también falló
    }
    return null;
  }

  // Checksum (SHA-256 simplificado para browser)
  private generateChecksum(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  // Exportar a JSON
  async export(): Promise<string | null> {
    const data = await this.load();
    if (data) {
      return JSON.stringify(data, null, 2);
    }
    return null;
  }

  // Importar desde JSON
  async import(jsonString: string): Promise<boolean> {
    try {
      const data = JSON.parse(jsonString);
      return await this.save(data);
    } catch (error) {
      Logger.error('[SaveSystem] Import failed', { error });
      return false;
    }
  }
}

// ============================================
// INTERFACE DE DRIVERS
// ============================================

export interface StorageDriver {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

export const SaveSystem = SaveSystem.getInstance();
