/**
 * カテゴリ管理画面のビジネスロジックフック
 *
 * カテゴリ一覧の表示・管理に必要な状態管理とロジックを提供。
 * UIコンポーネント（settings/categories.tsx）から完全に分離されたビジネスロジック層。
 *
 * 主な責務:
 * - カテゴリ一覧の取得・更新
 * - Pull-to-refresh処理
 * - 新規作成・編集・削除処理
 *
 * @see app/settings/categories.tsx - UIコンポーネント
 * @see lib/hooks/useCategories.ts - カテゴリCRUD操作
 */

import { useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCategories, type Category } from '@cliptap/shared';
import { showConfirm } from '@utils/alerts';
import { Logger } from '@cliptap/shared';

/**
 * useCategoriesScreenの戻り値の型
 */
export interface UseCategoriesScreenReturn {
  /* 状態 */
  categories: Category[];
  loading: boolean;

  /* ハンドラ */
  handleRefresh: () => void;
  handleCreateCategory: () => void;
  handleEditCategory: (category: Category) => void;
  handleDeleteCategory: (category: Category) => void;
}

/**
 * カテゴリ管理画面のビジネスロジックフック
 *
 * @returns 画面に必要な全ての状態とハンドラ
 */
export function useCategoriesScreen(): UseCategoriesScreenReturn {
  const router = useRouter();
  const { categories, loading, refresh, deleteCategory } = useCategories();

  /* ======================================== */
  /* 画面フォーカス時のデータ更新 */
  /* ======================================== */
  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  /* ======================================== */
  /* イベントハンドラ */
  /* ======================================== */

  const handleCreateCategory = useCallback(() => {
    router.push('/category/edit');
  }, [router]);

  const handleEditCategory = useCallback(
    (category: Category) => {
      router.push({
        pathname: '/category/edit',
        params: { id: category.id },
      });
    },
    [router]
  );

  const handleDeleteCategory = useCallback(
    (category: Category) => {
      showConfirm(
        'category.delete_confirm',
        () => {
          try {
            deleteCategory(category.id);
          } catch (error) {
            Logger.error('[CategoriesScreen] Failed to delete category:', error);
          }
        }
      );
    },
    [deleteCategory]
  );

  return {
    categories,
    loading,
    handleRefresh: refresh,
    handleCreateCategory,
    handleEditCategory,
    handleDeleteCategory,
  };
}
