import { EventBus } from '../../core/EventBus';
import { Logger } from '../../core/Logger';

// ============================================
// STATS TRACKER — Sistema de estadísticas centralizado
// ============================================

interface BlockStats {
  totalDestroyed: number;
  byType: Record<string, number>;
}

interface ComboStats {
  triggered: number;
  maxEver: number;
  byLevel: Record<number, number>;
}

interface EconomyStats {
  totalCoinsEarned: number;
  totalCoinsSpent: number;
  totalGemsEarned: number;
  totalGemsSpent: number;
}

interface TimeStats {
  totalPlayTimeMs: number;
  sessionsPlayed: number;
  averageSessionMs: number;
  longestSessionMs: number;
}

interface PlayerStats {
  blocksDestroyed: BlockStats;
  combos: ComboStats;
  maxDepthReached: number;
  maxComboThisRun: number;
  jackpotTriggered: number;
  economy: EconomyStats;
  time: TimeStats;
  currentSession: {
    blocksDestroyed: number;
    maxCombo: number;
    playTimeMs: number;
    startedAt: number;
  };
}

class StatsTracker {
  private static instance: StatsTracker;
  private stats: PlayerStats;
  private initialized = false;

  private constructor() {
    this.reset();
  }

  static getInstance(): StatsTracker {
    if (!StatsTracker.instance) {
      StatsTracker.instance = new StatsTracker();
    }
    return StatsTracker.instance;
  }

  // Inicializar con datos guardados
  init(savedStats?: Partial<PlayerStats>): void {
    if (this.initialized) return;

    if (savedStats) {
      this.stats = this.mergeStats(this.stats, savedStats);
    }

    this.initialized = true;
    Logger.system('StatsTracker initialized');
  }

  // Reset completo
  reset(): void {
    this.stats = {
      blocksDestroyed: {
        totalDestroyed: 0,
        byType: {},
      },
      combos: {
        triggered: 0,
        maxEver: 0,
        byLevel: {},
      },
      maxDepthReached: 0,
      maxComboThisRun: 0,
      jackpotTriggered: 0,
      economy: {
        totalCoinsEarned: 0,
        totalCoinsSpent: 0,
        totalGemsEarned: 0,
        totalGemsSpent: 0,
      },
      time: {
        totalPlayTimeMs: 0,
        sessionsPlayed: 0,
        averageSessionMs: 0,
        longestSessionMs: 0,
      },
      currentSession: {
        blocksDestroyed: 0,
        maxCombo: 0,
        playTimeMs: 0,
        startedAt: Date.now(),
      },
    };
  }

  // Iniciar nueva sesión
  startSession(): void {
    this.stats.currentSession = {
      blocksDestroyed: 0,
      maxCombo: 0,
      playTimeMs: 0,
      startedAt: Date.now(),
    };
    Logger.perf('[Stats] Session started');
  }

  // Terminar sesión y actualizar time stats
  endSession(): void {
    const sessionDuration = Date.now() - this.stats.currentSession.startedAt;
    this.stats.currentSession.playTimeMs = sessionDuration;
    this.stats.time.totalPlayTimeMs += sessionDuration;
    this.stats.time.sessionsPlayed++;
    
    this.stats.time.averageSessionMs = 
      this.stats.time.totalPlayTimeMs / this.stats.time.sessionsPlayed;
    
    this.stats.time.longestSessionMs = Math.max(
      this.stats.time.longestSessionMs,
      sessionDuration
    );

    Logger.perf('[Stats] Session ended', { duration: sessionDuration });
  }

  // Registrar bloque destruido
  recordBlockDestroyed(blockType: string): void {
    this.stats.blocksDestroyed.totalDestroyed++;
    this.stats.blocksDestroyed.byType[blockType] = 
      (this.stats.blocksDestroyed.byType[blockType] || 0) + 1;
    this.stats.currentSession.blocksDestroyed++;
  }

  // Registrar combo
  recordCombo(level: number): void {
    this.stats.combos.triggered++;
    this.stats.combos.maxEver = Math.max(this.stats.combos.maxEver, level);
    this.stats.combos.byLevel[level] = (this.stats.combos.byLevel[level] || 0) + 1;
    this.stats.currentSession.maxCombo = Math.max(
      this.stats.currentSession.maxCombo,
      level
    );
    this.stats.maxComboThisRun = Math.max(
      this.stats.maxComboThisRun,
      level
    );
  }

  // Registrar profundidad
  recordDepth(depth: number): void {
    this.stats.maxDepthReached = Math.max(this.stats.maxDepthReached, depth);
  }

  // Registrar jackpot
  recordJackpot(): void {
    this.stats.jackpotTriggered++;
  }

  // Registrar economía
  recordCoinsEarned(amount: number): void {
    this.stats.economy.totalCoinsEarned += amount;
  }

  recordCoinsSpent(amount: number): void {
    this.stats.economy.totalCoinsSpent += amount;
  }

  recordGemsEarned(amount: number): void {
    this.stats.economy.totalGemsEarned += amount;
  }

  recordGemsSpent(amount: number): void {
    this.stats.economy.totalGemsSpent += amount;
  }

  // Getters
  get(): PlayerStats {
    return { ...this.stats };
  }

  getSession(): PlayerStats['currentSession'] {
    return { ...this.stats.currentSession };
  }

  getLifetime(): Pick<PlayerStats, 'blocksDestroyed' | 'combos' | 'economy' | 'time'> {
    return {
      blocksDestroyed: { ...this.stats.blocksDestroyed },
      combos: { ...this.stats.combos },
      economy: { ...this.stats.economy },
      time: { ...this.stats.time },
    };
  }

  getStat(key: string): number {
    const parts = key.split('.');
    let value: unknown = this.stats;
    
    for (const part of parts) {
      if (value && typeof value === 'object') {
        value = (value as Record<string, unknown>)[part];
      } else {
        return 0;
      }
    }
    
    return typeof value === 'number' ? value : 0;
  }

  // Serializar para guardado
  serialize(): PlayerStats {
    return JSON.parse(JSON.stringify(this.stats));
  }

  // Merge stats guardadas
  private mergeStats(base: PlayerStats, saved: Partial<PlayerStats>): PlayerStats {
    return {
      blocksDestroyed: {
        ...base.blocksDestroyed,
        ...saved.blocksDestroyed,
      },
      combos: {
        ...base.combos,
        ...saved.combos,
      },
      maxDepthReached: saved.maxDepthReached ?? base.maxDepthReached,
      maxComboThisRun: base.maxComboThisRun,
      jackpotTriggered: saved.jackpotTriggered ?? base.jackpotTriggered,
      economy: {
        ...base.economy,
        ...saved.economy,
      },
      time: {
        ...base.time,
        ...saved.time,
      },
      currentSession: base.currentSession,
    };
  }

  // Reset stats de sesión actual
  resetSession(): void {
    this.stats.maxComboThisRun = 0;
  }

  // Debug
  getDebugSummary(): string {
    return `
[Stats Summary]
Blocks destroyed: ${this.stats.blocksDestroyed.totalDestroyed}
Max combo: ${this.stats.combos.maxEver}
Max depth: ${this.stats.maxDepthReached}
Jackpots: ${this.stats.jackpotTriggered}
Total play time: ${Math.floor(this.stats.time.totalPlayTimeMs / 60000)}min
Sessions: ${this.stats.time.sessionsPlayed}
    `.trim();
  }
}

export const StatsTracker = StatsTracker.getInstance();
