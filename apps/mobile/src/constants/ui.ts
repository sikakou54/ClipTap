/**
 * @module ui
 * @description
 * UI関連の定数を一元管理
 *
 * このモジュールはアプリ全体で使用するUI関連の定数を提供します。
 * 共有パッケージ（@cliptap/shared）からの定数とモバイル固有の
 * 定数を統合しています。
 *
 * 含まれる定数カテゴリ:
 * - 入力制限（INPUT_LIMITS）: テキスト入力の最大文字数など
 * - デザイントークン（DESIGN_TOKENS）: 余白、角丸、フォントウェイトなど
 * - モバイル固有設定: アニメーション時間、ボーダー幅、タッチ領域拡張、コピー成功表示時間
 *
 * 使用箇所:
 * - 全コンポーネントのスタイル定義
 * - レイアウト計算
 * - アニメーション設定
 * - 入力バリデーション
 *
 * @see DESIGN_TOKENS - 共有デザイントークン
 * @see themeSystem - テーマ依存のスタイル
 */

import { INPUT_LIMITS, DESIGN_TOKENS, VARIABLE_ICONS } from '@cliptap/shared';
import type { VariableIconName } from '@cliptap/shared';

/**
 * UI定数オブジェクト
 *
 * アプリ全体で使用するUI関連の定数を一元管理します。
 * as constで定義されているため、各値は読み取り専用です。
 */
/* UI定数オブジェクト（as constで読み取り専用） */
export const UI_CONSTANTS = {
  /* ======================================== */
  /* 共有パッケージからの定数（INPUT_LIMITS / DESIGN_TOKENS） */
  /* ======================================== */

  /**
   * 入力制限（@cliptap/sharedから再エクスポート）
   * モバイル・Web共通のテキスト入力最大文字数
   * バリデーションやデータベース制約に使用
   * - TITLE_MAX_LENGTH: スニペットタイトルの最大文字数
   * - CONTENT_MAX_LENGTH: スニペット本文の最大文字数
   * - CATEGORY_NAME_MAX_LENGTH: カテゴリ名の最大文字数
   * - VARIABLE_NAME_MAX_LENGTH: 変数名の最大文字数
   */
  INPUT_LIMITS,

  /** コピー成功表示時間（共有パッケージ由来ではなく、このファイルで定義するモバイル固有値） */
  COPY_SUCCESS_DURATION_MS: 2000,

  /**
   * 共通デザイントークン（@cliptap/sharedから展開）
   * スプレッド構文（...）でUI_CONSTANTSオブジェクト直下に展開
   * モバイル・Web共通のデザイン基準値
   * 含まれるキー: NUMBER_OF_LINES / BUTTON_HEIGHT / ICON_SIZE / BORDER_RADIUS /
   * SPACING / FONT_WEIGHT / GAP / SIZE
   * 各キーの値は packages/shared/src/constants/designTokens.ts を正本とする
   */
  ...DESIGN_TOKENS,

  /* ======================================== */
  /* モバイル固有の設定 */
  /* ======================================== */

  /**
   * アニメーション時間 (ミリ秒)
   * 軽快さを重視した短めの設定
   * 長すぎるとユーザーを待たせ、短すぎると見づらい
   */
  ANIMATION_DURATION: {
    /** 高速: 220ms - ホバー、フォーカス、小さな状態変化など即座に反応すべき要素 */
    FAST: 220,
    /** 通常: 280ms - 一般的な画面遷移、フェードイン/アウト */
    NORMAL: 280,
    /** エレガント: 320ms - モーダル、ドロワー、スライドインなど視覚的に目立つ要素 */
    ELEGANT: 320,
    /** スプラッシュ: 500ms - 起動時のロゴアニメーション */
    SPLASH: 500,
    /** スプラッシュ表示: 1000ms - スプラッシュスクリーンの最小表示時間（ブランディング） */
    SPLASH_DISPLAY: 1000,
  },

  /**
   * ボーダー幅
   * 枠線の太さ設定（ピクセル単位）
   * 視認性とデザインバランスを考慮
   */
  BORDER_WIDTH: {
    /** 細い: 1px - 通常の枠線、区切り線 */
    THIN: 1,
    /** 中程度: 1.5px - やや強調したい枠線 */
    MEDIUM: 1.5,
    /** 太い: 2px - 選択状態やフォーカス時の枠線 */
    THICK: 2,
    /** 極太: 3px - 非常に強調したい場合（アクセントカラーなど） */
    EXTRA_THICK: 3,
  },

  /**
   * タッチ領域拡張（hitSlop）
   * タップ可能領域を視覚的なサイズより拡大（アクセシビリティ向上）
   * 小さなアイコンボタンでもタップしやすくする
   */
  HIT_SLOP: {
    /** デフォルト: 上下左右10dp - 標準的なタップ領域拡張 */
    DEFAULT: { top: 10, bottom: 10, left: 10, right: 10 } as const,
    /** 小: 上下左右8dp - 比較的大きなボタン用 */
    SMALL: { top: 8, bottom: 8, left: 8, right: 8 } as const,
    /** 大: 上下左右12dp - 非常に小さなアイコン用（より広い領域でタップ可能） */
    LARGE: { top: 12, bottom: 12, left: 12, right: 12 } as const,
  },
} as const;

/**
 * 変数アイコン関連の再エクスポート
 * @cliptap/shared から提供されるアイコン定数と型を再エクスポート
 */
export { VARIABLE_ICONS };
export type { VariableIconName };
