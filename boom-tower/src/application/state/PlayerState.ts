// ============================================
// PLAYER STATE — Estado persistente del jugador
// ============================================

export interface PlayerState {
  // Identificación
  playerId: string;
  
  // Progresión
  level: number;
  xp: number;
  xpToNextLevel: number;
  prestigeStars: number;
  
  // Economía
  coins: number;
  gems: number;
  lifetimeCoinsEarned: number;
  lifetimeGemsEarned: number;
  
  // Logros desbloqueados
  achievementsUnlocked: string[];
  
  // Cofres
  chestsAvailable: Record<string, number>;
  
  // Skins
  ownedSkins: string[];
  equippedSkins: Record<string, string>;
  
  // Retención
  loginStreak: number;
  lastLoginDate: string;
  dailyRewardDay: number;
  totalDailyRewardsClaimed: number;
  
  // Meta
  totalPlayTimeMs: number;
  totalGamesPlayed: number;
  createdAt: number;
  lastPlayedAt: number;
}

export function createInitialPlayerState(playerId: string): PlayerState {
  return {
    playerId,
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    prestigeStars: 0,
    coins: 0,
    gems: 0,
    lifetimeCoinsEarned: 0,
    lifetimeGemsEarned: 0,
    achievementsUnlocked: [],
    chestsAvailable: {},
    ownedSkins: [],
    equippedSkins: {},
    loginStreak: 0,
    lastLoginDate: '',
    dailyRewardDay: 0,
    totalDailyRewardsClaimed: 0,
    totalPlayTimeMs: 0,
    totalGamesPlayed: 0,
    createdAt: Date.now(),
    lastPlayedAt: Date.now(),
  };
}

// XP necesaria para nivel n
export function xpRequiredForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.45));
}

// Verificar si puede subir de nivel
export function checkLevelUp(state: PlayerState): { newLevel: number; xpRemaining: number } | null {
  let currentLevel = state.level;
  let remainingXP = state.xp;
  
  while (remainingXP >= state.xpToNextLevel) {
    remainingXP -= state.xpToNextLevel;
    currentLevel++;
    
    // Verificar si hay más niveles
    const nextRequired = xpRequiredForLevel(currentLevel);
    if (remainingXP < nextRequired) {
      return {
        newLevel: currentLevel,
        xpRemaining: remainingXP,
      };
    }
  }
  
  return null;
}

// Dar XP y manejar level up
export function addXP(state: PlayerState, amount: number): PlayerState {
  const newState = { ...state };
  newState.xp += amount;
  
  const levelUp = checkLevelUp(newState);
  if (levelUp) {
    newState.level = levelUp.newLevel;
    newState.xp = levelUp.xpRemaining;
    newState.xpToNextLevel = xpRequiredForLevel(newState.level + 1);
  }
  
  return newState;
}
