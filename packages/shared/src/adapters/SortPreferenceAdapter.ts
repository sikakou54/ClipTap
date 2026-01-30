/**
 * ソート設定アダプター
 *
 * @description
 * プラットフォーム固有のソート設定の保存・取得を行うAdapterパターン実装。
 *
 * 必要な理由:
 * - Mobileアプリ（AsyncStorage）とWebアプリ（localStorage）で異なるストレージを使用
 * - shared層からプラットフォーム固有の実装に依存しないため
 *
 * 使用方法:
 * 1. アプリ起動時にプラットフォーム固有の実装を登録: setSortPreferenceAdapter()
 * 2. 各画面から getSortPreferenceAdapter() で取得してソート設定を読み書き
 *
 * @module SortPreferenceAdapter
 */

import type { SnippetSortBy } from '../schema';

/**
 * ソート設定アダプターインターフェース
 */
export interface SortPreferenceAdapter {
  /**
   * 保存されたソート設定を取得
   *
   * @returns ソート設定（未設定の場合はnull）
   */
  getSortPreference(): Promise<SnippetSortBy | null>;

  /**
   * ソート設定を保存
   *
   * @param sortBy - 保存するソート設定
   */
  setSortPreference(sortBy: SnippetSortBy): Promise<void>;
}

/* ======================================== */
/* アダプターインスタンス管理 */
/* ======================================== */

let currentSortPreferenceAdapter: SortPreferenceAdapter | null = null;

export function setSortPreferenceAdapter(adapter: SortPreferenceAdapter): void {
  currentSortPreferenceAdapter = adapter;
}

export function getSortPreferenceAdapter(): SortPreferenceAdapter {
  if (!currentSortPreferenceAdapter) {
    throw new Error('SortPreferenceAdapter is not set. Call setSortPreferenceAdapter() at startup.');
  }
  return currentSortPreferenceAdapter;
}

export function hasSortPreferenceAdapter(): boolean {
  return currentSortPreferenceAdapter !== null;
}
