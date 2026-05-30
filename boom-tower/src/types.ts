// ============================================
// TIPOS GLOBALES COMPARTIDOS
// ============================================

// Eventos del EventBus
export type GameEvent =
  // Lifecycle
  | 'game:boot'
  | 'game:ready'
  | 'game:start'
  | 'game:pause'
  | 'game:resume'
  | 'game:over'
  | 'game:restart'
  | 'scene:change'
  
  // Gameplay (preparados, aún no usados en Fase 0)
  | 'block:tapped'
  | 'block:exploded'
  | 'chain:detected'
  | 'combo:increased'
  | 'score:gained'
  | 'jackpot:triggered'
  
  // Meta
  | 'coins:awarded'
  | 'gems:awarded'
  | 'level:up'
  | 'achievement:unlocked'
  | 'mission:completed'
  | 'chest:opened'
  
  // Events
  | 'event:started'
  | 'event:ended'
  
  // UI
  | 'ui:modal:open'
  | 'ui:modal:close'
  | 'ui:toast:show'
  
  // System
  | 'save:requested'
  | 'save:completed'
  | 'load:completed'
  | 'error:caught';

// payload de cada evento
export type GameEventPayload = {
  'game:boot': { version: string };
  'game:ready': { timestamp: number };
  'game:start': { scene: string };
  'game:pause': {};
  'game:resume': {};
  'game:over': { score: number; depth: number };
  'game:restart': {};
  'scene:change': { from: string; to: string };
  'block:tapped': { x: number; y: number; blockId: string };
  'block:exploded': { blockId: string; chainLength: number };
  'chain:detected': { blocks: string[]; length: number };
  'combo:increased': { level: number; multiplier: number };
  'score:gained': { amount: number; source: string };
  'coins:awarded': { amount: number; source: string };
  'gems:awarded': { amount: number; source: string };
  'level:up': { newLevel: number };
  'achievement:unlocked': { achievementId: string };
  'mission:completed': { missionId: string };
  'chest:opened': { chestType: string };
  'event:started': { eventId: string; duration: number };
  'event:ended': { eventId: string };
  'ui:modal:open': { modalId: string };
  'ui:modal:close': { modalId: string };
  'ui:toast:show': { message: string; type: 'info' | 'success' | 'warning' | 'error' };
  'save:requested': {};
  'save:completed': { timestamp: number };
  'load:completed': { timestamp: number };
  'error:caught': { error: Error; context: string };
};

// Estados de la aplicación
export type AppState = 'BOOT' | 'MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

// Estado de UI
export type ModalState = 
  | 'none'
  | 'pause'
  | 'settings'
  | 'shop'
  | 'chests'
  | 'achievements'
  | 'missions'
  | 'game_over';

// Calidad gráfica
export type GraphicsQuality = 'low' | 'medium' | 'high' | 'ultra';

// Idioma
export type Language = 'en' | 'es' | 'pt' | 'fr' | 'de' | 'ja' | 'ko' | 'zh';

// Configuración del juego
export interface GameConfig {
  gameWidth: number;
  gameHeight: number;
  backgroundColor: string;
  fps: number;
  antialias: boolean;
  quality: GraphicsQuality;
  language: Language;
  musicVolume: number;
  sfxVolume: number;
  vibration: boolean;
}

// Settings completos del jugador
export interface GameSettings {
  musicVolume: number;
  sfxVolume: number;
  vibration: boolean;
  quality: GraphicsQuality;
  language: Language;
}

// Vectores 2D
export interface Vec2 {
  x: number;
  y: number;
}

// Save data completo
export interface SaveData {
  version: number;
  playerId: string;
  createdAt: number;
  lastPlayedAt: number;
  settings: GameSettings;
}

// Logger levels
export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
