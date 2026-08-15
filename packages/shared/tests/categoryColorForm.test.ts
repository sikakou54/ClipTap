import { describe, expect, it } from 'vitest';
import { CATEGORY_COLORS, DEFAULT_CATEGORY_COLOR } from '../src/constants/designTokens';
import { DEFAULT_CUSTOM_RGB, resolveCategoryColorForm } from '../src/utils/categoryUtils';

/**
 * カテゴリ編集フォームの色初期値
 *
 * Web版とモバイル版が同じ保存値に対して同じモード（プリセット選択 / カスタムRGB入力）で
 * 開くことを保証する。インポートしたファイルの色は逐語で保存されるため、
 * 小文字や前後の空白が入った値でも壊れないことを重視して検証する。
 */
describe('resolveCategoryColorForm', () => {
  it('プリセットと同じ表記の色はプリセット選択で開く', () => {
    const form = resolveCategoryColorForm(CATEGORY_COLORS[0], CATEGORY_COLORS);

    expect(form.useCustomColor).toBe(false);
    expect(form.color).toBe(CATEGORY_COLORS[0]);
  });

  it('小文字のプリセット色もプリセット選択で開き、色は一覧の表記に揃える', () => {
    const form = resolveCategoryColorForm(CATEGORY_COLORS[0].toLowerCase(), CATEGORY_COLORS);

    expect(form.useCustomColor).toBe(false);
    expect(form.color).toBe(CATEGORY_COLORS[0]);
  });

  it('前後に空白があるプリセット色もプリセット選択で開く', () => {
    const form = resolveCategoryColorForm(` ${CATEGORY_COLORS[0]} `, CATEGORY_COLORS);

    expect(form.useCustomColor).toBe(false);
    expect(form.color).toBe(CATEGORY_COLORS[0]);
  });

  it('プリセットにない6桁の色はカスタムRGBへ分解して開く', () => {
    const form = resolveCategoryColorForm('#123456', CATEGORY_COLORS);

    expect(form.useCustomColor).toBe(true);
    expect(form.color).toBe('#123456');
    expect(form.customR).toBe('18');
    expect(form.customG).toBe('52');
    expect(form.customB).toBe('86');
  });

  it('6桁に満たない色はRGB入力欄を既定値に戻し、NaNを入れない', () => {
    const form = resolveCategoryColorForm('#ABC', CATEGORY_COLORS);

    expect(form.useCustomColor).toBe(true);
    expect(form.customR).toBe(DEFAULT_CUSTOM_RGB.r);
    expect(form.customG).toBe(DEFAULT_CUSTOM_RGB.g);
    expect(form.customB).toBe(DEFAULT_CUSTOM_RGB.b);
    expect([form.customR, form.customG, form.customB]).not.toContain('NaN');
  });

  it('色が未設定のときは既定のカテゴリ色をプリセット選択で開く', () => {
    for (const rawColor of [null, undefined, '']) {
      const form = resolveCategoryColorForm(rawColor, CATEGORY_COLORS);

      expect(form.useCustomColor).toBe(false);
      expect(form.color).toBe(DEFAULT_CATEGORY_COLOR);
    }
  });
});
