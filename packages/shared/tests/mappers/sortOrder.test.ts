import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { setMainDbAdapter } from '../../src/adapters/DbAdapter';
import { CREATE_TABLES } from '../../src/database/schema';
import { SnippetMapper } from '../../src/mappers/SnippetMapper';
import {
  createMemoryDbAdapter,
  type MemoryDbAdapter,
} from '../helpers/memoryDbAdapter';

describe('snippet title sorting', () => {
  let db: MemoryDbAdapter | null = null;

  afterEach(() => {
    db?.dispose();
    db = null;
  });

  it('places NULL titles last', () => {
    db = createMemoryDbAdapter();
    setMainDbAdapter(db);
    for (const sql of Object.values(CREATE_TABLES)) void db.exec(sql);
    db.run("INSERT INTO snippets VALUES ('null', NULL, 'body', NULL, 0, 0, 'now', 'now')");
    db.run("INSERT INTO snippets VALUES ('beta', 'Beta', 'body', NULL, 0, 0, 'now', 'now')");
    db.run("INSERT INTO snippets VALUES ('alpha', 'Alpha', 'body', NULL, 0, 0, 'now', 'now')");

    expect(SnippetMapper.getSorted('title').map((snippet) => snippet.id)).toEqual([
      'alpha',
      'beta',
      'null',
    ]);
  });

  it('uses the SQLite-compatible expression in both native keyboard implementations', () => {
    const root = resolve(import.meta.dirname, '../../../..');
    const sources = [
      'apps/mobile/ios/ClipTapKeyboard/Mappers/SnippetMapper.swift',
      'apps/mobile/android/app/src/main/java/com/sikakou/cliptap/mappers/SnippetMapper.kt',
    ].map((path) => readFileSync(resolve(root, path), 'utf8'));

    for (const source of sources) {
      expect(source).toContain('ORDER BY title IS NULL, title ASC, createdAt DESC');
      expect(source).not.toContain('NULLS LAST');
    }
  });
});
