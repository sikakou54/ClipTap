import { afterEach, describe, expect, it } from 'vitest';
import { migrateImportTempDb } from '../../src/database/migrations';
import { CREATE_INDEXES, CREATE_TABLES, SCHEMA_VERSION } from '../../src/database/schema';
import {
  createMemoryDbAdapter,
  type MemoryDbAdapter,
} from '../helpers/memoryDbAdapter';

/**
 * 移行段の選択は宣言バージョンだけで行い、移行後は「必須テーブルが揃っているか」だけを確認する。
 * テーブル名は CREATE_TABLES のDDLから導出しているため、スキーマ定義との二重管理は無い。
 * ここではその導出が実際の作成結果と一致し続けることを固定する。
 */
describe('latest schema post-condition', () => {
  const databases: MemoryDbAdapter[] = [];

  afterEach(() => databases.splice(0).forEach((db) => db.dispose()));

  /** 現行スキーマ定義そのままの新規DBを作る */
  const createLatestDatabase = async (): Promise<MemoryDbAdapter> => {
    const db = createMemoryDbAdapter();
    databases.push(db);
    for (const sql of Object.values(CREATE_TABLES)) await db.exec(sql);
    for (const sql of Object.values(CREATE_INDEXES)) await db.exec(sql);
    return db;
  };

  it('accepts a freshly created database as the latest schema', async () => {
    const db = await createLatestDatabase();

    await expect(migrateImportTempDb(db, SCHEMA_VERSION)).resolves.toBeUndefined();
  });

  /** 新しいテーブルをschema.tsへ追加しても、導出により検証対象へ自動で入る */
  it('requires every table the current schema definition creates', async () => {
    const referenceDb = await createLatestDatabase();
    const tables = referenceDb
      .all<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
      )
      .map((row) => row.name);

    expect(tables.length).toBeGreaterThan(0);

    for (const table of tables) {
      const db = createMemoryDbAdapter();
      databases.push(db);
      /* 対象テーブルだけ作らずに、他は現行定義どおり作る */
      for (const sql of Object.values(CREATE_TABLES)) {
        if (!new RegExp(`CREATE TABLE IF NOT EXISTS ${table}\\b`).test(sql)) await db.exec(sql);
      }

      await expect(
        migrateImportTempDb(db, SCHEMA_VERSION),
        `${table} must be required by the post-migration check`
      ).rejects.toThrow(table);
    }
  });

  /** 派生indexが参照する列の欠落は、index作成そのものが失敗して検知される */
  it('fails when a column referenced by a derived index is missing', async () => {
    const db = createMemoryDbAdapter();
    databases.push(db);
    for (const [name, sql] of Object.entries(CREATE_TABLES)) {
      await db.exec(
        name === 'snippets'
          ? sql.replace(/^\s*copyCount .*$/m, '')
          : sql
      );
    }

    await expect(migrateImportTempDb(db, SCHEMA_VERSION)).rejects.toThrow();
  });
});
