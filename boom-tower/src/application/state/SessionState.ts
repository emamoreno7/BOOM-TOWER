// ============================================
// SESSION STATE — Estado de la sesión actual
// ============================================

export interface SessionState {
  // Identificación
  sessionId: string;
  
  // Tiempos
  startedAt: number;
  lastSavedAt: number;
  
  // Contadores de sesión
  blocksDestroyed: number;
  maxCombo: number;
  totalScore: number;
  coinsEarned: number;
  gemsEarned: number;
  
  // Eventos
  eventsTriggered: string[];
  jackpotsTriggered: number;
  
  // Acciones
  totalTaps: number;
  totalChains: number;
  
  // Calidad
  averageFps: number;
  
  // Flags
  isFirstSession: boolean;
  isTutorialCompleted: boolean;
  hasMadeFirstPurchase: boolean;
}

export function createInitialSessionState(sessionId: string): SessionState {
  return {
    sessionId,
    startedAt: Date.now(),
    lastSavedAt: Date.now(),
    blocksDestroyed: 0,
    maxCombo: 0,
    totalScore: 0,
    coinsEarned: 0,
    gemsEarned: 0,
    eventsTriggered: [],
    jackpotsTriggered: 0,
    totalTaps: 0,
    totalChains: 0,
    averageFps: 60,
    isFirstSession: false,
    isTutorialCompleted: false,
    hasMadeFirstPurchase: false,
  };
}

// Duración de la sesión en ms
export function getSessionDuration(state: SessionState): number {
  return Date.now() - state.startedAt;
}

// Minutos jugados
export function getSessionMinutes(state: SessionState): number {
  return Math.floor(getSessionDuration(state) / 60000);
}
