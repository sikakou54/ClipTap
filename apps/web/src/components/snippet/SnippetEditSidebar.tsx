/**
 * スニペット編集サイドバーコンポーネント
 *
 * @description
 * スニペット編集モーダルの右カラム（変数バッジ・プレビュー）
 */
import type { Variable, Profile, ProfileVariable } from '@cliptap/shared';
import { VariableBadges } from './VariableBadges';
import { SnippetPreview } from './SnippetPreview';

interface SnippetEditSidebarProps {
  title: string;
  content: string;
  copyWithTitle: boolean;
  selectedProfileIds: string[];
  profiles: Profile[];
  variables: Variable[];
  profileVariables: ProfileVariable[];
  onInsertVariable: (variableName: string) => void;
}

export function SnippetEditSidebar({
  title,
  content,
  copyWithTitle,
  selectedProfileIds,
  profiles,
  variables,
  profileVariables,
  onInsertVariable,
}: SnippetEditSidebarProps) {
  /* スニペット編集サイドバー（変数バッジとプレビュー） */
  return (
    <div className="w-full md:w-1/2 overflow-visible md:overflow-y-auto p-6 space-y-6 bg-gray-50 dark:bg-[#202020]">
      {/* 変数バッジ（システム変数・カスタム変数の挿入ボタン） */}
      <VariableBadges variables={variables} onInsertVariable={onInsertVariable} />

      {/* セパレーター */}
      <div className="h-px bg-gray-200 dark:bg-[#2A2A2A]" />

      {/* プレビューセクション */}
      <div>
        <SnippetPreview
          title={title}
          content={content}
          copyWithTitle={copyWithTitle}
          selectedProfileIds={selectedProfileIds}
          profiles={profiles}
          variables={variables}
          profileVariables={profileVariables}
        />
      </div>
    </div>
  );
}

