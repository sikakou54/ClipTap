/**
 * ホーム画面のビジネスロジックフック
 *
 * メイン画面（定型文一覧）の全ての状態管理とロジックを提供。
 * UIコンポーネント（index.tsx）から完全に分離されたビジネスロジック層。
 *
 * 主な責務:
 * - 定型文一覧の取得とフィルタリング
 * - カテゴリフィルターの管理
 * - Pull-to-refresh処理
 * - 定型文のコピー・編集・削除操作
 * - 画面フォーカス時のデータ更新
 *
 * @see app/index.tsx - UIコンポーネント
 * @see lib/hooks/useSnippets.ts - 定型文CRUD操作
 * @see lib/hooks/useCategories.ts - カテゴリCRUD操作
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTranslation } from '@cliptap/shared';
import i18next from '@i18n/config';
import { useSnippets, useCategories, useProfiles, useVariables, useFilteredSnippets, filterCategoriesWithSnippets, type Category, type SnippetWithDisplay, type SnippetSortBy } from '@cliptap/shared';
import { showErrorAlert } from '@utils/alerts';

/**
 * useHomeScreenの戻り値の型
 */
export interface UseHomeScreenReturn {
  /* 状態 */
  selectedCategoryId: string | null;
  refreshing: boolean;
  activeProfileId: string | undefined;
  currentSort: SnippetSortBy;

  /* データ */
  snippets: SnippetWithDisplay[];
  categories: Category[];
  filteredCategories: Category[];

  /* ハンドラ */
  handleCategorySelect: (categoryId: string | null) => void;
  handleRefresh: () => Promise<void>;
  handleCopySnippet: (snippet: SnippetWithDisplay) => Promise<void>;
  handleEditSnippet: (snippet: SnippetWithDisplay) => void;
  handleDeleteSnippet: (snippet: SnippetWithDisplay) => Promise<void>;
  handleNavigateToSettings: () => void;
  handleNavigateToExportImport: () => void;
  handleNavigateToSearch: () => void;
  handleNavigateToCreate: () => void;
  handleProfileChange: () => void;
  handleSortChange: (sortBy: SnippetSortBy) => void;
}

/**
 * ホーム画面のビジネスロジックフック
 *
 * @returns 画面に必要な全ての状態とハンドラ
 */
export function useHomeScreen(): UseHomeScreenReturn {
  const { t } = useTranslation();
  const router = useRouter();

  /* ======================================== */
  /* 状態管理 */
  /* ======================================== */
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  /* ======================================== */
  /* データ取得 */
  /* ======================================== */
  const { categories, refresh: refreshCategories } = useCategories();
  const { profiles, profileVariables, refresh: refreshProfiles } = useProfiles();
  const { variables } = useVariables();

  /* アクティブなプロファイルを取得（現在選択中の環境、isActive=trueのもの） */
  const activeProfile = useMemo(
    () => profiles.find((p) => p.isActive) ?? null,
    [profiles]
  );

  const activeProfileId = activeProfile?.id;
  const defaultProfile = useMemo(() => profiles.find((p) => p.isDefault) ?? null, [profiles]);
  const defaultProfileId = defaultProfile?.id;

  /* スニペットデータを取得（Providerから全データを取得） */
  const {
    allSnippets: allSnippetsData,
    snippetProfiles,
    refresh,
    copySnippet,
    deleteSnippet,
    sortBy: currentSort,
    setSortBy: handleSortChange,
  } = useSnippets();

  /* 共通フィルタリングフックを使用（カテゴリフィルタ適用） */
  const { filteredSnippets: snippets } = useFilteredSnippets({
    snippets: allSnippetsData,
    snippetProfiles,
    searchQuery: '', /* ホーム画面では検索なし */
    selectedCategory: selectedCategoryId,
    activeProfileId: activeProfileId ?? null,
    defaultProfileId: defaultProfileId ?? null,
    variables,
    profileVariables,
    locale: i18next.language,
  });

  /* 全スニペットを取得（カテゴリフィルタなし、カテゴリ一覧の表示用） */
  const { filteredSnippets: allSnippets } = useFilteredSnippets({
    snippets: allSnippetsData,
    snippetProfiles,
    searchQuery: '',
    selectedCategory: null, /* 全カテゴリ */
    activeProfileId: activeProfileId ?? null,
    defaultProfileId: defaultProfileId ?? null,
    variables,
    profileVariables,
    locale: i18next.language,
  });

  /* 後方互換性のため、refreshAllSnippetsをrefreshにエイリアス */
  const refreshAllSnippets = refresh;

  /* ======================================== */
  /* 派生状態 */
  /* ======================================== */

  const filteredCategories = useMemo(
    () => filterCategoriesWithSnippets(allSnippets, categories),
    [allSnippets, categories]
  );

  /* ======================================== */
  /* カテゴリ削除検知 */
  /* ======================================== */
  useEffect(() => {
    if (selectedCategoryId && !categories.find(c => c.id === selectedCategoryId)) {
      setSelectedCategoryId(null);
    }
  }, [categories, selectedCategoryId]);

  /* ======================================== */
  /* 画面フォーカス時のデータ更新 */
  /* ======================================== */
  useFocusEffect(
    useCallback(() => {
      void refresh();
      void refreshAllSnippets();
      void refreshCategories();
      void refreshProfiles();
    }, [refresh, refreshAllSnippets, refreshCategories, refreshProfiles])
  );

  /* ======================================== */
  /* イベントハンドラ */
  /* ======================================== */

  const handleCategorySelect = useCallback((categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleCopySnippet = useCallback(async (snippet: SnippetWithDisplay) => {
    try {
      await copySnippet(snippet.id);
    } catch (error) {
      showErrorAlert(t('error.generic'));
    }
  }, [copySnippet, t]);

  const handleEditSnippet = useCallback((snippet: SnippetWithDisplay) => {
    router.push({
      pathname: '/snippet/edit',
      params: { id: snippet.id },
    });
  }, [router]);

  const handleDeleteSnippet = useCallback(async (snippet: SnippetWithDisplay) => {
    try {
      await deleteSnippet(snippet.id);
      await refreshAllSnippets();
    } catch (error) {
      showErrorAlert(t('error.generic'));
    }
  }, [deleteSnippet, refreshAllSnippets, t]);

  const handleNavigateToSettings = useCallback(() => {
    router.push('/settings');
  }, [router]);

  const handleNavigateToExportImport = useCallback(() => {
    router.push('/settings/export-import');
  }, [router]);

  const handleNavigateToSearch = useCallback(() => {
    router.push('/search');
  }, [router]);

  const handleNavigateToCreate = useCallback(() => {
    router.push('/snippet/create');
  }, [router]);

  const handleProfileChange = useCallback(() => {
    void refreshProfiles();
    void refresh();
    void refreshAllSnippets();
  }, [refreshProfiles, refresh, refreshAllSnippets]);

  return {
    selectedCategoryId,
    refreshing,
    activeProfileId,
    currentSort,
    snippets,
    categories,
    filteredCategories,
    handleCategorySelect,
    handleRefresh,
    handleCopySnippet,
    handleEditSnippet,
    handleDeleteSnippet,
    handleNavigateToSettings,
    handleNavigateToExportImport,
    handleNavigateToSearch,
    handleNavigateToCreate,
    handleProfileChange,
    handleSortChange,
  };
}
