import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { readMigrations } from '../src/db/migration-files.js';

let temporaryDirectory: string | undefined;

afterEach(async () => {
  if (temporaryDirectory) {
    await rm(temporaryDirectory, { recursive: true, force: true });
    temporaryDirectory = undefined;
  }
});

describe('readMigrations', () => {
  it('returns SQL files in version order and calculates checksums', async () => {
    temporaryDirectory = await mkdtemp(join(tmpdir(), 'sistema-migrations-'));
    await writeFile(join(temporaryDirectory, '0002_second.sql'), 'SELECT 2;');
    await writeFile(join(temporaryDirectory, '0001_first.sql'), 'SELECT 1;');

    const migrations = await readMigrations(temporaryDirectory);

    expect(migrations.map(({ name }) => name)).toEqual([
      '0001_first.sql',
      '0002_second.sql',
    ]);
    expect(migrations[0]?.checksum).toMatch(/^[a-f0-9]{64}$/);
  });

  it('rejects SQL files that do not follow the migration naming rule', async () => {
    temporaryDirectory = await mkdtemp(join(tmpdir(), 'sistema-migrations-'));
    await writeFile(join(temporaryDirectory, 'init.sql'), 'SELECT 1;');

    await expect(readMigrations(temporaryDirectory)).rejects.toThrow(/NNNN_description/);
  });
});
