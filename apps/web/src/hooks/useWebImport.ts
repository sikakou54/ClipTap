/**
 * Web用インポートフック
 *
 * @description
 * Dashboard.tsxやPageLayout.tsxで使用するインポート処理の状態管理フック。
 * useExportImportCoreの代わりに、より軽量でWeb専用の実装を提供。
 *
 * @module useWebImport
 */

import { useState, useCallback, useRef } from 'react';
import type { ImportCandidates } from '@cliptap/shared';
import { ImportService, hasMainDbAdapter, getFileIOAdapter, toOpfsPath } from '@cliptap/shared';
import { SQLiteWasm } from '@src/mappers/sqliteWasm';
import { webDbCacheManager } from '@adapters/WebDbCacheManager';
import type { WebFileIOAdapter } from '@adapters/WebFileIOAdapter';

/**
 * フックのオプション
 */
export interface UseWebImportOptions {
  /** 現在のユーザー */
  user: { uid: string } | null;
  /** ローディング状態更新関数（インポート後のキャッシュ保存完了時に呼ぶ） */
  setLoaded: (loaded: boolean) => void;
  /** エラーハンドラー */
  onError?: (error: Error) => void;
  /** インポート完了時のコールバック（Provider refresh用） */
  onImportComplete?: () => void;
}

/**
 * フックの戻り値
 */
export interface UseWebImportResult {
  /* 状態 */
  /** インポート候補データ */
  importCandidates: ImportCandidates;
  /** 処理中フラグ */
  isProcessing: boolean;
  /** ローディング中フラグ */
  isLoading: boolean;
  /** ファイル選択モーダル表示 */
  showFileSelect: boolean;
  /** インポートモード選択モーダル表示 */
  showModeSelect: boolean;
  /** 項目選択モーダル表示 */
  showItemSelect: boolean;

  /* Actions */
  /** ファイル選択モーダルを表示 */
  setShowFileSelect: (show: boolean) => void;
  /** インポートモード選択モーダルを表示 */
  setShowModeSelect: (show: boolean) => void;
  /** 項目選択モーダルを表示 */
  setShowItemSelect: (show: boolean) => void;
  /** ファイルを解析 */
  handleFileSelected: (fileData: unknown, password: string) => Promise<void>;
  /** 全データ復元を実行 */
  handleRestoreBackup: () => Promise<void>;
  /** マージモードに移行 */
  handleSelectMergeMode: () => void;
  /** 部分インポートを実行 */
  handleExecutePartialImport: (
    snippetIds: string[],
    profileIds: string[],
    variableIds: string[],
    categoryIds: string[]
  ) => Promise<void>;
}

/* 空のインポート候補（初期値として使用） */
const EMPTY_CANDIDATES: ImportCandidates = {
  snippets: [],
  profiles: [],
  variables: [],
  categories: [],
};

/**
 * Web用インポートフック
 */
export function useWebImport(options: UseWebImportOptions): UseWebImportResult {
  const { onError, onImportComplete } = options;

  /* 状態 */
  const [importCandidates, setImportCandidates] = useState<ImportCandidates>(EMPTY_CANDIDATES);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showFileSelect, setShowFileSelect] = useState(false);
  const [showModeSelect, setShowModeSelect] = useState(false);
  const [showItemSelect, setShowItemSelect] = useState(false);

  /* 一時DBパス（キー）をrefで保持 */
  const tempDbPathRef = useRef<string | null>(null);

  /**
   * インポート後の共通後処理
   */
  const postImportProcess = useCallback(async () => {
    /* 現在のSQLiteデータベースをキャッシュに即座に保存（ゲストモードでも保存） */
    await webDbCacheManager.flush();
  }, []);

  /**
   * ファイルを解析してインポート候補を取得
   */
  const handleFileSelected = useCallback(async (fileData: unknown, password: string) => {
    setIsLoading(true);
    /* FileオブジェクトをOPFSに一時保存してから処理 */
    const file = fileData as File;
    const tempImportPath = toOpfsPath(`temp_import_${Date.now()}.json`);
    const fileIO = getFileIOAdapter() as WebFileIOAdapter;

    try {
      /* ファイル内容を読み込んでOPFSに保存 */
      const fileContent = await file.text();
      await fileIO.writeFile(tempImportPath, fileContent);

      /* SQLiteWasmを初期化 */
      await SQLiteWasm.init();

      /* shared層のImportServiceを使ってファイル解析・一時DB作成 */
      const tempDbPath = await ImportService.prepareImportDatabase(password, tempImportPath);
      tempDbPathRef.current = tempDbPath;

      /* インポート候補を取得 */
      const candidates = await ImportService.getImportCandidates(tempDbPath);
      setImportCandidates(candidates);

      /* ファイル選択モーダルを閉じる */
      setShowFileSelect(false);
      /* インポートモード選択モーダルを開く */
      setShowModeSelect(true);
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error(String(error)));
    } finally {
      /* 一時ファイルを削除 */
      try {
        await fileIO.deleteFile(tempImportPath);
      } catch {
        /* 削除失敗は無視 */
      }
      setIsLoading(false);
    }
  }, [onError]);

  /**
   * 全データ復元を実行
   */
  const handleRestoreBackup = useCallback(async () => {
    const tempDbPath = tempDbPathRef.current;
    if (!tempDbPath) return;

    setIsProcessing(true);
    try {
      /* ImportServiceを使用して既存データを削除してからインポート */
      await ImportService.importDatabaseFromTempDb(tempDbPath);
      /* 注意: サブスクリプション状態の更新とupdateValidFlagsはImportService内で実行される */

      /* 後処理 */
      await postImportProcess();

      /* Provider refresh */
      onImportComplete?.();

      /* 状態リセット */
      setImportCandidates(EMPTY_CANDIDATES);
      tempDbPathRef.current = null;
      setShowModeSelect(false);
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsProcessing(false);
    }
  }, [onError, onImportComplete, postImportProcess]);

  /**
   * マージモードに移行
   */
  const handleSelectMergeMode = useCallback(() => {
    setShowModeSelect(false);
    setShowItemSelect(true);
  }, []);

  /**
   * 部分インポートを実行
   */
  const handleExecutePartialImport = useCallback(async (
    snippetIds: string[],
    profileIds: string[],
    variableIds: string[],
    categoryIds: string[]
  ) => {
    const tempDbPath = tempDbPathRef.current;
    if (!tempDbPath) return;

    setIsProcessing(true);
    try {
      /* メインDBが初期化されていない場合は空のDBを作成 */
      if (!hasMainDbAdapter()) {
        /* この時点でmainDbAdapterが登録されていない場合はエラー */
        throw new Error('MainDbAdapter is not initialized');
      }

      /* shared層のImportServiceを使って部分インポートを実行 */
      await ImportService.importPartial(
        tempDbPath,
        snippetIds,
        profileIds,
        variableIds,
        categoryIds
      );
      /* 注意: サブスクリプション状態の更新とupdateValidFlagsはImportService内で実行される */

      /* 後処理 */
      await postImportProcess();

      /* Provider refresh */
      onImportComplete?.();

      /* 状態リセット */
      setImportCandidates(EMPTY_CANDIDATES);
      tempDbPathRef.current = null;
      setShowItemSelect(false);
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsProcessing(false);
    }
  }, [onError, onImportComplete, postImportProcess]);

  return {
    /* 状態 */
    importCandidates,
    isProcessing,
    isLoading,
    showFileSelect,
    showModeSelect,
    showItemSelect,

    /* Actions */
    setShowFileSelect,
    setShowModeSelect,
    setShowItemSelect,
    handleFileSelected,
    handleRestoreBackup,
    handleSelectMergeMode,
    handleExecutePartialImport,
  };
}
