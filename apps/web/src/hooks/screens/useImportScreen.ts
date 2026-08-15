/**
 * インポート画面のビジネスロジックフック
 *
 * @description
 * データインポート処理の状態管理とロジックを提供。
 * useWebImportをラップし、Dashboard画面向けの統一インターフェースを提供。
 *
 * @see pages/Dashboard.tsx - 使用元
 * @see hooks/useWebImport.ts - 実装詳細
 */

import { useCallback } from 'react';
import {
  Logger,
  translateError,
  useSnippets,
  useProfiles,
  useVariables,
  useCategories,
} from '@cliptap/shared';
import { useWebImport, type UseWebImportResult } from '@hooks/useWebImport';
import { showErrorAlert, showConfirm } from '@utils/alerts';

export interface UseImportScreenParams {
  /** 現在のユーザー */
  user: { uid: string } | null;
  /** ローディング状態更新関数 */
  setLoaded: (loaded: boolean) => void;
}

export interface UseImportScreenReturn {
  /* 状態 */
  /** ファイル選択モーダル表示中か */
  showFileModal: boolean;
  /** モード選択モーダル表示中か */
  showModeSelectModal: boolean;
  /** 項目選択モーダル表示中か */
  showSelectionModal: boolean;
  /** インポート候補データ */
  importCandidates: UseWebImportResult['importCandidates'];
  /** 処理中か */
  isProcessing: boolean;
  /** ローディング中か */
  isLoading: boolean;

  /* ハンドラ */
  /** ファイル選択モーダルを開く */
  openFileModal: () => void;
  /** ファイル選択モーダルを閉じる */
  closeFileModal: () => void;
  /** モード選択モーダルを閉じる */
  closeModeSelectModal: () => void;
  /** 項目選択モーダルを閉じる */
  closeSelectionModal: () => void;
  /** ファイル選択時のハンドラ */
  handleFileSelected: UseWebImportResult['handleFileSelected'];
  /** 全データ復元を実行 */
  handleRestoreBackup: () => Promise<void>;
  /** マージモードを選択 */
  handleSelectMergeMode: () => void;
  /** 部分インポートを実行 */
  handleExecuteImport: UseWebImportResult['handleExecutePartialImport'];
}

/**
 * インポート画面のビジネスロジックフック
 */
export function useImportScreen({
  user,
  setLoaded,
}: UseImportScreenParams): UseImportScreenReturn {
  /* Provider refresh関数を取得 */
  const { refresh: refreshSnippets } = useSnippets();
  const { refresh: refreshProfiles } = useProfiles();
  const { refresh: refreshVariables } = useVariables();
  const { refresh: refreshCategories } = useCategories();

  /* エラーハンドラ */
  const handleError = useCallback((error: Error) => {
    Logger.error('Import error:', error);
    const translatedMessage = translateError(error);
    showErrorAlert(translatedMessage);
  }, []);

  /* インポート完了時にすべてのProviderをリフレッシュ */
  const handleImportComplete = useCallback(() => {
    refreshSnippets();
    refreshProfiles();
    refreshVariables();
    refreshCategories();
  }, [refreshSnippets, refreshProfiles, refreshVariables, refreshCategories]);

  /* 内部のWebインポートフック */
  const webImport = useWebImport({
    user,
    setLoaded,
    onError: handleError,
    onImportComplete: handleImportComplete,
  });

  /* ファイル選択モーダルを開く */
  const openFileModal = useCallback(() => {
    webImport.setShowFileSelect(true);
  }, [webImport]);

  /* ファイル選択モーダルを閉じる */
  const closeFileModal = useCallback(() => {
    webImport.setShowFileSelect(false);
  }, [webImport]);

  /* 復元前の確認ダイアログ */
  const handleRestoreBackup = useCallback(async () => {
    showConfirm('backup.restore_confirm', () => {
      void webImport.handleRestoreBackup();
    });
  }, [webImport]);

  return {
    /* 状態 */
    showFileModal: webImport.showFileSelect,
    showModeSelectModal: webImport.showModeSelect,
    showSelectionModal: webImport.showItemSelect,
    importCandidates: webImport.importCandidates,
    isProcessing: webImport.isProcessing,
    isLoading: webImport.isLoading,

    /* ハンドラ */
    openFileModal,
    closeFileModal,
    /* 一時DBの破棄と取込処理中のガードはuseWebImport側へ集約している */
    closeModeSelectModal: webImport.closeModeSelect,
    closeSelectionModal: webImport.closeItemSelect,
    handleFileSelected: webImport.handleFileSelected,
    handleRestoreBackup,
    handleSelectMergeMode: webImport.handleSelectMergeMode,
    handleExecuteImport: webImport.handleExecutePartialImport,
  };
}

