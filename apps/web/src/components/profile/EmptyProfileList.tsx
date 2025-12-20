/**
 * 空のプロファイルリストコンポーネント
 *
 * @description
 * プロファイルが存在しない場合の表示
 */
import { useTranslation } from '@cliptap/shared';

interface EmptyProfileListProps {
  onCreate: () => void;
}

export function EmptyProfileList({ onCreate }: EmptyProfileListProps) {
  const { t } = useTranslation();

  /* 空状態UI（プロファイルが0件の場合に表示） */
  return (
    <div className="text-center text-gray-500 dark:text-[#A0A0A0] mt-12">
      {/* 空状態メッセージ */}
      <p>{t('profile.no_profiles')}</p>
      {/* 新規作成ボタン */}
      <button
        onClick={onCreate}
        className="mt-4 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
      >
        + {t('profile.create')}
      </button>
    </div>
  );
}

