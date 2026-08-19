import { afterEach, describe, expect, it } from 'vitest';
import type { DbAdapter } from '../../src/adapters/DbAdapter';
import { tableExists } from '../../src/database/migrations';
import {
  createMemoryDbAdapter,
  type MemoryDbAdapter,
} from '../helpers/memoryDbAdapter';

/**
 * テーブル存在確認は「不在」と「DBが読めない」を混同してはならない。
 * DB異常をfalseへ潰すと、呼び出し元が空データとして先へ進んでしまう。
 */
describe('tableExists', () => {
  const databases: MemoryDbAdapter[] = [];

  afterEach(() => databases.splice(0).forEach((db) => db.dispose()));

  const createDatabase = (): MemoryDbAdapter => {
    const db = createMemoryDbAdapter();
    databases.push(db);
    return db;
  };

  it('distinguishes an existing table from a missing one', async () => {
    const db = createDatabase();
    await db.exec('CREATE TABLE categories (id TEXT PRIMARY KEY)');

    expect(tableExists(db, 'categories')).toBe(true);
    expect(tableExists(db, 'system_variable_formats')).toBe(false);
  });

  it('propagates a database failure instead of reporting the table as missing', () => {
    /* DBそのものが読めない状況を模した、getが必ず失敗するアダプター */
    const brokenDb: DbAdapter = {
      open: async () => {},
      close: () => {},
      get: () => {
        throw new Error('database is locked');
      },
      all: () => [],
      run: () => ({ lastInsertRowId: 0, changes: 0 }),
      transaction: (fn) => fn(),
      exec: async () => {},
    };

    expect(() => tableExists(brokenDb, 'categories')).toThrow('database is locked');
  });
});
