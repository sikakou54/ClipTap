/**
 * エクスポートデータ選択画面カスタムフック
 *
 * エクスポートするデータを選択する画面のビジネスロジックを管理。
 * UI層からデータ読み込み・選択管理・エクスポート処理を分離する。
 *
 * 主な責務:
 * - 現在のDBからエクスポート候補データの読み込み
 * - 選択状態の管理（タブ別）- useSelectionを使用
 * - パスワードダイアログ表示
 * - エクスポート実行
 *
 * @see app/settings/select-export-data.tsx - エクスポートデータ選択画面UI
 */

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from '@cliptap/shared';
import { showErrorAlert, showWarningAlert } from '@utils/alerts';
import { translateError } from '@cliptap/shared';
import {
  useCategories,
  useProfiles,
  useVariables,
  useSnippets,
  useSelection,
  ExportService,
  type SelectionTabType,
  type SelectionCandidates,
  type Snippet,
} from '@cliptap/shared';

/* ======================================== */
/* 型定義 */
/* ======================================== */

/** useSelectExportDataScreen フックの返却値 */
export interface UseSelectExportDataScreenReturn {
  /* 状態 */
  /** エクスポート候補データ */
  candidates: SelectionCandidates;
  /** 初期読み込み中フラグ */
  isLoading: boolean;
  /** 処理中フラグ */
  isProcessing: boolean;
  /** 現在アクティブなタブ */
  activeTab: SelectionTabType;
  /** 展開中の定型文ID */
  expandedSnippetIds: Set<string>;
  /** 展開中の変数ID */
  expandedVariableIds: Set<string>;

  /* 選択状態 */
  /** 選択された定型文ID */
  selectedSnippetIds: Set<string>;
  /** 選択されたプロファイルID */
  selectedProfileIds: Set<string>;
  /** 選択された変数ID */
  selectedVariableIds: Set<string>;
  /** 選択されたカテゴリID */
  selectedCategoryIds: Set<string>;
  /** 選択された総件数（タブ横断） */
  totalSelected: number;

  /* チェック関数 */
  /** 全選択されているか */
  isAllSelected: (tab?: SelectionTabType) => boolean;

  /* パスワードモーダル */
  /** パスワードモーダル表示状態 */
  showPasswordModal: boolean;
  /** パスワード入力値 */
  password: string;
  /** パスワード更新 */
  setPassword: (password: string) => void;

  /* ハンドラ */
  /** タブ切り替え */
  setActiveTab: (tab: SelectionTabType) => void;
  /** 選択切り替え */
  toggleSelection: (id: string, type: SelectionTabType) => void;
  /** 全選択切り替え */
  toggleSelectAll: (tab?: SelectionTabType) => void;
  /** 定型文の展開/折りたたみ */
  toggleSnippetExpand: (id: string) => void;
  /** 変数の展開/折りたたみ */
  toggleVariableExpand: (id: string) => void;
  /** エクスポートボタン押下（パスワードモーダル表示） */
  handleExportPress: () => void;
  /** パスワード送信（エクスポート実行） */
  handlePasswordSubmit: () => Promise<void>;
  /** パスワードモーダルを閉じる */
  closePasswordModal: () => void;
}

/* ======================================== */
/* フック実装 */
/* ======================================== */

export function useSelectExportDataScreen(): UseSelectExportDataScreenReturn {
  /* ======================================== */
  /* Hooks & コンテキスト */
  /* ======================================== */
  const { t } = useTranslation();
  const router = useRouter();

  /* ======================================== */
  /* データ取得（カスタムHooks） */
  /* ======================================== */
  const { profiles, profileVariables, loading: loadingProfiles } = useProfiles();
  const { variables, loading: loadingVariables } = useVariables();
  const { categories, loading: loadingCategories } = useCategories();
  const { allSnippets, snippetProfiles, loading: loadingSnippets } = useSnippets();
  /* エクスポート用：全スニペット（プロファイルフィルタなし） */
  const snippets = allSnippets;

  /* ======================================== */
  /* 状態管理 */
  /* ======================================== */
  const [isProcessing, setIsProcessing] = useState(false);

  /* パスワードモーダル */
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');

  /* ローディング状態 */
  const isLoading = loadingSnippets || loadingProfiles || loadingVariables || loadingCategories;
  const isOpen = !isLoading;

  /* ======================================== */
  /* 候補データの変換 */
  /* ======================================== */

  /** カテゴリIDからカテゴリを取得 */
  const getCategory = useCallback((categoryId: string | null) => {
    if (!categoryId) return null;
    return categories.find(c => c.id === categoryId) ?? null;
  }, [categories]);

  /** プロファイルIDからプロファイル名を取得 */
  const getProfileName = useCallback((profileId: string): string | null => {
    const profile = profiles.find(p => p.id === profileId);
    return profile?.name ?? null;
  }, [profiles]);

  /** エクスポート候補データ */
  const candidates = useMemo<SelectionCandidates>(() => {
    /* スニペット候補 */
      const snippetCandidates = snippets.map((s: Snippet) => {
      /* このスニペットに紐付くプロファイルを取得 */
      const snippetProfileIds = snippetProfiles
        .filter((sp: { snippetId: string; profileId: string }) => sp.snippetId === s.id)
        .map((sp: { snippetId: string; profileId: string }) => sp.profileId);
      const snippetProfilesData = snippetProfileIds.map((profileId: string) => ({
        profileId,
        profileName: getProfileName(profileId),
      }));

      /* カテゴリ情報を取得 */
      const category = getCategory(s.categoryId);

      return {
        id: s.id,
        title: s.title,
        content: s.content,
        categoryId: s.categoryId,
        categoryName: category?.name ?? null,
        categoryColor: category?.color ?? null,
        profiles: snippetProfilesData,
      };
    });

    /* プロファイル候補 */
    const profileCandidates = profiles.map(p => ({
      id: p.id,
      name: p.name,
    }));

    /* 変数候補（カスタム変数のみ） */
    const customVariables = variables.filter(v => v.type === 'custom');
    const variableCandidates = customVariables.map(v => {
      /* この変数に関連するプロファイル値を取得 */
      const variableProfileValues = profileVariables
        .filter((pv: { variableId: string; profileId: string; value: string }) => pv.variableId === v.id)
        .map((pv: { variableId: string; profileId: string; value: string }) => ({
          profileId: pv.profileId,
          profileName: getProfileName(pv.profileId),
          value: pv.value,
        }));

      return {
        id: v.id,
        name: v.name,
        label: v.label,
        icon: v.icon,
        profileValues: variableProfileValues,
      };
    });

    /* カテゴリ候補 */
    const categoryCandidates = categories.map(c => ({
      id: c.id,
      name: c.name,
      color: c.color,
    }));

    return {
      snippets: snippetCandidates,
      profiles: profileCandidates,
      variables: variableCandidates,
      categories: categoryCandidates,
    };
  }, [snippets, snippetProfiles, profiles, variables, categories, profileVariables, getCategory, getProfileName]);

  /* ======================================== */
  /* 選択状態管理（shared useSelection） */
  /* ======================================== */
  const {
    selectedSnippetIds,
    selectedProfileIds,
    selectedVariableIds,
    selectedCategoryIds,
    activeTab,
    setActiveTab,
    expandedSnippetIds,
    expandedVariableIds,
    toggleSelection,
    toggleSelectAll,
    isAllSelected,
    totalSelected,
    toggleExpandSnippet,
    toggleExpandVariable,
  } = useSelection({
    candidates,
    isOpen,
    enableDuplicateCheck: false, /* エクスポートは自分のDBが出所で、既存名と突き合わせる相手がいないため重複チェックは不要 */
  });

  /* ======================================== */
  /* エクスポート処理 */
  /* ======================================== */

  /** エクスポートボタン押下ハンドラ（パスワードモーダル表示） */
  const handleExportPress = useCallback(() => {
    /* 選択されていない場合はエラー */
    if (totalSelected === 0) {
      showWarningAlert(t('error.no_selection'));
      return;
    }

    /* パスワードをクリアしてモーダルを表示 */
    setPassword('');
    setShowPasswordModal(true);
  }, [totalSelected, t]);

  /** パスワード送信ハンドラ（エクスポート実行） */
  const handlePasswordSubmit = useCallback(async () => {
    /* パスワードが空の場合はエラー */
    if (!password.trim()) {
      showWarningAlert(t('error.password_required'));
      return;
    }

    /* モーダルを閉じる */
    setShowPasswordModal(false);

    try {
      /* 処理開始 */
      setIsProcessing(true);

      /* 部分エクスポート実行 */
      await ExportService.exportSelectedData(
        password,
        {
          snippetIds: Array.from(selectedSnippetIds),
          profileIds: Array.from(selectedProfileIds),
          variableIds: Array.from(selectedVariableIds),
          categoryIds: Array.from(selectedCategoryIds)
        }
      );

      /* 前画面に戻る */
      router.back();
    } catch (error) {
      showErrorAlert(translateError(error));
    } finally {
      setIsProcessing(false);
      setPassword('');
    }
  }, [password, selectedSnippetIds, selectedProfileIds, selectedVariableIds, selectedCategoryIds, t, router]);

  /** パスワードモーダルを閉じる */
  const closePasswordModal = useCallback(() => {
    setShowPasswordModal(false);
    setPassword('');
  }, []);

  /* ======================================== */
  /* 戻り値 */
  /* ======================================== */

  return {
    /* 状態 */
    candidates,
    isLoading,
    isProcessing,
    activeTab,
    expandedSnippetIds,
    expandedVariableIds,

    /* 選択状態 */
    selectedSnippetIds,
    selectedProfileIds,
    selectedVariableIds,
    selectedCategoryIds,
    totalSelected,

    /* チェック関数 */
    isAllSelected,

    /* パスワードモーダル */
    showPasswordModal,
    password,
    setPassword,

    /* ハンドラ */
    setActiveTab,
    toggleSelection,
    toggleSelectAll,
    toggleSnippetExpand: toggleExpandSnippet,
    toggleVariableExpand: toggleExpandVariable,
    handleExportPress,
    handlePasswordSubmit,
    closePasswordModal,
  };
}
