import { afterEach, describe, expect, it } from 'vitest';
import { migrateImportTempDb, tableExists } from '../../src/database/migrations';
import { VersionMismatchError } from '../../src/errors';
import {
  createMemoryDbAdapter,
  type MemoryDbAdapter,
} from '../helpers/memoryDbAdapter';

describe('migrateImportTempDb', () => {
  const databases: MemoryDbAdapter[] = [];

  afterEach(() => databases.splice(0).forEach((db) => db.dispose()));

  const createVersion = async (version: number): Promise<MemoryDbAdapter> => {
    const db = createMemoryDbAdapter();
    databases.push(db);
    const sortOrder = version >= 5 ? ', sortOrder INTEGER DEFAULT 0' : '';
    const copyCount = version >= 6 ? ', copyCount INTEGER DEFAULT 0' : '';
    await db.exec(`
      CREATE TABLE variables (id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, type TEXT NOT NULL, label TEXT, icon TEXT, valid INTEGER DEFAULT 1${sortOrder}, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL);
      CREATE TABLE profiles (id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, isActive INTEGER DEFAULT 0, isDefault INTEGER DEFAULT 0, valid INTEGER DEFAULT 1${sortOrder}, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL);
      CREATE TABLE snippets (id TEXT PRIMARY KEY, title TEXT, content TEXT NOT NULL, categoryId TEXT, copyWithTitle INTEGER DEFAULT 0${copyCount}, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL);
    `);
    if (version >= 7) {
      await db.exec(
        'CREATE TABLE system_variable_formats (variableKey TEXT PRIMARY KEY, pattern TEXT NOT NULL, updatedAt TEXT NOT NULL)'
      );
    }
    return db;
  };

  it.each([3, 4, 5, 6])('migrates a V%i import database to the V7 shape', async (version) => {
    const db = await createVersion(version);

    await migrateImportTempDb(db, version);

    expect(db.all<{ name: string }>("SELECT name FROM pragma_table_info('variables')").map((c) => c.name)).toContain(
      'sortOrder'
    );
    expect(db.all<{ name: string }>("SELECT name FROM pragma_table_info('profiles')").map((c) => c.name)).toContain(
      'sortOrder'
    );
    expect(db.all<{ name: string }>("SELECT name FROM pragma_table_info('snippets')").map((c) => c.name)).toContain(
      'copyCount'
    );
    expect(tableExists(db, 'system_variable_formats')).toBe(true);
  });

  it('rejects unsupported versions instead of continuing with a partial migration', async () => {
    const db = await createVersion(3);
    await expect(migrateImportTempDb(db, 2)).rejects.toBeInstanceOf(VersionMismatchError);
  });
});
