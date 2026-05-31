import { EventBus } from '../../core/EventBus';
import { Logger } from '../../core/Logger';

// ============================================
// ACHIEVEMENT SYSTEM — Logros del jugador
// ============================================

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: (stats: AchievementStats) => boolean;
  reward?: { coins?: number; gems?: number; unlockId?: string };
}

export interface AchievementStats {
  totalGamesPlayed: number;
  totalScore: number;
  maxCombo: number;
  totalBlocksDestroyed: number;
  level: number;
  specialBlocksActivated: number;
  jackpotsTriggered: number;
  perfectRuns: number;
}

const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_game',
    name: 'Primer paso',
    description: 'Juega tu primera partida',
    icon: 'trophy',
    condition: s => s.totalGamesPlayed >= 1,
    reward: { coins: 50 },
  },
  {
    id: 'combo_5',
    name: 'Encadenado',
    description: 'Consigue un combo de 5',
    icon: 'chain',
    condition: s => s.maxCombo >= 5,
    reward: { coins: 100 },
  },
  {
    id: 'combo_10',
    name: 'Imparable',
    description: 'Consigue un combo de 10',
    icon: 'fire',
    condition: s => s.maxCombo >= 10,
    reward: { coins: 300, gems: 5 },
  },
  {
    id: 'score_1000',
    name: 'Mil puntos',
    description: 'Alcanza 1.000 puntos en una partida',
    icon: 'star',
    condition: s => s.totalScore >= 1000,
    reward: { coins: 100 },
  },
  {
    id: 'score_10000',
    name: 'Experto',
    description: 'Alcanza 10.000 puntos en una partida',
    icon: 'star2',
    condition: s => s.totalScore >= 10000,
    reward: { coins: 500, gems: 10 },
  },
  {
    id: 'level_5',
    name: 'Veterano',
    description: 'Llega al nivel 5',
    icon: 'level',
    condition: s => s.level >= 5,
    reward: { gems: 20 },
  },
  {
    id: 'jackpot',
    name: 'Afortunado',
    description: 'Activa un Jackpot',
    icon: 'jackpot',
    condition: s => s.jackpotsTriggered >= 1,
    reward: { coins: 200 },
  },
  {
    id: 'blocks_1000',
    name: 'Destructor',
    description: 'Destruye 1.000 bloques en total',
    icon: 'block',
    condition: s => s.totalBlocksDestroyed >= 1000,
    reward: { coins: 250, gems: 5 },
  },
];

class AchievementSystem_ {
  private static instance: AchievementSystem_;
  private completed = new Set<string>();
  private achievements: Achievement[] = ACHIEVEMENTS;

  private constructor() {
    Logger.system('AchievementSystem initialized');
  }

  static getInstance(): AchievementSystem_ {
    if (!AchievementSystem_.instance) {
      AchievementSystem_.instance = new AchievementSystem_();
    }
    return AchievementSystem_.instance;
  }

  evaluate(stats: AchievementStats): Achievement[] {
    const newlyCompleted: Achievement[] = [];

    for (const achievement of this.achievements) {
      if (this.completed.has(achievement.id)) continue;
      if (achievement.condition(stats)) {
        this.completed.add(achievement.id);
        newlyCompleted.push(achievement);
        Logger.info('[AchievementSystem] Completed: ' + achievement.id);
        EventBus.emit('achievement:completed', { achievement });
        if (achievement.reward) {
          EventBus.emit('economy:reward', { ...achievement.reward, reason: 'achievement_' + achievement.id });
        }
      }
    }

    return newlyCompleted;
  }

  isCompleted(id: string): boolean { return this.completed.has(id); }
  getCompleted(): string[]          { return [...this.completed]; }
  getAll(): Achievement[]           { return [...this.achievements]; }

  getPending(): Achievement[] {
    return this.achievements.filter(a => !this.completed.has(a.id));
  }

  restore(completedIds: string[]): void {
    this.completed = new Set(completedIds);
  }
}

export const AchievementSystem = AchievementSystem_.getInstance();
