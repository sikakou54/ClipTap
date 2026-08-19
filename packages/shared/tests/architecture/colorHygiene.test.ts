import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { listSourceFiles, REPOSITORY_ROOT } from '../helpers/sourceScan';

/**
 * 色のハードコードガード
 *
 * @remarks
 * 画面・コンポーネントに色を直書きすると、ダークモードの切り替え対象から漏れ、
 * ライト固定の色が暗い背景の上に残る。色の決定はテーマトークン
 * （packages/shared/src/providers/ThemeTypes.ts のパレット → apps/mobile/src/themeSystem.tsx）
 * に一元化しているため、それ以外の場所にカラーリテラルが無いことを検査する。
 */

/** 走査対象（モバイルアプリの画面とコンポーネント） */
const SCAN_DIRS = ['apps/mobile/app', 'apps/mobile/src'];

/**
 * テーマトークンを経由しない色を書いてよい例外
 *
 * @remarks
 * ネイティブのスプラッシュ画面（app.json の splash 設定）と色を一致させる必要があり、
 * テーマの切り替え対象にできないファイルだけを許可する。
 */
const ALLOWED_FILES = [
  'apps/mobile/app/_layout.tsx',
  'apps/mobile/src/components/common/SplashScreen.tsx',
];

/**
 * 色の定義そのものを担うファイル
 *
 * @remarks
 * 走査対象外だが、パレットの置き場が移動したことに気付けるよう実在とカラーリテラルを確認する。
 * apps/mobile/src/themeSystem.tsx は共有パレットを再輸出するだけでリテラルを持たないため、
 * ここには含めない。
 */
const THEME_TOKEN_FILES = [
  'packages/shared/src/providers/ThemeTypes.ts',
  'packages/shared/src/constants/designTokens.ts',
];

/**
 * カラーリテラル（#RGB / #RGBA / #RRGGBB / #RRGGBBAA / rgb() / rgba()）
 *
 * @remarks
 * 引用符の直前に限定すると、テンプレートリテラル内や末尾に空白がある記述を取り逃がすため、
 * 語境界で判定する。
 */
const COLOR_LITERAL = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b|\brgba?\(/;

/**
 * コメントを取り除く
 *
 * サンプル値としてカラーコードを書いた説明文まで検出してしまわないようにする。
 */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}

/** ファイル内のカラーリテラル行を `<パス>:<行> <内容>` 形式で列挙する */
function colorLiteralLines(path: string): string[] {
  return stripComments(readFileSync(resolve(REPOSITORY_ROOT, path), 'utf8'))
    .split('\n')
    .map((text, index) => ({ line: index + 1, text: text.trim() }))
    .filter((entry) => COLOR_LITERAL.test(entry.text))
    .map((entry) => `${path}:${entry.line} ${entry.text}`);
}

describe('mobile color hygiene', () => {
  const scanned = SCAN_DIRS.flatMap((dir) => listSourceFiles(dir));

  it('走査対象のソースが存在する', () => {
    expect(scanned.length).toBeGreaterThan(0);
  });

  it('画面とコンポーネントの色はすべてテーマトークン経由で指定する', () => {
    const offenders = scanned
      .filter((path) => !ALLOWED_FILES.includes(path))
      .flatMap(colorLiteralLines);

    expect(offenders).toEqual([]);
  });

  it('例外として許可したファイルは実在し、実際にカラーリテラルを含む', () => {
    /* 許可リストが古くなって空振りしていないことを確認する */
    for (const path of ALLOWED_FILES) {
      expect(scanned).toContain(path);
      expect(colorLiteralLines(path).length).toBeGreaterThan(0);
    }
  });

  it('テーマトークン定義側にはカラーリテラルが存在する', () => {
    for (const path of THEME_TOKEN_FILES) {
      expect(colorLiteralLines(path).length).toBeGreaterThan(0);
    }
  });
});
