/**
 * カテゴリ編集フォームの色初期値を決める処理
 *
 * @description
 * DBに保存されているカラーコードは、プリセットから選ばれたものとカスタムRGBで
 * 入力されたものが同じ1カラムに入っている。編集モーダルを開くときは、その文字列から
 * 「プリセット選択とカスタムRGB入力のどちらの状態で開くか」を決める必要があるため、
 * 判定をこの純関数に閉じ込めている。
 *
 * @module categoryColor
 */

import { DEFAULT_CATEGORY_COLOR } from '@cliptap/shared';

/**
 * カスタムRGB入力欄の既定値
 *
 * @remarks
 * DEFAULT_CATEGORY_COLOR（#3B82F6）を10進数で表した値。
 * プリセット色を開いたときと、RGBへ分解できない色を開いたときの入力欄に入る。
 */
export const DEFAULT_CUSTOM_RGB = {
  r: '59',
  g: '130',
  b: '246',
} as const;

/**
 * カテゴリ編集フォームの色に関する初期値
 */
export interface CategoryColorForm {
  /** カラーピッカーで選択状態にする色 */
  color: string;
  /** カスタムRGB入力モードで開くかどうか */
  useCustomColor: boolean;
  /** R入力欄の値（0-255の10進文字列） */
  customR: string;
  /** G入力欄の値（0-255の10進文字列） */
  customG: string;
  /** B入力欄の値（0-255の10進文字列） */
  customB: string;
}

/**
 * 保存されているカラーコードからフォームの初期値を決める
 *
 * @param rawColor - DBに入っているカラーコード（未設定なら DEFAULT_CATEGORY_COLOR を使う）
 * @param presetColors - プリセットカラーの一覧
 * @returns フォームへ流し込む色の初期値
 */
export function resolveCategoryColorForm(
  rawColor: string | null | undefined,
  presetColors: readonly string[]
): CategoryColorForm {
  /* DBから取得したカラーコードをトリムして正規化 */
  const categoryColor = (rawColor || DEFAULT_CATEGORY_COLOR).trim();

  /* 色を大文字に正規化して比較（#3b82f6 → #3B82F6） */
  const normalizedColor = categoryColor.toUpperCase();

  /* プリセットカラーかどうかを判定（大文字小文字を無視） */
  const isPresetColor = presetColors.some((c) => c.toUpperCase() === normalizedColor);

  if (isPresetColor) {
    /*
     * プリセットカラーの場合
     * 一覧に載っている表記（大文字小文字を含めて）を採用するため find の結果を使う
     */
    const matchingPreset = presetColors.find((c) => c.toUpperCase() === normalizedColor);
    return {
      color: matchingPreset || DEFAULT_CATEGORY_COLOR,
      useCustomColor: false,
      customR: DEFAULT_CUSTOM_RGB.r,
      customG: DEFAULT_CUSTOM_RGB.g,
      customB: DEFAULT_CUSTOM_RGB.b,
    };
  }

  /* カスタムカラーの場合（#RRGGBB 前提） */
  const hex = normalizedColor.startsWith('#') ? normalizedColor.slice(1) : normalizedColor;

  if (hex.length >= 6) {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return {
      /*
       * color には大文字化した normalizedColor ではなく、トリムだけを掛けた値を入れる
       * （保存時にそのまま書き戻されるため、元の表記を変えないようにしている）
       */
      color: categoryColor,
      useCustomColor: true,
      customR: r.toString(),
      customG: g.toString(),
      customB: b.toString(),
    };
  }

  /* 6桁に満たずRGBへ分解できない場合は入力欄だけ既定値に戻す（color は保存値のまま） */
  return {
    color: categoryColor,
    useCustomColor: true,
    customR: DEFAULT_CUSTOM_RGB.r,
    customG: DEFAULT_CUSTOM_RGB.g,
    customB: DEFAULT_CUSTOM_RGB.b,
  };
}
