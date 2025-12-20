/**
 * テーマプロバイダー（共通実装）
 *
 * @description
 * プラットフォーム非依存のテーマ管理プロバイダー。
 * プラットフォーム固有の実装はアダプター経由で提供される。
 *
 * 主な機能:
 * - テーマモードの管理（light/dark/auto）
 * - システム設定の監視
 * - ストレージへの永続化（オプション）
 *
 * @module ThemeProvider
 */

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import type { ThemeMode, BaseThemeContextType, SemanticColors } from './ThemeTypes';
import { getThemeColors } from './ThemeTypes';
import { Logger } from '../utils/logger';

/* ======================================== */
/* 型定義 */
/* ======================================== */

/**
 * テーマストレージアダプター
 * プラットフォーム固有のストレージ実装を抽象化
 */
export interface ThemeStorageAdapter {
  /** テーマモードを取得 */
  getThemeMode: () => Promise<ThemeMode>;
  /** テーマモードを保存 */
  setThemeMode: (mode: ThemeMode) => Promise<void>;
}

/**
 * プラットフォームアダプター
 * プラットフォーム固有の機能を抽象化
 */
export interface ThemePlatformAdapter {
  /** システムのダークモード設定を取得 */
  getSystemDarkMode: () => boolean;
  /** ダーククラスを適用（Web用、Mobileでは不要） */
  applyDarkClass?: (isDark: boolean) => void;
  /** システム設定の変更を監視（オプション） */
  watchSystemDarkMode?: (callback: (isDark: boolean) => void) => () => void;
}

/**
 * ThemeProviderのProps
 */
export interface ThemeProviderProps {
  /** 子コンポーネント */
  children: ReactNode;
  /** ストレージアダプター（オプション、永続化が必要な場合） */
  storageAdapter?: ThemeStorageAdapter;
  /** プラットフォームアダプター（必須） */
  platformAdapter: ThemePlatformAdapter;
  /** デフォルトのテーマモード */
  defaultThemeMode?: ThemeMode;
  /** カスタムカラー取得関数（オプション、デフォルトはgetThemeColors） */
  getThemeColors?: (isDark: boolean) => SemanticColors;
}

/**
 * テーマコンテキストの型定義
 */
export interface ThemeContextValue extends BaseThemeContextType {
  /** テーマカラー */
  colors: SemanticColors;
}

/* ======================================== */
/* Context */
/* ======================================== */

/** テーマ状態を共有するためのReact Context */
const ThemeContext = createContext<ThemeContextValue | null>(null);

/* ======================================== */
/* Provider */
/* ======================================== */

/**
 * テーマ状態を管理するProvider
 *
 * @param props - ThemeProviderProps
 */
export function ThemeProvider({
  children,
  storageAdapter,
  platformAdapter,
  defaultThemeMode = 'auto',
  getThemeColors: customGetThemeColors,
}: ThemeProviderProps) {
  const getColors = customGetThemeColors || getThemeColors;

  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => defaultThemeMode);

  const [isDark, setIsDark] = useState<boolean>(() => {
    const systemDark = platformAdapter.getSystemDarkMode();
    return defaultThemeMode === 'auto' ? systemDark : defaultThemeMode === 'dark';
  });

  useEffect(() => {
    if (!storageAdapter) return;

    storageAdapter.getThemeMode()
      .then((mode) => {
        setThemeModeState(mode);
        const systemDark = platformAdapter.getSystemDarkMode();
        const shouldBeDark = mode === 'auto' ? systemDark : mode === 'dark';
        setIsDark(shouldBeDark);
        platformAdapter.applyDarkClass?.(shouldBeDark);
      })
      .catch((err) => {
        Logger.error('Failed to load theme mode:', err);
      });
  }, [storageAdapter, platformAdapter]);

  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    const systemDark = platformAdapter.getSystemDarkMode();
    const shouldBeDark = mode === 'auto' ? systemDark : mode === 'dark';

    setThemeModeState(mode);
    setIsDark(shouldBeDark);
    platformAdapter.applyDarkClass?.(shouldBeDark);

    if (storageAdapter) {
      try {
        await storageAdapter.setThemeMode(mode);
      } catch (err) {
        Logger.error('Failed to save theme mode:', err);
      }
    }
  }, [storageAdapter, platformAdapter]);

  useEffect(() => {
    const systemDark = platformAdapter.getSystemDarkMode();
    const shouldBeDark = themeMode === 'auto' ? systemDark : themeMode === 'dark';
    setIsDark(shouldBeDark);
    platformAdapter.applyDarkClass?.(shouldBeDark);
  }, [themeMode, platformAdapter]);

  useEffect(() => {
    if (themeMode !== 'auto' || !platformAdapter.watchSystemDarkMode) return;

    const unwatch = platformAdapter.watchSystemDarkMode((systemDark) => {
      setIsDark(systemDark);
      platformAdapter.applyDarkClass?.(systemDark);
    });

    return unwatch;
  }, [themeMode, platformAdapter]);

  const colors = useMemo(() => getColors(isDark), [isDark, getColors]);

  const value = useMemo<ThemeContextValue>(() => ({
    themeMode,
    setThemeMode,
    isDark,
    colors,
  }), [themeMode, setThemeMode, isDark, colors]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

/* ======================================== */
/* Hook */
/* ======================================== */

/**
 * テーマ状態を取得するフック
 *
 * @returns テーマ状態とアクション
 * @throws Provider外で使用された場合にエラー
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

