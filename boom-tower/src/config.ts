import type { GameConfig, GameSettings } from './types';

// ============================================
// CONFIGURACIÓN GLOBAL DEL PROYECTO
// ============================================

export const CONFIG = {
  // Información de versión
  VERSION: '0.1.0',
  BUILD: 'dev',
  
  // Resolución del juego (formato 9:16)
  GAME_WIDTH: 1080,
  GAME_HEIGHT: 1920,
  ASPECT_RATIO: 9 / 16,
  
  // Colores del tema
  COLORS: {
    PRIMARY: '#1a1a2e',      // Fondo oscuro
    SECONDARY: '#16213e',    // Panel
    ACCENT: '#ffd700',       // Dorado
    ACCENT_ALT: '#ff6b35',   // Naranja explosivo
    TEXT: '#ffffff',
    TEXT_DIM: '#aaaaaa',
    SUCCESS: '#4ade80',
    WARNING: '#fbbf24',
    ERROR: '#f87171',
    
    // Colores de bloques (para Fase 1+)
    BLOCK_RED: '#ef4444',
    BLOCK_BLUE: '#3b82f6',
    BLOCK_GREEN: '#22c55e',
    BLOCK_YELLOW: '#eab308',
    BLOCK_PURPLE: '#a855f7',
  },
  
  // Capas de renderizado
  LAYERS: {
    BACKGROUND: 0,
    GRID: 10,
    BLOCKS: 20,
    EFFECTS: 30,
    UI: 40,
    MODALS: 50,
    DEBUG: 100,
  },
  
  // Phaser config por defecto
  PHASER: {
    type: Phaser.AUTO,
    parent: 'game-container',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 1080,
      height: 1920,
      min: { width: 320, height: 568 },
      max: { width: 1440, height: 2560 },
    },
    backgroundColor: '#1a1a2e',
    fps: { target: 60 },
    antialias: true,
    render: {
      pixelArt: false,
      antialias: true,
    },
  },
  
  // Settings por defecto
  DEFAULT_SETTINGS: {
    musicVolume: 0.7,
    sfxVolume: 0.8,
    vibration: true,
    quality: 'high' as const,
    language: 'en' as const,
  },
  
  // Rutas
  PATHS: {
    DATA: '/data',
    ASSETS: '/assets',
    AUDIO: '/assets/audio',
    SPRITES: '/assets/sprites',
    FONTS: '/assets/fonts',
  },
  
  // Configuración de guardado
  SAVE: {
    KEY: 'boom_tower_save',
    VERSION: 1,
    AUTO_SAVE_INTERVAL: 30000, // 30 segundos
    ENABLE_CLOUD: false,
  },
  
  // Configuración de logging
  LOG: {
    LEVEL: 'DEBUG' as const,
    ENABLE_CONSOLE: true,
    ENABLE_FILE: false,
    PREFIX: '[BOOM TOWER]',
  },
  
  // Configuración de simulación
  SIMULATION: {
    ENABLED: true,
    DEBUG_MODE: false,
    MAX_ITERATIONS: 1000000,
  },
  
  // Configuración de FPS
  FPS: {
    TARGET: 60,
    MIN_ACCEPTABLE: 45,
    AUTO_QUALITY: true,
  },
} as const;

// Settings del jugador (puede ser override)
export function getSettings(): GameSettings {
  try {
    const stored = localStorage.getItem(`${CONFIG.SAVE.KEY}_settings`);
    if (stored) {
      return { ...CONFIG.DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch {
    // ignore
  }
  return { ...CONFIG.DEFAULT_SETTINGS };
}

// Guardar settings
export function saveSettings(settings: GameSettings): void {
  try {
    localStorage.setItem(`${CONFIG.SAVE.KEY}_settings`, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

// Merge config parcial
export function mergeConfig<T extends object>(base: T, override: Partial<T>): T {
  return { ...base, ...override };
}
