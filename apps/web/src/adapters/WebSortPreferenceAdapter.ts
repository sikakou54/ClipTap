/**
 * Web用ソート設定アダプター
 *
 * @description
 * localStorageを使用してソート設定を永続化するアダプター実装。
 *
 * @module WebSortPreferenceAdapter
 */

import type { SortPreferenceAdapter, SnippetSortBy } from '@cliptap/shared';

/**
 * localStorageでソート設定を保存するキー
 */
const SORT_PREFERENCE_KEY = 'snippet_sort_preference';

export class WebSortPreferenceAdapter implements SortPreferenceAdapter {
  /**
   * 保存されたソート設定を取得
   */
  async getSortPreference(): Promise<SnippetSortBy | null> {
    try {
      const value = localStorage.getItem(SORT_PREFERENCE_KEY);
      if (value && (value === 'created' || value === 'updated' || value === 'title' || value === 'usage')) {
        return value as SnippetSortBy;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * ソート設定を保存
   */
  async setSortPreference(sortBy: SnippetSortBy): Promise<void> {
    try {
      localStorage.setItem(SORT_PREFERENCE_KEY, sortBy);
    } catch {
      /* localStorageが無効な場合は無視 */
    }
  }
}
