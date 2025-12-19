/**
 * EmptyCategoryList - カテゴリ空状態UI
 *
 * @description
 * カテゴリが0件の場合に表示される空状態コンポーネント。
 * 新規作成を促すメッセージと作成ボタンを表示。
 */
import { useTranslation } from '@cliptap/shared';

interface EmptyCategoryListProps {
  onCreate: () => void;
}

export function EmptyCategoryList({ onCreate }: EmptyCategoryListProps) {
  const { t } = useTranslation();

  /* 空状態UI（カテゴリが0件の場合に表示） */
  return (
    <div className="text-center text-gray-500 dark:text-[#A0A0A0] mt-12">
      {/* 空状態メッセージ */}
      <p>{t('category.no_categories')}</p>
      {/* 新規作成ボタン（オプション） */}
      {onCreate && (
        <button
          onClick={onCreate}
          className="mt-4 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
        >
          + {t('category.create')}
        </button>
      )}
    </div>
  );
}

