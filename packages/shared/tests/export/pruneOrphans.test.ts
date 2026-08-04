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
});
