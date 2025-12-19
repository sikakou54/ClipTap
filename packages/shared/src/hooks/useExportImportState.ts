/**
 * エクスポート/インポート状態管理フック
 *
 * @description
 * Mobile/Webで共通のエクスポート/インポートUI状態を管理。
 * プラットフォーム固有のロジックは呼び出し側で実装する。
 *
 * @module useExportImportState
 */

import { useState, useCallback } from 'react';
import type { ImportCandidates } from '../types/export';

/**
 * インポートモード
 */
export type ImportMode = 'restore' | 'merge';

/**
 * エクスポート/インポートの現在のステップ
 */
export type ExportImportStep =
  | 'idle'              // 初期状態
  | 'file_select'       // ファイル選択中
  | 'password_input'    // パスワード入力中
  | 'mode_select'       // インポートモード選択中
  | 'item_select'       // インポート項目選択中
  | 'processing'        // 処理中
  | 'complete';         // 完了

/**
 * フックの戻り値の型
 */
export interface UseExportImportStateResult {
  /* State */
  /** 現在のステップ */
  step: ExportImportStep;
  /** インポート候補データ */
  importCandidates: ImportCandidates;
  /** 選択されたインポートモード */
  importMode: ImportMode | null;
  /** 処理中フラグ */
  isProcessing: boolean;
  /** ローディング中フラグ（ファイル解析など） */
  isLoading: boolean;
  /** エラーメッセージ */
  error: string | null;

  /* Actions */
  /** ファイル選択ステップへ遷移 */
  goToFileSelect: () => void;
  /** パスワード入力ステップへ遷移 */
  goToPasswordInput: () => void;
  /** モード選択ステップへ遷移（候補データを設定） */
  goToModeSelect: (candidates: ImportCandidates) => void;
  /** 項目選択ステップへ遷移 */
  goToItemSelect: () => void;
  /** 処理中状態へ遷移 */
  startProcessing: () => void;
  /** 完了状態へ遷移 */
  complete: () => void;
  /** 初期状態にリセット */
  reset: () => void;
  /** インポートモードを設定 */
  setImportMode: (mode: ImportMode) => void;
  /** 処理中フラグを設定 */
  setIsProcessing: (value: boolean) => void;
  /** ローディングフラグを設定 */
  setIsLoading: (value: boolean) => void;
  /** エラーを設定 */
  setError: (error: string | null) => void;
}

/**
 * 空のインポート候補
 */
const EMPTY_CANDIDATES: ImportCandidates = {
  snippets: [],
  profiles: [],
  variables: [],
  categories: [],
};

/**
 * エクスポート/インポート状態管理フック
 *
 * @returns {UseExportImportStateResult} 状態とアクション
 */
export function useExportImportState(): UseExportImportStateResult {
  const [step, setStep] = useState<ExportImportStep>('idle');
  const [importCandidates, setImportCandidates] = useState<ImportCandidates>(EMPTY_CANDIDATES);
  const [importMode, setImportMode] = useState<ImportMode | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const goToFileSelect = useCallback(() => {
    setStep('file_select');
    setError(null);
  }, []);

  const goToPasswordInput = useCallback(() => {
    setStep('password_input');
    setError(null);
  }, []);

  /**
   * モード選択ステップへ遷移
   * @param candidates - インポート候補データ
   */
  const goToModeSelect = useCallback((candidates: ImportCandidates) => {
    setImportCandidates(candidates);
    setStep('mode_select');
    setError(null);
  }, []);

  const goToItemSelect = useCallback(() => {
    setStep('item_select');
    setError(null);
  }, []);

  const startProcessing = useCallback(() => {
    setStep('processing');
    setIsProcessing(true);
    setError(null);
  }, []);

  const complete = useCallback(() => {
    setStep('complete');
    setIsProcessing(false);
  }, []);

  /**
   * 全状態を初期値にリセット（モーダルを閉じる時など）
   */
  const reset = useCallback(() => {
    setStep('idle');
    setImportCandidates(EMPTY_CANDIDATES);
    setImportMode(null);
    setIsProcessing(false);
    setIsLoading(false);
    setError(null);
  }, []);

  return {
    step,
    importCandidates,
    importMode,
    isProcessing,
    isLoading,
    error,
    goToFileSelect,
    goToPasswordInput,
    goToModeSelect,
    goToItemSelect,
    startProcessing,
    complete,
    reset,
    setImportMode,
    setIsProcessing,
    setIsLoading,
    setError,
  };
}
