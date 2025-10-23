/**
 * 統一テーマシステム
 * プロジェクト全体で単一のテーマ管理システムを提供
 */

import React, { createContext, useContext, useState } from 'react';
import { useColorScheme, Platform } from 'react-native';
import { Logger } from './logger';

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
  background: '#111827',
  surface: '#1F2937',
  surfaceElevated: '#374151',
  card: '#1F2937',

  // Text Colors
  text: '#F9FAFB',
  textPrimary: '#F9FAFB',
  textSecondary: '#D1D5DB',
  textTertiary: '#9CA3AF',
  textInverse: '#111827',

  // Border & Divider
  border: '#374151',
  divider: '#4B5563',

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.7)',
  backdropLight: 'rgba(0, 0, 0, 0.8)',
};

// スペーシングシステム
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

// 寸法システム
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
  typography: typeof TYPOGRAPHY;
  dimensions: typeof DIMENSIONS;
  shadows: typeof SHADOWS;
  radius: typeof RADIUS;
  isDark: boolean;
  colorScheme: 'light' | 'dark' | null | undefined;
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
    typography: TYPOGRAPHY,
    dimensions: DIMENSIONS,
    shadows: SHADOWS,
    radius: RADIUS,
    isDark,
    colorScheme,
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
      typography: TYPOGRAPHY,
      dimensions: DIMENSIONS,
      shadows: SHADOWS,
      radius: RADIUS,
      isDark,
      colorScheme,
      themeMode: 'auto' as ThemeMode,
      setThemeMode: () => {},
    };
  }

  return context;
};

export const COLORS = LIGHT_COLORS;
export const MODERN_COLORS = { light: LIGHT_COLORS, dark: DARK_COLORS };

export default {
  useTheme,
  SPACING,
  TYPOGRAPHY,
  DIMENSIONS,
  SHADOWS,
  RADIUS,
};
