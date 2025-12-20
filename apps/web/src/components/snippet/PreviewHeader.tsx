/**
 * プレビューヘッダーコンポーネント
 *
 * @description
 * プレビューセクションのヘッダー（ラベル + コピーボタン）
 */
import { useTranslation } from '@cliptap/shared';

interface PreviewHeaderProps {
  loading: boolean;
  copied: boolean;
  canCopy: boolean;
  onCopy: () => void;
}

export function PreviewHeader({ loading, copied, canCopy, onCopy }: PreviewHeaderProps) {
  const { t } = useTranslation();

  /* プレビューヘッダー（ラベルとコピーボタン） */
  return (
    <div className="flex items-center justify-between">
      {/* プレビューラベル */}
      <span className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
        {t('common.preview')}
      </span>
      {/* コピーボタン（ローディング中またはコピー不可時は無効化、コピー完了時は緑色に変化） */}
      <button
        type="button"
        onClick={onCopy}
        disabled={loading || !canCopy}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          loading || !canCopy
            ? 'bg-gray-200 dark:bg-[#2A2A2A] text-gray-500 dark:text-[#707070] cursor-not-allowed'
            : copied
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50'
        }`}
      >
        {copied ? t('snippet.copied') : t('common.copy')}
      </button>
    </div>
  );
}

