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

  /* OSのダークモード設定。themeModeが'auto'のときだけisDarkに反映される */
  const [systemDark, setSystemDark] = useState<boolean>(() => platformAdapter.getSystemDarkMode());

  /* isDarkはthemeModeとsystemDarkから一意に決まるため、状態を持たず派生値として求める */
  const isDark = themeMode === 'auto' ? systemDark : themeMode === 'dark';

  useEffect(() => {
    if (!storageAdapter) return;

    storageAdapter.getThemeMode()
      .then((mode) => {
        setThemeModeState(mode);
      })
      .catch((err) => {
        Logger.error('Failed to load theme mode:', err);
      });
  }, [storageAdapter]);

  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    setThemeModeState(mode);

    if (storageAdapter) {
      try {
        await storageAdapter.setThemeMode(mode);
      } catch (err) {
        Logger.error('Failed to save theme mode:', err);
      }
    }
  }, [storageAdapter]);

  /* OSのダークモード変更を常時監視する。
     'auto'のときだけ監視すると、'auto'へ戻したときにsystemDarkが古いままになる */
  useEffect(() => {
    if (!platformAdapter.watchSystemDarkMode) return;

    return platformAdapter.watchSystemDarkMode((nextSystemDark) => {
      setSystemDark(nextSystemDark);
    });
  }, [platformAdapter]);

  /* 確定したisDarkをDOM側（Web版のdarkクラス）へ反映する */
  useEffect(() => {
    platformAdapter.applyDarkClass?.(isDark);
  }, [isDark, platformAdapter]);

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

