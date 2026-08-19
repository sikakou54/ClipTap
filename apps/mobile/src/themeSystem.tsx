/**
 * @module themeSystem
 * @description
 * 統一テーマシステム
 *
 * このモジュールはプロジェクト全体で単一のテーマ管理システムを提供します。
 * ライト/ダークモードの配色、レスポンシブデザイン、
 * タイポグラフィなど、UIに関するすべてのスタイル定義を集約しています。
 *
 * 主な機能:
 * - OSのライト/ダーク設定に追従した配色の切り替え（手動切替UIは持たない）
 * - レスポンシブなスペーシング・フォントサイズ
 * - 統一されたカラーパレット
 * - タイポグラフィシステム
 * - デバイスタイプ（phone/tablet/iPad）の判定
 *
 * レスポンシブ値（フォントサイズ・行高・余白・寸法・最大コンテンツ幅）は
 * 起動時のウィンドウ幅で確定し、画面回転やiPadの分割表示では再計算しない。
 * 詳細と、追従させる場合に同時に直す必要がある箇所はbuildThemeValueのコメントを参照。
 *
 * 使用箇所:
 * - 全画面・コンポーネントでのスタイル適用
 *
 * @see useTheme - テーマ情報を取得するフック
 * @see ThemeProvider - テーマコンテキストを提供するプロバイダー
 */

import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme, Platform } from 'react-native';
import { Logger } from './logger';
import { responsive, isTablet, getMaxContentWidth } from '@utils/responsive';
import {
  LIGHT_THEME_COLORS,
  DARK_THEME_COLORS,
  SPACING as SHARED_SPACING,
  FONT_SIZES as SHARED_FONT_SIZES,
  TYPOGRAPHY as SHARED_TYPOGRAPHY,
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
const SPACING = SHARED_SPACING;

/**
 * レスポンシブスペーシングを取得
 *
 * デバイスタイプに応じたスペーシング値を返します。
 * phone/tablet/desktopで異なる値を適用します。
 *
 * @returns レスポンシブスペーシングオブジェクト
 */
const getResponsiveSpacing = () => ({
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
const FONT_SIZES = SHARED_FONT_SIZES;

/**
 * レスポンシブフォントサイズを取得
 *
 * デバイスタイプに応じたフォントサイズを返します。
 * タブレットでは読みやすさのため大きめのサイズを適用します。
 *
 * @returns フォントサイズオブジェクト
 */
const getResponsiveFontSizes = () => {
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
const getResponsiveLineHeights = () => {
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
const TYPOGRAPHY = SHARED_TYPOGRAPHY;

/* ========================================
   寸法システム（sharedから取得）
   ======================================== */

/**
 * レスポンシブ寸法を取得
 *
 * デバイスタイプに応じた寸法を返します。
 * タブレット・iPadでは大きめのサイズを適用します。
 *
 * 参照されている値だけを定義する。ヘッダー高さやボタン寸法などは
 * 各画面がスタイル側で持っており、ここへ重複定義すると
 * どちらが効いているのか読み手が追えなくなるため置かない。
 *
 * @returns レスポンシブ寸法オブジェクト
 */
const getResponsiveDimensions = () => {
  const isTabletDevice = isTablet();

  return {
    header: {
      iconSize: isTabletDevice ? 32 : responsive.width(24, 28, 32),
    },
    card: {
      padding: responsive.spacing(16, 20, 24),
    },
  };
};

/* ========================================
   シャドウシステム（sharedから取得）
   ======================================== */

/**
 * シャドウシステム
 * @cliptap/sharedのSHADOWSを使用
 */
const SHADOWS = SHARED_SHADOWS;

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

/**
 * テーマコンテキストの型定義
 *
 * useTheme()フックから取得できる値の型。
 * 色、スペーシング、フォントサイズ、レスポンシブ値など
 * すべてのテーマ関連情報を含みます。
 */
interface ThemeContextType {
  /** 現在のテーマに応じたカラーパレット */
  colors: typeof LIGHT_COLORS;
  spacing: typeof SPACING;
  responsiveFontSizes: ReturnType<typeof getResponsiveFontSizes>;
  responsiveLineHeights: ReturnType<typeof getResponsiveLineHeights>;
  typography: typeof TYPOGRAPHY;
  shadows: typeof SHADOWS;
  isTablet: boolean;
  responsive: ReturnType<typeof getResponsiveDimensions>;
  responsiveSpacing: ReturnType<typeof getResponsiveSpacing>;
  /** コンテンツの最大幅（電話サイズでは上限を設けないためundefined） */
  maxContentWidth: number | undefined;
}

/** テーマコンテキスト */
const ThemeContext = createContext<ThemeContextType | null>(null);

/* ========================================
   ThemeProvider コンポーネント
   ======================================== */

/**
 * テーマ値を組み立てる
 *
 * ThemeProviderが提供する値と、useThemeがProvider外で返すフォールバック値は同じ内容である。
 * 両者がずれないよう、組み立てをこの関数へ集約している。
 *
 * レスポンシブなフォントサイズ・余白・寸法・最大コンテンツ幅は、
 * 起動時のウィンドウ幅で確定させる仕様であり、画面回転やiPadの分割表示では再計算しない。
 * ThemeProviderはウィンドウ寸法を購読せず、isDarkが変わったときだけ組み立て直す。
 *
 * 回転へ追従させたくなった場合は、この関数だけでは足りない。
 * app/_layout.tsx の presentation 切り替えと
 * src/hooks/screens/useAdapterInitialization.ts の isTabletDevice も
 * 同時にリアクティブ化しないと、モーダルの表示形式とヘッダーの見た目が食い違う。
 *
 * @param isDark - ダークモードかどうか（カラーパレットの選択にのみ使用する）
 * @returns テーマコンテキストの値
 */
const buildThemeValue = (isDark: boolean): ThemeContextType => ({
  colors: isDark ? DARK_COLORS : LIGHT_COLORS,
  spacing: SPACING,
  responsiveFontSizes: getResponsiveFontSizes(),
  responsiveLineHeights: getResponsiveLineHeights(),
  typography: TYPOGRAPHY,
  shadows: SHADOWS,
  isTablet: isTablet(),
  responsive: getResponsiveDimensions(),
  responsiveSpacing: getResponsiveSpacing(),
  maxContentWidth: getMaxContentWidth(),
});

/**
 * テーマプロバイダーコンポーネント
 *
 * アプリ全体にテーマコンテキストを提供します。
 * _layout.tsxで最上位にラップして使用します。
 *
 * @param {React.ReactNode} children - 子コンポーネント
 */
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  /* RN 0.86のuseColorSchemeは'unspecified'を返しうるため、テーマ型の'light'|'dark'|nullへ正規化する */
  const rawColorScheme = useColorScheme();
  const colorScheme = rawColorScheme === 'unspecified' ? null : rawColorScheme;

  const isDark = colorScheme === 'dark' || (Platform.OS === 'web' && getWebDarkMode());

  /*
   * 依存はisDarkのみ。レスポンシブ値は起動時のウィンドウ幅で確定する仕様のため、
   * ウィンドウ寸法は依存に含めない（含めても他の凍結値と整合しない）。
   */
  const value = useMemo(() => buildThemeValue(isDark), [isDark]);

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

    return buildThemeValue(isDark);
  }

  return context;
};
