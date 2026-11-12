import type { Pool } from 'pg';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';

describe('health routes', () => {
  it('reports a live API process', async () => {
    const pool = { query: vi.fn(), end: vi.fn() } as unknown as Pool;
    const app = createApp(pool);

    const response = await app.inject({ method: 'GET', url: '/health/live' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok', service: 'sistema-comercial-api' });
    expect(pool.query).not.toHaveBeenCalled();
    await app.close();
  });

  it('reports the database as unavailable when the pool cannot query', async () => {
    const pool = {
      query: vi.fn().mockRejectedValue(new Error('database details stay server-side')),
      end: vi.fn(),
    } as unknown as Pool;
    const app = createApp(pool);

    const response = await app.inject({ method: 'GET', url: '/health/ready' });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({ status: 'unavailable' });
    expect(response.body).not.toContain('database details');
    await app.close();
  });
});
