/**
 * Web用テーマプロバイダー（拡張版）
 *
 * @description
 * shared版のThemeProviderをラップし、Web版固有の機能（gridColumns）を追加。
 * コンテキスト定義は{@link WebThemeContext}、参照用フックは`@hooks/useTheme`にある。
 *
 * @module WebThemeProvider
 */

import { useState, useCallback, useMemo, type ReactNode } from 'react';
import { ThemeProvider as SharedThemeProvider, useTheme as useSharedTheme, type ThemeProviderProps } from '@cliptap/shared';
import { WebThemeContext, type WebThemeContextValue } from '@providers/WebThemeContext';

/* ======================================== */
/* ストレージ管理 */
/* ======================================== */

const STORAGE_KEY = 'cliptap-theme';

/**
 * gridColumnsをストレージから読み込み
 */
function loadGridColumns(): 1 | 2 | 3 {
  if (typeof localStorage === 'undefined') {
    return 3;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const gridColumns = parsed.state?.gridColumns;
      if (gridColumns === 1 || gridColumns === 2 || gridColumns === 3) {
        return gridColumns;
      }
    }
  } catch {
    /* パースエラーは無視 */
  }

  return 3; /* デフォルト値 */
}

/**
 * gridColumnsをストレージに保存
 */
function saveGridColumns(columns: 1 | 2 | 3): void {
  if (typeof localStorage === 'undefined') return;

  try {
    const current = localStorage.getItem(STORAGE_KEY);
    const parsed = current ? JSON.parse(current) : { state: {}, version: 0 };
    parsed.state = { ...parsed.state, gridColumns: columns };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    /* ストレージエラーは無視 */
  }
}

/* ======================================== */
/* Provider */
/* ======================================== */

/**
 * Web版テーマプロバイダー（内部コンポーネント）
 */
function WebThemeProviderInner({ children }: { children: ReactNode }) {
  const sharedTheme = useSharedTheme();
  const [gridColumns, setGridColumnsState] = useState<1 | 2 | 3>(loadGridColumns);

  /* gridColumnsを変更 */
  const setGridColumns = useCallback((columns: 1 | 2 | 3) => {
    setGridColumnsState(columns);
    saveGridColumns(columns);
  }, []);

  const value = useMemo<WebThemeContextValue>(() => ({
    ...sharedTheme,
    gridColumns,
    setGridColumns,
  }), [sharedTheme, gridColumns, setGridColumns]);

  /* Web版テーマプロバイダー（内部、gridColumns管理） */
  return (
    <WebThemeContext.Provider value={value}>
      {children}
    </WebThemeContext.Provider>
  );
}

/**
 * Web版テーマプロバイダー
 */
export function WebThemeProvider(props: ThemeProviderProps) {
  /* Web版テーマプロバイダー（shared版をラップ、gridColumns機能追加） */
  return (
    <SharedThemeProvider {...props}>
      <WebThemeProviderInner>
        {props.children}
      </WebThemeProviderInner>
    </SharedThemeProvider>
  );
}
