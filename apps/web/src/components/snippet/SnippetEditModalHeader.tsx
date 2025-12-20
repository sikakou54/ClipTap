/**
 * スニペット編集モーダルヘッダーコンポーネント
 *
 * @description
 * スニペット編集モーダルのヘッダー部分
 */
import { useTranslation } from '@cliptap/shared';

interface SnippetEditModalHeaderProps {
  mode: 'create' | 'edit';
  onClose: () => void;
}

export function SnippetEditModalHeader({ mode, onClose }: SnippetEditModalHeaderProps) {
  const { t } = useTranslation();

  /* スニペット編集モーダルヘッダー（タイトルと閉じるボタン） */
  return (
    <div className="px-6 py-4 border-b border-gray-200 dark:border-[#2A2A2A] flex items-center justify-between">
      {/* タイトル（作成/編集モードに応じて切り替え） */}
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
        {mode === 'create' ? t('snippet.create') : t('snippet.edit')}
      </h2>
      {/* 閉じるボタン */}
      <button
        onClick={onClose}
        className="p-2 text-gray-400 dark:text-[#707070] hover:text-gray-600 dark:hover:text-[#A0A0A0] hover:bg-gray-100 dark:hover:bg-[#2A2A2A] rounded-lg transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

