/**
 * Web用テーマストレージアダプター
 *
 * @description
 * LocalStorageを使用してテーマ設定を永続化する。
 * 既存のZustand persist形式との互換性を保つ。
 *
 * @module themeStorageAdapter
 */

import type { ThemeStorageAdapter, ThemeMode } from '@cliptap/shared';
import { THEME_STORAGE_KEY } from '@providers/themeStorage';

/**
 * Web用テーマストレージアダプター
 */
export const webThemeStorageAdapter: ThemeStorageAdapter = {
  /**
   * テーマモードを取得
   */
  async getThemeMode(): Promise<ThemeMode> {
    if (typeof localStorage === 'undefined') {
      return 'auto';
    }

    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        /* Zustand persist形式から値を取得 */
        return parsed.state?.themeMode ?? 'auto';
      }
    } catch {
      /* パースエラーは無視 */
    }

    return 'auto';
  },

  /**
   * テーマモードを保存
   */
  async setThemeMode(mode: ThemeMode): Promise<void> {
    if (typeof localStorage === 'undefined') return;

    try {
      const current = localStorage.getItem(THEME_STORAGE_KEY);
      const parsed = current ? JSON.parse(current) : { state: {}, version: 0 };
      parsed.state = { ...parsed.state, themeMode: mode };
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(parsed));
    } catch {
      /* ストレージエラーは無視 */
    }
  },
};

