/**
 * サイドメニューヘッダーコンポーネント
 *
 * @description
 * アプリ名、サブスクリプションプラン（Pro/Free）、ユーザー情報を表示
 */
import type { SharedUser } from '@cliptap/shared';

interface SideMenuHeaderProps {
  isSubscribed: boolean;
  user: SharedUser | null;
  onClose: () => void;
}

export function SideMenuHeader({ isSubscribed, user, onClose }: SideMenuHeaderProps) {
  /* サイドメニューヘッダー（アプリ名、プラン表示、ユーザー情報、閉じるボタン） */
  return (
    <div className="p-4 border-b border-gray-200 dark:border-[#2A2A2A] flex justify-between items-center">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          {/* アプリ名 */}
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">ClipTap Web</h2>
          {/* プランバッジ（Pro/Free） */}
          {isSubscribed ? (
            <span className="px-2 py-0.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs font-bold rounded-full">
              Pro
            </span>
          ) : (
            <span className="px-2 py-0.5 bg-gray-200 dark:bg-[#2A2A2A] text-gray-600 dark:text-[#A0A0A0] text-xs font-medium rounded-full">
              Free
            </span>
          )}
        </div>
        {/* ユーザーEmail（ログイン済みの場合のみ表示） */}
        {user && (
          <span className="text-xs text-gray-500 dark:text-[#707070] truncate max-w-[200px]">
            {user.email}
          </span>
        )}
      </div>

      {/* 閉じるボタン（モバイル表示時のみ表示） */}
      <button
        onClick={onClose}
        className="md:hidden p-1 text-gray-500 dark:text-[#A0A0A0]"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

