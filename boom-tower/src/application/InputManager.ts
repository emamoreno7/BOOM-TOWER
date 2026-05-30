import Phaser from 'phaser';
import { Logger } from '../core/Logger';
import { EventBus } from '../core/EventBus';

// ============================================
// INPUT MANAGER — Gestor de input unificado
// ============================================

interface InputConfig {
  enableKeyboard: boolean;
  enableMouse: boolean;
  enableTouch: boolean;
  tapThreshold: number;
  doubleTapDelay: number;
}

class InputManager {
  private game: Phaser.Game;
  private config: InputConfig;
  private lastTapTime = 0;
  private lastTapPosition = { x: 0, y: 0 };
  private doubleTapTimer: Phaser.Time.TimerEvent | null = null;
  private isPaused = false;

  // Tap callback
  private tapCallbacks: Set<(position: { x: number; y: number }) => void> = new Set();
  private doubleTapCallbacks: Set<(position: { x: number; y: number }) => void> = new Set();

  constructor(game: Phaser.Game, config?: Partial<InputConfig>) {
    this.game = game;
    this.config = {
      enableKeyboard: true,
      enableMouse: true,
      enableTouch: true,
      tapThreshold: 200,
      doubleTapDelay: 300,
      ...config,
    };

    this.setupInput();
    Logger.ui('[InputManager] Initialized');
  }

  private setupInput(): void {
    // Keyboard
    if (this.config.enableKeyboard) {
      (this.game.input.keyboard as any)?.on('keydown', (event: KeyboardEvent) => {
        if (this.isPaused) return;
        
        //Pause
        if (event.code === 'Escape' || event.code === 'KeyP') {
          EventBus.emit('input:pause', {});
        }
        
        //Debug
        if (event.code === 'F3') {
          EventBus.emit('input:debug', {});
        }

        EventBus.emit('input:keyboard', { key: event.code });
      });
    }

    // Pointers (mouse + touch unificados)
    (this.game.input as any).on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.isPaused) return;
      this.handleTap(pointer.x, pointer.y);
    });

    (this.game.input as any).on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isPaused) return;
      EventBus.emit('input:pointermove', { x: pointer.x, y: pointer.y });
    });
  }

  private handleTap(x: number, y: number): void {
    const now = Date.now();
    const timeSinceLastTap = now - this.lastTapTime;
    const distance = Math.sqrt(
      Math.pow(x - this.lastTapPosition.x, 2) + 
      Math.pow(y - this.lastTapPosition.y, 2)
    );

    // Double tap detection
    if (
      timeSinceLastTap < this.config.doubleTapDelay && 
      distance < this.config.tapThreshold
    ) {
      this.emitDoubleTap(x, y);
      this.lastTapTime = 0; // Reset to avoid triple tap
      return;
    }

    this.lastTapTime = now;
    this.lastTapPosition = { x, y };
    this.emitTap(x, y);

    // Reset double tap timer
    if (this.doubleTapTimer) {
      this.doubleTapTimer.remove();
    }
    this.doubleTapTimer = (this.game.scene.scenes[0] as Phaser.Scene)?.time.addEvent({
      delay: this.config.doubleTapDelay,
      callback: () => {
        // Double tap window expired
      },
    });
  }

  private emitTap(x: number, y: number): void {
    Logger.debug(`[Input] Tap at (${Math.round(x)}, ${Math.round(y)})`);

    EventBus.emit('input:tap', { x, y });

    for (const callback of this.tapCallbacks) {
      try {
        callback({ x, y });
      } catch (error) {
        Logger.error('[InputManager] Tap callback error', { error });
      }
    }
  }

  private emitDoubleTap(x: number, y: number): void {
    Logger.debug(`[Input] Double tap at (${Math.round(x)}, ${Math.round(y)})`);

    EventBus.emit('input:doubleTap', { x, y });

    for (const callback of this.doubleTapCallbacks) {
      try {
        callback({ x, y });
      } catch (error) {
        Logger.error('[InputManager] Double tap callback error', { error });
      }
    }
  }

  // Subscribe
  onTap(callback: (position: { x: number; y: number }) => void): () => void {
    this.tapCallbacks.add(callback);
    return () => this.tapCallbacks.delete(callback);
  }

  onDoubleTap(callback: (position: { x: number; y: number }) => void): () => void {
    this.doubleTapCallbacks.add(callback);
    return () => this.doubleTapCallbacks.delete(callback);
  }

  // Pause/Resume
  pause(): void {
    this.isPaused = true;
    Logger.ui('[InputManager] Paused');
  }

  resume(): void {
    this.isPaused = false;
    Logger.ui('[InputManager] Resumed');
  }

  // Habilitar/deshabilitar
  setEnabled(enabled: boolean): void {
    this.game.input.enabled = enabled;
    Logger.ui(`[InputManager] ${enabled ? 'Enabled' : 'Disabled'}`);
  }

  // Get pointer position
  getPointer(): Phaser.Input.Pointer {
    return this.game.input.activePointer;
  }

  // Destroy
  destroy(): void {
    this.tapCallbacks.clear();
    this.doubleTapCallbacks.clear();
    if (this.doubleTapTimer) {
      this.doubleTapTimer.remove();
    }
    Logger.ui('[InputManager] Destroyed');
  }
}

export { InputManager };
