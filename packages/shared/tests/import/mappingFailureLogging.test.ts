/**
 * 既存マッピングの事前作成が失敗したときの縮退動作を固定するテスト
 *
 * prepareExistingProfileMapping / prepareExistingCategoryMapping は
 * 失敗しても取込を中断しない設計だが、無音で握り潰すと原因追跡ができない。
 * 「取込は完了する」ことと「警告ログが残る」ことの両方を固定する。
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setMainDbAdapter, setTempDbAdapter } from '../../src/adapters/DbAdapter';
import type { SubscriptionAdapter } from '../../src/adapters/SubscriptionAdapter';
import { CREATE_TABLES } from '../../src/database/schema';
import { CategoryService } from '../../src/services/CategoryService';
import { ImportService } from '../../src/services/ImportService';
import { SubscriptionService } from '../../src/services/SubscriptionService';
import { createValidFlagsUpdater } from '../../src/services/validFlagsUpdater';
import { Logger } from '../../src/utils/logger';
import {
  createMemoryDbAdapter,
  type MemoryDbAdapter,
} from '../helpers/memoryDbAdapter';

describe('ImportService existing mapping failures', () => {
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
    vi.restoreAllMocks();
  });

  const createDatabase = (): MemoryDbAdapter => {
    const db = createMemoryDbAdapter();
    databases.push(db);
    for (const sql of Object.values(CREATE_TABLES)) void db.exec(sql);
    return db;
  };

  /** メイン・一時DBを用意し、一時DB側へ取り込み対象の定型文を1件置く */
  const setupDatabases = (): { main: MemoryDbAdapter; backup: MemoryDbAdapter } => {
    const main = createDatabase();
    const backup = createDatabase();
    setMainDbAdapter(main);
    setTempDbAdapter(backup);
    main.run(
      "INSERT INTO profiles VALUES ('main', 'Main', 1, 1, 1, 0, 'old-time', 'old-time')"
    );
    backup.run(
      "INSERT INTO snippets VALUES ('s1', 'title', 'body', NULL, 0, 0, 'new-time', 'new-time')"
    );
    return { main, backup };
  };

  it('warns and keeps importing when the existing profile mapping cannot be built', async () => {
    const { main, backup } = setupDatabases();
    const warn = vi.spyOn(Logger, 'warn').mockImplementation(() => {});

    /* 事前マッピングだけを失敗させる */
    await backup.exec('DROP TABLE profiles');

    await ImportService.importPartial('memory', ['s1'], [], [], []);

    expect(main.all('SELECT title FROM snippets')).toEqual([{ title: 'title' }]);
    expect(
      warn.mock.calls.some(([message]) =>
        String(message).includes('Failed to prepare existing profile mapping')
      )
    ).toBe(true);
  });

  it('warns and keeps importing when the existing category mapping cannot be built', async () => {
    const { main, backup } = setupDatabases();
    const warn = vi.spyOn(Logger, 'warn').mockImplementation(() => {});

    /* 事前マッピングだけを失敗させる（取り込み対象の選択には含めない） */
    backup.run("INSERT INTO categories VALUES ('c1', 'Work', NULL, 0, 'new-time')");
    vi.spyOn(CategoryService, 'getByName').mockImplementation(() => {
      throw new Error('forced category lookup failure');
    });

    await ImportService.importPartial('memory', ['s1'], [], [], []);

    expect(main.all('SELECT title FROM snippets')).toEqual([{ title: 'title' }]);
    expect(
      warn.mock.calls.some(([message]) =>
        String(message).includes('Failed to prepare existing category mapping')
      )
    ).toBe(true);
  });
});
