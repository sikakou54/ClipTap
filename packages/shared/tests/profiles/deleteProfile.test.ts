import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getMainDbAdapter, setMainDbAdapter } from '../../src/adapters/DbAdapter';
import type { SubscriptionAdapter } from '../../src/adapters/SubscriptionAdapter';
import { CREATE_TABLES } from '../../src/database/schema';
import { DefaultProfileDeleteError, NotFoundError } from '../../src/errors';
import { ProfileService } from '../../src/services/ProfileService';
import { SubscriptionService } from '../../src/services/SubscriptionService';
import { createValidFlagsUpdater } from '../../src/services/validFlagsUpdater';
import {
  createMemoryDbAdapter,
  type MemoryDbAdapter,
} from '../helpers/memoryDbAdapter';

/**
 * プロファイル削除はモバイルとWebで単一の経路（ProfileProvider.deleteProfile）に統一している。
 * その経路が行う「アクティブの振替 → 削除 → 有効フラグ再計算」を固定する。
 * 再計算を欠かすと、削除で上限に空きが出ても無効なプロファイルが無効のまま残る。
 */
describe('ProfileService.deleteWithAutoSwitch', () => {
  let db: MemoryDbAdapter | null = null;

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
    db = createMemoryDbAdapter();
    setMainDbAdapter(db);
    for (const sql of Object.values(CREATE_TABLES)) void db.exec(sql);
    SubscriptionService.setAdapter(freeAdapter);
    SubscriptionService.setValidFlagsUpdater(createValidFlagsUpdater());
  });

  afterEach(() => {
    db?.dispose();
    db = null;
  });

  /** 列順は id, name, isActive, isDefault, valid, sortOrder, createdAt, updatedAt */
  const insertProfile = (
    id: string,
    sortOrder: number,
    options: { isDefault?: boolean; isActive?: boolean; valid?: boolean } = {}
  ): void => {
    const { isDefault = false, isActive = false, valid = true } = options;
    db?.run(
      'INSERT INTO profiles VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, id, isActive ? 1 : 0, isDefault ? 1 : 0, valid ? 1 : 0, sortOrder, 'created', 'updated']
    );
  };

  /** 有効なプロファイルIDを表示順で取得する */
  const validIds = (): string[] =>
    db
      ?.all<{ id: string }>('SELECT id FROM profiles WHERE valid = 1 ORDER BY sortOrder ASC')
      .map((row) => row.id) ?? [];

  /** ProfileProvider.deleteProfile と同じ構成で削除する */
  const deleteThroughProvider = (id: string): void => {
    getMainDbAdapter().transaction(() => {
      ProfileService.deleteWithAutoSwitch(id);
      SubscriptionService.updateValidFlags();
    });
  };

  /**
   * 削除で上限に空きが出たら、無効なプロファイルが有効へ昇格する。
   * 再計算を呼ばないと無効のまま残るため、この経路の要になる。
   */
  it('promotes a disabled profile after deletion frees up a slot', () => {
    insertProfile('a', 0, { isDefault: true, isActive: true });
    insertProfile('b', 1);
    insertProfile('c', 2);
    insertProfile('d', 3, { valid: false });

    expect(validIds()).toEqual(['a', 'b', 'c']);

    deleteThroughProvider('c');

    expect(validIds()).toEqual(['a', 'b', 'd']);
  });

  /** アクティブなプロファイルを削除したら標準へ振り替える */
  it('moves the active profile to the default before deleting', () => {
    insertProfile('a', 0, { isDefault: true });
    insertProfile('b', 1, { isActive: true });

    deleteThroughProvider('b');

    expect(ProfileService.getActive()?.id).toBe('a');
    expect(ProfileService.getById('b')).toBeNull();
  });

  /** 標準プロファイルは削除できず、削除処理全体が巻き戻る */
  it('rejects deleting the default profile and rolls back', () => {
    insertProfile('a', 0, { isDefault: true, isActive: true });
    insertProfile('b', 1);

    expect(() => deleteThroughProvider('a')).toThrow(DefaultProfileDeleteError);
    expect(ProfileService.getById('a')).not.toBeNull();
    expect(ProfileService.getActive()?.id).toBe('a');
  });

  /** 存在しないプロファイルの削除はエラーにする（無言で成功させない） */
  it('rejects deleting an unknown profile', () => {
    insertProfile('a', 0, { isDefault: true, isActive: true });

    expect(() => deleteThroughProvider('missing')).toThrow(NotFoundError);
  });

  /** 削除したプロファイルの変数値も物理削除する */
  it('removes the variable values of the deleted profile', () => {
    insertProfile('a', 0, { isDefault: true, isActive: true });
    insertProfile('b', 1);
    db?.run(
      "INSERT INTO variables VALUES ('v1', 'token', 'custom', NULL, NULL, 1, 0, 'created', 'updated')"
    );
    db?.run(
      "INSERT INTO profile_variables VALUES ('pv1', 'b', 'v1', 'from-b', 'created', 'updated')"
    );

    deleteThroughProvider('b');

    expect(db?.all('SELECT id FROM profile_variables')).toEqual([]);
    expect(db?.all('SELECT id FROM variables')).toEqual([{ id: 'v1' }]);
  });

  /**
   * 削除したプロファイルのショートカットは値ごと物理削除する。
   *
   * ショートカットは必ず1件のプロファイルへ属するため、関連だけを外すと所属先の無い行が残る。
   * 実行時に外部キーを強制していないので、宣言したCASCADEでは消えない。
   * 他のプロファイルのショートカットを巻き込まないことも同時に固定する。
   */
  it('removes the shortcuts and their values of the deleted profile', () => {
    insertProfile('a', 0, { isDefault: true, isActive: true });
    insertProfile('b', 1);
    db?.run(
      "INSERT INTO shortcuts VALUES ('sc-a', 'a', 'phone', 0, 'created', 'updated')"
    );
    db?.run(
      "INSERT INTO shortcut_values VALUES ('sv-a', 'sc-a', 'mother', '080', 0, 0, 'created', 'updated')"
    );
    db?.run(
      "INSERT INTO shortcuts VALUES ('sc-b', 'b', 'phone', 0, 'created', 'updated')"
    );
    db?.run(
      "INSERT INTO shortcut_values VALUES ('sv-b', 'sc-b', 'father', '090', 0, 0, 'created', 'updated')"
    );

    deleteThroughProvider('b');

    expect(db?.all('SELECT id FROM shortcuts')).toEqual([{ id: 'sc-a' }]);
    expect(db?.all('SELECT id FROM shortcut_values')).toEqual([{ id: 'sv-a' }]);
  });

  /**
   * 有効フラグの再計算をProviderが呼ぶことを、実装のソースで固定する。
   * Providerはフックのため実DBテストから直接呼べず、上のケースは合成の正しさしか保証しない。
   * 呼び忘れると無効なプロファイルが無効のまま残るので、ここで欠落を検出する。
   */
  it('recalculates valid flags inside a transaction for both provider mutations', () => {
    const root = resolve(import.meta.dirname, '../..');
    const source = readFileSync(resolve(root, 'src/providers/ProfileProvider.tsx'), 'utf8');

    for (const call of ['ProfileService.deleteWithAutoSwitch(id)', 'ProfileService.setDefault(id)']) {
      const start = source.indexOf(call);
      expect(start).toBeGreaterThan(-1);
      /* 直前でトランザクションを開き、直後に有効フラグを再計算していること */
      const before = source.slice(Math.max(0, start - 120), start);
      const after = source.slice(start, start + 120);
      expect(before).toContain('getMainDbAdapter().transaction(');
      expect(after).toContain('SubscriptionService.updateValidFlags()');
    }
  });

  /** モバイルの一覧画面はServiceを直呼びせず、Provider経由で削除する */
  it('deletes through the provider on mobile instead of calling the service directly', () => {
    const root = resolve(import.meta.dirname, '../../../..');
    const source = readFileSync(
      resolve(root, 'apps/mobile/src/hooks/screens/useProfilesScreen.ts'),
      'utf8'
    );

    expect(source).toContain('deleteProfile(profile.id)');
    expect(source).not.toContain('ProfileService.deleteWithAutoSwitch');
  });
});
