/**
 * ProfileDropdownItem - プロファイルドロップダウンアイテム
 *
 * @description
 * プロファイル選択ドロップダウンの各アイテムコンポーネント。
 * React.memoで最適化されており、不要な再レンダリングを防止。
 */
import React from 'react';
import { useTranslation } from '@cliptap/shared';

interface ProfileDropdownItemProps {
  profileId: string;
  profileName: string;
  isSelected: boolean;
  isDefault: boolean;
  onClick: () => void;
}

function ProfileDropdownItemComponent({
  profileName,
  isSelected,
  isDefault,
  onClick,
}: ProfileDropdownItemProps) {
  const { t } = useTranslation();

  /* プロファイルドロップダウンアイテム（選択状態に応じてスタイル変更） */
  return (
    <button
      onClick={onClick}
      className={`w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-[#2A2A2A] transition-colors flex items-center gap-2 ${
        isSelected ? 'bg-blue-50 dark:bg-blue-900/30' : ''
      }`}
    >
      {/* チェックマークアイコン（選択時のみ表示） */}
      {isSelected && (
        <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )}
      {/* スペーサー（未選択時、アイコン幅を確保） */}
      {!isSelected && <div className="w-4 h-4" />}
      {/* プロファイル名 */}
      <span className={`text-sm ${isSelected ? 'font-medium text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-[#A0A0A0]'}`}>
        {profileName}
      </span>
      {/* デフォルトバッジ（デフォルトプロファイルの場合のみ表示） */}
      {isDefault && (
        <span className="ml-auto px-2 py-0.5 bg-gray-100 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 text-xs rounded-full">
          {t('profile.default_badge')}
        </span>
      )}
    </button>
  );
}

/* カスタム比較関数でメモ化 */
export const ProfileDropdownItem = React.memo(ProfileDropdownItemComponent, (prevProps, nextProps) => {
  return (
    prevProps.profileId === nextProps.profileId &&
    prevProps.profileName === nextProps.profileName &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isDefault === nextProps.isDefault
  );
});

