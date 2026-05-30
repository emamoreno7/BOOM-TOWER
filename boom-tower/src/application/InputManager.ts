import Phaser from 'phaser';
import { Logger } from '../core/Logger';
import { EventBus } from '../core/EventBus';

interface InputConfig {
  enableKeyboard: boolean;
  enableMouse: boolean;
  enableTouch: boolean;
  tapThreshold: number;
  doubleTapDelay: number;
}

class InputManager {
  private scene: Phaser.Scene;
  private config: InputConfig;
  private lastTapTime = 0;
  private lastTapPosition = { x: 0, y: 0 };
  private isPaused = false;

  private tapCallbacks: Set<(position: { x: number; y: number }) => void> = new Set();
  private doubleTapCallbacks: Set<(position: { x: number; y: number }) => void> = new Set();

  constructor(scene: Phaser.Scene, config?: Partial<InputConfig>) {
    this.scene = scene;
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
    if (this.config.enableKeyboard) {
      this.scene.events.on('keydown', (event: KeyboardEvent) => {
        if (this.isPaused) return;
        if (event.code === 'Escape' || event.code === 'KeyP') {
          EventBus.emit('input:pause', {});
        }
        EventBus.emit('input:keyboard', { key: event.code });
      });
    }

    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.isPaused) return;
      this.handleTap(pointer.x, pointer.y);
    });

    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
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

    if (timeSinceLastTap < this.config.doubleTapDelay && distance < this.config.tapThreshold) {
      this.emitDoubleTap(x, y);
      this.lastTapTime = 0;
      return;
    }

    this.lastTapTime = now;
    this.lastTapPosition = { x, y };
    this.emitTap(x, y);
  }

  private emitTap(x: number, y: number): void {
    EventBus.emit('input:tap', { x, y });
    for (const callback of this.tapCallbacks) {
      try { callback({ x, y }); } catch (e) { Logger.error('[InputManager] Tap error', { e }); }
    }
  }

  private emitDoubleTap(x: number, y: number): void {
    EventBus.emit('input:doubleTap', { x, y });
    for (const callback of this.doubleTapCallbacks) {
      try { callback({ x, y }); } catch (e) { Logger.error('[InputManager] DoubleTap error', { e }); }
    }
  }

  onTap(callback: (position: { x: number; y: number }) => void): () => void {
    this.tapCallbacks.add(callback);
    return () => this.tapCallbacks.delete(callback);
  }

  onDoubleTap(callback: (position: { x: number; y: number }) => void): () => void {
    this.doubleTapCallbacks.add(callback);
    return () => this.doubleTapCallbacks.delete(callback);
  }

  pause(): void { this.isPaused = true; }
  resume(): void { this.isPaused = false; }

  setEnabled(enabled: boolean): void {
    this.scene.input.enabled = enabled;
  }

  destroy(): void {
    this.tapCallbacks.clear();
    this.doubleTapCallbacks.clear();
  }
}

export { InputManager };