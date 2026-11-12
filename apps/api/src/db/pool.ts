import pg from 'pg';
import type { AppConfig } from '../config.js';

const { Pool } = pg;

export function createPool(config: AppConfig): pg.Pool {
  return new Pool({
    host: config.DB_HOST,
    port: config.DB_PORT,
    database: config.DB_NAME,
    user: config.DB_USER,
    password: config.DB_PASSWORD,
    max: config.DB_POOL_MAX,
    application_name: 'sistema-comercial-api',
    keepAlive: true,
  });
}
