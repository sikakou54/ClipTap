/**
 * カテゴリ色に関するWeb側のユーティリティ
 *
 * @description
 * 編集フォームの色初期値を決める処理（resolveCategoryColorForm）は、
 * モバイル版と判定規則を1つに保つため @cliptap/shared の categoryUtils を正本とする。
 * このモジュールはWeb固有の表示用フォールバック色だけを持ち、
 * 共有側の実装をそのまま再公開する。
 *
 * @module categoryColor
 */

export {
  DEFAULT_CUSTOM_RGB,
  resolveCategoryColorForm,
  type CategoryColorForm,
} from '@cliptap/shared';

/**
 * カテゴリ色が未設定のときに表示へ使う色
 *
 * @remarks
 * 新規カテゴリの既定プリセットである DEFAULT_CATEGORY_COLOR とは別概念のため独立して定義する。
 * 値はモバイルの未設定フォールバック（テーマの primary）と同じ #3B82F6 に揃えている。
 */
export const CATEGORY_FALLBACK_COLOR = '#3B82F6';
