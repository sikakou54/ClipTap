/**
 * カスタム変数アイテムコンポーネント
 *
 * @description
 * カスタム変数の表示・編集・削除を行う単一アイテム。
 * 変数名、ラベル、現在の値、有効/無効状態を表示する。
 */
import { useTranslation } from '@cliptap/shared';
import type { Variable } from '@cliptap/shared';
import { VariableIcon } from '@components/common/VariableIcon';

interface CustomVariableItemProps {
  variable: Variable;
  value: string;
  isLast: boolean;
  onEdit: (variableId: string) => void;
  onDelete: (variableId: string) => void;
}

export function CustomVariableItem({ variable, value, isLast, onEdit, onDelete }: CustomVariableItemProps) {
  const { t } = useTranslation();
  const isEnabled = variable.valid;

  /* カスタム変数アイテム（アイコン、名前・ラベル、変数コード、値、削除ボタン） */
  return (
    <div
      className={`flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#2A2A2A] transition-colors ${
        !isLast ? 'border-b border-gray-200 dark:border-[#2A2A2A]' : ''
      } ${!isEnabled ? 'opacity-50' : ''}`}
      onClick={() => onEdit(variable.id)}
    >
      {/* 変数アイコン */}
      <div className={`p-2 rounded-lg ${isEnabled ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-gray-100 dark:bg-[#2A2A2A]'}`}>
        <VariableIcon
          name={variable.icon}
          size={20}
          className={isEnabled ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-[#707070]'}
        />
      </div>

      {/* 変数情報（ラベル/名前、変数コード、値） */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {/* 変数ラベルまたは名前 */}
          <p className="font-medium text-gray-900 dark:text-white">{variable.label || variable.name}</p>
          {/* 無効化バッジ（無効化されている場合のみ表示） */}
          {!isEnabled && (
            <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs rounded-full font-medium">
              {t('settings.variable_disabled')}
            </span>
          )}
        </div>
        {/* 変数コード（{{変数名}}） */}
        <p className="text-sm text-gray-500 dark:text-[#A0A0A0] font-mono mt-1">
          {'{{'}{variable.name}{'}}'}
        </p>
        {/* 変数の値（未設定の場合は斜体表示） */}
        <p
          className={`text-sm truncate mt-1 ${
            value === t('common.not_set')
              ? 'text-gray-400 dark:text-[#707070] italic'
              : 'text-gray-500 dark:text-[#A0A0A0]'
          }`}
        >
          {value}
        </p>
      </div>

      {/* 削除ボタン（クリックイベントの伝播を停止） */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(variable.id);
        }}
        className="p-2 text-gray-500 dark:text-[#A0A0A0] hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      </button>
    </div>
  );
}

