/**
 * @module themeSystem
 * @description
 * 統一テーマシステム
 *
 * このモジュールはプロジェクト全体で単一のテーマ管理システムを提供します。
 * ライト/ダークモードの切り替え、レスポンシブデザイン、
 * タイポグラフィなど、UIに関するすべてのスタイル定義を集約しています。
 *
 * 主な機能:
 * - ライト/ダークモードの自動・手動切り替え
 * - レスポンシブなスペーシング・フォントサイズ
 * - 統一されたカラーパレット
 * - タイポグラフィシステム
 * - デバイスタイプ（phone/tablet/iPad）の判定
 *
 * 使用箇所:
 * - 全画面・コンポーネントでのスタイル適用
 * - 設定画面でのテーマ切り替え
 *
 * @see useTheme - テーマ情報を取得するフック
 * @see ThemeProvider - テーマコンテキストを提供するプロバイダー
 */

import React, { createContext, useContext, useState } from 'react';
import { useColorScheme, Platform } from 'react-native';
import { Logger } from './logger';
import { responsive, isTablet } from '@utils/responsive';
import {
  LIGHT_THEME_COLORS,
  DARK_THEME_COLORS,
  type ThemeMode,
  SPACING as SHARED_SPACING,
  FONT_SIZES as SHARED_FONT_SIZES,
  TYPOGRAPHY as SHARED_TYPOGRAPHY,
  RADIUS as SHARED_RADIUS,
  DIMENSIONS as SHARED_DIMENSIONS,
  SHADOWS as SHARED_SHADOWS,
} from '@cliptap/shared';

/* ========================================
   カラーパレット定義（sharedから取得）
   ======================================== */

/**
 * ライトモード用カラーパレット
 * @cliptap/sharedのLIGHT_THEME_COLORSを使用
 */
const LIGHT_COLORS = LIGHT_THEME_COLORS;

/**
 * ダークモード用カラーパレット
 * @cliptap/sharedのDARK_THEME_COLORSを使用
 */
const DARK_COLORS = DARK_THEME_COLORS;

/* ========================================
   スペーシングシステム（sharedから取得）
   ======================================== */

/**
 * スペーシングシステム（基本値）
 * @cliptap/sharedのSPACINGを使用
 */
export const SPACING = SHARED_SPACING;

/**
 * レスポンシブスペーシングを取得
 *
 * デバイスタイプに応じたスペーシング値を返します。
 * phone/tablet/desktopで異なる値を適用します。
 *
 * @returns レスポンシブスペーシングオブジェクト
 */
export const getResponsiveSpacing = () => ({
  screenPadding: responsive.spacing(16, 32, 48),
  cardGap: responsive.spacing(12, 16, 20),
  sectionGap: responsive.spacing(24, 32, 40),
  containerPadding: responsive.spacing(16, 24, 32),
});

/* ========================================
   フォントサイズシステム（sharedから取得）
   ======================================== */

/**
 * フォントサイズシステム（基本値）
 * @cliptap/sharedのFONT_SIZESを使用
 */
export const FONT_SIZES = SHARED_FONT_SIZES;

/**
 * レスポンシブフォントサイズを取得
 *
 * デバイスタイプに応じたフォントサイズを返します。
 * タブレットでは読みやすさのため大きめのサイズを適用します。
 *
 * @returns フォントサイズオブジェクト
 */
export const getResponsiveFontSizes = () => {
  const deviceType = isTablet() ? 'tablet' : 'phone';

  if (deviceType === 'tablet') {
    return {
      xs: 15,
      sm: 18,
      base: 20,
      md: 22,
      lg: 26,
      xl: 30,
      xxl: 40,
      hero: 60,
    };
  }

  return FONT_SIZES;
};

/**
 * レスポンシブラインハイトを取得
 *
 * フォントサイズの1.5倍の行高さを返します。
 * 可読性を確保するための適切な行間を提供します。
 *
 * @returns ラインハイトオブジェクト
 */
export const getResponsiveLineHeights = () => {
  const fontSizes = getResponsiveFontSizes();

  return {
    xs: Math.round(fontSizes.xs * 1.5),      /* 18 (phone: 12 * 1.5) or 23 (tablet: 15 * 1.5) */
    sm: Math.round(fontSizes.sm * 1.5),      /* 21 (phone: 14 * 1.5) or 27 (tablet: 18 * 1.5) */
    base: Math.round(fontSizes.base * 1.5),  /* 24 (phone: 16 * 1.5) or 30 (tablet: 20 * 1.5) */
    md: Math.round(fontSizes.md * 1.5),      /* 27 (phone: 18 * 1.5) or 33 (tablet: 22 * 1.5) */
    lg: Math.round(fontSizes.lg * 1.5),      /* 30 (phone: 20 * 1.5) or 39 (tablet: 26 * 1.5) */
    xl: Math.round(fontSizes.xl * 1.5),      /* 36 (phone: 24 * 1.5) or 45 (tablet: 30 * 1.5) */
    xxl: Math.round(fontSizes.xxl * 1.5),    /* 48 (phone: 32 * 1.5) or 60 (tablet: 40 * 1.5) */
    hero: Math.round(fontSizes.hero * 1.5),  /* 72 (phone: 48 * 1.5) or 90 (tablet: 60 * 1.5) */
  };
};

/* ========================================
   タイポグラフィシステム（sharedから取得）
   ======================================== */

/**
 * タイポグラフィシステム
 * @cliptap/sharedのTYPOGRAPHYを使用
 */
export const TYPOGRAPHY = SHARED_TYPOGRAPHY;

/* ========================================
   寸法システム（sharedから取得）
   ======================================== */

/**
 * 寸法システム（基本値）
 * @cliptap/sharedのDIMENSIONSを使用
 */
export const DIMENSIONS = SHARED_DIMENSIONS;

/**
 * レスポンシブ寸法を取得
 *
 * デバイスタイプに応じた寸法を返します。
 * タブレット・iPadでは大きめのサイズを適用します。
 *
 * @returns レスポンシブ寸法オブジェクト
 */
export const getResponsiveDimensions = () => {
  const isTabletDevice = isTablet();

  return {
    header: {
      height: isTabletDevice ? 90 : responsive.width(60, 80, 90),
      paddingHorizontal: responsive.spacing(16, 24, 32),
      paddingVertical: isTabletDevice ? 24 : 12,
      iconSize: isTabletDevice ? 32 : responsive.width(24, 28, 32),
    },
    card: {
      minHeight: responsive.width(80, 100, 120),
      padding: responsive.spacing(16, 20, 24),
    },
    button: {
      height: responsive.width(44, 52, 60),
      paddingHorizontal: responsive.spacing(16, 24, 32),
    },
    fab: {
      size: responsive.width(56, 64, 72),
      right: responsive.spacing(24, 48, 64),
    },
  };
};

/* ========================================
   シャドウ・ボーダーシステム（sharedから取得）
   ======================================== */

/**
 * シャドウシステム
 * @cliptap/sharedのSHADOWSを使用
 */
export const SHADOWS = SHARED_SHADOWS;

/**
 * ボーダーラディウス
 * @cliptap/sharedのRADIUSを使用
 */
export const RADIUS = SHARED_RADIUS;

/* ========================================
   ヘルパー関数
   ======================================== */

/**
 * Web環境でのダークモード検知
 * window.matchMediaを使用してシステム設定を取得
 */
const getWebDarkMode = (): boolean => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return false;
};

/* ========================================
   テーマコンテキスト
   ======================================== */

/* ThemeMode型は@cliptap/sharedからインポート済み */

/**
 * テーマコンテキストの型定義
 *
 * useTheme()フックから取得できる値の型。
 * 色、スペーシング、フォントサイズ、レスポンシブ値など
 * すべてのテーマ関連情報を含みます。
 */
interface ThemeContextType {
  /** 現在のテーマモード */
  themeMode: ThemeMode;
  /** テーマモードを変更する関数 */
  setThemeMode: (mode: ThemeMode) => void;
  /** 現在のテーマに応じたカラーパレット */
  colors: typeof LIGHT_COLORS;
  spacing: typeof SPACING;
  fontSizes: typeof FONT_SIZES;
  responsiveFontSizes: ReturnType<typeof getResponsiveFontSizes>;
  responsiveLineHeights: ReturnType<typeof getResponsiveLineHeights>;
  typography: typeof TYPOGRAPHY;
  dimensions: typeof DIMENSIONS;
  shadows: typeof SHADOWS;
  radius: typeof RADIUS;
  isDark: boolean;
  colorScheme: 'light' | 'dark' | null | undefined;
  isTablet: boolean;
  responsive: ReturnType<typeof getResponsiveDimensions>;
  responsiveSpacing: ReturnType<typeof getResponsiveSpacing>;
}

/** テーマコンテキスト */
const ThemeContext = createContext<ThemeContextType | null>(null);

/* ========================================
   ThemeProvider コンポーネント
   ======================================== */

/**
 * テーマプロバイダーコンポーネント
 *
 * アプリ全体にテーマコンテキストを提供します。
 * _layout.tsxで最上位にラップして使用します。
 *
 * @param {React.ReactNode} children - 子コンポーネント
 */
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeMode] = useState<ThemeMode>('auto');
  /* RN 0.86のuseColorSchemeは'unspecified'を返しうるため、テーマ型の'light'|'dark'|nullへ正規化する */
  const rawColorScheme = useColorScheme();
  const colorScheme = rawColorScheme === 'unspecified' ? null : rawColorScheme;

  const isDark = themeMode === 'auto'
    ? (colorScheme === 'dark' || (Platform.OS === 'web' && getWebDarkMode()))
    : themeMode === 'dark';

  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

  const value: ThemeContextType = {
    themeMode,
    setThemeMode,
    colors,
    spacing: SPACING,
    fontSizes: FONT_SIZES,
    responsiveFontSizes: getResponsiveFontSizes(),
    responsiveLineHeights: getResponsiveLineHeights(),
    typography: TYPOGRAPHY,
    dimensions: DIMENSIONS,
    shadows: SHADOWS,
    radius: RADIUS,
    isDark,
    colorScheme,
    isTablet: isTablet(),
    responsive: getResponsiveDimensions(),
    responsiveSpacing: getResponsiveSpacing(),
  };

  /* テーマプロバイダー（テーマコンテキストを提供） */
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

/* ========================================
   useTheme フック
   ======================================== */

/**
 * テーマ情報を取得するカスタムフック
 *
 * ThemeProviderでラップされたコンポーネント内で使用します。
 * ThemeProvider外で使用された場合はフォールバック値を返します。
 *
 * @returns テーマ情報オブジェクト
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);

  /* フックは条件分岐の外で無条件に呼ぶ（値はフォールバック時のみ使用する） */
  /* RN 0.86のuseColorSchemeは'unspecified'を返しうるため、テーマ型の'light'|'dark'|nullへ正規化する */
  const rawColorScheme = useColorScheme();
  const colorScheme = rawColorScheme === 'unspecified' ? null : rawColorScheme;

  if (!context) {
    const isDark = colorScheme === 'dark' || (Platform.OS === 'web' && getWebDarkMode());

    Logger.debug('🎨 [THEME] useTheme fallback:', {
      colorScheme,
      platform: Platform.OS,
      isDark,
      reason: 'no_context'
    });

    return {
      colors: isDark ? DARK_COLORS : LIGHT_COLORS,
      spacing: SPACING,
      fontSizes: FONT_SIZES,
      responsiveFontSizes: getResponsiveFontSizes(),
      responsiveLineHeights: getResponsiveLineHeights(),
      typography: TYPOGRAPHY,
      dimensions: DIMENSIONS,
      shadows: SHADOWS,
      radius: RADIUS,
      isDark,
      colorScheme,
      themeMode: 'auto' as ThemeMode,
      setThemeMode: () => { },
      isTablet: isTablet(),
      responsive: getResponsiveDimensions(),
      responsiveSpacing: getResponsiveSpacing(),
    };
  }

  return context;
};
