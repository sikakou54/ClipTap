/**
 * 編集ボタンコンポーネント
 *
 * @description
 * スニペットを編集するボタン。
 * モバイル版と同じく、枠線は既定の境界色、アイコンは本文色で表示する。
 */
import { useTranslation } from '@cliptap/shared';
import { CardRoundButton } from './CardRoundButton';

interface EditButtonProps {
  onClick: () => void;
}

export function EditButton({ onClick }: EditButtonProps) {
  const { t } = useTranslation();

  /* 編集ボタン（鉛筆アイコン） */
  return (
    <CardRoundButton
      onClick={onClick}
      label={t('common.edit')}
      colorClassName="border-gray-200 text-gray-900 dark:border-[#2A2A2A] dark:text-white"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    </CardRoundButton>
  );
}
