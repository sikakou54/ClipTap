/**
 * @module themeTokens
 * @description
 * テーマ関連のトークン定義（Mobile/Web共通）
 *
 * スペーシング、フォントサイズ、タイポグラフィシステムを提供。
 * プラットフォーム固有の拡張は各アプリ側で行う。
 *
 * apps/mobile/src/themeSystem.tsx が取り込むのは SPACING / FONT_SIZES / TYPOGRAPHY /
 * SHADOWS と両テーマのカラーで、useTheme() が返す theme の spacing / typography / shadows
 * などになる。designTokens.ts の DESIGN_TOKENS とはスケールが異なる
 * （SPACING.sm=12 に対し DESIGN_TOKENS.SPACING.SM=6）ため、同一スタイル内で混在させない。
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
 * シャドウシステム（フラットデザイン採用のため未使用）
 */
export const SHADOWS = {
  small: {},
  medium: {},
  large: {},
} as const;

