import { Logger } from './Logger';

// ============================================
// RANDOM — Sistema de números aleatorios con seed
// ============================================

class SeededRandom {
  private seed: number;
  private initialSeed: number;

  constructor(seed: number) {
    this.seed = seed;
    this.initialSeed = seed;
    Logger.debug(`SeededRandom created with seed: ${seed}`);
  }

  // Resetear al seed inicial
  reset(): void {
    this.seed = this.initialSeed;
  }

  // Obtener seed actual
  getSeed(): number {
    return this.seed;
  }

  // Generar número 0-1
  random(): number {
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }

  // Entero entre min y max (inclusive)
  integer(min: number, max: number): number {
    return Math.floor(this.random() * (max - min + 1)) + min;
  }

  // Float entre min y max
  float(min: number, max: number): number {
    return this.random() * (max - min) + min;
  }

  // Booleano con probabilidad
  boolean(probability = 0.5): boolean {
    return this.random() < probability;
  }

  // Elegir de array
  pick<T>(array: readonly T[]): T {
    if (array.length === 0) throw new Error('Cannot pick from empty array');
    return array[Math.floor(this.random() * array.length)];
  }

  // Elegir múltiples de array (sin repetición)
  pickMultiple<T>(array: readonly T[], count: number): T[] {
    const shuffled = [...array].sort(() => this.random() - 0.5);
    return shuffled.slice(0, Math.min(count, array.length));
  }

  // Shuffle array in-place
  shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  // Distribución normal (Box-Muller)
  gaussian(mean = 0, stdDev = 1): number {
    const u1 = this.random();
    const u2 = this.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return z * stdDev + mean;
  }

  // Weighted random selection
  weightedPick<T>(items: readonly T[], weights: readonly number[]): T {
    const total = weights.reduce((a, b) => a + b, 0);
    let random = this.random() * total;
    
    for (let i = 0; i < items.length; i++) {
      random -= weights[i];
      if (random <= 0) return items[i];
    }
    
    return items[items.length - 1];
  }

  // Para serialización
  serialize(): { seed: number } {
    return { seed: this.seed };
  }

  // Para restaurar
  restore(state: { seed: number }): void {
    this.seed = state.seed;
  }
}

// Random global (no seeded, para uso general)
class GlobalRandom {
  private rng = Math.random;

  random(): number {
    return this.rng();
  }

  integer(min: number, max: number): number {
    return Math.floor(this.random() * (max - min + 1)) + min;
  }

  float(min: number, max: number): number {
    return this.random() * (max - min) + min;
  }

  boolean(probability = 0.5): boolean {
    return this.random() < probability;
  }

  pick<T>(array: readonly T[]): T {
    if (array.length === 0) throw new Error('Cannot pick from empty array');
    return array[Math.floor(this.random() * array.length)];
  }

  pickMultiple<T>(array: readonly T[], count: number): T[] {
    const shuffled = [...array].sort(() => this.random() - 0.5);
    return shuffled.slice(0, Math.min(count, array.length));
  }

  shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  weightedPick<T>(items: readonly T[], weights: readonly number[]): T {
    const total = weights.reduce((a, b) => a + b, 0);
    let random = this.random() * total;
    
    for (let i = 0; i < items.length; i++) {
      random -= weights[i];
      if (random <= 0) return items[i];
    }
    
    return items[items.length - 1];
  }

  // UUID simple
  uuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (this.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}

// Singleton
export const Random = new GlobalRandom();

// Factory para seeds
export function createSeededRandom(seed: number): SeededRandom {
  return new SeededRandom(seed);
}

// Para gameplay determinístico
export function createGameRandom(): SeededRandom {
  // Usar timestamp como seed base
  const seed = Date.now() % 0x7fffffff;
  return new SeededRandom(seed);
}
