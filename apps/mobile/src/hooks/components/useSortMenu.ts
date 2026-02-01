/**
 * ソートメニューのビジネスロジックフック
 *
 * ソートメニューに必要な状態管理とロジックを提供。
 * UIコンポーネント（SortMenu.tsx）から完全に分離されたビジネスロジック層。
 *
 * 主な責務:
 * - モーダル表示状態管理
 * - ソートオプションの生成
 * - ソート選択処理
 * - 使用頻度追跡設定に応じた使用頻度オプションの表示制御
 *
 * @see components/snippet/SortMenu.tsx - UIコンポーネント
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useTranslation } from '@cliptap/shared';
import { SnippetSortBy } from '@cliptap/shared';
import { FullAccessAdapter } from '@adapters/FullAccessAdapter';
import { type VariableIconName } from '@constants/ui';

/**
 * ソートオプションの型
 */
export interface SortOption {
  value: SnippetSortBy;
  label: string;
  icon: VariableIconName;
  disabled?: boolean;
}

/**
 * useSortMenuのProps
 * @property currentSort - 現在のソート順
 * @property onSortChange - ソート順変更時のコールバック
 */
export interface UseSortMenuProps {
  currentSort: SnippetSortBy;
  onSortChange: (sort: SnippetSortBy) => void;
}

/**
 * useSortMenuの戻り値の型
 */
export interface UseSortMenuReturn {
  /* 状態 */
  visible: boolean;
  sortOptions: SortOption[];
  currentOption: SortOption | undefined;
  isDefaultSort: boolean;

  /* ハンドラ */
  handlePress: () => void;
  handleSelect: (value: SnippetSortBy) => void;
  handleClose: () => void;
}

/**
 * デフォルトのソート順
 */
const DEFAULT_SORT: SnippetSortBy = 'created';

/**
 * ソートメニューのビジネスロジックフック
 *
 * @param props - 現在のソート順とコールバック
 * @returns メニューに必要な全ての状態とハンドラ
 */
export function useSortMenu({
  currentSort,
  onSortChange,
}: UseSortMenuProps): UseSortMenuReturn {
  const { t } = useTranslation();

  const [visible, setVisible] = useState(false);
  const [isUsageEnabled, setIsUsageEnabled] = useState(false);

  /**
   * 使用頻度追跡状態を取得
   * フルアクセス許可かつキーボード設定で使用頻度追跡がONの場合にtrue
   */
  useEffect(() => {
    FullAccessAdapter.isUsageTrackingEnabled().then(setIsUsageEnabled);
  }, []);

  /**
   * ソートオプション一覧
   * 使用頻度追跡が無効の場合は「使用頻度」をdisabledで表示
   */
  const sortOptions: SortOption[] = useMemo(
    () => [
      { value: 'created', label: t('sort.created'), icon: 'create-outline' },
      { value: 'updated', label: t('sort.updated'), icon: 'time-outline' },
      { value: 'title', label: t('sort.title_sort'), icon: 'text-outline' },
      {
        value: 'usage',
        label: t('sort.usage'),
        icon: 'stats-chart-outline',
        disabled: !isUsageEnabled,
      },
    ],
    [t, isUsageEnabled],
  );

  /**
   * デフォルトソートかどうか
   */
  const isDefaultSort = currentSort === DEFAULT_SORT;

  /**
   * 現在選択中のオプション
   */
  const currentOption = useMemo(() => {
    return sortOptions.find((opt) => opt.value === currentSort);
  }, [sortOptions, currentSort]);

  /**
   * メニューを開く
   */
  const handlePress = useCallback(() => {
    setVisible(true);
  }, []);

  /**
   * ソートを選択して閉じる
   */
  const handleSelect = useCallback((value: SnippetSortBy) => {
    onSortChange(value);
    setVisible(false);
  }, [onSortChange]);

  /**
   * メニューを閉じる
   */
  const handleClose = useCallback(() => {
    setVisible(false);
  }, []);

  return {
    visible,
    sortOptions,
    currentOption,
    isDefaultSort,
    handlePress,
    handleSelect,
    handleClose,
  };
}
