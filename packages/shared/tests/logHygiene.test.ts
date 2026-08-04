import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../../..');

describe('native keyboard log hygiene', () => {
  it('routes iOS diagnostic output through a debug-only logger', () => {
    const paths = [
      'apps/mobile/ios/ClipTapKeyboard/KeyboardViewController.swift',
      'apps/mobile/ios/ClipTapKeyboard/Services/SnippetService.swift',
      'apps/mobile/ios/ClipTapKeyboard/Services/VariableService.swift',
      'apps/mobile/ios/ClipTapKeyboard/Mappers/ProfileVariableMapper.swift',
      'apps/mobile/ios/ClipTapKeyboard/Database/Database.swift',
      'apps/mobile/ios/ClipTap/FullAccessBridge.swift',
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
