import { loadConfig } from './config.js';
import { createPool } from './db/pool.js';
import { createApp } from './app.js';

const config = loadConfig();
const pool = createPool(config);
const app = createApp(pool);
const shutdown = (): void => {
  void app.close();
};

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);

try {
  await app.listen({ host: config.API_HOST, port: config.API_PORT });
} catch (error) {
  app.log.error(error, 'Failed to start API');
  await app.close();
  process.exitCode = 1;
}
