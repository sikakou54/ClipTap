import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { setMainDbAdapter } from '../../src/adapters/DbAdapter';
import { CREATE_TABLES } from '../../src/database/schema';
import { ProfileService } from '../../src/services/ProfileService';
import {
  createMemoryDbAdapter,
  type MemoryDbAdapter,
} from '../helpers/memoryDbAdapter';

/**
 * アクティブ切替はDBの行そのものを書き換える。
 *
 * Providerは「アクティブ未設定なら標準を昇格させる」処理を持つため、
 * 昇格の前に読んだ一覧をそのまま画面へ渡すと、一覧のisActiveが全件falseのまま
 * アクティブプロファイルとだけ食い違う。食い違うと環境を指定した定型文が
 * 一覧から消えるため、「書き込み後に読み直せば正しい値が得られる」ことを固定する。
 */
describe('ProfileService.setActive', () => {
  let db: MemoryDbAdapter | null = null;

  beforeEach(() => {
    db = createMemoryDbAdapter();
    setMainDbAdapter(db);
    for (const sql of Object.values(CREATE_TABLES)) void db.exec(sql);
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
    options: { isDefault?: boolean; isActive?: boolean } = {}
  ): void => {
    const { isDefault = false, isActive = false } = options;
    db?.run('INSERT INTO profiles VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [
      id,
      id,
      isActive ? 1 : 0,
      isDefault ? 1 : 0,
      1,
      sortOrder,
      'created',
      'updated',
    ]);
  };

  /** アクティブ0件から標準を昇格させたあと、一覧を読み直せばisActiveが立っている */
  it('marks the promoted profile as active in the reloaded list', () => {
    insertProfile('standard', 0, { isDefault: true });
    insertProfile('work', 1);

    expect(ProfileService.getActive()).toBeNull();
    expect(ProfileService.getAllIncludingInvalid().some((p) => p.isActive)).toBe(false);

    ProfileService.setActive('standard');

    expect(ProfileService.getActive()?.id).toBe('standard');
    expect(
      ProfileService.getAllIncludingInvalid()
        .filter((p) => p.isActive)
        .map((p) => p.id)
    ).toEqual(['standard']);
  });

  /** 昇格の判断に使う getDefault() の戻り値は書き込み前の行なので、そのままでは使えない */
  it('returns a stale isActive on the object read before the write', () => {
    insertProfile('standard', 0, { isDefault: true });

    const beforeWrite = ProfileService.getDefault();
    ProfileService.setActive('standard');

    expect(beforeWrite?.isActive).toBe(false);
    expect(ProfileService.getActive()?.isActive).toBe(true);
  });

  /** 切替はアクティブを1件に保つ */
  it('keeps exactly one active profile after switching', () => {
    insertProfile('standard', 0, { isDefault: true, isActive: true });
    insertProfile('work', 1);

    ProfileService.setActive('work');

    expect(
      ProfileService.getAllIncludingInvalid()
        .filter((p) => p.isActive)
        .map((p) => p.id)
    ).toEqual(['work']);
  });
});
