import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../../..');

/**
 * console 直呼びを検査するTypeScriptソースのルート
 *
 * 共通Loggerを経由せずに console を呼ぶと、本番環境でのログ抑止と
 * プレフィックス付与が効かなくなるため、全ワークスペースを対象にする。
 */
const TS_SOURCE_ROOTS = [
  'apps/web/src',
  'apps/mobile/src',
  'apps/mobile/app',
  'packages/shared/src',
];

/**
 * console 直呼びを唯一許可するファイル
 *
 * 共通Loggerの実装本体であり、ここだけが console を呼ぶ責務を持つ。
 */
const CONSOLE_ALLOWED_FILES = ['packages/shared/src/utils/logger.ts'];

/**
 * 指定ディレクトリ配下のTypeScriptソースをすべて列挙する
 *
 * @param dir - 走査対象のディレクトリ（リポジトリルートからの相対パス）
 * @returns リポジトリルートからの相対パスの配列
 */
function listTypeScriptFiles(dir: string): string[] {
  const entries = readdirSync(resolve(root, dir), { withFileTypes: true });
  return entries.flatMap((entry) => {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) return listTypeScriptFiles(path);
    if (!/\.tsx?$/.test(entry.name)) return [];
    return [path];
  });
}

describe('typescript log hygiene', () => {
  it('routes every diagnostic output through the shared Logger', () => {
    const offenders = TS_SOURCE_ROOTS.flatMap(listTypeScriptFiles)
      .filter((path) => !CONSOLE_ALLOWED_FILES.includes(path))
      .filter((path) => /\bconsole\s*\./.test(readFileSync(resolve(root, path), 'utf8')));

    expect(offenders).toEqual([]);
  });

  it('keeps the shared Logger as the only console caller', () => {
    const source = readFileSync(resolve(root, 'packages/shared/src/utils/logger.ts'), 'utf8');

    expect(source).toMatch(/\bconsole\s*\./);
  });
});

describe('native keyboard log hygiene', () => {
  it('routes iOS diagnostic output through a debug-only logger', () => {
    const paths = [
      'apps/mobile/ios/ClipTapKeyboard/KeyboardViewController.swift',
      'apps/mobile/ios/ClipTapKeyboard/Services/SnippetService.swift',
      'apps/mobile/ios/ClipTapKeyboard/Services/VariableService.swift',
      'apps/mobile/ios/ClipTapKeyboard/Mappers/ProfileVariableMapper.swift',
      'apps/mobile/ios/ClipTapKeyboard/Database/Database.swift',
    ];
    const source = paths.map((path) => readFileSync(resolve(root, path), 'utf8')).join('\n');

    expect(source).not.toMatch(/\bNSLog\(/);
    expect(source).not.toMatch(/\bprint\(/);
    expect(source).not.toContain('map.description');
    expect(source).not.toMatch(/KeyboardLog\.debug\([^\n]*(?:\.content|\.title|absolutePath)/);
    expect(source).not.toMatch(/KeyboardLog\.debug\([^\n]*(?:Container URL|Full database path|Query:|stringValue')/);
    expect(source).not.toMatch(/OSLog\(subsystem:/);
  });

  it('guards every Android debug log in release builds and excludes sensitive values', () => {
    const paths = [
      'apps/mobile/android/app/src/main/java/com/sikakou/cliptap/keyboard/ClipTapKeyboardService.kt',
      'apps/mobile/android/app/src/main/java/com/sikakou/cliptap/database/Database.kt',
      'apps/mobile/android/app/src/main/java/com/sikakou/cliptap/mappers/VariableMapper.kt',
      'apps/mobile/android/app/src/main/java/com/sikakou/cliptap/mappers/SnippetMapper.kt',
    ];
    const lines = paths
      .flatMap((path) => readFileSync(resolve(root, path), 'utf8').split('\n'))
      .filter((line) => line.includes('Log.d('));

    expect(lines.length).toBeGreaterThan(0);
    for (const line of lines) expect(line).toContain('BuildConfig.DEBUG');
    expect(lines.join('\n')).not.toMatch(/(?:absolutePath|\$dbPath|\$sharedPath|snippet\.title|snippet\.content)/);
  });
});
