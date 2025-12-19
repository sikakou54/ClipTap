/**
 * システム変数アイテムコンポーネント
 *
 * @description
 * システム提供の変数（DATE、TIME等）を表示する読み取り専用アイテム。
 * カスタム変数とは異なり、編集・削除はできない。
 */
import { useTranslation } from '@cliptap/shared';
import type { SystemVariable } from '@hooks/screens/useVariablesScreen';

interface SystemVariableItemProps {
  variable: SystemVariable;
  isLast: boolean;
}

export function SystemVariableItem({ variable, isLast }: SystemVariableItemProps) {
  const { t } = useTranslation();

  /* システム変数アイテム（アイコン、変数コード、説明、読み取り専用） */
  return (
    <div
      className={`flex items-center gap-4 p-4 ${!isLast ? 'border-b border-gray-200 dark:border-[#2A2A2A]' : ''}`}
    >
      {/* システム変数アイコン */}
      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      <div className="flex-1">
        {/* 変数コード（{{変数名}}） */}
        <p className="font-medium text-gray-900 dark:text-white">{'{{'}{variable.name}{'}}'}</p>
        {/* 変数説明 */}
        <p className="text-sm text-gray-500 dark:text-[#707070]">{t(`variables.${variable.name}`)}</p>
      </div>
    </div>
  );
}

