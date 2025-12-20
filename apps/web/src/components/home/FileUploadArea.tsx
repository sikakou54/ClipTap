/**
 * ファイルアップロードエリア
 *
 * @description
 * .cliptapファイルのドラッグ&ドロップまたはクリック選択に対応。
 * 状態に応じて3つの表示を切り替える：
 * - 未選択（グレー背景、アップロードアイコン）
 * - ドラッグ中（青背景）
 * - 選択済み（緑背景、チェックマーク、ファイル名表示）
 */
import { useDropzone } from 'react-dropzone';
import { useTranslation } from '@cliptap/shared';

interface FileUploadAreaProps {
  selectedFile: File | null;
  onFileSelect: (files: File[]) => void;
}

export function FileUploadArea({ selectedFile, onFileSelect }: FileUploadAreaProps) {
  const { t } = useTranslation();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onFileSelect,
    accept: {
      'application/octet-stream': ['.cliptap'],
    },
    multiple: false,
  });

  /* ファイルアップロードエリア（ドラッグ&ドロップ対応、状態に応じてスタイル変更） */
  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
        isDragActive
          ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30'
          : selectedFile
            ? 'border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-900/30'
            : 'border-gray-300 dark:border-[#2A2A2A] hover:border-gray-400 dark:hover:border-[#333333] hover:bg-gray-50 dark:hover:bg-[#2A2A2A]/50'
      }`}
    >
      {/* ファイル選択用の非表示input */}
      <input {...getInputProps()} />

      {/* ファイル選択済み状態（チェックマークとファイル名） */}
      {selectedFile ? (
        <>
          {/* チェックマークアイコン */}
          <svg
            className="mx-auto h-12 w-12 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {/* 選択されたファイル名 */}
          <p className="mt-4 text-sm font-medium text-green-700 dark:text-green-400">{selectedFile.name}</p>
          {/* 再選択のヒント */}
          <p className="mt-1 text-xs text-gray-500 dark:text-[#707070]">{t('settings.web_specific.select_file_click')}</p>
        </>
      ) : (
        <>
          {/* アップロードアイコン（未選択時） */}
          <svg
            className="mx-auto h-12 w-12 text-gray-400 dark:text-[#707070]"
            stroke="currentColor"
            fill="none"
            strokeWidth={2}
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {/* ドラッグ&ドロップまたはクリック選択のメッセージ */}
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
            {isDragActive ? t('settings.web_specific.drop_file') : t('settings.web_specific.drag_drop_file')}
          </p>
          {/* クリック選択のヒント */}
          <p className="mt-1 text-xs text-gray-500 dark:text-[#707070]">{t('settings.web_specific.select_file_click')}</p>
        </>
      )}
    </div>
  );
}

