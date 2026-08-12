import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { setMainDbAdapter } from '../../src/adapters/DbAdapter';
import type { SubscriptionAdapter } from '../../src/adapters/SubscriptionAdapter';
import { CREATE_TABLES } from '../../src/database/schema';
import { InvalidProfileDefaultError, NotFoundError } from '../../src/errors';
import { ProfileService } from '../../src/services/ProfileService';
import { SubscriptionService } from '../../src/services/SubscriptionService';
import { createValidFlagsUpdater } from '../../src/services/validFlagsUpdater';
import {
  createMemoryDbAdapter,
  type MemoryDbAdapter,
} from '../helpers/memoryDbAdapter';

/**
 * 標準プロファイルは変数値のフォールバック先であり、無効プロファイル指定時の振替先でもある。
 * 利用者が切り替えられるようになったため、切替の一意性・無効プロファイルの拒否・
 * 有効判定の再計算・フォールバックの追随を固定する。
 */
describe('ProfileService.setDefault', () => {
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

  /**
   * プロファイルを挿入する
   * 列順は id, name, isActive, isDefault, valid, sortOrder, createdAt, updatedAt
   */
  const insertProfile = (
    id: string,
    sortOrder: number,
    options: { isDefault?: boolean; isActive?: boolean; valid?: boolean } = {}
  ): void => {
    const { isDefault = false, isActive = false, valid = true } = options;
    db?.run(
      'INSERT INTO profiles VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        id,
        id,
        isActive ? 1 : 0,
        isDefault ? 1 : 0,
        valid ? 1 : 0,
        sortOrder,
        'created',
        'updated',
      ]
    );
  };

  /** 標準フラグが立っているプロファイルIDを表示順で取得する */
  const defaultIds = (): string[] =>
    db
      ?.all<{ id: string }>('SELECT id FROM profiles WHERE isDefault = 1 ORDER BY sortOrder ASC')
      .map((row) => row.id) ?? [];

  /** 有効なプロファイルIDを表示順で取得する */
  const validIds = (): string[] =>
    db
      ?.all<{ id: string }>('SELECT id FROM profiles WHERE valid = 1 ORDER BY sortOrder ASC')
      .map((row) => row.id) ?? [];

  /**
   * 一覧は標準を先頭に置き、その後は表示順にする。
   * 有効判定がSET_VALID_BY_LIMITで同じ並びを使うため、上からN件が有効と一致する。
   */
  it('lists the default profile first, then the sort order', () => {
    insertProfile('a', 0);
    insertProfile('b', 1);
    insertProfile('c', 2, { valid: false });
    insertProfile('d', 3, { isDefault: true, isActive: true });

    expect(ProfileService.getAllIncludingInvalid().map((p) => p.id)).toEqual([
      'd',
      'a',
      'b',
      'c',
    ]);
    expect(ProfileService.getAll().map((p) => p.id)).toEqual(['d', 'a', 'b']);
  });

  /**
   * キーボードは共有SQLiteを別実装で読むため、並び順の指定が独立している。
   * 揃えないとアプリとキーボードでプロファイルの並びが食い違う。
   */
  it('uses the same ordering in both native keyboard implementations', () => {
    const root = resolve(import.meta.dirname, '../../../..');
    const sources = [
      'apps/mobile/ios/ClipTapKeyboard/Mappers/ProfileMapper.swift',
      'apps/mobile/android/app/src/main/java/com/sikakou/cliptap/mappers/ProfileMapper.kt',
    ].map((path) => readFileSync(resolve(root, path), 'utf8'));

    for (const source of sources) {
      expect(source).toContain('ORDER BY isDefault DESC, sortOrder ASC');
      /* 表示順だけで並べる指定が残っていないこと */
      expect(source).not.toMatch(/ORDER BY sortOrder ASC/);
    }
  });

  /** 標準を切り替えると一覧の先頭も入れ替わる */
  it('moves the switched profile to the top of the list', () => {
    insertProfile('a', 0, { isDefault: true, isActive: true });
    insertProfile('b', 1);
    insertProfile('c', 2);

    ProfileService.setDefault('c');

    expect(ProfileService.getAllIncludingInvalid().map((p) => p.id)).toEqual([
      'c',
      'a',
      'b',
    ]);
  });

  it('moves the default flag to the target and leaves exactly one default', () => {
    insertProfile('a', 0, { isDefault: true, isActive: true });
    insertProfile('b', 1);

    ProfileService.setDefault('b');

    expect(defaultIds()).toEqual(['b']);
  });

  it('rejects a disabled profile and leaves the default untouched', () => {
    insertProfile('a', 0, { isDefault: true, isActive: true });
    insertProfile('b', 1, { valid: false });

    expect(() => ProfileService.setDefault('b')).toThrow(InvalidProfileDefaultError);
    expect(defaultIds()).toEqual(['a']);
  });

  it('rejects an unknown profile', () => {
    insertProfile('a', 0, { isDefault: true, isActive: true });

    expect(() => ProfileService.setDefault('missing')).toThrow(NotFoundError);
    expect(defaultIds()).toEqual(['a']);
  });

  /**
   * 有効判定は「標準を最優先、その後は表示順」で行う。
   * 標準が表示順の下位にある状態から上位へ切り替えると有効な集合が入れ替わるため、
   * 切替後の再計算が要る。
   */
  it('recomputes the valid set when the default moves up the sort order', () => {
    insertProfile('a', 0);
    insertProfile('b', 1);
    insertProfile('c', 2, { valid: false });
    insertProfile('d', 3, { isDefault: true, isActive: true });

    expect(validIds()).toEqual(['a', 'b', 'd']);

    ProfileService.setDefault('a');
    SubscriptionService.updateValidFlags();

    expect(defaultIds()).toEqual(['a']);
    expect(validIds()).toEqual(['a', 'b', 'c']);
  });

  /** 無効になったプロファイルがアクティブだった場合は標準へ振り替える */
  it('moves the active profile to the new default when the old one becomes invalid', () => {
    insertProfile('a', 0);
    insertProfile('b', 1);
    insertProfile('c', 2, { valid: false });
    insertProfile('d', 3, { isDefault: true, isActive: true });

    ProfileService.setDefault('a');
    SubscriptionService.updateValidFlags();

    expect(ProfileService.getActive()?.id).toBe('a');
  });

  /** 標準を切り替えると変数値のフォールバック元も切り替わる */
  it('switches the source of the standard variable values', () => {
    insertProfile('a', 0, { isDefault: true, isActive: true });
    insertProfile('b', 1);
    db?.run(
      "INSERT INTO variables VALUES ('v1', 'token', 'custom', NULL, NULL, 1, 0, 'created', 'updated')"
    );
    db?.run(
      "INSERT INTO profile_variables VALUES ('pv1', 'a', 'v1', 'from-a', 'created', 'updated')"
    );
    db?.run(
      "INSERT INTO profile_variables VALUES ('pv2', 'b', 'v1', 'from-b', 'created', 'updated')"
    );

    expect(ProfileService.getDefaultProfileVariablesMap()).toEqual({ token: 'from-a' });

    ProfileService.setDefault('b');

    expect(ProfileService.getDefaultProfileVariablesMap()).toEqual({ token: 'from-b' });
  });
});
