import Phaser from 'phaser';
import { Logger } from '../core/Logger';
import { EventBus } from '../core/EventBus';
import { CONFIG } from '../config';

// ============================================
// SCENE ROUTER — Gestor de transiciones entre escenas
// ============================================

type SceneClass = new (...args: unknown[]) => Phaser.Scene;

interface RouteConfig {
  sceneClass: SceneClass;
  transition?: TransitionConfig;
  preload?: () => Promise<void>;
}

interface TransitionConfig {
  type: 'fade' | 'slide' | 'zoom' | 'none';
  duration: number;
  color?: number;
}

class SceneRouter {
  private static instance: SceneRouter;
  
  private sceneMap = new Map<string, RouteConfig>();
  private currentScene: string | null = null;
  private targetScene: Phaser.Scene | null = null;
  private isTransitioning = false;

  private constructor() {
    Logger.system('SceneRouter initialized');
  }

  static getInstance(): SceneRouter {
    if (!SceneRouter.instance) {
      SceneRouter.instance = new SceneRouter();
    }
    return SceneRouter.instance;
  }

  // Registrar escena
  register(name: string, config: RouteConfig): void {
    this.sceneMap.set(name, config);
    Logger.debug(`[SceneRouter] Registered scene: ${name}`);
  }

  // Ir a escena
  async go(sceneName: string, game: Phaser.Game): Promise<void> {
    const config = this.sceneMap.get(sceneName);
    
    if (!config) {
      Logger.error(`[SceneRouter] Unknown scene: ${sceneName}`);
      return;
    }

    if (this.isTransitioning) {
      Logger.warn(`[SceneRouter] Already transitioning, ignoring go to: ${sceneName}`);
      return;
    }

    this.isTransitioning = true;
    const previousScene = this.currentScene;

    Logger.info(`[SceneRouter] Navigating: ${previousScene || 'none'} → ${sceneName}`);

    try {
      // Preload si existe
      if (config.preload) {
        await config.preload();
      }

      // Determinar transición
      const transition = config.transition ?? { type: 'fade', duration: 300 };

      // Ejecutar transición
      await this.executeTransition(sceneName, game, transition);

      this.currentScene = sceneName;
      
      EventBus.emit('scene:change', { from: previousScene ?? 'none', to: sceneName });
      EventBus.emit(`scene:entered:${sceneName}`, {});

    } catch (error) {
      Logger.error(`[SceneRouter] Navigation failed`, { error });
      this.isTransitioning = false;
    }
  }

  // Ir a escena con datos
  async goWith(sceneName: string, data: unknown, game: Phaser.Game): Promise<void> {
    this.go(sceneName, game);
  }

  // Transición suave
  async transitionTo(sceneName: string, game: Phaser.Game): Promise<void> {
    const config = this.sceneMap.get(sceneName);
    if (!config) return;

    this.isTransitioning = true;
    const previousScene = this.currentScene;

    const transition = config.transition ?? { type: 'fade', duration: 300 };
    await this.executeTransition(sceneName, game, transition);

    this.currentScene = sceneName;
    EventBus.emit('scene:change', { from: previousScene ?? 'none', to: sceneName });
  }

  // Transición especial
  async transitionWith(
    sceneName: string,
    game: Phaser.Game,
    transitionType: TransitionConfig
  ): Promise<void> {
    this.isTransitioning = true;
    const previousScene = this.currentScene;

    await this.executeTransition(sceneName, game, transitionType);

    this.currentScene = sceneName;
    this.isTransitioning = false;
    
    EventBus.emit('scene:change', { from: previousScene ?? 'none', to: sceneName });
  }

  // Reiniciar escena actual
  async restart(game: Phaser.Game): Promise<void> {
    if (!this.currentScene) return;
    await this.go(this.currentScene, game);
  }

  // Ir a menú
  async goToMenu(game: Phaser.Game): Promise<void> {
    await this.go('menu', game);
  }

  // Ir a juego
  async goToGame(game: Phaser.Game): Promise<void> {
    await this.go('game', game);
  }

  // Ir a splash
  async goToSplash(game: Phaser.Game): Promise<void> {
    await this.go('splash', game);
  }

  // Privado
  private async executeTransition(
    sceneName: string,
    game: Phaser.Game,
    transition: TransitionConfig
  ): Promise<void> {
    const sceneInstance = new (this.sceneMap.get(sceneName)!.sceneClass)(sceneName);

    switch (transition.type) {
      case 'fade':
        return this.fadeTransition(game, sceneInstance, transition);

      case 'slide':
        return this.slideTransition(game, sceneInstance, transition);

      case 'zoom':
        return this.zoomTransition(game, sceneInstance, transition);

      default:
        return this.noTransition(game, sceneInstance);
    }
  }

  private async fadeTransition(
    game: Phaser.Game,
    newScene: Phaser.Scene,
    config: TransitionConfig
  ): Promise<void> {
    const color = config.color ?? 0x1a1a2e;
    const duration = config.duration ?? 300;

    return new Promise((resolve) => {
      game.scene.start(newScene.scene.key);
      
      // Hacer fade out del anterior
      const prevKey = this.currentScene 
        ? this.sceneMap.get(this.currentScene)?.sceneClass.name 
        : null;
      
      if (prevKey && game.scene.get(prevKey)) {
        game.scene.get(prevKey).cameras.main.fadeOut(duration / 2, 
          (color >> 16) & 0xff,
          (color >> 8) & 0xff,
          color & 0xff
        );
      }

      // Fade in del nuevo
      game.scene.get(newScene.scene.key).cameras.main.fadeIn(duration / 2, 
        (color >> 16) & 0xff,
        (color >> 8) & 0xff,
        color & 0xff
      );

      setTimeout(() => {
        this.isTransitioning = false;
        resolve();
      }, duration);
    });
  }

  private async slideTransition(
    game: Phaser.Game,
    newScene: Phaser.Scene,
    config: TransitionConfig
  ): Promise<void> {
    return this.fadeTransition(game, newScene, config);
  }

  private async zoomTransition(
    game: Phaser.Game,
    newScene: Phaser.Scene,
    config: TransitionConfig
  ): Promise<void> {
    return this.fadeTransition(game, newScene, config);
  }

  private async noTransition(game: Phaser.Game, newScene: Phaser.Scene): Promise<void> {
    game.scene.start(newScene.scene.key);
    this.isTransitioning = false;
  }

  // Getters
  getCurrentScene(): string | null {
    return this.currentScene;
  }

  isSceneRegistered(name: string): boolean {
    return this.sceneMap.has(name);
  }

  getRegisteredScenes(): string[] {
    return [...this.sceneMap.keys()];
  }

  getIsTransitioning(): boolean {
    return this.isTransitioning;
  }
}

export const SceneRouter = SceneRouter.getInstance();
