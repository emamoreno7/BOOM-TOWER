// tests/unit/ObjectPool.test.ts
import { describe, it, expect } from 'vitest';
import { ObjectPool } from '../../src/core/ObjectPool';

describe('ObjectPool', () => {
  it('should create and reuse objects', () => {
    const pool = new ObjectPool(
      () => ({ id: Math.random() }),
      undefined,
      10,
      'TestPool'
    );

    const obj1 = pool.acquire();
    pool.release(obj1);
    const obj2 = pool.acquire();

    expect(obj2).toBe(obj1); // Reused
    expect(pool.getMetrics().totalCreated).toBe(1);
    expect(pool.getMetrics().totalAcquired).toBe(2);
  });

  it('should prewarm pool', () => {
    const pool = new ObjectPool(() => ({}), undefined, 10, 'Test');
    pool.prewarm(5);
    expect(pool.getMetrics().currentPooled).toBe(5);
  });
});