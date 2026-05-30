// ============================================
// PROGRESS STATE — Estado de progresión meta
// ============================================

export interface MissionProgress {
  missionId: string;
  current: number;
  target: number;
  completed: boolean;
  claimed: boolean;
  expiresAt: number;
}

export interface ActiveMission {
  id: string;
  type: 'daily' | 'weekly' | 'monthly';
  template: string;
  variables: Record<string, unknown>;
  progress: MissionProgress;
  reward: {
    coins: number;
    gems: number;
    xp: number;
  };
}

export interface AchievementProgress {
  achievementId: string;
  current: number;
  target: number;
  completed: boolean;
  notified: boolean;
}

export interface ProgressState {
  // Misiones
  dailyMissions: ActiveMission[];
  weeklyMissions: ActiveMission[];
  monthlyMissions: ActiveMission[];
  nextDailyReset: number;
  nextWeeklyReset: number;
  nextMonthlyReset: number;
  
  // Logros
  achievements: AchievementProgress[];
  
  // Desbloqueos
  unlockedBlocks: string[];
  unlockedEvents: string[];
  unlockedFeatures: string[];
  
  // Sellos de tiempo para resets
  lastDailyClaim: number;
  lastWeeklyClaim: number;
  lastMonthlyClaim: number;
}

export function createInitialProgressState(): ProgressState {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const weekMs = 7 * dayMs;
  
  return {
    dailyMissions: [],
    weeklyMissions: [],
    monthlyMissions: [],
    nextDailyReset: now + dayMs,
    nextWeeklyReset: now + weekMs,
    nextMonthlyReset: now + 30 * dayMs,
    achievements: [],
    unlockedBlocks: ['red', 'blue', 'green', 'yellow', 'purple'],
    unlockedEvents: [],
    unlockedFeatures: [],
    lastDailyClaim: 0,
    lastWeeklyClaim: 0,
    lastMonthlyClaim: 0,
  };
}

// Calcular progreso de misión
export function getMissionProgressPercent(mission: ActiveMission): number {
  if (mission.progress.target === 0) return 0;
  return Math.min(100, (mission.progress.current / mission.progress.target) * 100);
}

// Verificar si hay misión activa
export function hasActiveMission(state: ProgressState, type: 'daily' | 'weekly' | 'monthly'): boolean {
  switch (type) {
    case 'daily': return state.dailyMissions.length > 0;
    case 'weekly': return state.weeklyMissions.length > 0;
    case 'monthly': return state.monthlyMissions.length > 0;
  }
}

// Verificar si necesita reset
export function needsReset(state: ProgressState, type: 'daily' | 'weekly' | 'monthly'): boolean {
  const now = Date.now();
  switch (type) {
    case 'daily': return now >= state.nextDailyReset;
    case 'weekly': return now >= state.nextWeeklyReset;
    case 'monthly': return now >= state.nextMonthlyReset;
  }
}
