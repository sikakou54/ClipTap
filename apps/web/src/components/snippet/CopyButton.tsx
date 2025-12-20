/**
 * コピーボタンコンポーネント
 *
 * @description
 * スニペットをクリップボードにコピーするボタン
 */
import { useTranslation } from '@cliptap/shared';

interface CopyButtonProps {
  isCopied: boolean;
  onClick: () => void;
}

export function CopyButton({ isCopied, onClick }: CopyButtonProps) {
  const { t } = useTranslation();

  /* コピーボタン（コピー完了時はチェックマーク、未コピー時はコピーアイコン） */
  return (
    <button
      onClick={onClick}
      className={`p-2 rounded-lg transition-colors ${
        isCopied
          ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
          : 'text-gray-500 dark:text-[#A0A0A0] hover:bg-gray-100 dark:hover:bg-[#2A2A2A] hover:text-gray-700 dark:hover:text-[#A0A0A0]'
      }`}
      title={t('common.copy')}
    >
      {/* コピー完了時はチェックマーク、未コピー時はコピーアイコン */}
      {isCopied ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
        </svg>
      )}
    </button>
  );
}

