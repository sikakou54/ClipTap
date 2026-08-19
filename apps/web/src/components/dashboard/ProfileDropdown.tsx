/**
 * 環境切り替えドロップダウン
 *
 * @description
 * 環境（プロファイル）を切り替えるドロップダウンメニュー。
 * 有効なプロファイルがない場合はタイトルのみを表示。
 */
import { useTranslation } from '@cliptap/shared';
import type { Profile } from '@cliptap/shared';
import { ProfileDropdownItem } from '@components/profile/ProfileDropdownItem';

interface ProfileDropdownProps {
  validProfiles: Profile[];
  activeProfile: Profile | null;
  showProfileDropdown: boolean;
  setShowProfileDropdown: (show: boolean) => void;
  handleProfileSelect: (id: string) => Promise<void>;
}

export function ProfileDropdown({
  validProfiles,
  activeProfile,
  showProfileDropdown,
  setShowProfileDropdown,
  handleProfileSelect,
}: ProfileDropdownProps) {
  const { t } = useTranslation();

  /* プロファイルが0件の場合はタイトルのみ表示 */
  if (validProfiles.length === 0) {
    return <h1 className="text-lg font-bold text-gray-900 dark:text-white">{t('settings.web_specific.load_file_title')}</h1>;
  }

  /* 環境切り替えドロップダウン（プロファイル選択） */
  return (
    <div className="relative">
      {/* ドロップダウントリガーボタン（現在の環境名と下矢印アイコン） */}
      <button
        onClick={() => setShowProfileDropdown(!showProfileDropdown)}
        className="px-3 py-1.5 bg-gray-100 dark:bg-[#2A2A2A] hover:bg-gray-200 dark:hover:bg-[#333333] rounded-lg transition-colors flex items-center gap-2"
      >
        {/* 環境アイコン */}
        <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        {/* 現在の環境名 */}
        <span className="text-sm font-medium text-gray-700 dark:text-[#A0A0A0]">
          {activeProfile?.name || t('profile.environment')}
        </span>
        {/* 下矢印アイコン（開閉状態に応じて回転） */}
        <svg
          className={`w-4 h-4 text-gray-600 dark:text-[#A0A0A0] transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {/* ドロップダウンメニュー（背景クリックで閉じる、プロファイル一覧を表示） */}
      {showProfileDropdown && (
        <>
          {/* 背景オーバーレイ（クリックで閉じる） */}
          <div className="fixed inset-0 z-20" onClick={() => setShowProfileDropdown(false)} />
          {/* ドロップダウンメニューコンテナ */}
          <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-[#1A1A1A] rounded-lg shadow-lg border border-gray-200 dark:border-[#2A2A2A] z-30 overflow-hidden">
            {validProfiles.map((profile) => (
              <ProfileDropdownItem
                key={profile.id}
                profileId={profile.id}
                profileName={profile.name}
                isSelected={profile.id === activeProfile?.id}
                isDefault={profile.isDefault}
                onClick={() => handleProfileSelect(profile.id)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

