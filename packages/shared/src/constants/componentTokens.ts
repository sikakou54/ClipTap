/**
 * @module componentTokens
 * @description
 * コンポーネント用デザイントークン（Mobile/Web共通）
 *
 * UI要素の高さ、アニメーション時間、z-indexなどコンポーネント実装で使用される定数。
 * iOS HIG準拠のタップ可能領域（44pt）とマテリアルデザイン標準に従う。
 *
 * 使用箇所:
 * - apps/mobile/src/constants/ui.ts
 * - apps/web/src/constants/ui.ts
 * - コンポーネントのスタイル定義全般
 */

/**
 * 最小高さ定数（論理ピクセル単位）
 */
export const MIN_HEIGHT = {
  INPUT: 44,
  CARD: 60,
  LIST_ITEM: 68,
  DESCRIPTION: 80,
  TEXTAREA: 100,
  PICKER: 180,
  MODAL_CONTENT: 200,
} as const;

/**
 * 最大高さ定数（論理ピクセル単位）
 */
export const MAX_HEIGHT = {
  PICKER_SMALL: 300,
  PICKER_MEDIUM: 320,
  PICKER_LARGE: 350,
  DROPDOWN: 320,
  MODAL_SMALL: 300,
  MODAL_MEDIUM: 500,
  MODAL_LARGE: 700,
} as const;

/**
 * アニメーション時間定数（ミリ秒）
 * 軽快さ重視の短めの設定
 */
export const ANIMATION_DURATION = {
  INSTANT: 100,
  FAST: 150,
  NORMAL: 200,
  MEDIUM: 280,
  ELEGANT: 300,
  SLOW: 500,
  SPLASH_DISPLAY: 1000,
} as const;

/**
 * Z-Index レイヤー定数
 */
export const Z_INDEX = {
  DEFAULT: 1,
  DROPDOWN: 10,
  STICKY: 100,
  LOADING: 1000,
  MODAL_BACKDROP: 1000,
  MODAL: 1001,
  TOAST: 2000,
  SPLASH: 9999,
} as const;

/**
 * 透明度定数
 */
export const OPACITY = {
  DISABLED_MOBILE: 0.7,
  DISABLED_WEB: 0.5,
  OVERLAY_LIGHT: 0.3,
  OVERLAY_MEDIUM: 0.4,
  OVERLAY_DARK: 0.5,
  OVERLAY_DARKER: 0.7,
} as const;

/**
 * ボーダー幅定数（ピクセル単位）
 */
export const BORDER_WIDTH = {
  THIN: 1,
  MEDIUM_THIN: 1.5,
  MEDIUM: 2,
  THICK: 3,
} as const;


/**
 * レスポンシブブレークポイント定数（ピクセル単位）
 */
export const BREAKPOINTS = {
  MOBILE: 640,
  TABLET: 768,
  DESKTOP: 1024,
  WIDE: 1280,
} as const;


/**
 * タッチ領域拡張定数（Mobile用）
 * タップ可能領域を視覚的サイズより拡大してユーザビリティ向上
 */
export const HIT_SLOP = {
  DEFAULT: { top: 10, bottom: 10, left: 10, right: 10 },
  SMALL: { top: 8, bottom: 8, left: 8, right: 8 },
  LARGE: { top: 12, bottom: 12, left: 12, right: 12 },
} as const;

/**
 * シャドウ設定定数（Mobile用）
 */
export const SHADOW = {
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
} as const;

