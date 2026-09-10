import { describe, expect, it } from 'vitest';
import {
  SHORTCUT_CONTEXT_LENGTH,
  normalizeContext,
  rankShortcutValues,
  rankShortcuts,
  scoreShortcut,
  type RankableShortcut,
  type RankableShortcutValue,
} from '../../src/shortcuts/candidates';

/**
 * 拡張キーボードの候補推測（docs/機能仕様書.md §8.24）の正本。
 * iOS拡張キーボードとAndroid IMEはこの規則を写しているため、
 * 期待値を変えるときは両ネイティブ実装も同じ変更で更新すること。
 */

/** 値を組み立てる（並び順は宣言順） */
function value(
  name: string,
  useCount = 0,
  sortOrder = 0
): RankableShortcutValue {
  return { name, useCount, sortOrder };
}

/** ショートカットを組み立てる */
function shortcut(
  name: string,
  sortOrder: number,
  values: RankableShortcutValue[]
): RankableShortcut {
  return { name, sortOrder, values };
}

const PHONE = shortcut('電話番号', 0, [
  value('母', 0, 0),
  value('父', 0, 1),
]);
const MAIL = shortcut('メールアドレス', 1, [
  value('個人', 0, 0),
  value('仕事', 0, 1),
]);
const ADDRESS = shortcut('住所', 2, [value('自宅', 0, 0)]);

const ALL = [PHONE, MAIL, ADDRESS];

describe('normalizeContext', () => {
  it('末尾の一定文字数だけを見る', () => {
    const context = `${'あ'.repeat(100)}電話番号`;

    expect(normalizeContext(context)).toHaveLength(SHORTCUT_CONTEXT_LENGTH);
    expect(normalizeContext(context).endsWith('電話番号')).toBe(true);
  });

  it('英字は大小を区別せず突き合わせられる形にする', () => {
    expect(normalizeContext('GitHub')).toBe('github');
  });
});

describe('scoreShortcut', () => {
  it('ショートカット名の一致を値名の一致より強く見る', () => {
    expect(scoreShortcut(PHONE, normalizeContext('電話番号は'))).toBeGreaterThan(
      scoreShortcut(PHONE, normalizeContext('母に連絡'))
    );
  });

  it('手掛かりが無ければ0になる', () => {
    expect(scoreShortcut(PHONE, normalizeContext('こんにちは'))).toBe(0);
  });

  it('空文字の名前は常に一致しない', () => {
    const empty = shortcut('  ', 0, [value('  ')]);

    expect(scoreShortcut(empty, normalizeContext('こんにちは'))).toBe(0);
  });
});

describe('rankShortcuts', () => {
  it('入力中の内容に現れたショートカットを上位へ出す', () => {
    expect(rankShortcuts(ALL, '電話番号は').map((entry) => entry.name)).toEqual([
      '電話番号',
      'メールアドレス',
      '住所',
    ]);
    expect(rankShortcuts(ALL, 'ご住所は').map((entry) => entry.name)).toEqual([
      '住所',
      '電話番号',
      'メールアドレス',
    ]);
  });

  it('値名だけが一致する場合も上位へ出す', () => {
    expect(rankShortcuts(ALL, '自宅の').map((entry) => entry.name)).toEqual([
      '住所',
      '電話番号',
      'メールアドレス',
    ]);
  });

  it('ショートカット名の一致を値名の一致より優先する', () => {
    /* 「住所」はショートカット名一致、「電話番号」は値名（母）一致 */
    expect(rankShortcuts(ALL, '母の住所').map((entry) => entry.name)).toEqual([
      '住所',
      '電話番号',
      'メールアドレス',
    ]);
  });

  it('推測できない場合は通常順（登録順）で返す', () => {
    expect(rankShortcuts(ALL, 'こんにちは').map((entry) => entry.name)).toEqual([
      '電話番号',
      'メールアドレス',
      '住所',
    ]);
    expect(rankShortcuts(ALL, '').map((entry) => entry.name)).toEqual([
      '電話番号',
      'メールアドレス',
      '住所',
    ]);
  });

  it('英字のショートカット名は大小を区別せずに突き合わせる', () => {
    const github = shortcut('GitHub', 0, [value('個人')]);

    expect(rankShortcuts([MAIL, github], 'my github url').map((entry) => entry.name)).toEqual([
      'GitHub',
      'メールアドレス',
    ]);
  });

  it('元の配列を変更しない', () => {
    const source = [...ALL];

    rankShortcuts(source, '住所');

    expect(source.map((entry) => entry.name)).toEqual([
      '電話番号',
      'メールアドレス',
      '住所',
    ]);
  });
});

describe('rankShortcutValues', () => {
  it('使用回数の多い値を上位へ出す', () => {
    const values = [value('母', 1, 0), value('父', 5, 1)];

    expect(rankShortcutValues(values, '').map((entry) => entry.name)).toEqual(['父', '母']);
  });

  it('値名が入力中の内容に現れた場合は使用回数より優先する', () => {
    const values = [value('母', 1, 0), value('父', 5, 1)];

    expect(rankShortcutValues(values, '母の電話番号').map((entry) => entry.name)).toEqual([
      '母',
      '父',
    ]);
  });

  it('推測できない場合は通常順（登録順）で返す', () => {
    const values = [value('母', 0, 0), value('父', 0, 1)];

    expect(rankShortcutValues(values, 'こんにちは').map((entry) => entry.name)).toEqual([
      '母',
      '父',
    ]);
  });

  it('使用回数も並び順も同じなら元の並びを保つ', () => {
    const values = [value('母', 2, 0), value('父', 2, 0), value('姉', 2, 0)];

    expect(rankShortcutValues(values, '').map((entry) => entry.name)).toEqual([
      '母',
      '父',
      '姉',
    ]);
  });

  it('元の配列を変更しない', () => {
    const values = [value('母', 1, 0), value('父', 5, 1)];

    rankShortcutValues(values, '');

    expect(values.map((entry) => entry.name)).toEqual(['母', '父']);
  });
});
