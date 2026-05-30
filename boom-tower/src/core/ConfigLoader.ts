import { Logger } from './Logger';

// ============================================
// CONFIG LOADER — Carga y valida JSONs de configuración
// ============================================

type JSONValue = string | number | boolean | null | JSONValue[] | { [key: string]: JSONValue };
type ConfigSchema = {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    required?: boolean;
    default?: JSONValue;
    validator?: (value: JSONValue) => boolean;
  };
};

interface LoadResult<T> {
  success: boolean;
  data?: T;
  errors: string[];
  warnings: string[];
}

class ConfigLoader_ {
  private static instance: ConfigLoader_;
  private configs = new Map<string, JSONValue>();
  private loadingPromises = new Map<string, Promise<JSONValue>>();
  private basePath = '/data';

  private constructor() {
    Logger.system('ConfigLoader initialized');
  }

  static getInstance(): ConfigLoader_ {
    if (!ConfigLoader_.instance) {
      ConfigLoader_.instance = new ConfigLoader_();
    }
    return ConfigLoader_.instance;
  }

  setBasePath(path: string): void {
    this.basePath = path;
    Logger.info(`ConfigLoader base path: ${path}`);
  }

  // Cargar un archivo JSON
  async load<T = JSONValue>(filename: string, schema?: ConfigSchema): Promise<LoadResult<T>> {
    const path = `${this.basePath}/${filename}.json`;
    
    Logger.info(`[ConfigLoader] Loading: ${path}`);

    // Si ya está cargado, devolver cacheado
    if (this.configs.has(filename)) {
      const cached = this.configs.get(filename)!;
      const errors = schema ? this.validateSchema(cached, schema) : [];
      return {
        success: errors.length === 0,
        data: cached as T,
        errors,
        warnings: [],
      };
    }

    // Si ya está cargando, esperar
    if (this.loadingPromises.has(filename)) {
      const result = await this.loadingPromises.get(filename);
      const errors = schema ? this.validateSchema(result, schema) : [];
      return {
        success: errors.length === 0,
        data: result as T,
        errors,
        warnings: [],
      };
    }

    // Cargar archivo
    const loadPromise = this.doLoad(path);
    this.loadingPromises.set(filename, loadPromise);

    try {
      const data = await loadPromise;
      this.configs.set(filename, data);
      this.loadingPromises.delete(filename);

      const errors = schema ? this.validateSchema(data, schema) : [];
      
      if (errors.length > 0) {
        Logger.warn(`[ConfigLoader] Validation errors for ${filename}`, { errors });
      } else {
        Logger.info(`[ConfigLoader] Loaded successfully: ${filename}`);
      }

      return {
        success: errors.length === 0,
        data: data as T,
        errors,
        warnings: [],
      };
    } catch (error) {
      this.loadingPromises.delete(filename);
      const message = error instanceof Error ? error.message : String(error);
      Logger.error(`[ConfigLoader] Failed to load ${filename}`, { error: message });
      
      return {
        success: false,
        errors: [message],
        warnings: [],
      };
    }
  }

  // Cargar múltiples archivos en paralelo
  async loadMultiple(filenames: string[], schema?: ConfigSchema): Promise<Map<string, LoadResult<JSONValue>>> {
    const results = new Map<string, LoadResult<JSONValue>>();
    
    const promises = filenames.map(async (filename) => {
      const result = await this.load<JSONValue>(filename, schema);
      return { filename, result };
    });

    const settled = await Promise.all(promises);
    
    for (const { filename, result } of settled) {
      results.set(filename, result);
    }

    return results;
  }

  // Obtener config cacheado
  get<T = JSONValue>(filename: string): T | null {
    const config = this.configs.get(filename);
    return config as T | null;
  }

  // Verificar si está cargado
  isLoaded(filename: string): boolean {
    return this.configs.has(filename);
  }

  // Invalidar cache
  invalidate(filename?: string): void {
    if (filename) {
      this.configs.delete(filename);
      Logger.debug(`[ConfigLoader] Invalidated: ${filename}`);
    } else {
      this.configs.clear();
      Logger.info('[ConfigLoader] All configs invalidated');
    }
  }

  // Cargar todos los configs de una carpeta
  async loadAll(folder: string): Promise<void> {
    // En un proyecto real, esto vendría de un manifest
    // Por ahora, método vacío - se populan manualmente
    Logger.info(`[ConfigLoader] loadAll(${folder}) - no auto-discovery in dev`);
  }

  // Validar contra schema
  private validateSchema(data: JSONValue, schema: ConfigSchema): string[] {
    const errors: string[] = [];

    for (const [key, rules] of Object.entries(schema)) {
      const value = (data as Record<string, JSONValue>)[key];

      // Check required
      if (value === undefined && rules.required) {
        errors.push(`Missing required field: ${key}`);
        continue;
      }

      // Skip if not provided and has default
      if (value === undefined) {
        continue;
      }

      // Check type
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== rules.type) {
        errors.push(`Invalid type for "${key}": expected ${rules.type}, got ${actualType}`);
        continue;
      }

      // Run validator
      if (rules.validator && !rules.validator(value)) {
        errors.push(`Validation failed for "${key}"`);
      }
    }

    return errors;
  }

  // Load interno
  private async doLoad(path: string): Promise<JSONValue> {
    const response = await fetch(path);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // Debug info
  getLoadedConfigs(): string[] {
    return [...this.configs.keys()];
  }
}

export const ConfigLoader = ConfigLoader_.getInstance();

// Helper para crear schemas
export function createSchema(schema: ConfigSchema): ConfigSchema {
  return schema;
}

// Schema para configuración de bloques (ejemplo)
export const BLOCKS_SCHEMA: ConfigSchema = {
  types: { type: 'array', required: true },
  colors: { type: 'array', required: true },
  spawnRates: { type: 'object', required: true },
};

// Schema para settings
export const SETTINGS_SCHEMA: ConfigSchema = {
  musicVolume: { type: 'number', required: true },
  sfxVolume: { type: 'number', required: true },
  vibration: { type: 'boolean', required: true },
  quality: { type: 'string', required: true },
  language: { type: 'string', required: true },
};
