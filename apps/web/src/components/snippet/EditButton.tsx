/**
 * 編集ボタンコンポーネント
 *
 * @description
 * スニペットを編集するボタン
 */
import { useTranslation } from '@cliptap/shared';

interface EditButtonProps {
  onClick: () => void;
}

export function EditButton({ onClick }: EditButtonProps) {
  const { t } = useTranslation();

  /* 編集ボタン（鉛筆アイコン） */
  return (
    <button
      onClick={onClick}
      className="p-2 text-gray-500 dark:text-[#A0A0A0] hover:bg-gray-100 dark:hover:bg-[#2A2A2A] hover:text-gray-700 dark:hover:text-white rounded-lg transition-colors"
      title={t('common.edit')}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    </button>
  );
}

