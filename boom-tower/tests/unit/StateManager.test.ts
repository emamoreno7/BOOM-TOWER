// tests/unit/StateManager.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { StateManager } from '../../src/application/state/StateManager';

describe('StateManager', () => {
  beforeEach(() => {
    StateManager.reset();
  });

  it('should have initial game state', () => {
    const state = StateManager.getGame();
    expect(state.appState).toBe('MENU');
    expect(state.isPlaying).toBe(false);
  });

  it('should update game state', () => {
    StateManager.updateGame(s => ({ ...s, score: 100 }));
    expect(StateManager.getGame().score).toBe(100);
  });

  it('should notify subscribers', () => {
    let notified = false;
    StateManager.subscribe(() => { notified = true; });
    StateManager.updateGame(s => ({ ...s, score: 200 }));
    expect(notified).toBe(true);
  });
});