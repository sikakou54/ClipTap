/**
 * テーマ関連の共通型定義（Mobile/Web共通）
 *
 * @description
 * テーマプロバイダーのインターフェースを定義。
 * 各プラットフォーム（Mobile/Web）は独自の実装を持つが、
 * 共通のインターフェースに従うことで一貫性を保つ。
 *
 * 設計方針:
 * - プラットフォーム非依存の型定義
 * - 最小限の共通インターフェース
 * - 拡張可能な構造
 *
 * @module ThemeTypes
 */

/* ======================================== */
/* 型定義 */
/* ======================================== */

/**
 * テーマモードの型定義
 * - 'light': 常にライトモード
 * - 'dark': 常にダークモード
 * - 'auto': システム設定に追従
 */
export type ThemeMode = 'light' | 'dark' | 'auto';

/**
 * テーマコンテキストの基本型定義
 * 各プラットフォームのThemeProviderはこのインターフェースを拡張する
 */
export interface BaseThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
}

/**
 * セマンティックカラーの型定義
 * プラットフォーム間で共通のカラー名を定義
 */
export interface SemanticColors {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  secondary: string;
  accent: string;

  success: string;
  warning: string;
  error: string;
  danger: string;
  info: string;

  background: string;
  surface: string;
  surfaceElevated: string;
  card: string;

  text: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;

  border: string;
  divider: string;

  overlay: string;
  backdropLight: string;
}

/**
 * ライトモード用のデフォルトカラー
 * Mobile版themeSystem.tsxのLIGHT_COLORSと統一
 */
export const LIGHT_THEME_COLORS: SemanticColors = {
  /* Primary & Secondary */
  primary: '#3B82F6',
  primaryDark: '#2563EB',
  primaryLight: '#93C5FD',
  secondary: '#10B981',
  accent: '#F59E0B',

  /* Semantic Colors */
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  danger: '#EF4444',
  info: '#3B82F6',

  /* Backgrounds */
  background: '#FFFFFF',
  surface: '#F8FAFC',
  surfaceElevated: '#FFFFFF',
  card: '#F8FAFC',

  /* Text Colors */
  text: '#111827',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textInverse: '#FFFFFF',

  /* Border & Divider */
  border: '#E5E7EB',
  divider: '#F3F4F6',

  /* Overlays */
  overlay: 'rgba(0, 0, 0, 0.5)',
  backdropLight: 'rgba(255, 255, 255, 0.8)',
};

/**
 * ダークモード用のデフォルトカラー
 * Mobile版themeSystem.tsxのDARK_COLORSと統一
 */
export const DARK_THEME_COLORS: SemanticColors = {
  /* Primary & Secondary */
  primary: '#60A5FA',
  primaryDark: '#3B82F6',
  primaryLight: '#DBEAFE',
  secondary: '#34D399',
  accent: '#FBBF24',

  /* Semantic Colors */
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',
  danger: '#F87171',
  info: '#60A5FA',

  /* Backgrounds (Mobile版に合わせて #000000 ベース) */
  background: '#000000',
  surface: '#1A1A1A',
  surfaceElevated: '#2A2A2A',
  card: '#1A1A1A',

  /* Text Colors (Mobile版に合わせる) */
  text: '#FFFFFF',
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0A0',
  textTertiary: '#707070',
  textInverse: '#000000',

  /* Border & Divider */
  border: '#2A2A2A',
  divider: '#333333',

  /* Overlays (ダークモードでは濃いめ) */
  overlay: 'rgba(0, 0, 0, 0.8)',
  backdropLight: 'rgba(0, 0, 0, 0.9)',
};

/**
 * テーマカラーを取得するユーティリティ関数
 * @param isDark - ダークモードかどうか
 * @returns 適切なカラーセット
 */
export function getThemeColors(isDark: boolean): SemanticColors {
  return isDark ? DARK_THEME_COLORS : LIGHT_THEME_COLORS;
}
