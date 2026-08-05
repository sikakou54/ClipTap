/**
 * @module themeTokens
 * @description
 * テーマ関連のトークン定義（Mobile/Web共通）
 *
 * スペーシング、フォントサイズ、タイポグラフィシステムを提供。
 * プラットフォーム固有の拡張は各アプリ側で行う。
 */

/**
 * スペーシングシステム（8pxグリッドベース）
 */
export const SPACING = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  section: 40,
  screenPadding: 20,
  sectionGap: 48,
} as const;


/**
 * フォントサイズシステム（スマートフォン向け基本値）
 */
export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  base: 16,
  md: 18,
  lg: 20,
  xl: 24,
  xxl: 32,
  hero: 48,
} as const;


/**
 * タイポグラフィシステム
 * 用途別のテキストスタイル（fontSize、fontWeight、lineHeight）
 */
export const TYPOGRAPHY = {
  h1: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700' as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600' as const,
    lineHeight: 32,
  },
  h3: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  h4: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  body: {
    fontSize: FONT_SIZES.base,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodyLarge: {
    fontSize: FONT_SIZES.md,
    fontWeight: '400' as const,
    lineHeight: 28,
  },
  bodyMedium: {
    fontSize: FONT_SIZES.base,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  button: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  caption: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500' as const,
    lineHeight: 20,
  },
  labelSmall: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '500' as const,
    lineHeight: 16,
  },
} as const;


/**
 * ボーダーラディウス（角丸）
 */
export const RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  round: 50,
} as const;


/**
 * 寸法システム（固定寸法）
 */
export const DIMENSIONS = {
  header: {
    height: 60,
    paddingHorizontal: 20,
    iconSize: 24,
  },
  tabBar: {
    height: 85,
    paddingBottom: 20,
    paddingTop: 8,
  },
  avatar: {
    small: 32,
    medium: 40,
    large: 80,
  },
  iconSize: {
    small: 16,
    medium: 20,
    large: 24,
    xlarge: 32,
  },
  button: {
    small: 36,
    medium: 44,
    large: 52,
  },
} as const;

export type Dimensions = typeof DIMENSIONS;

/**
 * シャドウシステム（フラットデザイン採用のため未使用）
 */
export const SHADOWS = {
  small: {},
  medium: {},
  large: {},
} as const;

