import Phaser from 'phaser';
import { Logger } from './core/Logger';
import { EventBus } from './core/EventBus';
import { CONFIG } from './config';
import { SceneRouter } from './application/SceneRouter';
import { BootScene } from './presentation/scenes/BootScene';
import { SplashScene } from './presentation/scenes/SplashScene';
import { MenuScene } from './presentation/scenes/MenuScene';
import { GameScene } from './presentation/scenes/GameScene';
import { ShopScene } from './presentation/scenes/ShopScene';
import { ChestsScene } from './presentation/scenes/ChestsScene';
import { ProfileScene } from './presentation/scenes/ProfileScene';
import { MissionsScene } from './presentation/scenes/MissionsScene';
import { AchievementsScene } from './presentation/scenes/AchievementsScene';

// ============================================
// BOOM TOWER — Entry Point
// ============================================

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

function initGame(): Phaser.Game {
  Logger.game('=== BOOM TOWER ===');
  Logger.game(`Version: ${CONFIG.VERSION}`);
  Logger.game(`Build: ${CONFIG.BUILD}`);

  // Registrar escenas
  SceneRouter.register('boot',         { sceneClass: BootScene });
  SceneRouter.register('splash',       { sceneClass: SplashScene });
  SceneRouter.register('menu',         { sceneClass: MenuScene });
  SceneRouter.register('game',         { sceneClass: GameScene });
  SceneRouter.register('shop',         { sceneClass: ShopScene });
  SceneRouter.register('chests',       { sceneClass: ChestsScene });
  SceneRouter.register('profile',      { sceneClass: ProfileScene });
  SceneRouter.register('missions',     { sceneClass: MissionsScene });
  SceneRouter.register('achievements', { sceneClass: AchievementsScene });

  const phaserConfig: Phaser.Types.Core.GameConfig = {
    ...CONFIG.PHASER,
    scene: [
      BootScene,
      SplashScene,
      MenuScene,
      GameScene,
      ShopScene,
      ChestsScene,
      ProfileScene,
      MissionsScene,
      AchievementsScene,
    ],
  };

  const game = new Phaser.Game(phaserConfig);

  game.events.once('ready', () => {
    Logger.game('Phaser game ready');
    EventBus.emit('game:boot', { version: CONFIG.VERSION });
    EventBus.emit('game:ready', { timestamp: Date.now() });
  });

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

  if (document.readyState === 'complete') {
    hideLoadingScreen();
  } else {
    window.addEventListener('load', hideLoadingScreen);
  }

  return game;
}

const game = initGame();
(window as unknown as { game: Phaser.Game }).game = game;
Logger.system('Entry point executed');
