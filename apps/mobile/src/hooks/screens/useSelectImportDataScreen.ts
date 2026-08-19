/**
 * インポートデータ選択画面カスタムフック
 *
 * バックアップファイルからインポートするデータを選択する画面のビジネスロジックを管理。
 * UI層からデータ読み込み・選択管理・インポート処理を分離する。
 *
 * 主な責務:
 * - インポート候補データの読み込み
 * - 選択状態の管理（タブ別）
 * - 重複チェック
 * - インポート実行
 * - 一時データベースのクリーンアップ
 *
 * @see app/settings/select-import-data.tsx - インポートデータ選択画面UI
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from '@cliptap/shared';
import { showAlert, showConfirm, showErrorAlert, showWarningAlert } from '@utils/alerts';
import { translateError } from '@cliptap/shared';
import {
  useCategories,
  useProfiles,
  useVariables,
  useSnippets,
  TempDbPathRequiredError,
  useImportSelection,
  ImportService,
  type ImportTabType,
  type ImportCandidates,
} from '@cliptap/shared';

/* ======================================== */
/* 型定義 */
/* ======================================== */

/** useSelectImportDataScreen フックの返却値 */
export interface UseSelectImportDataScreenReturn {
  /* 状態 */
  /** インポート候補データ */
  candidates: ImportCandidates;
  /** 初期読み込み中フラグ */
  isLoading: boolean;
  /** 処理中フラグ */
  isProcessing: boolean;
  /** 現在アクティブなタブ */
  activeTab: ImportTabType;
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
  /** プロファイルが無効か（重複） */
  isProfileDisabled: (name: string) => boolean;
  /** 変数が重複か */
  isVariableDuplicate: (name: string) => boolean;
  /** カテゴリが無効か（重複） */
  isCategoryDisabled: (name: string) => boolean;
  /** 全選択されているか */
  isAllSelected: (tab?: ImportTabType) => boolean;

  /* ハンドラ */
  /** タブ切り替え */
  setActiveTab: (tab: ImportTabType) => void;
  /** 選択切り替え */
  toggleSelection: (id: string, type: ImportTabType) => void;
  /** 全選択切り替え */
  toggleSelectAll: (tab?: ImportTabType) => void;
  /** 定型文の展開/折りたたみ */
  toggleSnippetExpand: (id: string) => void;
  /** 変数の展開/折りたたみ */
  toggleVariableExpand: (id: string) => void;
  /** インポート実行 */
  handleImport: () => void;
}

/* ======================================== */
/* 型定義: フックパラメータ */
/* ======================================== */

/** useSelectImportDataScreen フックのパラメータ */
interface UseSelectImportDataScreenParams {
  /** 一時データベースのパス */
  tempDbPath: string;
}

/* ======================================== */
/* フック実装 */
/* ======================================== */

export function useSelectImportDataScreen(
  params: UseSelectImportDataScreenParams
): UseSelectImportDataScreenReturn {
  /* ======================================== */
  /* Hooks & コンテキスト */
  /* ======================================== */
  const { t } = useTranslation();
  const router = useRouter();
  const { tempDbPath } = params;

  /* ======================================== */
  /* データ取得（カスタムHooks） */
  /* ======================================== */
  const { profiles, refresh: refreshProfiles } = useProfiles();
  const { variables, refresh: refreshVariables } = useVariables();
  const { categories: existingCategories, loading: loadingCategories, refresh: refreshCategories } = useCategories();
  const { refresh: refreshSnippets } = useSnippets();

  /* ======================================== */
  /* 状態管理 */
  /* ======================================== */
  const [candidates, setCandidates] = useState<ImportCandidates>({ snippets: [], profiles: [], variables: [], categories: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  /* ======================================== */
  /* 重複チェック用データ準備 */
  /* ======================================== */

  /**
   * 名前を正規化（空白トリム）
   * @param value - 正規化する文字列
   * @returns 正規化された文字列（nullやundefinedは空文字に変換）
   */
  const normalizeName = (value?: string | null) => (value ?? '').trim();

  /**
   * 既存プロファイル名のSet（重複チェック用）
   */
  const existingProfileNames = useMemo(() => new Set(
    profiles.map(profile => normalizeName(profile.name))
  ), [profiles]);

  /**
   * 既存カスタム変数名のSet（重複チェック用）
   */
  const existingVariableNames = useMemo(() => new Set(
    variables.filter(v => v.type === 'custom').map(variable => normalizeName(variable.name))
  ), [variables]);

  /**
   * 既存カテゴリ名のSet（重複チェック用）
   */
  const existingCategoryNames = useMemo(() => new Set(
    existingCategories.map(category => normalizeName(category.name))
  ), [existingCategories]);

  /* ======================================== */
  /* 選択状態管理（カスタムHook） */
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
    isProfileDisabled,
    isVariableDuplicate,
    isCategoryDisabled,
    toggleSelection,
    toggleSelectAll,
    isAllSelected,
    totalSelected,
    toggleExpandSnippet,
    toggleExpandVariable,
  } = useImportSelection({
    candidates,
    existingProfileNames,
    existingVariableNames,
    existingCategoryNames,
    isOpen: isInitialized,
  });

  /* ======================================== */
  /* 初期データ読み込み */
  /* ======================================== */

  /**
   * インポート候補データの初期読み込み
   * 一時DBから読み込み、全アイテムを初期選択状態に設定
   *
   * @remarks
   * 依存配列の t は本文で使っていないが、言語を切り替えると一時DBへの再クエリが走る。
   * 選択状態は useSelection が isOpen の立ち上がり1回だけ初期化する作りなので巻き戻らない。
   * 不要な再実行に見えるものの、外すと再実行条件が変わるため現行の挙動をそのまま維持している。
   */
  useEffect(() => {
    const loadCandidates = async () => {
      if (loadingCategories) return;

      try {
        if (!tempDbPath) {
          throw new TempDbPathRequiredError();
        }

        const result = await ImportService.getImportCandidates(tempDbPath);
        setCandidates(result);
        setIsInitialized(true);
      } catch (error) {
        showErrorAlert(translateError(error));
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    void loadCandidates();
  }, [tempDbPath, loadingCategories, t, router]);

  /* ======================================== */
  /* クリーンアップ処理 */
  /* ======================================== */

  /**
   * アンマウント時の一時DBクリーンアップ
   * インポート完了時もキャンセル時も確実にクリーンアップ
   */
  useEffect(() => {
    return () => {
      if (tempDbPath) {
        ImportService.cleanupTempDatabase(tempDbPath);
      }
    };
  }, [tempDbPath]);

  /* ======================================== */
  /* イベントハンドラ */
  /* ======================================== */

  /**
   * インポート実行ハンドラ
   * 選択データをバリデーション後、本番DBにインポート
   */
  const handleImport = useCallback(() => {
    if (totalSelected === 0) {
      showWarningAlert(t('backup.no_selection'));
      return;
    }

    if (!tempDbPath) {
      showErrorAlert(t('error.generic'));
      return;
    }

    showConfirm(
      'backup.import_confirm',
      async () => {
        try {
          setIsProcessing(true);

          await ImportService.importPartial(
            tempDbPath,
            Array.from(selectedSnippetIds),
            Array.from(selectedProfileIds),
            Array.from(selectedVariableIds),
            Array.from(selectedCategoryIds)
          );

          /* インポート後にProvider refresh */
          refreshSnippets();
          refreshProfiles();
          refreshVariables();
          refreshCategories();

          showAlert(
            '',
            t('backup.import_completed'),
            undefined,
            () => {
              router.dismissTo('/');
            }
          );
        } catch (error) {
          showErrorAlert(translateError(error));
        } finally {
          setIsProcessing(false);
        }
      }
    );
  }, [totalSelected, tempDbPath, selectedSnippetIds, selectedProfileIds, selectedVariableIds, selectedCategoryIds, refreshSnippets, refreshProfiles, refreshVariables, refreshCategories, t, router]);

  /* ======================================== */
  /* 戻り値 */
  /* ======================================== */

  return {
    /* 状態 */
    candidates,
    isLoading: isLoading || loadingCategories,
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
    isProfileDisabled,
    isVariableDuplicate,
    isCategoryDisabled,
    isAllSelected,

    /* ハンドラ */
    setActiveTab,
    toggleSelection,
    toggleSelectAll,
    toggleSnippetExpand: toggleExpandSnippet,
    toggleVariableExpand: toggleExpandVariable,
    handleImport,
  };
}
