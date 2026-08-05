/**
 * Web版テーマフック
 *
 * @description
 * {@link WebThemeProvider} が提供するテーマ情報とグリッド列数を取得する。
 *
 * @module useTheme
 */

import { useContext } from 'react';
import { WebThemeContext, type WebThemeContextValue } from '@providers/WebThemeContext';

/**
 * Web版テーマフック
 */
export function useTheme(): WebThemeContextValue {
  const context = useContext(WebThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a WebThemeProvider');
  }
  return context;
}
