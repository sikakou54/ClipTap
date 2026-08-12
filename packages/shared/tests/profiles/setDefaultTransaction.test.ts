import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  getMainDbAdapter,
  setMainDbAdapter,
  setTempDbAdapter,
} from '../../src/adapters/DbAdapter';
import type { SubscriptionAdapter } from '../../src/adapters/SubscriptionAdapter';
import { CREATE_TABLES } from '../../src/database/schema';
import { ImportService } from '../../src/services/ImportService';
import { ProfileService } from '../../src/services/ProfileService';
import { SubscriptionService } from '../../src/services/SubscriptionService';
import { createValidFlagsUpdater } from '../../src/services/validFlagsUpdater';
import {
  createMemoryDbAdapter,
  type MemoryDbAdapter,
} from '../helpers/memoryDbAdapter';

/**
 * 標準切替のトランザクション境界を固定する。
 *
 * 標準の切替は「isDefaultの一括リセット」と「対象のみ有効化」の2文で構成されるため、
 * 途中で失敗すると標準0件になり変数値のフォールバック先が失われる。
 * これを防ぐトランザクションは呼び出し側（Provider）に置く必要がある。
 * Mapper側で張ると、インポートの復旧処理がトランザクション内からsetDefaultを呼ぶため
 * 入れ子になり、SAVEPOINT非対応のアダプターで取込全体が失敗するからである。
 */
describe('setDefault transaction boundary', () => {
  const databases: MemoryDbAdapter[] = [];

  /** 無料プランを表すサブスクリプションアダプター */
  const freeAdapter: SubscriptionAdapter = {
    isSubscribed: () => false,
    isLoading: () => false,
    checkSubscription: async () => false,
    subscribe: () => () => {},
    notifyListeners: () => {},
    refreshCustomerInfo: async () => {},
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

  /**
   * 呼び出し側でトランザクションを張る運用（ProfileProvider.setDefaultProfileと同じ構成）。
   * 途中で失敗しても標準0件の状態を残さない。
   */
  it('keeps the previous default when the switch fails midway', async () => {
    const main = createDatabase();
    setMainDbAdapter(main);

    main.run("INSERT INTO profiles VALUES ('a', 'A', 1, 1, 1, 0, 'created', 'updated')");
    main.run("INSERT INTO profiles VALUES ('b', 'B', 0, 0, 1, 1, 'created', 'updated')");

    /* 対象を標準にする更新だけを失敗させ、直前の一括リセットが巻き戻ることを確認する */
    await main.exec(`
      CREATE TRIGGER reject_set_default
      BEFORE UPDATE ON profiles
      WHEN NEW.isDefault = 1 AND NEW.id = 'b'
      BEGIN
        SELECT RAISE(ABORT, 'forced set default failure');
      END;
    `);

    expect(() =>
      getMainDbAdapter().transaction(() => {
        ProfileService.setDefault('b');
        SubscriptionService.updateValidFlags();
      })
    ).toThrow();

    expect(
      main.all<{ id: string }>('SELECT id FROM profiles WHERE isDefault = 1')
    ).toEqual([{ id: 'a' }]);
  });

  /**
   * 標準フラグを持たないバックアップの全復元。
   * ensureDefaultAndActiveがImportServiceのトランザクション内からsetDefaultを呼ぶ経路であり、
   * Mapper側でトランザクションを張ると入れ子になって取込全体が失敗する。
   */
  it('restores a backup that has no default profile', async () => {
    const main = createDatabase();
    const backup = createDatabase();
    setMainDbAdapter(main);
    setTempDbAdapter(backup);

    main.run("INSERT INTO profiles VALUES ('old', 'Old', 1, 1, 1, 0, 'old-time', 'old-time')");
    backup.run(
      "INSERT INTO profiles VALUES ('restored', 'Restored', 0, 0, 1, 0, 'new-time', 'new-time')"
    );

    await expect(
      ImportService.importDatabaseFromTempDb('memory')
    ).resolves.toBeUndefined();

    expect(
      main.all<{ id: string }>('SELECT id FROM profiles WHERE isDefault = 1')
    ).toEqual([{ id: 'restored' }]);
    expect(ProfileService.getActive()?.id).toBe('restored');
  });

  /**
   * 全復元したバックアップのプロファイルが全件無効な場合は補完しない。
   * 無効なプロファイルを標準にすると値フォールバック先と振替先が失われるためである。
   */
  it('does not fill in the default when every restored profile is disabled', async () => {
    const main = createDatabase();
    const backup = createDatabase();
    setMainDbAdapter(main);
    setTempDbAdapter(backup);

    main.run("INSERT INTO profiles VALUES ('old', 'Old', 1, 1, 1, 0, 'old-time', 'old-time')");
    backup.run(
      "INSERT INTO profiles VALUES ('disabled', 'Disabled', 0, 0, 0, 0, 'new-time', 'new-time')"
    );

    await expect(
      ImportService.importDatabaseFromTempDb('memory')
    ).resolves.toBeUndefined();

    expect(main.all('SELECT id FROM profiles WHERE isDefault = 1')).toEqual([]);
  });
});
