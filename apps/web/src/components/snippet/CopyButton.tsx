/**
 * コピーボタンコンポーネント
 *
 * @description
 * スニペットをクリップボードにコピーするボタン。
 * モバイル版と同じく、未コピー時はプライマリ色、コピー完了時は成功色で縁取る。
 */
import { useTranslation } from '@cliptap/shared';
import { CardRoundButton } from './CardRoundButton';

interface CopyButtonProps {
  isCopied: boolean;
  onClick: () => void;
}

export function CopyButton({ isCopied, onClick }: CopyButtonProps) {
  const { t } = useTranslation();

  /* コピーボタン（コピー完了時はチェックマーク、未コピー時はコピーアイコン） */
  return (
    <CardRoundButton
      onClick={onClick}
      label={t('common.copy')}
      colorClassName={
        isCopied
          ? 'border-emerald-500 text-emerald-500 dark:border-emerald-400 dark:text-emerald-400'
          : 'border-blue-500 text-blue-500 dark:border-blue-400 dark:text-blue-400'
      }
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
    </CardRoundButton>
  );
}
