/**
 * スニペットカードのビジネスロジックフック
 *
 * スニペットカードに必要な状態管理とロジックを提供。
 * UIコンポーネント（SnippetCard.tsx）から完全に分離されたビジネスロジック層。
 *
 * 主な責務:
 * - コピー状態管理
 * - 展開/折りたたみ状態管理
 * - カテゴリ情報の取得
 * - 各種イベントハンドラ
 *
 * @see components/snippet/SnippetCard.tsx - UIコンポーネント
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@cliptap/shared';
import { SnippetWithDisplay, Category, useCategories } from '@cliptap/shared';
import { showConfirm } from '@utils/alerts';

/**
 * useSnippetCardのProps
 * @property snippet - 表示するスニペットデータ
 * @property onPress - タップ時のコールバック
 * @property onEdit - 編集ボタンタップ時のコールバック
 * @property onDelete - 削除ボタンタップ時のコールバック
 * @property categoryProp - 親から渡されるカテゴリ
 */
export interface UseSnippetCardProps {
  snippet: SnippetWithDisplay;
  onPress: (snippet: SnippetWithDisplay) => void;
  onEdit: (snippet: SnippetWithDisplay) => void;
  onDelete: (snippet: SnippetWithDisplay) => void;
  categoryProp?: Category | null;
}

/**
 * useSnippetCardの戻り値の型
 */
export interface UseSnippetCardReturn {
  /* 状態 */
  isCopying: boolean;
  isCopied: boolean;
  isExpanded: boolean;
  category: Category | null;
  displayTitle: string | null;
  displayContent: string | null;

  /* ハンドラ */
  handleCopy: () => Promise<void>;
  handleDelete: () => void;
  handleEdit: () => void;
  toggleExpanded: () => void;
}

/**
 * スニペットカードのビジネスロジックフック
 *
 * @param props - カードの表示データと各種コールバック
 * @returns カードに必要な全ての状態とハンドラ
 */
export function useSnippetCard({
  snippet,
  onPress,
  onEdit,
  onDelete,
  categoryProp,
}: UseSnippetCardProps): UseSnippetCardReturn {
  const { t } = useTranslation();
  const { getById: getCategoryById } = useCategories();

  const [isCopying, setIsCopying] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [category, setCategory] = useState<Category | null>(null);

  const displayTitle = snippet.displayTitle;
  const displayContent = snippet.displayContent;

  /**
   * カテゴリ情報の取得
   */
  useEffect(() => {
    if (categoryProp !== undefined) {
      setCategory(categoryProp);
    } else if (snippet.categoryId) {
      const cat = getCategoryById(snippet.categoryId);
      setCategory(cat);
    } else {
      setCategory(null);
    }
  }, [snippet.categoryId, categoryProp, getCategoryById]);

  /**
   * コピー完了アイコンの自動リセット
   */
  useEffect(() => {
    if (!isCopied) return;

    const timeoutId = setTimeout(() => {
      setIsCopied(false);
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [isCopied]);

  /**
   * コピーボタン押下時の処理
   */
  const handleCopy = useCallback(async () => {
    if (isCopying) return;
    setIsCopying(true);

    try {
      await onPress(snippet);
      setIsCopied(true);
    } catch (error) {
      setIsCopied(false);
    } finally {
      setIsCopying(false);
    }
  }, [isCopying, onPress, snippet]);

  /**
   * 削除ボタン押下時の処理
   */
  const handleDelete = useCallback(() => {
    showConfirm(
      t('snippet.delete_confirm'),
      () => onDelete(snippet),
      undefined,
      'danger'
    );
  }, [t, onDelete, snippet]);

  /**
   * 編集ボタン押下時の処理
   */
  const handleEdit = useCallback(() => {
    onEdit(snippet);
  }, [onEdit, snippet]);

  /**
   * 展開/折りたたみ切り替え
   */
  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  return {
    isCopying,
    isCopied,
    isExpanded,
    category,
    displayTitle,
    displayContent,
    handleCopy,
    handleDelete,
    handleEdit,
    toggleExpanded,
  };
}
