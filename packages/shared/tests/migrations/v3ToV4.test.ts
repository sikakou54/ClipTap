import { afterEach, describe, expect, it } from 'vitest';
import { migrateV3ToV4 } from '../../src/database/migrations';
import {
  createMemoryDbAdapter,
  type MemoryDbAdapter,
} from '../helpers/memoryDbAdapter';

describe('migrateV3ToV4', () => {
  const databases: MemoryDbAdapter[] = [];

  afterEach(() => databases.splice(0).forEach((db) => db.dispose()));

  const createDatabase = (): MemoryDbAdapter => {
    const db = createMemoryDbAdapter();
    databases.push(db);
    return db;
  };

  it('copies variables and profile values without silently dropping required fields', async () => {
    const source = createDatabase();
    const destination = createDatabase();
    await source.exec(`
      CREATE TABLE categories (id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, color TEXT, sortOrder INTEGER DEFAULT 0, createdAt TEXT NOT NULL);
      CREATE TABLE snippets (id TEXT PRIMARY KEY, title TEXT, content TEXT NOT NULL, categoryId TEXT, copyWithTitle INTEGER DEFAULT 0, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL);
      CREATE TABLE variables (id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, type TEXT NOT NULL, label TEXT, icon TEXT, valid INTEGER DEFAULT 1, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL);
      CREATE TABLE profiles (id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, isActive INTEGER DEFAULT 0, isDefault INTEGER DEFAULT 0, valid INTEGER DEFAULT 1, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL);
      CREATE TABLE profile_variables (id TEXT PRIMARY KEY, profileId TEXT NOT NULL, variableId TEXT NOT NULL, value TEXT NOT NULL, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL, UNIQUE(profileId, variableId));
      CREATE TABLE snippet_profiles (snippetId TEXT NOT NULL, profileId TEXT NOT NULL, PRIMARY KEY (snippetId, profileId));
    `);
    source.run(
      "INSERT INTO variables VALUES ('v1', 'token', 'custom', 'Token', NULL, 1, 'v-created', 'v-updated')"
    );
    source.run(
      "INSERT INTO profiles VALUES ('p1', 'profile', 1, 1, 1, 'p-created', 'p-updated')"
    );
    source.run(
      "INSERT INTO profile_variables VALUES ('pv1', 'p1', 'v1', 'value', 'pv-created', 'pv-updated')"
    );

    await migrateV3ToV4(destination, source);

    expect(destination.get('SELECT * FROM variables WHERE id = ?', ['v1'])).toMatchObject({
      createdAt: 'v-created',
      updatedAt: 'v-updated',
    });
    expect(destination.get('SELECT * FROM profile_variables WHERE id = ?', ['pv1'])).toMatchObject({
      profileId: 'p1',
      variableId: 'v1',
      value: 'value',
      createdAt: 'pv-created',
      updatedAt: 'pv-updated',
    });
  });

  /**
   * V2より前のDBにはsnippet_profiles / variables / profile_variablesが無い。
   * テーブル不在は移行の失敗ではないため、警告だけ残して残りのデータを移す。
   */
  it('skips the tables that did not exist before V2 and copies the rest', async () => {
    const source = createDatabase();
    const destination = createDatabase();
    await source.exec(`
      CREATE TABLE categories (id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, color TEXT, sortOrder INTEGER DEFAULT 0, createdAt TEXT NOT NULL);
      CREATE TABLE snippets (id TEXT PRIMARY KEY, title TEXT, content TEXT NOT NULL, categoryId TEXT, copyWithTitle INTEGER DEFAULT 0, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL);
      CREATE TABLE profiles (id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, isActive INTEGER DEFAULT 0, isDefault INTEGER DEFAULT 0, valid INTEGER DEFAULT 1, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL);
    `);
    source.run(
      "INSERT INTO categories VALUES ('c1', 'Mail', '#111111', 0, 'c-created')"
    );
    source.run(
      "INSERT INTO snippets VALUES ('s1', 'Title', 'Content', 'c1', 1, 's-created', 's-updated')"
    );
    source.run(
      "INSERT INTO profiles VALUES ('p1', 'profile', 1, 1, 1, 'p-created', 'p-updated')"
    );

    await migrateV3ToV4(destination, source);

    expect(destination.get('SELECT * FROM categories WHERE id = ?', ['c1'])).toMatchObject({
      name: 'Mail',
      createdAt: 'c-created',
    });
    expect(destination.get('SELECT * FROM snippets WHERE id = ?', ['s1'])).toMatchObject({
      content: 'Content',
      copyWithTitle: 1,
    });
    expect(destination.get('SELECT * FROM profiles WHERE id = ?', ['p1'])).toMatchObject({
      name: 'profile',
      valid: 1,
    });
    expect(destination.all('SELECT * FROM variables')).toEqual([]);
    expect(destination.all('SELECT * FROM profile_variables')).toEqual([]);
  });

  /**
   * テーブルはあるが列が欠けている旧DBは、コピーが失敗する。
   * 黙って空のまま移行を完了するとデータを失うため、呼び出し元まで送出して停止させる。
   */
  it('fails instead of silently dropping a table whose columns are incomplete', async () => {
    const source = createDatabase();
    const destination = createDatabase();
    await source.exec(`
      CREATE TABLE categories (id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, color TEXT, sortOrder INTEGER DEFAULT 0, createdAt TEXT NOT NULL);
      CREATE TABLE snippets (id TEXT PRIMARY KEY, title TEXT, content TEXT NOT NULL, categoryId TEXT, copyWithTitle INTEGER DEFAULT 0, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL);
      CREATE TABLE profiles (id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, isActive INTEGER DEFAULT 0, isDefault INTEGER DEFAULT 0, valid INTEGER DEFAULT 1, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL);
      CREATE TABLE variables (id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, type TEXT NOT NULL, label TEXT, valid INTEGER DEFAULT 1, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL);
      CREATE TABLE profile_variables (id TEXT PRIMARY KEY, profileId TEXT NOT NULL, variableId TEXT NOT NULL, value TEXT NOT NULL, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL, UNIQUE(profileId, variableId));
    `);
    source.run(
      "INSERT INTO profiles VALUES ('p1', 'profile', 1, 1, 1, 'p-created', 'p-updated')"
    );
    /* icon列を持たない旧variables。SELECT *の行にiconが無く、バインドで失敗する */
    source.run(
      "INSERT INTO variables VALUES ('v1', 'token', 'custom', 'Token', 1, 'v-created', 'v-updated')"
    );
    source.run(
      "INSERT INTO profile_variables VALUES ('pv1', 'p1', 'v1', 'value', 'pv-created', 'pv-updated')"
    );

    await expect(migrateV3ToV4(destination, source)).rejects.toThrow();

    /* profilesまでは進んでおり、失敗したのはvariablesのコピーであることを示す */
    expect(destination.get('SELECT * FROM profiles WHERE id = ?', ['p1'])).toMatchObject({
      name: 'profile',
    });
    expect(destination.all('SELECT * FROM variables')).toEqual([]);
    expect(destination.all('SELECT * FROM profile_variables')).toEqual([]);
  });
});
