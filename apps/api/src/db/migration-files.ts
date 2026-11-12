import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const migrationNamePattern = /^\d{4,}_[a-z0-9-]+\.sql$/;

export interface MigrationFile {
  name: string;
  sql: string;
  checksum: string;
}

export async function readMigrations(directory: string): Promise<MigrationFile[]> {
  const names = (await readdir(directory)).filter((name) => name.endsWith('.sql')).sort();

  if (names.some((name) => !migrationNamePattern.test(name))) {
    throw new Error('Migration names must use NNNN_description.sql format.');
  }

  return Promise.all(
    names.map(async (name) => {
      const sql = await readFile(join(directory, name), 'utf8');
      return {
        name,
        sql,
        checksum: createHash('sha256').update(sql).digest('hex'),
      };
    }),
  );
}
