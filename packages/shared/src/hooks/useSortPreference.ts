/**
 * ソート設定フック
 *
 * @description
 * ソート設定の読み込み・保存を行うカスタムフック。
 * プラットフォーム固有の永続化はSortPreferenceAdapterを使用。
 *
 * @module useSortPreference
 */

import { useState, useEffect, useCallback } from 'react';
import type { SnippetSortBy } from '../types';
import { hasSortPreferenceAdapter, getSortPreferenceAdapter } from '../adapters/SortPreferenceAdapter';
import { Logger } from '../utils/logger';

/**
 * useSortPreferenceの戻り値の型
 */
export interface UseSortPreferenceReturn {
  /** 現在のソート設定 */
  sortBy: SnippetSortBy;
  /** ソート設定を変更する関数 */
  setSortBy: (sortBy: SnippetSortBy) => void;
  /** 設定読み込み中フラグ */
  isLoading: boolean;
}

/**
 * ソート設定フック
 *
 * @param defaultSort - デフォルトのソート設定（未設定時）
 * @returns ソート設定と変更関数
 */
export function useSortPreference(
  defaultSort: SnippetSortBy = 'created'
): UseSortPreferenceReturn {
  const [sortBy, setSortByState] = useState<SnippetSortBy>(defaultSort);
  const [isLoading, setIsLoading] = useState(true);

  /* 初回マウント時に保存された設定を読み込み */
  useEffect(() => {
    async function loadPreference() {
      if (!hasSortPreferenceAdapter()) {
        setIsLoading(false);
        return;
      }

      try {
        const adapter = getSortPreferenceAdapter();
        const saved = await adapter.getSortPreference();
        if (saved) {
          setSortByState(saved);
        }
      } catch (error) {
        Logger.error('[useSortPreference] Failed to load preference:', error);
      } finally {
        setIsLoading(false);
      }
    }

    void loadPreference();
  }, []);

  /**
   * ソート設定を変更し、永続化する
   */
  const setSortBy = useCallback((newSortBy: SnippetSortBy) => {
    setSortByState(newSortBy);

    /* 非同期で永続化（UIをブロックしない） */
    if (hasSortPreferenceAdapter()) {
      const adapter = getSortPreferenceAdapter();
      void adapter.setSortPreference(newSortBy).catch((error) => {
        Logger.error('[useSortPreference] Failed to save preference:', error);
      });
    }
  }, []);

  return {
    sortBy,
    setSortBy,
    isLoading,
  };
}
