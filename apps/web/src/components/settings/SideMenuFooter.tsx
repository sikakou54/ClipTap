/**
 * サイドメニューフッターコンポーネント
 *
 * @description
 * テーマ切り替え、アカウント連携状態、DBバージョン表示を提供
 */
import { useTranslation, SCHEMA_VERSION } from '@cliptap/shared';
import type { SharedUser, ThemeMode } from '@cliptap/shared';

interface SideMenuFooterProps {
  isDark: boolean;
  themeMode: ThemeMode;
  user: SharedUser | null;
  onToggleTheme: () => void;
  onUnlinkAccount: () => void;
  onAccountLink?: () => void;
  onClose: () => void;
}

export function SideMenuFooter({
  isDark,
  themeMode,
  user,
  onToggleTheme,
  onUnlinkAccount,
  onAccountLink,
  onClose,
}: SideMenuFooterProps) {
  const { t } = useTranslation();

  /* サイドメニューフッター（テーマ切り替え、アカウント連携、DBバージョン） */
  return (
    <div className="p-4 border-t border-gray-200 dark:border-[#2A2A2A]">
      {/* テーマ切り替えボタン（ダーク/ライトモード） */}
      <button
        onClick={onToggleTheme}
        className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 dark:text-[#A0A0A0] hover:bg-gray-50 dark:hover:bg-[#2A2A2A] rounded-lg transition-colors mb-2"
      >
        {/* ダークモード時は月アイコン、ライトモード時は太陽アイコン */}
        {isDark ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        )}
        <span className="text-sm">
          {themeMode === 'auto'
            ? t('settings.theme_auto')
            : themeMode === 'dark'
              ? t('settings.theme_dark')
              : t('settings.theme_light')}
        </span>
      </button>

      {/* アカウント連携ボタン（ログイン済みの場合は連携解除、未ログインの場合は連携開始） */}
      {user ? (
        <button
          onClick={onUnlinkAccount}
          className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 dark:text-[#A0A0A0] hover:bg-gray-50 dark:hover:bg-[#2A2A2A] rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <div className="flex-1 flex items-center justify-between">
            <span className="text-sm">{t('auth.account_link')}</span>
            {/* 連携済みバッジ */}
            <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs font-medium rounded-full">
              {t('auth.account_linked')}
            </span>
          </div>
        </button>
      ) : (
        <button
          onClick={() => {
            onAccountLink?.();
            onClose();
          }}
          className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 dark:text-[#A0A0A0] hover:bg-gray-50 dark:hover:bg-[#2A2A2A] rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <div className="flex-1 flex items-center justify-between">
            <span className="text-sm">{t('auth.account_link')}</span>
            {/* 未連携バッジ */}
            <span className="px-2 py-0.5 bg-gray-100 dark:bg-[#2A2A2A] text-gray-500 dark:text-[#707070] text-xs font-medium rounded-full">
              {t('auth.account_not_linked')}
            </span>
          </div>
        </button>
      )}

      {/* DBバージョン表示 */}
      <div className="mt-4 text-center">
        <span className="text-xs text-gray-400 dark:text-[#707070]">
          {t('settings.web_specific.db_version', { version: SCHEMA_VERSION })}
        </span>
      </div>
    </div>
  );
}
