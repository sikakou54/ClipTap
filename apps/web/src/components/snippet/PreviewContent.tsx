/**
 * プレビューコンテンツコンポーネント
 *
 * @description
 * 変数展開後のプレビュー内容を表示
 */
import { useTranslation } from '@cliptap/shared';

interface PreviewContentProps {
  loading: boolean;
  resolvedTitle: string;
  resolvedContent: string;
  copyWithTitle: boolean;
}

export function PreviewContent({ loading, resolvedTitle, resolvedContent, copyWithTitle }: PreviewContentProps) {
  const { t } = useTranslation();

  /* プレビューコンテンツ（変数展開後のタイトルと本文、ローディング状態対応） */
  return (
    <div className="bg-white dark:bg-[#101010] border border-gray-200 dark:border-[#2A2A2A] rounded-xl p-4 space-y-3">
      {/* ローディング中の場合はスピナーを表示 */}
      {loading ? (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 dark:border-blue-400 border-t-transparent" />
        </div>
      ) : (
        <>
          {/* タイトル（copyWithTitleがtrueでタイトルが存在する場合のみ表示） */}
          {copyWithTitle && resolvedTitle && (
            <p className="text-sm font-semibold text-gray-900 dark:text-white whitespace-pre-wrap break-words">
              {resolvedTitle}
            </p>
          )}
          {/* 本文（変数展開後のコンテンツ、空の場合は空状態メッセージ） */}
          <pre className="text-sm text-gray-700 dark:text-[#A0A0A0] whitespace-pre-wrap break-words leading-relaxed">
            {resolvedContent || t('common.preview_empty')}
          </pre>
        </>
      )}
    </div>
  );
}

