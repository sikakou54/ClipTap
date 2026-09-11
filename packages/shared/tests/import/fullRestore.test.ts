import { afterEach, describe, expect, it } from 'vitest';
import { setMainDbAdapter, setTempDbAdapter } from '../../src/adapters/DbAdapter';
import { CREATE_TABLES } from '../../src/database/schema';
import { ImportService } from '../../src/services/ImportService';
import {
  createMemoryDbAdapter,
  type MemoryDbAdapter,
} from '../helpers/memoryDbAdapter';

describe('ImportService full restore', () => {
  const databases: MemoryDbAdapter[] = [];

  afterEach(() => {
    databases.splice(0).forEach((db) => db.dispose());
  });

  const createDatabase = (): MemoryDbAdapter => {
    const db = createMemoryDbAdapter();
    databases.push(db);
    for (const sql of Object.values(CREATE_TABLES)) void db.exec(sql);
    return db;
  };

  it('preserves identifiers, timestamps, counts, state and relations', async () => {
    const main = createDatabase();
    const backup = createDatabase();
    setMainDbAdapter(main);
    setTempDbAdapter(backup);

    main.run("INSERT INTO categories VALUES ('old', 'old', NULL, 0, 'old-time')");
    /* ショートカットは所属プロファイルを必須とするため、消される側にもプロファイルを置く */
    main.run(
      "INSERT INTO profiles VALUES ('old-p', 'old', 1, 1, 0, 0, 'old-time', 'old-time')"
    );
    backup.run("INSERT INTO categories VALUES ('c1', 'category', '#123456', 7, 'c-created')");
    backup.run(
      "INSERT INTO variables VALUES ('v1', 'token', 'custom', 'Token', NULL, 0, 8, 'v-created', 'v-updated')"
    );
    backup.run(
      "INSERT INTO profiles VALUES ('p1', 'profile', 1, 1, 0, 9, 'p-created', 'p-updated')"
    );
    backup.run(
      "INSERT INTO snippets VALUES ('s1', 'title', 'body', 'c1', 1, 42, 's-created', 's-updated')"
    );
    backup.run(
      "INSERT INTO profile_variables VALUES ('pv1', 'p1', 'v1', 'secret', 'pv-created', 'pv-updated')"
    );
    backup.run("INSERT INTO snippet_profiles VALUES ('s1', 'p1')");
    backup.run(
      "INSERT INTO system_variable_formats VALUES ('today', 'yyyy-MM-dd', 'format-updated')"
    );
    main.run(
      "INSERT INTO shortcuts VALUES ('old-sc', 'old-p', 'old', 0, 'old-time', 'old-time')"
    );
    main.run(
      "INSERT INTO shortcut_values VALUES ('old-sv', 'old-sc', 'old', 'old', 0, 0, 'old-time', 'old-time')"
    );
    backup.run(
      "INSERT INTO shortcuts VALUES ('sc1', 'p1', 'phone', 3, 'sc-created', 'sc-updated')"
    );
    backup.run(
      "INSERT INTO shortcut_values VALUES ('sv1', 'sc1', 'mother', '080-0000-0000', 12, 1, 'sv-created', 'sv-updated')"
    );

    await ImportService.importDatabaseFromTempDb('memory');

    expect(main.get('SELECT * FROM categories WHERE id = ?', ['c1'])).toMatchObject({
      sortOrder: 7,
      createdAt: 'c-created',
    });
    expect(main.get('SELECT * FROM variables WHERE id = ?', ['v1'])).toMatchObject({
      valid: 0,
      sortOrder: 8,
      createdAt: 'v-created',
      updatedAt: 'v-updated',
    });
    expect(main.get('SELECT * FROM profiles WHERE id = ?', ['p1'])).toMatchObject({
      isDefault: 1,
      isActive: 1,
      valid: 0,
      sortOrder: 9,
      createdAt: 'p-created',
      updatedAt: 'p-updated',
    });
    expect(main.get('SELECT * FROM snippets WHERE id = ?', ['s1'])).toMatchObject({
      copyWithTitle: 1,
      copyCount: 42,
      createdAt: 's-created',
      updatedAt: 's-updated',
    });
    expect(main.get('SELECT * FROM profile_variables WHERE id = ?', ['pv1'])).toMatchObject({
      value: 'secret',
      createdAt: 'pv-created',
      updatedAt: 'pv-updated',
    });
    expect(main.get('SELECT * FROM snippet_profiles')).toEqual({
      snippetId: 's1',
      profileId: 'p1',
    });
    expect(main.get('SELECT * FROM system_variable_formats')).toEqual({
      variableKey: 'today',
      pattern: 'yyyy-MM-dd',
      updatedAt: 'format-updated',
    });
    expect(main.get('SELECT * FROM shortcuts WHERE id = ?', ['sc1'])).toEqual({
      id: 'sc1',
      profileId: 'p1',
      name: 'phone',
      sortOrder: 3,
      createdAt: 'sc-created',
      updatedAt: 'sc-updated',
    });
    expect(main.get('SELECT * FROM shortcut_values WHERE id = ?', ['sv1'])).toEqual({
      id: 'sv1',
      shortcutId: 'sc1',
      name: 'mother',
      value: '080-0000-0000',
      useCount: 12,
      sortOrder: 1,
      createdAt: 'sv-created',
      updatedAt: 'sv-updated',
    });
    expect(main.get('SELECT id FROM categories WHERE id = ?', ['old'])).toBeNull();
    /* 全復元は既存のショートカットも入れ替える（値だけが取り残されない） */
    expect(main.get('SELECT id FROM shortcuts WHERE id = ?', ['old-sc'])).toBeNull();
    expect(main.get('SELECT id FROM shortcut_values WHERE id = ?', ['old-sv'])).toBeNull();
  });
});
