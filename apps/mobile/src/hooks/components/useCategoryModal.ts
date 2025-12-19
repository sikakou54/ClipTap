/**
 * カテゴリモーダルのビジネスロジックフック
 *
 * カテゴリの新規作成・編集モーダルに必要な状態管理とロジックを提供。
 * UIコンポーネント（CategoryModal.tsx）から完全に分離されたビジネスロジック層。
 *
 * 主な責務:
 * - フォーム状態管理（名前、色）
 * - バリデーション
 * - 保存処理（新規作成/更新）
 * - モーダル開閉時の状態リセット
 *
 * @see components/category/CategoryModal.tsx - UIコンポーネント
 */

import { useState, useEffect, useCallback } from 'react';
import { useCategories, type Category, EmptyContentError, CATEGORY_COLORS } from '@cliptap/shared';
import { showAlert } from '@utils/alerts';
import { translateError } from '@cliptap/shared';

/**
 * useCategoryModalのProps
 * @property visible - モーダル表示状態
 * @property category - 編集対象のカテゴリ（nullなら新規作成）
 * @property onClose - 閉じる時のコールバック
 * @property onSuccess - 保存成功時のコールバック
 */
export interface UseCategoryModalProps {
  visible: boolean;
  category?: Category | null;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * useCategoryModalの戻り値の型
 */
export interface UseCategoryModalReturn {
  /* 状態 */
  categoryName: string;
  selectedColor: string;
  saving: boolean;
  isEdit: boolean;

  /* ハンドラ */
  setCategoryName: (name: string) => void;
  setSelectedColor: (color: string) => void;
  handleSave: () => Promise<void>;
  handleClose: () => void;
}

/**
 * カテゴリモーダルのビジネスロジックフック
 *
 * @param props - モーダルの表示状態と各種コールバック
 * @returns モーダルに必要な全ての状態とハンドラ
 */
export function useCategoryModal({
  visible,
  category,
  onClose,
  onSuccess,
}: UseCategoryModalProps): UseCategoryModalReturn {
  const { createCategory, updateCategory } = useCategories();

  const [categoryName, setCategoryName] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>(CATEGORY_COLORS[0]);
  const [saving, setSaving] = useState(false);

  const isEdit = !!category;

  /**
   * モーダル表示時のフォーム初期化
   * 編集モード: 既存カテゴリの値をセット
   * 新規作成モード: 空の状態にリセット
   */
  useEffect(() => {
    if (category) {
      setCategoryName(category.name);
      setSelectedColor(category.color || CATEGORY_COLORS[0]);
    } else {
      setCategoryName('');
      setSelectedColor(CATEGORY_COLORS[0]);
    }
  }, [category, visible]);

  /**
   * モーダルを閉じる処理
   * フォーム状態をリセットしてonCloseコールバックを実行
   */
  const handleClose = useCallback(() => {
    setCategoryName('');
    setSelectedColor(CATEGORY_COLORS[0]);
    onClose();
  }, [onClose]);

  /**
   * カテゴリ保存処理
   * 処理フロー:
   * 1. 名前のバリデーション
   * 2. 編集/新規作成に応じてAPI呼び出し
   * 3. 成功時はモーダルを閉じてコールバック実行
   */
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      if (!categoryName.trim()) {
        throw new EmptyContentError();
      }
      if (isEdit && category) {
        updateCategory({
          id: category.id,
          name: categoryName.trim(),
          color: selectedColor,
        });
      } else {
        createCategory({
          name: categoryName.trim(),
          color: selectedColor,
        });
      }
      handleClose();
      onSuccess();
    } catch (error) {
      const message = translateError(error);
      showAlert('', message);
    } finally {
      setSaving(false);
    }
  }, [categoryName, selectedColor, isEdit, category, createCategory, updateCategory, handleClose, onSuccess]);

  return {
    categoryName,
    selectedColor,
    saving,
    isEdit,
    setCategoryName,
    setSelectedColor,
    handleSave,
    handleClose,
  };
}
