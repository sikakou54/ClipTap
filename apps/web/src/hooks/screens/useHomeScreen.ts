/**
 * ホーム画面のビジネスロジックフック
 *
 * @description
 * メイン画面（定型文一覧）の状態管理とロジックを提供。
 * Mobile版と同様のシンプルな構成で、モーダル/エクスポート/インポートは
 * 専用フック（useSnippetModal, useExportScreen, useImportScreen）に分離。
 *
 * @see pages/Dashboard.tsx - UIコンポーネント
 * @see useSnippetModal.ts - スニペット作成/編集モーダル
 * @see useExportScreen.ts - エクスポート処理
 * @see useImportScreen.ts - インポート処理
 */

import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from '@cliptap/shared';
import {
  useSnippets,
  useCategories,
  useProfiles,
  useVariables,
  useAuth,
  useFilteredSnippets,
  useDebounce,
  type Snippet,
  type Category,
  type Profile,
  type Variable,
  type ProfileVariable,
  type SnippetWithDisplay,
  type SnippetSortBy,
} from '@cliptap/shared';
import { useDatabase } from '@cliptap/shared';
import { useTheme } from '@providers/WebThemeProvider';
import { useBodyScrollLock } from '@hooks/useBodyScrollLock';
import { useMobileMenu } from '@hooks/useMobileMenu';
import { useSnippetModal } from '@hooks/screens/useSnippetModal';
import { useExportScreen } from '@hooks/screens/useExportScreen';
import { useImportScreen } from '@hooks/screens/useImportScreen';

/** スニペットフォームの値（re-export） */
export type { SnippetFormValues } from './useSnippetModal';

/**
 * useHomeScreenの戻り値の型
 */
export interface UseHomeScreenReturn {
  /* ローディング状態 */
  isLoaded: boolean;

  /* UI状態 */
  searchQuery: string;
  selectedCategory: string | null;
  copiedId: string | null;
  expandedSnippetId: string | null;
  showProfileDropdown: boolean;
  showSearchBar: boolean;
  gridColumns: 1 | 2 | 3;

  /* モバイルメニュー */
  isMobileMenuOpen: boolean;

  /* スニペットモーダル（useSnippetModalから） */
  snippetModal: ReturnType<typeof useSnippetModal>;

  /* エクスポート画面（useExportScreenから） */
  exportScreen: ReturnType<typeof useExportScreen>;

  /* インポート画面（useImportScreenから） */
  importScreen: ReturnType<typeof useImportScreen>;

  /* モーダル表示状態（スクロールロック用） */
  isModalOpen: boolean;

  /* データ */
  filteredSnippets: SnippetWithDisplay[];
  categories: Category[];
  profiles: Profile[];
  validProfiles: Profile[];
  variables: Variable[];
  profileVariables: ProfileVariable[];
  activeProfile: Profile | null;
  activeProfileId: string | null;
  defaultProfileId: string | null;

  /* ソート */
  currentSort: SnippetSortBy;
  handleSortChange: (sort: SnippetSortBy) => void;

  /* UI設定ハンドラ */
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (categoryId: string | null) => void;
  setShowSearchBar: (show: boolean) => void;
  setGridColumns: (columns: 1 | 2 | 3) => void;
  setShowProfileDropdown: (show: boolean) => void;

  /* ハンドラ */
  handleCopySnippet: (snippet: Snippet) => Promise<void>;
  handleDeleteSnippet: (id: string) => Promise<void>;
  handleSelectProfile: (profileId: string) => Promise<void>;
  handleToggleSnippet: (snippetId: string) => void;
  handleToggleMobileMenu: () => void;
  handleCloseMobileMenu: () => void;
  getCategoryColor: (categoryId: string | null) => string | null;
  getCategoryName: (categoryId: string | null) => string;
}

/**
 * ホーム画面のビジネスロジックフック
 *
 * @returns 画面に必要な全ての状態とハンドラ
 */
export function useHomeScreen(): UseHomeScreenReturn {
  const { t, language } = useTranslation();
  const { isLoaded, setLoaded } = useDatabase();
  const { allSnippets, snippetProfiles, copySnippet, deleteSnippet, refresh: refreshSnippets, sortBy, setSortBy } = useSnippets();
  const { categories, getById: getCategoryById } = useCategories();
  const { profiles, profileVariables, activeProfile, defaultProfile, setActiveProfile } = useProfiles();
  const { variables } = useVariables();
  const { gridColumns, setGridColumns } = useTheme();
  const { user } = useAuth();

  /* ======================================== */
  /* 分離されたフック */
  /* ======================================== */

  /* スニペットモーダル */
  const snippetModal = useSnippetModal({ 
    snippetProfiles,
    onSnippetsChange: refreshSnippets,
  });

  /* エクスポート画面 */
  const exportScreen = useExportScreen();

  /* インポート画面 */
  const importScreen = useImportScreen({ user, setLoaded });

  /* ======================================== */
  /* UI状態 */
  /* ======================================== */
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedSnippetId, setExpandedSnippetId] = useState<string | null>(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);

  /* モバイルメニュー */
  const { isOpen: isMobileMenuOpen, toggle: toggleMobileMenu, close: closeMobileMenu } = useMobileMenu();

  /* モーダル表示時に背景スクロールを無効化 */
  const isModalOpen = exportScreen.showExportModal ||
    snippetModal.isCreating ||
    !!snippetModal.editingSnippet ||
    isMobileMenuOpen ||
    importScreen.showFileModal ||
    importScreen.showSelectionModal ||
    importScreen.showModeSelectModal;
  useBodyScrollLock(isModalOpen);

  /* ======================================== */
  /* 派生状態 */
  /* ======================================== */

  /* プロファイル情報 */
  const activeProfileId = activeProfile?.id || null;
  const defaultProfileId = defaultProfile?.id || null;

  /** 有効なプロファイルのみ抽出 */
  const validProfiles = useMemo(() => profiles.filter((p) => p.valid), [profiles]);

  /* 共通フィルタリングフックを使用 */
  const { filteredSnippets } = useFilteredSnippets({
    snippets: allSnippets,
    snippetProfiles,
    searchQuery: searchQuery === '' ? '' : debouncedSearchQuery,
    selectedCategory,
    activeProfileId,
    defaultProfileId,
    variables,
    profileVariables,
    locale: language,
  });

  /* ======================================== */
  /* ハンドラ */
  /* ======================================== */

  /** スニペットをクリップボードにコピー */
  const handleCopySnippet = useCallback(async (snippet: Snippet) => {
    try {
      await copySnippet(snippet.id, activeProfile?.id);
      setCopiedId(snippet.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [copySnippet, activeProfile?.id]);

  /** スニペットを削除（確認ダイアログ付き） */
  const handleDeleteSnippet = useCallback(async (id: string) => {
    const { showConfirm } = await import('@utils/alerts');
    showConfirm('snippet.delete_confirm', async () => {
      try {
        await deleteSnippet(id);
      } catch (err) {
        console.error('Failed to delete:', err);
      }
    });
  }, [deleteSnippet]);

  /** プロファイル選択 */
  const handleSelectProfile = useCallback(async (profileId: string) => {
    if (profileId !== activeProfile?.id) {
      await setActiveProfile(profileId);
    }
    setShowProfileDropdown(false);
  }, [activeProfile?.id, setActiveProfile]);

  /** カテゴリIDから色を取得 */
  const getCategoryColor = useCallback((categoryId: string | null): string | null => {
    if (!categoryId) return null;
    const category = getCategoryById(categoryId);
    return category?.color || null;
  }, [getCategoryById]);

  /** カテゴリIDから名前を取得 */
  const getCategoryName = useCallback((categoryId: string | null): string => {
    if (!categoryId) return t('category.uncategorized');
    const category = getCategoryById(categoryId);
    return category?.name || t('category.uncategorized');
  }, [getCategoryById, t]);

  /** アコーディオンの開閉をトグル */
  const handleToggleSnippet = useCallback((snippetId: string) => {
    setExpandedSnippetId((prev) => (prev === snippetId ? null : snippetId));
  }, []);

  /* ======================================== */
  /* 戻り値 */
  /* ======================================== */
  return {
    /* ローディング状態 */
    isLoaded,

    /* UI状態 */
    searchQuery,
    selectedCategory,
    copiedId,
    expandedSnippetId,
    showProfileDropdown,
    showSearchBar,
    gridColumns,

    /* モバイルメニュー */
    isMobileMenuOpen,

    /* 分離されたフック */
    snippetModal,
    exportScreen,
    importScreen,

    /* モーダル表示状態 */
    isModalOpen,

    /* ソート */
    currentSort: sortBy,
    handleSortChange: setSortBy,

    /* データ */
    filteredSnippets,
    categories,
    profiles,
    validProfiles,
    variables,
    profileVariables,
    activeProfile: activeProfile || null,
    activeProfileId,
    defaultProfileId,

    /* UI設定ハンドラ */
    setSearchQuery,
    setSelectedCategory,
    setShowSearchBar,
    setGridColumns,
    setShowProfileDropdown,

    /* ハンドラ */
    handleCopySnippet,
    handleDeleteSnippet,
    handleSelectProfile,
    handleToggleSnippet,
    handleToggleMobileMenu: toggleMobileMenu,
    handleCloseMobileMenu: closeMobileMenu,
    getCategoryColor,
    getCategoryName,
  };
}
