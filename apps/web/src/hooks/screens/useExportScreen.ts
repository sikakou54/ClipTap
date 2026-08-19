/**
 * エクスポート画面のビジネスロジックフック
 *
 * @description
 * データエクスポート処理の状態管理とロジックを提供。
 * Dashboard画面から分離された専用フック。
 *
 * @see pages/Dashboard.tsx - 使用元
 */

import { useState, useCallback } from 'react';
import { Logger, translateError } from '@cliptap/shared';
import { showErrorAlert } from '@utils/alerts';

export interface UseExportScreenReturn {
  /* 状態 */
  /** エクスポートモーダル表示中か */
  showExportModal: boolean;
  /** エクスポート処理中か */
  isExporting: boolean;

  /* ハンドラ */
  /** エクスポートモーダルを開く */
  openExportModal: () => void;
  /** エクスポートモーダルを閉じる */
  closeExportModal: () => void;
  /** 選択されたデータをエクスポート */
  handleExportSelected: (
    password: string,
    snippetIds: string[],
    profileIds: string[],
    variableIds: string[],
    categoryIds: string[]
  ) => Promise<void>;
}

/**
 * エクスポート画面のビジネスロジックフック
 */
export function useExportScreen(): UseExportScreenReturn {
  /* ======================================== */
  /* 状態管理 */
  /* ======================================== */
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  /* ======================================== */
  /* ハンドラ */
  /* ======================================== */

  /** エクスポートモーダルを開く */
  const openExportModal = useCallback(() => {
    setShowExportModal(true);
  }, []);

  /** エクスポートモーダルを閉じる */
  const closeExportModal = useCallback(() => {
    setShowExportModal(false);
  }, []);

  /** 選択されたデータをエクスポート */
  const handleExportSelected = useCallback(
    async (
      password: string,
      snippetIds: string[],
      profileIds: string[],
      variableIds: string[],
      categoryIds: string[]
    ) => {
      setIsExporting(true);
      try {
        const { ExportService } = await import('@cliptap/shared');
        await ExportService.exportSelectedData(password, {
          snippetIds,
          profileIds,
          variableIds,
          categoryIds,
        });
        setShowExportModal(false);
      } catch (err) {
        Logger.error('Failed to export:', err);
        const translatedMessage = translateError(err);
        showErrorAlert(translatedMessage);
      } finally {
        setIsExporting(false);
      }
    },
    []
  );

  return {
    /* 状態 */
    showExportModal,
    isExporting,

    /* ハンドラ */
    openExportModal,
    closeExportModal,
    handleExportSelected,
  };
}

