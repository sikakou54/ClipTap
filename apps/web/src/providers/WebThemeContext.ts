/**
 * Web用テーマコンテキスト
 *
 * @description
 * Provider（{@link WebThemeProvider}）とフック（`useTheme`）の双方から参照するため、
 * コンポーネントを持たない独立したモジュールに切り出している。
 *
 * @module WebThemeContext
 */

import { createContext } from 'react';
import type { ThemeContextValue } from '@cliptap/shared';

/**
 * Web版テーマコンテキストの型定義
 */
export interface WebThemeContextValue extends ThemeContextValue {
  /** グリッドの列数（Web版固有） */
  gridColumns: 1 | 2 | 3;
  /** グリッドの列数を変更 */
  setGridColumns: (columns: 1 | 2 | 3) => void;
}

export const WebThemeContext = createContext<WebThemeContextValue | null>(null);
