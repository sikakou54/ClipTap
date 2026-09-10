/**
 * ショートカット候補の並べ替え
 *
 * @description
 * 拡張キーボードが、入力中の内容からショートカットと値の表示順を決めるための規則。
 *
 * @remarks
 * 実際に並べ替えを行うのはiOS拡張キーボード（Swift）とAndroid IME（Kotlin）であり、
 * このモジュールを実行時に呼び出すのはテストだけである。
 * 規則を2つのネイティブ実装だけに書くと、片方だけが変更されても誰も気付けないため、
 * 実行可能な正本をここへ置き、`packages/shared/tests/shortcuts/candidates.test.ts` で固定する。
 * ネイティブ側を変更するときは、必ずこのモジュールと同じ規則になっていることを確認すること。
 *
 * 対応するネイティブ実装:
 * - apps/mobile/ios/ClipTapKeyboard/Services/ShortcutService.swift
 * - apps/mobile/android/app/src/main/java/com/sikakou/cliptap/services/ShortcutService.kt
 *
 * @module shortcuts/candidates
 */

/**
 * 入力中の内容として参照する文字数
 *
 * @remarks
 * カーソル直前のすべてを見ると、離れた位置に出た語で候補が動き続けて落ち着かない。
 * 「電話番号は」程度の直前の手掛かりだけを見る。
 */
export const SHORTCUT_CONTEXT_LENGTH = 40;

/** ショートカット名が入力中の内容に現れたときの一致度 */
const SCORE_NAME_MATCH = 2;

/** 値名が入力中の内容に現れたときの一致度 */
const SCORE_VALUE_NAME_MATCH = 1;

/** 手掛かりが無いときの一致度 */
const SCORE_NONE = 0;

/**
 * 並べ替えの対象になるショートカット値
 */
export interface RankableShortcutValue {
  /** 値を識別する名称 */
  readonly name: string;
  /** 拡張キーボードから挿入した回数 */
  readonly useCount: number;
  /** 登録時の並び順 */
  readonly sortOrder: number;
}

/**
 * 並べ替えの対象になるショートカット
 */
export interface RankableShortcut {
  /** ショートカット名 */
  readonly name: string;
  /** 登録時の並び順 */
  readonly sortOrder: number;
  /** ショートカットが持つ値 */
  readonly values: readonly RankableShortcutValue[];
}

/**
 * 入力中の内容を突き合わせ用に正規化する
 *
 * @param context - カーソル直前の入力内容
 * @returns 末尾を切り出して小文字化した文字列
 *
 * @remarks
 * 英字は大小を区別せずに突き合わせる。日本語はこの正規化の影響を受けない。
 */
export function normalizeContext(context: string): string {
  return context.slice(-SHORTCUT_CONTEXT_LENGTH).toLowerCase();
}

/**
 * 入力中の内容にその語が含まれるか判定する
 *
 * @param normalizedContext - `normalizeContext`で正規化済みの入力内容
 * @param term - 突き合わせる語（ショートカット名または値名）
 * @returns 含まれる場合はtrue
 *
 * @remarks
 * 空文字は常に含まれると判定されてしまうため、明示的に対象外とする。
 */
function contains(normalizedContext: string, term: string): boolean {
  const trimmed = term.trim().toLowerCase();
  if (!trimmed) return false;
  return normalizedContext.includes(trimmed);
}

/**
 * ショートカットの一致度を求める
 *
 * @param shortcut - 対象のショートカット
 * @param normalizedContext - 正規化済みの入力内容
 * @returns 一致度（大きいほど上位）
 *
 * @remarks
 * ショートカット名の一致を値名の一致より強く見る。
 * 「電話番号は」と入力中なら「電話番号」が最上位になる。
 */
export function scoreShortcut(
  shortcut: RankableShortcut,
  normalizedContext: string
): number {
  if (contains(normalizedContext, shortcut.name)) return SCORE_NAME_MATCH;
  if (shortcut.values.some((value) => contains(normalizedContext, value.name))) {
    return SCORE_VALUE_NAME_MATCH;
  }
  return SCORE_NONE;
}

/**
 * ショートカット一覧を表示順に並べ替える
 *
 * @param shortcuts - 保存順（sortOrder順）のショートカット一覧
 * @param context - カーソル直前の入力内容
 * @returns 表示順に並べ替えた新しい配列
 *
 * @remarks
 * 一致度の高いものを上位に置き、同点は登録順を保つ。
 * どれも一致しない場合は登録順のまま（通常順）になる。
 * 使用回数はショートカットの並びには使わない。利用者が決めた登録順が入力内容と無関係に
 * 入れ替わると、目で追う位置が毎回変わってしまうため。
 */
export function rankShortcuts<T extends RankableShortcut>(
  shortcuts: readonly T[],
  context: string
): T[] {
  const normalizedContext = normalizeContext(context);
  const scored = shortcuts.map((shortcut, index) => ({
    shortcut,
    index,
    score: scoreShortcut(shortcut, normalizedContext),
  }));

  scored.sort((left, right) => {
    if (left.score !== right.score) return right.score - left.score;
    if (left.shortcut.sortOrder !== right.shortcut.sortOrder) {
      return left.shortcut.sortOrder - right.shortcut.sortOrder;
    }
    /* sortOrderが同値でも並びが揺れないよう、元の位置で決める */
    return left.index - right.index;
  });

  return scored.map((entry) => entry.shortcut);
}

/**
 * ショートカット値の一覧を表示順に並べ替える
 *
 * @param values - 保存順（sortOrder順）の値一覧
 * @param context - カーソル直前の入力内容
 * @returns 表示順に並べ替えた新しい配列
 *
 * @remarks
 * 値名が入力中の内容に現れていればそれを最上位に、次に使用回数の多い順、
 * 最後に登録順で並べる。使用回数がすべて0で手掛かりも無い場合は登録順のまま（通常順）になる。
 */
export function rankShortcutValues<T extends RankableShortcutValue>(
  values: readonly T[],
  context: string
): T[] {
  const normalizedContext = normalizeContext(context);
  const scored = values.map((value, index) => ({
    value,
    index,
    score: contains(normalizedContext, value.name)
      ? SCORE_VALUE_NAME_MATCH
      : SCORE_NONE,
  }));

  scored.sort((left, right) => {
    if (left.score !== right.score) return right.score - left.score;
    if (left.value.useCount !== right.value.useCount) {
      return right.value.useCount - left.value.useCount;
    }
    if (left.value.sortOrder !== right.value.sortOrder) {
      return left.value.sortOrder - right.value.sortOrder;
    }
    /* sortOrderが同値でも並びが揺れないよう、元の位置で決める */
    return left.index - right.index;
  });

  return scored.map((entry) => entry.value);
}
