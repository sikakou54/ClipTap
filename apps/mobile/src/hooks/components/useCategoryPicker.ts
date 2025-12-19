/**
 * カテゴリ選択モーダルのビジネスロジックフック
 *
 * カテゴリ選択モーダルに必要な状態管理とロジックを提供。
 * UIコンポーネント（CategoryPicker.tsx）から完全に分離されたビジネスロジック層。
 *
 * 主な責務:
 * - 新規カテゴリ作成モーダルの表示状態管理
 * - カテゴリ選択処理
 * - オプションリストの生成
 *
 * @see components/category/CategoryPicker.tsx - UIコンポーネント
 */

import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from '@cliptap/shared';
import { useTheme } from '@lib/themeSystem';
import { Category } from '@cliptap/shared';

/**
 * useCategoryPickerのProps
 * @property categories - 選択可能なカテゴリ一覧
 * @property selectedCategoryId - 現在選択中のカテゴリID
 * @property onSelect - カテゴリ選択時のコールバック
 * @property onClose - 閉じる時のコールバック
 * @property onCategoryCreated - 新規カテゴリ作成後のコールバック
 */
export interface UseCategoryPickerProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelect: (categoryId: string | null) => void;
  onClose: () => void;
  onCategoryCreated?: () => void;
}

/**
 * カテゴリオプションの型
 */
export interface CategoryOption {
  id: string | null;
  name: string;
  color: string;
  icon?: string;
}

/**
 * useCategoryPickerの戻り値の型
 */
export interface UseCategoryPickerReturn {
  /* 状態 */
  showCreateModal: boolean;
  options: CategoryOption[];

  /* ハンドラ */
  handleSelect: (categoryId: string | null) => void;
  handleOpenCreateModal: () => void;
  handleCloseCreateModal: () => void;
  handleCategoryCreated: () => void;
}

/**
 * カテゴリ選択モーダルのビジネスロジックフック
 *
 * @param props - モーダルの状態と各種コールバック
 * @returns モーダルに必要な全ての状態とハンドラ
 */
export function useCategoryPicker({
  categories,
  onSelect,
  onClose,
  onCategoryCreated,
}: UseCategoryPickerProps): UseCategoryPickerReturn {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const [showCreateModal, setShowCreateModal] = useState(false);

  /**
   * カテゴリ選択時の処理
   */
  const handleSelect = useCallback((categoryId: string | null) => {
    onSelect(categoryId);
    onClose();
  }, [onSelect, onClose]);

  /**
   * 新規作成モーダルを開く
   */
  const handleOpenCreateModal = useCallback(() => {
    setShowCreateModal(true);
  }, []);

  /**
   * 新規作成モーダルを閉じる
   */
  const handleCloseCreateModal = useCallback(() => {
    setShowCreateModal(false);
  }, []);

  /**
   * 新規カテゴリ作成後の処理
   */
  const handleCategoryCreated = useCallback(() => {
    if (onCategoryCreated) {
      onCategoryCreated();
    }
  }, [onCategoryCreated]);

  /**
   * オプションリストを生成
   * 「カテゴリなし」+ カテゴリ一覧 + 「新規作成」
   */
  const options = useMemo((): CategoryOption[] => {
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

    const categoryOptions: CategoryOption[] = categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      color: cat.color || colors.primary,
    }));

    return [uncategorizedOption, ...categoryOptions, createNewOption];
  }, [categories, t, colors.textSecondary, colors.primary]);

  return {
    showCreateModal,
    options,
    handleSelect,
    handleOpenCreateModal,
    handleCloseCreateModal,
    handleCategoryCreated,
  };
}
