import { describe, expect, it } from 'vitest';
import {
  ALL_LAYOUTS,
  FLICK_LAYOUT,
  QWERTY_LAYOUT,
  type Key,
  type KeyLayout,
} from '../src/keyboard/layout';

/**
 * キー配列の正本に対する検証
 *
 * 拡張キーボードのネイティブ実装（Swift/Kotlin）はここから生成するため、
 * 配列の不正はネイティブをビルドする前にここで落とす。
 * ネイティブ側には自動テストの基盤が無く、壊れても実行するまで気付けないため、
 * 検証できるものはすべてこの層へ寄せる。
 */

/** レイアウト内の全キーを平坦化する */
const allKeys = (layout: KeyLayout): Key[] => layout.rows.flatMap((row) => row.keys);

describe('キー配列の正本', () => {
  it('レイアウトの識別子が重複しない', () => {
    const ids = ALL_LAYOUTS.map((layout) => layout.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(ALL_LAYOUTS.map((layout) => [layout.id, layout] as const))(
    '%s: キーの識別子が行をまたいで重複しない',
    (_id, layout) => {
      /* 識別子はテストとアクセシビリティの参照に使うため、一意でなければならない */
      const ids = allKeys(layout).map((key) => key.id);
      const duplicated = ids.filter((id, index) => ids.indexOf(id) !== index);
      expect(duplicated).toEqual([]);
    }
  );

  it.each(ALL_LAYOUTS.map((layout) => [layout.id, layout] as const))(
    '%s: 文字キーは空文字を入力しない',
    (_id, layout) => {
      for (const key of allKeys(layout)) {
        if (key.action.type === 'input') {
          expect(key.action.text.length).toBeGreaterThan(0);
        }
      }
    }
  );

  it.each(ALL_LAYOUTS.map((layout) => [layout.id, layout] as const))(
    '%s: 幅は正の値である',
    (_id, layout) => {
      for (const key of allKeys(layout)) {
        expect(key.width?.unit ?? 1).toBeGreaterThan(0);
      }
    }
  );

  it.each(ALL_LAYOUTS.map((layout) => [layout.id, layout] as const))(
    '%s: 他のキーボードへ切り替えるキーを持つ',
    (_id, layout) => {
      /*
       * Appleは全カスタムキーボードに、他のキーボードへ切り替える手段を求めている。
       * 実装漏れは審査で落ちるため、配列の時点で担保する。
       */
      const hasNextKeyboard = allKeys(layout).some((key) => key.action.type === 'nextKeyboard');
      expect(hasNextKeyboard).toBe(true);
    }
  );

  it.each(ALL_LAYOUTS.map((layout) => [layout.id, layout] as const))(
    '%s: 削除・空白・改行のキーを持つ',
    (_id, layout) => {
      const types = new Set(allKeys(layout).map((key) => key.action.type));
      expect(types).toContain('backspace');
      expect(types).toContain('space');
      expect(types).toContain('enter');
    }
  );

  it.each(ALL_LAYOUTS.map((layout) => [layout.id, layout] as const))(
    '%s: 切替先のレイアウトが実在する',
    (_id, layout) => {
      const known = new Set(ALL_LAYOUTS.map((item) => item.id));
      for (const key of allKeys(layout)) {
        if (key.action.type === 'switchLayout') {
          expect(known).toContain(key.action.layoutId);
        }
      }
    }
  );

  it('どのレイアウトからも他のすべてのレイアウトへ到達できる', () => {
    /* 切替キーの張り忘れで、戻れないレイアウトが生まれるのを防ぐ */
    const reachable = new Map<string, Set<string>>();
    for (const layout of ALL_LAYOUTS) {
      const targets = allKeys(layout)
        .filter((key) => key.action.type === 'switchLayout')
        .map((key) => (key.action as { layoutId: string }).layoutId);
      reachable.set(layout.id, new Set(targets));
    }

    for (const layout of ALL_LAYOUTS) {
      const visited = new Set<string>([layout.id]);
      const queue = [layout.id];
      while (queue.length > 0) {
        for (const next of reachable.get(queue.shift()!) ?? []) {
          if (!visited.has(next)) {
            visited.add(next);
            queue.push(next);
          }
        }
      }
      expect(visited.size).toBe(ALL_LAYOUTS.length);
    }
  });

  it('QWERTYは打ちやすさのため標準的な配置を保つ', () => {
    const rows = QWERTY_LAYOUT.rows;
    expect(rows[0].keys.map((key) => key.label).join('')).toBe('qwertyuiop');
    expect(rows[1].keys.map((key) => key.label).join('')).toBe('asdfghjkl');
    expect(rows[2].keys.slice(1, 8).map((key) => key.label).join('')).toBe('zxcvbnm');
  });

  it('12キーフリックはOS標準の割り当てを保つ', () => {
    /*
     * 中央・左・上・右・下の並びで固定する。利用者が指の動きを
     * 覚えているため、独自の割り当てへ変えてはならない。
     */
    const expectations: Record<string, string> = {
      flick_a: 'あいうえお',
      flick_ka: 'かきくけこ',
      flick_sa: 'さしすせそ',
      flick_ta: 'たちつてと',
      flick_na: 'なにぬねの',
      flick_ha: 'はひふへほ',
      flick_ma: 'まみむめも',
      flick_ya: 'や「ゆ」よ',
      flick_ra: 'らりるれろ',
      flick_wa: 'わをんー〜',
    };

    for (const [id, row] of Object.entries(expectations)) {
      const key = allKeys(FLICK_LAYOUT).find((item) => item.id === id);
      expect(key, `キーが見つからない: ${id}`).toBeDefined();

      const texts = [key!.action, key!.flick?.left, key!.flick?.up, key!.flick?.right, key!.flick?.down]
        .map((action) => (action?.type === 'input' ? action.text : ''))
        .join('');
      expect(texts, `${id} の割り当てが期待と異なる`).toBe(row);
    }
  });

  it('12キーフリックの顔文字キーは入力中に「゛゜小」へ切り替わる', () => {
    /* OS標準と同じ動的キー。濁点・半濁点・小文字はこの切り替えで入力する */
    const kaomoji = allKeys(FLICK_LAYOUT).find((key) => key.id === 'flick_kaomoji');
    expect(kaomoji).toBeDefined();
    expect(kaomoji!.composingLabel).toBe('゛゜小');
    expect(kaomoji!.composingAction).toEqual({ type: 'kanaVariant' });
  });

  it.each(ALL_LAYOUTS.map((layout) => [layout.id, layout] as const))(
    '%s: 地球儀キーは必要な機種でだけ表示される',
    (_id, layout) => {
      /*
       * Face ID機種ではOSが地球儀を提供して重複するため、キー側の地球儀は
       * ホームボタン機種（切替キー必須）でだけ表示する。
       */
      for (const key of allKeys(layout)) {
        if (key.action.type === 'nextKeyboard') {
          expect(key.visibility).toBe('needsInputModeSwitch');
        }
      }
    }
  );

  it('12キーフリックは地球儀キーが不要な機種では「あいう」を置く', () => {
    /* OS標準の左列（☆123・ABC・あいう）を揃える。かな面では現在面の表示を兼ねる */
    const substitute = allKeys(FLICK_LAYOUT).find((key) => key.visibility === 'noInputModeSwitch');
    expect(substitute?.id).toBe('switch_kana');
    expect(substitute?.action).toEqual({ type: 'switchLayout', layoutId: 'flick' });
  });

  it('12キーフリックはOS標準と同じ5列の格子が揃っている', () => {
    /* 表示条件つきのキーは同じセルを共有するため、どちらか片方だけを数える */
    for (const row of FLICK_LAYOUT.rows) {
      const total = row.keys
        .filter((key) => key.visibility !== 'noInputModeSwitch')
        .reduce((sum, key) => sum + (key.width?.unit ?? 1), 0);
      expect(total).toBe(5);
    }
  });

  it('12キーフリックの改行はOS標準と同じく2行の高さを持つ', () => {
    const enter = allKeys(FLICK_LAYOUT).find((key) => key.action.type === 'enter');
    expect(enter?.rowSpan).toBe(2);

    /* 伸びた先の行に場所取りがあること。無いと下の行が横に広がって格子が崩れる */
    const lastRow = FLICK_LAYOUT.rows[FLICK_LAYOUT.rows.length - 1];
    const spacer = lastRow?.keys[lastRow.keys.length - 1];
    expect(spacer?.isSpacer).toBe(true);
  });

  it('QWERTYの文字キーはシフトで大文字になる', () => {
    for (const key of allKeys(QWERTY_LAYOUT)) {
      if (key.action.type !== 'input' || key.isFunction) {
        continue;
      }
      expect(key.shiftAction).toBeDefined();
      expect(key.shiftAction).toEqual({ type: 'input', text: key.action.text.toUpperCase() });
    }
  });
});
