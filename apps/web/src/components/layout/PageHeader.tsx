/**
 * ページヘッダーコンポーネント
 *
 * @description
 * ページレイアウトの固定ヘッダー部分。
 * デスクトップでは左側にサイドメニュー分のスペースを確保。
 * モバイルではハンバーガーメニューボタンを表示。
 */
import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  icon?: string;
  rightAction?: ReactNode;
  onToggleMobileMenu: () => void;
}

export function PageHeader({ title, icon, rightAction, onToggleMobileMenu }: PageHeaderProps) {
  /* ページヘッダー（固定表示、モバイルではハンバーガーメニューボタン付き） */
  return (
    <header className="bg-white dark:bg-[#1A1A1A] shadow-sm fixed top-0 left-0 md:left-72 right-0 z-10 transition-all duration-300">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* ハンバーガーメニューボタン（モバイル表示時のみ） */}
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2A2A2A] rounded-lg mr-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* ページアイコン（オプション） */}
          {icon && (
            <svg className="w-5 h-5 text-gray-600 dark:text-[#A0A0A0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
            </svg>
          )}
          {/* ページタイトル */}
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h1>
        </div>

        {/* 右側アクション（新規作成ボタン等、オプション） */}
        {rightAction && (
          <div className="flex items-center gap-4">
            {rightAction}
          </div>
        )}
      </div>
    </header>
  );
}

