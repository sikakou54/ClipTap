import { afterEach, describe, expect, it } from 'vitest';
import { setTempDbAdapter } from '../../src/adapters/DbAdapter';
import { CREATE_TABLES } from '../../src/database/schema';
import { ImportService } from '../../src/services/ImportService';
import {
  createMemoryDbAdapter,
  type MemoryDbAdapter,
} from '../helpers/memoryDbAdapter';

/**
 * インポート選択画面に出す候補の中身と並び順を固定する。
 * 候補の組み立ては一時DBの件数分だけクエリを増やさない実装へ変えたため、
 * 変更前と同じ内容・同じ並びで返ることをここで担保する。
 */
describe('ImportMapper import candidates', () => {
  const databases: MemoryDbAdapter[] = [];

  afterEach(() => databases.splice(0).forEach((db) => db.dispose()));

  /** 現行スキーマのテーブルだけを張った一時DBを作り、取り込み元として登録する */
  const setupTempDatabase = (): MemoryDbAdapter => {
    const db = createMemoryDbAdapter();
    databases.push(db);
    /* 実機と同じく外部キーは実行時に強制しない（削除済みプロファイルへの紐付きが残りうる） */
    void db.exec('PRAGMA foreign_keys = OFF');
    for (const sql of Object.values(CREATE_TABLES)) void db.exec(sql);
    setTempDbAdapter(db);
    return db;
  };

  /** 候補の並びを確認できる最小のデータを投入する */
  const insertFixture = (db: MemoryDbAdapter): void => {
    db.run("INSERT INTO categories VALUES ('c1', 'Mail', '#111111', 0, 'created')");
    db.run("INSERT INTO profiles VALUES ('p2', 'Home', 0, 0, 1, 1, 'created', 'updated')");
    db.run("INSERT INTO profiles VALUES ('p1', 'Work', 1, 1, 1, 0, 'created', 'updated')");
    db.run(
      "INSERT INTO snippets VALUES ('s1', 'Greeting', 'Hello', 'c1', 0, 0, 'created', '2024-01-02')"
    );
    db.run(
      "INSERT INTO snippets VALUES ('s2', NULL, 'Untitled', NULL, 0, 0, 'created', '2024-01-01')"
    );
    /* 挿入順とprofileId順をずらし、並びが主キー順であることを確かめる */
    db.run("INSERT INTO snippet_profiles VALUES ('s1', 'p2')");
    db.run("INSERT INTO snippet_profiles VALUES ('s1', 'p1')");
    /* 既に削除されたプロファイルへの紐付け */
    db.run("INSERT INTO snippet_profiles VALUES ('s1', 'gone')");

    db.run(
      "INSERT INTO variables VALUES ('v1', 'company', 'custom', 'Company', NULL, 1, 0, 'created', 'updated')"
    );
    db.run(
      "INSERT INTO variables VALUES ('v2', 'address', 'custom', 'Address', NULL, 1, 1, 'created', 'updated')"
    );
    /* システム変数は候補に出ない */
    db.run(
      "INSERT INTO variables VALUES ('v3', 'today', 'date', 'Today', NULL, 1, 2, 'created', 'updated')"
    );
    db.run("INSERT INTO profile_variables VALUES ('pv1', 'p2', 'v1', 'home value', 'created', 'updated')");
    db.run("INSERT INTO profile_variables VALUES ('pv2', 'p1', 'v1', 'work value', 'created', 'updated')");
    /* 既に削除されたプロファイルの値 */
    db.run("INSERT INTO profile_variables VALUES ('pv3', 'gone', 'v1', 'orphan value', 'created', 'updated')");
    db.run("INSERT INTO profile_variables VALUES ('pv4', 'p1', 'v3', 'system value', 'created', 'updated')");
  };

  it('attaches the linked profiles to each snippet in primary key order', async () => {
    const db = setupTempDatabase();
    insertFixture(db);

    const candidates = await ImportService.getImportCandidates('memory');

    expect(candidates.snippets.map((s) => s.id)).toEqual(['s1', 's2']);
    expect(candidates.snippets[0]).toEqual({
      id: 's1',
      title: 'Greeting',
      content: 'Hello',
      categoryName: 'Mail',
      updatedAt: '2024-01-02',
      profiles: [
        { profileId: 'gone', profileName: null },
        { profileId: 'p1', profileName: 'Work' },
        { profileId: 'p2', profileName: 'Home' },
      ],
    });
  });

  it('returns an empty profile list for a snippet without links', async () => {
    const db = setupTempDatabase();
    insertFixture(db);

    const candidates = await ImportService.getImportCandidates('memory');

    expect(candidates.snippets[1]).toEqual({
      id: 's2',
      title: null,
      content: 'Untitled',
      categoryName: null,
      updatedAt: '2024-01-01',
      profiles: [],
    });
  });

  it('lists only custom variables with their per-profile values in insertion order', async () => {
    const db = setupTempDatabase();
    insertFixture(db);

    const candidates = await ImportService.getImportCandidates('memory');

    expect(candidates.variables.map((v) => v.id)).toEqual(['v1', 'v2']);
    expect(candidates.variables.map((v) => v.profileValues)).toEqual([
      [
        { profileId: 'p2', profileName: 'Home', value: 'home value' },
        { profileId: 'p1', profileName: 'Work', value: 'work value' },
        { profileId: 'gone', profileName: null, value: 'orphan value' },
      ],
      [],
    ]);
  });

  it('returns profiles and categories in display order', async () => {
    const db = setupTempDatabase();
    insertFixture(db);

    const candidates = await ImportService.getImportCandidates('memory');

    expect(candidates.profiles.map((p) => p.id)).toEqual(['p1', 'p2']);
    expect(candidates.categories).toEqual([
      { id: 'c1', name: 'Mail', color: '#111111', sortOrder: 0, createdAt: 'created' },
    ]);
  });

  it('returns empty lists for an empty backup', async () => {
    setupTempDatabase();

    const candidates = await ImportService.getImportCandidates('memory');

    expect(candidates).toEqual({
      snippets: [],
      profiles: [],
      variables: [],
      categories: [],
    });
  });
});
