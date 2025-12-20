/**
 * 検索画面のビジネスロジックフック
 *
 * 定型文検索画面の全ての状態管理とロジックを提供。
 * UIコンポーネント（search.tsx）から完全に分離されたビジネスロジック層。
 *
 * 主な責務:
 * - 検索クエリの管理とデバウンス検索
 * - プロファイル（環境）によるフィルタリング
 * - 検索結果の定型文操作（コピー・編集・削除）
 * - Pull-to-refresh処理
 *
 * @see app/search.tsx - UIコンポーネント
 * @see lib/hooks/useSearch.ts - 検索デバウンス処理
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from '@cliptap/shared';
import {
  SnippetService,
  ProfileService,
  VariableService,
  SubscriptionService,
  FEATURE_LIMITS,
  useCategories,
  useProfiles,
  useSearch,
  getSnippetCountByProfile,
  useSnippets,
  useVariables,
  useFilteredSnippets,
  type Category,
  type SnippetWithDisplay,
  type Profile,
} from '@cliptap/shared';
import { copyToClipboard } from '@utils/clipboard';
import i18next from '@i18n/config';
import { Logger } from '@cliptap/shared';
import { showErrorAlert } from '@utils/alerts';

/**
 * useSearchScreenの戻り値の型
 */
export interface UseSearchScreenReturn {
  /* 検索状態 */
  query: string;
  setQuery: (query: string) => void;

  /* フィルター状態 */
  selectedProfileId: string | null;
  setSelectedProfileId: (id: string | null) => void;

  /* UI状態 */
  refreshing: boolean;

  /* データ */
  displaySnippets: SnippetWithDisplay[];
  profiles: Profile[];
  filteredProfiles: Profile[];
  categories: Category[];

  /* 派生関数 */
  getProfileSnippetCount: (profileId: string) => number;
  hasSearchQuery: boolean;

  /* ハンドラ */
  handleRefresh: () => void;
  handleCopySnippet: (snippet: SnippetWithDisplay) => Promise<void>;
  handleEditSnippet: (snippet: SnippetWithDisplay) => void;
  handleDeleteSnippet: (snippet: SnippetWithDisplay) => void;
  handleClose: () => void;
}

/**
 * 検索画面のビジネスロジックフック
 *
 * @returns 画面に必要な全ての状態とハンドラ
 */
export function useSearchScreen(): UseSearchScreenReturn {
  const { t } = useTranslation();
  const router = useRouter();

  /* ======================================== */
  /* データ取得 */
  /* ======================================== */
  const { profiles, profileVariables, activeProfile } = useProfiles();
  const defaultProfile = useMemo(() => profiles.find((p) => p.isDefault) ?? null, [profiles]);
  const defaultProfileId = defaultProfile?.id;
  const { categories } = useCategories();
  const { variables } = useVariables();
  const { allSnippets, snippetProfiles, deleteSnippet, refresh: refreshSnippets } = useSnippets();

  /* onErrorコールバックをメモ化（無限ループ防止） */
  const handleSearchError = useCallback((msg: string, err: unknown) => {
    Logger.error(msg, err);
  }, []);

  const { query, setQuery, results } = useSearch({
    onError: handleSearchError,
  });

  /* ======================================== */
  /* 状態管理 */
  /* ======================================== */
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    activeProfile?.id || null
  );

  /* ======================================== */
  /* アクティブプロファイル変更時の同期 */
  /* ======================================== */
  useEffect(() => {
    if (activeProfile?.id) {
      setSelectedProfileId(activeProfile.id);
    }
  }, [activeProfile?.id]);

  /* ======================================== */
  /* 派生状態 */
  /* ======================================== */

  /**
   * 検索ベースの定型文リスト（検索クエリがある場合は検索結果、ない場合は全スニペット）
   */
  const baseSnippets = useMemo(() => {
    return query.trim() ? results : allSnippets;
  }, [query, results, allSnippets]);

  /**
   * 検索クエリがあるかどうか
   */
  const hasSearchQuery = useMemo(() => query.trim().length > 0, [query]);

  /**
   * 各環境の定型文件数を計算
   */
  const getProfileSnippetCountFn = useCallback(
    (profileId: string): number => getSnippetCountByProfile(baseSnippets, snippetProfiles, profileId),
    [baseSnippets, snippetProfiles]
  );

  /**
   * 表示する環境リスト
   * 検索時は検索結果を持つ環境のみフィルタリング
   */
  const filteredProfiles = useMemo(() => {
    if (hasSearchQuery) {
      return profiles.filter((p: Profile) => getProfileSnippetCountFn(p.id) > 0);
    }
    return profiles;
  }, [profiles, hasSearchQuery, getProfileSnippetCountFn]);

  /**
   * 画面表示用の定型文リスト（プロファイルフィルタリング適用、変数展開済み）
   */
  const { filteredSnippets: displaySnippets } = useFilteredSnippets({
    snippets: baseSnippets,
    snippetProfiles,
    searchQuery: '', /* 検索はbaseSnippetsで既にフィルタ済み */
    selectedCategory: null, /* カテゴリフィルタなし */
    activeProfileId: selectedProfileId ?? null,
    defaultProfileId: defaultProfileId ?? null,
    variables,
    profileVariables,
    locale: i18next.language,
  });

  /* ======================================== */
  /* イベントハンドラ */
  /* ======================================== */

  /**
   * Pull-to-refresh処理
   */
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    refreshSnippets();
    setRefreshing(false);
  }, [refreshSnippets]);

  /**
   * 定型文コピー
   * 変数展開失敗時は元のテキストをコピー
   */
  const handleCopySnippet = useCallback(
    async (snippet: SnippetWithDisplay) => {
      try {
        let textToCopy: string;
        const profileId = selectedProfileId || undefined;

        try {
          const isSubscribed = SubscriptionService.isSubscribed();
          const profileVariablesMap = profileId
            ? ProfileService.getProfileVariablesMap(profileId)
            : ProfileService.getActiveProfileVariablesMap();
          const defaultProfileVariablesMap = ProfileService.getDefaultProfileVariablesMap();

          const customResolver = VariableService.createCustomVariableResolver(
            { isSubscribed, profileVariablesMap, defaultProfileVariablesMap },
            { freeTierLimit: FEATURE_LIMITS.FREE_TIER_VARIABLES }
          );

          textToCopy = await SnippetService.prepareForClipboard(snippet.id, {
            locale: i18next.language,
            customResolver,
            shouldReplaceVariables: true,
          });
        } catch (varError) {
          Logger.warn('[useSearchScreen] Variable replacement failed, copying original content:', varError);
          textToCopy = await SnippetService.prepareForClipboard(snippet.id, {
            shouldReplaceVariables: false,
          });
        }

        await copyToClipboard(textToCopy);
      } catch (error) {
        showErrorAlert(t('error.generic'));
      }
    },
    [selectedProfileId, t]
  );

  /**
   * 定型文編集画面へ遷移
   */
  const handleEditSnippet = useCallback(
    (snippet: SnippetWithDisplay) => {
      router.push({
        pathname: '/snippet/edit',
        params: { id: snippet.id },
      });
    },
    [router]
  );

  /**
   * 定型文削除
   */
  const handleDeleteSnippet = useCallback(
    (snippet: SnippetWithDisplay) => {
      try {
        deleteSnippet(snippet.id);
      } catch (error) {
        showErrorAlert(t('error.generic'));
      }
    },
    [deleteSnippet, t]
  );

  /**
   * 検索画面を閉じる
   */
  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  /* ======================================== */
  /* 戻り値 */
  /* ======================================== */
  return {
    /* 検索状態 */
    query,
    setQuery,

    /* フィルター状態 */
    selectedProfileId,
    setSelectedProfileId,

    /* UI状態 */
    refreshing,

    /* データ */
    displaySnippets,
    profiles,
    filteredProfiles,
    categories,

    /* 派生関数 */
    getProfileSnippetCount: getProfileSnippetCountFn,
    hasSearchQuery,

    /* ハンドラ */
    handleRefresh,
    handleCopySnippet,
    handleEditSnippet,
    handleDeleteSnippet,
    handleClose,
  };
}
