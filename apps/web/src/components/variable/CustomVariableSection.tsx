/**
 * カスタム変数セクションコンポーネント
 *
 * @description
 * ユーザー定義のカスタム変数一覧を表示。
 * 変数が存在しない場合は空状態を表示する。
 */
import { useTranslation } from '@cliptap/shared';
import type { Variable } from '@cliptap/shared';
import { CustomVariableItem } from './CustomVariableItem';
import { EmptyVariableList } from './EmptyVariableList';

interface CustomVariableSectionProps {
  variables: Variable[];
  /** 変数の表示値。未設定の場合は null */
  getVariableValue: (variableId: string) => string | null;
  onEdit: (variableId: string) => void;
  onDelete: (variableId: string) => void;
  onAdd: () => void;
}

export function CustomVariableSection({
  variables,
  getVariableValue,
  onEdit,
  onDelete,
  onAdd,
}: CustomVariableSectionProps) {
  const { t } = useTranslation();

  /* カスタム変数セクション（タイトルと変数一覧） */
  return (
    <div>
      {/* セクションタイトル */}
      <h2 className="text-sm font-medium text-gray-500 dark:text-[#707070] mb-3">{t('snippet.custom_variables')}</h2>
      {/* 空状態（変数が0件の場合） */}
      {variables.length === 0 ? (
        <EmptyVariableList onAdd={onAdd} />
      ) : (
        /* 変数一覧コンテナ */
        <div className="bg-white dark:bg-[#1A1A1A] rounded-xl shadow-sm border border-gray-200 dark:border-[#2A2A2A] overflow-hidden">
          {variables.map((variable, index) => (
            <CustomVariableItem
              key={variable.id}
              variable={variable}
              value={getVariableValue(variable.id)}
              isLast={index === variables.length - 1}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

