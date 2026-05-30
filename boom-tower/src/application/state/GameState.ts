import type { AppState, ModalState } from '../../types';

// ============================================
// GAME STATE — Estado de la partida actual
// ============================================

export interface GameState {
  // Estado de la aplicación
  appState: AppState;
  
  // Estado de la partida
  isPlaying: boolean;
  isPaused: boolean;
  isGameOver: boolean;
  
  // Score
  score: number;
  combo: number;
  maxComboThisRun: number;
  chainLength: number;
  
  // Profundidad
  currentDepth: number;
  maxDepth: number;
  
  // Timestamps
  sessionStartTime: number;
  lastActionTime: number;
  pauseStartTime: number | null;
  totalPausedTime: number;
  
  // Evento activo
  activeEventId: string | null;
  activeEventEndTime: number | null;
  
  // Modal abierto
  modalOpen: ModalState;
  
  // Flags
  isNewGame: boolean;
  hasShownTutorial: boolean;
}

export function createInitialGameState(): GameState {
  return {
    appState: 'MENU',
    isPlaying: false,
    isPaused: false,
    isGameOver: false,
    score: 0,
    combo: 0,
    maxComboThisRun: 0,
    chainLength: 0,
    currentDepth: 0,
    maxDepth: 0,
    sessionStartTime: 0,
    lastActionTime: 0,
    pauseStartTime: null,
    totalPausedTime: 0,
    activeEventId: null,
    activeEventEndTime: null,
    modalOpen: 'none',
    isNewGame: true,
    hasShownTutorial: false,
  };
}

// Getters de estado
export function isGamePlayable(state: GameState): boolean {
  return state.appState === 'PLAYING' && !state.isPaused && !state.isGameOver;
}

export function isGameActive(state: GameState): boolean {
  return state.isPlaying && !state.isGameOver;
}

export function getPlayTime(state: GameState): number {
  if (state.sessionStartTime === 0) return 0;
  const now = Date.now();
  const elapsed = now - state.sessionStartTime;
  return elapsed - state.totalPausedTime;
}

export function getComboMultiplier(combo: number): number {
  if (combo >= 100) return 10;
  if (combo >= 50) return 7;
  if (combo >= 25) return 5;
  if (combo >= 10) return 3;
  if (combo >= 5) return 2;
  return 1;
}
