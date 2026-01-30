/**
 * Mobile用ソート設定アダプター
 *
 * @description
 * AsyncStorageを使用してソート設定を永続化するアダプター実装。
 *
 * @module MobileSortPreferenceAdapter
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SortPreferenceAdapter, SnippetSortBy } from '@cliptap/shared';
import { Logger } from '@cliptap/shared';

/**
 * AsyncStorageでソート設定を保存するキー
 */
const SORT_PREFERENCE_KEY = '@snippet_sort_preference';

export class MobileSortPreferenceAdapter implements SortPreferenceAdapter {
  /**
   * 保存されたソート設定を取得
   */
  async getSortPreference(): Promise<SnippetSortBy | null> {
    try {
      const value = await AsyncStorage.getItem(SORT_PREFERENCE_KEY);
      if (value && (value === 'created' || value === 'updated' || value === 'title' || value === 'usage')) {
        return value as SnippetSortBy;
      }
      return null;
    } catch (error) {
      Logger.error('[MobileSortPreferenceAdapter] Failed to get sort preference:', error);
      return null;
    }
  }

  /**
   * ソート設定を保存
   */
  async setSortPreference(sortBy: SnippetSortBy): Promise<void> {
    try {
      await AsyncStorage.setItem(SORT_PREFERENCE_KEY, sortBy);
    } catch (error) {
      Logger.error('[MobileSortPreferenceAdapter] Failed to set sort preference:', error);
    }
  }
}
