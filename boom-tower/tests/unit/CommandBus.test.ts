// tests/unit/EventBus.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { EventBus } from '../../src/core/EventBus';

describe('EventBus', () => {
  beforeEach(() => {
    EventBus.clear();
  });

  it('should emit and receive events', () => {
    let received = 0;
    EventBus.on('test', () => { received++; });
    EventBus.emit('test');
    expect(received).toBe(1);
  });

  it('should support once', () => {
    let received = 0;
    EventBus.once('test', () => { received++; });
    EventBus.emit('test');
    EventBus.emit('test');
    expect(received).toBe(1);
  });

  it('should support unsubscribe', () => {
    let received = 0;
    const id = EventBus.on('test', () => { received++; });
    EventBus.emit('test');
    EventBus.off(id);
    EventBus.emit('test');
    expect(received).toBe(1);
  });

  it('should return listener count', () => {
    EventBus.on('test', () => {});
    EventBus.on('test', () => {});
    expect(EventBus.listenerCount('test')).toBe(2);
  });
});