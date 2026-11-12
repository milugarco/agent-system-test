import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { loadConfig } from '../config.js';
import { createPool } from './pool.js';
import { readMigrations } from './migration-files.js';

const migrationsDirectory = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../../../database/migrations',
);
const pool = createPool(loadConfig());
const client = await pool.connect();
const statusOnly = process.argv.includes('--status');

try {
  if (!statusOnly) {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version TEXT PRIMARY KEY,
        checksum TEXT NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await client.query('SELECT pg_advisory_lock($1)', [742_019_561]);
  }

  const migrations = await readMigrations(migrationsDirectory);
  let applied: Map<string, string>;

  try {
    const result = await client.query<{ version: string; checksum: string }>(
      `SELECT version, checksum FROM schema_migrations ORDER BY version`,
    );
    applied = new Map(result.rows.map((row) => [row.version, row.checksum]));
  } catch (error) {
    if (statusOnly && (error as { code?: string }).code === '42P01') {
      applied = new Map();
    } else {
      throw error;
    }
  }

  const migrationNames = new Set(migrations.map(({ name }) => name));
  const removedMigrations = [...applied.keys()].filter((name) => !migrationNames.has(name));
  if (removedMigrations.length > 0) {
    throw new Error(`Applied migrations are missing from disk: ${removedMigrations.join(', ')}`);
  }

  for (const migration of migrations) {
    const existingChecksum = applied.get(migration.name);
    if (existingChecksum !== undefined && existingChecksum !== migration.checksum) {
      throw new Error(`Applied migration was modified: ${migration.name}`);
    }
    if (existingChecksum !== undefined) {
      console.info(`applied  ${migration.name}`);
      continue;
    }
    if (statusOnly) {
      console.info(`pending  ${migration.name}`);
      continue;
    }

    await client.query('BEGIN');
    try {
      await client.query(migration.sql);
      await client.query(
        'INSERT INTO schema_migrations (version, checksum) VALUES ($1, $2)',
        [migration.name, migration.checksum],
      );
      await client.query('COMMIT');
      console.info(`applied  ${migration.name}`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  }
} finally {
  if (!statusOnly) {
    await client.query('SELECT pg_advisory_unlock($1)', [742_019_561]).catch(() => undefined);
  }
  client.release();
  await pool.end();
}
