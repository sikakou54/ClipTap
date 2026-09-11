import { afterEach, describe, expect, it } from 'vitest';
import { CREATE_TABLES } from '../../src/database/schema';
import { ExportMapper, type ExportSelection } from '../../src/mappers/ExportMapper';
import {
  createMemoryDbAdapter,
  type MemoryDbAdapter,
} from '../helpers/memoryDbAdapter';

describe('ExportMapper.deleteUnselectedData', () => {
  let db: MemoryDbAdapter | null = null;

  afterEach(() => {
    db?.dispose();
    db = null;
  });

  const setup = (): MemoryDbAdapter => {
    db = createMemoryDbAdapter();
    for (const sql of Object.values(CREATE_TABLES)) void db.exec(sql);

    db.run("INSERT INTO categories VALUES ('c1', 'category', NULL, 0, 'now')");
    db.run(
      "INSERT INTO snippets VALUES ('s1', 'title', 'body', 'c1', 0, 0, 'now', 'now')"
    );
    db.run(
      "INSERT INTO variables VALUES ('v1', 'custom', 'custom', NULL, NULL, 1, 0, 'now', 'now')"
    );
    db.run(
      "INSERT INTO profiles VALUES ('p1', 'profile', 1, 1, 1, 0, 'now', 'now')"
    );
    db.run("INSERT INTO profile_variables VALUES ('pv1', 'p1', 'v1', 'value', 'now', 'now')");
    db.run("INSERT INTO snippet_profiles VALUES ('s1', 'p1')");
    return db;
  };

  const cases: Array<[string, ExportSelection, number, number]> = [
    [
      'keeps all relations when every owner is selected',
      { snippetIds: ['s1'], profileIds: ['p1'], variableIds: ['v1'], categoryIds: ['c1'] },
      1,
      1,
    ],
    [
      'removes profile-variable relation when no variable is selected',
      { snippetIds: ['s1'], profileIds: ['p1'], variableIds: [], categoryIds: ['c1'] },
      0,
      1,
    ],
    [
      'removes both relations when no profile is selected',
      { snippetIds: ['s1'], profileIds: [], variableIds: ['v1'], categoryIds: ['c1'] },
      0,
      0,
    ],
    [
      'removes snippet-profile relation when no snippet is selected',
      { snippetIds: [], profileIds: ['p1'], variableIds: ['v1'], categoryIds: ['c1'] },
      1,
      0,
    ],
  ];

  it.each(cases)('%s', (_name, selection, profileVariableCount, snippetProfileCount) => {
    const adapter = setup();
    new ExportMapper(adapter).deleteUnselectedData(selection);

    expect(adapter.get<{ count: number }>('SELECT COUNT(*) AS count FROM profile_variables')?.count).toBe(
      profileVariableCount
    );
    expect(adapter.get<{ count: number }>('SELECT COUNT(*) AS count FROM snippet_profiles')?.count).toBe(
      snippetProfileCount
    );
  });

  /**
   * 選択外プロファイルのショートカットを出力へ残さない。
   *
   * ショートカットは選択軸に含めないが、1件のプロファイルへ必ず属するため、
   * 所属先を選ばなかった場合は関連ではなく本体ごと落とす必要がある。
   * 残すと、選択したつもりのないプロファイルのショートカット名と値が出力ファイルへ入る。
   */
  it('removes the shortcuts of unselected profiles', () => {
    const adapter = setup();
    adapter.run("INSERT INTO profiles VALUES ('p2', 'other', 0, 0, 1, 1, 'now', 'now')");
    adapter.run("INSERT INTO shortcuts VALUES ('sc1', 'p1', 'phone', 0, 'now', 'now')");
    adapter.run(
      "INSERT INTO shortcut_values VALUES ('sv1', 'sc1', 'mother', '080', 0, 0, 'now', 'now')"
    );
    adapter.run("INSERT INTO shortcuts VALUES ('sc2', 'p2', 'bank', 0, 'now', 'now')");
    adapter.run(
      "INSERT INTO shortcut_values VALUES ('sv2', 'sc2', 'main', '1234567', 0, 0, 'now', 'now')"
    );

    new ExportMapper(adapter).deleteUnselectedData({
      snippetIds: ['s1'],
      profileIds: ['p1'],
      variableIds: ['v1'],
      categoryIds: ['c1'],
    });

    expect(adapter.all<{ id: string }>('SELECT id FROM shortcuts')).toEqual([{ id: 'sc1' }]);
    expect(adapter.all<{ id: string }>('SELECT id FROM shortcut_values')).toEqual([
      { id: 'sv1' },
    ]);
  });

  /** プロファイルを1件も選ばなかった場合はショートカットも残らない */
  it('removes every shortcut when no profile is selected', () => {
    const adapter = setup();
    adapter.run("INSERT INTO shortcuts VALUES ('sc1', 'p1', 'phone', 0, 'now', 'now')");
    adapter.run(
      "INSERT INTO shortcut_values VALUES ('sv1', 'sc1', 'mother', '080', 0, 0, 'now', 'now')"
    );

    new ExportMapper(adapter).deleteUnselectedData({
      snippetIds: ['s1'],
      profileIds: [],
      variableIds: ['v1'],
      categoryIds: ['c1'],
    });

    expect(adapter.all('SELECT id FROM shortcuts')).toEqual([]);
    expect(adapter.all('SELECT id FROM shortcut_values')).toEqual([]);
  });
});
