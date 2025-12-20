/**
 * カテゴリ関連のユーティリティ関数
 *
 * @module categoryUtils
 */

import type { Category, Snippet } from '../schema';

/**
 * 定型文が存在するカテゴリのみをフィルタリング
 *
 * @param snippets - 全定型文リスト
 * @param categories - 全カテゴリリスト
 * @returns 定型文が存在するカテゴリのみ
 */
export function filterCategoriesWithSnippets(
  snippets: Pick<Snippet, 'categoryId'>[],
  categories: Category[]
): Category[] {
  /* スニペットが使用しているカテゴリIDのセットを作成（nullを除外） */
  const usedCategoryIds = new Set(
    snippets
      .map(s => s.categoryId)
      .filter((id): id is string => id !== null && id !== undefined)
  );
  /* 使用されているカテゴリのみをフィルタリング */
  return categories.filter(c => usedCategoryIds.has(c.id));
}
