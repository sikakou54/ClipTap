import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { listSourceFiles, REPOSITORY_ROOT } from '../helpers/sourceScan';

/**
 * レイヤー境界ガード（UI層 → Service層 → Mapper層）
 *
 * @remarks
 * CLAUDE.mdのアーキテクチャでは、画面・コンポーネント・フックといったUI層は
 * Service層を経由してデータへ触る。UI層がMapperを直接importすると、
 * 上限判定や有効フラグ更新といったService層の責務を素通りしてしまうため、
 * 機械的に検出する。
 */

/** 走査対象（両アプリのアプリケーションコード全体） */
const SCAN_DIRS = ['apps/mobile/app', 'apps/mobile/src', 'apps/web/src'];

/**
 * Mapperを直接使ってよいデータ層
 *
 * @remarks
 * DBの初期化と初期データ投入だけはService層より下のレイヤーであり、
 * Mapperを直接使うのが正しい。apps/mobile/src/database/seed.ts も
 * このディレクトリに含まれるため個別指定は不要。
 */
const DATA_LAYER_DIRS = ['apps/mobile/src/database/', 'apps/web/src/database/'];

/**
 * packages/shared/src/index.ts が公開してよいMapper
 *
 * @remarks
 * ここが `export * from './mappers'` に戻ると、UI層からMapperが見えるようになり
 * 本ガードの前提が崩れる。公開集合そのものを固定して再発を防ぐ。
 */
const PUBLIC_MAPPERS = [
  'CategoryMapper',
  'ProfileMapper',
  'ProfileVariableMapper',
  'SnippetMapper',
  'SystemVariableFormatMapper',
  'VariableMapper',
];

/** 共有パッケージの公開エントリポイント */
const SHARED_ENTRY = 'packages/shared/src/index.ts';

/** ソースをTypeScript ASTへ変換する */
function parse(path: string): ts.SourceFile {
  return ts.createSourceFile(
    path,
    readFileSync(resolve(REPOSITORY_ROOT, path), 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    path.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
}

/**
 * `@cliptap/shared` からimportしているMapper名を取り出す
 *
 * @param path - リポジトリルートからの相対パス
 * @returns `<パス>:<行> <Mapper名>` 形式の配列
 */
function sharedMapperImports(path: string): string[] {
  const source = parse(path);
  const found: string[] = [];

  for (const statement of source.statements) {
    if (!ts.isImportDeclaration(statement)) continue;
    if (!ts.isStringLiteral(statement.moduleSpecifier)) continue;
    if (!/^@cliptap\/shared(?:\/|$)/.test(statement.moduleSpecifier.text)) continue;

    const bindings = statement.importClause?.namedBindings;
    if (!bindings || !ts.isNamedImports(bindings)) continue;

    for (const element of bindings.elements) {
      const name = (element.propertyName ?? element.name).text;
      if (!name.endsWith('Mapper')) continue;
      const line = source.getLineAndCharacterOfPosition(element.getStart(source)).line + 1;
      found.push(`${path}:${line} ${name}`);
    }
  }

  return found;
}

describe('layer boundary', () => {
  const scanned = SCAN_DIRS.flatMap((dir) => listSourceFiles(dir));
  const isDataLayer = (path: string): boolean =>
    DATA_LAYER_DIRS.some((dir) => path.startsWith(dir));

  it('走査対象のソースが存在する', () => {
    expect(scanned.length).toBeGreaterThan(0);
  });

  it('UI層は@cliptap/sharedからMapperを直接importしない', () => {
    const offenders = scanned
      .filter((path) => !isDataLayer(path))
      .flatMap(sharedMapperImports);

    expect(offenders).toEqual([]);
  });

  it('検出処理が実際に働いている（データ層ではMapperのimportを検出できる）', () => {
    /* 許可リストを外すと検出される実例があることを確認し、空振りのガードにしない */
    const dataLayerImports = scanned.filter(isDataLayer).flatMap(sharedMapperImports);

    expect(dataLayerImports.length).toBeGreaterThan(0);
  });

  it('共有パッケージが公開するMapperはデータ層が使う6クラスに限られる', () => {
    const source = parse(SHARED_ENTRY);
    const exported = new Set<string>();
    let hasMapperStarExport = false;

    for (const statement of source.statements) {
      if (!ts.isExportDeclaration(statement)) continue;
      if (!statement.moduleSpecifier || !ts.isStringLiteral(statement.moduleSpecifier)) continue;
      if (!/\.\/mappers(?:\/|$)/.test(statement.moduleSpecifier.text)) continue;

      const clause = statement.exportClause;
      if (!clause) {
        hasMapperStarExport = true;
        continue;
      }
      if (!ts.isNamedExports(clause)) continue;
      for (const element of clause.elements) exported.add(element.name.text);
    }

    expect(hasMapperStarExport).toBe(false);
    expect([...exported].sort()).toEqual(PUBLIC_MAPPERS);
  });
});
