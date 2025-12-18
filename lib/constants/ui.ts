/**
 * UI定数
 * アプリ全体で使用するUI関連の定数を一元管理
 */

export const UI_CONSTANTS = {
  // 入力制限
  INPUT_LIMITS: {
    PROFILE_NAME_MAX: 20,
    PROFILE_DESCRIPTION_LINES: 3,
    SNIPPET_TITLE_MAX: 30,
    PASSWORD_MIN: 8,
    VARIABLE_VALUE_LINES: 4,
  },

  // 機能制限
  FEATURE_LIMITS: {
    FREE_TIER_VARIABLES: 5,
  },

  // テキスト表示行数
  NUMBER_OF_LINES: {
    SINGLE: 1,
    DOUBLE: 2,
    TRIPLE: 3,
    DESCRIPTION: 4,
  },

  // ボタン高さ
  BUTTON_HEIGHT: {
    SMALL: 36,
    MEDIUM: 44,
    LARGE: 52,
  },

  // アイコンサイズ
  ICON_SIZE: {
    XS: 16,
    SM: 20,
    MD: 24,
    LG: 28,
    XL: 32,
    XXL: 48,
    XXXL: 64,
  },

  // ボーダー半径
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

  // スペーシング
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

  // 最小高さ
  MIN_HEIGHT: {
    INPUT: 44,
    CARD: 60,
    LIST_ITEM: 68,
    DESCRIPTION: 80,
    TEXTAREA: 100,
    PICKER: 180,
    MODAL_CONTENT: 200,
  },

  // 最大高さ
  MAX_HEIGHT: {
    PICKER_SMALL: 300,
    PICKER_MEDIUM: 320,
    PICKER_LARGE: 350,
    DAYS_PICKER: 400,
  },

  // アニメーション時間 (ミリ秒)
  ANIMATION_DURATION: {
    FAST: 220,
    NORMAL: 280,
    ELEGANT: 320,
    SPLASH: 500,
    SPLASH_DISPLAY: 1000,
  },

  // Z-Index レイヤー
  Z_INDEX: {
    DEFAULT: 1,
    LOADING: 1000,
    SPLASH: 9999,
  },

  // 透明度
  OPACITY: {
    DISABLED: 0.7,
    OVERLAY_LIGHT: 0.3,
    OVERLAY_MEDIUM: 0.4,
  },

  // NumberPickerデフォルト値
  NUMBER_PICKER_DEFAULTS: {
    MIN: 0,
    MAX: 100,
    STEP: 1,
  },

  // モーダル寸法
  MODAL: {
    DRAWER_WIDTH_PERCENT: 80,
    MAX_WIDTH: 320,
    HEIGHT_SMALL: '50%' as const,
    HEIGHT_MEDIUM: '60%' as const,
    HEIGHT_LARGE: '70%' as const,
    HEIGHT_XLARGE: '80%' as const,
  },

  // ボーダー幅
  BORDER_WIDTH: {
    THIN: 1,
    MEDIUM: 1.5,
    THICK: 2,
    EXTRA_THICK: 3,
  },

  // シャドウ
  SHADOW: {
    RADIUS: {
      SMALL: 4,
      MEDIUM: 8,
      LARGE: 10,
    },
    OPACITY: {
      LIGHT: 0.1,
      MEDIUM: 0.25,
      STRONG: 0.3,
    },
    ELEVATION: {
      LOW: 4,
      MEDIUM: 5,
      HIGH: 8,
    },
  },

  // タッチ領域
  HIT_SLOP: {
    DEFAULT: { top: 10, bottom: 10, left: 10, right: 10 } as const,
    SMALL: { top: 8, bottom: 8, left: 8, right: 8 } as const,
    LARGE: { top: 12, bottom: 12, left: 12, right: 12 } as const,
  },

  // 位置
  POSITION: {
    FULL_SCREEN: { top: 0, left: 0, right: 0, bottom: 0 } as const,
    BOTTOM_FIXED: { bottom: 0, left: 0, right: 0 } as const,
  },

  // フォントウェイト
  FONT_WEIGHT: {
    NORMAL: '400' as const,
    MEDIUM: '500' as const,
    SEMIBOLD: '600' as const,
    BOLD: '700' as const,
  },

  // ギャップ（Flexbox）
  GAP: {
    XXS: 2,
    XS: 4,
    SM: 6,
    MD: 8,
    BASE: 12,
    LG: 16,
    XL: 20,
  },

  // 幅と高さ
  SIZE: {
    ICON_CONTAINER_SM: 24,
    ICON_CONTAINER_MD: 32,
    ICON_CONTAINER_LG: 40,
    ICON_CONTAINER_XL: 48,
    ICON_CONTAINER_XXL: 56,
  },
} as const;

// 型エクスポート（型安全性のため）
export type UIConstants = typeof UI_CONSTANTS;
