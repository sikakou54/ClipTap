/**
 * 統一テーマシステム
 * プロジェクト全体で単一のテーマ管理システムを提供
 */

import React, { createContext, useContext, useState } from 'react';
import { useColorScheme, Platform } from 'react-native';
import { Logger } from './logger';
import { responsive, isTablet, isIPad } from './utils/responsive';

// カラーパレット定義
const LIGHT_COLORS = {
  // Primary & Secondary
  primary: '#3B82F6',
  primaryDark: '#2563EB',
  primaryLight: '#93C5FD',
  secondary: '#10B981',
  accent: '#F59E0B',

  // Semantic Colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  danger: '#EF4444',
  info: '#3B82F6',

  // Backgrounds
  background: '#FFFFFF',
  surface: '#F8FAFC',
  surfaceElevated: '#FFFFFF',
  card: '#F8FAFC',

  // Text Colors
  text: '#111827',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textInverse: '#FFFFFF',

  // Border & Divider
  border: '#E5E7EB',
  divider: '#F3F4F6',

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.5)',
  backdropLight: 'rgba(255, 255, 255, 0.8)',
};

const DARK_COLORS = {
  // Primary & Secondary
  primary: '#60A5FA',
  primaryDark: '#3B82F6',
  primaryLight: '#DBEAFE',
  secondary: '#34D399',
  accent: '#FBBF24',

  // Semantic Colors
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',
  danger: '#F87171',
  info: '#60A5FA',

  // Backgrounds
  background: '#000000',
  surface: '#1A1A1A',
  surfaceElevated: '#2A2A2A',
  card: '#1A1A1A',

  // Text Colors
  text: '#FFFFFF',
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0A0',
  textTertiary: '#707070',
  textInverse: '#000000',

  // Border & Divider
  border: '#2A2A2A',
  divider: '#333333',

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.8)',
  backdropLight: 'rgba(0, 0, 0, 0.9)',
};

// スペーシングシステム（レスポンシブ対応）
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

// レスポンシブスペーシング関数
export const getResponsiveSpacing = () => ({
  screenPadding: responsive.spacing(16, 32, 48),
  cardGap: responsive.spacing(12, 16, 20),
  sectionGap: responsive.spacing(24, 32, 40),
  containerPadding: responsive.spacing(16, 24, 32),
});

// フォントサイズシステム
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

// レスポンシブフォントサイズ関数
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

// レスポンシブラインハイト関数（fontSize * 1.5）
export const getResponsiveLineHeights = () => {
  const fontSizes = getResponsiveFontSizes();

  return {
    xs: Math.round(fontSizes.xs * 1.5),      // 18 (phone: 12 * 1.5) or 23 (tablet: 15 * 1.5)
    sm: Math.round(fontSizes.sm * 1.5),      // 21 (phone: 14 * 1.5) or 27 (tablet: 18 * 1.5)
    base: Math.round(fontSizes.base * 1.5),  // 24 (phone: 16 * 1.5) or 30 (tablet: 20 * 1.5)
    md: Math.round(fontSizes.md * 1.5),      // 27 (phone: 18 * 1.5) or 33 (tablet: 22 * 1.5)
    lg: Math.round(fontSizes.lg * 1.5),      // 30 (phone: 20 * 1.5) or 39 (tablet: 26 * 1.5)
    xl: Math.round(fontSizes.xl * 1.5),      // 36 (phone: 24 * 1.5) or 45 (tablet: 30 * 1.5)
    xxl: Math.round(fontSizes.xxl * 1.5),    // 48 (phone: 32 * 1.5) or 60 (tablet: 40 * 1.5)
    hero: Math.round(fontSizes.hero * 1.5),  // 72 (phone: 48 * 1.5) or 90 (tablet: 60 * 1.5)
  };
};

// タイポグラフィシステム
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

// 寸法システム（レスポンシブ対応）
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

// レスポンシブ寸法関数
export const getResponsiveDimensions = () => {
  const deviceType = isTablet() ? 'tablet' : 'phone';
  const isPadDevice = isIPad();

  return {
    header: {
      height: isPadDevice ? 90 : responsive.width(60, 80, 90),
      paddingHorizontal: responsive.spacing(16, 24, 32),
      paddingVertical: deviceType === 'tablet' ? 24 : 12,
      iconSize: isPadDevice ? 32 : responsive.width(24, 28, 32),
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

// シャドウシステム（フラットデザイン）
export const SHADOWS = {
  small: {},
  medium: {},
  large: {},
} as const;

// ボーダーラディウス
export const RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  round: 50,
} as const;

// テーマコンテキスト
type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
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
  isIPad: boolean;
  responsive: ReturnType<typeof getResponsiveDimensions>;
  responsiveSpacing: ReturnType<typeof getResponsiveSpacing>;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeMode] = useState<ThemeMode>('auto');
  const colorScheme = useColorScheme();

  // Web環境での強制ダークモード検知
  const getWebDarkMode = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  };

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
    isIPad: isIPad(),
    responsive: getResponsiveDimensions(),
    responsiveSpacing: getResponsiveSpacing(),
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// React Hook
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    const colorScheme = useColorScheme();
    const getWebDarkMode = () => {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
      return false;
    };
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
      isIPad: isIPad(),
      responsive: getResponsiveDimensions(),
      responsiveSpacing: getResponsiveSpacing(),
    };
  }

  return context;
};
