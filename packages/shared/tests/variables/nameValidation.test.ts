import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { setMainDbAdapter } from '../../src/adapters/DbAdapter';
import { CREATE_TABLES } from '../../src/database/schema';
import { VariableNameInvalidError } from '../../src/errors';
import { VariableService } from '../../src/services/VariableService';
import {
  createMemoryDbAdapter,
  type MemoryDbAdapter,
} from '../helpers/memoryDbAdapter';

/**
 * 変数名の検証はVariableServiceを正本とする。
 *
 * 画面側が独自の正規表現を持つと「先頭が数字の名前を作れる画面」が生まれ、
 * 展開側の規則と食い違う。長さ上限は入力UIの責務であり、
 * 保存層には設けない（既存・取込データとの互換のため）。
 */
describe('VariableService name validation', () => {
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

  /** 先頭が数字の名前は拒否する（英字またはアンダースコアで始まること） */
  it('rejects a name that starts with a digit', () => {
    expect(() => VariableService.create({ name: '1abc', type: 'custom' })).toThrow(
      VariableNameInvalidError
    );
  });

  /** 前後空白は除去したうえで検証・保存する */
  it('trims the name before validating and storing it', () => {
    const created = VariableService.create({ name: '  abc  ', type: 'custom' });

    expect(created.name).toBe('abc');
  });

  /** 保存層に長さ上限は設けない（上限判定は入力UIの責務） */
  it('accepts a name longer than the input limit', () => {
    const longName = 'a'.repeat(31);

    expect(VariableService.create({ name: longName, type: 'custom' }).name).toBe(longName);
  });

  /** 更新でも名前は実際に書き換わる */
  it('updates the stored name', () => {
    const created = VariableService.create({ name: 'before', type: 'custom' });

    const updated = VariableService.update(created.id, { name: 'after' });

    expect(updated.name).toBe('after');
    expect(VariableService.getAll().map((v) => v.name)).toEqual(['after']);
  });

  /** 更新でも同じ形式検証が働く */
  it('rejects an invalid name on update', () => {
    const created = VariableService.create({ name: 'before', type: 'custom' });

    expect(() => VariableService.update(created.id, { name: '1abc' })).toThrow(
      VariableNameInvalidError
    );
  });
});
