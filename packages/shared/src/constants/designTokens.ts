/**
 * @module designTokens
 * @description
 * ClipTap全体で使用するデザインシステムのトークン定義（Mobile/Web共通）
 *
 * UI/UXの一貫性を保つためのデザイン定数を提供。
 * 色、サイズ、スペーシング等を定数化し、一箇所の変更で全体に反映。
 *
 * 命名規則: XS → SM → MD → LG → XL → XXL → XXXL
 * BASE: 基本サイズ（デフォルト値）
 *
 * 使用箇所:
 * - DESIGN_TOKENS の参照は apps/mobile/src/constants/ui.ts の UI_CONSTANTS 経由のみ。
 *   themeTokens.ts の SPACING とはスケールが異なるため混在させない。
 * - CATEGORY_COLORS / DEFAULT_CATEGORY_COLOR はカテゴリの色選択UIで直接参照する。
 *
 * BORDER_WIDTH / HIT_SLOP / ANIMATION_DURATION はこのファイルには無く、
 * apps/mobile/src/constants/ui.ts 側にのみ定義がある。
 * Web で必要になった時点で mobile の値をそのまま shared へ引き上げる。
 */

/**
 * デザインシステムトークン定数
 * すべての値は論理ピクセル単位
 */
export const DESIGN_TOKENS = {
  /**
   * テキスト表示行数（numberOfLinesプロパティ用）
   */
  NUMBER_OF_LINES: {
    SINGLE: 1,
    DOUBLE: 2,
    TRIPLE: 3,
    DESCRIPTION: 4,
  },

  /**
   * ボタン高さ（iOS HIG準拠、最小44pt）
   */
  BUTTON_HEIGHT: {
    SMALL: 36,
    MEDIUM: 44,
    LARGE: 52,
  },

  /**
   * アイコンサイズ（正方形、width = height）
   */
  ICON_SIZE: {
    XS: 16,
    SM: 20,
    MD: 24,
    LG: 28,
    XL: 32,
    XXL: 48,
    XXXL: 64,
  },

  /**
   * ボーダー半径（角丸）
   */
  BORDER_RADIUS: {
    XS: 4,
    SM: 6,
    MD: 8,
    BASE: 10,
    LG: 12,
    XL: 16,
    XXL: 20,
    XXXL: 24,
  },

  /**
   * スペーシング（余白、8pt grid system）
   */
  SPACING: {
    XXS: 3,
    XS: 4,
    SM: 6,
    MD: 8,
    BASE: 12,
    LG: 16,
    XL: 20,
    XXL: 24,
    XXXL: 32,
    HUGE: 60,
    GIANT: 80,
  },

  /**
   * フォントウェイト（iOS・Android共通）
   */
  FONT_WEIGHT: {
    NORMAL: '400',
    MEDIUM: '500',
    SEMIBOLD: '600',
    BOLD: '700',
  },

  /**
   * ギャップ（Flexbox gapプロパティ用、React Native 0.71+）
   */
  GAP: {
    XXS: 2,
    XS: 4,
    SM: 6,
    MD: 8,
    BASE: 12,
    LG: 16,
    XL: 20,
  },

  /**
   * サイズ（アイコンコンテナ等の特殊用途）
   */
  SIZE: {
    ICON_CONTAINER_SM: 24,
    ICON_CONTAINER_MD: 32,
    ICON_CONTAINER_LG: 40,
    ICON_CONTAINER_XL: 48,
    ICON_CONTAINER_XXL: 56,
  },
} as const;

/**
 * カテゴリ用プリセットカラー（Tailwind CSS準拠、12色）
 * ライト/ダークモード両方で視認性確保
 */
export const CATEGORY_COLORS = [
  '#3B82F6', /* Blue */
  '#10B981', /* Green */
  '#F59E0B', /* Amber */
  '#EF4444', /* Red */
  '#8B5CF6', /* Purple */
  '#EC4899', /* Pink */
  '#06B6D4', /* Cyan */
  '#F97316', /* Orange */
  '#6366F1', /* Indigo */
  '#14B8A6', /* Teal */
  '#84CC16', /* Lime */
  '#F43F5E', /* Rose */
] as const;

/**
 * デフォルトカテゴリカラー
 */
export const DEFAULT_CATEGORY_COLOR = CATEGORY_COLORS[0];

