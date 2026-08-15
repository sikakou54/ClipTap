/**
 * エクスポート・インポート画面カスタムフック
 *
 * データのバックアップと復元のビジネスロジックを管理するフック。
 * UI層からエクスポート・インポート処理を分離する。
 *
 * 主な責務:
 * - パスワードモーダルの状態管理
 * - エクスポート処理の実行
 * - インポート処理の実行（フルリストア/部分インポート）
 * - 一時データベースのクリーンアップ
 *
 * @see app/settings/export-import.tsx - エクスポート・インポート画面UI
 */

import { useState, useCallback, useRef } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import {
  useTranslation,
  InvalidFileTypeError,
  PasswordRequiredError,
  ImportService,
  translateError,
  useSnippets,
  useProfiles,
  useVariables,
  useCategories,
} from '@cliptap/shared';
import { showAlert, showConfirm, showErrorAlert } from '@utils/alerts';

/* ======================================== */
/* 型定義 */
/* ======================================== */

/** モーダルのモード */
export type ModalMode = 'export' | 'import';

/**
 * モバイル用の一時DBハンドル
 * フルリストアと部分インポートの両方に対応するために必要な情報を保持する
 */
interface TempDbHandle {
  /** 一時データベースファイルのパス（部分インポート用） */
  tempDbPath: string;
  /** 元のバックアップファイルのURI（フルリストア用） */
  originalFileUri: string;
  /** パスワード（フルリストア時の再検証用） */
  password: string;
}

/** useExportImportScreen フックの返却値 */
export interface UseExportImportScreenReturn {
  /* 状態 */
  /** パスワードモーダル表示状態 */
  showPasswordModal: boolean;
  /** モーダルモード */
  modalMode: ModalMode;
  /** パスワード入力値 */
  password: string;
  /** 処理中フラグ */
  isProcessing: boolean;
  /** インポートモード選択モーダル表示状態 */
  showImportModeModal: boolean;

  /* セッター */
  /** パスワード更新 */
  setPassword: (password: string) => void;

  /* ハンドラ */
  /** エクスポートボタン押下 */
  handleExportBackup: () => void;
  /** インポートボタン押下 */
  handleImportBackup: () => Promise<void>;
  /** パスワード送信 */
  handlePasswordSubmit: () => Promise<void>;
  /** パスワードモーダルを閉じる */
  closePasswordModal: () => void;
  /** インポートモード選択モーダルを閉じる */
  closeImportModeModal: () => void;
  /** フルリストア実行 */
  executeFullRestore: () => void;
  /** 部分インポート準備 */
  preparePartialImport: () => Promise<void>;
}

/* ======================================== */
/* フック実装 */
/* ======================================== */

export function useExportImportScreen(): UseExportImportScreenReturn {
  const { t } = useTranslation();
  const router = useRouter();

  /* Provider refresh関数を取得 */
  const { refresh: refreshSnippets } = useSnippets();
  const { refresh: refreshProfiles } = useProfiles();
  const { refresh: refreshVariables } = useVariables();
  const { refresh: refreshCategories } = useCategories();

  /* ======================================== */
  /* 状態管理 */
  /* ======================================== */
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('export');
  const [password, setPassword] = useState('');
  const [selectedBackupFileUri, setSelectedBackupFileUri] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showImportModeModal, setShowImportModeModal] = useState(false);
  const tempDbHandleRef = useRef<TempDbHandle | null>(null);

  /* ======================================== */
  /* イベントハンドラ */
  /* ======================================== */

  const handleExportBackup = useCallback(() => {
    router.push('/settings/select-export-data');
  }, [router]);

  /** ファイルピッカーでバックアップファイルを選択し、パスワード入力モーダルを表示 */
  const handleImportBackup = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const fileName = result.assets[0].name;
      if (!fileName.endsWith('.cliptap')) {
        throw new InvalidFileTypeError();
      }

      setSelectedBackupFileUri(result.assets[0].uri);
      setModalMode('import');
      setPassword('');
      setShowPasswordModal(true);
    } catch (error) {
      showErrorAlert(translateError(error));
    }
  }, []);

  /** パスワードモーダルのOKボタン押下（インポートモード: ファイル解析してモード選択へ） */
  const handlePasswordSubmit = useCallback(async () => {
    try {
      if (!password.trim()) {
        throw new PasswordRequiredError();
      }

      if (modalMode === 'export') {
        setShowPasswordModal(false);
        setPassword('');
      } else {
        if (!selectedBackupFileUri) return;

        setShowPasswordModal(false);
        setIsProcessing(true);

        try {
          const tempDbPath = await ImportService.prepareImportDatabase(password, selectedBackupFileUri);

          tempDbHandleRef.current = {
            tempDbPath,
            originalFileUri: selectedBackupFileUri,
            password,
          };

          setShowImportModeModal(true);
        } catch (error) {
          showErrorAlert(translateError(error));
        } finally {
          setIsProcessing(false);
        }
      }
    } catch (error) {
      showErrorAlert(translateError(error));
    }
  }, [password, modalMode, selectedBackupFileUri]);

  const executeFullRestore = useCallback(() => {
    const handle = tempDbHandleRef.current;
    if (!handle) return;

    showConfirm(
      'backup.restore_confirm',
      async () => {
        setIsProcessing(true);
        try {
          /* 既存の一時DBを使用してインポート */
          await ImportService.importDatabaseFromTempDb(handle.tempDbPath);

          /* インポート後にProvider refresh */
          refreshSnippets();
          refreshProfiles();
          refreshVariables();
          refreshCategories();

          /* キャッシュ内の選択ファイルを削除 */
          ImportService.cleanupImportSourceFile(handle.originalFileUri);

          showAlert(
            '',
            t('backup.import_success'),
            undefined,
            () => {
              /* 前の画面に戻る */
              router.back();
            }
          );

          setShowImportModeModal(false);
          /* 復元済みの一時DBはもう使わないため、キャッシュ領域に残さず削除する */
          ImportService.cleanupTempDatabase(handle.tempDbPath);
          tempDbHandleRef.current = null;
          setPassword('');
          setSelectedBackupFileUri(null);
        } catch (error) {
          showErrorAlert(translateError(error));
        } finally {
          setIsProcessing(false);
        }
      },
      () => {},
      'danger'
    );
  }, [router, t, refreshSnippets, refreshProfiles, refreshVariables, refreshCategories]);

  const preparePartialImport = useCallback(async () => {
    const handle = tempDbHandleRef.current;
    if (!handle) return;

    /* キャッシュ内の選択ファイルを削除（一時DBは部分インポート画面で使用するため保持） */
    ImportService.cleanupImportSourceFile(handle.originalFileUri);
    setSelectedBackupFileUri(null);

    setShowImportModeModal(false);

    router.push({
      pathname: '/settings/select-import-data',
      params: { tempDbPath: handle.tempDbPath }
    });
  }, [router]);

  const closePasswordModal = useCallback(() => {
    /* キャッシュ内の選択ファイルを削除 */
    if (selectedBackupFileUri) {
      ImportService.cleanupImportSourceFile(selectedBackupFileUri);
    }
    setShowPasswordModal(false);
    setPassword('');
    setSelectedBackupFileUri(null);
  }, [selectedBackupFileUri]);

  const closeImportModeModal = useCallback(() => {
    if (tempDbHandleRef.current) {
      ImportService.cleanupTempDatabase(tempDbHandleRef.current.tempDbPath);
      /* キャッシュ内の選択ファイルも削除 */
      ImportService.cleanupImportSourceFile(tempDbHandleRef.current.originalFileUri);
      tempDbHandleRef.current = null;
    }
    setShowImportModeModal(false);
    setPassword('');
    setSelectedBackupFileUri(null);
  }, []);

  return {
    showPasswordModal,
    modalMode,
    password,
    isProcessing,
    showImportModeModal,
    setPassword,
    handleExportBackup,
    handleImportBackup,
    handlePasswordSubmit,
    closePasswordModal,
    closeImportModeModal,
    executeFullRestore,
    preparePartialImport,
  };
}
