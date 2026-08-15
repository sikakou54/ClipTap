import { afterEach, describe, expect, it } from 'vitest';
import { setMainDbAdapter } from '../../src/adapters/DbAdapter';
import { CREATE_TABLES } from '../../src/database/schema';
import { ProfileMapper } from '../../src/mappers/ProfileMapper';
import { SystemVariableFormatMapper } from '../../src/mappers/SystemVariableFormatMapper';
import { VariableMapper } from '../../src/mappers/VariableMapper';
import {
  createMemoryDbAdapter,
  type MemoryDbAdapter,
} from '../helpers/memoryDbAdapter';

/**
 * 有効フラグ（Proプラン制限）のDB値0/1が、そのままエンティティのbooleanになることを固定する。
 */
describe('valid flag conversion', () => {
  const databases: MemoryDbAdapter[] = [];

  afterEach(() => databases.splice(0).forEach((db) => db.dispose()));

  /** 現行スキーマのテーブルを張ったメインDBを用意する */
  const setupMainDatabase = (): MemoryDbAdapter => {
    const db = createMemoryDbAdapter();
    databases.push(db);
    for (const sql of Object.values(CREATE_TABLES)) void db.exec(sql);
    setMainDbAdapter(db);
    return db;
  };

  it('maps the stored profile flag to a boolean', () => {
    const db = setupMainDatabase();
    db.run("INSERT INTO profiles VALUES ('p1', 'Valid', 1, 1, 1, 0, 'created', 'updated')");
    db.run("INSERT INTO profiles VALUES ('p2', 'Invalid', 0, 0, 0, 1, 'created', 'updated')");

    expect(
      ProfileMapper.getAllIncludingInvalid().map((p) => ({ id: p.id, valid: p.valid }))
    ).toEqual([
      { id: 'p1', valid: true },
      { id: 'p2', valid: false },
    ]);
  });

  it('maps the stored variable flag to a boolean', () => {
    const db = setupMainDatabase();
    db.run(
      "INSERT INTO variables VALUES ('v1', 'valid', 'custom', 'Valid', NULL, 1, 0, 'created', 'updated')"
    );
    db.run(
      "INSERT INTO variables VALUES ('v2', 'invalid', 'custom', 'Invalid', NULL, 0, 1, 'created', 'updated')"
    );

    expect(
      VariableMapper.getAllIncludingInvalid().map((v) => ({ id: v.id, valid: v.valid }))
    ).toEqual([
      { id: 'v1', valid: true },
      { id: 'v2', valid: false },
    ]);
  });
});

/**
 * 書式設定テーブルはV7で追加されたため、それ以前の形のDBでも読み取りが壊れてはならない。
 */
describe('SystemVariableFormatMapper on a database without the format table', () => {
  const databases: MemoryDbAdapter[] = [];

  afterEach(() => databases.splice(0).forEach((db) => db.dispose()));

  it('returns an empty format set instead of failing', async () => {
    const db = createMemoryDbAdapter();
    databases.push(db);
    setMainDbAdapter(db);
    await db.exec(CREATE_TABLES.variables);

    expect(SystemVariableFormatMapper.getAll()).toEqual({});
  });
});
