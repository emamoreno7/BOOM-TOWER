import { Logger } from '../../core/Logger';
import { EventBus } from '../../core/EventBus';

export type UIScreen = 'boot' | 'splash' | 'menu' | 'game' | 'pause' | 'gameover' | 'settings';

interface UIState {
  currentScreen: UIScreen;
  previousScreen: UIScreen | null;
  isPaused: boolean;
  isTransitioning: boolean;
}

class UIManager_ {
  private static instance: UIManager_;
  private state: UIState = {
    currentScreen: 'boot',
    previousScreen: null,
    isPaused: false,
    isTransitioning: false,
  };

  private constructor() {
    this.setupListeners();
    Logger.ui('UIManager initialized');
  }

  static getInstance(): UIManager_ {
    if (!UIManager_.instance) {
      UIManager_.instance = new UIManager_();
    }
    return UIManager_.instance;
  }

  setScreen(screen: UIScreen): void {
    if (this.state.isTransitioning) return;
    this.state.previousScreen = this.state.currentScreen;
    this.state.currentScreen = screen;
    EventBus.emit('ui:screenChange', { from: this.state.previousScreen, to: screen });
    Logger.ui('[UIManager] Screen: ' + this.state.previousScreen + ' > ' + screen);
  }

  pause(): void {
    this.state.isPaused = true;
    EventBus.emit('ui:paused', {});
  }

  resume(): void {
    this.state.isPaused = false;
    EventBus.emit('ui:resumed', {});
  }

  togglePause(): void {
    this.state.isPaused ? this.resume() : this.pause();
  }

  setTransitioning(value: boolean): void {
    this.state.isTransitioning = value;
  }

  getScreen(): UIScreen      { return this.state.currentScreen; }
  isPaused(): boolean        { return this.state.isPaused; }
  isTransitioning(): boolean { return this.state.isTransitioning; }

  private setupListeners(): void {
    EventBus.on('game:pause',  () => this.pause());
    EventBus.on('game:resume', () => this.resume());
    EventBus.on('scene:goto',  (data: { scene: UIScreen }) => this.setScreen(data.scene));
  }
}

export const UIManager = UIManager_.getInstance();
