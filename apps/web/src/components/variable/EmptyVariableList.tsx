/**
 * 空の変数リストコンポーネント
 *
 * @description
 * カスタム変数が未登録の場合の空状態表示。
 * 変数追加ボタンを含む。
 */
import { useTranslation } from '@cliptap/shared';

interface EmptyVariableListProps {
  onAdd: () => void;
}

export function EmptyVariableList({ onAdd }: EmptyVariableListProps) {
  const { t } = useTranslation();

  /* 空状態UI（カスタム変数が0件の場合に表示） */
  return (
    <div className="bg-white dark:bg-[#1A1A1A] rounded-xl shadow-sm border border-gray-200 dark:border-[#2A2A2A] p-6 text-center text-gray-500 dark:text-[#A0A0A0]">
      {/* 空状態メッセージ */}
      <p>{t('settings.no_variables')}</p>
      {/* 変数追加ボタン */}
      <button
        onClick={onAdd}
        className="mt-4 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
      >
        + {t('settings.variable_add')}
      </button>
    </div>
  );
}

