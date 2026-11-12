import Fastify from 'fastify';
import type { Pool } from 'pg';
import { ApiHealthResponseSchema } from '@sistema/contracts';

export function createApp(pool: Pool) {
  const app = Fastify({ logger: true, trustProxy: false });

  app.get('/health/live', async () =>
    ApiHealthResponseSchema.parse({
      status: 'ok',
      service: 'sistema-comercial-api',
    }),
  );

  app.get('/health/ready', async (_request, reply) => {
    try {
      await pool.query('SELECT 1');
      return { status: 'ok' };
    } catch {
      return reply.code(503).send({ status: 'unavailable' });
    }
  });

  app.addHook('onClose', async () => {
    await pool.end();
  });

  return app;
}
