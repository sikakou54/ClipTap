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
 * - 機能制限（FEATURE_LIMITS）: 無料/Proプランの制限値
 * - デザイントークン（DESIGN_TOKENS）: 余白、角丸、フォントサイズなど
 * - モバイル固有設定: 最小/最大高さ、アニメーション、z-indexなど
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

import { INPUT_LIMITS, FEATURE_LIMITS, DESIGN_TOKENS, VARIABLE_ICONS, DEFAULT_VARIABLE_ICON } from '@cliptap/shared';
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
  /* 共有パッケージからの定数 */
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

  /**
   * 機能制限（@cliptap/sharedから再エクスポート）
   * 無料プランとProプランで異なる機能制限値
   * サブスクリプション管理に使用
   * - FREE_SNIPPETS_LIMIT: 無料プランのスニペット数制限
   * - FREE_PROFILES_LIMIT: 無料プランの環境数制限
   * - FREE_VARIABLES_LIMIT: 無料プランのカスタム変数数制限
   */
  FEATURE_LIMITS,

  /**
   * 共通デザイントークン（@cliptap/sharedから展開）
   * スプレッド構文（...）でUI_CONSTANTSオブジェクト直下に展開
   * モバイル・Web共通のデザイン基準値
   * - SPACING: 余白サイズ（XS, SM, MD, LG, XL, XXL）
   * - BORDER_RADIUS: 角丸サイズ
   * - FONT_SIZE: フォントサイズ
   */
  ...DESIGN_TOKENS,

  /* ======================================== */
  /* モバイル固有の設定 */
  /* ======================================== */

  /**
   * 最小高さ
   * 各UI要素の最小高さを定義（dp単位 = density-independent pixel）
   * iOS HIG（Human Interface Guidelines）のタップ可能領域（44dp）に準拠
   * アクセシビリティとタップのしやすさを保証
   */
  MIN_HEIGHT: {
    /** 入力フィールド: 44dp（iOS HIG準拠） - TextInput、ボタンなどのタップ可能要素 */
    INPUT: 44,
    /** カード: 60dp - スニペットカードなど */
    CARD: 60,
    /** リストアイテム: 68dp - カテゴリ、設定項目などのリストアイテム */
    LIST_ITEM: 68,
    /** 説明テキスト: 80dp - 複数行の説明文を含む要素 */
    DESCRIPTION: 80,
    /** テキストエリア: 100dp - 複数行テキスト入力欄 */
    TEXTAREA: 100,
    /** ピッカー: 180dp - 選択肢を表示するピッカーコンポーネント */
    PICKER: 180,
    /** モーダルコンテンツ: 200dp - モーダル内のコンテンツエリア */
    MODAL_CONTENT: 200,
  },

  /**
   * 最大高さ
   * ピッカーやドロップダウンの最大高さを定義（画面を占有しすぎないように制限）
   * 多くの選択肢がある場合でもスクロール可能にする
   */
  MAX_HEIGHT: {
    /** 小サイズピッカー: 300dp - 選択肢が少ないピッカー（5-8個程度） */
    PICKER_SMALL: 300,
    /** 中サイズピッカー: 320dp - 標準的なピッカー（8-12個程度） */
    PICKER_MEDIUM: 320,
    /** 大サイズピッカー: 350dp - 選択肢が多いピッカー（12個以上） */
    PICKER_LARGE: 350,
    /** 日付ピッカー: 400dp - カレンダー表示用の大きなピッカー */
    DAYS_PICKER: 400,
  },

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
   * Z-Index レイヤー
   * 要素の重なり順を管理（数値が大きいほど前面に表示）
   * 適切な階層化でUI要素の表示優先度を制御
   */
  Z_INDEX: {
    /** デフォルト: 1 - 通常のコンテンツ */
    DEFAULT: 1,
    /** ローディング: 1000 - ローディングインジケーター（コンテンツより上） */
    LOADING: 1000,
    /** スプラッシュ: 9999 - スプラッシュスクリーン（最前面、すべてを覆う） */
    SPLASH: 9999,
  },

  /**
   * 透明度
   * 無効状態やオーバーレイの透明度（0.0 = 完全透明、1.0 = 完全不透明）
   */
  OPACITY: {
    /** 無効状態: 0.7 - ボタンや入力欄が無効時の透明度（やや薄く表示） */
    DISABLED: 0.7,
    /** 薄いオーバーレイ: 0.3 - モーダル背景などの薄い半透明オーバーレイ */
    OVERLAY_LIGHT: 0.3,
    /** 中程度のオーバーレイ: 0.4 - より目立たせたいオーバーレイ */
    OVERLAY_MEDIUM: 0.4,
  },

  /**
   * NumberPickerデフォルト値
   * 数値入力ピッカーのデフォルト設定（カスタマイズ可能）
   */
  NUMBER_PICKER_DEFAULTS: {
    /** 最小値: 0 */
    MIN: 0,
    /** 最大値: 100 */
    MAX: 100,
    /** ステップ（増減単位）: 1 */
    STEP: 1,
  },

  /**
   * モーダル寸法
   * ボトムシート、ドロワー、モーダルなどのサイズ設定
   * 画面サイズに対する相対値で定義（レスポンシブ対応）
   */
  MODAL: {
    /** ドロワー幅（画面幅の80%） - サイドメニューの幅 */
    DRAWER_WIDTH_PERCENT: 80,
    /** 最大幅: 320dp - モーダルの最大幅（大画面でも広がりすぎない） */
    MAX_WIDTH: 320,
    /** 高さ: 小（画面の50%） - 簡単な確認ダイアログなど */
    HEIGHT_SMALL: '50%' as const,
    /** 高さ: 中（画面の60%） - 標準的なフォームやピッカー */
    HEIGHT_MEDIUM: '60%' as const,
    /** 高さ: 大（画面の70%） - 複雑なフォームやリスト表示 */
    HEIGHT_LARGE: '70%' as const,
    /** 高さ: 特大（画面の80%） - ほぼ全画面（詳細な設定画面など） */
    HEIGHT_XLARGE: '80%' as const,
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
   * シャドウ設定
   * 要素に深さを与える影のパラメータ
   * iOS: shadowRadius + shadowOpacity、Android: elevation を使用
   */
  SHADOW: {
    /** 影のぼかし半径（iOS用） */
    RADIUS: {
      /** 小: 4 - カードなどの軽い影 */
      SMALL: 4,
      /** 中: 8 - モーダルなどの中程度の影 */
      MEDIUM: 8,
      /** 大: 10 - フローティングボタンなどの強い影 */
      LARGE: 10,
    },
    /** 影の透明度（iOS用、0.0 = 透明、1.0 = 不透明） */
    OPACITY: {
      /** 薄い: 0.1 - ごく薄い影 */
      LIGHT: 0.1,
      /** 中程度: 0.25 - 標準的な影 */
      MEDIUM: 0.25,
      /** 濃い: 0.3 - はっきりした影 */
      STRONG: 0.3,
    },
    /** Elevation（Android用、マテリアルデザインの高さ） */
    ELEVATION: {
      /** 低い: 4 - カードなどの軽い浮き上がり */
      LOW: 4,
      /** 中程度: 5 - モーダルなどの中程度の浮き上がり */
      MEDIUM: 5,
      /** 高い: 8 - フローティングボタンなどの強い浮き上がり */
      HIGH: 8,
    },
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

  /**
   * 位置プリセット
   * position: 'absolute' で使用する定型的な配置パターン
   * よく使うレイアウトを定数化して再利用
   */
  POSITION: {
    /** フルスクリーン: 四隅を0に（画面全体を覆う） */
    FULL_SCREEN: { top: 0, left: 0, right: 0, bottom: 0 } as const,
    /** 下部固定: 下・左・右を0に（広告バナーなど） */
    BOTTOM_FIXED: { bottom: 0, left: 0, right: 0 } as const,
  },
} as const; // as const: オブジェクト全体を読み取り専用にする

/* 型エクスポート（型安全性のため） */
/* UI_CONSTANTSの型を抽出してエクスポート（他のモジュールで型参照可能にする） */
export type UIConstants = typeof UI_CONSTANTS;

/**
 * 変数アイコン関連の再エクスポート
 * @cliptap/shared から提供されるアイコン定数と型を再エクスポート
 */
export { VARIABLE_ICONS, DEFAULT_VARIABLE_ICON };
export type { VariableIconName };
