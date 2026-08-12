import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { setMainDbAdapter, setTempDbAdapter } from '../../src/adapters/DbAdapter';
import type { SubscriptionAdapter } from '../../src/adapters/SubscriptionAdapter';
import { CREATE_TABLES } from '../../src/database/schema';
import { ImportService } from '../../src/services/ImportService';
import { SubscriptionService } from '../../src/services/SubscriptionService';
import { createValidFlagsUpdater } from '../../src/services/validFlagsUpdater';
import {
  createMemoryDbAdapter,
  type MemoryDbAdapter,
} from '../helpers/memoryDbAdapter';

/**
 * 選択インポートは、既存と同名のカテゴリ・変数・プロファイルを再利用するときに
 * 表示順を変更しない。無料プランの有効判定は表示順で行うため、既存項目を末尾へ
 * 動かすと、それまで有効だった項目が上限超過分と入れ替わって無効になる。
 */
describe('ImportService display order preservation', () => {
  const databases: MemoryDbAdapter[] = [];

  /** Pro未加入として振る舞うサブスクリプションアダプター */
  const freeAdapter: SubscriptionAdapter = {
    isSubscribed: () => false,
    isLoading: () => false,
    checkSubscription: async () => false,
    subscribe: () => () => {},
    notifyListeners: () => {},
  };

  beforeEach(() => {
    SubscriptionService.setAdapter(freeAdapter);
    SubscriptionService.setValidFlagsUpdater(createValidFlagsUpdater());
  });

  afterEach(() => {
    databases.splice(0).forEach((db) => db.dispose());
  });

  const createDatabase = (): MemoryDbAdapter => {
    const db = createMemoryDbAdapter();
    databases.push(db);
    for (const sql of Object.values(CREATE_TABLES)) void db.exec(sql);
    return db;
  };

  /** メイン・一時DBを用意し、メインに標準プロファイルを作る */
  const setupDatabases = (): { main: MemoryDbAdapter; backup: MemoryDbAdapter } => {
    const main = createDatabase();
    const backup = createDatabase();
    setMainDbAdapter(main);
    setTempDbAdapter(backup);
    main.run(
      "INSERT INTO profiles VALUES ('main', 'Main', 1, 1, 1, 0, 'old-time', 'old-time')"
    );
    return { main, backup };
  };

  /** カスタム変数を1件挿入する */
  const insertVariable = (
    db: MemoryDbAdapter,
    id: string,
    name: string,
    sortOrder: number,
    valid = 1
  ): void => {
    db.run(
      'INSERT INTO variables VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, name, 'custom', name, null, valid, sortOrder, 'old-time', 'old-time']
    );
  };

  it('keeps the display order of an existing variable with the same name', async () => {
    const { main, backup } = setupDatabases();

    insertVariable(main, 'v1', 'company', 0);
    insertVariable(main, 'v2', 'address', 1);
    insertVariable(backup, 'i1', 'company', 7);

    await ImportService.importPartial('memory', [], [], ['i1'], []);

    expect(
      main.all('SELECT name, sortOrder FROM variables ORDER BY sortOrder')
    ).toEqual([
      { name: 'company', sortOrder: 0 },
      { name: 'address', sortOrder: 1 },
    ]);
  });

  it('keeps the display order of an existing profile with the same name', async () => {
    const { main, backup } = setupDatabases();

    main.run(
      "INSERT INTO profiles VALUES ('p2', 'Work', 0, 0, 1, 1, 'old-time', 'old-time')"
    );
    backup.run(
      "INSERT INTO profiles VALUES ('ip', 'Work', 0, 0, 1, 9, 'new-time', 'new-time')"
    );

    await ImportService.importPartial('memory', [], ['ip'], [], []);

    expect(
      main.all('SELECT name, sortOrder FROM profiles ORDER BY sortOrder')
    ).toEqual([
      { name: 'Main', sortOrder: 0 },
      { name: 'Work', sortOrder: 1 },
    ]);
  });

  it('keeps the display order of an existing category with the same name', async () => {
    const { main, backup } = setupDatabases();

    main.run("INSERT INTO categories VALUES ('c1', 'Mail', '#111111', 0, 'old-time')");
    main.run("INSERT INTO categories VALUES ('c2', 'Code', '#222222', 1, 'old-time')");
    backup.run("INSERT INTO categories VALUES ('ic', 'Mail', '#333333', 9, 'new-time')");

    await ImportService.importPartial('memory', [], [], [], ['ic']);

    expect(
      main.all('SELECT name, sortOrder FROM categories ORDER BY sortOrder')
    ).toEqual([
      { name: 'Mail', sortOrder: 0 },
      { name: 'Code', sortOrder: 1 },
    ]);
  });

  it('appends a newly imported variable to the end of the display order', async () => {
    const { main, backup } = setupDatabases();

    insertVariable(main, 'v1', 'company', 0);
    insertVariable(main, 'v2', 'address', 1);
    insertVariable(backup, 'i1', 'phone', 0);

    await ImportService.importPartial('memory', [], [], ['i1'], []);

    expect(
      main.all('SELECT name, sortOrder FROM variables ORDER BY sortOrder')
    ).toEqual([
      { name: 'company', sortOrder: 0 },
      { name: 'address', sortOrder: 1 },
      { name: 'phone', sortOrder: 2 },
    ]);
  });

  it('does not invalidate an already valid variable when importing the same name on the free plan', async () => {
    const { main, backup } = setupDatabases();

    /* 無料プランの上限は5件。6件目以降は無効として保持されている */
    for (let i = 0; i < 7; i += 1) {
      insertVariable(main, `v${i}`, `var${i}`, i, i < 5 ? 1 : 0);
    }
    insertVariable(backup, 'i1', 'var1', 0);

    await ImportService.importPartial('memory', [], [], ['i1'], []);

    expect(
      main.get<{ sortOrder: number; valid: number }>(
        'SELECT sortOrder, valid FROM variables WHERE name = ?',
        ['var1']
      )
    ).toEqual({ sortOrder: 1, valid: 1 });

    expect(
      main
        .all<{ name: string }>(
          'SELECT name FROM variables WHERE valid = 1 ORDER BY sortOrder'
        )
        .map((row) => row.name)
    ).toEqual(['var0', 'var1', 'var2', 'var3', 'var4']);
  });

  it('does not invalidate an already valid profile when importing the same name on the free plan', async () => {
    const { main, backup } = setupDatabases();

    /* 無料プランの上限は3件。標準プロファイルを含めて4件目以降は無効 */
    main.run(
      "INSERT INTO profiles VALUES ('p2', 'Work', 0, 0, 1, 1, 'old-time', 'old-time')"
    );
    main.run(
      "INSERT INTO profiles VALUES ('p3', 'Home', 0, 0, 1, 2, 'old-time', 'old-time')"
    );
    main.run(
      "INSERT INTO profiles VALUES ('p4', 'Trip', 0, 0, 0, 3, 'old-time', 'old-time')"
    );
    backup.run(
      "INSERT INTO profiles VALUES ('ip', 'Work', 0, 0, 1, 9, 'new-time', 'new-time')"
    );

    await ImportService.importPartial('memory', [], ['ip'], [], []);

    expect(
      main
        .all<{ name: string }>(
          'SELECT name FROM profiles WHERE valid = 1 ORDER BY sortOrder'
        )
        .map((row) => row.name)
    ).toEqual(['Main', 'Work', 'Home']);
  });
});
