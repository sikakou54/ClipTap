import { existsSync, readFileSync } from 'node:fs';
import { dirname, posix, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { listSourceFiles, REPOSITORY_ROOT } from '../helpers/sourceScan';

/**
 * コメント内 `@see` の参照切れガード
 *
 * @remarks
 * `@see` はコンパイル対象ではないため、参照先を移動・改名・削除しても
 * 型チェックもLintも通ってしまう。実在しないパスを指す `@see` が残り続けると
 * コメントが読み手を誤った場所へ誘導するため、パス形式の `@see` だけを取り出して
 * 参照先が実在することを機械的に確認する。
 */

/** 走査対象（両アプリ・API・共有パッケージのアプリケーションコード） */
const SCAN_DIRS = [
  'apps/mobile/app',
  'apps/mobile/src',
  'apps/web/src',
  'apps/api/src',
  'packages/shared/src',
];

/**
 * 走査対象へ個別に加えるファイル
 *
 * @remarks
 * ワークスペース直下には `node_modules` や `ios` / `android` があり、
 * ディレクトリごと再帰走査すると走査対象外の巨大なツリーまで読み込む。
 * 直下に置かれたソースはファイル単位で列挙する。
 */
const SCAN_FILES = ['apps/mobile/global.d.ts'];

/**
 * 相対パスの解決起点になり得るディレクトリ（ワークスペース単位）
 *
 * @remarks
 * 既存コメントは `packages/shared/src/...`（リポジトリルート基準）、
 * `app/settings/index.tsx`（ワークスペースルート基準）、
 * `components/snippet/SnippetCard.tsx`（`src` 基準）を混在して使う。
 * 各配列の先頭をワークスペースルートとし、参照元ファイルを含む
 * ワークスペースの起点だけを解決候補にする。
 */
const RESOLUTION_BASES: readonly (readonly string[])[] = [
  ['apps/mobile', 'apps/mobile/src', 'apps/mobile/app'],
  ['apps/web', 'apps/web/src'],
  ['apps/api', 'apps/api/src'],
  ['packages/shared', 'packages/shared/src'],
];

/** パスとみなす拡張子（ディレクトリ区切りを含まない参照の判定に使う） */
const PATH_EXTENSIONS = /\.(?:ts|tsx|js|jsx|mjs|cjs|json|md|html|css)$/;

/** `@see` の行から参照先トークンだけを取り出す */
const SEE_PATTERN = /@see\s+(\S+)/g;

/** 検出した `@see` 参照 */
interface SeeReference {
  /** リポジトリルートからの相対パス */
  readonly file: string;
  /** 1始まりの行番号 */
  readonly line: number;
  /** `@see` の直後に書かれたトークン */
  readonly target: string;
}

/**
 * 参照先トークンがファイルパスを指しているか判定する
 *
 * @remarks
 * URL（`https://...`）、npmパッケージ名（`@cliptap/shared`）、
 * 識別子（`useTheme` / `SnippetCard` / `DESIGN_TOKENS`）はパスではないため除外する。
 *
 * @param target - `@see` の直後に書かれたトークン
 * @returns パス形式なら true
 */
function isPathLike(target: string): boolean {
  if (/^https?:\/\//.test(target)) return false;
  if (target.startsWith('@')) return false;
  return target.includes('/') || PATH_EXTENSIONS.test(target);
}

/**
 * 参照先トークンを解決し、実在するファイルまたはディレクトリかを判定する
 *
 * @param target - `@see` の直後に書かれたトークン
 * @param fromFile - 参照元ファイル（リポジトリルートからの相対パス）
 * @returns いずれかの起点で実在すれば true
 */
function resolves(target: string, fromFile: string): boolean {
  const workspace = RESOLUTION_BASES.find((group) => fromFile.startsWith(`${group[0]}/`)) ?? [];
  const bases = ['.', dirname(fromFile), ...workspace];

  return bases.some((base) =>
    existsSync(resolve(REPOSITORY_ROOT, posix.normalize(posix.join(base, target)))),
  );
}

/**
 * 1ファイルから `@see` のパス参照を収集する
 *
 * @param file - リポジトリルートからの相対パス
 * @returns パス形式の `@see` 参照の配列
 */
function collectSeeReferences(file: string): SeeReference[] {
  const lines = readFileSync(resolve(REPOSITORY_ROOT, file), 'utf8').split('\n');
  const references: SeeReference[] = [];

  lines.forEach((text, index) => {
    for (const match of text.matchAll(SEE_PATTERN)) {
      const target = match[1];
      if (isPathLike(target)) references.push({ file, line: index + 1, target });
    }
  });

  return references;
}

describe('@see reference hygiene', () => {
  const scanned = [...SCAN_DIRS.flatMap((dir) => listSourceFiles(dir)), ...SCAN_FILES];
  const references = scanned.flatMap(collectSeeReferences);

  it('走査対象のソースとパス形式の@seeを検出できている', () => {
    expect(scanned.length).toBeGreaterThan(0);
    expect(references.length).toBeGreaterThan(0);
  });

  it('パス形式の@seeはすべて実在するファイルを指す', () => {
    const broken = references
      .filter((reference) => !resolves(reference.target, reference.file))
      .map((reference) => `${reference.file}:${reference.line} ${reference.target}`);

    expect(broken).toEqual([]);
  });

  it('パス判定と解決処理が実際に働いている', () => {
    /* パスではない参照を弾き、実在しないパスは解決できないことを確認して空振りを防ぐ */
    expect(isPathLike('https://shopify.github.io/flash-list/docs/usage')).toBe(false);
    expect(isPathLike('@cliptap/shared')).toBe(false);
    expect(isPathLike('useTheme')).toBe(false);
    expect(isPathLike('src/hooks/screens/useHomeScreen.ts')).toBe(true);
    expect(resolves('src/hooks/screens/useHomeScreen.ts', 'apps/mobile/app/index.tsx')).toBe(true);
    expect(resolves('app/snippet/new.tsx', 'apps/mobile/app/index.tsx')).toBe(false);
  });
});
