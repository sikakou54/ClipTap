/**
 * カテゴリ選択画面のビジネスロジックフック
 *
 * カテゴリ選択モーダルの全ての状態管理とロジックを提供。
 * UIコンポーネント（category/select.tsx）から完全に分離されたビジネスロジック層。
 *
 * 主な責務:
 * - カテゴリ一覧の取得と表示
 * - カテゴリ選択時のコールバック処理
 * - 新規カテゴリ作成画面への遷移
 *
 * @see app/category/select.tsx - UIコンポーネント
 * @see lib/hooks/useCategories.ts - カテゴリCRUD操作
 */

import { useCallback, useMemo } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTranslation } from '@cliptap/shared';
import { useTheme } from '@lib/themeSystem';
import { useCategories, type Category } from '@cliptap/shared';

/**
 * カテゴリ選択オプションの型
 */
export interface CategoryOption {
  id: string | null;
  name: string;
  color: string;
  icon?: string;
}

/**
 * useCategorySelectScreenの引数の型
 */
export interface UseCategorySelectScreenParams {
  /** 現在選択中のカテゴリID（'null'の場合はnullとして扱う） */
  selectedId?: string;
}

/**
 * useCategorySelectScreenの戻り値の型
 */
export interface UseCategorySelectScreenReturn {
  /* データ */
  options: CategoryOption[];
  selectedCategoryId: string | null | undefined;

  /* スタイル用 */
  colors: ReturnType<typeof useTheme>['colors'];
  responsiveFontSizes: ReturnType<typeof useTheme>['responsiveFontSizes'];

  /* ハンドラ */
  handleSelect: (categoryId: string | null) => void;
  handleCreateNew: () => void;
  handleItemPress: (item: CategoryOption) => void;
}

/**
 * カテゴリ選択画面のビジネスロジックフック
 *
 * @param params - 画面パラメータ
 * @returns 画面に必要な全ての状態とハンドラ
 */
export function useCategorySelectScreen(params: UseCategorySelectScreenParams): UseCategorySelectScreenReturn {
  const { selectedId } = params;

  const { t } = useTranslation();
  const { colors, responsiveFontSizes } = useTheme();
  const router = useRouter();
  const { categories, refresh } = useCategories();

  /* ======================================== */
  /* 画面フォーカス時のデータ更新 */
  /* ======================================== */
  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const selectedCategoryId = useMemo(
    () => (selectedId === 'null' ? null : selectedId),
    [selectedId]
  );

  /* ======================================== */
  /* リストデータの構築 */
  /* ======================================== */
  const options = useMemo<CategoryOption[]>(() => {
    const uncategorizedOption: CategoryOption = {
      id: null,
      name: t('category.uncategorized'),
      color: colors.textSecondary,
      icon: 'remove-circle-outline',
    };

    const createNewOption: CategoryOption = {
      id: 'create-new',
      name: t('category.create'),
      color: colors.primary,
      icon: 'add-circle-outline',
    };

    return [
      uncategorizedOption,
      ...categories.map((c: Category) => ({
        id: c.id,
        name: c.name,
        color: c.color || colors.primary,
      })),
      createNewOption,
    ];
  }, [categories, colors.textSecondary, colors.primary, t]);

  /* ======================================== */
  /* イベントハンドラ */
  /* ======================================== */

  const handleSelect = useCallback(
    (categoryId: string | null) => {
      if (global.categorySelectCallback) {
        global.categorySelectCallback(categoryId);
      }
      router.back();
    },
    [router]
  );

  const handleCreateNew = useCallback(() => {
    router.push('/category/edit');
  }, [router]);

  const handleItemPress = useCallback(
    (item: CategoryOption) => {
      if (item.id === 'create-new') {
        handleCreateNew();
      } else {
        handleSelect(item.id);
      }
    },
    [handleSelect, handleCreateNew]
  );

  return {
    options,
    selectedCategoryId,
    colors,
    responsiveFontSizes,
    handleSelect,
    handleCreateNew,
    handleItemPress,
  };
}
