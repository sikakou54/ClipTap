/**
 * 展開ボタンコンポーネント
 *
 * @description
 * 定型文カードの本文を展開・折りたたみするボタン。
 * モバイル版と同じく、カード左下に丸ボタンとして配置する。
 */
import { useTranslation } from '@cliptap/shared';
import { CardRoundButton } from './CardRoundButton';

interface ExpandButtonProps {
  isExpanded: boolean;
  onClick: () => void;
}

export function ExpandButton({ isExpanded, onClick }: ExpandButtonProps) {
  const { t } = useTranslation();

  /* 展開ボタン（展開中は上矢印、折りたたみ中は下矢印） */
  return (
    <CardRoundButton
      onClick={onClick}
      label={isExpanded ? t('common.collapse') : t('common.expand')}
      colorClassName="border-gray-200 text-gray-500 dark:border-[#2A2A2A] dark:text-[#A0A0A0]"
    >
      <svg
        className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </CardRoundButton>
  );
}
