import Phaser from 'phaser';
import { Logger } from './core/Logger';
import { EventBus } from './core/EventBus';
import { CONFIG } from './config';
import { SceneRouter } from './application/SceneRouter';
import { BootScene } from './presentation/scenes/BootScene';
import { SplashScene } from './presentation/scenes/SplashScene';
import { MenuScene } from './presentation/scenes/MenuScene';
import { GameScene } from './presentation/scenes/GameScene';

// ============================================
// BOOM TOWER — Entry Point
// ============================================

// Ocultar loading
function hideLoadingScreen(): void {
  const loading = document.getElementById('loading');
  const fill = document.getElementById('loading-fill');
  
  if (fill) fill.style.width = '100%';
  
  setTimeout(() => {
    if (loading) {
      loading.classList.add('hidden');
      setTimeout(() => loading.remove(), 300);
    }
  }, 300);
}

// Inicializar juego
function initGame(): Phaser.Game {
  Logger.game('=== BOOM TOWER ===');
  Logger.game(`Version: ${CONFIG.VERSION}`);
  Logger.game(`Build: ${CONFIG.BUILD}`);

  // Registrar escenas
  SceneRouter.register('boot', { sceneClass: BootScene });
  SceneRouter.register('splash', { sceneClass: SplashScene });
  SceneRouter.register('menu', { sceneClass: MenuScene });
  SceneRouter.register('game', { sceneClass: GameScene });

  // Config de Phaser
  const phaserConfig: Phaser.Types.Core.GameConfig = {
    ...CONFIG.PHASER,
    scene: [BootScene, SplashScene, MenuScene, GameScene],
  };

  // Crear juego
  const game = new Phaser.Game(phaserConfig);

  // Event: game ready
  game.events.once('ready', () => {
    Logger.game('Phaser game ready');
    EventBus.emit('game:boot', { version: CONFIG.VERSION });
    EventBus.emit('game:ready', { timestamp: Date.now() });
  });

  // Global error handler
  window.addEventListener('error', (event) => {
    Logger.error('Global error', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
    });
    
    EventBus.emit('error:caught', {
      error: new Error(event.message),
      context: `${event.filename}:${event.lineno}`,
    });
  });

  // Ocultar loading cuando el DOM esté listo
  if (document.readyState === 'complete') {
    hideLoadingScreen();
  } else {
    window.addEventListener('load', hideLoadingScreen);
  }

  return game;
}

// Start
const game = initGame();

// Export para debug
(window as unknown as { game: Phaser.Game }).game = game;

Logger.system('Entry point executed');