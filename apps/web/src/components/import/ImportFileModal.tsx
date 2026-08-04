import { useState, useCallback, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { useDropzone } from 'react-dropzone';
import { useTranslation } from '@cliptap/shared';
import { ImportParserService as ImportParserServiceClass } from '@cliptap/shared';

const importParserService = new ImportParserServiceClass();

/**
 * インポートファイル選択モーダルのProps型定義
 */
interface ImportFileModalProps {
  /** モーダルの表示/非表示状態 */
  isOpen: boolean;
  /** モーダルを閉じる時のコールバック */
  onClose: () => void;
  /** ファイルとパスワードが選択された時のコールバック */
  onFileSelected: (file: File, password: string) => Promise<void>;
  /** ローディング状態（親コンポーネントで管理） */
  isLoading: boolean;
}

/**
 * インポートファイル選択モーダルコンポーネント
 *
 * .cliptapファイルのドラッグ&ドロップまたは選択と、
 * 復号化用パスワードの入力を行う
 */
export function ImportFileModal({ isOpen, onClose, onFileSelected, isLoading }: ImportFileModalProps) {
  const { t } = useTranslation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  /**
   * モーダル表示時に前回の入力内容をクリア
   */
  useEffect(() => {
    if (isOpen) {
      setSelectedFile(null);
      setPassword('');
      setError('');
    }
  }, [isOpen]);

  /**
   * ファイル選択時の.cliptap形式検証
   */
  const handleFileSelect = useCallback((files: File[]) => {
    const file = files[0];
    if (!file) return;

    if (!importParserService.isClipTapFile(file.name)) {
      setError(t('backup.select_cliptap_file'));
      return;
    }

    setSelectedFile(file);
    setError('');
  }, [t]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileSelect,
    accept: {
      'application/octet-stream': ['.cliptap'],
    },
    multiple: false,
  });

  /**
   * 選択されたファイルとパスワードを親コンポーネントに渡す
   */
  const handleSubmit = async () => {
    if (!selectedFile || !password.trim()) return;

    try {
      await onFileSelected(selectedFile, password);
    } catch {
      /* エラーハンドリングは親で実施 */
    }
  };

  /**
   * ローディング中は閉じられないように制御
   */
  const handleClose = () => {
    if (isLoading) return;
    setSelectedFile(null);
    setPassword('');
    setError('');
    onClose();
  };

  /* インポートファイル選択モーダル（.cliptapファイル選択とパスワード入力） */
  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      {/* オーバーレイ（背景暗転） */}
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      {/* モーダルコンテナ */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md bg-white dark:bg-[#1A1A1A] rounded-2xl shadow-xl p-6">
          {/* モーダルタイトル */}
          <Dialog.Title className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            {t('export_import.import')}
          </Dialog.Title>

          {/* ファイルドロップゾーン（ドラッグ&ドロップ対応） */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all mb-4 ${
              isDragActive
                ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30'
                : selectedFile
                  ? 'border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-900/30'
                  : 'border-gray-300 dark:border-[#2A2A2A] hover:border-gray-400 dark:hover:border-[#333333]'
            }`}
          >
            {/* ファイル選択用の非表示input */}
            <input {...getInputProps()} />
            {/* ファイル選択済み状態（ファイル名表示） */}
            {selectedFile ? (
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-400">{selectedFile.name}</p>
                <p className="text-xs text-gray-500 mt-1">{t('settings.web_specific.select_file_click')}</p>
              </div>
            ) : (
              /* ファイル未選択状態（ドラッグ&ドロップメッセージ） */
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {isDragActive ? t('settings.web_specific.drop_file') : t('settings.web_specific.drag_drop_file')}
                </p>
              </div>
            )}
          </div>

          {/* パスワード入力フィールド */}
          <div className="mb-6">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-[#2A2A2A] rounded-lg focus:outline-none bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-white"
              placeholder={t('export_import.password_placeholder')}
            />
          </div>

          {/* エラーメッセージ（エラーがある場合のみ表示） */}
          {error && (
            <p className="text-sm text-red-500 mb-4">{error}</p>
          )}

          {/* ボタン行（キャンセル・次へ） */}
          <div className="flex gap-3 justify-end">
            {/* キャンセルボタン */}
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-[#333] rounded-lg hover:bg-gray-200 dark:hover:bg-[#444]"
            >
              {t('common.cancel')}
            </button>
            {/* 次へボタン（ファイルとパスワードが入力されている場合のみ有効） */}
            <button
              onClick={handleSubmit}
              disabled={!selectedFile || !password.trim() || isLoading}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg ${
                !selectedFile || !password.trim() || isLoading
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isLoading ? t('settings.web_specific.loading') : t('common.next')}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
