import { createHash } from 'node:crypto';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { setCryptoAdapter } from '../../src/adapters/CryptoAdapter';
import { setImportAdapter } from '../../src/adapters/ImportAdapter';
import { setTempDbAdapter } from '../../src/adapters/DbAdapter';
import type { DbAdapter } from '../../src/adapters/DbAdapter';
import { ImportService } from '../../src/services/ImportService';
import { SCHEMA_VERSION } from '../../src/database/schema';
import { tableExists } from '../../src/database/migrations';
import { buildChecksumPayload, buildPasswordHashInput } from '../../src/utils/exportImportUtils';
import {
  createMemoryDbAdapter,
  type MemoryDbAdapter,
} from '../helpers/memoryDbAdapter';

const PASSWORD = 'test';

const sha256 = async (input: string): Promise<string> =>
  createHash('sha256').update(input).digest('hex');

/** parseAndValidateのヘッダー検証を通過する最小のSQLiteバイナリを作る */
const createSqliteBytes = (): Uint8Array => {
  const bytes = new Uint8Array(32);
  bytes.set(Buffer.from('SQLite format 3\0', 'binary'));
  return bytes;
};

const encodeDoubleBase64 = (bytes: Uint8Array): string => {
  const base64 = Buffer.from(bytes).toString('base64');
  return Buffer.from(base64, 'utf8').toString('base64');
};

/** 指定スキーマ版のエクスポートファイル（.cliptap）相当のJSONを組み立てる */
async function buildExportJson(schemaVersion: number): Promise<string> {
  const data = {
    s: schemaVersion,
    t: '2026-08-05T00:00:00.000Z',
    h: await sha256(buildPasswordHashInput(PASSWORD, schemaVersion)),
    d: encodeDoubleBase64(createSqliteBytes()),
  };
  return JSON.stringify({ ...data, c: await sha256(buildChecksumPayload(data)) });
}

/**
 * 一時DBアダプターの呼び出し順を記録するラッパー
 *
 * Web（sql.js）はopen()でファイルをメモリへ複製するため、
 * close()より前にpersist()を呼ばないとマイグレーション結果が失われる。
 */
function createRecordingTempDbAdapter(base: MemoryDbAdapter): {
  adapter: DbAdapter;
  calls: string[];
} {
  const calls: string[] = [];

  return {
    calls,
    adapter: {
      ...base,
      async persist(): Promise<void> {
        calls.push('persist');
      },
      close(): void {
        calls.push('close');
      },
    },
  };
}

/** V5相当（sortOrderあり・copyCountなし・書式テーブルなし）のスキーマを作る */
async function seedV5Schema(db: MemoryDbAdapter): Promise<void> {
  await db.exec(`
    CREATE TABLE variables (id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, type TEXT NOT NULL, label TEXT, icon TEXT, valid INTEGER DEFAULT 1, sortOrder INTEGER DEFAULT 0, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL);
    CREATE TABLE profiles (id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, isActive INTEGER DEFAULT 0, isDefault INTEGER DEFAULT 0, valid INTEGER DEFAULT 1, sortOrder INTEGER DEFAULT 0, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL);
    CREATE TABLE snippets (id TEXT PRIMARY KEY, title TEXT, content TEXT NOT NULL, categoryId TEXT, copyWithTitle INTEGER DEFAULT 0, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL);
  `);
}

describe('ImportService.prepareImportDatabase', () => {
  const databases: MemoryDbAdapter[] = [];
  let currentExportJson = '';

  beforeAll(() => {
    setCryptoAdapter({ sha256 });
    setImportAdapter({
      readImportFile: async () => currentExportJson,
      writeTempDatabase: async (fileName: string) => `/tmp/${fileName}`,
      getDatabasePath: async () => '/tmp/main.db',
      copyFile: async () => undefined,
      deleteFile: async () => undefined,
    });
  });

  afterEach(() => databases.splice(0).forEach((db) => db.dispose()));

  const prepare = async (schemaVersion: number) => {
    currentExportJson = await buildExportJson(schemaVersion);

    const base = createMemoryDbAdapter();
    databases.push(base);
    await seedV5Schema(base);

    const { adapter, calls } = createRecordingTempDbAdapter(base);
    setTempDbAdapter(adapter);

    await ImportService.prepareImportDatabase(PASSWORD, 'file://backup.cliptap');

    return { base, calls };
  };

  it('persists the migrated temp database before closing it', async () => {
    const { base, calls } = await prepare(5);

    /* 書き戻しをclose()より前に行わないと、開き直した時点で移行結果が失われる */
    expect(calls).toEqual(['persist', 'close']);

    const snippetColumns = base
      .all<{ name: string }>("SELECT name FROM pragma_table_info('snippets')")
      .map((column) => column.name);
    expect(snippetColumns).toContain('copyCount');
    expect(tableExists(base, 'system_variable_formats')).toBe(true);
  });

  it('does not persist when the file already matches the current schema version', async () => {
    const { calls } = await prepare(SCHEMA_VERSION);

    expect(calls).toEqual([]);
  });
});
