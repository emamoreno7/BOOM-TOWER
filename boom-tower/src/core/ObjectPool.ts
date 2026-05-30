import { Logger } from './Logger';

// ============================================
// OBJECT POOL — Sistema de pooling genérico
// ============================================

interface PoolMetrics {
  totalCreated: number;
  totalAcquired: number;
  totalReleased: number;
  currentActive: number;
  currentPooled: number;
}

export class ObjectPool<T> {
  private factory: () => T;
  private reset?: (obj: T) => void;
  private pool: T[] = [];
  private active: Set<T> = new Set();
  private metrics: PoolMetrics = {
    totalCreated: 0,
    totalAcquired: 0,
    totalReleased: 0,
    currentActive: 0,
    currentPooled: 0,
  };
  private maxPoolSize: number;
  private name: string;

  constructor(
    factory: () => T,
    reset?: (obj: T) => void,
    maxPoolSize = 200,
    name = 'Pool'
  ) {
    this.factory = factory;
    this.reset = reset;
    this.maxPoolSize = maxPoolSize;
    this.name = name;
    
    Logger.perf(`[${name}] ObjectPool created`);
  }

  // Adquirir objeto del pool
  acquire(): T {
    let obj: T;

    if (this.pool.length > 0) {
      obj = this.pool.pop()!;
      Logger.perf(`[${this.name}] Reused from pool (remaining: ${this.pool.length})`);
    } else {
      obj = this.factory();
      this.metrics.totalCreated++;
      Logger.perf(`[${this.name}] Created new (total: ${this.metrics.totalCreated})`);
    }

    this.active.add(obj);
    this.metrics.totalAcquired++;
    this.metrics.currentActive = this.active.size;
    
    return obj;
  }

  // Liberar objeto al pool
  release(obj: T): void {
    if (!this.active.has(obj)) {
      Logger.warn(`[${this.name}] Trying to release object not from this pool`);
      return;
    }

    this.active.delete(obj);
    
    // Resetear si hay función
    if (this.reset) {
      this.reset(obj);
    }

    // Devolver al pool o destruir si está lleno
    if (this.pool.length < this.maxPoolSize) {
      this.pool.push(obj);
      this.metrics.currentPooled = this.pool.length;
    }

    this.metrics.totalReleased++;
    this.metrics.currentActive = this.active.size;
    
    Logger.perf(`[${this.name}] Released (active: ${this.metrics.currentActive}, pooled: ${this.metrics.currentPooled})`);
  }

  // Pre-calentar el pool
  prewarm(count: number): void {
    const toCreate = Math.min(count, this.maxPoolSize - this.pool.length);
    for (let i = 0; i < toCreate; i++) {
      const obj = this.factory();
      this.pool.push(obj);
    }
    this.metrics.totalCreated += toCreate;
    this.metrics.currentPooled = this.pool.length;
    
    Logger.info(`[${this.name}] Prewarmed with ${toCreate} objects`);
  }

  // Obtener métricas
  getMetrics(): PoolMetrics {
    return { ...this.metrics };
  }

  // Limpiar pool
  clear(): void {
    this.pool = [];
    this.active.clear();
    this.metrics.currentPooled = 0;
    this.metrics.currentActive = 0;
    
    Logger.info(`[${this.name}] Pool cleared`);
  }

  // Pool actual
  getPooled(): readonly T[] {
    return [...this.pool];
  }

  // Objetos activos
  getActive(): readonly T[] {
    return [...this.active];
  }

  // Tamaño total
  get totalSize(): number {
    return this.pool.length + this.active.size;
  }
}

// Pool manager para pools pre-configurados
class PoolManager {
  private static instance: PoolManager;
  private pools = new Map<string, ObjectPool<unknown>>();
  private logger = Logger;

  private constructor() {
    this.logger.system('PoolManager initialized');
  }

  static getInstance(): PoolManager {
    if (!PoolManager.instance) {
      PoolManager.instance = new PoolManager();
    }
    return PoolManager.instance;
  }

  register<T>(name: string, factory: () => T, reset?: (obj: T) => void, maxSize = 200): ObjectPool<T> {
    if (this.pools.has(name)) {
      this.logger.warn(`[PoolManager] Pool "${name}" already exists, returning existing`);
      return this.pools.get(name) as ObjectPool<T>;
    }
    
    const pool = new ObjectPool(factory, reset, maxSize, name);
    this.pools.set(name, pool);
    return pool;
  }

  get<T>(name: string): ObjectPool<T> | null {
    return this.pools.get(name) as ObjectPool<T> | null;
  }

  clearAll(): void {
    for (const [, pool] of this.pools) {
      pool.clear();
    }
    this.logger.info('[PoolManager] All pools cleared');
  }

  getAllMetrics(): Record<string, PoolMetrics> {
    const result: Record<string, PoolMetrics> = {};
    for (const [name, pool] of this.pools) {
      result[name] = pool.getMetrics();
    }
    return result;
  }
}

export const PoolManager = PoolManager.getInstance();
