#!/usr/bin/env node
/**
 * キー配列のネイティブソースを生成する
 *
 * 【目的】
 * 拡張キーボードのキー配列を Swift と Kotlin へ二重に手書きすると、
 * 必ず片方だけがズレる。packages/shared のTypeScriptを正本とし、
 * そこから各ネイティブのソースを生成して同期を保証する。
 *
 * JSONをリソースとして配るのではなく生成にしているのは、
 * 不正な配列が実行時ではなくビルド時に落ちること、iOSでリソース登録が不要なこと、
 * メモリ制約のある拡張内でランタイムのJSON解析を避けられることによる。
 *
 * 【使い方】
 *   node scripts/gen-keyboard-layouts.mjs           # 生成する
 *   node scripts/gen-keyboard-layouts.mjs --check   # 生成物が最新か検査する（CI用）
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LAYOUT_SOURCE = join(REPO_ROOT, 'packages/shared/src/keyboard/layout.ts');
const VARIANTS_SOURCE = join(REPO_ROOT, 'packages/shared/src/keyboard/kanaVariants.ts');
const GENERATED_DIR = join(
  REPO_ROOT,
  'apps/mobile/ios/ClipTapKeyboardCore/Sources/ClipTapKeyboardCore/Generated'
);
const SWIFT_OUT = join(GENERATED_DIR, 'KeyLayouts.generated.swift');
const VARIANTS_SWIFT_OUT = join(GENERATED_DIR, 'KanaVariants.generated.swift');

const isCheckMode = process.argv.includes('--check');

/**
 * TypeScriptの正本を読み込む
 *
 * 型注釈を落とすためにesbuildで一度JavaScriptへ変換してから取り込む。
 * ビルド済みの成果物に依存すると、正本を編集したのに生成が古いままという
 * ずれが起きるため、常にソースから読む。
 */
async function loadModule(sourcePath) {
  let esbuild;
  try {
    esbuild = await import('esbuild');
  } catch {
    console.error('esbuild が見つかりません。npm install を実行してください。');
    process.exit(1);
  }

  const result = await esbuild.build({
    entryPoints: [sourcePath],
    bundle: true,
    format: 'esm',
    platform: 'node',
    write: false,
  });

  const code = Buffer.from(result.outputFiles[0].text).toString('base64');
  return import(`data:text/javascript;base64,${code}`);
}

/** Swiftの文字列リテラルとして安全な形へ変換する */
function swiftString(value) {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

/** KeyAction を Swift の式へ変換する */
function swiftAction(action) {
  switch (action.type) {
    case 'input':
      return `.input(${swiftString(action.text)})`;
    case 'switchLayout':
      return `.switchLayout(.${action.layoutId})`;
    case 'cursor':
      return `.cursor(offset: ${action.offset})`;
    default:
      return `.${action.type}`;
  }
}

/** 省略可能な値を Swift の式へ変換する */
function swiftOptional(value, transform) {
  return value === undefined ? 'nil' : transform(value);
}

/** フリックの割り当てを Swift の辞書リテラルへ変換する */
function swiftFlick(flick) {
  if (!flick) {
    return '[:]';
  }
  const entries = Object.entries(flick).map(
    ([direction, action]) => `.${direction}: ${swiftAction(action)}`
  );
  return entries.length === 0 ? '[:]' : `[${entries.join(', ')}]`;
}

/** 1つのキーを Swift の式へ変換する */
function swiftKey(key) {
  const parts = [
    `id: ${swiftString(key.id)}`,
    `label: ${swiftOptional(key.label, swiftString)}`,
    `shiftLabel: ${swiftOptional(key.shiftLabel, swiftString)}`,
    `action: ${swiftAction(key.action)}`,
    `shiftAction: ${swiftOptional(key.shiftAction, swiftAction)}`,
    `widthUnit: ${key.width?.unit ?? 1}`,
    `isFunction: ${key.isFunction === true}`,
    `accessibilityLabelKey: ${swiftOptional(key.accessibilityLabelKey, swiftString)}`,
    `visibility: .${key.visibility ?? 'always'}`,
    `flick: ${swiftFlick(key.flick)}`,
  ];
  return `                    KeyDefinition(${parts.join(', ')})`;
}

/** Swiftのソース全体を組み立てる */
function renderSwift(layouts) {
  const body = layouts
    .map((layout) => {
      const rows = layout.rows
        .map((row) => `            KeyRow(keys: [\n${row.keys.map(swiftKey).join(',\n')}\n            ])`)
        .join(',\n');
      return `    /** ${layout.id} 配列 */\n    public static let ${layout.id} = KeyLayout(\n        id: .${layout.id},\n        rows: [\n${rows}\n        ]\n    )`;
    })
    .join('\n\n');

  /* 要素型のメンバーと解釈されないよう、型名で明示的に修飾する */
  const all = layouts.map((layout) => `KeyLayouts.${layout.id}`).join(', ');

  return `// このファイルは自動生成されています。直接編集しないでください。
//
// 正本: packages/shared/src/keyboard/layout.ts
// 生成: node scripts/gen-keyboard-layouts.mjs
//
// キー配列をiOSとAndroidへ二重に手書きすると必ず片方だけがズレるため、
// TypeScriptの正本から生成しています。配列を変えるときは正本を編集し、
// このスクリプトを実行してください。

/**
 * 生成されたキー配列
 */
public enum KeyLayouts {

${body}

    /** すべての配列 */
    public static let all: [KeyLayout] = [${all}]

    /**
     * 識別子から配列を引く
     */
    public static func layout(for id: LayoutId) -> KeyLayout {
        switch id {
${layouts.map((layout) => `        case .${layout.id}: return ${layout.id}`).join('\n')}
        }
    }
}
`;
}

/**
 * かなの変形規則のSwiftソースを組み立てる
 *
 * 巡回の文字列を「文字 → 次の文字」の辞書へ展開する。
 * ネイティブ側では引くだけにして、巡回の解釈をこの生成へ閉じ込める。
 */
function renderVariantsSwift(cycles) {
  const entries = [];
  for (const cycle of cycles) {
    const chars = cycle.split('');
    chars.forEach((char, index) => {
      const next = chars[(index + 1) % chars.length];
      entries.push(`        "${char}": "${next}"`);
    });
  }

  return `// このファイルは自動生成されています。直接編集しないでください。
//
// 正本: packages/shared/src/keyboard/kanaVariants.ts
// 生成: node scripts/gen-keyboard-layouts.mjs
//
// 「゛゜小」キーによるかなの変形規則。割り当てはOS標準に合わせている。
// 規則を変えるときは正本を編集し、このスクリプトを実行してください。

/**
 * 生成されたかなの変形規則
 */
public enum KanaVariants {

    /** 「゛゜小」キーで置き換わる次の文字 */
    private static let transitions: [Character: Character] = [
${entries.join(',\n')}
    ]

    /**
     * 次の形を引く
     *
     * - Parameter character: 変形の対象になる文字
     * - Returns: 次の形。変形を持たない文字はnil
     */
    public static func next(after character: Character) -> Character? {
        transitions[character]
    }
}
`;
}

/** 生成物を書き出す、または最新かを検査する */
function emit(path, contents) {
  if (isCheckMode) {
    let current = '';
    try {
      current = readFileSync(path, 'utf8');
    } catch {
      current = '';
    }
    if (current !== contents) {
      console.error(`生成物が最新ではありません: ${path}`);
      console.error('node scripts/gen-keyboard-layouts.mjs を実行してコミットしてください。');
      process.exit(1);
    }
    console.log(`最新です: ${path}`);
    return;
  }

  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, contents);
  console.log(`生成しました: ${path}`);
}

const { ALL_LAYOUTS } = await loadModule(LAYOUT_SOURCE);
const { KANA_VARIANT_CYCLES } = await loadModule(VARIANTS_SOURCE);
emit(SWIFT_OUT, renderSwift(ALL_LAYOUTS));
emit(VARIANTS_SWIFT_OUT, renderVariantsSwift(KANA_VARIANT_CYCLES));
