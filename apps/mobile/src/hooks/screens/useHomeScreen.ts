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

import { useState, useCallback, useMemo } from 'react';
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
  activeProfileId: string | undefined;
  currentSort: SnippetSortBy;

  /* データ */
  snippets: SnippetWithDisplay[];
  categories: Category[];
  filteredCategories: Category[];

  /* ハンドラ */
  handleCategorySelect: (categoryId: string | null) => void;
  handleRefresh: () => void;
  handleCopySnippet: (snippet: SnippetWithDisplay) => Promise<void>;
  handleCopySnippetTitle: (snippet: SnippetWithDisplay) => Promise<void>;
  handleEditSnippet: (snippet: SnippetWithDisplay) => void;
  handleDeleteSnippet: (snippet: SnippetWithDisplay) => void;
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
  /* ユーザーが明示的に選択したカテゴリID（null = すべて） */
  const [categoryOverride, setCategoryOverride] = useState<string | null>(null);

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
    copySnippetTitle,
    deleteSnippet,
    sortBy: currentSort,
    setSortBy: handleSortChange,
  } = useSnippets();

  /**
   * 実際に適用するカテゴリID
   *
   * 選択中のカテゴリが削除された場合は自動的に「すべて」へフォールバックする。
   * effectで書き潰さないため、カテゴリ一覧が一時的に空になっても選択は失われない。
   */
  const selectedCategoryId = useMemo(
    () => (categoryOverride && categories.some((c) => c.id === categoryOverride) ? categoryOverride : null),
    [categoryOverride, categories]
  );

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

  /* ======================================== */
  /* 派生状態 */
  /* ======================================== */

  const filteredCategories = useMemo(
    () => filterCategoriesWithSnippets(allSnippets, categories),
    [allSnippets, categories]
  );

  /* ======================================== */
  /* 画面フォーカス時のデータ更新 */
  /* ======================================== */
  useFocusEffect(
    useCallback(() => {
      refresh();
      refreshCategories();
      refreshProfiles();
    }, [refresh, refreshCategories, refreshProfiles])
  );

  /* ======================================== */
  /* イベントハンドラ */
  /* ======================================== */

  const handleCategorySelect = useCallback((categoryId: string | null) => {
    setCategoryOverride(categoryId);
  }, []);

  const handleRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  const handleCopySnippet = useCallback(async (snippet: SnippetWithDisplay) => {
    try {
      await copySnippet(snippet.id);
    } catch {
      showErrorAlert(t('error.generic'));
    }
  }, [copySnippet, t]);

  /* 一覧のタイトルタップ時はタイトルだけをコピーする（件名と本文を別々に貼り付ける用途） */
  const handleCopySnippetTitle = useCallback(async (snippet: SnippetWithDisplay) => {
    try {
      await copySnippetTitle(snippet.id);
    } catch (error) {
      showErrorAlert(t('error.generic'));
      /* カード側でコピー成功表示を出さないよう再スローする */
      throw error;
    }
  }, [copySnippetTitle, t]);

  const handleEditSnippet = useCallback((snippet: SnippetWithDisplay) => {
    router.push({
      pathname: '/snippet/edit',
      params: { id: snippet.id },
    });
  }, [router]);

  /* deleteSnippetは内部で一覧を再読込するため、追加のrefreshは不要 */
  const handleDeleteSnippet = useCallback((snippet: SnippetWithDisplay) => {
    try {
      deleteSnippet(snippet.id);
    } catch {
      showErrorAlert(t('error.generic'));
    }
  }, [deleteSnippet, t]);

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
    refreshProfiles();
    refresh();
  }, [refreshProfiles, refresh]);

  return {
    selectedCategoryId,
    activeProfileId,
    currentSort,
    snippets,
    categories,
    filteredCategories,
    handleCategorySelect,
    handleRefresh,
    handleCopySnippet,
    handleCopySnippetTitle,
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
