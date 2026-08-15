/**
 * SnippetCard - スニペットカード
 *
 * @description
 * 個々のスニペットを表示するカードコンポーネント。
 * タイトル、カテゴリ、本文、展開・削除・編集・コピーボタンを含む。
 * 展開/折りたたみ機能あり（各カード内で独立して管理）。
 *
 * レイアウトはモバイル版の`SnippetCard`と揃えている:
 * - タイトル行そのものがタイトルのみコピーの操作領域で、右端にコピーアイコンを置く
 * - カテゴリバッジはタイトル直下に置く
 * - 本文は折りたたみ時2行で、クリックすると展開する
 * - カード下部は左に展開ボタン、右に削除・編集・コピーの丸ボタンを並べる
 *
 * パフォーマンス最適化:
 * - React.memoによるメモ化
 * - カスタム比較関数で不要な再レンダリングを防止
 */
import React, { useState } from 'react';
import { useTranslation } from '@cliptap/shared';
import type { SnippetWithDisplay } from '@cliptap/shared';
import { CATEGORY_FALLBACK_COLOR } from '@utils/categoryColor';
import { SnippetActionButtons } from './SnippetActionButtons';
import { ExpandButton } from './ExpandButton';

interface SnippetCardProps {
  snippet: SnippetWithDisplay;
  isCopied: boolean;
  isTitleCopied: boolean;
  /** カテゴリ色（未分類または削除済みカテゴリの場合はnull） */
  categoryColor: string | null;
  /** カテゴリ名（未分類または削除済みカテゴリの場合はnull） */
  categoryName: string | null;
  onCopy: () => void;
  onCopyTitle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function SnippetCardComponent({
  snippet,
  isCopied,
  isTitleCopied,
  categoryColor,
  categoryName,
  onCopy,
  onCopyTitle,
  onEdit,
  onDelete,
}: SnippetCardProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  /* タイトル未設定の定型文は（タイトルなし）を表示するだけでコピー対象がない */
  const canCopyTitle = Boolean(snippet.title);

  /* カテゴリ名はあるが色が未設定の場合があるため、バッジの色はフォールバックまで含めて確定させる */
  const badgeColor = categoryColor || CATEGORY_FALLBACK_COLOR;

  /* スニペットカード（タイトル、カテゴリ、本文、アクションボタン、展開/折りたたみ機能） */
  return (
    <div
      className="bg-white dark:bg-[#1A1A1A] rounded-xl shadow-sm border border-gray-200 dark:border-[#2A2A2A] overflow-hidden hover:shadow-md transition-shadow"
      style={{
        borderLeftWidth: categoryColor ? '4px' : undefined,
        borderLeftColor: categoryColor || undefined,
      }}
    >
      {/* メインコンテンツエリア（下側の余白は下部ボタン行が持つ） */}
      <div className="p-4 pb-0 flex flex-col gap-1.5">
        {/* タイトル（クリックでタイトルのみをコピー）
            Web版もモバイル版と同じくタイトル行そのものを操作領域にし、
            本文の展開/折りたたみは下部の展開ボタンと本文クリックに任せる。 */}
        <button
          onClick={onCopyTitle}
          disabled={!canCopyTitle}
          className="w-full flex items-center text-left"
          title={canCopyTitle ? t('snippet.copy_title') : undefined}
          aria-label={canCopyTitle ? t('snippet.copy_title') : undefined}
        >
          {snippet.displayTitle ? (
            <h3 className="flex-1 font-semibold text-gray-900 dark:text-white line-clamp-1">{snippet.displayTitle}</h3>
          ) : (
            <h3 className="flex-1 font-semibold text-gray-400 dark:text-[#707070] line-clamp-1">{t('snippet.no_title')}</h3>
          )}

          {/* コピーアイコン（クリックでコピーできることを示す。コピー完了時は2秒間チェックマーク） */}
          {canCopyTitle && (
            <span className={`ml-1 flex-shrink-0 ${isTitleCopied ? 'text-emerald-500 dark:text-emerald-400' : 'text-gray-500 dark:text-[#A0A0A0]'}`}>
              {isTitleCopied ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
              )}
            </span>
          )}
        </button>

        {/* カテゴリバッジ（未分類の場合はモバイル版と同じく表示しない） */}
        {categoryName && (
          <div className="mt-1">
            <span
              className="inline-block text-xs font-medium px-1.5 py-[3px] rounded-md"
              style={{
                backgroundColor: `${badgeColor}20`,
                color: badgeColor,
              }}
            >
              {categoryName}
            </span>
          </div>
        )}

        {/* 本文部分（折りたたみ時は2行まで表示、クリックで展開/折りたたみ） */}
        <button onClick={handleToggle} className="w-full text-left">
          <div
            className={`text-gray-600 dark:text-[#A0A0A0] text-sm whitespace-pre-wrap overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? '' : 'line-clamp-2 min-h-[60px]'}`}
            style={{ maxHeight: isExpanded ? '1000px' : '4.5rem' }}
          >
            {snippet.displayContent}
          </div>
        </button>
      </div>

      {/* 下部ボタン行（左: 展開、右: 削除・編集・コピー） */}
      <div className="flex items-center justify-between px-2 pt-3 pb-2">
        <ExpandButton isExpanded={isExpanded} onClick={handleToggle} />
        <SnippetActionButtons isCopied={isCopied} onCopy={onCopy} onEdit={onEdit} onDelete={onDelete} />
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
    prevProps.isTitleCopied === nextProps.isTitleCopied &&
    prevProps.categoryColor === nextProps.categoryColor &&
    prevProps.categoryName === nextProps.categoryName
  );
});
