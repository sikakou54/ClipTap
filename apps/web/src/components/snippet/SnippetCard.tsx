/**
 * SnippetCard - スニペットカード
 *
 * @description
 * 個々のスニペットを表示するカードコンポーネント。
 * タイトル、本文、カテゴリ、コピー・編集・削除ボタンを含む。
 * 展開/折りたたみ機能あり（各カード内で独立して管理）。
 *
 * パフォーマンス最適化:
 * - React.memoによるメモ化
 * - カスタム比較関数で不要な再レンダリングを防止
 */
import React, { useState } from 'react';
import { useTranslation } from '@cliptap/shared';
import type { Snippet } from '@cliptap/shared';
import { SnippetActionButtons } from './SnippetActionButtons';

interface SnippetWithDisplay extends Snippet {
  displayTitle: string | null;
  displayContent: string;
}

interface SnippetCardProps {
  snippet: SnippetWithDisplay;
  isCopied: boolean;
  categoryColor: string | null;
  categoryName: string;
  onCopy: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function SnippetCardComponent({
  snippet,
  isCopied,
  categoryColor,
  categoryName,
  onCopy,
  onEdit,
  onDelete,
}: SnippetCardProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  /* スニペットカード（タイトル、本文、カテゴリ、アクションボタン、展開/折りたたみ機能） */
  return (
    <div
      className="bg-white dark:bg-[#1A1A1A] rounded-xl shadow-sm border border-gray-200 dark:border-[#2A2A2A] overflow-hidden hover:shadow-md transition-shadow"
      style={{
        borderLeftWidth: categoryColor ? '4px' : undefined,
        borderLeftColor: categoryColor || undefined,
      }}
    >
      <div className="p-4">
        {/* タイトル部分（クリックで展開/折りたたみ） */}
        <div className="flex items-start justify-between gap-2 mb-2">
          {/* タイトル（クリック可能） */}
          <button onClick={handleToggle} className="flex-1 text-left">
            {snippet.displayTitle ? (
              <h3 className="font-medium text-gray-900 dark:text-white line-clamp-1">{snippet.displayTitle}</h3>
            ) : (
              <h3 className="font-medium text-gray-400 dark:text-[#707070] text-sm line-clamp-1">{t('snippet.no_title')}</h3>
            )}
          </button>
          {/* 展開/折りたたみボタン（下矢印アイコン） */}
          <button
            onClick={handleToggle}
            className="p-1 text-gray-400 dark:text-[#707070] hover:text-gray-600 dark:hover:text-[#A0A0A0] transition-colors flex-shrink-0"
            title={isExpanded ? t('common.collapse') : t('common.expand')}
          >
            <svg
              className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* 本文部分（折りたたみ時は3行まで表示、クリックで展開/折りたたみ） */}
        <button onClick={handleToggle} className="w-full text-left">
          <div
            className={`text-gray-600 dark:text-[#A0A0A0] text-sm whitespace-pre-wrap overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? '' : 'line-clamp-3'}`}
            style={{ maxHeight: isExpanded ? '1000px' : '4.5rem' }}
          >
            {snippet.displayContent}
          </div>
        </button>

        {/* カテゴリバッジとアクションボタン */}
        <div className="mt-3 flex items-center justify-between">
          {/* カテゴリバッジ（カテゴリ色を背景に使用） */}
          <span
            className="text-xs px-2 py-1 rounded-full"
            style={{
              backgroundColor: categoryColor ? `${categoryColor}20` : '#F3F4F6',
              color: categoryColor || '#6B7280',
            }}
          >
            {categoryName}
          </span>
          {/* アクションボタン（コピー・編集・削除） */}
          <SnippetActionButtons isCopied={isCopied} onCopy={onCopy} onEdit={onEdit} onDelete={onDelete} />
        </div>
      </div>
    </div>
  );
}

/**
 * SnippetCard をメモ化して不要な再レンダリングを防ぐ
 * リスト表示のパフォーマンス最適化のため
 *
 * カスタム比較関数でsnippetの主要プロパティとその他のPropsを比較
 * すべて変更なしの場合のみ再レンダリングをスキップ
 */
export const SnippetCard = React.memo(SnippetCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.snippet.id === nextProps.snippet.id &&
    prevProps.snippet.updatedAt === nextProps.snippet.updatedAt &&
    prevProps.snippet.title === nextProps.snippet.title &&
    prevProps.snippet.content === nextProps.snippet.content &&
    prevProps.snippet.categoryId === nextProps.snippet.categoryId &&
    prevProps.snippet.displayTitle === nextProps.snippet.displayTitle &&
    prevProps.snippet.displayContent === nextProps.snippet.displayContent &&
    prevProps.isCopied === nextProps.isCopied &&
    prevProps.categoryColor === nextProps.categoryColor &&
    prevProps.categoryName === nextProps.categoryName
  );
});

export type { SnippetWithDisplay };
