import { describe, expect, it } from 'vitest';
import { KANA_VARIANT_CYCLES, nextKanaVariant } from '../src/keyboard/kanaVariants';

/**
 * 「゛゜小」キーの変形規則に対する検証
 *
 * ネイティブ実装（Swift/Kotlin）はこの正本から生成するため、
 * 巡回の不整合はネイティブをビルドする前にここで落とす。
 */
describe('かなの変形規則の正本', () => {
  it('巡回は2文字以上で構成される', () => {
    /* 1文字の巡回は自分自身へ戻るだけで、キーとして意味を持たない */
    for (const cycle of KANA_VARIANT_CYCLES) {
      expect(cycle.split('').length).toBeGreaterThanOrEqual(2);
    }
  });

  it('同じ文字が複数の巡回に現れない', () => {
    /* 重複すると「次の形」が一意に決まらなくなる */
    const seen = new Set<string>();
    for (const cycle of KANA_VARIANT_CYCLES) {
      for (const char of cycle.split('')) {
        expect(seen.has(char), `${char} が複数の巡回に含まれている`).toBe(false);
        seen.add(char);
      }
    }
  });

  it('巡回内でも同じ文字が繰り返されない', () => {
    for (const cycle of KANA_VARIANT_CYCLES) {
      const chars = cycle.split('');
      expect(new Set(chars).size).toBe(chars.length);
    }
  });

  it('何度押しても元の文字へ戻ってくる', () => {
    for (const cycle of KANA_VARIANT_CYCLES) {
      const chars = cycle.split('');
      let current = chars[0]!;
      for (let i = 0; i < chars.length; i += 1) {
        const next = nextKanaVariant(current);
        expect(next).toBeDefined();
        current = next!;
      }
      expect(current).toBe(chars[0]);
    }
  });

  it('OS標準と同じ順で巡回する', () => {
    /* 小文字 → 濁点 →（半濁点）の順。利用者が指の動きを覚えている代表例で固定する */
    expect(nextKanaVariant('か')).toBe('が');
    expect(nextKanaVariant('が')).toBe('か');
    expect(nextKanaVariant('つ')).toBe('っ');
    expect(nextKanaVariant('っ')).toBe('づ');
    expect(nextKanaVariant('づ')).toBe('つ');
    expect(nextKanaVariant('は')).toBe('ば');
    expect(nextKanaVariant('ば')).toBe('ぱ');
    expect(nextKanaVariant('ぱ')).toBe('は');
    expect(nextKanaVariant('う')).toBe('ぅ');
    expect(nextKanaVariant('ぅ')).toBe('ゔ');
    expect(nextKanaVariant('や')).toBe('ゃ');
  });

  it('変形を持たない文字はundefinedを返す', () => {
    for (const char of ['ん', 'な', 'ー', 'a', '「', '']) {
      expect(nextKanaVariant(char)).toBeUndefined();
    }
  });
});
